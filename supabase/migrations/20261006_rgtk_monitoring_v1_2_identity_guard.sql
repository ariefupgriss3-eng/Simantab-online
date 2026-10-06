-- SIMANTAB RGTK Monitoring v1.2
-- Strengthen identity safety for master and subsequent imports.
create or replace function public.rgtk_import_pengawas(
  p_year integer,
  p_source_kind text,
  p_rows jsonb,
  p_source_file_name text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_role text := private."current_role"();
  v_cycle_id uuid;
  v_batch_id uuid;
  v_item jsonb;
  v_person_id uuid;
  v_name text;
  v_nip text;
  v_emp text;
  v_target boolean;
  v_active integer := 0;
  v_nonactive integer := 0;
  v_processed integer := 0;
  v_name_matches integer := 0;
begin
  if v_role not in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN') then
    raise exception 'Akun tidak memiliki kewenangan import RGTK.';
  end if;
  if p_year < 2025 or p_year > 2100 then
    raise exception 'Tahun siklus tidak valid.';
  end if;
  p_source_kind := upper(coalesce(p_source_kind,''));
  if p_source_kind not in ('PERENCANAAN','PEMANTAUAN','REKOMENDASI','MASTER') then
    raise exception 'Jenis sumber tidak valid.';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows)=0 then
    raise exception 'Data import kosong.';
  end if;

  if p_source_kind='MASTER' and exists (
    select 1
    from jsonb_array_elements(p_rows) x
    where nullif(regexp_replace(coalesce(x->>'nip',''),'[^0-9]','','g'),'') is null
  ) then
    raise exception 'Import MASTER wajib memiliki NIP pada setiap baris.';
  end if;

  if exists (
    select 1
    from (
      select regexp_replace(coalesce(x->>'nip',''),'[^0-9]','','g') as nip_norm, count(*) as n
      from jsonb_array_elements(p_rows) x
      group by 1
    ) d
    where d.nip_norm<>'' and d.n>1
  ) then
    raise exception 'Terdapat NIP ganda pada file import.';
  end if;

  insert into public.rgtk_cycles(year,label,actor_type,status,created_by)
  values (p_year,'Januari–Desember '||p_year,'PENGAWAS','ACTIVE',auth.uid())
  on conflict (year,actor_type) do update
    set label=excluded.label,status='ACTIVE',updated_at=now()
  returning id into v_cycle_id;

  insert into public.rgtk_import_batches(
    cycle_id,source_kind,source_file_name,record_count,imported_by,note
  ) values (
    v_cycle_id,p_source_kind,p_source_file_name,jsonb_array_length(p_rows),auth.uid(),
    'Import resmi/administratif; SIMANTAB tidak menghasilkan rating atau predikat.'
  ) returning id into v_batch_id;

  for v_item in select value from jsonb_array_elements(p_rows)
  loop
    v_name := btrim(coalesce(v_item->>'full_name',''));
    v_nip := nullif(regexp_replace(coalesce(v_item->>'nip',''),'[^0-9]','','g'),'');
    if v_name='' then
      continue;
    end if;

    v_person_id := null;
    if v_nip is not null then
      select id into v_person_id
      from public.rgtk_people
      where actor_type='PENGAWAS' and nip=v_nip
      order by created_at limit 1;
    else
      select count(*), min(id) into v_name_matches, v_person_id
      from public.rgtk_people
      where actor_type='PENGAWAS' and lower(btrim(full_name))=lower(v_name);
      if v_name_matches > 1 then
        raise exception 'Nama "%" memiliki lebih dari satu record. Sertakan NIP agar tidak salah orang.', v_name;
      end if;
      if v_name_matches = 0 then
        v_person_id := null;
      end if;
    end if;

    if v_person_id is null then
      v_emp := case when v_item ? 'employment_status'
        then upper(coalesce(nullif(v_item->>'employment_status',''),'AKTIF'))
        else 'AKTIF' end;
      if v_emp not in ('AKTIF','PENSIUN','MUTASI','MENINGGAL','NONAKTIF_LAIN') then v_emp:='AKTIF'; end if;
      v_target := case when v_item ? 'is_cycle_target'
        then coalesce((v_item->>'is_cycle_target')::boolean, v_emp='AKTIF')
        else v_emp='AKTIF' end;
      insert into public.rgtk_people(profile_id,nip,full_name,actor_type,scope_level,employment_status,is_cycle_target,source_note)
      values (null,v_nip,v_name,'PENGAWAS',nullif(v_item->>'scope_level',''),v_emp,v_target,'Import '||p_source_kind)
      returning id into v_person_id;
    else
      update public.rgtk_people p set
        full_name=v_name,
        nip=coalesce(v_nip,p.nip),
        scope_level=case when v_item ? 'scope_level' then nullif(v_item->>'scope_level','') else p.scope_level end,
        employment_status=case
          when v_item ? 'employment_status'
            and upper(v_item->>'employment_status') in ('AKTIF','PENSIUN','MUTASI','MENINGGAL','NONAKTIF_LAIN')
          then upper(v_item->>'employment_status') else p.employment_status end,
        is_cycle_target=case
          when v_item ? 'is_cycle_target' then coalesce((v_item->>'is_cycle_target')::boolean,p.is_cycle_target)
          else p.is_cycle_target end,
        source_note='Import '||p_source_kind,
        updated_at=now()
      where p.id=v_person_id;
    end if;

    insert into public.rgtk_progress(
      cycle_id,person_id,planning_status,practice_stage,behavior_status,competency_status,duty_status,
      practice_rating,behavior_rating,performance_predicate,recommendation_status,sending_status,
      source_updated_at,import_batch_id,updated_by
    ) values (
      v_cycle_id,v_person_id,
      coalesce(nullif(v_item->>'planning_status',''),'BELUM_SELESAI'),
      coalesce(nullif(v_item->>'practice_stage',''),'BELUM_MULAI'),
      coalesce(nullif(v_item->>'behavior_status',''),'BELUM_SELESAI'),
      coalesce(nullif(v_item->>'competency_status',''),'BELUM_SELESAI'),
      coalesce(nullif(v_item->>'duty_status',''),'BELUM_DIVERIFIKASI'),
      nullif(v_item->>'practice_rating',''),nullif(v_item->>'behavior_rating',''),nullif(v_item->>'performance_predicate',''),
      coalesce(nullif(v_item->>'recommendation_status',''),'BELUM_DINILAI'),
      coalesce(nullif(v_item->>'sending_status',''),'BELUM_DIKIRIM'),
      now(),v_batch_id,auth.uid()
    )
    on conflict (cycle_id,person_id) do update set
      planning_status=case when v_item ? 'planning_status' then excluded.planning_status else rgtk_progress.planning_status end,
      practice_stage=case when v_item ? 'practice_stage' then excluded.practice_stage else rgtk_progress.practice_stage end,
      behavior_status=case when v_item ? 'behavior_status' then excluded.behavior_status else rgtk_progress.behavior_status end,
      competency_status=case when v_item ? 'competency_status' then excluded.competency_status else rgtk_progress.competency_status end,
      duty_status=case when v_item ? 'duty_status' then excluded.duty_status else rgtk_progress.duty_status end,
      practice_rating=case when v_item ? 'practice_rating' then excluded.practice_rating else rgtk_progress.practice_rating end,
      behavior_rating=case when v_item ? 'behavior_rating' then excluded.behavior_rating else rgtk_progress.behavior_rating end,
      performance_predicate=case when v_item ? 'performance_predicate' then excluded.performance_predicate else rgtk_progress.performance_predicate end,
      recommendation_status=case when v_item ? 'recommendation_status' then excluded.recommendation_status else rgtk_progress.recommendation_status end,
      sending_status=case when v_item ? 'sending_status' then excluded.sending_status else rgtk_progress.sending_status end,
      source_updated_at=now(),import_batch_id=v_batch_id,updated_by=auth.uid(),updated_at=now();

    insert into public.rgtk_source_records(
      import_batch_id,cycle_id,person_id,source_kind,source_key,raw_name,raw_nip,raw_status,raw_payload
    ) values (
      v_batch_id,v_cycle_id,v_person_id,p_source_kind,coalesce(v_nip,v_name),v_name,v_nip,
      jsonb_build_object(
        'planning_status',v_item->>'planning_status',
        'practice_stage',v_item->>'practice_stage',
        'behavior_status',v_item->>'behavior_status',
        'competency_status',v_item->>'competency_status',
        'duty_status',v_item->>'duty_status',
        'recommendation_status',v_item->>'recommendation_status',
        'sending_status',v_item->>'sending_status'
      ),
      v_item
    );

    select employment_status,is_cycle_target into v_emp,v_target
    from public.rgtk_people where id=v_person_id;
    if v_emp='AKTIF' and v_target then v_active:=v_active+1; else v_nonactive:=v_nonactive+1; end if;
    v_processed:=v_processed+1;
  end loop;

  update public.rgtk_import_batches
  set record_count=v_processed,active_count=v_active,nonactive_count=v_nonactive
  where id=v_batch_id;

  return jsonb_build_object(
    'ok',true,'cycle_id',v_cycle_id,'batch_id',v_batch_id,
    'processed',v_processed,'active',v_active,'nonactive',v_nonactive,
    'source_kind',p_source_kind
  );
end;
$$;

revoke all on function public.rgtk_import_pengawas(integer,text,jsonb,text) from public;
grant execute on function public.rgtk_import_pengawas(integer,text,jsonb,text) to authenticated;

comment on function public.rgtk_import_pengawas(integer,text,jsonb,text) is
'Imports canonical monitoring data only. MASTER requires NIP for identity safety; duplicate-name updates without NIP are rejected. Does not infer or generate performance ratings/predicates.';
