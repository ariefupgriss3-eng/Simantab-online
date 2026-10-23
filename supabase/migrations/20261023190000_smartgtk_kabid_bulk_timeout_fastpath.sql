-- SMART GTK | HOTFIX slow bulk RPC 500 under PostgREST statement-timeout.
-- Validation and synchronization once per batch; preserve audit per case.
-- SMART GTK | Pembagian tugas agregat oleh Kabid (per jenjang).
-- Hanya data PNS guru/KS yang telah diserahkan, belum ditugaskan.
-- Seluruh batch bersifat atomik; batas 50 orang/halaman, audit per kasus.
create or replace function public.smartgtk_workflow_bulk_assign(
  p_cases jsonb, p_scope text, p_mode text default 'SINGLE', p_staff uuid default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
  v_actor public.profiles%rowtype;
  v_item jsonb;
  v_owner uuid;
  v_version integer;
  v_seen uuid[] := '{}'::uuid[];
  v_row public.smartgtk_workflow%rowtype;
  v_intake public.smartgtk_intake%rowtype;
  v_target uuid;
  v_target_name text;
  v_rows integer;
  v_audit_note text;
  v_details jsonb := '[]'::jsonb;
  v_count integer := 0;
begin
  select * into v_actor from public.profiles
  where id=auth.uid() and role='KABID' and account_channel='DINAS'
    and is_active=true and approval_status='APPROVED';
  if not found then raise exception 'Hanya Kabid aktif yang dapat membagi tugas agregat SMART GTK'; end if;

  if p_scope is null or p_scope not in ('TK_PAUD_PNF','SD','SMP') then
    raise exception 'Pilih jenjang resmi terlebih dahulu'; end if;
  if p_mode is null or p_mode not in ('SINGLE','BALANCED') then
    raise exception 'Mode pembagian tugas tidak dikenal'; end if;
  if p_mode='SINGLE' and p_staff is null then
    raise exception 'Pilih staf pemeriksa untuk penugasan massal'; end if;
  if p_mode='BALANCED' and p_staff is not null then
    raise exception 'Mode merata memilih staf secara otomatis'; end if;
  if p_cases is null or jsonb_typeof(p_cases) <> 'array'
    or jsonb_array_length(p_cases) not between 1 and 50 then
    raise exception 'Pilih 1 sampai 50 kasus dalam satu batch'; end if;

  -- Serialize bulk batches per scope. Per-item RPC remains independently available.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('smartgtk-bulk-'||p_scope)::bigint);
  perform private.smartgtk_workflow_sync();

  if p_mode='SINGLE' and not exists (
    select 1 from private.smartgtk_staff_scope m
    join public.profiles s on s.id=m.staff_id
    where m.staff_id=p_staff and m.scope=p_scope and m.is_enabled=true
      and s.account_channel='DINAS' and s.is_active=true
      and s.approval_status='APPROVED'
      and (s.role like 'STAFF_%' or s.role like 'ADMIN_%')
  ) then raise exception 'Staf yang dipilih tidak berwenang pada jenjang ini'; end if;

  if p_mode='BALANCED' and not exists (
    select 1 from private.smartgtk_staff_scope m
    join public.profiles s on s.id=m.staff_id
    where m.scope=p_scope and m.is_enabled=true and s.account_channel='DINAS'
      and s.is_active=true and s.approval_status='APPROVED'
      and (s.role like 'STAFF_%' or s.role like 'ADMIN_%')
  ) then raise exception 'Tidak ada staf aktif untuk jenjang yang dipilih'; end if;

  -- Validate and lock all rows before assigning any. One bad case cancels the batch.
  for v_item in
    select value from pg_catalog.jsonb_array_elements(p_cases)
    order by value->>'owner_id'
  loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object'
      or coalesce(v_item->>'owner_id','') !~
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      or coalesce(v_item->>'version','') !~ '^[0-9]{1,9}$'
    then raise exception 'Format identitas atau versi antrean tidak valid'; end if;
    v_owner := (v_item->>'owner_id')::uuid;
    v_version := (v_item->>'version')::integer;
    if v_owner = any(v_seen) then
      raise exception 'Kasus ganda pada pilihan agregat'; end if;
    v_seen := pg_catalog.array_append(v_seen,v_owner);
    select * into v_row from public.smartgtk_workflow
      where owner_id=v_owner for update;
    if not found or v_row.version <> v_version
      or v_row.status <> 'MENUNGGU_PENUGASAN'
      or v_row.assigned_staff is not null or v_row.scope <> p_scope
    then raise exception 'Antrean sudah berubah atau tidak layak ditugaskan; segarkan SMART GTK'; end if;
    select * into v_intake from public.smartgtk_intake where owner_id=v_owner;
    if not found or v_intake.employment <> 'PNS'
      or v_intake.profession not in ('GURU','KEPALA_SEKOLAH')
      or v_intake.data_stage not in ('DATA_TERCATAT','BERKAS_LENGKAP')
      or v_intake.updated_at > v_row.source_updated_at
    then raise exception 'Kasus belum siap atau data GTK telah berubah; segarkan SMART GTK'; end if;
  end loop;

  -- Assign through the existing audited single-case workflow function.
  for v_item in
    select value from pg_catalog.jsonb_array_elements(p_cases)
    order by value->>'owner_id'
  loop
    v_owner := (v_item->>'owner_id')::uuid;
    if p_mode='SINGLE' then
      v_target:=p_staff;
      select full_name into v_target_name from public.profiles where id=v_target;
    else
      -- Recalculate active workload each iteration for an equitable assignment.
      select m.staff_id, s.full_name into v_target,v_target_name
      from private.smartgtk_staff_scope m
      join public.profiles s on s.id=m.staff_id
      left join public.smartgtk_workflow w on w.assigned_staff=m.staff_id
        and w.status in ('MENUNGGU_STAF','PERBAIKAN_STAF',
          'MENUNGGU_KASI','PERBAIKAN_KASI','MENUNGGU_KABID')
      where m.scope=p_scope and m.is_enabled=true
        and s.account_channel='DINAS' and s.is_active=true
        and s.approval_status='APPROVED'
        and (s.role like 'STAFF_%' or s.role like 'ADMIN_%')
      group by m.staff_id,s.full_name,m.label
      order by count(w.owner_id), m.label, m.staff_id limit 1;
    end if;
    if v_target is null then raise exception 'Staf aktif tidak ditemukan'; end if;
    -- Fast path: the entire batch was already synchronized, validated and
    -- row-locked. Calling smartgtk_workflow_act here would re-synchronize
    -- every GTK record up to 50 additional times, causing HTTP 500 timeouts.
    update public.smartgtk_workflow
       set status='MENUNGGU_STAF',
           assigned_staff=v_target,
           staff_note=null,
           decided_by=null,
           decided_at=null,
           updated_at=now(),
           version=version+1
     where owner_id=v_owner and version=(v_item->>'version')::integer
       and scope=p_scope and status='MENUNGGU_PENUGASAN'
       and assigned_staff is null;
    get diagnostics v_rows=row_count;
    if v_rows<>1 then
      raise exception 'Antrean berubah saat pembagian tugas; semua perubahan dibatalkan'; end if;
    v_audit_note:='Penugasan langsung ke '||v_target_name||' untuk jenjang '||p_scope;
    insert into public.smartgtk_workflow_events(
      owner_id,actor_id,action,from_status,to_status,note
    ) values(v_owner,v_actor.id,'ASSIGN_STAFF',
      'MENUNGGU_PENUGASAN','MENUNGGU_STAF',v_audit_note);
    v_count:=v_count+1;
    v_details:=v_details || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('owner_id',v_owner,'staff_id',v_target,
        'staff_name',v_target_name));
  end loop;
  return pg_catalog.jsonb_build_object('ok',true,'count',v_count,'scope',p_scope,
    'mode',p_mode,'assignments',v_details,'audit','ASSIGN_STAFF per kasus');
end;
$function$;

revoke all on function public.smartgtk_workflow_bulk_assign(jsonb,text,text,uuid)
  from public, anon, authenticated;
grant execute on function public.smartgtk_workflow_bulk_assign(jsonb,text,text,uuid)
  to authenticated;
comment on function public.smartgtk_workflow_bulk_assign(jsonb,text,text,uuid) is
  'Optimized atomic Kabid-only SMART GTK batch assignment. One sync per batch, strict role/scope/stage/version verification, per-case audit; no repeated per-case full sync.';
