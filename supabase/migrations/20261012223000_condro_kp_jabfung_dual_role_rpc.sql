-- SIMANTAB-ONLINE 2026-10-12: Condro KP/e-Jabfung dual-role RPC; REVIEW BEFORE APPLYING
-- DOES NOT run on creation/PR. Only change 3 existing RPCs (same signatures).
-- Keep SUBKOOR_TK; allow explicit task capability only when assigned.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
DO $preflight$
BEGIN
 IF md5(pg_get_functiondef('public.submission_assign_staff_balanced(uuid[],uuid[],text)'::regprocedure)) <> '2aa2563f0236d3b3ce81ea637b1dcf7b' THEN RAISE EXCEPTION 'ABORT: unexpected prior function submission_assign_staff_balanced'; END IF;
 IF md5(pg_get_functiondef('public.submission_assign_staff_multi(uuid,uuid[],text)'::regprocedure)) <> '4427f13f86362449650b4357c32555cd' THEN RAISE EXCEPTION 'ABORT: unexpected prior function submission_assign_staff_multi'; END IF;
 IF md5(pg_get_functiondef('public.submission_staff_respond(uuid,text)'::regprocedure)) <> '35cae22a312e235595f759853295a0a0' THEN RAISE EXCEPTION 'ABORT: unexpected prior function submission_staff_respond'; END IF;
 IF (
   SELECT count(DISTINCT t.capability) FROM public.team_task_assignments t
   JOIN public.profiles p ON p.id=t.user_id
   WHERE lower(p.username)='condro' AND p.role='SUBKOOR_TK'
     AND p.account_channel='DINAS' AND p.is_active=true
     AND t.capability IN ('KP','E_JABFUNG') AND t.is_active=true
 )<>2 THEN RAISE EXCEPTION 'ABORT: Condro capability grants not active'; END IF;
END $preflight$;

CREATE OR REPLACE FUNCTION public.submission_assign_staff_multi(p_submission_id uuid, p_assignee_user_ids uuid[], p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'auth'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_role text:=private.current_role();
  v_sub public.submissions%rowtype;
  v_bad_count integer;
  v_first uuid;
begin
  if p_assignee_user_ids is null or coalesce(array_length(p_assignee_user_ids,1),0)=0 then
    raise exception 'Pilih minimal satu admin/staf internal.';
  end if;

  select * into v_sub
  from public.submissions
  where id=p_submission_id
  for update;

  if v_sub.id is null then raise exception 'Usulan tidak ditemukan.'; end if;
  if v_sub.workflow_state<>'MENUNGGU_DISPOSISI_KOORDINATOR' then
    raise exception 'Usulan belum berada pada tahap pembagian tugas.';
  end if;
  if v_role<>'SUPER_ADMIN' and v_role<>v_sub.coordinator_role then
    raise exception 'Pembagian tugas hanya oleh Kasi/Subkoor sesuai jenjang.';
  end if;

  select count(*) into v_bad_count
  from unnest(p_assignee_user_ids) u(id)
  left join public.profiles p on p.id=u.id
  where p.id is null
     or p.is_active is distinct from true
     or coalesce(p.account_channel,'')<>'DINAS'
     or not (
    p.role like 'STAFF_%' or p.role like 'ADMIN_%'
    -- CONDRO_KP_JABFUNG_DUAL_ROLE_20261012: explicit capability only.
    or (p.role='SUBKOOR_TK'
      and v_sub.service_type in ('KP','E_JABFUNG')
      and exists (
        select 1 from public.team_task_assignments t
        where t.user_id=p.id and t.capability=v_sub.service_type and t.is_active=true
      )
    )
  );

  if v_bad_count>0 then
    raise exception 'Penerima tugas harus admin/staf teknis internal Dinas yang aktif.';
  end if;

  delete from public.submission_assignees where submission_id=p_submission_id;

  insert into public.submission_assignees(
    submission_id,user_id,assigned_by,assigned_at,assignment_note
  )
  select p_submission_id,u.id,v_uid,now(),nullif(trim(coalesce(p_note,'')),'')
  from (select distinct unnest(p_assignee_user_ids) as id) u;

  select id into v_first from (
    select distinct unnest(p_assignee_user_ids) as id
  ) q limit 1;

  update public.submissions
     set assigned_user_id=v_first,
         assigned_by=v_uid,
         assigned_at=now(),
         assignment_note=nullif(trim(coalesce(p_note,'')),''),
         workflow_state='VERIFIKASI_STAF',
         status='VERIFYING',
         updated_at=now()
   where id=p_submission_id;

  insert into public.notifications(user_id,title,message,link)
  select distinct u.id,
         'Tugas verifikasi layanan',
         coalesce(v_sub.title,v_sub.service_type)||' ditugaskan kepada Anda untuk diverifikasi.',
         '#monitoring'
  from unnest(p_assignee_user_ids) u(id);

  insert into public.submission_events(submission_id,status,note,actor_id)
  values(
    p_submission_id,
    'WORKFLOW_DITUGASKAN_MULTI_STAF',
    'Ditugaskan kepada '||array_length(p_assignee_user_ids,1)||' admin/staf. '||
      coalesce(nullif(trim(coalesce(p_note,'')),''),''),
    v_uid
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.submission_assign_staff_balanced(p_submission_ids uuid[], p_assignee_user_ids uuid[], p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'auth'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_role text:=private.current_role();
  v_service text;
  v_scope text;
  v_coord text;
  v_bad integer;
  v_total integer;
  v_assignees integer;
  v_sid uuid;
  v_pick uuid;
  v_title text;
  v_result jsonb := '[]'::jsonb;
begin
  if p_submission_ids is null or coalesce(array_length(p_submission_ids,1),0)=0 then
    raise exception 'Tidak ada usulan yang dipilih.';
  end if;
  if p_assignee_user_ids is null or coalesce(array_length(p_assignee_user_ids,1),0)=0 then
    raise exception 'Pilih minimal satu admin/staf internal.';
  end if;

  select count(distinct s.service_type), min(s.service_type),
         count(distinct s.scope_level), min(s.scope_level),
         count(distinct s.coordinator_role), min(s.coordinator_role),
         count(*)
  into v_bad,v_service,v_assignees,v_scope,v_total,v_coord,v_total
  from public.submissions s
  where s.id = any(p_submission_ids);

  if v_total <> cardinality(p_submission_ids) then
    raise exception 'Sebagian usulan tidak ditemukan.';
  end if;

  select count(distinct service_type), min(service_type),
         count(distinct scope_level), min(scope_level),
         count(distinct coordinator_role), min(coordinator_role)
  into v_bad,v_service,v_assignees,v_scope,v_total,v_coord
  from public.submissions
  where id=any(p_submission_ids);

  if v_bad<>1 then raise exception 'Pembagian agregat hanya untuk satu jenis layanan yang sama.'; end if;
  if v_assignees<>1 then raise exception 'Pembagian agregat hanya untuk satu jenjang yang sama.'; end if;
  if v_total<>1 then raise exception 'Koordinator usulan tidak konsisten.'; end if;

  if v_role<>'SUPER_ADMIN' and v_role<>v_coord then
    raise exception 'Pembagian tugas hanya oleh Kasi/Subkoor sesuai jenjang.';
  end if;

  select count(*) into v_bad
  from public.submissions
  where id=any(p_submission_ids)
    and workflow_state<>'MENUNGGU_DISPOSISI_KOORDINATOR';
  if v_bad>0 then
    raise exception 'Semua usulan harus masih berada pada tahap Bagi Tugas.';
  end if;

  select count(*) into v_bad
  from unnest(p_assignee_user_ids) u(id)
  left join public.profiles p on p.id=u.id
  where p.id is null
     or p.is_active is distinct from true
     or coalesce(p.account_channel,'')<>'DINAS'
     or not (
    p.role like 'STAFF_%' or p.role like 'ADMIN_%'
    -- CONDRO_KP_JABFUNG_DUAL_ROLE_20261012: explicit capability only.
    or (p.role='SUBKOOR_TK'
      and v_service in ('KP','E_JABFUNG')
      and exists (
        select 1 from public.team_task_assignments t
        where t.user_id=p.id and t.capability=v_service and t.is_active=true
      )
    )
  );
  if v_bad>0 then
    raise exception 'Penerima tugas harus admin/staf teknis internal Dinas yang aktif.';
  end if;

  create temporary table if not exists tmp_simantab_staff_load(
    user_id uuid primary key,
    active_count integer not null default 0,
    batch_count integer not null default 0
  ) on commit drop;
  truncate table tmp_simantab_staff_load;

  insert into tmp_simantab_staff_load(user_id,active_count,batch_count)
  select u.id,
         coalesce((
           select count(*)
           from public.submission_assignees a
           join public.submissions s on s.id=a.submission_id
           where a.user_id=u.id
             and s.workflow_state='VERIFIKASI_STAF'
         ),0),
         0
  from (select distinct unnest(p_assignee_user_ids) id) u;

  for v_sid in
    select s.id
    from public.submissions s
    where s.id=any(p_submission_ids)
    order by s.submitted_at nulls last,s.id
  loop
    select user_id into v_pick
    from tmp_simantab_staff_load
    order by (active_count+batch_count), batch_count, user_id
    limit 1;

    delete from public.submission_assignees where submission_id=v_sid;

    insert into public.submission_assignees(
      submission_id,user_id,assigned_by,assigned_at,assignment_note
    ) values (
      v_sid,v_pick,v_uid,now(),nullif(trim(coalesce(p_note,'')),'')
    );

    update public.submissions
       set assigned_user_id=v_pick,
           assigned_by=v_uid,
           assigned_at=now(),
           assignment_note=nullif(trim(coalesce(p_note,'')),''),
           workflow_state='VERIFIKASI_STAF',
           status='VERIFYING',
           updated_at=now()
     where id=v_sid
     returning coalesce(title,service_type) into v_title;

    update tmp_simantab_staff_load
       set batch_count=batch_count+1
     where user_id=v_pick;

    insert into public.notifications(user_id,title,message,link)
    values(
      v_pick,
      'Tugas verifikasi layanan',
      v_title||' ditugaskan kepada Anda melalui pembagian agregat.',
      '#monitoring'
    );

    insert into public.submission_events(submission_id,status,note,actor_id)
    values(
      v_sid,
      'WORKFLOW_DITUGASKAN_AGREGAT',
      'Pembagian agregat seimbang. '||coalesce(nullif(trim(coalesce(p_note,'')),''),''),
      v_uid
    );

    v_result := v_result || jsonb_build_array(
      jsonb_build_object('submission_id',v_sid,'assignee_user_id',v_pick)
    );
  end loop;

  return jsonb_build_object(
    'service_type',v_service,
    'scope_level',v_scope,
    'assigned_count',cardinality(p_submission_ids),
    'assignee_count',(select count(*) from tmp_simantab_staff_load),
    'assignments',v_result
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.submission_staff_respond(p_submission_id uuid, p_response text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'auth'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_role text:=private.current_role();
  v_sub public.submissions%rowtype;
  v_assigned boolean:=false;
  v_opening constant text := 'Yth. Bpk Ibu, mohon untuk ';
  v_closing constant text := 'Mohon masukan,kritik,dan saran terbaik pada layanan kami. Terimakasih🤝';
  v_body text;
  v_final text;
  v_cycle_id uuid;
  v_cycle_no integer;
begin
  v_body := trim(coalesce(p_response,''));
  if left(v_body,length(v_opening))=v_opening then
    v_body := trim(substr(v_body,length(v_opening)+1));
  end if;
  if right(v_body,length(v_closing))=v_closing then
    v_body := trim(left(v_body,length(v_body)-length(v_closing)));
  end if;
  if nullif(trim(v_body),'') is null then
    raise exception 'Isi respon/jawaban tidak boleh kosong.';
  end if;
  v_final := v_opening || trim(v_body) || E'\n\n' || v_closing;

  select * into v_sub from public.submissions where id=p_submission_id for update;
  if v_sub.id is null then raise exception 'Usulan tidak ditemukan.'; end if;

  select exists(
    select 1 from public.submission_assignees a
    where a.submission_id=p_submission_id and a.user_id=v_uid
  ) into v_assigned;

  if v_role<>'SUPER_ADMIN' and not v_assigned and v_sub.assigned_user_id is distinct from v_uid then
    raise exception 'Usulan ini tidak ditugaskan kepada akun Anda.';
  end if;
  if not (
    v_role='SUPER_ADMIN' or v_role like 'STAFF_%' or v_role like 'ADMIN_%'
    -- CONDRO_KP_JABFUNG_DUAL_ROLE_20261012: assigned+active+specific service.
    or (v_role='SUBKOOR_TK'
      and v_sub.service_type in ('KP','E_JABFUNG')
      and exists (
        select 1 from public.team_task_assignments t
        join public.profiles p on p.id=t.user_id
        where t.user_id=v_uid and t.capability=v_sub.service_type
          and t.is_active=true and p.is_active=true and p.account_channel='DINAS'
      )
    )
  ) then
    raise exception 'Respon hanya dapat diberikan oleh admin/staf internal.';
  end if;

  if v_sub.service_type='DIKLAT_KS_BCKS' then
    update public.submissions
    set staff_response=v_final,staff_response_by=v_uid,staff_response_at=now(),updated_at=now()
    where id=p_submission_id;
    insert into public.submission_events(submission_id,status,note,actor_id)
    values(p_submission_id,'RESPON_STAF',v_final,v_uid);
    return;
  end if;

  if v_sub.workflow_state not in ('VERIFIKASI_STAF','MENUNGGU_APPROVAL_KOORDINATOR') then
    raise exception 'Respon hanya dapat dibuat pada tahap verifikasi staf/admin.';
  end if;

  select c.id,c.cycle_no into v_cycle_id,v_cycle_no
  from public.submission_response_cycles c
  where c.submission_id=p_submission_id
    and c.cycle_status in ('WAIT_COORDINATOR','RETURNED_COORDINATOR','RETURNED_KABID')
  order by c.cycle_no desc
  limit 1
  for update;

  if v_cycle_id is null then
    select coalesce(max(cycle_no),0)+1 into v_cycle_no
    from public.submission_response_cycles
    where submission_id=p_submission_id;

    insert into public.submission_response_cycles(
      submission_id,cycle_no,staff_response,staff_response_by,staff_response_at,
      coordinator_status,kabid_status,cycle_status,created_at,updated_at
    ) values (
      p_submission_id,v_cycle_no,v_final,v_uid,now(),
      'MENUNGGU','MENUNGGU','WAIT_COORDINATOR',now(),now()
    )
    returning id into v_cycle_id;
  else
    update public.submission_response_cycles
    set staff_response=v_final,
        staff_response_by=v_uid,
        staff_response_at=now(),
        coordinator_status='MENUNGGU',
        coordinator_approved_by=null,
        coordinator_approved_at=null,
        coordinator_note=null,
        kabid_status='MENUNGGU',
        kabid_approved_by=null,
        kabid_approved_at=null,
        kabid_note=null,
        delivered_at=null,
        cycle_status='WAIT_COORDINATOR',
        updated_at=now()
    where id=v_cycle_id;
  end if;

  update public.submissions
  set staff_response=null,
      staff_response_by=null,
      staff_response_at=null,
      staff_verified_by=v_uid,
      staff_verified_at=now(),
      staff_verification_note='Respon disusun dan diajukan untuk approval Kasi/Subkoor.',
      coordinator_approved_by=null,
      coordinator_approved_at=null,
      coordinator_approval_note=null,
      kabid_approved_by=null,
      kabid_approved_at=null,
      kabid_approval_note=null,
      workflow_state='MENUNGGU_APPROVAL_KOORDINATOR',
      status='VERIFYING',
      updated_at=now()
  where id=p_submission_id;

  insert into public.notifications(role,title,message,link)
  values(
    v_sub.coordinator_role,
    'Respon staf menunggu approval',
    coalesce(v_sub.title,v_sub.service_type)||' memiliki respon admin/staf yang perlu diperiksa dan di-approve.',
    '#services'
  );

  insert into public.submission_events(submission_id,status,note,actor_id)
  values(
    p_submission_id,
    'RESPON_STAF_MENUNGGU_KOORDINATOR',
    'Siklus '||v_cycle_no||': respon disimpan internal dan menunggu approval Kasi/Subkoor.',
    v_uid
  );
end;
$function$;

DO $postflight$
BEGIN
 IF (
  SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('submission_assign_staff_multi','submission_assign_staff_balanced','submission_staff_respond')
    AND pg_get_functiondef(p.oid) LIKE '%CONDRO_KP_JABFUNG_DUAL_ROLE_20261012%'
 )<>3 THEN RAISE EXCEPTION 'ABORT: RPC postflight missing'; END IF;
END $postflight$;
COMMIT;
