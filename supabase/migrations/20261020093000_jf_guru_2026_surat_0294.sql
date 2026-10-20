-- SIMANTAB JF Guru 2026 — Surat Dirjen GTK 0294/B/B.B1/HK.07.00/2026
-- STAGING migration. Do not run on production before QA, backup, and feature approval.
-- Isolated from existing E_JABFUNG submissions; no automatic migration or SK issuance.
create schema if not exists private;

create table if not exists public.jf2026_cases (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 pathway text not null check(pathway in ('NOMENKLATUR','PENGANGKATAN')),
 full_name text not null check(length(btrim(full_name)) between 3 and 160),
 nip text not null check(nip ~ '^[0-9]{18}$'),
 unit_work text not null check(length(btrim(unit_work)) between 2 and 200),
 old_position text not null default '',
 rank_group text not null default '',
 education text not null check(education in ('DI','DII','DIII','S1','DIV')),
 birth_date date,
 pns_formasi_jf boolean not null default false,
 notes text not null default '' check(length(notes)<=2000),
 status text not null default 'DRAFT' check(status in ('DRAFT','SUBMITTED','PERBAIKAN','VERIFIED','DISETUJUI_DINAS','DIKIRIM_BKPSDM','SK_TERBIT')),
 sk_number text,
 sk_date date,
 submitted_at timestamptz,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 unique(owner_id,pathway),
 unique(nip,pathway),
 constraint jf2026_sk_evidence_check check ((status <> 'SK_TERBIT') or (sk_number is not null and sk_date is not null))
);
create index if not exists jf2026_case_status_idx on public.jf2026_cases(pathway,status,updated_at desc);
create index if not exists jf2026_case_owner_idx on public.jf2026_cases(owner_id);

create table if not exists public.jf2026_documents (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.jf2026_cases(id) on delete restrict,
 code text not null check(code in ('SK_JF','SK_KP','IJAZAH_TERAKHIR','SERDIK','PENGALAMAN_2TH','SKP_TAHUN_1','SKP_TAHUN_2','SK_PENETAPAN')),
 storage_path text not null unique,
 file_name text not null,
 mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg')),
 file_size bigint not null check(file_size between 1 and 1572864),
 uploaded_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(case_id,code)
);

create table if not exists public.jf2026_events (
 id bigint generated always as identity primary key,
 case_id uuid not null references public.jf2026_cases(id) on delete restrict,
 actor_id uuid not null references auth.users(id),
 action text not null,
 from_status text,
 to_status text,
 note text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists jf2026_events_case_idx on public.jf2026_events(case_id,created_at desc);

create or replace function private.jf2026_is_officer()
returns boolean language sql stable security definer set search_path=''
as $$
select exists(
 select 1 from public.profiles p
 where p.id=auth.uid() and p.is_active=true and p.approval_status='APPROVED'
   and p.account_channel='DINAS'
   and p.role in ('SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_USUL_SK','STAFF_PROMOSI')
);
$$;
revoke all on function private.jf2026_is_officer() from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.jf2026_is_officer() to authenticated;

alter table public.jf2026_cases enable row level security;
alter table public.jf2026_documents enable row level security;
alter table public.jf2026_events enable row level security;

revoke all on public.jf2026_cases,public.jf2026_documents,public.jf2026_events from public,anon,authenticated;
grant select on public.jf2026_cases,public.jf2026_documents,public.jf2026_events to authenticated;
grant insert,update on public.jf2026_documents to authenticated;

create policy jf2026_cases_read on public.jf2026_cases for select to authenticated
using(owner_id=auth.uid() or (select private.jf2026_is_officer()));
create policy jf2026_docs_read on public.jf2026_documents for select to authenticated
using(exists(select 1 from public.jf2026_cases c where c.id=case_id and (c.owner_id=auth.uid() or (select private.jf2026_is_officer()))));
create policy jf2026_events_read on public.jf2026_events for select to authenticated
using(exists(select 1 from public.jf2026_cases c where c.id=case_id and (c.owner_id=auth.uid() or (select private.jf2026_is_officer()))));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('simantab-jf-guru-2026','simantab-jf-guru-2026',false,1572864,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy jf2026_storage_read on storage.objects for select to authenticated
using(
 bucket_id='simantab-jf-guru-2026' and exists(
 select 1 from public.jf2026_cases c
 where c.id::text=split_part(name,'/',2)
 and c.owner_id::text=split_part(name,'/',1)
 and (c.owner_id=auth.uid() or (select private.jf2026_is_officer()))
 )
);
create policy jf2026_storage_insert on storage.objects for insert to authenticated
with check(
 bucket_id='simantab-jf-guru-2026' and exists(
 select 1 from public.jf2026_cases c
 where c.id::text=split_part(name,'/',2)
 and c.owner_id::text=split_part(name,'/',1)
 and (
  (c.owner_id=auth.uid() and c.status in ('DRAFT','PERBAIKAN'))
  or ((select private.jf2026_is_officer()) and c.status='DIKIRIM_BKPSDM' and split_part(name,'/',3) like 'SK_PENETAPAN-%')
 )
 )
);
-- Neither users nor officers can overwrite/delete originals in storage; new upload names are UUID-based.

create or replace function private.jf2026_document_guard() returns trigger
language plpgsql security definer set search_path=''
as $$
declare c public.jf2026_cases%rowtype;
begin
 select * into c from public.jf2026_cases where id=new.case_id;
 if not found then raise exception 'Berkas tidak terkait kasus'; end if;
 if split_part(new.storage_path,'/',1)<>c.owner_id::text or split_part(new.storage_path,'/',2)<>c.id::text
 or split_part(new.storage_path,'/',3) not like new.code||'-%'
 then raise exception 'Lokasi berkas tidak sah'; end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='simantab-jf-guru-2026' and o.name=new.storage_path)
 then raise exception 'Berkas belum ada di penyimpanan'; end if;
 if new.uploaded_by<>auth.uid() then raise exception 'Pengunggah tidak sesuai sesi'; end if;
 if new.code='SK_PENETAPAN' then
   if not(private.jf2026_is_officer() and c.status='DIKIRIM_BKPSDM') then raise exception 'Bukti SK hanya boleh diunggah petugas pada tahap BKPSDM'; end if;
 else
   if not(c.owner_id=auth.uid() and c.status in ('DRAFT','PERBAIKAN')) then raise exception 'Perubahan berkas ditolak'; end if;
 end if;
 if tg_op='UPDATE' and (old.case_id<>new.case_id or old.code<>new.code) then raise exception 'Identitas berkas tidak dapat diubah'; end if;
 new.created_at=now();
 return new;
end;
$$;
create trigger jf2026_document_guard before insert or update on public.jf2026_documents
for each row execute function private.jf2026_document_guard();

create policy jf2026_docs_insert on public.jf2026_documents for insert to authenticated
with check(
 uploaded_by=auth.uid() and exists(
 select 1 from public.jf2026_cases c where c.id=case_id and
 ((code<>'SK_PENETAPAN' and c.owner_id=auth.uid() and c.status in ('DRAFT','PERBAIKAN'))
 or (code='SK_PENETAPAN' and c.status='DIKIRIM_BKPSDM' and (select private.jf2026_is_officer())))
 )
);
create policy jf2026_docs_update on public.jf2026_documents for update to authenticated
using(
 exists(select 1 from public.jf2026_cases c where c.id=case_id and
 ((code<>'SK_PENETAPAN' and c.owner_id=auth.uid() and c.status in ('DRAFT','PERBAIKAN'))
 or (code='SK_PENETAPAN' and c.status='DIKIRIM_BKPSDM' and (select private.jf2026_is_officer())))
 )
)
with check(
 uploaded_by=auth.uid() and exists(select 1 from public.jf2026_cases c where c.id=case_id and
 ((code<>'SK_PENETAPAN' and c.owner_id=auth.uid() and c.status in ('DRAFT','PERBAIKAN'))
 or (code='SK_PENETAPAN' and c.status='DIKIRIM_BKPSDM' and (select private.jf2026_is_officer())))
 )
);

create or replace function public.jf2026_save_case(
 p_id uuid, p_pathway text, p_full_name text, p_nip text, p_unit_work text,
 p_old_position text, p_rank_group text, p_education text, p_birth_date date,
 p_pns_formasi_jf boolean, p_notes text
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_status text;
begin
 if auth.uid() is null then raise exception 'Login diperlukan'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active and approval_status='APPROVED')
 then raise exception 'Akun belum disetujui'; end if;
 if p_pathway not in ('NOMENKLATUR','PENGANGKATAN')
 or p_education not in ('DI','DII','DIII','S1','DIV')
 or btrim(coalesce(p_full_name,''))='' or btrim(coalesce(p_unit_work,''))=''
 or p_nip !~ '^[0-9]{18}$'
 then raise exception 'Identitas, NIP, kategori atau pendidikan tidak sah'; end if;
 if length(p_full_name)>160 or length(p_unit_work)>200 or length(coalesce(p_notes,''))>2000
 then raise exception 'Panjang kolom melebihi batas'; end if;
 if p_education not in ('S1','DIV') and p_pathway='PENGANGKATAN'
 then raise exception 'Jalur pengangkatan mensyaratkan S-1/D-IV'; end if;
 if p_id is null then
  insert into public.jf2026_cases
    (owner_id,pathway,full_name,nip,unit_work,old_position,rank_group,education,birth_date,pns_formasi_jf,notes)
  values (auth.uid(),p_pathway,btrim(p_full_name),p_nip,btrim(p_unit_work),left(coalesce(p_old_position,''),160),
          left(coalesce(p_rank_group,''),20),p_education,p_birth_date,coalesce(p_pns_formasi_jf,false),coalesce(p_notes,''))
  returning id into v_id;
  insert into public.jf2026_events(case_id,actor_id,action,to_status,note)
  values(v_id,auth.uid(),'CREATE','DRAFT','Kasus dibuat oleh pemohon');
 else
  select status into v_status from public.jf2026_cases where id=p_id and owner_id=auth.uid() and pathway=p_pathway for update;
  if not found or v_status not in ('DRAFT','PERBAIKAN') then raise exception 'Kasus tidak dapat diedit'; end if;
  update public.jf2026_cases set full_name=btrim(p_full_name),nip=p_nip,unit_work=btrim(p_unit_work),
   old_position=left(coalesce(p_old_position,''),160),rank_group=left(coalesce(p_rank_group,''),20),
   education=p_education,birth_date=p_birth_date,pns_formasi_jf=coalesce(p_pns_formasi_jf,false),
   notes=coalesce(p_notes,''),updated_at=now() where id=p_id;
  v_id:=p_id;
  insert into public.jf2026_events(case_id,actor_id,action,from_status,to_status,note)
  values(v_id,auth.uid(),'SAVE_DRAFT',v_status,v_status,'Perubahan data pemohon');
 end if;
 return v_id;
end;
$$;

create or replace function public.jf2026_submit_case(p_case_id uuid) returns text
language plpgsql security definer set search_path=''
as $$
declare c public.jf2026_cases%rowtype; required_code text; required_codes text[];
begin
 select * into c from public.jf2026_cases where id=p_case_id and owner_id=auth.uid() for update;
 if not found or c.status not in ('DRAFT','PERBAIKAN') then raise exception 'Usulan tidak dapat dikirim'; end if;
 if c.pathway='PENGANGKATAN' then
   if not c.pns_formasi_jf or c.birth_date is null or c.education not in ('S1','DIV')
   or c.rank_group not in ('III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e')
   then raise exception 'Periksa status PNS formasi Guru, usia, pendidikan, dan golongan minimal III/a'; end if;
   required_codes:=array['SK_KP','IJAZAH_TERAKHIR','SERDIK','PENGALAMAN_2TH','SKP_TAHUN_1','SKP_TAHUN_2'];
 else
   if btrim(c.old_position)='' or btrim(c.rank_group)='' then raise exception 'Jabatan dan golongan lama harus diisi'; end if;
   required_codes:=array['SK_JF','SK_KP','IJAZAH_TERAKHIR'];
 end if;
 foreach required_code in array required_codes loop
   if not exists(select 1 from public.jf2026_documents d
      join storage.objects o on o.bucket_id='simantab-jf-guru-2026' and o.name=d.storage_path
      where d.case_id=c.id and d.code=required_code)
   then raise exception 'Berkas wajib belum tersedia: %',required_code; end if;
 end loop;
 update public.jf2026_cases set status='SUBMITTED',submitted_at=now(),updated_at=now() where id=c.id;
 insert into public.jf2026_events(case_id,actor_id,action,from_status,to_status)
 values(c.id,auth.uid(),'SUBMIT',c.status,'SUBMITTED');
 return 'SUBMITTED';
end;
$$;

create or replace function public.jf2026_transition(
 p_case_id uuid, p_next_status text, p_note text default '',
 p_sk_number text default null, p_sk_date date default null
) returns text language plpgsql security definer set search_path=''
as $$
declare c public.jf2026_cases%rowtype;
begin
 if not private.jf2026_is_officer() then raise exception 'Hanya petugas Dinas berwenang'; end if;
 select * into c from public.jf2026_cases where id=p_case_id for update;
 if not found then raise exception 'Kasus tidak ditemukan'; end if;
 if not (
  (c.status='SUBMITTED' and p_next_status in ('VERIFIED','PERBAIKAN')) or
  (c.status='VERIFIED' and p_next_status in ('DISETUJUI_DINAS','PERBAIKAN')) or
  (c.status='DISETUJUI_DINAS' and p_next_status in ('DIKIRIM_BKPSDM','PERBAIKAN')) or
  (c.status='DIKIRIM_BKPSDM' and p_next_status in ('SK_TERBIT','PERBAIKAN'))
 ) then raise exception 'Peralihan status tidak diperbolehkan'; end if;
 if p_next_status='PERBAIKAN' and length(btrim(coalesce(p_note,'')))<5
 then raise exception 'Alasan perbaikan wajib dicantumkan'; end if;
 if p_next_status='SK_TERBIT' then
  if length(btrim(coalesce(p_sk_number,'')))<3 or p_sk_date is null
  then raise exception 'Nomor dan tanggal SK wajib diisi'; end if;
  if not exists(select 1 from public.jf2026_documents d join storage.objects o
   on o.bucket_id='simantab-jf-guru-2026' and o.name=d.storage_path
   where d.case_id=c.id and d.code='SK_PENETAPAN')
  then raise exception 'Bukti SK penetapan belum diunggah'; end if;
 end if;
 update public.jf2026_cases set status=p_next_status, updated_at=now(),
 sk_number=case when p_next_status='SK_TERBIT' then btrim(p_sk_number) else sk_number end,
 sk_date=case when p_next_status='SK_TERBIT' then p_sk_date else sk_date end
 where id=c.id;
 insert into public.jf2026_events(case_id,actor_id,action,from_status,to_status,note)
 values(c.id,auth.uid(),'OFFICER_TRANSITION',c.status,p_next_status,left(coalesce(p_note,''),2000));
 return p_next_status;
end;
$$;
revoke all on function public.jf2026_save_case(uuid,text,text,text,text,text,text,text,date,boolean,text) from public,anon;
revoke all on function public.jf2026_submit_case(uuid) from public,anon;
revoke all on function public.jf2026_transition(uuid,text,text,text,date) from public,anon;
grant execute on function public.jf2026_save_case(uuid,text,text,text,text,text,text,text,date,boolean,text) to authenticated;
grant execute on function public.jf2026_submit_case(uuid) to authenticated;
grant execute on function public.jf2026_transition(uuid,text,text,text,date) to authenticated;

comment on table public.jf2026_cases is 'Surat 0294/2026: dua jalur terpisah. Bukti SK dan proses BKPSDM dicatat manual; tidak ada integrasi BKN otomatis.';
