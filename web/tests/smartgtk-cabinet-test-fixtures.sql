-- Test-only Lemari Dokumenku shim; the real SIMANTAB database already has both tables.
\set ON_ERROR_STOP on
create table public.submission_files(
 id uuid primary key,
 user_id uuid not null references auth.users(id),
 storage_path text not null,
 file_name text not null,
 file_size bigint,
 mime_type text,
 requirement_code text,
 created_at timestamptz not null default now()
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('simantab-documents','simantab-documents',false,1572864,array['application/pdf','image/jpeg','image/png']);
insert into storage.objects(bucket_id,name) values
 ('simantab-documents','00000000-0000-4000-8000-000000000005/example/owner-sk.pdf'),
 ('simantab-documents','00000000-0000-4000-8000-000000000005/example/owner-ijazah.pdf'),
 ('simantab-documents','00000000-0000-4000-8000-000000000005/example/too-big.pdf'),
 ('simantab-documents','00000000-0000-4000-8000-000000000006/example/another-owner.pdf'),
 ('simantab-documents','00000000-0000-4000-8000-000000000005/example/unrelated-skck.pdf');
insert into public.submission_files(id,user_id,storage_path,file_name,file_size,mime_type,requirement_code)
values
 ('00000000-0000-4000-8000-000000000051','00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000005/example/owner-sk.pdf','SK JF Guru - Uji.pdf',750000,'application/pdf','SK_JF'),
 ('00000000-0000-4000-8000-000000000052','00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000005/example/owner-ijazah.pdf','Ijazah - Uji.pdf',850000,'application/pdf','IJAZAH_TERAKHIR'),
 ('00000000-0000-4000-8000-000000000053','00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000005/example/too-big.pdf','File > 1.5 MB.pdf',1700000,'application/pdf','SK_KP'),
 ('00000000-0000-4000-8000-000000000054','00000000-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000006/example/another-owner.pdf','Private Other Person.pdf',500000,'application/pdf','SK_JF'),
 ('00000000-0000-4000-8000-000000000055','00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000005/example/unrelated-skck.pdf','SKCK for other service.pdf',510000,'application/pdf','SKCK');

-- CI fixture only; the real submission_files table keeps its production RLS.
grant select on public.submission_files to authenticated;
