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