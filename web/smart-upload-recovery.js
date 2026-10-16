/* SIMANTAB_SMART_UPLOAD_RECOVERY_V1_FREE_CLOUDFLARE
   Gratis: IndexedDB browser + Supabase Storage existing + reconnect retry.
   Tidak melakukan cache HTTP dokumen, tidak memakai AI berbayar, dan tidak melakukan unggah ketika logout.
   Berkas 1,5 MB diulang per-berkas; bukan kelanjutan sebagian byte/unggah TUS.
*/
(async()=>{
'use strict';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<140&&(!window.__simantabSb||!window.__simantabProfile||!window.showTab);i++)await sleep(50);
const sb=window.__simantabSb, P=()=>window.__simantabProfile||{}, $=id=>document.getElementById(id);
if(!sb)return;
const DB_NAME='simantab-smart-upload-free-v1',STORE='jobs',DB_VERSION=1;
const TTL_MS=72*60*60*1000,MAX_FILE=1572864;
const TYPES=['application/pdf','image/jpeg','image/png'];
const JOB_TYPES=new Set(['E_JABFUNG','KP','GENERIC','CUTI','JABFUNG_REVISION']);
let busy=false,rendering=false,dbPromise=null,loginOwner=null;
const startingJobs=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sanitizeName=s=>String(s||'berkas.pdf').normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-95);
const getMsg=(name)=>$(name)||$('subMsg');
function message(text,ok=false,id){
 const el=id?$(id):$('smartUploadNotice');
 if(el){
  el.className=ok?'okmsg':/gagal|ditolak|belum tuntas|tidak sesuai|perlu diperbaiki|belum lengkap/i.test(text)?'err':'small';
  el.textContent=text;
 }
}
function notifyJob(job,text,ok=false,messageId=null){
 const id=messageId||(job?.kind==='E_JABFUNG'?'jabfungMsg':null);
 message(text,ok,id);
 const notice=$('simSmartUploadProgress');
 if(notice)notice.textContent=text;
}
function confirmFileCount(job){
 return job.files.filter(f=>f.confirmed===true).length;
}
function db(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error('Penyimpanan lokal IndexedDB tidak didukung browser ini.'));return;}
  const r=window.indexedDB.open(DB_NAME,DB_VERSION);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error||new Error('IndexedDB tidak dapat dibuka.'));
  r.onblocked=()=>reject(new Error('Penyimpanan browser dipakai tab lain. Tutup tab SIMANTAB lain.'));
 }).catch(e=>{dbPromise=null;throw e});
 return dbPromise;
}
async function readOne(id){
 const d=await db();return new Promise((resolve,reject)=>{
  const t=d.transaction(STORE,'readonly'),r=t.objectStore(STORE).get(id);
  r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error||new Error('Gagal membaca antrean offline.'));
 });
}
async function listAll(){
 const d=await db();return new Promise((resolve,reject)=>{
  const t=d.transaction(STORE,'readonly'),r=t.objectStore(STORE).getAll();
  r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error||new Error('Gagal membaca antrean offline.'));
 });
}
async function put(job){
 const d=await db();return new Promise((resolve,reject)=>{
  const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(job);
  t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error||new Error('Penyimpanan offline penuh atau tidak diizinkan.'));
  t.onabort=()=>reject(t.error||new Error('Penyimpanan offline gagal.'));
 });
}
async function remove(id){
 const d=await db();return new Promise((resolve,reject)=>{
  const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).delete(id);
  t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error||new Error('Gagal menghapus antrean lokal.'));
 });
}
async function pruneExpired(){
 const items=await listAll(),now=Date.now();
 for(const j of items)if(Number(j.expiresAt)<now)await remove(j.id);
}
async function ownerJobs(uid){
 if(!uid)return [];
 await pruneExpired();
 return (await listAll()).filter(j=>j.ownerId===uid).sort((a,b)=>a.createdAt-b.createdAt);
}
async function clearOwner(uid){
 if(!uid)return;
 for(const job of await listAll())if(job.ownerId===uid)await remove(job.id);
}
function liveProfileGate(){return !!window.__simantabMandatoryPersonnelProfile?.isBlocked?.();}
function assertFile(file,limit=MAX_FILE){
 if(!file||typeof file.size!=='number'||file.size<1||file.size>limit||!TYPES.includes(file.type))
  throw new Error('Berkas harus PDF/JPG/PNG, tidak kosong, dan maksimal '+(limit===512000?'500 KB':'1,5 MB')+' per file.');
}
function validateEntries(entries,maxBytes=MAX_FILE){
 if(!Array.isArray(entries))throw new Error('Daftar berkas tidak tersedia.');
 entries.forEach(x=>{if(!x?.file)throw new Error('Berkas wajib belum dipilih.');assertFile(x.file,maxBytes);});
}
async function checkSession(uid){
 const {data,error}=await sb.auth.getUser();
 if(error||!data?.user?.id||data.user.id!==uid||P().id!==uid)
  throw new Error('Akun/login tidak sesuai pengusul. Masuk kembali menggunakan akun yang membuat pengajuan.');
 const {data:profile,error:profileError}=await sb.from('profiles')
   .select('id,is_active,approval_status,role').eq('id',uid).single();
 if(profileError||!profile||!profile.is_active||profile.approval_status!=='APPROVED')
  throw new Error('Persetujuan akun belum dapat diverifikasi. Hubungi admin SIMANTAB.');
 if(['OPERATOR_KORWIL','OPERATOR_SMP'].includes(profile.role))
  throw new Error('Akun operator institusi tidak diperbolehkan mengajukan langsung sebagai GTK.');
 return uid;
}
function online(){return typeof navigator==='undefined'||navigator.onLine!==false;}
function consent(){
 if(typeof window.confirm!=='function')return false;
 return window.confirm('Kirim berkas SIMANTAB sekarang?\n\nAgar aman jika internet terputus, berkas disimpan sementara di browser perangkat ini maksimal 72 jam, lalu dihapus setelah berhasil atau logout.\n\nGunakan perangkat pribadi. Klik OK untuk mulai mengirim.');
}
function makeJob({kind,serviceType,title,description='',leaveType=null,details=null,entries,revisionId=null,submissionId=null,maxBytes=MAX_FILE}){
 const uid=P().id,id=crypto.randomUUID(),subId=submissionId||id;
 const files=entries.map((item,i)=>{
  assertFile(item.file,maxBytes);
  const code=item.code||null, fid=crypto.randomUUID();
  const prefix=kind==='JABFUNG_REVISION'
   ?uid+'/'+subId+'/jabfung-revisi/'+revisionId+'/'+code+'/'
   :kind==='E_JABFUNG'?uid+'/'+subId+'/jabfung/'
   :kind==='CUTI'?uid+'/'+subId+'/'+String(code||'BERKAS')+'_'
   :uid+'/'+subId+'/';
  return {code,name:item.file.name,mime:item.file.type,size:item.file.size,blob:item.file,
   path:prefix+fid+'_'+sanitizeName(item.file.name),done:false,confirmed:false,index:i};
 });
 return {version:1,id,ownerId:uid,submissionId:subId,revisionId,kind,serviceType,title,description,
  leaveType,details,files,maxBytes,createdAt:Date.now(),expiresAt:Date.now()+TTL_MS,
  updatedAt:Date.now(),stage:'TERSIMPAN_LOKAL',lastError:'',serverSubmissionCreated:false};
}
async function existingJob(uid,kind,serviceType,revisionId=null){
 const jobs=await ownerJobs(uid);
 return jobs.find(j=>j.kind===kind&&j.serviceType===serviceType&&(!revisionId||j.revisionId===revisionId));
}
function safeInputFileList(selector,requiredSelector='data-required',limit=MAX_FILE){
 const all=[...document.querySelectorAll(selector)];
 if(!all.length)throw new Error('Daftar unggah persyaratan tidak ditemukan. Muat ulang formulir.');
 const entries=[];
 for(const input of all){
  const f=input.files?.[0];
  if(input.dataset.required==='1'&&!f)throw new Error('Berkas wajib belum lengkap. Lengkapi item bertanda *.');
  if(f){assertFile(f,limit);entries.push({code:input.dataset.code||null,file:f});}
 }
 return entries;
}
function collectKp(){
 const v=id=>String($(id)?.value||'').trim();
 if(!v('kpProposingUnit'))throw new Error('Unit kerja pengusul KP wajib diisi.');
 for(const id of ['kpEligibility','kpAkSync','kpSkpSync'])if(!$(id)?.checked)
  throw new Error('Selesaikan semua konfirmasi persyaratan KP sebelum mengirim.');
 const proposal=v('kpProposalType'),need=!!$('kpCompetencyRequired')?.checked;
 if(proposal==='BERSAMAAN_KENAIKAN_JENJANG'&&need&&!$('kpCompetencyPassed')?.checked)
  throw new Error('Status kelulusan uji kompetensi KP belum dikonfirmasi.');
 const details={
  proposal_type:proposal,employee_nip:v('kpNip'),proposing_unit:v('kpProposingUnit'),
  last_rank:v('kpLastRank'),last_position:v('kpLastPosition'),
  last_promotion_date:v('kpLastPromotionDate')||null,proposed_rank:v('kpProposedRank'),
  proposed_position:v('kpProposedPosition'),competency_test_required:need,
  competency_test_passed:need?!!$('kpCompetencyPassed')?.checked:null,
  eligibility_declared:true,ak_siasn_declared:true,skp_siasn_declared:true,notes:v('kpNotes')
 };
 return {kind:'KP',serviceType:'KP',title:'Usul Kenaikan Pangkat',description:details.notes,
  entries:safeInputFileList('.kpReqFile'),details};
}
function collectJabfung(){
 return {kind:'E_JABFUNG',serviceType:'E_JABFUNG',
  title:'Usul SK Kenaikan Jenjang Jabatan (Jabfung)',
  description:String($('jabfungNotes')?.value||'').trim(),
  entries:safeInputFileList('.jabfungReqFile')};
}
function collectGeneric(type,title,selected){
 if(!type)throw new Error('Layanan belum dipilih.');
 const files=(selected||[]).map(file=>({code:null,file}));
 validateEntries(files);
 return {kind:'GENERIC',serviceType:type,title:String($('subTitle')?.value||title||type).trim(),
  description:String($('subDesc')?.value||'').trim(),entries:files};
}
function collectCuti(){
 const type=String($('cutiType')?.value||'');
 const inputs=[...document.querySelectorAll('#cutiDocs input[id^="cutiFile_"]')];
 if(!type||!inputs.length)throw new Error('Pilih jenis cuti dan siapkan semua persyaratan.');
 const files=inputs.map(el=>({code:el.id.slice('cutiFile_'.length),file:el.files?.[0]}));
 validateEntries(files,512000);
 return {kind:'CUTI',serviceType:'CUTI',leaveType:type,title:String($('cutiTitle')?.value||'Permohonan Cuti').trim(),
  description:String($('cutiDesc')?.value||'').trim(),entries:files,maxBytes:512000};
}
function collectRevision(form){
 if(!form?.dataset?.revisionId||!form.dataset.submissionId)throw new Error('Permintaan perbaikan berkas tidak valid.');
 const inputs=[...form.querySelectorAll('input[type="file"][data-code]')];
 if(!inputs.length)throw new Error('Jenis dokumen yang perlu diperbaiki belum tersedia.');
 const entries=inputs.map(el=>({code:el.dataset.code,file:el.files?.[0]}));
 validateEntries(entries);
 return {kind:'JABFUNG_REVISION',serviceType:'E_JABFUNG',title:'Perbaikan Berkas Jabfung',
  revisionId:form.dataset.revisionId,submissionId:form.dataset.submissionId,entries};
}
async function start(opts,messageId){
 if(!P()?.id)throw new Error('Silakan login sebagai GTK.');
 if(liveProfileGate())throw new Error('Lengkapi Profil Kepegawaian wajib sebelum mengirim berkas.');
 if(!JOB_TYPES.has(opts.kind))throw new Error('Layanan pemulihan tidak dikenali.');
 const uid=P().id,lock=uid+':'+opts.kind+':'+opts.serviceType+':'+(opts.revisionId||'');
 if(startingJobs.has(lock)||busy){
  message('Pengiriman sedang berjalan. Mohon tunggu; jangan tekan tombol Kirim lagi.',false,messageId);
  return {busy:true};
 }
 startingJobs.add(lock);
 try{
  const prior=await existingJob(uid,opts.kind,opts.serviceType,opts.revisionId);
  if(prior){
   message('Antrean lama ditemukan. Melanjutkan unggahan yang sama, tanpa membuat pengajuan baru…',false,messageId);
   await showPanel();
   if(online()){
    const result=await resume(prior.id,messageId);
    return {...result,queued:!result?.success,id:prior.id,duplicatePrevented:true};
   }
   return {queued:true,id:prior.id,duplicatePrevented:true};
  }
  if(!consent()){
   message('Pengiriman dibatalkan. Berkas belum tersimpan lokal maupun server.',false,messageId);
   return {cancelled:true};
  }
  const job=makeJob(opts);
  try{await put(job)}catch(e){
   throw new Error('Browser tidak berhasil menyimpan antrean. Gunakan Chrome/Edge biasa (bukan mode samaran), pastikan ruang penyimpanan tersedia. '+String(e?.message||e));
  }
  notifyJob(job,'✅ Antrean '+job.files.length+' berkas tersimpan lokal. '+(online()?'Mengirim ke server…':'Menunggu internet tersambung.'),true,messageId);
  await showPanel();
  if(online()){
   const result=await resume(job.id,messageId);
   return {...result,queued:!result?.success,id:job.id};
  }
  return {queued:true,id:job.id,offline:true};
 }finally{startingJobs.delete(lock);}
}
async function preflightJabfung(job){
 if(job.kind!=='E_JABFUNG')return;
 const {data,error}=await sb.rpc('simantab_submission_preflight',{p_client_profile_id:job.ownerId});
 if(error)throw new Error('Pemeriksaan izin unggah belum berhasil: '+(error.message||String(error)));
 const code=String(data||'UNKNOWN');
 if(code!=='OK')throw new Error('Akun belum dapat mengirim Jabfung (kode '+code+'). Silakan login ulang atau hubungi Super Admin.');
}
async function ensureSubmission(job){
 const {data:known,error:readError}=await sb.from('submissions')
  .select('id,user_id,service_type').eq('id',job.submissionId).maybeSingle();
 if(readError)throw readError;
 if(known){
  if(known.user_id!==job.ownerId||known.service_type!==job.serviceType)
   throw new Error('Nomor pengajuan ditemukan tetapi tidak sesuai akun/jenis layanan.');
  job.serverSubmissionCreated=true;await put(job);
  return;
 }
 const values={id:job.submissionId,user_id:job.ownerId,service_type:job.serviceType,
  title:job.title,description:job.description};
 if(job.kind==='CUTI')values.leave_type=job.leaveType;
 const {data:inserted,error}=await sb.from('submissions').insert(values)
  .select('id,user_id,service_type').single();
 if(error){
  if(error.code!=='23505'&&!/duplicate key|unique constraint/i.test(error.message||''))throw error;
  const {data:race,error:rerr}=await sb.from('submissions')
   .select('id,user_id,service_type').eq('id',job.submissionId).single();
  if(rerr||!race||race.user_id!==job.ownerId||race.service_type!==job.serviceType)
   throw new Error('Pengajuan sudah ada tetapi tidak dapat diverifikasi. Hubungi admin.');
 }else if(!inserted||inserted.id!==job.submissionId||inserted.user_id!==job.ownerId)
   throw new Error('Server mengembalikan nomor pengajuan yang tidak sesuai.');
 job.serverSubmissionCreated=true;job.stage='USULAN_TERCATAT';
 await put(job);
}
async function saveKpDetail(job){
 if(job.kind!=='KP')return;
 const detail={...job.details,updated_by:job.ownerId,updated_at:new Date().toISOString()};
 const {error}=await sb.from('kp_submission_details').update(detail).eq('submission_id',job.submissionId);
 if(error)throw error;
}
function confirmStoredFile(row,job,file){
 if(row.user_id!==job.ownerId||row.submission_id!==job.submissionId||
    Number(row.file_size)!==Number(file.size)||row.mime_type!==file.mime||
    (row.requirement_code||null)!==(file.code||null))
  throw new Error('Metadata server berbeda dari file antrean. Hubungi admin; jangan membuat usulan baru.');
}
async function existingFileMetadata(job,file){
 const {data,error}=await sb.from('submission_files').select('id,user_id,submission_id,storage_path,file_size,mime_type,requirement_code')
  .eq('storage_path',file.path).maybeSingle();
 if(error)throw error;
 if(data)confirmStoredFile(data,job,file);
 return !!data;
}
async function storageAlreadyMatches(file){
 const cut=file.path.lastIndexOf('/'),folder=file.path.slice(0,cut),name=file.path.slice(cut+1);
 const {data,error}=await sb.storage.from('simantab-documents').list(folder,{limit:100,search:name});
 if(error)throw error;
 const item=(data||[]).find(x=>x.name===name);
 if(!item)return false;
 const bytes=Number(item.metadata?.size??item.size),type=item.metadata?.mimetype||item.metadata?.contentType;
 if(bytes!==file.size||type!==file.mime)
  throw new Error('Berkas tersimpan di Storage memiliki ukuran/tipe berbeda. Jangan menimpa; hubungi admin.');
 return true;
}
async function uploadBlob(job,file){
 const {error}=await sb.storage.from('simantab-documents')
  .upload(file.path,file.blob,{contentType:file.mime,upsert:false});
 if(!error)return;
 if(error.status===409||/already exists|duplicate|resource.*exist/i.test(error.message||'')){
  if(await storageAlreadyMatches(file))return;
 }
 throw error;
}
async function submitMetadata(job,file){
 if(await existingFileMetadata(job,file))return;
 const {error}=await sb.from('submission_files').insert({
  submission_id:job.submissionId,user_id:job.ownerId,storage_path:file.path,
  file_name:file.name,file_size:file.size,mime_type:file.mime,requirement_code:file.code
 });
 if(error){
  if(error.code!=='23505'&&!/duplicate key|unique constraint/i.test(error.message||''))throw error;
  if(!await existingFileMetadata(job,file))throw error;
 }
}
async function processRevision(job){
 const {data:request,error}=await sb.from('jabfung_revision_requests')
  .select('id,owner_id,submission_id,state,requested_codes').eq('id',job.revisionId).single();
 if(error||!request||request.owner_id!==job.ownerId||request.submission_id!==job.submissionId)
  throw new Error('Permintaan perbaikan tidak cocok dengan pengusul.');
 if(request.state==='SUBMITTED'||request.state==='CLOSED')return;
 if(request.state!=='OPEN'||request.requested_codes?.length!==job.files.length||
   job.files.some(x=>!request.requested_codes.includes(x.code)))
  throw new Error('Permintaan perbaikan sudah berubah. Periksa Status Usulan.');
 for(let i=0;i<job.files.length;i++){
  const file=job.files[i];
  notifyJob(job,'📤 Memperbaiki berkas '+(i+1)+' dari '+job.files.length+': '+file.code,false);
  // A resumed revision uses the same object path and verifies any existing object.
  await uploadBlob(job,file);
  file.done=true;job.updatedAt=Date.now();await put(job);
  await showPanel();
 }
 const data=job.files.map(f=>({code:f.code,file_name:f.name,storage_path:f.path,file_size:f.size,mime_type:f.mime}));
 const {data:count,error:err}=await sb.rpc('jabfung_revision_submit',{p_revision_id:job.revisionId,p_files:data});
 if(err)throw err;
 if(Number(count)!==job.files.length)throw new Error('Jumlah berkas yang diterima tidak sesuai.');
 job.files.forEach(file=>{file.confirmed=true;});await put(job);
}
async function processNormal(job){
 await ensureSubmission(job);
 await saveKpDetail(job);
 for(let i=0;i<job.files.length;i++){
  const file=job.files[i];
  notifyJob(job,'📤 Mengunggah berkas '+(i+1)+' dari '+job.files.length+': '+file.name,false);
  if(await existingFileMetadata(job,file)){
   file.done=true;file.confirmed=true;job.updatedAt=Date.now();await put(job);
   await showPanel();
   continue;
  }
  // Retry the same Storage path. An already-existing object is accepted only
  // after comparing exact name, size and MIME; no duplicate submission created.
  await uploadBlob(job,file);
  file.done=true;job.updatedAt=Date.now();await put(job);
  await submitMetadata(job,file);
  file.confirmed=true;job.updatedAt=Date.now();await put(job);
  await showPanel();
 }
 notifyJob(job,'⏳ Seluruh berkas terunggah. Memastikan catatan server sudah lengkap…',false);
 const {data:verified,error}=await sb.from('submission_files')
  .select('storage_path,user_id,submission_id,file_size,mime_type,requirement_code')
  .eq('submission_id',job.submissionId);
 if(error)throw error;
 const byPath=new Map((verified||[]).map(x=>[x.storage_path,x]));
 for(const file of job.files){
  const row=byPath.get(file.path);
  if(!row)throw new Error('Berkas '+file.name+' belum terkonfirmasi di server.');
  confirmStoredFile(row,job,file);
 }
}
async function resume(id,messageId=null){
 if(busy)return {busy:true};
 busy=true;
 let job;
 try{
  job=await readOne(id);
  if(!job)return {missing:true};
  if(job.ownerId!==P()?.id)throw new Error('Antrean ini milik akun GTK lain.');
  if(!online()){message('Jaringan terputus. Antrean tetap disimpan di perangkat ini.',false,messageId);return {offline:true};}
  if(liveProfileGate())throw new Error('Lengkapi profil wajib sebelum melanjutkan antrean.');
  await checkSession(job.ownerId);
  job.stage='MENGUNGGAH';job.updatedAt=Date.now();job.lastError='';
  await put(job);await showPanel();
  if(job.kind==='JABFUNG_REVISION')await processRevision(job);
  else await processNormal(job);
  await remove(job.id);
  message('✅ '+job.files.length+' berkas telah terverifikasi di server, pada pengajuan yang sama. Antrean lokal dibersihkan.',true,messageId);
  if(typeof window.loadStatus==='function'){
   try{await window.loadStatus();}catch(_){}
  }
  await showPanel();
  return {success:true,submissionId:job.submissionId};
 }catch(e){
  if(job){
   job.stage=online()?'PERLU_DICOBA_LAGI':'MENUNGGU_JARINGAN';
   job.lastError=String(e?.message||e).slice(0,600);
   job.updatedAt=Date.now();try{await put(job)}catch(_){}
  }
  message('⏳ Unggahan belum tuntas. Data antrean aman di perangkat ini. '+String(e?.message||e)+'. Buka Status Usulan → Lanjutkan Unggahan.',false,messageId);
  await showPanel();
  return {error:String(e?.message||e),submissionId:job?.submissionId||null};
 }finally{busy=false;}
}
async function showPanel(){
 if(rendering||!P()?.id)return;
 const body=$('statusBody');if(!body)return;
 rendering=true;
 try{
  const jobs=await ownerJobs(P().id);
  body.querySelector('#simSmartUploadPanel')?.remove();
  if(!jobs.length)return;
  const box=document.createElement('div');box.id='simSmartUploadPanel';box.className='card';
  box.style.cssText='margin-bottom:14px;border:1px solid #d3b06f';
  box.innerHTML='<div class="label">PEMULIHAN UNGGAH • GRATIS</div>'+
    '<h3 style="margin:5px 0">📶 Antrean Berkas di Perangkat Ini</h3>'+
    '<p class="small">Berkas ini belum seluruhnya terkonfirmasi di server. Jangan mengirim usulan baru. Gunakan tombol Lanjutkan; satu nomor usulan dipertahankan. Penyimpanan lokal berlangsung maksimal 72 jam atau hingga logout.</p>'+
    jobs.map(j=>'<div style="border-top:1px solid var(--line);padding:12px 0">'+
      '<b>'+esc(j.title)+'</b><div class="small">'+j.files.length+' berkas • '+esc(j.stage)+
      ' • '+new Date(j.createdAt).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})+'</div>'+
      (j.lastError?'<div class="err" style="margin-top:5px">'+esc(j.lastError)+'</div>':'')+
      '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="btn primary simResumeUpload" data-id="'+esc(j.id)+'" type="button">▶ Lanjutkan Unggahan</button>'+
      '<button class="btn soft simDropUpload" data-id="'+esc(j.id)+'" type="button">Hapus Antrean Lokal</button></div></div>').join('');
  body.prepend(box);
  box.querySelectorAll('.simResumeUpload').forEach(btn=>btn.addEventListener('click',()=>resume(btn.dataset.id)));
  box.querySelectorAll('.simDropUpload').forEach(btn=>btn.addEventListener('click',async()=>{
   const job=await readOne(btn.dataset.id);
   if(job?.serverSubmissionCreated){
    if(!window.confirm('Pengajuan mungkin sudah tercatat di server. Menghapus antrean lokal akan menghilangkan kemampuan melanjutkan unggahan. Hubungi admin jika belum lengkap. Tetap hapus?'))return;
   }else if(!window.confirm('Hapus berkas dan draft lokal dari perangkat ini?'))return;
   await remove(btn.dataset.id);await showPanel();
  }));
 }catch(e){console.error('SIMANTAB_SMART_UPLOAD_PANEL',e);}
 finally{rendering=false;}
}
async function autoResume(){
 if(busy||!online()||liveProfileGate()||!P()?.id)return;
 const jobs=await ownerJobs(P().id);
 for(const job of jobs){
  if(!online()||liveProfileGate())break;
  const outcome=await resume(job.id);
  if(!outcome?.success)break;
 }
}
function feedback(id,text,isOk=false){
 const el=getMsg(id);
 if(el){el.className=isOk?'okmsg':'small';el.textContent=text;}
}
async function invokeStart(opts,uiId){
 try{return await start(typeof opts==='function'?opts():opts,uiId)}
 catch(e){feedback(uiId,'Smart Upload: '+(e.message||String(e)));return {error:String(e?.message||e)}}
}
const api={
 version:1,
 startJabfung:()=>invokeStart(collectJabfung,'jabfungMsg'),
 startKp:()=>invokeStart(collectKp,'kpMsg'),
 startGeneric:(type,title,selected)=>invokeStart(()=>collectGeneric(type,title,selected),'subMsg'),
 startCuti:()=>invokeStart(collectCuti,'subMsg'),
 startRevision:async form=>{
  const result=await invokeStart(()=>collectRevision(form),null);
  const box=form?.querySelector?.('.jfRevisionFeedback');
  if(box)box.textContent=result?.success?'✅ Berkas perbaikan terkirim ke server.':
    result?.error?'Gagal memproses: '+result.error:
    result?.queued?'Antrean tersimpan. Buka Status Usulan untuk melihat atau melanjutkan berkas.':
    'Pengiriman belum dilanjutkan.';
  return result;
 },
 resume,showPanel,clearOwner,
 // The safe functions below are public only for internal integration tests.
 __test:{sanitizeName,assertFile,makeJob,existingJob,readOne,put,remove,listAll,ownerJobs}
};
window.simantabSmartUpload=api;
window.addEventListener('online',()=>{autoResume().catch(e=>console.error('Smart Upload reconnected',e));});
window.addEventListener('simantab:profile-ready',()=>{
 const next=P().id;
 if(loginOwner&&loginOwner!==next)clearOwner(loginOwner).catch(()=>{});
 loginOwner=next;
 showPanel().catch(()=>{});
 if(online())autoResume().catch(()=>{});
});
const previousShow=window.showTab;
window.showTab=async function(tab,...args){
 const res=await previousShow.call(this,tab,...args);
 if(tab==='status')await showPanel();
 return res;
};
if(typeof window.logout==='function'){
 const logout=window.logout;
 window.logout=async function(...args){
  const uid=P()?.id;
  if(uid)await clearOwner(uid);
  return logout.apply(this,args);
 };
}
if(P().id){loginOwner=P().id;showPanel().catch(()=>{});}
})();
