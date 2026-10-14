import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync(new URL('../jabfung-jenjang-enhancement.js',import.meta.url),'utf8');
const APPROVED='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';

function scenario({uiUser=APPROVED,authUser=APPROVED,approval='APPROVED',size=100,insertError=null}={}){
 const calls={auth:0,insert:[],files:[],upload:[],ai:[],rpc:[],tab:[]};
 const note={textContent:'',className:'small'};
 const btn={disabled:false};
 const modal={textContent:'',innerHTML:''};
 const input={dataset:{required:'1',code:'SKP_2025'},files:[{name:'skp.pdf',size,type:'application/pdf'}]};
 const sb={
   auth:{async getUser(){calls.auth++;return {data:{user:authUser?{id:authUser}:null},error:null};}},
   from(table){
     if(table==='profiles')return {select(){return {eq(){return {async single(){return {data:{id:authUser,is_active:true,approval_status:approval},error:null}}}}}}};
     if(table==='submissions')return {insert(payload){
       calls.insert.push(payload);
       return {select(){return {async single(){return insertError?{data:null,error:insertError}:{data:{id:'submission-1',...payload},error:null}}}}};
     }};
     if(table==='submission_files')return {async insert(payload){calls.files.push(payload);return {error:null}}};
     throw Error('Unexpected table '+table);
   },
   storage:{from(name){assert.equal(name,'simantab-documents');return {async upload(path){calls.upload.push(path);return {error:null}}}}},
   functions:{async invoke(name,args){calls.ai.push({name,args});return {data:{overall_status:'SESUAI'},error:null}}},
   async rpc(name,params){calls.rpc.push({name,params});return {data:'OK',error:null}}
 };
 const doc={
   body:{},
   getElementById(id){return ({jabfungMsg:note,jabfungSendBtn:btn,jabfungNotes:{value:'Jabfung'},jabfungAiContent:modal})[id]||null},
   querySelectorAll(s){return s==='.jabfungReqFile'?[input]:[]}
 };
 const context={
   window:{__simantabProfile:{id:uiUser},__simantabSb:sb,openSubmission(){},showTab(tab){calls.tab.push(tab)}},
   document:doc,
   MutationObserver:class{observe(){}},
   setTimeout(){},
   crypto:{randomUUID:()=>'mock-uuid'},
   console:{error(){}},
 };
 vm.runInNewContext(src,context,{filename:'jabfung-jenjang-enhancement.js'});
 assert.equal(typeof context.window.submitJabfungJenjang,'function');
 return {calls,note,btn,context,send:()=>context.window.submitJabfungJenjang()};
}

test('cloudflare build identifies CF-JF6 manual and preserves preflight',()=>{
 assert.match(src,/CF-JF6 Manual/);
 assert.match(src,/Kirim Usul \(Verifikasi Manual\)/);
 assert.match(src,/simCheckJabfungUploadRights/);
 assert.match(src,/const JABFUNG_AI_ENABLED=false/);
 assert.match(src,/rlsBlockedUntil/);
});
test('approved account uploads successfully but never calls AI',async()=>{
 const s=scenario();await s.send();
 assert.equal(s.calls.auth,1);
 assert.equal(s.calls.insert.length,1);
 assert.equal(s.calls.insert[0].user_id,APPROVED);
 assert.equal(s.calls.files[0].user_id,APPROVED);
 assert.equal(s.calls.upload.length,1);
 assert.match(s.note.textContent,/diperiksa manual/);
 assert.equal(s.calls.ai.length,0);
 assert.equal(s.btn.disabled,false);
});
test('unapproved account cannot submit',async()=>{
 const s=scenario({approval:'PENDING'});await s.send();
 assert.equal(s.calls.insert.length,0);
 assert.equal(s.calls.ai.length,0);
 assert.match(s.note.textContent,/Akun belum disetujui/);
});
test('auth identity mismatch fails closed',async()=>{
 const s=scenario({uiUser:OTHER});await s.send();
 assert.equal(s.calls.insert.length,0);
 assert.equal(s.calls.upload.length,0);
 assert.match(s.note.textContent,/tidak sesuai/);
});
test('file greater than 1.5 MiB fails before any insert',async()=>{
 const s=scenario({size:1572865});await s.send();
 assert.equal(s.calls.auth,0);
 assert.equal(s.calls.insert.length,0);
 assert.match(s.note.textContent,/1,5 MB/);
});
test('RLS 42501 prevents storage uploads',async()=>{
 const s=scenario({insertError:{code:'42501',message:'new row violates row-level security policy'}});
 await s.send();
 assert.equal(s.calls.insert.length,1);
 assert.equal(s.calls.upload.length,0);
 assert.match(s.note.textContent,/aturan keamanan database/);
});
test('old modal API is disabled and invokes no AI',async()=>{
 const s=scenario();
 await s.context.window.__runJabfungAiFromModal('submission-1');
 assert.equal(s.calls.ai.length,0);
 assert.match(s.context.document.getElementById('jabfungAiContent').textContent,/dinonaktifkan sementara/);
});
