'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'jabfung-jenjang-enhancement.js'),'utf8');
const recovery=fs.readFileSync(path.join(root,'smart-upload-recovery.js'),'utf8');
const finalizer=fs.readFileSync(path.join(root,'finalize-html.mjs'),'utf8');
const post=fs.readFileSync(path.join(root,'cloudflare/postbuild.mjs'),'utf8');

function fakeFile(name,size=20000,type='application/pdf'){return {name,size,type};}
function mount(){
 const elements={
  jabfungChecklistSummary:{textContent:'',style:{}},
  jabfungChecklistProgress:{value:0,max:1},
  jabfungMissingList:{textContent:'',innerHTML:''},
  jabfungSendBtn:{disabled:true,title:'',textContent:''},
  jabfungMsg:{className:'',textContent:''},
  jabfungNotes:{value:''}
 };
 const inputs=[
  {dataset:{required:'1',code:'SK_CPNS',label:'SK CPNS'},files:[]},
  {dataset:{required:'1',code:'SK_PNS',label:'SK PNS'},files:[fakeFile('SK PNS.pdf')]},
  {dataset:{required:'0',code:'OTHER',label:'Dokumen Lain'},files:[]}
 ];
 for(const input of inputs){
  const feedback={textContent:'',style:{}};
  input.feedback=feedback;
  input.closest=()=>({querySelector:()=>feedback});
 }
 let submitted=0;
 const document={
  getElementById:id=>elements[id]||null,
  querySelectorAll:selector=>selector==='.jabfungReqFile'?inputs:[],
  body:{}
 };
 const window={
  __simantabSb:{},
  __simantabProfile:{id:'fake-login-id'},
  openSubmission:async()=>{},
  showTab:async()=>{},
  simantabSmartUpload:{startJabfung:async()=>{submitted++;return {success:true};}}
 };
 const MutationObserver=class {observe(){}};
 vm.runInNewContext(source,{window,document,MutationObserver,setTimeout:()=>{},console},{timeout:1800});
 return {window,document,elements,inputs,get submitted(){return submitted}};
}

test('required/optional file checklist activates Send only when required files are valid',()=>{
 const {window,elements,inputs}=mount();
 assert.equal(typeof window.simJabfungUpdateChecklist,'function');
 const first=window.simJabfungUpdateChecklist();
 assert.equal(first.required,2);
 assert.equal(first.validRequired,1);
 assert.equal(first.optional,0);
 assert.equal(first.ready,false);
 assert.equal(elements.jabfungSendBtn.disabled,true);
 assert.match(elements.jabfungChecklistSummary.textContent,/1 dari 2/);
 assert.match(elements.jabfungMissingList.innerHTML,/SK CPNS/);
 assert.match(inputs[0].feedback.textContent,/WAJIB/);

 inputs[0].files=[fakeFile('SK CPNS.pdf',1572865)];
 const oversized=window.simJabfungUpdateChecklist();
 assert.equal(oversized.ready,false);
 assert.equal(oversized.invalid.length,1);
 assert.match(inputs[0].feedback.textContent,/maksimal 1,5 MB/);

 inputs[0].files=[fakeFile('SK CPNS.pdf',12000)];
 const valid=window.simJabfungUpdateChecklist();
 assert.equal(valid.ready,true);
 assert.equal(elements.jabfungChecklistProgress.value,2);
 assert.equal(elements.jabfungSendBtn.disabled,false);
 assert.match(elements.jabfungChecklistSummary.textContent,/Semua 2 berkas wajib/);
 assert.match(inputs[2].feedback.textContent,/Opsional/);
});

test('prevents invalid file submissions and routes one-click send to Smart Upload',async()=>{
 const app=mount();
 await app.window.submitJabfungJenjang();
 assert.equal(app.submitted,0);
 assert.match(app.elements.jabfungMsg.textContent,/Berkas wajib belum lengkap/);
 app.inputs[0].files=[fakeFile('SK CPNS.pdf')];
 await app.window.submitJabfungJenjang();
 assert.equal(app.submitted,1);
 app.window.simJabfungSetSending(true);
 assert.equal(app.elements.jabfungSendBtn.disabled,true);
 assert.match(app.elements.jabfungSendBtn.textContent,/Mengirim berkas/);
 app.window.simJabfungSetSending(false);
 assert.equal(app.elements.jabfungSendBtn.disabled,false);
});

test('rendered form uses simple instruction, per-file feedback and hidden advanced diagnostic',()=>{
 assert.match(source,/SIMANTAB_JABFUNG_EASY_UPLOAD_V1/);
 assert.match(source,/onchange="simJabfungUpdateChecklist\(\)"/);
 assert.match(source,/jabfungFileFeedback/);
 assert.match(source,/jabfungChecklistProgress/);
 assert.match(source,/Periksa hak kirim \(hanya jika ada kendala\)/);
 assert.match(source,/Kirim Usulan Jabfung/);
 assert.doesNotMatch(source,/onclick="submitJabfungJenjang\(\)">📤 Kirim Usul & Jalankan AI Verifikator/);
 assert.match(source,/window\.simJabfungUpdateChecklist\(\);/);
});

test('backend client verifies preflight and metadata before claiming successful upload',()=>{
 assert.match(recovery,/startingJobs\.add\(lock\)/);
 assert.match(recovery,/await preflightJabfung\(job\)/);
 assert.match(recovery,/await submitMetadata\(job,file\)/);
 assert.match(recovery,/file\.confirmed=true/);
 assert.match(recovery,/confirmFileCount\(j\)/);
 assert.match(recovery,/BERHASIL!/);
 assert.match(recovery,/await remove\(job\.id\)/);
 assert.match(recovery,/Tanpa|tanpa membuat pengajuan baru/);
 assert.match(finalizer,/\['smart-upload-recovery\.js',2\]/);
 assert.match(finalizer,/\['jabfung-jenjang-enhancement\.js',process\.env\.SIMANTAB_BUILD_TARGET === 'cloudflare' \? 7 : 5\]/);
 assert.match(post,/SIMANTAB_JABFUNG_EASY_UPLOAD_V1/);
});
