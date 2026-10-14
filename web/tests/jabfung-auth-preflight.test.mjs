import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../jabfung-jenjang-enhancement.js', import.meta.url), 'utf8');
const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

function harness({ profileId=UUID_A, userId=UUID_A, preflight='OK', authError=null, fileSize=100, fileType='application/pdf', insertError=null, aiError=null } = {}) {
  const calls = { insert:[], fileInsert:[], upload:[], rpc:[], ai:[], auth:0, tab:[] };
  const msg = { textContent:'', className:'small' };
  const btn = { disabled:false };
  const modalContent={textContent:'',innerHTML:''};
  const file = { name:'dokumen.pdf', size:fileSize, type:fileType };
  const fileInput = { files:[file], dataset:{ required:'1', code:'SK_CPNS' } };
  const sb = {
    auth: { async getUser() { calls.auth++; return { data:{user:userId ? {id:userId} : null}, error:authError }; } },
    async rpc(name,params) { calls.rpc.push({name,params}); return {data:preflight,error:null}; },
    from(table) {
      if(table==='submissions') return {insert(payload){
        calls.insert.push(payload);
        return {select(){return {async single(){return insertError ? {data:null,error:insertError}:{data:{id:'submission-test-1',...payload},error:null};}}}};
      }};
      if(table==='submission_files') return {async insert(payload){calls.fileInsert.push(payload);return {error:null};}};
      throw new Error('Unexpected DB table '+table);
    },
    storage: {from(bucket){assert.equal(bucket,'simantab-documents');return {async upload(path){calls.upload.push(path);return {error:null};}};}},
    functions:{async invoke(fn,args){calls.ai.push({fn,args});return aiError ? {data:null,error:aiError} : {data:{overall_status:'SESUAI',counts:{sesuai:1}},error:null};}}
  };
  const context = {
    window:{
      __simantabProfile:{id:profileId,role:'GTK'},
      __simantabSb:sb,
      openSubmission(){},
      showTab(id){calls.tab.push(id);}
    },
    document: {
      body:{},
      getElementById(id){
        return ({jabfungMsg:msg,jabfungSendBtn:btn,jabfungNotes:{value:'Pengajuan Jabfung'},jabfungAiContent:modalContent})[id]||null;
      },
      querySelectorAll(selector) { return selector==='.jabfungReqFile' ? [fileInput] : []; }
    },
    MutationObserver:class {observe(){}},
    setTimeout(){return 1;},
    crypto:{randomUUID(){return 'attachment-test';}},
    console:{error(){}}
  };
  vm.runInNewContext(source,context,{filename:'jabfung-jenjang-enhancement.js'});
  assert.equal(typeof context.window.submitJabfungJenjang,'function');
  return {calls,msg,btn,modalContent,runModal:(id)=>context.window.__runJabfungAiFromModal(id),submit:()=>context.window.submitJabfungJenjang()};
}

test('GTK APPROVED uses authenticated uid for submission, file metadata and upload path', async()=>{
  const h=harness(); await h.submit();
  assert.equal(h.calls.auth,1);
  assert.equal(h.calls.rpc.length,1);
  assert.equal(h.calls.rpc[0].name,'simantab_submission_preflight');
  assert.equal(h.calls.rpc[0].params.p_client_profile_id,UUID_A);
  assert.equal(h.calls.insert.length,1);
  assert.equal(h.calls.insert[0].user_id,UUID_A);
  assert.equal(h.calls.fileInsert[0].user_id,UUID_A);
  assert.ok(h.calls.upload[0].startsWith(UUID_A+'/submission-test-1/jabfung/'));
  assert.equal(h.calls.ai.length,0);
  assert.match(h.msg.textContent,/Verifikator dinonaktifkan sementara/);
  assert.equal(h.btn.disabled,false);
});
test('pending account blocked without insert or upload',async()=>{
  const h=harness({preflight:'NOT_APPROVED'}); await h.submit();
  assert.equal(h.calls.insert.length,0);assert.equal(h.calls.upload.length,0);
  assert.match(h.msg.textContent,/menunggu persetujuan/);
});
test('profile/session mismatch blocked before preflight',async()=>{
  const h=harness({profileId:UUID_B}); await h.submit();
  assert.equal(h.calls.rpc.length,0);assert.equal(h.calls.insert.length,0);
  assert.match(h.msg.textContent,/tidak sesuai/);
});
test('missing auth session blocked',async()=>{
  const h=harness({userId:null}); await h.submit();
  assert.equal(h.calls.insert.length,0);
  assert.match(h.msg.textContent,/Sesi login tidak valid/);
});
test('oversized file blocked before DB work',async()=>{
  const h=harness({fileSize:1572865});await h.submit();
  assert.equal(h.calls.auth,0);assert.equal(h.calls.insert.length,0);
  assert.match(h.msg.textContent,/1,5 MB/);
});
test('RLS 42501 blocked before any document upload',async()=>{
  const h=harness({insertError:{code:'42501',message:'RLS'}});await h.submit();
  assert.equal(h.calls.insert.length,1);assert.equal(h.calls.upload.length,0);
  assert.match(h.msg.textContent,/RLS 42501/);
});
test('AI suspended: new Jabfung submission succeeds without invoking AI',async()=>{
  const h=harness({aiError:new Error('AI must never be called')});await h.submit();
  assert.equal(h.calls.insert.length,1);assert.equal(h.calls.upload.length,1);
  assert.equal(h.calls.ai.length,0);
  assert.match(h.msg.textContent,/diperiksa secara manual/);
});
test('AI suspended: previously exposed modal action does not invoke verifier',async()=>{
  const h=harness();await h.runModal('submission-test-1');
  assert.equal(h.calls.ai.length,0);
  assert.match(h.modalContent.textContent,/dinonaktifkan sementara/);
});
