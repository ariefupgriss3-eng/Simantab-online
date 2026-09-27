create or replace function private.ks_bcks_ai_kabid_approve_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_sub public.submissions%rowtype;
  v_kabid_id uuid;
  v_kabid_name text;
  v_full_name text;
  v_note text;
  v_audit_note text;
  v_has_ai_event boolean := false;
  v_has_ai_assignment boolean := false;
  v_has_ai_note boolean := false;
begin
  select * into v_sub
  from public.submissions
  where id=p_submission_id
  for update;

  if v_sub.id is null
     or v_sub.service_type <> 'DIKLAT_KS_BCKS'
     or v_sub.workflow_state <> 'MENUNGGU_PERSETUJUAN_KABID'
     or v_sub.kabid_approved_at is not null then
    return;
  end if;

  select exists(
           select 1 from public.submission_events e
           where e.submission_id=v_sub.id and e.status='AI_VERIFIKATOR_KE_KABID'
         ),
         exists(
           select 1 from public.submission_assignees a
           where a.submission_id=v_sub.id and a.verification_result='AI_APPROVED'
         ),
         coalesce(v_sub.staff_verification_note,'') like 'AI Verifikator:%'
    into v_has_ai_event,v_has_ai_assignment,v_has_ai_note;

  if not v_has_ai_assignment or not (v_has_ai_event or v_has_ai_note) then
    return;
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
    if not exists (
      select 1 from public.submission_events e
      where e.submission_id=v_sub.id and e.status='AI_PERSETUJUAN_KABID_TERTAHAN'
    ) then
      insert into public.submission_events(submission_id,status,note,actor_id)
      values(v_sub.id,'AI_PERSETUJUAN_KABID_TERTAHAN',
             'AI Persetujuan Kabid tertahan karena akun Kabid aktif belum tersedia.',null);
    end if;
    return;
  end if;

  select d.full_name into v_full_name
  from public.ks_bcks_submission_details d
  where d.submission_id=v_sub.id;

  v_note := 'Selamat naik level Bpk/Ibu KS '||
            coalesce(nullif(trim(v_full_name),''),'Peserta')||
            ', Calon Peserta Diklat KS 2026. Sukses👍🤲💪🙏';

  v_audit_note := '🤖 AI Persetujuan Kabid otomatis setelah AI Verifikator lulus. '||
                  'Kabid penanggung jawab: '||coalesce(v_kabid_name,v_kabid_id::text)||
                  '. Persetujuan administrasi diproses otomatis dan tetap dapat diturunkan ke Draft oleh pejabat berwenang bila ditemukan ketidaksesuaian.';

  update public.submissions
     set kabid_approved_by=v_kabid_id,
         kabid_approved_at=clock_timestamp(),
         kabid_approval_note=v_note,
         workflow_state='SELESAI',
         workflow_completed_at=clock_timestamp(),
         status='ADMIN_APPROVED',
         updated_at=clock_timestamp()
   where id=v_sub.id
     and workflow_state='MENUNGGU_PERSETUJUAN_KABID'
     and kabid_approved_at is null;

  if not found then return; end if;

  update public.ks_bcks_submission_details
     set admin_status='DISETUJUI',
         admin_note=v_note,
         workflow_stage='SUBSTANSI',
         substansi_status='MENUNGGU',
         updated_at=clock_timestamp()
   where submission_id=v_sub.id;

  if not exists (
    select 1 from public.submission_events e
    where e.submission_id=v_sub.id and e.status='AI_PERSETUJUAN_KABID'
  ) then
    insert into public.submission_events(submission_id,status,note,actor_id)
    values(v_sub.id,'AI_PERSETUJUAN_KABID',v_audit_note,v_kabid_id);
  end if;

  insert into public.notifications(user_id,title,message,link)
  values(v_sub.user_id,'Administrasi Diklat KS/BCKS Disetujui',v_note,'#diklatKsBcks');

  insert into public.notifications(user_id,title,message,link)
  values(v_kabid_id,'AI Persetujuan Kabid — Diklat KS/BCKS',
         coalesce(v_full_name,'Peserta')||
         ' disetujui otomatis setelah lolos AI Verifikator. Audit persetujuan tersimpan.',
         '#diklatKsBcks');
end;
$$;

revoke all on function private.ks_bcks_ai_kabid_approve_submission(uuid) from public, anon, authenticated;

create or replace function private.ks_bcks_ai_kabid_approve_after_ai_verify()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
begin
  perform private.ks_bcks_ai_kabid_approve_submission(new.id);
  return new;
end;
$$;

revoke all on function private.ks_bcks_ai_kabid_approve_after_ai_verify() from public, anon, authenticated;

create or replace function private.ks_bcks_ai_kabid_approve_after_verifier_event()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
begin
  perform private.ks_bcks_ai_kabid_approve_submission(new.submission_id);
  return new;
end;
$$;

revoke all on function private.ks_bcks_ai_kabid_approve_after_verifier_event() from public, anon, authenticated;

drop trigger if exists trg_ks_bcks_ai_kabid_after_verifier_event on public.submission_events;
create trigger trg_ks_bcks_ai_kabid_after_verifier_event
after insert on public.submission_events
for each row
when (new.status='AI_VERIFIKATOR_KE_KABID')
execute function private.ks_bcks_ai_kabid_approve_after_verifier_event();

update public.submissions s
set service_type='DIKLAT_KS_BCKS_TMS_ARCHIVE',
    updated_at=clock_timestamp()
where s.service_type='DIKLAT_KS_BCKS'
  and exists (
    select 1 from public.ks_bcks_submission_details d
    where d.submission_id=s.id and d.is_archived=true
  );

select private.ks_bcks_ai_kabid_approve_submission('841a9f75-c7c2-4545-9eae-2bc284127dd3'::uuid);
