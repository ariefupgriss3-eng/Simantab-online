create or replace function private.gtk_needs_ai_verify_approve_after_submit()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_school public.school_master%rowtype;
  v_checked integer := 0;
  v_match integer := 0;
  v_problem integer := 0;
  v_manual integer := 0;
  v_missing integer := 0;
  v_unsupported integer := 0;
  v_rows jsonb := '[]'::jsonb;
  v_result_status text;
  v_verification_id uuid;
  v_verified_at timestamptz;
  v_approved_at timestamptz;
  v_note text;
begin
  if new.status <> 'SUBMITTED' then
    return new;
  end if;

  select * into v_school
  from public.school_master
  where npsn = new.school_npsn
    and is_active = true;

  if v_school.npsn is null then
    update public.school_gtk_needs_workflow
       set status='REVISION',
           note='🤖 AI Verifikasi: data master sekolah tidak ditemukan. AI Approve tidak dijalankan.',
           verified_at=null,
           verified_by=null,
           updated_at=now()
     where school_npsn=new.school_npsn;
    return new;
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where p.result_status='OK'
        and p.current_abk is not null
        and p.calculated_abk is not null
        and p.current_abk=p.calculated_abk
    )::integer,
    count(*) filter (
      where p.current_abk is null
         or p.result_status is null
         or p.result_status not in ('OK','LOCAL_MANUAL')
         or (p.result_status='OK' and (p.calculated_abk is null or p.current_abk<>p.calculated_abk))
    )::integer,
    count(*) filter (where p.result_status='LOCAL_MANUAL')::integer,
    count(*) filter (where p.current_abk is null)::integer,
    count(*) filter (where p.result_status is null or p.result_status not in ('OK','LOCAL_MANUAL'))::integer,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'job_code',p.job_code,
          'position_name',p.position_name,
          'current_abk',p.current_abk,
          'calculated_abk',p.calculated_abk,
          'rombel_input',p.rombel_input,
          'result_status',p.result_status,
          'formula_text',p.formula_text,
          'policy_scope',p.policy_scope,
          'legal_basis',p.legal_basis
        )
        order by p.position_name
      ),
      '[]'::jsonb
    )
  into v_checked,v_match,v_problem,v_manual,v_missing,v_unsupported,v_rows
  from public.preview_school_abk_v3(new.school_npsn,current_date) p;

  v_verified_at := clock_timestamp();
  v_result_status := case
    when v_checked>0 and v_problem=0 then 'SESUAI'
    else 'PERLU_KOREKSI'
  end;

  if v_result_status='SESUAI' then
    v_approved_at := clock_timestamp();
    v_note := '🤖 AI Verifikasi: LULUS — ABK regulatif sesuai. 🤖 AI Approve: DISETUJUI OTOMATIS. '
      || case when v_manual>0
              then v_manual||' baris parameter lokal/manual (mis. Muatan Lokal SMP) diterima sebagai input lokal dan tidak menghambat approve.'
              else 'Tidak ada parameter manual yang menghambat.'
         end;
  else
    v_note := '🤖 AI Verifikasi: PERLU PERBAIKAN — ditemukan '||v_problem||
              ' baris ABK/data wajib yang belum sesuai. 🤖 AI Approve: TIDAK DIJALANKAN.';
  end if;

  insert into public.gtk_needs_ai_verifications(
    school_npsn,school_name,school_level,rombel,
    engine_version,engine_mode,result_status,
    checked_rows,match_count,mismatch_count,manual_review_count,
    result,run_by,run_by_name,run_by_role
  ) values (
    new.school_npsn,
    v_school.school_name,
    coalesce(v_school.jenjang,v_school.bentuk_pendidikan,'-'),
    coalesce(v_school.rombel,0),
    'ABK_REGULATIF_V3',
    'AUTO_VERIFY_APPROVE',
    v_result_status,
    v_checked,
    v_match,
    v_problem,
    v_manual,
    jsonb_build_object(
      'sequence',jsonb_build_array('AI_VERIFIKASI','AI_APPROVE'),
      'verification_at',v_verified_at,
      'approval_at',v_approved_at,
      'approval_status',case when v_result_status='SESUAI' then 'DISETUJUI_OTOMATIS' else 'TIDAK_DIJALANKAN' end,
      'missing_rows',v_missing,
      'unsupported_rows',v_unsupported,
      'local_manual_rows',v_manual,
      'local_manual_policy','Parameter LOCAL_MANUAL diterima hanya jika baris/data ABK tersedia; nilai lokal tidak dihitung ulang oleh mesin nasional.',
      'rows',v_rows
    ),
    null,
    'AI SIMANTAB',
    'AI_VERIFIKATOR_APPROVER'
  )
  returning id into v_verification_id;

  if v_result_status='SESUAI' then
    update public.school_gtk_needs_workflow
       set note='🤖 AI Verifikasi: LULUS • 🤖 AI Approve: DISETUJUI OTOMATIS • Audit '||v_verification_id::text,
           updated_at=v_verified_at
     where school_npsn=new.school_npsn
       and status='SUBMITTED';

    update public.school_gtk_needs_workflow
       set status='VERIFIED',
           note=v_note||' Audit: '||v_verification_id::text,
           verified_at=v_approved_at,
           verified_by=null,
           updated_at=v_approved_at
     where school_npsn=new.school_npsn
       and status='SUBMITTED';

    if new.submitted_by is not null then
      insert into public.notifications(user_id,title,message,link)
      values(
        new.submitted_by,
        'Kebutuhan GTK Riil Disetujui AI',
        'AI Verifikasi menyatakan ABK sesuai dan AI Approve telah menyetujui Kebutuhan GTK Riil sekolah secara otomatis.',
        '#needs'
      );
    end if;
  else
    update public.school_gtk_needs_workflow
       set status='REVISION',
           note=v_note||' Audit: '||v_verification_id::text,
           verified_at=null,
           verified_by=null,
           updated_at=v_verified_at
     where school_npsn=new.school_npsn
       and status='SUBMITTED';

    if new.submitted_by is not null then
      insert into public.notifications(user_id,title,message,link)
      values(
        new.submitted_by,
        'Kebutuhan GTK Riil Perlu Perbaikan',
        'AI Verifikasi menemukan ABK atau data wajib yang belum sesuai. AI Approve tidak dijalankan. Buka Kebutuhan GTK Riil untuk melihat catatan.',
        '#needs'
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.gtk_needs_ai_verify_approve_after_submit() from public, anon, authenticated;

drop trigger if exists trg_gtk_needs_ai_auto_verify_approve on public.school_gtk_needs_workflow;
create trigger trg_gtk_needs_ai_auto_verify_approve
after insert or update of status on public.school_gtk_needs_workflow
for each row
when (new.status='SUBMITTED')
execute function private.gtk_needs_ai_verify_approve_after_submit();
