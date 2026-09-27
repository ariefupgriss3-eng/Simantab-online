alter table public.school_gtk_needs_workflow
  add column if not exists kabid_approved_at timestamptz,
  add column if not exists kabid_approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists kabid_approval_mode text,
  add column if not exists kabid_approval_note text;

create or replace function private.gtk_needs_ai_kabid_approve_after_verified()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_kabid_id uuid;
  v_kabid_name text;
  v_at timestamptz := clock_timestamp();
  v_last public.gtk_needs_ai_verifications%rowtype;
  v_note text;
begin
  if new.status <> 'VERIFIED' or new.kabid_approved_at is not null then
    return new;
  end if;

  select *
  into v_last
  from public.gtk_needs_ai_verifications v
  where v.school_npsn=new.school_npsn
    and v.engine_mode='AUTO_VERIFY_APPROVE'
    and v.result_status='SESUAI'
    and v.created_at >= coalesce(new.submitted_at,'epoch'::timestamptz)
  order by v.created_at desc
  limit 1;

  if v_last.id is null then
    return new;
  end if;

  select p.id,p.full_name
  into v_kabid_id,v_kabid_name
  from public.profiles p
  where p.role='KABID'
    and p.is_active=true
    and coalesce(p.account_channel,'DINAS')='DINAS'
  order by p.id
  limit 1;

  if v_kabid_id is null then
    update public.school_gtk_needs_workflow
       set kabid_approval_mode='AI_TERTAHAN',
           kabid_approval_note='🤖 AI Persetujuan Kabid tertahan: akun Kabid aktif belum tersedia.',
           updated_at=v_at
     where school_npsn=new.school_npsn
       and kabid_approved_at is null;
    return new;
  end if;

  v_note := '🤖 AI Persetujuan Kabid: DISETUJUI OTOMATIS setelah AI Verifikasi dan AI Approve lulus. '
            ||'Kabid penanggung jawab: '||coalesce(v_kabid_name,v_kabid_id::text)||'.';

  update public.school_gtk_needs_workflow
     set kabid_approved_at=v_at,
         kabid_approved_by=v_kabid_id,
         kabid_approval_mode='AI_AUTO',
         kabid_approval_note=v_note,
         note=trim(concat_ws(' • ',nullif(note,''),v_note)),
         updated_at=v_at
   where school_npsn=new.school_npsn
     and status='VERIFIED'
     and kabid_approved_at is null;

  insert into public.gtk_needs_ai_verifications(
    school_npsn,school_name,school_level,rombel,
    engine_version,engine_mode,result_status,
    checked_rows,match_count,mismatch_count,manual_review_count,
    result,run_by,run_by_name,run_by_role
  )
  select sm.npsn,sm.school_name,coalesce(sm.jenjang,sm.bentuk_pendidikan,'-'),coalesce(sm.rombel,0),
         'ABK_REGULATIF_V3','AI_KABID_APPROVAL','SESUAI',
         v_last.checked_rows,v_last.match_count,0,v_last.manual_review_count,
         jsonb_build_object(
           'sequence',jsonb_build_array('AI_VERIFIKASI','AI_APPROVE','AI_PERSETUJUAN_KABID'),
           'source_verification_id',v_last.id,
           'kabid_approved_at',v_at,
           'kabid_approved_by',v_kabid_id,
           'kabid_name',v_kabid_name,
           'approval_status','DISETUJUI_OTOMATIS'
         ),
         v_kabid_id,v_kabid_name,'KABID_AI_AUTO'
  from public.school_master sm
  where sm.npsn=new.school_npsn;

  if new.submitted_by is not null then
    insert into public.notifications(user_id,title,message,link)
    values(
      new.submitted_by,
      'Kebutuhan GTK Riil Disetujui Kabid',
      'AI Persetujuan Kabid telah menyetujui Kebutuhan GTK Riil secara otomatis setelah AI Verifikasi dan AI Approve lulus.',
      '#needs'
    );
  end if;

  insert into public.notifications(user_id,title,message,link)
  values(
    v_kabid_id,
    'AI Persetujuan Kabid — Kebutuhan GTK Riil',
    'SIMANTAB menyetujui otomatis data Kebutuhan GTK Riil setelah lolos AI Verifikasi dan AI Approve. Jejak persetujuan tercatat atas akun Kabid penanggung jawab.',
    '#needs'
  );

  return new;
end;
$$;

revoke all on function private.gtk_needs_ai_kabid_approve_after_verified() from public, anon, authenticated;

drop trigger if exists trg_gtk_needs_ai_kabid_approve on public.school_gtk_needs_workflow;
create trigger trg_gtk_needs_ai_kabid_approve
after insert or update of status on public.school_gtk_needs_workflow
for each row
when (new.status='VERIFIED')
execute function private.gtk_needs_ai_kabid_approve_after_verified();

create temporary table _gtk_kabid_backfill on commit drop as
with kabid as (
  select p.id,p.full_name
  from public.profiles p
  where p.role='KABID'
    and p.is_active=true
    and coalesce(p.account_channel,'DINAS')='DINAS'
  order by p.id
  limit 1
)
select w.school_npsn,
       k.id as kabid_id,
       k.full_name as kabid_name,
       count(p.*)::int as checked_rows,
       count(*) filter (
         where p.result_status='OK'
           and p.current_abk is not null
           and p.calculated_abk is not null
           and p.current_abk=p.calculated_abk
       )::int as match_count,
       count(*) filter (where p.result_status='LOCAL_MANUAL')::int as manual_count
from public.school_gtk_needs_workflow w
cross join kabid k
cross join lateral public.preview_school_abk_v3(w.school_npsn,current_date) p
where w.status='VERIFIED'
  and w.kabid_approved_at is null
group by w.school_npsn,k.id,k.full_name
having count(*) > 0
   and count(*) filter (
     where p.current_abk is null
        or p.result_status is null
        or p.result_status not in ('OK','LOCAL_MANUAL')
        or (p.result_status='OK' and (p.calculated_abk is null or p.current_abk<>p.calculated_abk))
   ) = 0;

insert into public.gtk_needs_ai_verifications(
  school_npsn,school_name,school_level,rombel,
  engine_version,engine_mode,result_status,
  checked_rows,match_count,mismatch_count,manual_review_count,
  result,run_by,run_by_name,run_by_role
)
select sm.npsn,sm.school_name,coalesce(sm.jenjang,sm.bentuk_pendidikan,'-'),coalesce(sm.rombel,0),
       'ABK_REGULATIF_V3','AI_KABID_APPROVAL_BACKFILL','SESUAI',
       b.checked_rows,b.match_count,0,b.manual_count,
       jsonb_build_object(
         'sequence',jsonb_build_array('VALIDASI_ABK_V3','AI_PERSETUJUAN_KABID'),
         'approval_status','DISETUJUI_OTOMATIS',
         'activation_backfill',true,
         'kabid_approved_by',b.kabid_id,
         'kabid_name',b.kabid_name
       ),
       b.kabid_id,b.kabid_name,'KABID_AI_AUTO'
from _gtk_kabid_backfill b
join public.school_master sm on sm.npsn=b.school_npsn;

update public.school_gtk_needs_workflow w
set kabid_approved_at=clock_timestamp(),
    kabid_approved_by=b.kabid_id,
    kabid_approval_mode='AI_AUTO_BACKFILL',
    kabid_approval_note='🤖 AI Persetujuan Kabid: DISETUJUI OTOMATIS pada aktivasi fitur setelah validasi ulang ABK V3. Kabid penanggung jawab: '||b.kabid_name||'.',
    note=trim(concat_ws(' • ',nullif(w.note,''),'🤖 AI Persetujuan Kabid: DISETUJUI OTOMATIS pada aktivasi fitur setelah validasi ulang ABK V3. Kabid penanggung jawab: '||b.kabid_name||'.')),
    updated_at=clock_timestamp()
from _gtk_kabid_backfill b
where w.school_npsn=b.school_npsn
  and w.status='VERIFIED'
  and w.kabid_approved_at is null;

insert into public.notifications(user_id,title,message,link)
select b.kabid_id,
       'AI Persetujuan Kabid Aktif',
       'AI Persetujuan Kabid Kebutuhan GTK Riil telah diaktifkan. '||count(*)::text||
       ' data VERIFIED yang masih sesuai ABK V3 telah diberi persetujuan AI Kabid dan dicatat dalam audit.',
       '#needs'
from _gtk_kabid_backfill b
group by b.kabid_id;
