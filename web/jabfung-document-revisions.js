/* SIMANTAB_JABFUNG_DOCUMENT_REVISIONS_V1_CLOUDFLARE */
(async()=>{
'use strict';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb, profile=()=>window.__simantabProfile||{}, $=id=>document.getElementById(id);
if(!sb||!window.showTab||!profile().id)return;
const GTK_ROLES=new Set(['GTK','KEPALA_SEKOLAH','PENGAWAS','KORWIL']);
const STAFF_ROLES=new Set(['SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_KP_EKIN','STAFF_USUL_SK']);
const isGtk=()=>GTK_ROLES.has(String(profile().role||'').toUpperCase());
const isStaff=()=>STAFF_ROLES.has(String(profile().role||'').toUpperCase());
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=date=>date?new Date(date).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
let requirements=null,renderingOwner=false,renderingStaff=false,busy=false;
async function labels(){
 if(requirements)return requirements;
 const {data,error}=await sb.from('service_requirements').select('code,label,sort_order')
  .eq('service_type','E_JABFUNG').eq('is_active',true).eq('requirement_type','DOCUMENT')
  .order('sort_order',{ascending:true});
 if(error)throw error;
 requirements=data||[];
 return requirements;
}
function message(parent,text,failed=false){
 const el=parent?.querySelector('.jfRevisionFeedback');
 if(el){el.className=failed?'jfRevisionFeedback err':'jfRevisionFeedback okmsg';el.textContent=text;}
}
async function errorText(error){
 let result=error?.message||'Gagal memproses permintaan.';
 try{const body=await error?.context?.clone?.().json?.();if(body?.message||body?.error)result=body.message||body.error;}catch(_){}
 return String(result);
}
function statusLabel(status){return({OPEN:'Menunggu Perbaikan GTK',SUBMITTED:'Perbaikan Terkirim',CLOSED:'Diteruskan ke Pemeriksaan Staf'})[status]||status;}
function safeFileName(name){
 return String(name||'berkas.pdf').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-110);
}
async function renderOwner(){
 if(!isGtk()||renderingOwner||!$('status')?.classList.contains('active'))return;
 const body=$('statusBody');if(!body)return;
 renderingOwner=true;
 try{
  const {data,error}=await sb.from('jabfung_revision_requests').select('*')
   .eq('owner_id',profile().id).order('created_at',{ascending:false});
  if(error)throw error;
  body.querySelector('#jfRevisionOwnerPanel')?.remove();
  const requests=data||[];
  if(!requests.length)return;
  const codes=await labels(),byCode=new Map(codes.map(x=>[x.code,x.label]));
  const card=document.createElement('section');card.id='jfRevisionOwnerPanel';card.className='card';
  card.style.cssText='margin-bottom:14px;border:1px solid #b8d7ed';
  card.innerHTML='<div class="label">PERBAIKAN DOKUMEN JABFUNG</div>'+
   '<h3 style="margin:6px 0">Lengkapi / Perbaiki Berkas</h3>'+
   '<p class="small">Gunakan pengajuan yang sama. Berkas lama tetap tersimpan; unggah hanya item yang diminta petugas. Maksimal 1,5 MB setiap berkas.</p>'+
   requests.map(r=>{
    const open=r.state==='OPEN';
    return '<div style="padding:14px 0;border-top:1px solid var(--line)">'+
    '<b>Usulan Jabfung • '+esc(fmt(r.created_at))+'</b>'+
    '<div class="small">Status berkas: <b>'+esc(statusLabel(r.state))+'</b></div>'+
    '<div class="info" style="margin-top:8px;white-space:pre-wrap"><b>Catatan petugas:</b> '+esc(r.staff_note)+'</div>'+
    '<div style="margin:9px 0 11px"><b>Berkas yang diminta:</b> '+r.requested_codes.map(c=>'<div class="small">• '+esc(byCode.get(c)||c)+'</div>').join('')+'</div>'+
    (open?
    '<form class="jfRevisionUploadForm" data-revision-id="'+esc(r.id)+'" data-submission-id="'+esc(r.submission_id)+'">'+
    r.requested_codes.map((code,i)=>'<div class="field" style="margin:8px 0"><label for="jfFile-'+esc(r.id)+'-'+i+'">'+esc(byCode.get(code)||code)+' *</label>'+
      '<input type="file" required accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" id="jfFile-'+esc(r.id)+'-'+i+'" data-code="'+esc(code)+'"></div>').join('')+
    '<button type="submit" class="btn primary">📤 Simpan dan Kirim Perbaikan</button>'+
    '<div class="jfRevisionFeedback small" role="status" aria-live="polite" style="margin-top:8px"></div></form>':
    '<div class="small">Dikirim: '+esc(fmt(r.submitted_at))+
    (r.closed_at?' • Diteruskan ke pemeriksaan: '+esc(fmt(r.closed_at)):' • Menunggu pengecekan staf dinas')+'</div>')+
    '</div>';
   }).join('');
  body.prepend(card);
  for(const form of card.querySelectorAll('.jfRevisionUploadForm')){
   form.addEventListener('submit',async e=>{e.preventDefault();await uploadCorrection(form);});
  }
 }catch(e){console.error('Gagal memuat perbaikan Jabfung',e);}
 finally{renderingOwner=false;}
}
async function uploadCorrection(form){
 if(window.simantabSmartUpload?.startRevision) return window.simantabSmartUpload.startRevision(form);
 if(busy)return;
 const inputs=[...form.querySelectorAll('input[type="file"][data-code]')];
 const files=[];
 for(const input of inputs){
  const f=input.files?.[0];
  if(!f){message(form,'Semua berkas yang diminta harus dipilih.',true);return;}
  if(!['application/pdf','image/jpeg','image/png'].includes(f.type)||f.size<1||f.size>1572864){
   message(form,'Berkas '+f.name+' harus PDF/JPG/PNG, maksimal 1,5 MB.',true);return;
  }
  files.push({code:input.dataset.code,file:f});
 }
 const uid=profile().id,revisionId=form.dataset.revisionId,submissionId=form.dataset.submissionId;
 busy=true;const button=form.querySelector('button[type="submit"]');
 if(button)button.disabled=true;
 try{
  const {data:auth,error:authError}=await sb.auth.getUser();
  if(authError||!auth?.user?.id||auth.user.id!==uid)throw new Error('Sesi login tidak sesuai pemilik pengajuan. Silakan login kembali.');
  const uploaded=[];
  for(let i=0;i<files.length;i++){
   const x=files[i],path=uid+'/'+submissionId+'/jabfung-revisi/'+revisionId+'/'+x.code+'/'+crypto.randomUUID()+'_'+safeFileName(x.file.name);
   message(form,'Mengunggah '+(i+1)+' dari '+files.length+': '+x.code+'...');
   const {error}=await sb.storage.from('simantab-documents').upload(path,x.file,{contentType:x.file.type,upsert:false});
   if(error)throw error;
   uploaded.push({code:x.code,file_name:x.file.name,storage_path:path,file_size:x.file.size,mime_type:x.file.type});
  }
  message(form,'Seluruh berkas terunggah. Mencatat perbaikan pada nomor pengajuan yang sama...');
  const {data,error}=await sb.rpc('jabfung_revision_submit',{p_revision_id:revisionId,p_files:uploaded});
  if(error)throw error;
  if(Number(data)!==files.length)throw new Error('Jumlah perbaikan tercatat berbeda. Mohon hubungi Admin.');
  message(form,'✅ '+files.length+' berkas perbaikan tercatat. Tidak ada pengajuan baru.');
  if(typeof window.loadStatus==='function')await window.loadStatus();
  await renderOwner();
 }catch(e){
  message(form,'Belum berhasil mencatat perbaikan: '+await errorText(e)+'. Pengajuan lama tetap tersimpan. Jika gagal berulang, hubungi Admin dengan tangkapan layar.',true);
 }finally{busy=false;if(button)button.disabled=false;}
}
async function staffData(){
 const role=String(profile().role||'');
 const {data:submissions,error}=await sb.from('submissions')
   .select('id,user_id,service_type,title,submitted_at,workflow_state,status,scope_level,coordinator_role,assigned_user_id')
   .eq('service_type','E_JABFUNG').not('submitted_at','is',null)
   .in('workflow_state',['VERIFIKASI_STAF','MENUNGGU_DISPOSISI_KOORDINATOR','PERBAIKAN'])
   .order('submitted_at',{ascending:false}).limit(500);
 if(error)throw error;
 let rows=submissions||[];
 if(role==='STAFF_KP_EKIN'||role==='STAFF_USUL_SK'){
  const {data:assignments,error:e}=await sb.from('submission_assignees')
   .select('submission_id').eq('user_id',profile().id);
  if(e)throw e;
  const assigned=new Set((assignments||[]).map(x=>x.submission_id));
  rows=rows.filter(s=>s.assigned_user_id===profile().id||assigned.has(s.id));
 }else if(['KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(role)){
  rows=rows.filter(s=>s.coordinator_role===role);
 }
 const ids=[...new Set(rows.map(s=>s.user_id))],submissionIds=rows.map(s=>s.id);
 const profiles=ids.length?await sb.from('profiles').select('id,full_name,unit,unit_gtk').in('id',ids):{data:[],error:null};
 if(profiles.error)throw profiles.error;
 const revisions=submissionIds.length?await sb.from('jabfung_revision_requests')
  .select('*').in('submission_id',submissionIds).order('created_at',{ascending:false}):{data:[],error:null};
 if(revisions.error)throw revisions.error;
 const names=new Map((profiles.data||[]).map(p=>[p.id,p]));
 const active=new Map;
 for(const r of revisions.data||[])if(!active.has(r.submission_id)&&r.state!=='CLOSED')active.set(r.submission_id,r);
 rows=rows.map(s=>{
  const p=names.get(s.user_id)||{};
  return {...s,requester_name:p.full_name||'GTK (nama belum tersedia)',requester_unit:p.unit_gtk||p.unit||'Unit belum dilengkapi'};
 }).sort((a,b)=>a.requester_name.localeCompare(b.requester_name,'id',{sensitivity:'base'}));
 return {rows,active,revisions:revisions.data||[]};
}
async function renderStaff(){
 if(!isStaff()||renderingStaff||!$('services')?.classList.contains('active'))return;
 const body=$('servicesBody');if(!body)return;
 renderingStaff=true;
 try{
  const [{rows,active,revisions},requirements]=await Promise.all([staffData(),labels()]);
  body.querySelector('#jfRevisionStaffPanel')?.remove();
  const card=document.createElement('section');card.id='jfRevisionStaffPanel';card.className='card';
  card.style.cssText='margin-bottom:15px;border:1px solid #b8d7ed';
  const available=rows.filter(s=>!active.has(s.id));
  const current=revisions.filter(r=>r.state!=='CLOSED');
  card.innerHTML='<div class="label">LAYANAN JABFUNG — STAF DINAS</div>'+
   '<h3 style="margin:6px 0">Permintaan Lengkapi / Perbaiki Berkas</h3>'+
   '<p class="small">Tandai dokumen yang perlu dilengkapi, beri alasan, lalu kirim. Pemohon memperbaiki melalui Status Usulan pada pengajuan lama, tanpa membuat usulan baru.</p>'+
   (available.length?'<form id="jfStaffRequestForm">'+
    '<div class="field"><label>Pengajuan Jabfung</label><select id="jfStaffSubmission" required>'+
     '<option value="">Pilih pengusul...</option>'+available.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.requester_name)+' — '+esc(s.requester_unit)+' ('+esc(s.workflow_state)+')</option>').join('')+'</select></div>'+
    '<div class="label" style="margin:10px 0">Dokumen yang perlu diperbaiki</div>'+
    '<div class="formrow">'+requirements.map((r,i)=>'<label class="field" style="display:flex;gap:8px;align-items:center">'+
       '<input type="checkbox" name="jfCode" value="'+esc(r.code)+'" style="width:auto" /> '+esc(r.label)+'</label>').join('')+'</div>'+
    '<div class="field"><label>Catatan kekurangan/perbaikan *</label><textarea id="jfStaffRevisionNote" rows="3" minlength="8" maxlength="1500" required placeholder="Contoh: SK KP terakhir tidak terbaca, mohon unggah ulang hasil pindai yang jelas."></textarea></div>'+
    '<button class="btn primary" type="submit">📨 Kirim Permintaan Perbaikan</button>'+
    '<div class="jfRevisionFeedback small" role="status" aria-live="polite" style="margin-top:8px"></div></form>':
    '<p class="small">Semua pengajuan yang terlihat sudah memiliki permintaan perbaikan aktif, atau tidak ada pengajuan pada kewenangan akun ini.</p>')+
   (current.length?'<h4 style="margin:16px 0 8px">Permintaan yang sedang berjalan</h4>'+
    current.map(r=>{
     const sub=rows.find(s=>s.id===r.submission_id);
     return '<div style="padding:12px;border-top:1px solid var(--line)"><b>'+esc(sub?.requester_name||'Pengusul')+'</b>'+
      '<div class="small">Status: '+esc(statusLabel(r.state))+' • '+esc(fmt(r.created_at))+'</div>'+
      '<div class="small">Berkas: '+esc(r.requested_codes.join(', '))+'</div>'+
      '<div class="small" style="white-space:pre-wrap">'+esc(r.staff_note)+'</div>'+
      (r.state==='SUBMITTED'?'<button type="button" class="btn soft jfCloseRevision" data-id="'+esc(r.id)+'" style="margin-top:8px">✓ Terima berkas untuk pemeriksaan ulang</button>':'')+
      '<div class="jfRevisionFeedback small" role="status" aria-live="polite"></div></div>';
    }).join(''):'');
  body.prepend(card);
  const form=card.querySelector('#jfStaffRequestForm');
  if(form)form.addEventListener('submit',async e=>{e.preventDefault();await openCorrection(form);});
  for(const button of card.querySelectorAll('.jfCloseRevision'))button.addEventListener('click',async()=>closeCorrection(button));
 }catch(e){
  console.error('Panel perbaikan Jabfung petugas',e);
 }finally{renderingStaff=false;}
}
async function openCorrection(form){
 if(busy)return;
 const id=$('jfStaffSubmission')?.value,codes=[...form.querySelectorAll('input[name="jfCode"]:checked')].map(x=>x.value);
 const note=String($('jfStaffRevisionNote')?.value||'').trim();
 if(!id||!codes.length||note.length<8){message(form,'Pilih pengusul, minimal satu dokumen, dan tulis alasan sedikitnya 8 karakter.',true);return;}
 busy=true;const btn=form.querySelector('button[type="submit"]');if(btn)btn.disabled=true;
 try{
  message(form,'Mengirim permintaan perbaikan...');
  const {error}=await sb.rpc('jabfung_revision_open',{p_submission_id:id,p_requested_codes:codes,p_note:note});
  if(error)throw error;
  message(form,'✅ Permintaan terkirim pada pengajuan Jabfung yang sama.');
  await renderStaffAfter();
 }catch(e){message(form,await errorText(e),true);}
 finally{busy=false;if(btn)btn.disabled=false;}
}
async function closeCorrection(button){
 if(busy)return;
 busy=true;button.disabled=true;
 try{
  const {error}=await sb.rpc('jabfung_revision_close',{p_revision_id:button.dataset.id});
  if(error)throw error;
  await renderStaffAfter();
 }catch(e){message(button.parentElement,await errorText(e),true);}
 finally{busy=false;button.disabled=false;}
}
async function renderStaffAfter(){
 // Re-read live database records so the UI never assumes a successful action.
 await renderStaff();
}
const previousShowTab=window.showTab;
window.showTab=async function(id,...args){
 const out=await previousShowTab.call(this,id,...args);
 if(id==='status'&&$('status')?.classList.contains('active'))await renderOwner();
 if(id==='services'&&$('services')?.classList.contains('active'))await renderStaff();
 return out;
};
window.addEventListener('simantab:profile-ready',()=>{
 if($('status')?.classList.contains('active'))renderOwner();
 if($('services')?.classList.contains('active'))renderStaff();
});
if($('status')?.classList.contains('active'))renderOwner();
if($('services')?.classList.contains('active'))renderStaff();
window.__simantabJabfungDocumentRevisions={version:1,isGtk,isStaff,safeFileName};
})();
