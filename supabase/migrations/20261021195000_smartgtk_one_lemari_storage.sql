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

alter table public.smartgtk_locker_files
 add constraint smartgtk_locker_type_check check(doc_type in
 ('SK_KP','IJAZAH_TERAKHIR','SK_JF','SERDIK','PENGALAMAN_2TH',
 'SKP_TAHUN_1','SKP_TAHUN_2','SK_PPPK','SK_PPPK_PW','SURAT_TUGAS'));
alter table public.smartgtk_locker_files
 add constraint smartgtk_locker_path_check check(length(storage_path) between 55 and 220);
alter table public.smartgtk_locker_files
 add constraint smartgtk_locker_name_check check(length(btrim(file_name)) between 1 and 180);

-- Apply to every new SMART-GTK archive object; other service uploads unaffected.
create policy smartgtk_locker_insert_guard on storage.objects
 as restrictive for insert to authenticated
 with check(
   bucket_id<>'simantab-documents'
   or split_part(name,'/',2)<>'SMARTGTK'
   or (split_part(name,'/',1)=auth.uid()::text
     and array_length(string_to_array(name,'/'),1)=3
     and split_part(name,'/',3) ~ '^[a-f0-9-]{36}\\.(pdf|jpg|png)$'
     and (select public.smartgtk_pilot_status())
     and exists(select 1 from public.smartgtk_intake
       where owner_id=auth.uid() and employment in ('PNS','PPPK','PPPK_PW')))
 );
