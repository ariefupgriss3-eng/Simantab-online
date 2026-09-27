-- Workload-aware automatic assignment for Diklat KS/BCKS. The assigned_by
-- field identifies the responsible Kasi/Subkoor; the event identifies AI as
-- the actor so that the assignment is never mistaken for a manual click.
create or replace function private.ks_bcks_ai_assign_after_submission()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_coordinator uuid;
  v_coordinator_name text;
  v_staff uuid;
  v_staff_name text;
  v_note text;
begin
  if new.service_type <> 'DIKLAT_KS_BCKS'
     or new.status <> 'SUBMITTED'
     or new.workflow_state <> 'MENUNGGU_DISPOSISI_KOORDINATOR'
     or new.assigned_user_id is not null
     or exists (select 1 from public.submission_assignees a where a.submission_id=new.id) then
    return new;
  end if;

  select p.id,p.full_name into v_coordinator,v_coordinator_name
  from public.profiles p
  where p.role=new.coordinator_role
    and p.account_channel='DINAS'
    and p.is_active=true
  order by p.id
  limit 1;

  if v_coordinator is null then
    insert into public.submission_events(submission_id,status,note,actor_id)
    values(new.id,'AI_BAGI_TUGAS_TERTAHAN',
           'Koordinator Kasi/Subkoor aktif untuk jenjang '||coalesce(new.scope_level,'-')||' belum tersedia.',null);
    return new;
  end if;

  select p.id,p.full_name into v_staff,v_staff_name
  from public.profiles p
  where p.is_active=true and p.account_channel='DINAS'
    and (p.role like 'STAFF_%' or p.role like 'ADMIN_%')
  order by (
    select count(*) from public.submission_assignees a
    join public.submissions s on s.id=a.submission_id
    where a.user_id=p.id and s.service_type='DIKLAT_KS_BCKS'
      and s.workflow_state<>'DRAFT'
  ),p.id
  limit 1;

  if v_staff is null then
    insert into public.submission_events(submission_id,status,note,actor_id)
    values(new.id,'AI_BAGI_TUGAS_TERTAHAN','Admin/staf internal Dinas aktif belum tersedia.',null);
    return new;
  end if;

  v_note:='AI Bagi Tugas otomatis. Koordinator penanggung jawab: '||
          coalesce(v_coordinator_name,v_coordinator::text)||' ('||new.coordinator_role||'). '||
          'Admin/staf penerima: '||coalesce(v_staff_name,v_staff::text)||'.';

  insert into public.submission_assignees(
    submission_id,user_id,assigned_by,assigned_at,assignment_note
  ) values(new.id,v_staff,v_coordinator,now(),v_note);

  update public.submissions
  set assigned_user_id=v_staff,assigned_by=v_coordinator,assigned_at=now(),
      assignment_note=v_note,workflow_state='VERIFIKASI_STAF',
      status='VERIFYING',updated_at=now()
  where id=new.id and workflow_state='MENUNGGU_DISPOSISI_KOORDINATOR';

  insert into public.submission_events(submission_id,status,note,actor_id)
  values(new.id,'AI_BAGI_TUGAS',v_note,null);

  insert into public.notifications(user_id,title,message,link)
  values(v_staff,'Tugas verifikasi Diklat KS/BCKS',
         'AI membagikan tugas atas tanggung jawab '||coalesce(v_coordinator_name,new.coordinator_role)||
         ': '||coalesce(new.title,'Diklat KS/BCKS')||'.','#diklatKsBcks');

  return new;
end;
$$;

revoke all on function private.ks_bcks_ai_assign_after_submission() from public,anon,authenticated;

drop trigger if exists trg_ks_bcks_ai_assign_after_submission on public.submissions;
create trigger trg_ks_bcks_ai_assign_after_submission
after insert or update of workflow_state on public.submissions
for each row
when (new.service_type='DIKLAT_KS_BCKS'
      and new.status='SUBMITTED'
      and new.workflow_state='MENUNGGU_DISPOSISI_KOORDINATOR')
execute function private.ks_bcks_ai_assign_after_submission();

-- A school whose GTK needs returned to Draft is not eligible for assignment.
create temporary table ks_bcks_ineligible_pending on commit drop as
select s.id,s.user_id
from public.submissions s
join public.profiles p on p.id=s.user_id
left join public.school_gtk_needs_workflow w on w.school_npsn=p.school_npsn
where s.service_type='DIKLAT_KS_BCKS'
  and s.workflow_state='MENUNGGU_DISPOSISI_KOORDINATOR'
  and coalesce(w.status,'') not in ('SUBMITTED','VERIFIED');

insert into public.submission_events(submission_id,status,note,actor_id)
select id,'DIKLAT_KS_RESET_GTK_NEEDS',
       'Kembali ke Draft sebelum AI Bagi Tugas: Kebutuhan GTK Riil sekolah belum diajukan.',null
from ks_bcks_ineligible_pending;

update public.submissions s
set status='DRAFT',workflow_state='DRAFT',updated_at=now()
from ks_bcks_ineligible_pending r where s.id=r.id;

update public.ks_bcks_submission_details d
set workflow_stage='ADMINISTRASI',admin_status='DRAFT',
    admin_note='Ajukan Kebutuhan GTK Riil sekolah ke Dinas sebelum Seleksi Administrasi naik level.',
    updated_at=now()
from ks_bcks_ineligible_pending r where d.submission_id=r.id;

insert into public.notifications(user_id,title,message,link)
select user_id,'Usulan Diklat KS/BCKS Kembali ke Draft',
       'Kebutuhan GTK Riil sekolah harus selesai diajukan ke Dinas. Setelah itu, ajukan kembali Seleksi Administrasi.',
       '#diklatKsBcks'
from ks_bcks_ineligible_pending;

-- Route only eligible submissions already waiting for a coordinator.
update public.submissions s
set workflow_state=workflow_state
where s.service_type='DIKLAT_KS_BCKS'
  and s.workflow_state='MENUNGGU_DISPOSISI_KOORDINATOR'
  and s.status='SUBMITTED';
