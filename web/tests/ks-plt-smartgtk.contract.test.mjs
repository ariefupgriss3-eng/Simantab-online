import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
const needs=read('../gtk-needs-progress.js');
const smart=read('../smartgtk-unified.js');
const migration=read('../../supabase/migrations/20261023113000_ks_plt_needs_smartgtk_profession.sql');

test('KS Plt PNS persists operational status distinct from definitive position',()=>{
 assert.match(needs,/data-ks-assignment/);
 assert.match(needs,/PNS \(Plt\.\)/);
 assert.match(needs,/ks_assignment_status:job_code==='KEPALA_SEKOLAH'/);
 assert.match(needs,/ksAssignment==='PLT'/);
 assert.match(migration,/ks_assignment_status text not null default 'BELUM_DITETAPKAN'/);
 assert.match(migration,/and \(pns=1 and pppk=0 and pppk_pw=0\)/);
});

test('SMART GTK keeps KS role and needs gate, but displays Guru for verified Plt entry',()=>{
 assert.match(smart,/ksIsPlt=p\(\)\.role==='KEPALA_SEKOLAH'/);
 assert.match(smart,/ksIsPlt\?'GURU':'KEPALA_SEKOLAH'/);
 assert.match(smart,/window\.showTab\?\.\('needs'\)/);
 assert.doesNotMatch(smart,/f\.elements\.profession\.value='KEPALA_SEKOLAH';/);
 assert.match(migration,/SIMANTAB_KS_PLT_PROFESSION_V1/);
 assert.match(migration,/p_profession<>''GURU'' or p_employment<>''PNS''/);
});
