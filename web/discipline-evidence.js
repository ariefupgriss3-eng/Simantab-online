/* SIMANTAB_DISCIPLINE_EVIDENCE_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};if(!sb)return;
const MAX=512000, MIME=['application/pdf','image/jpeg','image/png'];
const SCOPE_LABEL={ALL:'Semua Jenjang',TK_PAUD_PNF:'TK/PAUD/PNF',SD:'SD',SMP:'SMP'};
const COORD={TK_PAUD_PNF:'SUBKOOR_TK',SD:'KASI_SD',SMP:'KASI_SMP',ALL:null};
const REQ={
 BAP:'BAP',
 UNDANGAN:'Undangan',
 DAFTAR_HADIR:'Daftar Hadir',
 REKOMENDASI_KORWIL:'Rekomendasi diketahui Pengawas/Korwil'
};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const role=()=>p().role||'';
const isAdmin=()=>!!p().is_admin;
const requiredCodes=lvl=>lvl==='KEPALA_SEKOLAH'?['BAP','UNDANGAN','DAFTAR_HADIR','REKOMENDASI_KORWIL']:lvl==='PENGAWAS_KORWIL'?['BAP','UNDANGAN','DAFTAR_HADIR']:[];
const safeName=n=>String(n||'file').normalize('NFKD').replace(/[^\w.\-]+/g,'_').slice(-90);
function canCreate(){return isAdmin()||['KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','PENGAWAS'].includes(role())}
function fixedScope(){return role()==='KASI_SD'?'SD':role()==='KASI_SMP'?'SMP':role()==='SUBKOOR_TK'?'TK_PAUD_PNF':null}
function canManage(row){return isAdmin()||role()==='KABID'||(['KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(role())&&row.coordinator_role===role())||(role()==='PENGAWAS'&&row.created_by===p().id)}
function statusLabel(s){return ({OPEN:'Open',PROCESS:'Proses',CLOSED:'Selesai'})[s]||s}
function typeLabel(s){return s==='PERCERAIAN'?'Usul Perceraian GTK':'Pembinaan Disiplin'}
function levelLabel(s){return s==='KEPALA_SEKOLAH'?'Kepala Sekolah':s==='PENGAWAS_KORWIL'?'Pengawas/Korwil':'Belum ditentukan'}
function validateFile(f){if(!f)return 'Berkas belum dipilih.';if(f.size>MAX)return 'Ukuran berkas maksimal 500 KB.';if(!MIME.includes(f.type))return 'Format harus PDF/JPG/PNG.';return ''}
function createEvidenceInputs(){
 const box=$('disciplineCreateEvidence');if(!box)return;const lvl=$('disciplineCaseLevel')?.value||'KEPALA_SEKOLAH',codes=requiredCodes(lvl);
 if(role()!=='PENGAWAS'){
  box.innerHTML='<div class="notice"><b>Bukti pembinaan wajib diunggah oleh akun Pengawas/Korwil.</b> Kasus dapat dicatat lebih dahulu, tetapi tidak dapat ditutup sebelum bukti lengkap.</div>';return;
 }
 box.innerHTML=`<div class="info" style="margin-bottom:8px"><b>Bukti wajib Korwil — ${esc(levelLabel(lvl))}</b><br>Unggah masing-masing dokumen secara terpisah. PDF/JPG/PNG, maksimal 500 KB per berkas.</div><div class="grid">${codes.map(c=>`<div class="field s6"><label>${esc(REQ[c])}</label><input id="disciplineCreateFile_${c}" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"></div>`).join('')}</div>`;
}
window.disciplineRenderCreateEvidenceInputs=createEvidenceInputs;
async function uploadEvidence(caseId,code,file){
 const bad=validateFile(file);if(bad)throw new Error(`${REQ[code]}: ${bad}`);
 const {data:existing,error:readErr}=await sb.from('supervision_case_files').select('*').eq('case_id',caseId).eq('requirement_code',code).maybeSingle();if(readErr)throw readErr;
 if(existing&&existing.uploaded_by!==p().id)throw new Error(`${REQ[code]} sudah diunggah Pengawas/Korwil lain dan tidak dapat ditimpa oleh akun ini.`);
 const path=`${p().id}/supervision/${caseId}/${code}_${crypto.randomUUID()}_${safeName(file.name)}`;
 const {error:upErr}=await sb.storage.from('simantab-documents').upload(path,file,{contentType:file.type,upsert:false});if(upErr)throw upErr;
 const meta={case_id:caseId,uploaded_by:p().id,requirement_code:code,file_name:file.name,storage_path:path,file_size:file.size,mime_type:file.type,updated_at:new Date().toISOString()};
 let error;if(existing)({error}=await sb.from('supervision_case_files').update(meta).eq('id',existing.id));else({error}=await sb.from('supervision_case_files').insert(meta));
 if(error){await sb.storage.from('simantab-documents').remove([path]);throw error}
 if(existing?.storage_path)await sb.storage.from('simantab-documents').remove([existing.storage_path]);
}
window.disciplineUploadEvidence=async(caseId,code)=>{
 if(role()!=='PENGAWAS'){alert('Bukti pembinaan hanya diunggah melalui akun Pengawas/Korwil.');return}
 const input=$(`disciplineFile_${caseId}_${code}`),file=input?.files?.[0];const bad=validateFile(file);if(bad){alert(bad);return}
 try{await uploadEvidence(caseId,code,file);await renderDisciplineEvidence()}catch(e){alert(e?.message||String(e))}
};
window.disciplineOpenEvidence=async path=>{const {data,error}=await sb.storage.from('simantab-documents').createSignedUrl(path,120);if(error)alert(error.message);else window.open(data.signedUrl,'_blank','noopener')};
window.disciplineUpdateStatus=async(id,status)=>{if(!status)return;const {error}=await sb.from('supervision_cases').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)alert(error.message);else await renderDisciplineEvidence()};
window.disciplineSaveCase=async()=>{
 const msg=$('disciplineCaseMsg'),type=$('disciplineCaseType')?.value||'PEMBINAAN_DISIPLIN',lvl=$('disciplineCaseLevel')?.value||'',scope=fixedScope()||$('disciplineCaseScope')?.value||'ALL',subject=$('disciplineSubject')?.value.trim()||'',school=$('disciplineSchool')?.value.trim()||'',summary=$('disciplineSummary')?.value.trim()||'';
 if(!subject||!lvl){msg.className='err';msg.textContent='Nama GTK dan level pembinaan wajib diisi.';return}
 const codes=requiredCodes(lvl),files={};if(role()==='PENGAWAS'){
  for(const c of codes){const f=$(`disciplineCreateFile_${c}`)?.files?.[0],bad=validateFile(f);if(bad){msg.className='err';msg.textContent=`${REQ[c]}: ${bad}`;return}files[c]=f}
 }
 const payload={case_type:type,case_level:lvl,scope_level:scope,coordinator_role:COORD[scope],subject_name:subject,school_name:school,summary,status:'OPEN',created_by:p().id,updated_at:new Date().toISOString()};
 const {data:row,error}=await sb.from('supervision_cases').insert(payload).select('*').single();if(error){msg.className='err';msg.textContent=error.message;return}
 if(role()==='PENGAWAS'){
  try{for(const c of codes)await uploadEvidence(row.id,c,files[c])}catch(e){msg.className='err';msg.textContent=`Kasus tersimpan, tetapi unggah bukti belum lengkap: ${e?.message||e}`;await renderDisciplineEvidence();return}
 }
 await renderDisciplineEvidence();
};
function createForm(){if(!canCreate())return '';
 const fixed=fixedScope();
 return `<div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">Tambah Pembinaan / Usul Perceraian</h3><div class="grid"><div class="field s4"><label>Jenis</label><select id="disciplineCaseType"><option value="PEMBINAAN_DISIPLIN">Pembinaan Disiplin</option><option value="PERCERAIAN">Usul Perceraian GTK</option></select></div><div class="field s4"><label>Level Pembinaan</label><select id="disciplineCaseLevel" onchange="disciplineRenderCreateEvidenceInputs()"><option value="KEPALA_SEKOLAH">Kepala Sekolah</option><option value="PENGAWAS_KORWIL">Pengawas/Korwil</option></select></div><div class="field s4"><label>Jenjang</label>${fixed?`<input id="disciplineCaseScope" type="hidden" value="${fixed}"><div class="info"><b>${SCOPE_LABEL[fixed]}</b></div>`:`<select id="disciplineCaseScope"><option value="ALL">Semua Jenjang</option><option value="TK_PAUD_PNF">TK/PAUD/PNF</option><option value="SD">SD</option><option value="SMP">SMP</option></select>`}</div><div class="field s6"><label>Nama GTK</label><input id="disciplineSubject"></div><div class="field s6"><label>Sekolah/Unit</label><input id="disciplineSchool"></div><div class="field s12"><label>Ringkasan Pembinaan / Usul</label><textarea id="disciplineSummary"></textarea></div><div class="s12" id="disciplineCreateEvidence"></div></div><button class="btn primary" onclick="disciplineSaveCase()">Simpan Kasus${role()==='PENGAWAS'?' & Unggah Bukti':''}</button><div id="disciplineCaseMsg"></div></div>`;
}
function evidencePanel(row,files){const codes=requiredCodes(row.case_level),by=new Map(files.filter(f=>f.case_id===row.id).map(f=>[f.requirement_code,f])),complete=codes.length>0&&codes.every(c=>by.has(c));
 return `<div style="margin-top:9px;padding-top:9px;border-top:1px solid var(--line)"><div class="small"><b>Kelengkapan Bukti:</b> ${complete?'<span class="status st-COMPLETED">LENGKAP</span>':'<span class="status st-REVISION">BELUM LENGKAP</span>'}</div>${codes.length?codes.map(c=>{const f=by.get(c);return `<div class="fileline" style="align-items:center"><span>${f?'✅':'⬜'} <b>${esc(REQ[c])}</b>${f?`<br><span class="small">${esc(f.file_name)} • ${(Number(f.file_size||0)/1024).toFixed(0)} KB</span>`:''}</span><span>${f?`<button class="btn soft" onclick="disciplineOpenEvidence('${encodeURIComponent(f.storage_path)}'.replace(/%2F/g,'/'))">Buka</button>`:''}${role()==='PENGAWAS'?` <input id="disciplineFile_${row.id}_${c}" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" style="max-width:185px"> <button class="btn soft" onclick="disciplineUploadEvidence('${row.id}','${c}')">${f?'Ganti':'Unggah'}</button>`:''}</span></div>`}).join(''):'<div class="notice">Level pembinaan belum ditentukan pada data lama.</div>'}</div>`;
}
async function renderDisciplineEvidence(){
 const body=$('disciplineBody');if(!body)return;
 const head=body.closest('.section')?.querySelector('.head p');if(head)head.textContent='Pembinaan disiplin dan usul perceraian dengan bukti wajib Korwil/Pengawas sesuai level.';
 const {data:rows,error}=await sb.from('supervision_cases').select('*').in('case_type',['PEMBINAAN_DISIPLIN','PERCERAIAN']).order('created_at',{ascending:false});if(error){body.innerHTML=`<div class="card err">${esc(error.message)}</div>`;return}
 let files=[];const ids=(rows||[]).map(x=>x.id);if(ids.length){const r=await sb.from('supervision_case_files').select('*').in('case_id',ids).order('created_at');if(r.error){body.innerHTML=`<div class="card err">${esc(r.error.message)}</div>`;return}files=r.data||[]}
 body.innerHTML=createForm()+`<div class="card"><h3 style="margin-top:0">Riwayat Pembinaan & Usul Perceraian</h3>${(rows||[]).length?(rows||[]).map(row=>{const codes=requiredCodes(row.case_level),have=new Set(files.filter(f=>f.case_id===row.id).map(f=>f.requirement_code)),complete=codes.length>0&&codes.every(c=>have.has(c));return `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>${esc(row.subject_name)}</b> <span class="status st-VERIFYING">${esc(typeLabel(row.case_type))}</span><div class="small">${esc(row.school_name||'-')} • ${esc(SCOPE_LABEL[row.scope_level]||row.scope_level||'-')} • Level: <b>${esc(levelLabel(row.case_level))}</b></div><div class="small" style="margin-top:4px">${esc(row.summary||'')}</div></div><div>${canManage(row)?`<select onchange="disciplineUpdateStatus('${row.id}',this.value)" style="padding:7px;border:1px solid var(--line);border-radius:8px"><option value="">${esc(statusLabel(row.status))}</option><option value="OPEN">Open</option><option value="PROCESS">Proses</option><option value="CLOSED" ${complete?'':'disabled'}>Selesai${complete?'':' — bukti belum lengkap'}</option></select>`:`<span class="status st-${row.status==='CLOSED'?'COMPLETED':row.status==='PROCESS'?'VERIFYING':'SUBMITTED'}">${esc(statusLabel(row.status))}</span>`}</div></div>${evidencePanel(row,files)}</div>`}).join(''):'<div class="empty">Belum ada kasus pembinaan atau usul perceraian.</div>'}</div>`;
 createEvidenceInputs();
}
window.renderDisciplineEvidence=renderDisciplineEvidence;
const previousShow=window.showTab;window.showTab=async id=>{await previousShow(id);if(id==='discipline'){await wait(120);await renderDisciplineEvidence()}};
if(document.querySelector('.section.active')?.id==='discipline'){await wait(120);await renderDisciplineEvidence()}
})();