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
    and v.created_at >= coalesce(new.submitted_at,'epoch'::timestamptz) - interval '1 minute'
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
