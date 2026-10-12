// Node 20+ (local-only source regression tests). Never connects to Supabase.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(web, '..');
const read = p => readFileSync(resolve(repoRoot,p), 'utf8');
const workflow = read('web/submission-layered-workflow.js');
const assigned = read('web/staff-assigned-services.js');
const builder = read('web/finalize-html.mjs');
const migration = read('supabase/migrations/20261012223000_condro_kp_jabfung_dual_role_rpc.sql');
const rollback = read('supabase/manual_rollback/20261012_condro_kp_jabfung_dual_role_rpc_rollback.sql');

test('frontend modules compile and contain version markers',()=>{
  new Function(workflow);
  new Function(assigned);
  assert.match(workflow,/SIMANTAB_LAYERED_SERVICE_WORKFLOW_V12_DUAL_CAPABILITY/);
  assert.match(assigned,/SIMANTAB_STAFF_ASSIGNED_SERVICES_V10_DUAL_CAPABILITY/);
  assert.match(builder,/\['submission-layered-workflow\.js',12\]/);
  assert.match(builder,/\['staff-assigned-services\.js',10\]/);
});
test('candidate staff requires designated KP/e-Jabfung capability for Subkoor',()=>{
  const start = workflow.indexOf('function candidateStaff(d,sub){');
  const end = workflow.indexOf('\nfunction actionHtml(s,d){',start);
  assert.ok(start>0 && end>start);
  const func = new Function('return ('+workflow.slice(start,end).trim()+')')();
  const profiles=[
    {id:'condro',full_name:'Condro',role:'SUBKOOR_TK',is_active:true,account_channel:'DINAS'},
    {id:'kasim',full_name:'Kasim',role:'STAFF_KP_EKIN',is_active:true,account_channel:'DINAS'},
    {id:'otherSubkoor',full_name:'Other Subkoor',role:'SUBKOOR_TK',is_active:true,account_channel:'DINAS'},
    {id:'pengawas',full_name:'Pengawas',role:'PENGAWAS',is_active:true,account_channel:'DINAS'},
    {id:'inactive',full_name:'Inactive',role:'STAFF_KP_EKIN',is_active:false,account_channel:'DINAS'},
    {id:'outside',full_name:'Outside',role:'STAFF_KP_EKIN',is_active:true,account_channel:'GTK'}
  ];
  const grants=[
    {user_id:'condro',capability:'KP',is_active:true},
    {user_id:'condro',capability:'E_JABFUNG',is_active:true},
    {user_id:'kasim',capability:'KP',is_active:true},
    {user_id:'kasim',capability:'E_JABFUNG',is_active:true},
    {user_id:'otherSubkoor',capability:'KP',is_active:false}
  ];
  const ids=(service_type,tasks=grants)=>func({profiles,tasks},{service_type}).map(x=>x.id);
  assert.deepEqual(ids('KP'),['condro','kasim']);
  assert.deepEqual(ids('E_JABFUNG'),['condro','kasim']);
  assert.ok(!ids('CUTI').includes('condro'));
  assert.ok(!ids('KP',grants.filter(x=>x.user_id!=='condro')).includes('condro'));
  assert.ok(!ids('KP').includes('pengawas'));
  assert.ok(!ids('KP').includes('outside'));
  assert.ok(!ids('KP').includes('inactive'));
});
test('separate admin task UI preserves default coordinator view and assigned-only read',()=>{
  assert.match(assigned,/isAdditionalAdmin=role\(\)==='SUBKOOR_TK'&&additionalCapabilities\.size>0/);
  assert.match(assigned,/if\(canUseAdditional\(\)\)subs=subs\.filter\(x=>additionalCapabilities\.has\(x\.service_type\)\)/);
  assert.match(assigned,/!assigned\.subs\.some\(x=>x\.id===id\)/);
  assert.match(assigned,/kpJabfungAdditionalBody/);
  assert.match(assigned,/id==='services'&&isStaff\(\)/);
});
test('SQL migration has guards, assigned-only capability checks and rollback',()=>{
  assert.match(migration,/BEGIN;/);
  assert.match(migration,/SET LOCAL lock_timeout/);
  assert.match(migration,/CONDRO_KP_JABFUNG_DUAL_ROLE_20261012/);
  assert.match(migration,/v_sub\.service_type in \('KP','E_JABFUNG'\)/);
  assert.match(migration,/v_service in \('KP','E_JABFUNG'\)/);
  assert.match(migration,/t\.user_id=v_uid/);
  assert.match(migration,/t\.is_active=true/);
  assert.match(migration,/p\.account_channel='DINAS'/);
  assert.match(migration,/v_sub\.assigned_user_id is distinct from v_uid/);
  assert.match(migration,/CREATE OR REPLACE FUNCTION public\.submission_coordinator_approve/);
  assert.match(migration,/v_cycle\.staff_response_by=v_uid or v_sub\.staff_verified_by=v_uid/);
  assert.match(migration,/Persetujuan sendiri ditolak/);
  assert.match(rollback,/CONDITIONAL ROLLBACK/);
  assert.match(rollback,/ABORT rollback/);
});
