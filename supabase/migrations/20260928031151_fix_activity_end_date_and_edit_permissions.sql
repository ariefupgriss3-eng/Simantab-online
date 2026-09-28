drop policy if exists activities_manage on public.field_activities;
drop policy if exists activities_insert_authorized on public.field_activities;
drop policy if exists activities_update_authorized on public.field_activities;
drop policy if exists activities_delete_authorized on public.field_activities;

create policy activities_insert_authorized
on public.field_activities
for insert
to authenticated
with check (public.can_current_user_input_field_activity());

create policy activities_update_authorized
on public.field_activities
for update
to authenticated
using (public.can_current_user_input_field_activity())
with check (public.can_current_user_input_field_activity());

create policy activities_delete_authorized
on public.field_activities
for delete
to authenticated
using (private.current_role() in ('SUPER_ADMIN','KABID'));

update public.field_activities
set activity_end_date=activity_date
where activity_end_date is null
  and activity_date is not null;

create or replace function private.field_activity_end_date_guard()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
begin
  if new.activity_end_date is null then
    new.activity_end_date := new.activity_date;
  end if;
  if new.activity_end_date < new.activity_date then
    raise exception 'Tanggal selesai kegiatan tidak boleh lebih awal dari tanggal mulai.';
  end if;
  if new.activity_end_date = new.activity_date
     and new.activity_time is not null
     and new.activity_end_time is not null
     and new.activity_end_time < new.activity_time then
    raise exception 'Jam selesai kegiatan tidak boleh lebih awal dari jam mulai pada tanggal yang sama.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_field_activity_end_date_guard on public.field_activities;
create trigger trg_field_activity_end_date_guard
before insert or update of activity_date,activity_end_date,activity_time,activity_end_time
on public.field_activities
for each row
execute function private.field_activity_end_date_guard();
