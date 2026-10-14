'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const patch=fs.readFileSync(path.join(root,'cloudflare/harden-gtk-submission.mjs'),'utf8');
const bootstrap=fs.readFileSync(path.join(root,'cloudflare/bootstrap-production-20261013.html'),'utf8');

async function result(){
 let html=bootstrap;
 const script=patch.replace(/^import[^\n]*\n/gm,'');
 const f=new Function('fs','path','console','return (async()=>{'+script+'})()');
 await f({
  async readFile(){return html},
  async writeFile(_,v){html=v}
 },{join:(...parts)=>parts.join('/')},{log(){}});
 const start=html.indexOf('window.sendSubmission=async()=>{');
 const end=html.indexOf('\nasync function loadStatus(){',start);
 return html.slice(start,end);
}
test('generic submission verifies auth session and approved user before writing',async()=>{
 const s=await result();
 assert.match(s,/await sb\.auth\.getUser\(\)/);
 assert.match(s,/profile\.id!==ownerId/);
 assert.match(s,/approval_status!=='APPROVED'/);
 assert.match(s,/user_id:ownerId/);
 assert.doesNotMatch(s,/user_id:profile\.id/);
});
test('generic document upload uses the same verified ID as submission',async()=>{
 const s=await result();
 assert.match(s,/const path=.*ownerId/);
 assert.match(s,/submission_id:sub\.id,user_id:ownerId/);
 assert.match(s,/OPERATOR_KORWIL.*OPERATOR_SMP/);
});
test('legacy workflow survives the patch and RLS still governs server writes',async()=>{
 const s=await result();
 assert.match(s,/window\.sendSubmission=async/);
 assert.match(s,/window\.showTab|showTab\(/);
 assert.match(s,/sb\.from\('submissions'\)\.insert/);
 assert.match(s,/sb\.from\('submission_files'\)\.insert/);
 assert.match(s,/code==='42501'/);
 assert.doesNotMatch(patch,/CREATE POLICY|ALTER TABLE|service_role/);
});
