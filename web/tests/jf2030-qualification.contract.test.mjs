import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ui=read('../jf-qualification-2030.js');
const sql=read('../../supabase/migrations/20261020162000_jf2030_qualification_monitoring.sql');
const injector=read('../inject-jf-guru-2026.mjs');
test('qualification UI parses as Javascript and ships independently',()=>{
 assert.doesNotThrow(()=>new Function(ui));
 assert.match(ui,/SIMANTAB_JF2030_QUALIFICATION_V1/);
 assert.match(injector,/jf-qualification-2030\.js/);
 assert.match(ui,/jf2030ServiceTile/);
});
test('diploma deadline and SLTA SPG legal distinction is shown',()=>{
 assert.match(ui,/2030-05-11/);
 assert.match(ui,/11 Mei 2030/);
 assert.match(ui,/SLTA\/SPG/);
 assert.match(ui,/tenggat yang disebut untuk diploma tidak otomatis berlaku/);
 assert.match(ui,/DI','DII','DIII/);
});
test('GTK progress upload evidence and officer verification are separate',()=>{
 assert.match(ui,/jf2030_save_progress/);
 assert.match(ui,/jf2030_attach_diploma/);
 assert.match(ui,/jf2030_review/);
 assert.match(ui,/simantab-jf-ijazah-2030/);
 assert.match(ui,/TERVERIFIKASI/);
 assert.match(ui,/MAX=1572864/);
});
test('backend rejects unauthenticated and Dinas application and has RLS',()=>{
 assert.match(sql,/account_channel='GTK'/);
 assert.match(sql,/private\.jf2026_is_officer/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.jf2030_qualification/);
 assert.match(sql,/grant select on public\.jf2030_qualification/);
 assert.match(sql,/storage\.objects/);
 assert.match(sql,/not exists\(select 1 from storage\.objects/);
});
test('no automatic eligibility or SK issuance, evidence verification requires qualification',()=>{
 assert.match(sql,/evidence_path is null/);
 assert.match(sql,/graduation_date is null/);
 assert.match(sql,/study_status='LULUS_BELUM_VERIF'/);
 assert.doesNotMatch(ui,/jf2026_transition/);
 assert.doesNotMatch(ui,/E_JABFUNG/);
});
test('coverage separates unreported profiles from confirmed non-degree teachers',()=>{
 const report=read('../../supabase/migrations/20261020182500_jf2030_coverage_reconciliation.sql');
 assert.match(report,/jf2030_coverage_summary/);
 assert.match(report,/jf2030_coverage_unreported/);
 assert.match(report,/private\.jf2026_is_officer/);
 assert.match(report,/having|c\.n=1/);
 assert.match(report,/approval_status='APPROVED'/);
 assert.match(report,/distinct_valid_nips/);
 assert.match(report,/unreported_unambiguous_accounts/);
 assert.match(ui,/Belum mengisi ≠ belum S-1\/D-IV/);
 assert.match(ui,/mode==='unreported'/);
});

test('2030 menu awaits profile-ready and remounts after delayed GTK login',()=>{
 assert.match(ui,/window\.addEventListener\('simantab:profile-ready',onReady\)/);
 assert.match(ui,/setTimeout\(tile,0\)/);
 assert.match(ui,/window\.addEventListener\('simantab:profile-ready',\(\)=>/);
 assert.doesNotMatch(ui,/i<180&&\(!window\.__simantabSb/);
});

test('GTK 2030 monitoring appears in GTK service catalog, not only Dinas dashboard',()=>{
 assert.match(ui,/el\.className=isGtk\?'service':'card'/);
 assert.match(ui,/root\.querySelector\('\.servicegrid'\)\|\|root/);
 assert.match(ui,/Buka Monitoring Pendidikan 2030/);
});

test('S1 DIV S2 S3 self-report is supported without default SLTA/SPG guidance',()=>{
 const m=read('../../supabase/migrations/20261021101000_jf2030_qualification_completed.sql');
 assert.match(ui,/educationLevels=\['SLTA','SPG','DI','DII','DIII',\.\.\.qualifiedEducation\]/);
 assert.match(ui,/const qualifiedEducation=\['S1','DIV','S2','S3'\]/);
 assert.match(ui,/education==='SLTA'\|\|education==='SPG'/);
 assert.match(ui,/Pilih pendidikan terakhir sesuai ijazah/);
 assert.match(ui,/SUDAH_MEMENUHI/);
 assert.match(ui,/refreshEducation/);
 assert.match(ui,/jf2030EducationGuidance/);
 assert.match(ui,/f\.elements\.graduation\.required=study==='LULUS_BELUM_VERIF'\|\|study==='SUDAH_MEMENUHI'/);
 assert.match(m,/jf2030_education_study_coherence_check/);
 assert.match(m,/study_status='SUDAH_MEMENUHI'/);
 assert.match(m,/q\.study_status in \('LULUS_BELUM_VERIF','SUDAH_MEMENUHI'\)/);
 assert.match(m,/education_initial=excluded.education_initial/);
});

test('GTK without digital diploma keeps saved declaration separate from verification',()=>{
 assert.match(ui,/function documentStatus\(q\)/);
 assert.match(ui,/q\.study_status==='SUDAH_MEMENUHI' && !q\.evidence_path/);
 assert.match(ui,/Sudah Memenuhi \(Pernyataan GTK\) — Dokumen Belum Tersedia/);
 assert.match(ui,/if\(q\.review_status==='TERVERIFIKASI'\)/);
 assert.match(ui,/Dokumen Diunggah — Menunggu Verifikasi Dinas/);
 assert.match(ui,/Status dokumen: /);
 assert.match(ui,/ijazah dapat diunggah di lain waktu/);
 assert.match(ui,/documentStatus\(x\)/);
 assert.doesNotMatch(ui,/study_status==='SUDAH_MEMENUHI'\s*\?\s*'Terverifikasi'/);
});

test('status dokumen functional scenarios for GTK and Kabid (not only regex matching)',()=>{
 const marker=ui.match(/function documentStatus\(q\)\{[\s\S]*?\n\}\nlet mine=/);
 assert.ok(marker,'documentStatus pure helper should exist before module state');
 const body=marker[0].slice(0,-'\nlet mine='.length);
 const status=vm.runInNewContext('('+body+')');
 assert.equal(status(null),'Data pendidikan belum diisi');
 assert.equal(status({study_status:'SUDAH_MEMENUHI',review_status:'BELUM_DITELAAH',evidence_path:null}),
   'Sudah Memenuhi (Pernyataan GTK) — Dokumen Belum Tersedia');
 assert.equal(status({study_status:'SUDAH_MEMENUHI',review_status:'BELUM_DITELAAH',evidence_path:'owner/IJAZAH-uuid.pdf'}),
   'Dokumen Diunggah — Menunggu Verifikasi Dinas');
 assert.equal(status({study_status:'SUDAH_MEMENUHI',review_status:'TERVERIFIKASI',evidence_path:'owner/IJAZAH-uuid.pdf'}),
   'Ijazah telah diverifikasi Dinas');
 assert.equal(status({study_status:'LULUS_BELUM_VERIF',review_status:'BELUM_DITELAAH',evidence_path:null}),
   'Lulus (Pernyataan GTK) — Dokumen Belum Tersedia');
 assert.equal(status({study_status:'SEDANG_KULIAH',review_status:'BELUM_DITELAAH',evidence_path:null}),
   'Belum ada dokumen ijazah yang diverifikasi');
});

test('Kabid uses correct latest-education label and formatted degree nomenclature',()=>{
 assert.match(ui,/Pendidikan terakhir: /);
 assert.doesNotMatch(ui,/Ijazah awal: /);
 assert.match(ui,/'S2':'S-2'/);
 assert.match(ui,/'DIV':'D-IV'/);
 assert.match(ui,/x\.review_status==='TERVERIFIKASI'\?'':/);
});
