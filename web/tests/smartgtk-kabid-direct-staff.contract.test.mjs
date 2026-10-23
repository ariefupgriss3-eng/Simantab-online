import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../../supabase/migrations/20261023150000_smartgtk_kabid_direct_staff.sql',import.meta.url),'utf8');
const ui=readFileSync(new URL('../smartgtk-unified.js',import.meta.url),'utf8');

test('Kabid has direct staff assignment alongside coordinator and final decision',()=>{
 assert.match(ui,/SIMANTAB_KABID_DIRECT_SMARTGTK_STAFF_V1/);
 assert.match(ui,/if\(role==='KABID'\)/);
 assert.match(ui,/staffAssignmentControl\(item,make\)/);
 assert.match(ui,/scope===item\.scope/);
 assert.match(ui,/smartgtk_workflow_staff/);
 assert.match(ui,/Tugaskan Staf/);
 assert.match(sql,/if a\.role='KABID' then/);
 assert.match(sql,/p_action='ASSIGN_STAFF'/);
 assert.match(sql,/v_new:='MENUNGGU_STAF'/);
 assert.match(sql,/p_action='APPROVE'/);
});

test('official roster is per scope and suppresses duplicate unused Wartono account',()=>{
 for(const name of ['Mamik','Icha','Danny','Risna Afif','Sucipto','Wartono','Imam Prabowo','Rina Ratnawati']) assert.ok(sql.includes("'"+name+"'"),name);
 assert.match(sql,/m\.scope=w\.scope/);
 assert.match(sql,/m\.is_enabled=true/);
 assert.match(sql,/p\.account_channel='DINAS' and p\.is_active=true/);
 assert.match(sql,/p\.approval_status='APPROVED'/);
 assert.doesNotMatch(sql,/7b52131c-6c0a-4de2-b8a5-b1b0459e2796/);
});

test('security and audit preserve server-side authority and sequential review',()=>{
 assert.match(sql,/id=auth\.uid\(\)/);
 assert.match(sql,/w\.status in \('MENUNGGU_PENUGASAN','MENUNGGU_STAF','PERBAIKAN_STAF'\)/);
 assert.match(sql,/insert into public\.smartgtk_workflow_events/);
 assert.match(sql,/a\.role='KASI_SD' and w\.scope='SD'/);
 assert.match(sql,/a\.role='KASI_SMP' and w\.scope='SMP'/);
 assert.match(sql,/a\.role='SUBKOOR_TK' and w\.scope='TK_PAUD_PNF'/);
 assert.match(sql,/revoke all on private\.smartgtk_staff_scope from public,anon,authenticated/);
 assert.match(sql,/revoke all on function public\.smartgtk_workflow_act/);
 assert.match(ui,/workflowStaff\.some\(x=>x\.id===staff&&x\.scope===row\.scope\)/);
});
