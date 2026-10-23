-- SMART-GTK: Kabid may directly assign active approved staff by official education scope.
-- Assignment remains an audited case-by-case administrative action; no bulk mutation.
-- Staffing scope is independent from other service modules.
create table if not exists private.smartgtk_staff_scope (
  staff_id uuid primary key references public.profiles(id),
  scope text not null check(scope in ('TK_PAUD_PNF','SD','SMP')),
  label text not null check(length(btrim(label)) between 2 and 80),
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table private.smartgtk_staff_scope enable row level security;
revoke all on private.smartgtk_staff_scope from public,anon,authenticated;
comment on table private.smartgtk_staff_scope is
  'Kabid-approved SMART GTK reviewer assignment scope; distinct from primary staff service roles.';

insert into private.smartgtk_staff_scope(staff_id,scope,label,is_enabled) values
 ('547da5fe-2f9d-41eb-9985-6a567adbfd63','TK_PAUD_PNF','Mamik',true),
 ('15a8696c-9721-4ce5-87e0-7bbc28d98de6','SD','Icha',true),
 ('824a207b-cad0-4d0f-b0a6-71d9bd954f97','SD','Danny',true),
 ('4860f2ec-f1a9-4d72-9110-2e64f1d945fe','SD','Risna Afif',true),
 ('bfc66214-d3c0-4373-8039-4dbdd27dd0f6','SD','Sucipto',true),
 ('6598c009-b65f-4e50-a15f-da2160c031f7','SD','Wartono',true),
 ('1eb9915d-2a3a-4fa6-9070-ec757f61354d','SMP','Imam Prabowo',true),
 ('5d572f1e-4e3c-4233-8631-fe5e8825cd1c','SMP','Rina Ratnawati',true)
on conflict(staff_id) do update set
 scope=excluded.scope,label=excluded.label,is_enabled=excluded.is_enabled,updated_at=now();

-- Remove from this SMART-GTK allowlist any account not in the approved roster.
-- Do not deactivate or delete ordinary staff accounts.
delete from private.smartgtk_staff_scope
where staff_id not in (
 '547da5fe-2f9d-41eb-9985-6a567adbfd63',
 '15a8696c-9721-4ce5-87e0-7bbc28d98de6',
 '824a207b-cad0-4d0f-b0a6-71d9bd954f97',
 '4860f2ec-f1a9-4d72-9110-2e64f1d945fe',
 'bfc66214-d3c0-4373-8039-4dbdd27dd0f6',
 '6598c009-b65f-4e50-a15f-da2160c031f7',
 '1eb9915d-2a3a-4fa6-9070-ec757f61354d',
 '5d572f1e-4e3c-4233-8631-fe5e8825cd1c'
);

create or replace function public.smartgtk_workflow_staff()
returns jsonb language plpgsql stable security definer set search_path=''
as $function$
declare a public.profiles%rowtype; j jsonb; target_scope text;
begin
 select * into a from public.profiles
 where id=auth.uid() and account_channel='DINAS'
   and approval_status='APPROVED' and is_active=true
   and role in ('KABID','KASI_SD','KASI_SMP','SUBKOOR_TK');
 if not found then raise exception 'Hanya Kabid/Kasi/Subkoor yang berwenang melihat daftar staf pemeriksa'; end if;
 target_scope:=case a.role when 'KASI_SD' then 'SD' when 'KASI_SMP' then 'SMP'
                when 'SUBKOOR_TK' then 'TK_PAUD_PNF' else null end;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',m.label,
            'role',p.role,'scope',m.scope) order by m.scope,m.label),'[]'::jsonb)
 into j from private.smartgtk_staff_scope m
 join public.profiles p on p.id=m.staff_id
 where m.is_enabled=true and p.account_channel='DINAS' and p.is_active=true
   and p.approval_status='APPROVED'
   and (p.role like 'STAFF_%' or p.role like 'ADMIN_%')
   and (target_scope is null or m.scope=target_scope);
 return j;
end;
$function$;

create or replace function public.smartgtk_workflow_act(
 p_owner uuid,p_action text,p_note text default null,p_staff uuid default null,p_scope text default null
) returns jsonb language plpgsql security definer set search_path=''
as $function$
declare a public.profiles%rowtype;w public.smartgtk_workflow%rowtype;
 v_new text;v_scope text;v_note text;t public.profiles%rowtype;src public.smartgtk_intake%rowtype;
begin
 select * into a from public.profiles where id=auth.uid() and account_channel='DINAS'
   and approval_status='APPROVED' and is_active=true
   and (role in ('KABID','KASI_SD','KASI_SMP','SUBKOOR_TK') or role like 'STAFF_%' or role like 'ADMIN_%');
 if not found then raise exception 'Akun Dinas tidak memiliki kewenangan untuk memproses SMART-GTK';end if;
 perform private.smartgtk_workflow_sync();
 select * into w from public.smartgtk_workflow where owner_id=p_owner for update;
 if not found then raise exception 'Pengusul belum menyerahkan pendataan SMART-GTK yang lengkap';end if;
 select * into src from public.smartgtk_intake where owner_id=p_owner;
 if src.employment is distinct from 'PNS'
    or src.profession not in ('GURU','KEPALA_SEKOLAH')
    or src.data_stage not in ('BERKAS_LENGKAP','DATA_TERCATAT')
    or src.updated_at>w.source_updated_at then
   raise exception 'Data GTK berubah/masih draf; tunggu pengajuan yang lengkap';end if;
 v_note:=btrim(coalesce(p_note,''));
 if length(v_note)>500 then raise exception 'Catatan maksimal 500 karakter';end if;
 if p_action in ('RETURN_GTK','RETURN_STAFF','RETURN_COORD') and length(v_note)<10
   then raise exception 'Catatan perbaikan minimal 10 karakter';end if;

 if a.role='KABID' then
   if p_action='ASSIGN_STAFF'
      and w.status in ('MENUNGGU_PENUGASAN','MENUNGGU_STAF','PERBAIKAN_STAF') then
      v_new:='MENUNGGU_STAF';
   elsif p_action='SET_SCOPE' and w.scope='BELUM_TERPETAKAN'
      and w.status='MENUNGGU_PENUGASAN' then
      if p_scope not in ('SD','SMP','TK_PAUD_PNF') then
        raise exception 'Tentukan jenjang resmi';end if;
      v_scope:=p_scope;v_new:='MENUNGGU_PENUGASAN';
   elsif p_action='APPROVE' and w.status='MENUNGGU_KABID'
      and w.scope<>'BELUM_TERPETAKAN' then
      v_new:='SELESAI';
   elsif p_action='RETURN_COORD' and w.status='MENUNGGU_KABID' then
      v_new:='PERBAIKAN_KASI';
   elsif p_action='RETURN_GTK' and w.status='MENUNGGU_KABID' then
      v_new:='PERBAIKAN_GTK';
   else raise exception 'Aksi Kabid tidak sesuai tahap';end if;
 elsif a.role in ('KASI_SD','KASI_SMP','SUBKOOR_TK') then
   if not ((a.role='KASI_SD' and w.scope='SD')
     or (a.role='KASI_SMP' and w.scope='SMP')
     or (a.role='SUBKOOR_TK' and w.scope='TK_PAUD_PNF')) then
      raise exception 'Kasus berada di luar jenjang kewenangan';end if;
   if p_action='ASSIGN_STAFF'
     and w.status in ('MENUNGGU_PENUGASAN','MENUNGGU_STAF','PERBAIKAN_STAF') then
      v_new:='MENUNGGU_STAF';
   elsif p_action='FORWARD_KABID'
     and w.status in ('MENUNGGU_KASI','PERBAIKAN_KASI') then
      v_new:='MENUNGGU_KABID';
   elsif p_action='RETURN_STAFF' and w.status in ('MENUNGGU_KASI','PERBAIKAN_KASI')
     and w.assigned_staff is not null then
      v_new:='PERBAIKAN_STAF';
   elsif p_action='RETURN_GTK'
     and w.status in ('MENUNGGU_KASI','PERBAIKAN_KASI') then
      v_new:='PERBAIKAN_GTK';
   else raise exception 'Aksi Kasi/Subkoor tidak sesuai tahap';end if;
 elsif (a.role like 'STAFF_%' or a.role like 'ADMIN_%') and w.assigned_staff=a.id then
   if p_action='SEND_KASI'
      and w.status in ('MENUNGGU_STAF','PERBAIKAN_STAF') then
      v_new:='MENUNGGU_KASI';
   elsif p_action='RETURN_GTK'
      and w.status in ('MENUNGGU_STAF','PERBAIKAN_STAF') then
      v_new:='PERBAIKAN_GTK';
   else raise exception 'Aksi staf tidak sesuai tugas/tahap';end if;
 else raise exception 'Kasus belum ditugaskan kepada akun ini';end if;

 if p_action='ASSIGN_STAFF' then
   if w.scope not in ('SD','SMP','TK_PAUD_PNF') then
      raise exception 'Jenjang belum terpetakan, tidak dapat menugaskan staf';end if;
   select p.* into t from public.profiles p
   join private.smartgtk_staff_scope m on m.staff_id=p.id
   where p.id=p_staff and m.scope=w.scope and m.is_enabled=true
      and p.account_channel='DINAS' and p.is_active=true
      and p.approval_status='APPROVED'
      and (p.role like 'STAFF_%' or p.role like 'ADMIN_%');
   if not found then
      raise exception 'Staf tidak aktif atau bukan pemeriksa yang ditetapkan untuk jenjang ini';end if;
   v_note:='Penugasan langsung ke '||t.full_name||' untuk jenjang '||w.scope;
 end if;

 update public.smartgtk_workflow set scope=coalesce(v_scope,scope),status=v_new,
   assigned_staff=case when p_action='ASSIGN_STAFF' then p_staff else assigned_staff end,
   staff_note=case
     when p_action='ASSIGN_STAFF' then null
     when p_action in ('SEND_KASI','RETURN_GTK')
       and (a.role like 'STAFF_%' or a.role like 'ADMIN_%') then v_note
     else staff_note end,
   coordinator_note=case when a.role in ('KASI_SD','KASI_SMP','SUBKOOR_TK')
     and p_action<>'ASSIGN_STAFF' then v_note else coordinator_note end,
   kabid_note=case when a.role='KABID' and p_action not in ('SET_SCOPE','ASSIGN_STAFF')
     then v_note else kabid_note end,
   decided_by=case when p_action='APPROVE' then a.id else null end,
   decided_at=case when p_action='APPROVE' then now() else null end,
   updated_at=now(),version=version+1
 where owner_id=p_owner;
 insert into public.smartgtk_workflow_events(owner_id,actor_id,action,from_status,to_status,note)
 values(p_owner,a.id,p_action,w.status,v_new,nullif(v_note,''));
 return jsonb_build_object('ok',true,'owner_id',p_owner,'from',w.status,'status',v_new,
   'action',p_action,'assigned_staff',case when p_action='ASSIGN_STAFF' then p_staff else null end);
end;
$function$;

revoke all on function public.smartgtk_workflow_staff() from public,anon;
revoke all on function public.smartgtk_workflow_act(uuid,text,text,uuid,text) from public,anon;
grant execute on function public.smartgtk_workflow_staff() to authenticated;
grant execute on function public.smartgtk_workflow_act(uuid,text,text,uuid,text) to authenticated;
