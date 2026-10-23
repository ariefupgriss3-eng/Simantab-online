-- SIMANTAB KS Plt.: preserve school operational responsibility and ASN headcount,
-- while SMART-GTK records the definitive functional duty "Guru".
-- Additive and idempotent: historical KS rows remain BELUM_DITETAPKAN (not presumed definitif).
alter table public.school_gtk_needs
  add column if not exists ks_assignment_status text not null default 'BELUM_DITETAPKAN';

do $constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.school_gtk_needs'::regclass
      and conname='school_gtk_needs_ks_assignment_status_check'
  ) then
    alter table public.school_gtk_needs
      add constraint school_gtk_needs_ks_assignment_status_check
      check (
        ks_assignment_status in ('BELUM_DITETAPKAN','DEFINITIF','PLT')
        and (
          (upper(coalesce(job_code,''))='KEPALA_SEKOLAH'
            and (ks_assignment_status<>'PLT'
              or (pns=1 and pppk=0 and pppk_pw=0)))
          or
          (upper(coalesce(job_code,''))<>'KEPALA_SEKOLAH'
            and ks_assignment_status='BELUM_DITETAPKAN')
        )
      ) not valid;
  end if;
end;
$constraint$;

alter table public.school_gtk_needs
  validate constraint school_gtk_needs_ks_assignment_status_check;

comment on column public.school_gtk_needs.ks_assignment_status is
 'Status penugasan KS (DEFINITIF/PLT), bukan status kepegawaian atau SK jabatan fungsional; BELUM_DITETAPKAN untuk data lama. PLT PNS tetap dihitung pns=1 pada isian Kepala Sekolah.';

-- Retain all existing authorization, education, NIP and status checks in
-- smartgtk_mass_save. Only specialize its existing role-to-profession guard.
do $patch$
declare
  v_def text;
  v_old text :=
    'if v_profile.role=''KEPALA_SEKOLAH'' and p_profession<>''KEPALA_SEKOLAH'' then' || E'\n' ||
    '  raise exception ''Akun Kepala Sekolah wajib memilih jenis tugas Kepala Sekolah''; end if;';
  v_new text :=
    'if v_profile.role=''KEPALA_SEKOLAH'' then' || E'\n' ||
    '  if exists (select 1 from public.school_gtk_needs n' || E'\n' ||
    '    where n.school_npsn=v_profile.school_npsn' || E'\n' ||
    '      and upper(coalesce(n.job_code, ''''))=''KEPALA_SEKOLAH''' || E'\n' ||
    '      and n.ks_assignment_status=''PLT''' || E'\n' ||
    '      and n.pns=1 and n.pppk=0 and n.pppk_pw=0) then' || E'\n' ||
    '    if p_profession<>''GURU'' or p_employment<>''PNS'' then' || E'\n' ||
    '      raise exception ''PNS (Plt.) Kepala Sekolah wajib mencatat tugas utama Guru pada SMART-GTK''; end if;' || E'\n' ||
    '  elsif p_profession<>''KEPALA_SEKOLAH'' then' || E'\n' ||
    '    raise exception ''Akun Kepala Sekolah definitif wajib memilih tugas utama Kepala Sekolah''; end if;' || E'\n' ||
    ' end if; -- SIMANTAB_KS_PLT_PROFESSION_V1';
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='smartgtk_mass_save'
    and p.pronargs=14;
  if v_def is null then
    raise exception 'smartgtk_mass_save 14-arg function not found';
  end if;
  if position('SIMANTAB_KS_PLT_PROFESSION_V1' in v_def)>0 then
    return;
  end if;
  if position(v_old in v_def)=0 then
    raise exception 'SMART-GTK role guard changed: migration refused to replace it blindly';
  end if;
  execute replace(v_def,v_old,v_new);
end;
$patch$;
