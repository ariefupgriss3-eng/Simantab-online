-- SIMANTAB: KABID may assign service submissions across TK/SD/SMP.
-- Preserve SECURITY DEFINER, auth.uid, assignee validation, stage checks, notifications and audit trail.
-- No table, role, RLS or submission data changes.
-- Source: pg_get_functiondef of live production RPCs at 2026-10-13.
DO $kabid_guard$
BEGIN
 IF position('if v_role<>''SUPER_ADMIN'' and v_role<>v_coord then' in pg_get_functiondef('public.submission_assign_staff_balanced(uuid[],uuid[],text)'::regprocedure))=0 THEN
   RAISE EXCEPTION 'Unexpected existing balanced assignment RPC; abort.';
 END IF;
 IF position('if v_role<>''SUPER_ADMIN'' and v_role<>v_sub.coordinator_role then' in pg_get_functiondef('public.submission_assign_staff_multi(uuid,uuid[],text)'::regprocedure))=0 THEN
   RAISE EXCEPTION 'Unexpected existing multi assignment RPC; abort.';
 END IF;
END
$kabid_guard$;

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

  if v_role not in ('SUPER_ADMIN','KABID') and v_role<>v_coord then
    raise exception 'Pembagian tugas hanya oleh Kabid, Super Admin, atau Kasi/Subkoor sesuai jenjang.';
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
     or not (p.role like 'STAFF_%' or p.role like 'ADMIN_%');
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
$function$


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
  if v_role not in ('SUPER_ADMIN','KABID') and v_role<>v_sub.coordinator_role then
    raise exception 'Pembagian tugas hanya oleh Kabid, Super Admin, atau Kasi/Subkoor sesuai jenjang.';
  end if;

  select count(*) into v_bad_count
  from unnest(p_assignee_user_ids) u(id)
  left join public.profiles p on p.id=u.id
  where p.id is null
     or p.is_active is distinct from true
     or coalesce(p.account_channel,'')<>'DINAS'
     or not (p.role like 'STAFF_%' or p.role like 'ADMIN_%');

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
$function$

