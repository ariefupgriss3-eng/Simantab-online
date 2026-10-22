import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge=fs.readFileSync(new URL('../../supabase/functions/simantab-gtk-bulk-approval/index.ts',import.meta.url),'utf8');
const sql=fs.readFileSync(new URL('../../supabase/migrations/20261022_bulk_approval_incomplete_profile.sql',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../gtk-bulk-approval.js',import.meta.url),'utf8');
const mandatory=fs.readFileSync(new URL('../mandatory-personnel-profile.js',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('missing NIP and missing unit do not exclude a PENDING candidate',()=>{
 assert.match(edge,/rawNip === "" \|\|/);
 assert.doesNotMatch(edge,/workUnit\(p\)\.length > 0/);
 assert.doesNotMatch(edge,/p\.is_active === false/);
 assert.match(edge,/verified_identity_and_role !== true/);
 assert.match(edge,/selected\.length > 50/);
});

test('duplicate NIP, malformed NIP, role and school validation stay enabled',()=>{
 assert.match(edge,/multiplicity\.get\(key\) === 1/);
 assert.match(edge,/VALID_ROLES\.has/);
 assert.match(edge,/schools\.has/);
 assert.match(sql,/NIP terdaftar pada akun lain/);
 assert.match(sql,/NIP terisi tetapi bukan 18 digit/);
 assert.match(sql,/NPSN sekolah negeri aktif belum cocok/);
 assert.match(sql,/REVOKE EXECUTE.*PUBLIC, anon, authenticated/);
});

test('PENDING to APPROVED requires Super Admin; completion of profile remains mandatory',()=>{
 assert.match(sql,/role='SUPER_ADMIN'/);
 assert.match(sql,/WHERE id=_target AND approval_status='PENDING' AND account_channel='GTK';/);
 assert.doesNotMatch(sql,/Unit kerja kosong/);
 assert.match(ui,/Wajib lengkapi setelah disetujui/);
 assert.match(ui,/SIMANTAB_GTK_BULK_APPROVAL_UI_V3/);
 assert.match(mandatory,/state\.blocked=missingFields\(data\)\.length>0/);
 assert.match(mandatory,/const target=\(eligible\(\)\&\&\(state\.blocked\|\|state\.loading\)\)\?'profile':id/);
 assert.match(pkg.scripts['build:cloudflare'],/node inject-gtk-bulk-approval\.mjs/);
});
