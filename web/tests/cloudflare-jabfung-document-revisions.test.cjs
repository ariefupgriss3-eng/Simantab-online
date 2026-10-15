'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'jabfung-document-revisions.js'),'utf8');
const schema=fs.readFileSync(path.join(root,'../supabase/migrations/20261015162000_jabfung_document_revision_workflow.sql'),'utf8');
const finalizer=fs.readFileSync(path.join(root,'finalize-html.mjs'),'utf8');
const cloudflare=fs.readFileSync(path.join(root,'cloudflare/postbuild.mjs'),'utf8');

function mount(role='GTK'){
 const window={
   __simantabProfile:{id:'owner-test-id',role},
   __simantabSb:{},
   showTab:async x=>x,
   addEventListener:()=>{}
 };
 const document={getElementById:()=>null};
 const context={window,document,setTimeout:()=>{},console};
 vm.runInNewContext(src,context,{timeout:1800});
 return window.__simantabJabfungDocumentRevisions;
}
test('UI separates GTK uploads from assigned staff requests',()=>{
 assert.equal(mount('GTK').isGtk(),true);
 assert.equal(mount('KEPALA_SEKOLAH').isGtk(),true);
 assert.equal(mount('PENGAWAS').isGtk(),true);
 assert.equal(mount('OPERATOR_SMP').isGtk(),false);
 assert.equal(mount('STAFF_KP_EKIN').isStaff(),true);
 assert.equal(mount('SUPER_ADMIN').isStaff(),true);
 assert.equal(mount('KABID').isStaff(),true);
 assert.equal(mount('OPERATOR_KORWIL').isStaff(),false);
 assert.equal(mount('GTK').isStaff(),false);
});
test('upload paths are per owner, submission, revision and requested code',()=>{
 assert.match(src,/uid\+'\/'\+submissionId\+'\/jabfung-revisi\/'\+revisionId\+'\/'\+x\.code\+'\/'/);
 assert.match(src,/crypto\.randomUUID\(\)/);
 assert.equal(mount().safeFileName('SK KP Final #1.pdf'),'SK_KP_Final_1.pdf');
 assert.match(src,/f\.size>1572864/);
 assert.match(src,/image\/jpeg/);
 assert.match(src,/application\/pdf/);
});
test('upload records correction on the original submission only',()=>{
 assert.match(src,/sb\.rpc\('jabfung_revision_submit'/);
 assert.match(src,/sb\.rpc\('jabfung_revision_open'/);
 assert.match(src,/sb\.rpc\('jabfung_revision_close'/);
 assert.doesNotMatch(src,/from\('submissions'\)\.insert/);
 assert.match(src,/if\(authError\|\|!auth\?\.user\?\.id\|\|auth\.user\.id!==uid\)/);
});
test('backend keeps old files and uses restricted revision writes',()=>{
 assert.match(schema,/CREATE TABLE IF NOT EXISTS public\.jabfung_revision_requests/);
 assert.match(schema,/CREATE TABLE IF NOT EXISTS public\.jabfung_revision_uploads/);
 assert.match(schema,/CREATE UNIQUE INDEX IF NOT EXISTS jabfung_revision_one_active/);
 assert.match(schema,/ENABLE ROW LEVEL SECURITY/);
 assert.match(schema,/REVOKE ALL ON public\.jabfung_revision_requests,public\.jabfung_revision_uploads FROM PUBLIC,anon,authenticated/);
 assert.match(schema,/GRANT SELECT ON public\.jabfung_revision_requests,public\.jabfung_revision_uploads TO authenticated/);
 assert.match(schema,/private\.jabfung_revision_staff_allowed\(p_submission_id\)/);
 assert.match(schema,/v_r\.owner_id<>v_uid/);
 assert.match(schema,/INSERT INTO public\.submission_files/);
 assert.doesNotMatch(schema,/DELETE FROM public\.submission_files|UPDATE public\.submission_files|INSERT INTO public\.submissions/);
 assert.match(schema,/v_actual_size<>v_size/);
 assert.match(schema,/v_actual_type IS DISTINCT FROM v_mime/);
});
test('build appends only Cloudflare UI module and checks it is present',()=>{
 assert.match(finalizer,/\['jabfung-document-revisions\.js',1\]/);
 assert.match(finalizer,/SIMANTAB_BUILD_TARGET === 'cloudflare'/);
 assert.match(cloudflare,/SIMANTAB_JABFUNG_DOCUMENT_REVISIONS_V1_CLOUDFLARE/);
});
