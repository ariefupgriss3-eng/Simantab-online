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

create or replace function public.smartgtk_mass_status()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v public.smartgtk_intake%rowtype; required text[]; missing text[]:=array[]::text[]; t text;
begin
 select * into v from public.smartgtk_intake where owner_id=auth.uid();
 if not found then return jsonb_build_object('state','BELUM_MENGISI','required',jsonb_build_array(),'missing',jsonb_build_array());end if;
 required:=public.smartgtk_mass_required_docs(v.profession,v.employment,v.jf_sk,
  v.nomenclature_updated,v.pns_jf_formation,v.education,v.old_position);
 foreach t in array required loop
  if not exists(select 1 from public.smartgtk_documents d
   join storage.objects o on o.bucket_id=d.source_bucket and o.name=d.storage_path
   where d.owner_id=v.owner_id and d.doc_type=t
     and (d.source_bucket='simantab-smartgtk-private' and d.cabinet_file_id is null
       or d.source_bucket='simantab-documents' and exists (
         select 1 from public.smartgtk_locker_files x
         where x.id=d.cabinet_upload_id and x.owner_id=d.owner_id
          and x.storage_path=d.storage_path and x.doc_type=d.doc_type
          and x.file_size between 1 and 1572864
          and x.mime_type in ('application/pdf','image/jpeg','image/png'))
       or d.source_bucket='simantab-documents' and exists (
         select 1 from public.submission_files sf where sf.id=d.cabinet_file_id
          and sf.user_id=d.owner_id and sf.storage_path=d.storage_path
          and sf.file_size between 1 and 1572864 and length(sf.storage_path)<=220
          and sf.mime_type in ('application/pdf','image/jpeg','image/png')
          and private.smartgtk_cabinet_code_matches(d.doc_type,sf.requirement_code)))) then missing:=array_append(missing,t);end if;
 end loop;
 return jsonb_build_object('state',v.data_stage,'employment',v.employment,'profession',v.profession,
  'required',to_jsonb(required),'missing',to_jsonb(missing),'complete',cardinality(missing)=0,
  'evidence_policy',case when v.employment='PNS' then 'WAJIB' when v.employment in ('PPPK','PPPK_PW')
    then 'SESUAI_DOKUMEN_DIMILIKI' else 'TANPA_UNGGAH' end,
  'legal_notice','Hasil pendataan bukan persetujuan usulan JF atau penerbitan SK');
end;
$$;


create or replace function public.smartgtk_mass_officer_list(p_page integer default 0)
returns table(owner_id uuid,full_name text,unit_work text,
 profession text,employment text,education text,
 data_stage text,screening jsonb,docs_present integer,required_count integer,updated_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
begin
 if not private.jf2026_is_officer() then raise exception 'Hanya petugas Dinas';end if;
 if p_page is null or p_page<0 or p_page>10000 then raise exception 'Halaman tidak valid';end if;
 return query select v.owner_id,v.full_name,v.unit_work,v.profession,v.employment,
   v.education,v.data_stage,
   public.smartgtk_mass_classify(v.profession,v.employment,v.jf_sk,
    v.nomenclature_updated,v.pns_jf_formation,v.education,v.old_position),
   (select count(*)::integer from public.smartgtk_documents d
      join storage.objects o on o.bucket_id=d.source_bucket and o.name=d.storage_path
      where d.owner_id=v.owner_id and
      (d.source_bucket='simantab-smartgtk-private' and d.cabinet_file_id is null
       or d.source_bucket='simantab-documents' and exists(
        select 1 from public.smartgtk_locker_files x
        where x.id=d.cabinet_upload_id and x.owner_id=d.owner_id
         and x.storage_path=d.storage_path and x.doc_type=d.doc_type
         and x.file_size between 1 and 1572864 and x.mime_type in ('application/pdf','image/jpeg','image/png'))
       or d.source_bucket='simantab-documents' and exists(
        select 1 from public.submission_files sf where sf.id=d.cabinet_file_id and sf.user_id=d.owner_id
         and sf.storage_path=d.storage_path and sf.file_size between 1 and 1572864 and length(sf.storage_path)<=220
         and sf.mime_type in ('application/pdf','image/jpeg','image/png')
          and private.smartgtk_cabinet_code_matches(d.doc_type,sf.requirement_code)))),
   cardinality(public.smartgtk_mass_required_docs(v.profession,v.employment,v.jf_sk,
    v.nomenclature_updated,v.pns_jf_formation,v.education,v.old_position)),
   v.updated_at
 from public.smartgtk_intake v order by v.updated_at desc,v.owner_id
 limit 50 offset (p_page::bigint*50);
end;
$$;


create or replace function public.smartgtk_cabinet_candidates(p_type text)
returns table(file_id uuid,file_name text,file_size bigint,mime_type text,uploaded_at timestamptz,requirement_code text)
language plpgsql stable security definer set search_path=''
as $$
declare v public.smartgtk_intake%rowtype;
begin
 select * into v from public.smartgtk_intake where owner_id=auth.uid();
 if not found then raise exception 'Simpan pendataan SMART-GTK terlebih dahulu';end if;
 if not private.smartgtk_current_user_can_participate() then
  raise exception 'Akses pengisian SMART-GTK belum aktif';end if;
 if not private.smartgtk_cabinet_type_allowed(v.employment,p_type) then
  raise exception 'Jenis dokumen tidak diperbolehkan untuk status ini';end if;
 return query
 select sf.id,sf.file_name,sf.file_size,sf.mime_type,sf.created_at,sf.requirement_code
 from public.submission_files sf
 join storage.objects o on o.bucket_id='simantab-documents' and o.name=sf.storage_path
 where sf.user_id=auth.uid()
   and split_part(sf.storage_path,'/',1)=auth.uid()::text
   and sf.file_size between 1 and 1572864 and length(sf.storage_path)<=220
   and sf.mime_type in ('application/pdf','image/jpeg','image/png')
   and private.smartgtk_cabinet_code_matches(p_type,sf.requirement_code)
 union all
 select x.id,x.file_name,x.file_size,x.mime_type,x.created_at,x.doc_type
 from public.smartgtk_locker_files x
 join storage.objects o on o.bucket_id='simantab-documents' and o.name=x.storage_path
 where x.owner_id=auth.uid() and x.doc_type=p_type
   and x.file_size between 1 and 1572864
   and length(x.storage_path)<=220
   and x.mime_type in ('application/pdf','image/jpeg','image/png')
 order by 5 desc,1 desc limit 100;
end;
$$;


create or replace function public.smartgtk_import_cabinet(p_type text,p_file_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v public.smartgtk_intake%rowtype; sf public.submission_files%rowtype; x public.smartgtk_locker_files%rowtype;
begin
 if p_file_id is null then raise exception 'Pilih dokumen terlebih dahulu';end if;
 select * into v from public.smartgtk_intake where owner_id=auth.uid() for update;
 if not found then raise exception 'Isi SMART-GTK dahulu';end if;
 if not private.smartgtk_current_user_can_participate() then
  raise exception 'Akses pengisian SMART-GTK belum aktif';end if;
 if not private.smartgtk_cabinet_type_allowed(v.employment,p_type) then
  raise exception 'Kelompok atau jenis dokumen tidak diizinkan';end if;
 select * into x from public.smartgtk_locker_files where id=p_file_id and owner_id=auth.uid();
 if found then
  if x.doc_type<>p_type
      or not exists(select 1 from storage.objects
        where bucket_id='simantab-documents' and name=x.storage_path) then
      raise exception 'Jenis dokumen tidak sesuai atau berkas sumber tidak tersedia';end if;
  insert into public.smartgtk_documents(owner_id,doc_type,storage_path,source_bucket,cabinet_file_id,cabinet_upload_id)
  values(auth.uid(),p_type,x.storage_path,'simantab-documents',null,x.id)
  on conflict(owner_id,doc_type) do update set storage_path=excluded.storage_path,
    source_bucket=excluded.source_bucket,cabinet_file_id=null,cabinet_upload_id=excluded.cabinet_upload_id,uploaded_at=now();
  update public.smartgtk_intake set data_stage='DRAFT' where owner_id=auth.uid();
  insert into public.smartgtk_audit(owner_id,actor_id,action)
    values(auth.uid(),auth.uid(),'CABINET_FILE_LINKED_'||p_type);
  return jsonb_build_object('linked',true,'file_id',x.id,'verified',false);
 end if;
 select * into sf from public.submission_files where id=p_file_id and user_id=auth.uid();
 if not found then raise exception 'Dokumen bukan milik akun ini atau tidak ditemukan';end if;
 if not private.smartgtk_cabinet_code_matches(p_type,sf.requirement_code) then
  raise exception 'Jenis dokumen di lemari tidak sesuai persyaratan SMART-GTK';end if;
 if sf.storage_path is null or split_part(sf.storage_path,'/',1)<>auth.uid()::text
  or sf.file_size not between 1 and 1572864 or length(sf.storage_path)>220
  or sf.mime_type not in ('application/pdf','image/jpeg','image/png') then
  raise exception 'Berkas Lemari Dokumenku tidak memenuhi persyaratan';end if;
 if not exists(select 1 from storage.objects where bucket_id='simantab-documents'
   and name=sf.storage_path) then
  raise exception 'Berkas sudah tidak tersedia di penyimpanan privat';end if;
 insert into public.smartgtk_documents(owner_id,doc_type,storage_path,source_bucket,cabinet_file_id)
 values(auth.uid(),p_type,sf.storage_path,'simantab-documents',sf.id)
 on conflict(owner_id,doc_type) do update
 set storage_path=excluded.storage_path,source_bucket='simantab-documents',
     cabinet_file_id=excluded.cabinet_file_id,cabinet_upload_id=null,uploaded_at=now();
 update public.smartgtk_intake set data_stage='DRAFT' where owner_id=auth.uid();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(auth.uid(),auth.uid(),'CABINET_FILE_LINKED_'||p_type);
 return jsonb_build_object('linked',true,'doc_type',p_type,'file_id',sf.id,
   'verified',false,'needs_dinas_review',true);
end;
$$;


notify pgrst, 'reload schema';