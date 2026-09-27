-- A KS/BCKS participant may advance only after their school's GTK needs
-- have been submitted to Dinas. Verification by Dinas is not required here.
create or replace function private.ks_bcks_require_submitted_gtk_needs()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if new.service_type = 'DIKLAT_KS_BCKS'
     and (new.status is distinct from 'DRAFT'
          or new.workflow_state is distinct from 'DRAFT')
     and not exists (
       select 1
       from public.profiles p
       join public.school_gtk_needs_workflow w
         on w.school_npsn = p.school_npsn
       where p.id = new.user_id
         and w.status in ('SUBMITTED', 'VERIFIED')
     ) then
    raise exception 'Kebutuhan GTK Riil sekolah harus selesai diisi dan diajukan ke Dinas sebelum usulan Diklat KS/BCKS naik level.';
  end if;
  return new;
end;
$$;

revoke all on function private.ks_bcks_require_submitted_gtk_needs() from public, anon, authenticated;

drop trigger if exists trg_ks_bcks_require_submitted_gtk_needs on public.submissions;
create trigger trg_ks_bcks_require_submitted_gtk_needs
before insert or update on public.submissions
for each row
execute function private.ks_bcks_require_submitted_gtk_needs();

-- The current advanced participants are only waiting for substansi; preserve
-- their former state in an event before reopening administrative selection.
create temporary table ks_bcks_gtk_needs_reset on commit drop as
select s.id, s.user_id, s.workflow_state, s.status,
       d.workflow_stage, d.admin_status,
       coalesce(w.status, 'BELUM_DIISI') as needs_status
from public.submissions s
join public.ks_bcks_submission_details d on d.submission_id = s.id
left join public.profiles p on p.id = s.user_id
left join public.school_gtk_needs_workflow w on w.school_npsn = p.school_npsn
where s.service_type = 'DIKLAT_KS_BCKS'
  and (s.status is distinct from 'DRAFT'
       or s.workflow_state is distinct from 'DRAFT'
       or d.workflow_stage is distinct from 'ADMINISTRASI'
       or d.admin_status is distinct from 'DRAFT')
  and coalesce(w.status, '') not in ('SUBMITTED', 'VERIFIED');

insert into public.submission_events(submission_id, status, note, actor_id)
select id, 'DIKLAT_KS_RESET_GTK_NEEDS',
       'Otomatis kembali ke Draft: Kebutuhan GTK Riil sekolah belum selesai diajukan ke Dinas ('||needs_status||'). '||
       'Status sebelumnya: layanan='||coalesce(status,'-')||
       ', alur='||coalesce(workflow_state,'-')||
       ', level='||coalesce(workflow_stage,'-')||
       ', administrasi='||coalesce(admin_status,'-')||'.', null
from ks_bcks_gtk_needs_reset;

delete from public.submission_assignees a
using ks_bcks_gtk_needs_reset r where a.submission_id = r.id;

update public.submissions s
set status='DRAFT', workflow_state='DRAFT',
    assigned_user_id=null, assigned_by=null, assigned_at=null, assignment_note=null,
    staff_verified_by=null, staff_verified_at=null, staff_verification_note=null,
    coordinator_approved_by=null, coordinator_approved_at=null, coordinator_approval_note=null,
    kabid_approved_by=null, kabid_approved_at=null, kabid_approval_note=null,
    workflow_completed_at=null, staff_response=null, staff_response_by=null,
    staff_response_at=null, updated_at=now()
from ks_bcks_gtk_needs_reset r where s.id=r.id;

update public.ks_bcks_submission_details d
set workflow_stage='ADMINISTRASI', admin_status='DRAFT',
    admin_note='Kebutuhan GTK Riil sekolah belum selesai diisi dan diajukan ke Dinas. Lengkapi lalu ajukan kembali.',
    admin_reviewed_by=null, admin_reviewed_at=null,
    substansi_status='BELUM', substansi_note=null, substansi_reviewed_by=null, substansi_reviewed_at=null,
    diklat_status='BELUM', diklat_note=null, diklat_reviewed_by=null, diklat_reviewed_at=null,
    sertifikat_status='BELUM', sertifikat_penerbit=null, sertifikat_nomor=null,
    sertifikat_tanggal=null, sertifikat_note=null, sertifikat_submitted_by=null,
    sertifikat_submitted_at=null, sertifikat_approved_by=null, sertifikat_approved_at=null,
    sertifikat_issued_by=null, sertifikat_issued_at=null, updated_at=now()
from ks_bcks_gtk_needs_reset r where d.submission_id=r.id;

insert into public.notifications(user_id,title,message,link)
select user_id, 'Usulan Diklat KS/BCKS Kembali ke Draft',
       'Lengkapi Kebutuhan GTK Riil sekolah dan ajukan ke Dinas terlebih dahulu. Setelah itu, ajukan kembali Seleksi Administrasi Diklat KS/BCKS.',
       '#diklatKsBcks'
from ks_bcks_gtk_needs_reset;
