import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ui=read('../smartgtk-unified.js');
const migration=read('../../supabase/migrations/20261021150000_smartgtk_unified_intake.sql');
const injection=read('../inject-jf-guru-2026.mjs');
const jf=read('../jf-guru-2026.js'),ed=read('../jf-qualification-2030.js');
test('one responsive SMART-GTK form loads only after login and is bundled exactly once',()=>{
 assert.doesNotThrow(()=>new Function(ui));
 assert.match(ui,/SIMANTAB_SMARTGTK_UNIFIED_INTAKE_V1/);
 assert.match(ui,/simantab:profile-ready/);
 assert.match(ui,/Simpan & Analisis Otomatis/);
 assert.match(ui,/smartgtkTile/);
 assert.match(injection,/smartgtk-unified\.js\?v=14/);
 assert.match(jf,/applicant\(\)&&window\.__simantabSmartGtkReady/);
 assert.match(ed,/gtk\(\)&&window\.__simantabSmartGtkReady/);
});
test('all GTK answer the same fields, with education reused and no false automatic SK',()=>{
 for(const field of ['employment','jf_sk','old_position','nomenclature_updated','pns_jf_formation','education','study_status','university','program','start_year','target_graduation','graduation_date'])
   assert.ok(ui.includes(field),field);
 assert.match(ui,/jf2030_qualification/);
 assert.match(ui,/p_education:v\.education/);
 assert.match(ui,/smartgtk_mass_save/);
 assert.match(ui,/Data tersimpan dan berhasil diklasifikasikan/);
 assert.match(ui,/bukan keputusan|bukan pengajuan resmi otomatis/i);
 assert.doesNotMatch(ui,/jf2026_submit_case/);
 assert.doesNotMatch(ui,/jf2026_transition/);
});
test('backend is the classification authority, with RLS, duplicate NIP checks and audit',()=>{
 assert.match(migration,/create or replace function public\.smartgtk_classify/);
 assert.match(migration,/create or replace function public\.smartgtk_save/);
 assert.match(migration,/create or replace function public\.smartgtk_officer_list/);
 assert.match(migration,/smartgtk_education_study_coherent/);
 assert.match(migration,/private\.jf2026_is_officer/);
 assert.match(migration,/enable row level security/);
 assert.match(migration,/count\(\*\) from public\.profiles/);
 assert.match(migration,/NIP terhubung dengan lebih dari satu akun/);
 assert.match(migration,/perform public\.jf2030_save_progress/);
 assert.match(migration,/INTAKE_SAVED_ANALYZED/);
 assert.match(migration,/revoke all on public\.smartgtk_intake/);
});
test('three classifications remain independent, provisional, and qualification-aware',()=>{
 for(const code of ['POTENSI_USUL','TERTAHAN_KUALIFIKASI','PERLU_PEMENUHAN_2030','TELAAH_KHUSUS','PERLU_DATA','DINYATAKAN_MEMENUHI_BELUM_VERIFIKASI'])
   assert.match(migration,new RegExp(code));
 assert.match(migration,/SKRINING_AWAL_BUKAN_KEPUTUSAN/);
 assert.match(migration,/p_employment<>'PNS'/);
});

test('all GTK include non-ASN without ASN NIP but ASN 18-digit requirement remains',()=>{
 assert.match(migration,/nip text not null default ''/);
 assert.match(migration,/p_employment in \('PNS','PPPK','PPPK_PW'\)/);
 assert.match(migration,/Legacy education 2030 RPC requires NIP/);
 assert.match(read('./smartgtk-integration.sql'),/Non-ASN GTK may not have ASN NIP/);
});

test('review state stays intact for personnel-only updates',()=>{
 const safety=read('../../supabase/migrations/20261021160000_smartgtk_preserve_education_reviews.sql');
 assert.match(safety,/v_existing\.notes is distinct from coalesce\(p_notes,''\)/);
 assert.match(safety,/v_existing\.university is distinct from btrim/);
 assert.match(safety,/v_existing\.owner_id is null/);
 assert.match(read('./smartgtk-integration.sql'),/personnel edit erased diploma correction review/);
 assert.match(ui,/try\{await save\(\)\}catch\(error\)/);
});

test('historical pilot enrollment remains guarded, with OPEN access guidance in the UI',()=>{
 const pilot=read('../../supabase/migrations/20261021170000_smartgtk_pilot_allowlist.sql');
 assert.match(pilot,/create table if not exists public\.smartgtk_pilot_users/);
 assert.match(pilot,/private\.jf2026_is_officer\(\)/);
 assert.match(pilot,/if not exists\(select 1 from public\.smartgtk_pilot_users/);
 assert.match(pilot,/SMART-GTK masih uji coba terbatas/);
 assert.match(ui,/smartgtk_pilot_status/);
 assert.match(ui,/Akun belum memenuhi ketentuan akses SMART-GTK/);
 assert.match(read('./smartgtk-integration.sql'),/unassigned GTK saved during pilot/);
});

test('teacher and KS PNS screening while other GTK get database-only results',()=>{
 const sql=read('../../supabase/migrations/20261021180000_smartgtk_mass_roles.sql');
 assert.match(ui,/p_profession:v.profession/);
 assert.match(ui,/smartgtk_mass_save/);
 assert.match(ui,/PENGAWAS/);
 assert.match(sql,/p_profession not in \('GURU','KEPALA_SEKOLAH'\)/);
 assert.match(sql,/DATABASE_ONLY/);
 assert.match(sql,/revoke execute on function public.smartgtk_save/);
});
test('PNS complete docs; PPPK/PW optional docs; nonASN cannot upload',()=>{
 const docs=read('../../supabase/migrations/20261021181000_smartgtk_mass_documents.sql');
 assert.match(docs,/simantab-smartgtk-private/);
 assert.match(docs,/file_size_limit/);
 assert.match(docs,/1572864/);
 assert.match(docs,/s\.employment in \('PNS','PPPK','PPPK_PW'\)/);
 assert.match(docs,/Kelompok ini tidak mengunggah dokumen SMART-GTK/);
 assert.match(docs,/Berkas PNS belum lengkap/);
 assert.match(ui,/smartgtk_mass_complete/);
 assert.match(ui,/smartgtk_locker_register/);
});
test('guided joining uses existing verified email signup and recovery',()=>{
 const onboarding=read('../smartgtk-onboarding.js');
 assert.match(onboarding,/window\.toggleAuthMode/);
 assert.match(onboarding,/window\.setChannel/);
 assert.match(onboarding,/resetPasswordForEmail/);
 assert.doesNotMatch(onboarding,/createUser|admin\.createUser|defaultPassword/);
});

test('mass rollout stays PILOT until Dinas explicitly chooses OPEN',()=>{
 const gate=read('../../supabase/migrations/20261021182000_smartgtk_mass_rollout_gate.sql');
 assert.match(gate,/mode text not null default 'PILOT'/);
 assert.match(gate,/config\.mode='OPEN'/);
 assert.match(gate,/smartgtk_mass_set_rollout/);
 assert.match(gate,/private\.jf2026_is_officer/);
 assert.match(gate,/smartgtk_rollout_history/);
 assert.match(read('./smartgtk-mass-integration.sql'),/ordinary GTK opened mass rollout/);
});

test('SMART-GTK is a prominent dashboard-first GTK priority, not a GTK services card',()=>{
 assert.match(ui,/const dashboardCardId='smartgtkDashboardPriority'/);
 assert.match(ui,/const navButtonId='smartgtkPrimaryNav'/);
 assert.match(ui,/getElementById\('dashboard'\)/);
 assert.match(ui,/root\.insertBefore\(card,body\)/);
 assert.match(ui,/PRIORITAS PENDATAAN GTK/);
 assert.match(ui,/SMART-GTK • Prioritas/);
 assert.match(ui,/smartgtk_pilot_status/);
 assert.match(ui,/Isi \/ Lanjutkan SMART-GTK/);
 assert.match(ui,/Lihat informasi SMART-GTK/);
 assert.match(ui,/if\(gtk\(\)\)\{ensureGTKDashboard\(\);ensureGTKNav\(\);return\}/);
 assert.match(ui,/function ensureDinasService\(\)/);
 assert.match(ui,/function removeOldGTKServiceTiles\(\)/);
 assert.doesNotMatch(ui,/function tile\(\)/);
 assert.doesNotThrow(()=>new Function(ui));
});

test('Dashboard GTK has short copy and visible 26 October 2026 23:59 WIB data deadline',()=>{
 assert.match(ui,/Satu kali isi untuk pendataan guru, kepala sekolah, pengawas, dan tenaga kependidikan\.<\/p>/);
 assert.doesNotMatch(ui,/SIMANTAB hanya menganalisis usulan JF Guru bagi guru dan KS PNS\./);
 assert.match(ui,/sg-deadline/);
 assert.match(ui,/Deadline input data paling lambat 26 Oktober 2026, pukul 23\.59 WIB\./);
 assert.match(ui,/Pastikan akun SIMANTAB aktif dan sudah disetujui Dinas/);
 assert.match(ui,/smartgtk_pilot_status/);
 assert.doesNotThrow(()=>new Function(ui));
});

test('reuse Lemari Dokumenku by selecting an owned file; no extra upload',()=>{
 const migration=read('../../supabase/migrations/20261021193000_smartgtk_lemari_document_reference.sql');
 assert.match(ui,/Ambil dari Lemari Dokumenku/);
 assert.match(ui,/sb\.rpc\('smartgtk_cabinet_candidates'/);
 assert.match(ui,/sb\.rpc\('smartgtk_import_cabinet'/);
 assert.match(ui,/Berkas hanya ditautkan|Berkas hanya ditautkan|Berkas hanya ditautkan|Berkas hanya ditautkan|ditautkan dari lemari pribadi/);
 assert.match(migration,/sf\.user_id=auth\.uid\(\)/);
 assert.match(migration,/split_part\(sf\.storage_path,'\/',1\)=auth\.uid\(\)::text/);
 assert.match(migration,/sf\.file_size between 1 and 1572864/);
 assert.match(migration,/o\.bucket_id=d\.source_bucket/);
 assert.match(migration,/cabinet_file_id/);
 assert.match(migration,/CABINET_FILE_LINKED_/);
 assert.match(migration,/private\.smartgtk_cabinet_code_matches\(p_type,sf\.requirement_code\)/);
 assert.match(read('./smartgtk-cabinet-integration.sql'),/unrelated SKCK linked as Jabfung SK/);
 assert.match(read('./smartgtk-cabinet-integration.sql'),/cross-owner file assigned/);
 assert.doesNotThrow(()=>new Function(ui));
});

test('one-time SMART-GTK upload is visible in Lemari Dokumenku',()=>{
 const migration=read('../../supabase/migrations/20261021195000_smartgtk_one_lemari_storage.sql');
 const shell=read('../cloudflare/bootstrap-production-20261013.html');
 assert.match(ui,/storage\.from\('simantab-documents'\)\.upload/);
 assert.match(ui,/smartgtk_locker_register/);
 assert.doesNotMatch(ui,/storage\.from\('simantab-smartgtk-private'\)\.upload/);
 assert.match(migration,/smartgtk_locker_files/);
 assert.match(migration,/smartgtk_documents/);
 assert.match(migration,/CABINET_UPLOADED_/);
 assert.match(migration,/smartgtk_cabinet_candidates/);
 assert.match(shell,/sb\.from\('smartgtk_locker_files'\)/);
 assert.match(read('./smartgtk-one-lemari-integration.sql'),/one-file upload created a fake service submission/);
});

test('Legacy SK Jabfung Terakhir files are selectable only with source-code and filename evidence',()=>{
 const compat=read('../../supabase/migrations/20261021201000_smartgtk_legacy_sk_jabfung_match.sql');
 assert.match(compat,/SK_JABATAN_SEBELUMNYA/);
 assert.match(compat,/JABFUNG\|JF\|JABATAN FUNGSIONAL/);
 assert.match(compat,/private\.smartgtk_cabinet_file_matches\(p_type,sf\.requirement_code,sf\.file_name\)/);
 assert.match(compat,/private\.smartgtk_cabinet_file_matches\(d\.doc_type,sf\.requirement_code,sf\.file_name\)/);
 assert.match(ui,/SK Jabfung Terakhir \(kode arsip lama\)/);
 assert.match(read('./smartgtk-legacy-sk-jabfung.integration.sql'),/unrelated SK_JABATAN_SEBELUMNYA offered/);
 assert.doesNotThrow(()=>new Function(ui));
});

test('PNS completed evidence is labeled awaiting Dinas verification, never approved automatically',()=>{
 assert.match(ui,/Berkas Lengkap — Menunggu Verifikasi Dinas/);
 assert.match(ui,/documentStageLabel\(status,missing\.length\)/);
 assert.match(ui,/status==='BERKAS_LENGKAP'&&missing\.length===0/);
 assert.match(ui,/Berkas Perlu Dilengkapi Ulang/);
 assert.match(ui,/Menunggu verifikasi administratif oleh Dinas/);
 assert.match(ui,/Belum merupakan persetujuan usulan, penetapan JF, atau penerbitan SK/);
 assert.match(ui,/Berkas Lengkap \(belum diverifikasi Dinas\)/);
 assert.doesNotThrow(()=>new Function(ui));
});

test('PB and PLS are separate categories and legacy codes remain readable',()=>{
 const migration=read('../../supabase/migrations/20261021204000_smartgtk_pendamping_pb_pls.sql');
 assert.match(ui,/\['PB','Pendamping Belajar \(PB\)'\]/);
 assert.match(ui,/\['PLS','Pendamping Layanan Satpen \(PLS\)'\]/);
 assert.match(ui,/employmentLabel/);
 assert.match(ui,/NON_ASN.*Pendamping \(data lama/);
 assert.match(ui,/Pendamping Belajar \(PB\) harus memilih tugas utama Guru/);
 assert.match(ui,/Pendamping Layanan Satpen \(PLS\) harus memilih tugas utama Tenaga Kependidikan/);
 assert.doesNotMatch(ui,/Non-ASN|non-ASN/);
 assert.match(migration,/check\(employment in \('PNS','PPPK','PPPK_PW','NON_ASN','PB','PLS','LAINNYA'\)\)/);
 assert.match(migration,/smartgtk_pendamping_profession_match/);
 assert.match(migration,/p_employment='PB'/);
 assert.match(migration,/p_employment='PLS'/);
 assert.match(read('./smartgtk-pb-pls.integration.sql'),/PLS entered ASN JF screening/);
 assert.doesNotThrow(()=>new Function(ui));
});

test('OPEN rollout text directs denied users to account approval rather than pilot enrollment',()=>{
 assert.match(ui,/Akun belum dapat mengisi SMART-GTK\. Pastikan akun SIMANTAB aktif dan sudah disetujui Dinas/);
 assert.match(ui,/Akun belum memenuhi ketentuan akses SMART-GTK/);
 assert.match(ui,/SMART-GTK belum dapat dimuat\. Segarkan halaman/);
 assert.doesNotMatch(ui,/Saat ini masih uji coba terbatas|SMART-GTK masih tahap pilot terbatas/);
 assert.match(ui,/smartgtk_pilot_status/); // Keep backwards-compatible backend access RPC.
 assert.doesNotThrow(()=>new Function(ui));
});
