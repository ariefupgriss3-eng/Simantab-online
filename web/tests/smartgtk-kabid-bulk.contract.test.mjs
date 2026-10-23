import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../../supabase/migrations/20261023173000_smartgtk_kabid_bulk_assign.sql',import.meta.url),'utf8');
const ui=readFileSync(new URL('../smartgtk-unified.js',import.meta.url),'utf8');
const inject=readFileSync(new URL('../inject-jf-guru-2026.mjs',import.meta.url),'utf8');
const qa=readFileSync(new URL('../cloudflare/verify-deployment-bundle.mjs',import.meta.url),'utf8');

test('Kabid bulk controls are scoped to incomplete assignment queue, not draft or PPPK',()=>{
 assert.match(ui,/SIMANTAB_SMARTGTK_KABID_BULK_ASSIGN_V1/);
 assert.match(ui,/p\(\)\.role==='KABID'/);
 assert.match(ui,/row\.status==='MENUNGGU_PENUGASAN'/);
 assert.match(ui,/!row\.assigned_staff/);
 assert.match(ui,/row\.employment==='PNS'/);
 assert.match(ui,/\['GURU','KEPALA_SEKOLAH'\]/);
 assert.match(ui,/\['DATA_TERCATAT','BERKAS_LENGKAP'\]/);
 assert.match(ui,/data-sg-bulk-row/);
 assert.match(ui,/wf-bulk-all/);
 assert.match(ui,/wf-bulk-clear/);
});

test('Two aggregate actions offer single-staff and balanced workload distribution',()=>{
 assert.match(ui,/Bagikan ke Staf Terpilih/);
 assert.match(ui,/Bagikan Merata ke Staf/);
 assert.match(ui,/mode==='SINGLE'/);
 assert.match(ui,/mode==='BALANCED'/);
 assert.match(ui,/smartgtk_workflow_bulk_assign/);
 assert.match(ui,/p_cases:rows\.map\(x=>\(\{owner_id:x\.owner_id,version:x\.version\}\)\)/);
 assert.match(ui,/confirm\('Konfirmasi PEMBAGIAN TUGAS AGREGAT/);
 assert.match(ui,/bulkAssignment:true/);
});

test('Server does not trust client; checks role, scope, staff, stage, version and audits atomically',()=>{
 assert.match(sql,/security definer set search_path = ''/);
 assert.match(sql,/id=auth\.uid\(\) and role='KABID'/);
 assert.match(sql,/p_scope not in \('TK_PAUD_PNF','SD','SMP'\)/);
 assert.match(sql,/jsonb_array_length\(p_cases\) not between 1 and 50/);
 assert.match(sql,/v_row\.version <> v_version/);
 assert.match(sql,/v_row\.status <> 'MENUNGGU_PENUGASAN'/);
 assert.match(sql,/v_row\.assigned_staff is not null/);
 assert.match(sql,/v_intake\.employment <> 'PNS'/);
 assert.match(sql,/v_intake\.data_stage not in \('DATA_TERCATAT','BERKAS_LENGKAP'\)/);
 assert.match(sql,/m\.scope=p_scope and m\.is_enabled=true/);
 assert.match(sql,/smartgtk_workflow_act\(v_owner,'ASSIGN_STAFF'/);
 assert.match(sql,/revoke all on function public\.smartgtk_workflow_bulk_assign/);
 assert.match(sql,/grant execute on function public\.smartgtk_workflow_bulk_assign/);
});

test('Cloudflare JS cache and bundle QA include the aggregate feature',()=>{
 assert.match(inject,/smartgtk-unified\.js\?v=25/);
 assert.match(qa,/smartgtk-unified\.js\?v=25/);
 assert.match(qa,/SIMANTAB_SMARTGTK_KABID_BULK_ASSIGN_V1/);
 assert.match(ui,/version:25/);
});
