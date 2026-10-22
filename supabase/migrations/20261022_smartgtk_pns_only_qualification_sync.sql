-- SMART GTK qualification review routing restricted to PNS; do not erase historical reviews.
CREATE OR REPLACE FUNCTION public.smartgtk_mass_save(p_profession text, p_employment text, p_jf_sk text, p_old_position text, p_nomenclature_updated text, p_pns_jf_formation text, p_education text, p_study_status text, p_university text, p_program text, p_start_year integer, p_target_graduation date, p_graduation_date date, p_notes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_profile public.profiles%rowtype; v_existing public.jf2030_qualification%rowtype;
        v_result jsonb;
begin
 select * into v_profile from public.profiles where id=auth.uid()
 and ((account_channel='GTK' and role in ('GTK','KEPALA_SEKOLAH'))
   or (role='PENGAWAS'))
 and approval_status='APPROVED' and is_active=true;
 if not found then raise exception 'Akun GTK/pengawas harus aktif dan disetujui'; end if;
 if p_profession is null or p_profession not in ('GURU','KEPALA_SEKOLAH','PENGAWAS','TENDIK') then
  raise exception 'Jenis tugas GTK wajib dipilih'; end if;
 if v_profile.role='KEPALA_SEKOLAH' and p_profession<>'KEPALA_SEKOLAH' then
  raise exception 'Akun Kepala Sekolah wajib memilih jenis tugas Kepala Sekolah'; end if;
 if v_profile.role='PENGAWAS' and p_profession<>'PENGAWAS' then
  raise exception 'Akun Pengawas wajib memilih jenis tugas Pengawas'; end if;
 if v_profile.role='GTK' and p_profession not in ('GURU','TENDIK') then
  raise exception 'Akun GTK dapat memilih Guru atau Tenaga Kependidikan'; end if;
 if p_employment='PB' and p_profession<>'GURU' then
  raise exception 'Pendamping Belajar (PB) wajib memilih tugas utama Guru';end if;
 if p_employment='PLS' and p_profession<>'TENDIK' then
  raise exception 'Pendamping Layanan Satpen (PLS) wajib memilih tugas utama Tenaga Kependidikan';end if;
 -- Pilot restriction is checked SERVER-SIDE, not inferred from frontend visibility.
 if not private.smartgtk_current_user_can_participate() then
  raise exception 'Akses SMART-GTK belum diaktifkan untuk akun ini'; end if;
 if p_employment in ('PNS','PPPK','PPPK_PW') and coalesce(v_profile.nip,'') !~ '^[0-9]{18}$' then
  raise exception 'GTK ASN harus melengkapi NIP 18 digit di Profil GTK terlebih dahulu';
 end if;
 if coalesce(v_profile.nip,'') ~ '^[0-9]{18}$' and (select count(*) from public.profiles
     where account_channel='GTK' and is_active=true and approval_status='APPROVED'
       and nip=v_profile.nip)>1 then
  raise exception 'NIP terhubung dengan lebih dari satu akun aktif. Hubungi admin untuk rekonsiliasi.';
 end if;
 if p_employment is null or p_employment not in ('PNS','PPPK','PPPK_PW','NON_ASN','PB','PLS','LAINNYA')
 or p_jf_sk is null or p_jf_sk not in ('YA','TIDAK','BELUM_TAHU')
 or p_nomenclature_updated is null or p_nomenclature_updated not in ('YA','TIDAK','BELUM_TAHU','TIDAK_BERLAKU')
 or p_pns_jf_formation is null or p_pns_jf_formation not in ('YA','TIDAK','BELUM_TAHU')
 or p_education is null or p_education not in ('SLTA','SPG','DI','DII','DIII','S1','DIV','S2','S3')
 or p_study_status is null or p_study_status not in ('BELUM_KULIAH','SEDANG_KULIAH','LULUS_BELUM_VERIF','SUDAH_MEMENUHI')
 or (p_education in ('S1','DIV','S2','S3') and p_study_status<>'SUDAH_MEMENUHI')
 or (p_education in ('SLTA','SPG','DI','DII','DIII') and p_study_status='SUDAH_MEMENUHI')
 then raise exception 'Isian status atau pendidikan tidak sesuai'; end if;
 if length(coalesce(p_old_position,''))>160 or length(coalesce(p_university,''))>200
 or length(coalesce(p_program,''))>200 or length(coalesce(p_notes,''))>2000
 then raise exception 'Teks isian terlalu panjang'; end if;
 if p_employment<>'PNS' and (p_pns_jf_formation='YA' or p_nomenclature_updated='YA')
 then raise exception 'Isian formasi dan penyesuaian PNS tidak konsisten'; end if;
 if p_study_status in ('LULUS_BELUM_VERIF','SUDAH_MEMENUHI')
 and (p_graduation_date is null or p_graduation_date>current_date) then
  raise exception 'Tanggal kelulusan yang sudah terjadi wajib diisi'; end if;
 -- Keep existing independently verified diploma immutable.
 select * into v_existing from public.jf2030_qualification where owner_id=auth.uid() for update;
 if p_employment='PNS' and found and v_existing.review_status='TERVERIFIKASI' then
   if v_existing.education_initial is distinct from p_education
      or v_existing.study_status is distinct from p_study_status
      or v_existing.university is distinct from btrim(coalesce(p_university,''))
      or v_existing.study_program is distinct from btrim(coalesce(p_program,''))
      or v_existing.start_year is distinct from p_start_year
      or v_existing.target_graduation is distinct from p_target_graduation
      or v_existing.graduation_date is distinct from p_graduation_date then
     raise exception 'Ijazah terverifikasi berbeda dengan isian baru; minta koreksi melalui Dinas'; end if;
 elsif p_employment='PNS' and v_profile.account_channel='GTK' and coalesce(v_profile.nip,'') ~ '^[0-9]{18}$' and (
     v_existing.owner_id is null
     or v_existing.education_initial is distinct from p_education
     or v_existing.study_status is distinct from p_study_status
     or v_existing.university is distinct from btrim(coalesce(p_university,''))
     or v_existing.study_program is distinct from btrim(coalesce(p_program,''))
     or v_existing.start_year is distinct from p_start_year
     or v_existing.target_graduation is distinct from p_target_graduation
     or v_existing.graduation_date is distinct from p_graduation_date
     or v_existing.notes is distinct from coalesce(p_notes,'')
   ) then
   -- Legacy education 2030 RPC requires NIP. Preserve non-ASN education
   -- in SMART-GTK when they have no valid ASN NIP instead of blocking intake.
   perform public.jf2030_save_progress(p_education,p_study_status,
     coalesce(p_university,''),coalesce(p_program,''),p_start_year,
     p_target_graduation,p_graduation_date,coalesce(p_notes,''));
 end if;
 insert into public.smartgtk_intake(
  owner_id,nip,full_name,unit_work,employment,jf_sk,old_position,nomenclature_updated,profession,
  pns_jf_formation,education,study_status,university,study_program,start_year,
  target_graduation,graduation_date,notes
 ) values (
  auth.uid(),coalesce(v_profile.nip,''),coalesce(nullif(btrim(v_profile.full_name),''),'GTK'),
  coalesce(nullif(btrim(v_profile.unit_gtk),''),nullif(btrim(v_profile.unit),''),'Belum diisi'),
  p_employment,p_jf_sk,coalesce(p_old_position,''),p_nomenclature_updated,p_profession,
  p_pns_jf_formation,p_education,p_study_status,coalesce(p_university,''),
  coalesce(p_program,''),p_start_year,p_target_graduation,p_graduation_date,coalesce(p_notes,'')
 ) on conflict (owner_id) do update set
  nip=excluded.nip,full_name=excluded.full_name,unit_work=excluded.unit_work,
  employment=excluded.employment,jf_sk=excluded.jf_sk,old_position=excluded.old_position,profession=excluded.profession,
  nomenclature_updated=excluded.nomenclature_updated,pns_jf_formation=excluded.pns_jf_formation,
  education=excluded.education,study_status=excluded.study_status,university=excluded.university,
  study_program=excluded.study_program,start_year=excluded.start_year,
  target_graduation=excluded.target_graduation,graduation_date=excluded.graduation_date,
  notes=excluded.notes,updated_at=now(),analysis_version=2,data_stage='DRAFT';
 insert into public.smartgtk_audit(owner_id,actor_id,action) values(auth.uid(),auth.uid(),'INTAKE_SAVED_ANALYZED');
 v_result:=public.smartgtk_mass_classify(p_profession,p_employment,p_jf_sk,p_nomenclature_updated,p_pns_jf_formation,p_education,p_old_position);
 return v_result;
end;
$function$
;
