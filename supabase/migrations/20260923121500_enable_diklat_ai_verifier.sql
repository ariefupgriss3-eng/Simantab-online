-- AI-assisted administrative verifier for Diklat KS/BCKS.
-- It validates seven required file records, then advances the submission directly
-- to Kabid approval while preserving the assigned admin/staff as accountable verifier.

create or replace function private.ks_bcks_ai_verify_after_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_required constant text[] := array[
    'SKP_1','SKP_2','SK_PENGALAMAN_MANAJERIAL','SK_HUDIS','SKCK',
    'PAKTA_INTEGRITAS','SURAT_PERNYATAAN_DIKLAT'
  ];
  v_valid_count integer := 0;
  v_primary_verifier uuid;
  v_verifier_names text;
  v_note text;
begin
  if new.service_type <> 'DIKLAT_KS_BCKS'
     or new.workflow_state <> 'VERIFIKASI_STAF' then
    return new;
  end if;

  select count(distinct f.requirement_code)
    into v_valid_count
  from public.submission_files f
  where f.submission_id = new.id
    and f.requirement_code = any(v_required)
    and f.file_size between 1 and 512000
    and f.mime_type in ('application/pdf','image/jpeg','image/png')
    and nullif(trim(f.file_name),'') is not null
    and nullif(trim(f.storage_path),'') is not null;

  if v_valid_count <> cardinality(v_required) then
    insert into public.submission_events(submission_id,status,note,actor_id)
    values(
      new.id,
      'AI_VERIFIKATOR_TERTAHAN',
      'AI Verifikator belum meneruskan ke Kabid: berkas valid '||v_valid_count||'/7. Verifikasi manual admin/staf tetap tersedia.',
      new.assigned_user_id
    );
    return new;
  end if;

  select
    coalesce(new.assigned_user_id,(array_agg(a.user_id order by a.user_id))[1]),
    string_agg(coalesce(p.full_name,a.user_id::text),', ' order by coalesce(p.full_name,a.user_id::text))
  into v_primary_verifier,v_verifier_names
  from public.submission_assignees a
  left join public.profiles p on p.id=a.user_id
  where a.submission_id=new.id;

  if v_primary_verifier is null then
    insert into public.submission_events(submission_id,status,note,actor_id)
    values(new.id,'AI_VERIFIKATOR_TERTAHAN','AI Verifikator tertahan karena admin/staf penanggung jawab belum ditetapkan.',null);
    return new;
  end if;

  v_note := 'AI Verifikator: 7/7 jenis berkas wajib terdeteksi, ukuran dan format file sesuai. '||
            'Verifikator penanggung jawab: '||coalesce(v_verifier_names,v_primary_verifier::text)||
            '. Validasi substansi/keaslian dokumen tetap menjadi kewenangan Kabid.';

  update public.submission_assignees
     set verified_at=now(),
         verification_result='AI_APPROVED'
   where submission_id=new.id;

  update public.submissions
     set staff_verified_by=v_primary_verifier,
         staff_verified_at=now(),
         staff_verification_note=v_note,
         coordinator_approved_by=null,
         coordinator_approved_at=null,
         coordinator_approval_note=null,
         workflow_state='MENUNGGU_PERSETUJUAN_KABID',
         status='VERIFYING',
         updated_at=now()
   where id=new.id;

  update public.ks_bcks_submission_details
     set admin_status='TERVERIFIKASI',
         admin_note=v_note,
         admin_reviewed_by=v_primary_verifier,
         admin_reviewed_at=now(),
         updated_at=now()
   where submission_id=new.id;

  insert into public.notifications(role,title,message,link)
  values(
    'KABID',
    'AI Verifikator: administrasi KS menunggu persetujuan Kabid',
    coalesce(new.title,new.service_type)||' lolos pemeriksaan kelengkapan otomatis. Verifikator penanggung jawab: '||
      coalesce(v_verifier_names,v_primary_verifier::text)||'.',
    '#diklatKsBcks'
  );

  insert into public.submission_events(submission_id,status,note,actor_id)
  values(new.id,'AI_VERIFIKATOR_KE_KABID',v_note,v_primary_verifier);

  return new;
end;
$$;

revoke all on function private.ks_bcks_ai_verify_after_assignment() from public;
revoke all on function private.ks_bcks_ai_verify_after_assignment() from anon;
revoke all on function private.ks_bcks_ai_verify_after_assignment() from authenticated;

drop trigger if exists trg_ks_bcks_ai_verify_after_assignment on public.submissions;
create trigger trg_ks_bcks_ai_verify_after_assignment
after update of workflow_state on public.submissions
for each row
when (
  new.service_type='DIKLAT_KS_BCKS'
  and new.workflow_state='VERIFIKASI_STAF'
)
execute function private.ks_bcks_ai_verify_after_assignment();

-- Process submissions already waiting for staff verification.
update public.submissions
set workflow_state=workflow_state,
    updated_at=updated_at
where service_type='DIKLAT_KS_BCKS'
  and workflow_state='VERIFIKASI_STAF';
