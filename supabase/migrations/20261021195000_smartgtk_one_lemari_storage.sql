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
     and split_part(name,'/',3) ~ '^[a-f0-9-]{36}\.(pdf|jpg|png)$'
     and (select public.smartgtk_pilot_status())
     and exists(select 1 from public.smartgtk_intake
       where owner_id=auth.uid() and employment in ('PNS','PPPK','PPPK_PW')))
 );

create or replace function public.smartgtk_locker_register(
 p_type text,p_path text,p_name text,p_size bigint,p_mime text
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v public.smartgtk_intake%rowtype; out_id uuid; m jsonb;
begin
 select * into v from public.smartgtk_intake where owner_id=auth.uid() for update;
 if not found then raise exception 'Lengkapi pendataan SMART-GTK terlebih dahulu';end if;
 if not private.smartgtk_current_user_can_participate() then raise exception 'Akses SMART-GTK belum aktif';end if;
 if not private.smartgtk_cabinet_type_allowed(v.employment,p_type) then
  raise exception 'Jenis berkas tidak diperbolehkan';end if;
 if p_path is null or length(p_path)>220
 or split_part(p_path,'/',1)<>auth.uid()::text
 or split_part(p_path,'/',2)<>'SMARTGTK'
 or array_length(string_to_array(p_path,'/'),1)<>3
 or split_part(p_path,'/',3) !~ '^[a-f0-9-]{36}\.(pdf|jpg|png)$'
 then raise exception 'Lokasi berkas tidak sah';end if;
 if p_name is null or length(btrim(p_name)) not between 1 and 180
 or p_size not between 1 and 1572864
 or p_mime not in ('application/pdf','image/jpeg','image/png')
 then raise exception 'Nama, format, atau ukuran berkas tidak sah';end if;
 if (right(p_path,4)='.pdf' and p_mime<>'application/pdf')
 or (right(p_path,4)='.jpg' and p_mime<>'image/jpeg')
 or (right(p_path,4)='.png' and p_mime<>'image/png')
 then raise exception 'Format dan ekstensi berkas tidak cocok';end if;
 select metadata into m from storage.objects
 where bucket_id='simantab-documents' and name=p_path;
 if not found then raise exception 'Berkas belum ditemukan di Lemari Dokumenku';end if;
 if m ? 'size' and (m->>'size')::bigint<>p_size then
  raise exception 'Ukuran objek tidak cocok';end if;
 if coalesce(m->>'mimetype',m->>'contentType') is not null
 and coalesce(m->>'mimetype',m->>'contentType')<>p_mime then
  raise exception 'Tipe objek tidak cocok';end if;
 insert into public.smartgtk_locker_files(owner_id,doc_type,storage_path,file_name,file_size,mime_type)
 values(auth.uid(),p_type,p_path,btrim(p_name),p_size,p_mime)
 on conflict(storage_path) do nothing returning id into out_id;
 if out_id is null then raise exception 'Berkas sudah tercatat';end if;
 insert into public.smartgtk_documents
 (owner_id,doc_type,storage_path,source_bucket,cabinet_file_id,cabinet_upload_id)
 values(auth.uid(),p_type,p_path,'simantab-documents',null,out_id)
 on conflict(owner_id,doc_type) do update set
 storage_path=excluded.storage_path,source_bucket=excluded.source_bucket,
 cabinet_file_id=null,cabinet_upload_id=excluded.cabinet_upload_id,uploaded_at=now();
 update public.smartgtk_intake set data_stage='DRAFT' where owner_id=auth.uid();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(auth.uid(),auth.uid(),'CABINET_UPLOADED_'||p_type);
 return out_id;
end;
$$;
revoke all on function public.smartgtk_locker_register(text,text,text,bigint,text) from public,anon;
grant execute on function public.smartgtk_locker_register(text,text,text,bigint,text) to authenticated;
