-- JF Guru 2026: legacy SLTA and SPG for NOMENKLATUR recording only.
-- Existing records are preserved; the PENGANGKATAN S-1/D-IV gate stays unchanged.
-- Apply after base migration and GTK-only security migration; QA first, not production automatically.
alter table public.jf2026_cases drop constraint if exists jf2026_cases_education_check;
alter table public.jf2026_cases add constraint jf2026_cases_education_check
  check (education in ('SLTA','SPG','DI','DII','DIII','S1','DIV'));

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
 if not exists(select 1 from public.profiles where id=auth.uid() and nip=p_nip)
 then raise exception 'NIP harus sama dengan Profil GTK terverifikasi. Lengkapi profil terlebih dahulu'; end if;
 if p_pathway not in ('NOMENKLATUR','PENGANGKATAN')
 or p_education not in ('SLTA','SPG','DI','DII','DIII','S1','DIV')
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

comment on constraint jf2026_cases_education_check on public.jf2026_cases is
 'SLTA/SPG recorded for manual review of legacy nomenclature only; not a qualification determination.';
