-- Reference eligible files from the existing private Lemari Dokumenku.
-- No copy, public URL, cross-user access, or automatic classification of ambiguous filenames.
alter table public.smartgtk_documents
 add column if not exists source_bucket text not null default 'simantab-smartgtk-private';
alter table public.smartgtk_documents
 add column if not exists cabinet_file_id uuid references public.submission_files(id) on delete set null;
alter table public.smartgtk_documents
 add constraint smartgtk_source_bucket_check
 check (source_bucket in ('simantab-smartgtk-private','simantab-documents'));

create or replace function private.smartgtk_cabinet_type_allowed(p_employment text,p_type text)
returns boolean language sql immutable set search_path=''
as $$
 select case p_employment
  when 'PNS' then p_type in ('SK_KP','IJAZAH_TERAKHIR','SK_JF','SERDIK','PENGALAMAN_2TH','SKP_TAHUN_1','SKP_TAHUN_2')
  when 'PPPK' then p_type in ('SK_PPPK','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS')
  when 'PPPK_PW' then p_type in ('SK_PPPK_PW','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS')
  else false end;
$$;
revoke all on function private.smartgtk_cabinet_type_allowed(text,text) from public,anon,authenticated;

-- A file is eligible only if its original cabinet requirement code matches this obligation.
-- No filename inference, which could incorrectly classify SKCK/other diklat documents as an SK Jabfung.
create or replace function private.smartgtk_cabinet_code_matches(p_type text,p_code text)
returns boolean language sql immutable set search_path=''
as $$
 select case p_type
  when 'SK_KP' then upper(btrim(coalesce(p_code,''))) in
    ('SK_KP','SK_KP_TERAKHIR','SK_KENAIKAN_PANGKAT','SK_PANGKAT_TERAKHIR')
  when 'IJAZAH_TERAKHIR' then upper(btrim(coalesce(p_code,''))) in
    ('IJAZAH_TERAKHIR','IJAZAH','IJAZAH_S1','IJAZAH_S2','IJAZAH_S3','IJAZAH_D4')
  when 'SK_JF' then upper(btrim(coalesce(p_code,''))) in
    ('SK_JF','SK_JABFUNG','SK_JABATAN_FUNGSIONAL')
  when 'SERDIK' then upper(btrim(coalesce(p_code,''))) in
    ('SERDIK','SERTIFIKAT_PENDIDIK')
  when 'PENGALAMAN_2TH' then upper(btrim(coalesce(p_code,''))) in
    ('PENGALAMAN_2TH','SK_PENGALAMAN_MENGAJAR')
  when 'SKP_TAHUN_1' then upper(btrim(coalesce(p_code,''))) in
    ('SKP_TAHUN_1','SKP_1')
  when 'SKP_TAHUN_2' then upper(btrim(coalesce(p_code,''))) in
    ('SKP_TAHUN_2','SKP_2')
  when 'SK_PPPK' then upper(btrim(coalesce(p_code,'')))='SK_PPPK'
  when 'SK_PPPK_PW' then upper(btrim(coalesce(p_code,''))) in ('SK_PPPK_PW','SK_PPPK_PARUH_WAKTU')
  when 'SURAT_TUGAS' then upper(btrim(coalesce(p_code,'')))='SURAT_TUGAS'
  else false end;
$$;
revoke all on function private.smartgtk_cabinet_code_matches(text,text) from public,anon,authenticated;

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
 order by sf.created_at desc,sf.id desc
 limit 100;
end;
$$;

create or replace function public.smartgtk_import_cabinet(p_type text,p_file_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v public.smartgtk_intake%rowtype; sf public.submission_files%rowtype;
begin
 if p_file_id is null then raise exception 'Pilih dokumen terlebih dahulu';end if;
 select * into v from public.smartgtk_intake where owner_id=auth.uid() for update;
 if not found then raise exception 'Isi SMART-GTK dahulu';end if;
 if not private.smartgtk_current_user_can_participate() then
  raise exception 'Akses pengisian SMART-GTK belum aktif';end if;
 if not private.smartgtk_cabinet_type_allowed(v.employment,p_type) then
  raise exception 'Kelompok atau jenis dokumen tidak diizinkan';end if;
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
     cabinet_file_id=excluded.cabinet_file_id,uploaded_at=now();
 update public.smartgtk_intake set data_stage='DRAFT' where owner_id=auth.uid();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(auth.uid(),auth.uid(),'CABINET_FILE_LINKED_'||p_type);
 return jsonb_build_object('linked',true,'doc_type',p_type,'file_id',sf.id,
   'verified',false,'needs_dinas_review',true);
end;
$$;

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

create or replace function public.smartgtk_mass_register_file(p_type text,p_path text)
returns void language plpgsql security definer set search_path=''
as $$
declare v public.smartgtk_intake%rowtype; valid_types text[];
begin
 select * into v from public.smartgtk_intake where owner_id=auth.uid() for update;
 if not found then raise exception 'Isi SMART-GTK dahulu sebelum unggah dokumen'; end if;
 if not exists(select 1 from public.smartgtk_pilot_users where owner_id=auth.uid() and enabled)
 then raise exception 'Akun belum ditetapkan sebagai peserta SMART-GTK';end if;
 if v.employment='PNS' then
  valid_types:=array['SK_KP','IJAZAH_TERAKHIR','SK_JF','SERDIK','PENGALAMAN_2TH','SKP_TAHUN_1','SKP_TAHUN_2'];
 elsif v.employment='PPPK' then
  valid_types:=array['SK_PPPK','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS'];
 elsif v.employment='PPPK_PW' then
  valid_types:=array['SK_PPPK_PW','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS'];
 else raise exception 'Kelompok ini tidak mengunggah dokumen SMART-GTK';end if;
 if p_type is null or p_type <> all(valid_types) then raise exception 'Jenis dokumen tidak sesuai status kerja'; end if;
 if p_path is null or p_path not like auth.uid()::text||'/'||p_type||'/%'
 or split_part(p_path,'/',3) !~ '^[a-f0-9-]{36}\.(pdf|jpg|png)$'
 or array_length(string_to_array(p_path,'/'),1)<>3 then
  raise exception 'Lokasi dokumen tidak sesuai pemilik dan jenis berkas';end if;
 if not exists(select 1 from storage.objects
   where bucket_id='simantab-smartgtk-private' and name=p_path) then
   raise exception 'Berkas tidak ditemukan di penyimpanan privat';end if;
 insert into public.smartgtk_documents(owner_id,doc_type,storage_path,source_bucket,cabinet_file_id)
 values(auth.uid(),p_type,p_path,'simantab-smartgtk-private',null)
 on conflict(owner_id,doc_type) do update set storage_path=excluded.storage_path,source_bucket='simantab-smartgtk-private',cabinet_file_id=null,uploaded_at=now();
 update public.smartgtk_intake set data_stage='DRAFT' where owner_id=auth.uid();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(auth.uid(),auth.uid(),'EVIDENCE_REGISTERED_'||p_type);
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

revoke all on function public.smartgtk_cabinet_candidates(text) from public,anon;
revoke all on function public.smartgtk_import_cabinet(text,uuid) from public,anon;
grant execute on function public.smartgtk_cabinet_candidates(text) to authenticated;
grant execute on function public.smartgtk_import_cabinet(text,uuid) to authenticated;
notify pgrst, 'reload schema';
