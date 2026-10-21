-- Narrow legacy-code alias, never inferred from arbitrary filename alone.
-- Former Jabfung service used SK_JABATAN_SEBELUMNYA for SK JABFUNG TERAKHIR files.
-- This is a candidate for GTK manual linking, not administrative document verification.
create or replace function private.smartgtk_cabinet_file_matches(
 p_type text,p_code text,p_name text
) returns boolean language sql immutable set search_path=''
as $$
 select private.smartgtk_cabinet_code_matches(p_type,p_code)
  or (p_type='SK_JF'
    and upper(btrim(coalesce(p_code,'')))='SK_JABATAN_SEBELUMNYA'
    and upper(regexp_replace(coalesce(p_name,''),'[^[:alnum:]]+',' ','g'))
      ~ '(^| )SK (JABFUNG|JF|JABATAN FUNGSIONAL) TERAKHIR( |$)');
$$;
revoke all on function private.smartgtk_cabinet_file_matches(text,text,text)
 from public,anon,authenticated;

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
   and private.smartgtk_cabinet_file_matches(p_type,sf.requirement_code,sf.file_name)
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
 if not private.smartgtk_cabinet_file_matches(p_type,sf.requirement_code,sf.file_name) then
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
          and private.smartgtk_cabinet_file_matches(d.doc_type,sf.requirement_code,sf.file_name)))) then missing:=array_append(missing,t);end if;
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
          and private.smartgtk_cabinet_file_matches(d.doc_type,sf.requirement_code,sf.file_name)))),
   cardinality(public.smartgtk_mass_required_docs(v.profession,v.employment,v.jf_sk,
    v.nomenclature_updated,v.pns_jf_formation,v.education,v.old_position)),
   v.updated_at
 from public.smartgtk_intake v order by v.updated_at desc,v.owner_id
 limit 50 offset (p_page::bigint*50);
end;
$$;

notify pgrst, 'reload schema';
