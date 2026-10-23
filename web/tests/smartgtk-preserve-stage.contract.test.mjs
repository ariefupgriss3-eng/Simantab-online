import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync(new URL('../../supabase/migrations/20261023210000_smartgtk_preserve_confirmation_on_nonmaterial_save.sql',import.meta.url),'utf8');

test('non-material SMART GTK resaves preserve completion and timestamp',()=>{
 assert.match(sql,/create or replace function public\.smartgtk_mass_save/i);
 assert.match(sql,/v_before public\.smartgtk_intake%rowtype/);
 assert.match(sql,/select \* into v_before from public\.smartgtk_intake/);
 assert.match(sql,/v_core_changed:=v_before\.owner_id is null/);
 assert.match(sql,/v_reopen:=v_core_changed or not v_doc_ok/);
 assert.match(sql,/updated_at=case when v_reopen then now\(\) else smartgtk_intake\.updated_at end/);
 assert.match(sql,/data_stage=case when v_reopen then 'DRAFT' else smartgtk_intake\.data_stage end/);
 assert.match(sql,/INTAKE_RESAVED_STAGE_PRESERVED/);
});
test('material fields and invalid required documents demand re-confirmation',()=>{
 for(const marker of ['v_before.profession','v_before.employment','v_before.jf_sk','v_before.old_position',
 'v_before.nomenclature_updated','v_before.pns_jf_formation','v_before.education',
 'v_before.study_status','v_before.university','v_before.study_program',
 'v_before.graduation_date','v_before.unit_work','v_before.nip',
 "public.smartgtk_mass_status()->>'complete'"]){
  assert.ok(sql.includes(marker),marker+' must be protected');
 }
 assert.match(sql,/v_doc_ok:=coalesce/);
});
test('existing per-user authorization and safeguards are retained',()=>{
 assert.match(sql,/id=auth\.uid\(\)/);
 assert.match(sql,/role in \('GTK','KEPALA_SEKOLAH'\)/);
 assert.match(sql,/approval_status='APPROVED'/);
 assert.match(sql,/is_active=true/);
 assert.match(sql,/if not private\.smartgtk_current_user_can_participate\(\)/);
 assert.match(sql,/NIP terhubung dengan lebih dari satu akun aktif/);
});
