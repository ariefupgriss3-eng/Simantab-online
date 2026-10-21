import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ui=read('../smartgtk-unified.js');
const migration=read('../../supabase/migrations/20261021150000_smartgtk_unified_intake.sql');
const injection=read('../inject-jf-guru-2026.mjs');
const jf=read('../jf-guru-2026.js'),ed=read('../jf-qualification-2030.js');
test('one responsive SMART-GTK form loads only after login and is bundled exactly once',()=>{
 assert.doesNotThrow(()=>new Function(ui));
 assert.match(ui,/SIMANTAB_SMARTGTK_UNIFIED_INTAKE_V1/);
 assert.match(ui,/simantab:profile-ready/);
 assert.match(ui,/Simpan & Analisis Otomatis/);
 assert.match(ui,/smartgtkTile/);
 assert.match(injection,/smartgtk-unified\.js\?v=1/);
 assert.match(jf,/applicant\(\)&&window\.__simantabSmartGtkReady/);
 assert.match(ed,/gtk\(\)&&window\.__simantabSmartGtkReady/);
});
test('all GTK answer the same fields, with education reused and no false automatic SK',()=>{
 for(const field of ['employment','jf_sk','old_position','nomenclature_updated','pns_jf_formation','education','study_status','university','program','start_year','target_graduation','graduation_date'])
   assert.ok(ui.includes(field),field);
 assert.match(ui,/jf2030_qualification/);
 assert.match(ui,/p_education:v\.education/);
 assert.match(ui,/smartgtk_save/);
 assert.match(ui,/Data tersimpan dan berhasil diklasifikasikan/);
 assert.match(ui,/bukan keputusan|bukan pengajuan resmi otomatis/i);
 assert.doesNotMatch(ui,/jf2026_submit_case/);
 assert.doesNotMatch(ui,/jf2026_transition/);
});
test('backend is the classification authority, with RLS, duplicate NIP checks and audit',()=>{
 assert.match(migration,/create or replace function public\.smartgtk_classify/);
 assert.match(migration,/create or replace function public\.smartgtk_save/);
 assert.match(migration,/create or replace function public\.smartgtk_officer_list/);
 assert.match(migration,/smartgtk_education_study_coherent/);
 assert.match(migration,/private\.jf2026_is_officer/);
 assert.match(migration,/enable row level security/);
 assert.match(migration,/count\(\*\) from public\.profiles/);
 assert.match(migration,/NIP terhubung dengan lebih dari satu akun/);
 assert.match(migration,/perform public\.jf2030_save_progress/);
 assert.match(migration,/INTAKE_SAVED_ANALYZED/);
 assert.match(migration,/revoke all on public\.smartgtk_intake/);
});
test('three classifications remain independent, provisional, and qualification-aware',()=>{
 for(const code of ['POTENSI_USUL','TERTAHAN_KUALIFIKASI','PERLU_PEMENUHAN_2030','TELAAH_KHUSUS','PERLU_DATA','DINYATAKAN_MEMENUHI_BELUM_VERIFIKASI'])
   assert.match(migration,new RegExp(code));
 assert.match(migration,/SKRINING_AWAL_BUKAN_KEPUTUSAN/);
 assert.match(migration,/p_employment<>'PNS'/);
});

test('all GTK include non-ASN without ASN NIP but ASN 18-digit requirement remains',()=>{
 assert.match(migration,/nip text not null default ''/);
 assert.match(migration,/p_employment in \('PNS','PPPK','PPPK_PW'\)/);
 assert.match(migration,/Legacy education 2030 RPC requires NIP/);
 assert.match(read('./smartgtk-integration.sql'),/Non-ASN GTK may not have ASN NIP/);
});

test('review state stays intact for personnel-only updates',()=>{
 const safety=read('../../supabase/migrations/20261021160000_smartgtk_preserve_education_reviews.sql');
 assert.match(safety,/v_existing\.notes is distinct from coalesce\(p_notes,''\)/);
 assert.match(safety,/v_existing\.university is distinct from btrim/);
 assert.match(safety,/v_existing\.owner_id is null/);
 assert.match(read('./smartgtk-integration.sql'),/personnel edit erased diploma correction review/);
 assert.match(ui,/try\{await save\(\)\}catch\(error\)/);
});
