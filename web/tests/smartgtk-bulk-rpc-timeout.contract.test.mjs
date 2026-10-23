import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../../supabase/migrations/20261023190000_smartgtk_kabid_bulk_timeout_fastpath.sql',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../smartgtk-unified.js',import.meta.url),'utf8');

test('bulk RPC sync happens only once per batch, not per GTK',()=>{
 assert.match(sql,/create or replace function public\.smartgtk_workflow_bulk_assign/i);
 assert.equal((sql.match(/perform private\.smartgtk_workflow_sync\(\)/g)||[]).length,1);
 assert.doesNotMatch(sql,/public\.smartgtk_workflow_act\(/i);
 assert.match(sql,/update public\.smartgtk_workflow/);
 assert.match(sql,/insert into public\.smartgtk_workflow_events/);
 assert.match(sql,/get diagnostics v_rows=row_count/);
 assert.match(sql,/v_rows<>1/);
});
test('strict Kabid permissions, scope, PNS readiness, audit and atomic version guard preserved',()=>{
 for(const requirement of [
  /id=auth\.uid\(\) and role='KABID'/,
  /p_scope not in \('TK_PAUD_PNF','SD','SMP'\)/,
  /jsonb_array_length\(p_cases\) not between 1 and 50/,
  /v_row\.version <> v_version/,
  /v_row\.assigned_staff is not null/,
  /v_intake\.employment <> 'PNS'/,
  /v_intake\.data_stage not in \('DATA_TERCATAT','BERKAS_LENGKAP'\)/,
  /v_intake\.updated_at > v_row\.source_updated_at/,
  /where owner_id=v_owner and version=\(v_item->>'version'\)::integer/,
  /grant execute on function public\.smartgtk_workflow_bulk_assign/,
  /revoke all on function public\.smartgtk_workflow_bulk_assign/
 ])assert.match(sql,requirement);
 assert.match(sql,/actor_id,action,from_status,to_status,note/);
});
test('Kabid receives visible feedback near one-click action',()=>{
 assert.match(ui,/SMARTGTK_BULK_VISIBLE_FEEDBACK_V1/);
 assert.match(ui,/id="sgQuickFeedback"/);
 assert.match(ui,/quickAssignmentFeedback\('Sedang membagikan tugas/);
 assert.match(ui,/quickAssignmentFeedback\('❌ Pembagian tugas gagal/);
 assert.match(ui,/quickAssignmentFeedback\('✅ '\+success/);
 assert.match(ui,/bulkVisibleFeedback:true/);
});
