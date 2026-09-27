create or replace function private.ks_bcks_ai_kabid_approve_after_ai_verify()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_kabid_id uuid;
  v_kabid_name text;
  v_full_name text;
  v_note text;
  v_audit_note text;
  v_has_ai_event boolean := false;
  v_has_ai_assignment boolean := false;
begin
  if new.service_type <> 'DIKLAT_KS_BCKS'
     or new.workflow_state <> 'MENUNGGU_PERSETUJUAN_KABID'
     or new.kabid_approved_at is not null then
    return new;
  end if;

  select exists(
           select 1
           from public.submission_events e
           where e.submission_id=new.id
             and e.status='AI_VERIFIKATOR_KE_KABID'
         ),
         exists(
           select 1
           from public.submission_assignees a
           where a.submission_id=new.id
             and a.verification_result='AI_APPROVED'
         )
    into v_has_ai_event,v_has_ai_assignment;

  if not v_has_ai_event or not v_has_ai_assignment then
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
    insert into public.submission_events(submission_id,status,note,actor_id)
    values(new.id,'AI_PERSETUJUAN_KABID_TERTAHAN',
           'AI Persetujuan Kabid tertahan karena akun Kabid aktif belum tersedia.',null);
    return new;
  end if;

  select d.full_name
    into v_full_name
  from public.ks_bcks_submission_details d
  where d.submission_id=new.id;

  v_note := 'Selamat naik level Bpk/Ibu KS '||
            coalesce(nullif(trim(v_full_name),''),'Peserta')||
            ', Calon Peserta Diklat KS 2026. Sukses👍🤲💪🙏';

  v_audit_note := '🤖 AI Persetujuan Kabid otomatis setelah AI Verifikator lulus. '||
                  'Kabid penanggung jawab: '||coalesce(v_kabid_name,v_kabid_id::text)||
                  '. Persetujuan ini merupakan persetujuan administrasi; Kabid/Super Admin tetap dapat menurunkan ke Draft bila ditemukan ketidaksesuaian.';

  update public.submissions
     set kabid_approved_by=v_kabid_id,
         kabid_approved_at=clock_timestamp(),
         kabid_approval_note=v_note,
         workflow_state='SELESAI',
         workflow_completed_at=clock_timestamp(),
         status='ADMIN_APPROVED',
         updated_at=clock_timestamp()
   where id=new.id
     and workflow_state='MENUNGGU_PERSETUJUAN_KABID'
     and kabid_approved_at is null;

  if not found then
    return new;
  end if;

  update public.ks_bcks_submission_details
     set admin_status='DISETUJUI',
         admin_note=v_note,
         workflow_stage='SUBSTANSI',
         substansi_status='MENUNGGU',
         updated_at=clock_timestamp()
   where submission_id=new.id;

  insert into public.submission_events(submission_id,status,note,actor_id)
  values(new.id,'AI_PERSETUJUAN_KABID',v_audit_note,v_kabid_id);

  insert into public.notifications(user_id,title,message,link)
  values(
    new.user_id,
    'Administrasi Diklat KS/BCKS Disetujui',
    v_note,
    '#diklatKsBcks'
  );

  insert into public.notifications(user_id,title,message,link)
  values(
    v_kabid_id,
    'AI Persetujuan Kabid — Diklat KS/BCKS',
    coalesce(v_full_name,'Peserta')||
      ' disetujui otomatis setelah lolos AI Verifikator. Audit persetujuan tersimpan dan dapat diturunkan ke Draft bila diperlukan.',
    '#diklatKsBcks'
  );

  return new;
end;
$$;

revoke all on function private.ks_bcks_ai_kabid_approve_after_ai_verify() from public, anon, authenticated;

drop trigger if exists trg_ks_bcks_ai_kabid_approve on public.submissions;
create trigger trg_ks_bcks_ai_kabid_approve
after insert or update of workflow_state on public.submissions
for each row
when (
  new.service_type='DIKLAT_KS_BCKS'
  and new.workflow_state='MENUNGGU_PERSETUJUAN_KABID'
)
execute function private.ks_bcks_ai_kabid_approve_after_ai_verify();

update public.submissions s
set workflow_state='MENUNGGU_PERSETUJUAN_KABID',
    updated_at=clock_timestamp()
where s.service_type='DIKLAT_KS_BCKS'
  and s.workflow_state='MENUNGGU_PERSETUJUAN_KABID'
  and s.kabid_approved_at is null
  and exists (
    select 1
    from public.submission_events e
    where e.submission_id=s.id
      and e.status='AI_VERIFIKATOR_KE_KABID'
  )
  and exists (
    select 1
    from public.submission_assignees a
    where a.submission_id=s.id
      and a.verification_result='AI_APPROVED'
  );
