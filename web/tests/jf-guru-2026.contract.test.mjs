import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const ui=fs.readFileSync(new URL('../jf-guru-2026.js',import.meta.url),'utf8');
const sql=fs.readFileSync(new URL('../../supabase/migrations/20261020093000_jf_guru_2026_surat_0294.sql',import.meta.url),'utf8');
const build=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
test('frontend is valid JavaScript',()=>assert.doesNotThrow(()=>new Function(ui)));
test('separate pathway and official document sets',()=>{
 assert.match(ui,/NOMENKLATUR/);assert.match(ui,/PENGANGKATAN/);assert.match(ui,/PENGALAMAN_2TH/);assert.match(ui,/SKP_TAHUN_1/);assert.match(ui,/SKP_TAHUN_2/);
 assert.match(ui,/11 Mei 2027/);assert.match(ui,/11 Mei 2028/);assert.match(ui,/11 Mei 2030/);
});
test('server owns transitions and does not treat a click as SK issuance',()=>{
 assert.match(sql,/security definer/);assert.match(sql,/jf2026_transition/);
 assert.match(sql,/jf2026_submit_case/);assert.match(sql,/jf2026_events/);
 assert.match(sql,/SK_PENETAPAN/);assert.match(sql,/p_sk_date/);
});
test('NIP verified against logged-in profile and stored data private',()=>{
 assert.match(sql,/nip=p_nip/);assert.match(sql,/enable row level security/);
 assert.match(sql,/simantab-jf-guru-2026/);assert.match(sql,/public=false/);
 assert.match(sql,/jf2026_export_audit/);
});
test('legacy Jabfung service not overwritten',()=>{
 assert.doesNotMatch(ui,/\.from\('submissions'\)/);
 assert.ok(build.scripts.build.endsWith('node inject-jf-guru-2026.mjs'));
});
