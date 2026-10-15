'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const sql=fs.readFileSync(path.join(root,'../supabase/migrations/20261015203500_unique_nip_registration_guard.sql'),'utf8');
const edge=fs.readFileSync(path.join(root,'../supabase/functions/simantab-register-pending/index.ts'),'utf8');
const ui=fs.readFileSync(path.join(root,'duplicate-nip-audit.js'),'utf8');
const registration=fs.readFileSync(path.join(root,'registration-ui-final.js'),'utf8');
const finalizer=fs.readFileSync(path.join(root,'finalize-html.mjs'),'utf8');
const post=fs.readFileSync(path.join(root,'cloudflare/postbuild.mjs'),'utf8');

test('database serializes NIP registration and blocks new NIP duplicate',()=>{
 assert.match(sql,/BEFORE INSERT OR UPDATE OF nip ON public\.profiles/);
 assert.match(sql,/pg_advisory_xact_lock\(20261015,hashtext\(v_nip\)\)/);
 assert.match(sql,/regexp_replace\(coalesce\(p\.nip,''\),'\\[\^0-9\]'/);
 assert.match(sql,/ERRCODE='23505'/);
 assert.match(sql,/simantab_one_nip_one_account/);
 assert.match(sql,/p\.id IS DISTINCT FROM NEW\.id/);
 assert.match(sql,/TG_OP='UPDATE'/);
 assert.match(sql,/OLD\.nip/);
 assert.doesNotMatch(sql,/DELETE FROM public\.profiles|TRUNCATE|DROP TABLE public\.profiles/);
});
test('existing duplicate NIPs remain intact for review, not auto-deactivated',()=>{
 assert.match(sql,/IF TG_OP='UPDATE'/);
 assert.match(sql,/RETURN NEW;/);
 assert.doesNotMatch(sql,/UPDATE public\.profiles SET .*is_active=false/);
 assert.doesNotMatch(sql,/DELETE FROM auth\.users/);
});
test('read-only audit RPC only available to active approved Super Admin',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.simantab_duplicate_nip_audit/);
 assert.match(sql,/p\.role='SUPER_ADMIN'/);
 assert.match(sql,/p\.is_active=true/);
 assert.match(sql,/p\.approval_status='APPROVED'/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.simantab_duplicate_nip_audit\(\) FROM PUBLIC,anon/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.simantab_duplicate_nip_audit\(\) TO authenticated/);
 assert.match(sql,/LEFT JOIN auth\.users/);
 assert.match(sql,/jsonb_agg/);
});
test('server preflight rejects same NIP before Auth createUser, race guarded in DB',()=>{
 assert.match(edge,/if\(nip\)\{/);
 assert.match(edge,/\.select\("id"\)\.eq\("nip",nip\)\.limit\(1\)/);
 assert.match(edge,/NIP_ALREADY_REGISTERED/);
 assert.match(edge,/NIP sudah terdaftar di SIMANTAB/);
 const check=edge.indexOf('if(nip){');
 const create=edge.indexOf('admin.auth.admin.createUser(');
 assert.ok(check>=0&&create>check,'Duplicate check must execute before createUser');
});
test('signup UI guides account recovery, not a second registration',()=>{
 assert.match(registration,/NIP sudah terdaftar\. Jangan daftar ulang/);
 assert.match(registration,/Masuk atau Lupa Password/);
 assert.match(registration,/setText\(sub,'Satu NIP hanya untuk satu akun SIMANTAB/);
});
test('Cloudflare-only Super Admin view has no account edits and exports review CSV',async()=>{
 new vm.Script(ui,{filename:'duplicate-nip-audit.js'});
 const window={__simantabSb:{},__simantabProfile:{id:'test-admin',role:'SUPER_ADMIN'},
 showTab:async()=>{},addEventListener(){}};
 const document={getElementById:()=>null};
 vm.runInNewContext(ui,{window,document,console,setTimeout:()=>{}},{timeout:1700});
 await Promise.resolve();await Promise.resolve();
 assert.equal(window.__simantabDuplicateNipAudit?.version,1);
 assert.equal(window.__simantabDuplicateNipAudit?.viewOnly,true);
 assert.match(ui,/sb\.rpc\('simantab_duplicate_nip_audit'\)/);
 assert.match(ui,/Unduh CSV untuk Super Admin/);
 assert.doesNotMatch(ui,/from\('profiles'\)\.update|from\('profiles'\)\.delete|deleteUser|\.upsert/);
 assert.match(finalizer,/\['duplicate-nip-audit\.js',1\]/);
 assert.match(finalizer,/SIMANTAB_BUILD_TARGET === 'cloudflare'/);
 assert.match(post,/SIMANTAB_SUPER_ADMIN_DUPLICATE_NIP_AUDIT_V1_CLOUDFLARE/);
});
