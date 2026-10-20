import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
