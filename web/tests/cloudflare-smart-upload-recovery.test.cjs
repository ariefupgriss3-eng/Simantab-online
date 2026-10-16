'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../smart-upload-recovery.js'),'utf8');
const finalizer=fs.readFileSync(path.join(__dirname,'../finalize-html.mjs'),'utf8');
const post=fs.readFileSync(path.join(__dirname,'../cloudflare/postbuild.mjs'),'utf8');
const harden=fs.readFileSync(path.join(__dirname,'../cloudflare/harden-gtk-submission.mjs'),'utf8');
const JF=fs.readFileSync(path.join(__dirname,'../jabfung-jenjang-enhancement.js'),'utf8');
const KP=fs.readFileSync(path.join(__dirname,'../kp-enhancement.js'),'utf8');
const CUTI=fs.readFileSync(path.join(__dirname,'../cuti-requirements.js'),'utf8');
const REV=fs.readFileSync(path.join(__dirname,'../jabfung-document-revisions.js'),'utf8');
function memoryIdb(){
 const rows=new Map();let created=false;
 const database={
  objectStoreNames:{contains:()=>created},
  createObjectStore:()=>{created=true},
  transaction:()=>{
   const tx={
    oncomplete:null,onerror:null,onabort:null,
    objectStore:()=>({
     put(obj){queueMicrotask(()=>{rows.set(obj.id,obj);tx.oncomplete?.()})},
     delete(id){queueMicrotask(()=>{rows.delete(id);tx.oncomplete?.()})},
     get(id){let request={onsuccess:null,onerror:null,result:null};queueMicrotask(()=>{request.result=rows.get(id);request.onsuccess?.()});return request},
     getAll(){let request={onsuccess:null,onerror:null,result:null};queueMicrotask(()=>{request.result=[...rows.values()];request.onsuccess?.()});return request}
    })
   };
   return tx;
  }
 };
 return {rows,open:()=>{
  const request={onsuccess:null,onupgradeneeded:null,onerror:null,onblocked:null,result:database,error:null};
  queueMicrotask(()=>{if(!created)request.onupgradeneeded?.();request.onsuccess?.()});
  return request;
 }};
}
function mount({offline=true}={}){
 const storage=memoryIdb(),els={
  jabfungMsg:{textContent:'',className:''},
  jabfungNotes:{value:''},
  kpMsg:{textContent:'',className:''},
  subMsg:{textContent:'',className:''}
 };
 const input={
  dataset:{required:'1',code:'SK_PNS'},
  files:[{name:'SK_PNS.pdf',size:20480,type:'application/pdf'}]
 };
 let uuid=0;
 const window={
  __simantabProfile:{id:'owner-uuid',role:'GTK'},
  __simantabSb:{},
  showTab:async name=>name,
  indexedDB:storage,
  confirm:()=>true,
  logout:async()=>true,
  addEventListener(){}
 };
 const document={
  getElementById:id=>els[id]||null,
  querySelectorAll:q=>q==='.jabfungReqFile'?[input]:[]
 };
 const crypto={randomUUID:()=> '00000000-0000-4000-8000-'+(++uuid).toString().padStart(12,'0')};
 const navigator={onLine:!offline};
 vm.runInNewContext(src,{window,document,crypto,navigator,console,
  setTimeout:()=>{}},{timeout:2000});
 return {api:window.simantabSmartUpload,storage,window,els,input,navigator};
}
test('stores required Jabfung documents locally before any network write',async()=>{
 const {api,storage,els}=mount();
 assert.equal(api.version,1);
 const first=await api.startJabfung();
 assert.equal(first.queued,true);
 assert.equal(storage.rows.size,1);
 const draft=[...storage.rows.values()][0];
 assert.equal(draft.ownerId,'owner-uuid');
 assert.equal(draft.serviceType,'E_JABFUNG');
 assert.equal(draft.files.length,1);
 assert.match(draft.files[0].path,/owner-uuid\/00000000-0000-4000-8000-000000000001\/jabfung\//);
 assert.match(els.jabfungMsg.textContent,/tersimpan lokal/i);
 assert.equal(draft.serverSubmissionCreated,false);
});
test('repeated submission click reuses existing queue, no duplicate submission ID',async()=>{
 const {api,storage}=mount();
 await api.startJabfung();
 const oldId=[...storage.rows.keys()][0];
 const second=await api.startJabfung();
 assert.equal(second.duplicatePrevented,true);
 assert.equal(storage.rows.size,1);
 assert.equal([...storage.rows.keys()][0],oldId);
 const offline=await api.resume(oldId);
 assert.equal(offline.offline,true);
 await api.clearOwner('owner-uuid');
 assert.equal(storage.rows.size,0);
});
test('file size, format and name are validated without paid server',()=>{
 const {api}=mount();
 const bad=()=>api.__test.assertFile({size:1572865,name:'abc.pdf',type:'application/pdf'});
 assert.throws(bad,/1,5 MB/);
 assert.throws(()=>api.__test.assertFile({size:100,name:'bad.exe',type:'application/octet-stream'}),/PDF\/JPG\/PNG/);
 assert.equal(api.__test.sanitizeName('SK KP #2026.pdf'),'SK_KP__2026.pdf');
});
test('resume uses fixed client-generated submission_id and checks remote file metadata',()=>{
 assert.match(src,/const uid=P\(\)\.id,id=crypto\.randomUUID\(\),subId=submissionId\|\|id/);
 assert.match(src,/id:job\.submissionId,user_id:job\.ownerId,service_type:job\.serviceType/);
 assert.match(src,/\.eq\('id',job\.submissionId\)\.maybeSingle\(\)/);
 assert.match(src,/error\.code!=='23505'/);
 assert.match(src,/\.eq\('storage_path',file\.path\)\.maybeSingle\(\)/);
 assert.match(src,/Number\(row\.file_size\)/);
 assert.match(src,/await uploadBlob\(job,file\)/);
 assert.match(src,/await submitMetadata\(job,file\)/);
 assert.match(src,/await remove\(job\.id\)/);
 assert.doesNotMatch(src,/\.upsert\(\{.*status.*COMPLETED/);
});
test('checks user and approved status before server writes, no token persisted',()=>{
 assert.match(src,/sb\.auth\.getUser\(\)/);
 assert.match(src,/data\.user\.id!==uid\|\|P\(\)\.id!==uid/);
 assert.match(src,/profile\.approval_status!=='APPROVED'/);
 assert.match(src,/liveProfileGate\(\)/);
 assert.match(src,/clearOwner\(uid\)/);
 assert.match(src,/TTL_MS=72\*60\*60\*1000/);
 assert.doesNotMatch(src,/session\.access_token|localStorage\.setItem|service_role/);
});
test('Cloudflare-only module integrates Jabfung, KP, cuti, generic and correction forms',()=>{
 assert.match(JF,/simantabSmartUpload\?\.startJabfung/);
 assert.match(KP,/simantabSmartUpload\?\.startKp/);
 assert.match(CUTI,/simantabSmartUpload\?\.startCuti/);
 assert.match(REV,/simantabSmartUpload\?\.startRevision/);
 assert.match(harden,/simantabSmartUpload\?\.startGeneric/);
 assert.match(finalizer,/\['smart-upload-recovery\.js',2\]/);
 assert.match(post,/SIMANTAB_SMART_UPLOAD_RECOVERY_V1_FREE_CLOUDFLARE/);
});
test('no new paid external services and no byte-level resume claims',()=>{
 assert.match(src,/IndexedDB browser/);
 assert.match(src,/bukan kelanjutan sebagian byte/);
 assert.doesNotMatch(src,/stripe|payment_required|tus\.io|cloudinary|openai\.com\/v1/i);
});
