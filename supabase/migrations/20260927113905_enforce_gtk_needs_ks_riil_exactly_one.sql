alter table public.school_gtk_needs
  drop constraint if exists school_gtk_needs_ks_riil_exactly_one;

alter table public.school_gtk_needs
  add constraint school_gtk_needs_ks_riil_exactly_one
  check (
    upper(coalesce(job_code,'')) <> 'KEPALA_SEKOLAH'
    or (
      coalesce(pns,0)+coalesce(pppk,0)+coalesce(pppk_pw,0)=1
      and coalesce(non_asn_before_2024,0)+coalesce(non_asn_after_2024,0)=0
    )
  ) not valid;

create or replace function private.guard_gtk_needs_ks_riil_before_submit()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_asn integer;
  v_non integer;
begin
  if new.status <> 'SUBMITTED' then
    return new;
  end if;

  select
    coalesce(pns,0)+coalesce(pppk,0)+coalesce(pppk_pw,0),
    coalesce(non_asn_before_2024,0)+coalesce(non_asn_after_2024,0)
  into v_asn,v_non
  from public.school_gtk_needs
  where school_npsn=new.school_npsn
    and upper(coalesce(job_code,''))='KEPALA_SEKOLAH'
  limit 1;

  if v_asn is null then
    raise exception 'Baris Kepala Sekolah wajib tersedia. Isian riil KS harus tepat 1.';
  end if;

  if v_asn <> 1 or coalesce(v_non,0) <> 0 then
    raise exception 'Isian riil Kepala Sekolah wajib tepat 1 ASN (PNS/PPPK/PPPK PW). Tidak boleh 0, lebih dari 1, atau diisi sebagai Non-ASN.';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_gtk_needs_ks_riil_before_submit() from public, anon, authenticated;

drop trigger if exists trg_guard_gtk_needs_ks_riil_before_submit on public.school_gtk_needs_workflow;
create trigger trg_guard_gtk_needs_ks_riil_before_submit
before insert or update of status on public.school_gtk_needs_workflow
for each row
when (new.status='SUBMITTED')
execute function private.guard_gtk_needs_ks_riil_before_submit();

create or replace function private.mark_gtk_needs_draft()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_npsn text;
begin
  v_npsn := coalesce(new.school_npsn, old.school_npsn);
  if v_npsn is not null then
    insert into public.school_gtk_needs_workflow(
      school_npsn,status,note,submitted_at,submitted_by,verified_at,verified_by,updated_at,
      kabid_approved_at,kabid_approved_by,kabid_approval_mode,kabid_approval_note
    ) values (
      v_npsn,'DRAFT',null,null,null,null,null,now(),
      null,null,null,null
    )
    on conflict (school_npsn) do update set
      status='DRAFT', note=null, submitted_at=null, submitted_by=null,
      verified_at=null, verified_by=null,
      kabid_approved_at=null, kabid_approved_by=null,
      kabid_approval_mode=null, kabid_approval_note=null,
      updated_at=now();
  end if;
  return coalesce(new,old);
end;
$$;

revoke all on function private.mark_gtk_needs_draft() from public, anon, authenticated;

create or replace function public.gtk_needs_submit()
returns public.school_gtk_needs_workflow
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_npsn text;
  v_role text;
  v_ks_abk integer;
  v_ks_asn integer;
  v_ks_non integer;
  v_row public.school_gtk_needs_workflow;
begin
  select p.school_npsn, p.role
  into v_npsn, v_role
  from public.profiles p
  where p.id=auth.uid() and p.is_active=true;

  if v_role <> 'KEPALA_SEKOLAH' or v_npsn is null then
    raise exception 'Hanya Kepala Sekolah dengan NPSN aktif yang dapat mengajukan data.';
  end if;

  if not private.is_negeri_school(v_npsn) then
    raise exception 'Kebutuhan GTK Riil hanya berlaku untuk sekolah negeri.';
  end if;

  if not exists (
    select 1 from public.school_gtk_needs n
    where n.school_npsn=v_npsn
  ) then
    raise exception 'Belum ada data Kebutuhan GTK Riil untuk diajukan.';
  end if;

  select
    n.abk,
    coalesce(n.pns,0)+coalesce(n.pppk,0)+coalesce(n.pppk_pw,0),
    coalesce(n.non_asn_before_2024,0)+coalesce(n.non_asn_after_2024,0)
  into v_ks_abk,v_ks_asn,v_ks_non
  from public.school_gtk_needs n
  where n.school_npsn=v_npsn
    and upper(coalesce(n.job_code,''))='KEPALA_SEKOLAH'
  limit 1;

  if v_ks_abk is null then
    raise exception 'Baris Kepala Sekolah wajib tersedia.';
  end if;

  if v_ks_abk <> 1 then
    raise exception 'ABK Kepala Sekolah wajib 1.';
  end if;

  if v_ks_asn <> 1 or coalesce(v_ks_non,0) <> 0 then
    raise exception 'Isian riil Kepala Sekolah wajib tepat 1 ASN (PNS/PPPK/PPPK PW). Tidak boleh 0, lebih dari 1, atau diisi sebagai Non-ASN.';
  end if;

  insert into public.school_gtk_needs_workflow(
    school_npsn,status,note,submitted_at,submitted_by,verified_at,verified_by,updated_at,
    kabid_approved_at,kabid_approved_by,kabid_approval_mode,kabid_approval_note
  ) values (
    v_npsn,'SUBMITTED',null,now(),auth.uid(),null,null,now(),
    null,null,null,null
  )
  on conflict (school_npsn) do update set
    status='SUBMITTED',
    note=null,
    submitted_at=now(),
    submitted_by=auth.uid(),
    verified_at=null,
    verified_by=null,
    kabid_approved_at=null,
    kabid_approved_by=null,
    kabid_approval_mode=null,
    kabid_approval_note=null,
    updated_at=now()
  returning * into v_row;

  return v_row;
end;
$$;

update public.school_gtk_needs_workflow w
set status='REVISION',
    note='⚠ Isian riil Kepala Sekolah wajib tepat 1 ASN (PNS/PPPK/PPPK PW). Perbaiki baris Kepala Sekolah: tidak boleh 0 atau lebih dari 1.',
    verified_at=null,
    verified_by=null,
    kabid_approved_at=null,
    kabid_approved_by=null,
    kabid_approval_mode=null,
    kabid_approval_note=null,
    updated_at=now()
where exists (
  select 1
  from public.school_gtk_needs n
  where n.school_npsn=w.school_npsn
    and upper(coalesce(n.job_code,''))='KEPALA_SEKOLAH'
    and (
      coalesce(n.pns,0)+coalesce(n.pppk,0)+coalesce(n.pppk_pw,0)<>1
      or coalesce(n.non_asn_before_2024,0)+coalesce(n.non_asn_after_2024,0)<>0
    )
);

insert into public.notifications(user_id,title,message,link)
select p.id,
       'Perbaiki Isian Riil Kepala Sekolah',
       'Isian riil Kepala Sekolah pada Kebutuhan GTK Riil wajib tepat 1 ASN. Pilih kondisi faktual: PNS, PPPK, atau PPPK PW. Nilai 0 atau lebih dari 1 tidak dapat diajukan.',
       '#needs'
from public.profiles p
where p.role='KEPALA_SEKOLAH'
  and p.is_active=true
  and exists (
    select 1 from public.school_gtk_needs n
    where n.school_npsn=p.school_npsn
      and upper(coalesce(n.job_code,''))='KEPALA_SEKOLAH'
      and (
        coalesce(n.pns,0)+coalesce(n.pppk,0)+coalesce(n.pppk_pw,0)<>1
        or coalesce(n.non_asn_before_2024,0)+coalesce(n.non_asn_after_2024,0)<>0
      )
  );
