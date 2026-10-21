-- SMART-GTK status-aware evidence, draft-first data collection.
-- PNS mandatory evidence gates "complete"; PPPK/PW optional; NON_ASN no file access.
alter table public.smartgtk_intake
 add column if not exists data_stage text not null default 'DRAFT'
 check(data_stage in ('DRAFT','DATA_TERCATAT','BERKAS_LENGKAP'));

create table if not exists public.smartgtk_documents(
 owner_id uuid not null references public.smartgtk_intake(owner_id),
 doc_type text not null,
 storage_path text not null,
 uploaded_at timestamptz not null default now(),
 primary key(owner_id,doc_type),
 constraint smartgtk_doc_types check(doc_type in (
  'SK_KP','IJAZAH_TERAKHIR','SK_JF','SERDIK','PENGALAMAN_2TH',
  'SKP_TAHUN_1','SKP_TAHUN_2','SK_PPPK','SK_PPPK_PW','SURAT_TUGAS')),
 constraint smartgtk_storage_length check(length(storage_path) between 30 and 220)
);
alter table public.smartgtk_documents enable row level security;
revoke all on public.smartgtk_documents from public,anon,authenticated;
grant select on public.smartgtk_documents to authenticated;
create policy smartgtk_doc_owner_or_dinas on public.smartgtk_documents for select to authenticated
 using(owner_id=auth.uid() or (select private.jf2026_is_officer()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('simantab-smartgtk-private','simantab-smartgtk-private',false,1572864,
 array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=1572864,
 allowed_mime_types=array['application/pdf','image/jpeg','image/png'];

-- Only accounts with saved intake (PNS/PPPK/PW) can upload. No uploads for NON_ASN.
create policy smartgtk_upload_own on storage.objects for insert to authenticated
 with check(bucket_id='simantab-smartgtk-private'
  and split_part(name,'/',1)=auth.uid()::text
  and split_part(name,'/',2) in ('SK_KP','IJAZAH_TERAKHIR','SK_JF','SERDIK',
    'PENGALAMAN_2TH','SKP_TAHUN_1','SKP_TAHUN_2','SK_PPPK','SK_PPPK_PW','SURAT_TUGAS')
  and split_part(name,'/',3) ~ '^[a-f0-9-]{36}\.(pdf|jpg|png)$'
  and exists(select 1 from public.smartgtk_intake s where s.owner_id=auth.uid()
    and s.employment in ('PNS','PPPK','PPPK_PW')
    and (s.employment='PNS' and split_part(name,'/',2) in ('SK_KP','IJAZAH_TERAKHIR','SK_JF',
      'SERDIK','PENGALAMAN_2TH','SKP_TAHUN_1','SKP_TAHUN_2')
     or s.employment='PPPK' and split_part(name,'/',2) in ('SK_PPPK','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS')
     or s.employment='PPPK_PW' and split_part(name,'/',2) in ('SK_PPPK_PW','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS'))
   ));
create policy smartgtk_read_own_or_officer on storage.objects for select to authenticated
 using(bucket_id='simantab-smartgtk-private'
   and (split_part(name,'/',1)=auth.uid()::text
    or (select private.jf2026_is_officer())));

create or replace function public.smartgtk_mass_required_docs(
 p_profession text,p_employment text,p_jf_sk text,p_nomen text,p_formation text,p_education text,p_old_position text
) returns text[] language plpgsql stable set search_path=''
as $$
declare classification jsonb; required text[]:=array[]::text[];
begin
 if p_employment<>'PNS' then return required;end if;
 required:=array['SK_KP','IJAZAH_TERAKHIR']::text[];
 classification:=public.smartgtk_mass_classify(p_profession,p_employment,
  p_jf_sk,p_nomen,p_formation,p_education,p_old_position);
 if classification->>'nomenklatur' in ('POTENSI_USUL','PERLU_DATA') and p_jf_sk='YA' then
  required:=array_append(required,'SK_JF');
 end if;
 if classification->>'pengangkatan' in ('POTENSI_USUL','TERTAHAN_KUALIFIKASI')
 then
  required:=required||array['SERDIK','PENGALAMAN_2TH','SKP_TAHUN_1','SKP_TAHUN_2']::text[];
 end if;
 return required;
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
   join storage.objects o on o.bucket_id='simantab-smartgtk-private' and o.name=d.storage_path
   where d.owner_id=v.owner_id and d.doc_type=t) then missing:=array_append(missing,t);end if;
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
 insert into public.smartgtk_documents(owner_id,doc_type,storage_path)
 values(auth.uid(),p_type,p_path)
 on conflict(owner_id,doc_type) do update set storage_path=excluded.storage_path,uploaded_at=now();
 update public.smartgtk_intake set data_stage='DRAFT' where owner_id=auth.uid();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(auth.uid(),auth.uid(),'EVIDENCE_REGISTERED_'||p_type);
end;
$$;

create or replace function public.smartgtk_mass_complete()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare s jsonb;
begin
 if not exists(select 1 from public.smartgtk_pilot_users where owner_id=auth.uid() and enabled)
 then raise exception 'Akun belum ditetapkan sebagai peserta SMART-GTK';end if;
 s:=public.smartgtk_mass_status();
 if s->>'state'='BELUM_MENGISI' then raise exception 'Isi data SMART-GTK lebih dahulu'; end if;
 if s->>'employment'='PNS' and jsonb_array_length(s->'missing')>0 then
  raise exception 'Berkas PNS belum lengkap. Periksa daftar dokumen wajib';end if;
 update public.smartgtk_intake set data_stage=
  case when s->>'employment'='PNS' then 'BERKAS_LENGKAP' else 'DATA_TERCATAT' end,
  updated_at=now() where owner_id=auth.uid();
 insert into public.smartgtk_audit(owner_id,actor_id,action)
 values(auth.uid(),auth.uid(),'DATA_COMPLETENESS_CONFIRMED');
 return public.smartgtk_mass_status();
end;
$$;

-- Officer report never treats classification as an issued SK.
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
      join storage.objects o on o.bucket_id='simantab-smartgtk-private' and o.name=d.storage_path
      where d.owner_id=v.owner_id),
   cardinality(public.smartgtk_mass_required_docs(v.profession,v.employment,v.jf_sk,
    v.nomenclature_updated,v.pns_jf_formation,v.education,v.old_position)),
   v.updated_at
 from public.smartgtk_intake v order by v.updated_at desc,v.owner_id
 limit 50 offset (p_page::bigint*50);
end;
$$;
revoke all on function public.smartgtk_mass_officer_list(integer) from public,anon;
grant execute on function public.smartgtk_mass_officer_list(integer) to authenticated;

revoke all on function public.smartgtk_mass_required_docs(text,text,text,text,text,text,text) from public,anon;
revoke all on function public.smartgtk_mass_status() from public,anon;
revoke all on function public.smartgtk_mass_register_file(text,text) from public,anon;
revoke all on function public.smartgtk_mass_complete() from public,anon;
grant execute on function public.smartgtk_mass_required_docs(text,text,text,text,text,text,text) to authenticated;
grant execute on function public.smartgtk_mass_status() to authenticated;
grant execute on function public.smartgtk_mass_register_file(text,text) to authenticated;
grant execute on function public.smartgtk_mass_complete() to authenticated;

notify pgrst, 'reload schema';
