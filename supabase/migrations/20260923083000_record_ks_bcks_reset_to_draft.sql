-- Capture the production KS/BCKS reset workflow in version-controlled migration history.
-- Authorization is enforced inside the SECURITY DEFINER function by auth.uid(), role,
-- education scope, and assigned-verifier checks.

CREATE OR REPLACE FUNCTION public.ks_bcks_reset_to_draft(p_submission_id uuid, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'auth', 'pg_temp'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_role text := private.current_role();
  v_sub public.submissions%rowtype;
  v_detail public.ks_bcks_submission_details%rowtype;
  v_reason text := nullif(trim(coalesce(p_note,'')),'');
  v_allowed boolean := false;
  v_assigned boolean := false;
  v_actor text;
  v_assignees text;
begin
  if v_uid is null then raise exception 'Silakan login kembali.'; end if;
  if v_reason is null then raise exception 'Alasan menurunkan ke Draft wajib diisi.'; end if;

  select * into v_sub
  from public.submissions
  where id=p_submission_id
  for update;

  if v_sub.id is null or v_sub.service_type <> 'DIKLAT_KS_BCKS' then
    raise exception 'Usulan Diklat KS/BCKS tidak ditemukan.';
  end if;

  select * into v_detail
  from public.ks_bcks_submission_details
  where submission_id=p_submission_id
  for update;

  if v_detail.submission_id is null then
    raise exception 'Detail Seleksi Administrasi tidak ditemukan.';
  end if;

  select coalesce(full_name,v_uid::text) into v_actor
  from public.profiles where id=v_uid;

  select exists(
    select 1 from public.submission_assignees a
    where a.submission_id=p_submission_id and a.user_id=v_uid
  ) into v_assigned;

  v_allowed :=
    v_role in ('SUPER_ADMIN','KABID')
    or (v_role='KASI_SD' and v_sub.scope_level='SD')
    or (v_role='KASI_SMP' and v_sub.scope_level='SMP')
    or (v_role='SUBKOOR_TK' and v_sub.scope_level in ('TK_PAUD_PNF','TK','PAUD','PNF'))
    or ((v_role like 'STAFF_%' or v_role like 'ADMIN_%') and (v_assigned or v_sub.assigned_user_id=v_uid));

  if not v_allowed then
    raise exception 'Akun ini tidak berwenang menurunkan peserta tersebut ke Draft.';
  end if;

  if v_sub.workflow_state='DRAFT' and v_detail.admin_status='DRAFT' and v_detail.workflow_stage='ADMINISTRASI' then
    raise exception 'Peserta sudah berada pada status Draft.';
  end if;

  select string_agg(coalesce(p.full_name,a.user_id::text),', ' order by coalesce(p.full_name,a.user_id::text))
  into v_assignees
  from public.submission_assignees a
  left join public.profiles p on p.id=a.user_id
  where a.submission_id=p_submission_id;

  insert into public.submission_events(submission_id,status,note,actor_id)
  values(
    p_submission_id,
    'DIKLAT_KS_RESET_TO_DRAFT',
    'Status diturunkan ke DRAFT oleh '||coalesce(v_actor,'-')||' ('||coalesce(v_role,'-')||'). '||
    'Status sebelumnya: workflow='||coalesce(v_sub.workflow_state,'-')||
    ', layanan='||coalesce(v_sub.status,'-')||
    ', level='||coalesce(v_detail.workflow_stage,'-')||
    ', administrasi='||coalesce(v_detail.admin_status,'-')||
    ', substansi='||coalesce(v_detail.substansi_status,'-')||
    ', diklat='||coalesce(v_detail.diklat_status,'-')||
    ', sertifikat='||coalesce(v_detail.sertifikat_status,'-')||
    case when nullif(v_assignees,'') is not null then '. Verifikator sebelumnya: '||v_assignees else '' end||
    '. Alasan: '||v_reason,
    v_uid
  );

  delete from public.submission_assignees
  where submission_id=p_submission_id;

  update public.submissions
  set status='DRAFT',
      workflow_state='DRAFT',
      assigned_user_id=null,
      assigned_by=null,
      assigned_at=null,
      assignment_note=null,
      staff_verified_by=null,
      staff_verified_at=null,
      staff_verification_note=null,
      coordinator_approved_by=null,
      coordinator_approved_at=null,
      coordinator_approval_note=null,
      kabid_approved_by=null,
      kabid_approved_at=null,
      kabid_approval_note=null,
      workflow_completed_at=null,
      staff_response=null,
      staff_response_by=null,
      staff_response_at=null,
      updated_at=now()
  where id=p_submission_id;

  update public.ks_bcks_submission_details
  set workflow_stage='ADMINISTRASI',
      admin_status='DRAFT',
      admin_note='Diturunkan ke Draft oleh '||coalesce(v_actor,'petugas')||': '||v_reason,
      admin_reviewed_by=null,
      admin_reviewed_at=null,
      substansi_status='BELUM',
      substansi_note=null,
      substansi_reviewed_by=null,
      substansi_reviewed_at=null,
      diklat_status='BELUM',
      diklat_note=null,
      diklat_reviewed_by=null,
      diklat_reviewed_at=null,
      sertifikat_status='BELUM',
      sertifikat_penerbit=null,
      sertifikat_nomor=null,
      sertifikat_tanggal=null,
      sertifikat_note=null,
      sertifikat_submitted_by=null,
      sertifikat_submitted_at=null,
      sertifikat_approved_by=null,
      sertifikat_approved_at=null,
      sertifikat_issued_by=null,
      sertifikat_issued_at=null,
      updated_at=now()
  where submission_id=p_submission_id;

  insert into public.notifications(user_id,title,message,link)
  values(
    v_sub.user_id,
    'Seleksi Administrasi Dikembalikan ke Draft',
    'Seleksi Administrasi Anda dibuka kembali oleh '||coalesce(v_actor,'petugas Dinas')||
    '. Silakan perbarui biodata dan/atau berkas unggahan, lalu ajukan kembali. Catatan: '||v_reason,
    '#diklatKsBcks'
  );
end;
$function$;

revoke all on function public.ks_bcks_reset_to_draft(uuid, text) from public;
revoke all on function public.ks_bcks_reset_to_draft(uuid, text) from anon;
grant execute on function public.ks_bcks_reset_to_draft(uuid, text) to authenticated;
grant execute on function public.ks_bcks_reset_to_draft(uuid, text) to service_role;
