-- SIMANTAB RGTK Monitoring v1
-- Non-destructive schema for monitoring only. RGTK remains the official source of ratings/predicates.
create table if not exists public.rgtk_cycles (
 id uuid primary key default gen_random_uuid(), year integer not null, label text not null,
 actor_type text not null check (actor_type in ('GURU','KEPALA_SEKOLAH','PENGAWAS','PENILIK')),
 status text not null default 'ACTIVE' check (status in ('DRAFT','ACTIVE','CLOSED')),
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(year,actor_type)
);
create table if not exists public.rgtk_people (
 id uuid primary key default gen_random_uuid(), profile_id uuid references public.profiles(id) on delete set null,
 nip text, full_name text not null,
 actor_type text not null check (actor_type in ('GURU','KEPALA_SEKOLAH','PENGAWAS','PENILIK')),
 scope_level text,
 employment_status text not null default 'AKTIF' check (employment_status in ('AKTIF','PENSIUN','MUTASI','MENINGGAL','NONAKTIF_LAIN')),
 is_cycle_target boolean not null default true, source_note text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists rgtk_people_actor_nip_uq on public.rgtk_people(actor_type,nip) where nip is not null and btrim(nip)<>'';
create index if not exists rgtk_people_profile_idx on public.rgtk_people(profile_id);
create index if not exists rgtk_people_actor_status_idx on public.rgtk_people(actor_type,employment_status,is_cycle_target);
create table if not exists public.rgtk_import_batches (
 id uuid primary key default gen_random_uuid(), cycle_id uuid not null references public.rgtk_cycles(id) on delete cascade,
 source_kind text not null check (source_kind in ('PERENCANAAN','PEMANTAUAN','REKOMENDASI','MASTER')),
 source_file_name text, record_count integer not null default 0 check (record_count>=0),
 active_count integer not null default 0 check (active_count>=0), nonactive_count integer not null default 0 check (nonactive_count>=0),
 note text, imported_by uuid references public.profiles(id) on delete set null,
 imported_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index if not exists rgtk_import_batches_cycle_kind_idx on public.rgtk_import_batches(cycle_id,source_kind,imported_at desc);
create table if not exists public.rgtk_source_records (
 id uuid primary key default gen_random_uuid(), import_batch_id uuid not null references public.rgtk_import_batches(id) on delete cascade,
 cycle_id uuid not null references public.rgtk_cycles(id) on delete cascade, person_id uuid references public.rgtk_people(id) on delete set null,
 source_kind text not null, source_key text, raw_name text, raw_nip text,
 raw_status jsonb not null default '{}'::jsonb, raw_payload jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists rgtk_source_records_cycle_idx on public.rgtk_source_records(cycle_id,source_kind);
create index if not exists rgtk_source_records_person_idx on public.rgtk_source_records(person_id);
create table if not exists public.rgtk_progress (
 id uuid primary key default gen_random_uuid(), cycle_id uuid not null references public.rgtk_cycles(id) on delete cascade,
 person_id uuid not null references public.rgtk_people(id) on delete cascade,
 planning_status text not null default 'BELUM_SELESAI' check (planning_status in ('BELUM_SELESAI','SELESAI')),
 practice_stage text not null default 'BELUM_MULAI' check (practice_stage in ('BELUM_MULAI','DISKUSI_PERSIAPAN','PENDAMPINGAN_SATPEN','RENCANA_TINDAK_LANJUT','UPAYA_TINDAK_LANJUT','REFLEKSI_EVALUASI','SELESAI')),
 behavior_status text not null default 'BELUM_SELESAI' check (behavior_status in ('BELUM_SELESAI','SELESAI')),
 competency_status text not null default 'BELUM_SELESAI' check (competency_status in ('BELUM_SELESAI','SELESAI')),
 duty_status text not null default 'BELUM_DIVERIFIKASI' check (duty_status in ('BELUM_DIVERIFIKASI','TERVERIFIKASI')),
 monitoring_status text generated always as (case when practice_stage='SELESAI' and behavior_status='SELESAI' and competency_status='SELESAI' and duty_status='TERVERIFIKASI' then 'SELESAI' else 'BELUM_SELESAI' end) stored,
 practice_rating text, behavior_rating text, performance_predicate text,
 recommendation_status text not null default 'BELUM_DINILAI' check (recommendation_status in ('BELUM_DINILAI','DRAFT','SIAP_DIKIRIM','DIKIRIM')),
 sending_status text not null default 'BELUM_DIKIRIM' check (sending_status in ('BELUM_DIKIRIM','DIKIRIM')),
 source_updated_at timestamptz, import_batch_id uuid references public.rgtk_import_batches(id) on delete set null,
 updated_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(cycle_id,person_id)
);
create index if not exists rgtk_progress_cycle_idx on public.rgtk_progress(cycle_id,monitoring_status,recommendation_status);
create table if not exists public.rgtk_followups (
 id uuid primary key default gen_random_uuid(), cycle_id uuid not null references public.rgtk_cycles(id) on delete cascade,
 person_id uuid not null references public.rgtk_people(id) on delete cascade, issue_type text not null, summary text not null,
 assigned_user_id uuid references public.profiles(id) on delete set null, assigned_role text, due_date date,
 status text not null default 'OPEN' check (status in ('OPEN','DIPROSES','MENUNGGU_PEGAWAI','SELESAI')),
 resolution_note text, created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists rgtk_followups_cycle_status_idx on public.rgtk_followups(cycle_id,status,due_date);
alter table public.rgtk_cycles enable row level security;
alter table public.rgtk_people enable row level security;
alter table public.rgtk_import_batches enable row level security;
alter table public.rgtk_source_records enable row level security;
alter table public.rgtk_progress enable row level security;
alter table public.rgtk_followups enable row level security;
drop policy if exists rgtk_cycles_read on public.rgtk_cycles;
create policy rgtk_cycles_read on public.rgtk_cycles for select using (private."current_role"() in ('SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN','PENGAWAS'));
drop policy if exists rgtk_cycles_write on public.rgtk_cycles;
create policy rgtk_cycles_write on public.rgtk_cycles for all using (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN')) with check (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN'));
drop policy if exists rgtk_people_read on public.rgtk_people;
create policy rgtk_people_read on public.rgtk_people for select using (private."current_role"() in ('SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN') or (private."current_role"()='PENGAWAS' and profile_id=auth.uid()));
drop policy if exists rgtk_people_write on public.rgtk_people;
create policy rgtk_people_write on public.rgtk_people for all using (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN')) with check (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN'));
drop policy if exists rgtk_batches_read on public.rgtk_import_batches;
create policy rgtk_batches_read on public.rgtk_import_batches for select using (private."current_role"() in ('SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN'));
drop policy if exists rgtk_batches_write on public.rgtk_import_batches;
create policy rgtk_batches_write on public.rgtk_import_batches for all using (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN')) with check (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN'));
drop policy if exists rgtk_source_read on public.rgtk_source_records;
create policy rgtk_source_read on public.rgtk_source_records for select using (private."current_role"() in ('SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN'));
drop policy if exists rgtk_source_write on public.rgtk_source_records;
create policy rgtk_source_write on public.rgtk_source_records for all using (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN')) with check (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN'));
drop policy if exists rgtk_progress_read on public.rgtk_progress;
create policy rgtk_progress_read on public.rgtk_progress for select using (private."current_role"() in ('SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN') or (private."current_role"()='PENGAWAS' and exists(select 1 from public.rgtk_people p where p.id=person_id and p.profile_id=auth.uid())));
drop policy if exists rgtk_progress_write on public.rgtk_progress;
create policy rgtk_progress_write on public.rgtk_progress for all using (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN')) with check (private."current_role"() in ('SUPER_ADMIN','KABID','STAFF_KP_EKIN'));
drop policy if exists rgtk_followups_read on public.rgtk_followups;
create policy rgtk_followups_read on public.rgtk_followups for select using (private."current_role"() in ('SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN') or (private."current_role"()='PENGAWAS' and exists(select 1 from public.rgtk_people p where p.id=person_id and p.profile_id=auth.uid())));
drop policy if exists rgtk_followups_write on public.rgtk_followups;
create policy rgtk_followups_write on public.rgtk_followups for all using (private."current_role"() in ('SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN')) with check (private."current_role"() in ('SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN'));
grant select on public.rgtk_cycles,public.rgtk_people,public.rgtk_import_batches,public.rgtk_source_records,public.rgtk_progress,public.rgtk_followups to authenticated;
grant insert,update,delete on public.rgtk_cycles,public.rgtk_people,public.rgtk_import_batches,public.rgtk_source_records,public.rgtk_progress,public.rgtk_followups to authenticated;
comment on table public.rgtk_progress is 'Monitoring mirror only. Ratings and performance predicates originate from official RGTK and must not be generated autonomously by SIMANTAB.';
comment on column public.rgtk_progress.monitoring_status is 'Derived from four completion states: practice, behavior, competency, and verified duty.';