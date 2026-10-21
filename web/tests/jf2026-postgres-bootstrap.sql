-- Ephemeral PostgreSQL fixture, never run against SIMANTAB production.
create role authenticated nologin;
create role anon nologin;
create schema if not exists auth;
create schema if not exists storage;
create extension if not exists pgcrypto;
create table auth.users(id uuid primary key,last_sign_in_at timestamptz);
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create table public.profiles (
 id uuid primary key references auth.users(id),
 role text not null,
 account_channel text not null default 'GTK',
 approval_status text not null default 'APPROVED',
 is_active boolean not null default true,
 full_name text,
 unit text,
 unit_gtk text,
 nip text
);
create table storage.buckets (
 id text primary key,
 name text not null,
 public boolean not null,
 file_size_limit bigint,
 allowed_mime_types text[]
);
create table storage.objects (
 id bigint generated always as identity primary key,
 bucket_id text not null references storage.buckets(id),
 name text not null unique
);
alter table storage.objects enable row level security;
grant usage on schema public,auth,storage to authenticated;
grant select,insert on storage.objects to authenticated;
insert into auth.users(id) values
('00000000-0000-4000-8000-000000000001'),
('00000000-0000-4000-8000-000000000002'),
('00000000-0000-4000-8000-000000000003'),
('00000000-0000-4000-8000-000000000004');
insert into public.profiles(id,role,account_channel,approval_status,nip) values
('00000000-0000-4000-8000-000000000001','GTK','GTK','APPROVED','198001012006042001'),
('00000000-0000-4000-8000-000000000002','GTK','GTK','APPROVED','198201012007042002'),
('00000000-0000-4000-8000-000000000003','KABID','DINAS','APPROVED','198301012008042003'),
('00000000-0000-4000-8000-000000000004','STAFF_USUL_SK','DINAS','APPROVED','198401012009042004');
