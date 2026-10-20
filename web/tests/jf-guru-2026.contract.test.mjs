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
 assert.match(build.scripts['build:cloudflare'],/node inject-jf-guru-2026\.mjs && node cloudflare\/verify-deployment-bundle\.mjs/);
});

test('Dinas officers monitor without applicant buttons or draft access',()=>{
 assert.match(ui,/const applicant=\(\)=>p\(\)\.account_channel==='GTK'/);
 assert.match(ui,/\$\{applicant\(\)\?/);
 assert.match(ui,/if\(!c&&!applicant\(\)\)/);
 assert.match(ui,/if\(!applicant\(\)\)throw new Error\('Hanya akun GTK/);
});
test('education must be explicitly selected, including PNS appointment pathway',()=>{
 assert.match(ui,/name="education"/);
 assert.match(ui,/value="" disabled \$\{c\?\.education\?'':'selected'\}/);
 assert.match(ui,/Pilih pendidikan sesuai ijazah/);
 assert.match(ui,/isNew\?\['S1','DIV'\]:\['SLTA','SPG','DI','DII','DIII','S1','DIV'\]/);
 assert.match(ui,/PENGALAMAN_2TH/);
 assert.match(ui,/type="date" name="birth_date"/);
 assert.match(ui,/name="pns_formasi_jf"/);
});

test('legacy nomenclature offers six SK Jabfung positions but appointment asks current job',()=>{
 const positions=['Guru Pertama','Guru Muda','Guru Madya','Guru Ahli Pertama','Guru Ahli Muda','Guru Ahli Madya'];
 for(const name of positions)assert.ok(ui.includes("'"+name+"'"),name);
 assert.match(ui,/name="old_position"/);
 assert.match(ui,/Jabfung lama \(sesuai SK Jabfung\)/);
 assert.match(ui,/Posisi \/ tugas mengajar saat ini/);
 assert.match(ui,/nomenclaturePositions\.map/);
});
test('SLTA and SPG are accepted for legacy review without relaxing appointment S1-DIV',()=>{
 const extra=fs.readFileSync(new URL('../../supabase/migrations/20261020142000_jf2026_legacy_education.sql',import.meta.url),'utf8');
 assert.match(extra,/check \(education in \('SLTA','SPG','DI','DII','DIII','S1','DIV'\)\)/);
 assert.match(extra,/or p_education not in \('SLTA','SPG','DI','DII','DIII','S1','DIV'\)/);
 assert.match(extra,/p_education not in \('S1','DIV'\) and p_pathway='PENGANGKATAN'/);
 assert.match(ui,/SLTA\/SPG dicatat untuk telaah kasus lama/);
});

test('GTK JF2026 menu awaits profile-ready, remounts after login and is role-limited',()=>{
 assert.match(ui,/window\.addEventListener\('simantab:profile-ready',onReady\)/);
 assert.match(ui,/window\.removeEventListener\('simantab:profile-ready',onReady\)/);
 assert.match(ui,/window\.addEventListener\('simantab:profile-ready',\(\)=>/);
 assert.match(ui,/setTimeout\(ensureTile,0\)/);
 assert.match(ui,/if\(!root\|\|!\(applicant\(\)\|\|officer\(\)\)\|\|document\.getElementById\('jf2026ServiceTile'\)\)return/);
 assert.doesNotMatch(ui,/i<180&&\(!window\.__simantabSb/);
});
