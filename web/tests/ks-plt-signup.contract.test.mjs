import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const registration=src('../registration-ui-final.js');
const edge=src('../../supabase/functions/simantab-register-pending/index.ts');
const approval=src('../registration-approval.js');
const needs=src('../gtk-needs-progress.js');
const smart=src('../smartgtk-unified.js');
const schema=src('../../supabase/migrations/20261023170000_ks_plt_signup_declaration.sql');

test('KS registration distinguishes definitive from self-reported Plt, retaining existing role',()=>{
 assert.match(registration,/signupKsAssignment/);
 assert.match(registration,/Kepala Sekolah \(Plt\.\)/);
 assert.match(registration,/ks_assignment_status:role==='KEPALA_SEKOLAH'/);
 assert.match(edge,/ks_registration_status:ksRegistrationStatus/);
 assert.match(edge,/ksRegistrationStatus==="PLT"&&employment!=="PNS"/);
 assert.match(schema,/ks_registration_status text/);
 assert.match(approval,/ks_registration_status/);
 assert.match(edge,/requested_role:role/);
 assert.doesNotMatch(edge,/requested_role:"KEPALA_SEKOLAH_PLT"/);
});

test('new Plt school needs row prepopulates PNS 1 without modifying existing school records',()=>{
 assert.match(needs,/registeredKs\?\.ks_registration_status==='PLT'/);
 assert.match(needs,/r\.__new===true/);
 assert.match(needs,/freshKs\.pns=1/);
 assert.match(needs,/freshKs\.ks_assignment_status='PLT'/);
 assert.match(smart,/ksIsPlt\?'GURU':'KEPALA_SEKOLAH'/);
 assert.match(smart,/window\.showTab\?\.\('needs'\)/);
});

test('registrant declaration never changes account authorization or automatic approval',()=>{
 assert.match(schema,/BUKAN perubahan jabatan definitif/);
 assert.match(edge,/super|Admin|school_access|independent review/i);
 assert.match(edge,/ks_registration_status/);
 assert.match(registration,/role==='KEPALA_SEKOLAH'/);
});
