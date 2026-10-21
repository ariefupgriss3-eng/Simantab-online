-- New SMART-GTK documents are stored in the existing Lemari Dokumenku bucket.
-- Historical SMART-GTK objects remain in place and are not deleted.
create table if not exists public.smartgtk_locker_files(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id),
 doc_type text not null,
 storage_path text not null unique,
 file_name text not null,
 file_size bigint not null check(file_size between 1 and 1572864),
 mime_type text not null check(mime_type in ('application/pdf','image/jpeg','image/png')),
 created_at timestamptz not null default now()
);
alter table public.smartgtk_locker_files enable row level security;
revoke all on public.smartgtk_locker_files from public,anon,authenticated;
grant select on public.smartgtk_locker_files to authenticated;
create policy smartgtk_locker_own on public.smartgtk_locker_files for select to authenticated
 using(owner_id=auth.uid());
alter table public.smartgtk_documents add column if not exists cabinet_upload_id uuid
 references public.smartgtk_locker_files(id);
