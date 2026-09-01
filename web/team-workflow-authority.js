/* SIMANTAB_TEAM_WORKFLOW_AUTHORITY_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const p=()=>window.__simantabProfile||{};
const SCOPE_LABEL={ALL:'Semua Jenjang',TK_PAUD_PNF:'TK/PAUD/PNF',SD:'SD',SMP:'SMP'};
const COORD_SCOPE={SUBKOOR_TK:'TK_PAUD_PNF',KASI_SD:'SD',KASI_SMP:'SMP'};
const STAFF_RESP={
 STAFF_KP_EKIN:'KP • Klarifikasi PAK • e-Jabfung • SKP KS/Pengawas • PAK KS/Pengawas',
 STAFF_PROMOSI:'Promosi KSPSTK',STAFF_PENSIUN:'Pensiun/Pemberhentian',STAFF_CUTI:'Izin Cuti • Sakit • Umroh',
 STAFF_TPG:'TPG/Tamsil',STAFF_SPJ_SIMTENDIK:'Simtendik',STAFF_KGB:'Kenaikan Gaji Berkala',STAFF_USUL_SK:'Usul Penerbitan SK',STAFF_ARSIP:'Pengelolaan Arsip dan Aset'
};
let workflowEditingActivityId=null;
const isAdmin=()=>!!p().is_admin;
const role=()=>p().role||'';
function injectWorkflowNav(){
 const nav=$('nav');if(!nav||$('workflowNavGroup'))return;
 const r=role(),discipline=['SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','PENGAWAS'].includes(r),promotion=['SUPER_ADMIN','KABID','STAFF_PROMOSI','PENGAWAS'].includes(r);
 if(!discipline&&!promotion)return;
 const box=document.createElement('div');box.id='workflowNavGroup';
 box.innerHTML=`<div class="navhead">Pembinaan & Karir</div>${discipline?'<button class="navbtn" data-tab="discipline" onclick="showTab(\'discipline\')"><span class="ico">⚖</span>Disiplin & Perceraian</button>':''}${promotion?'<button class="navbtn" data-tab="promotion" onclick="showTab(\'promotion\')"><span class="ico">★</span>Promosi KSPSTK</button>':''}`;
 nav.appendChild(box);
}
function renderTeamMap(){
 const body=$('teamBody');if(!body)return;
 body.innerHTML=`
 <div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">🧭 Alur Kerja Bidang Ketenagaan</h3><div class="info"><b>Layanan:</b> Pengusul → identifikasi jenjang → Kasi/Subkoor mengoordinasikan → staf layanan memproses/verifikasi → Kasi/Subkoor memantau → Kabid mengendalikan seluruh jenjang.<br><br><b>Pembinaan disiplin/perceraian:</b> TK/PAUD/PNF → Subkoor; SD → Kasi PPTK SD; SMP → Kasi PPTK SMP; Kabid memimpin dan mengoordinasikan seluruh jenjang.<br><br><b>Kegiatan internal:</b> Kabid menetapkan kegiatan dan dapat menunjuk Kasi/Subkoor sebagai penanggung jawab; staf mendukung pelaksanaan sesuai penugasan.</div></div>
 <div class="card" style="margin-bottom:12px"><div class="label">A. KABID</div><h3>Kabid Ketenagaan</h3><ol><li>Memimpin dan mengoordinasikan seluruh kegiatan internal dan layanan kepegawaian semua jenjang.</li><li>Memimpin dan mengoordinasikan kegiatan pembinaan disiplin termasuk usul perceraian GTK semua jenjang.</li></ol></div>
 <div class="card" style="margin-bottom:12px"><div class="label">B. KASI / SUBKOORDINATOR PPTK</div><div class="servicegrid">
  <div class="service"><h3>Subkoor PPTK TK/PAUD/PNF</h3><p><b>Lingkup:</b> TK/PAUD/PNF</p><p>Penanggung jawab kegiatan bidang ketika ditunjuk Kabid; mengoordinasikan staf layanan sesuai jenjang; melaksanakan dan mengoordinasikan pembinaan disiplin termasuk usul perceraian.</p></div>
  <div class="service"><h3>Kasi PPTK SD</h3><p><b>Lingkup:</b> SD</p><p>Penanggung jawab kegiatan bidang ketika ditunjuk Kabid; mengoordinasikan staf layanan sesuai jenjang; melaksanakan dan mengoordinasikan pembinaan disiplin termasuk usul perceraian.</p></div>
  <div class="service"><h3>Kasi PPTK SMP</h3><p><b>Lingkup:</b> SMP</p><p>Penanggung jawab kegiatan bidang ketika ditunjuk Kabid; mengoordinasikan staf layanan sesuai jenjang; melaksanakan dan mengoordinasikan pembinaan disiplin termasuk usul perceraian.</p></div>
 </div></div>
 <div class="card"><div class="label">C. STAF — PEMETAAN LAYANAN</div><div class="servicegrid" style="margin-top:10px">
  <div class="service"><h3>Kasim • Risna Afif Anshori • Wartono</h3><p>Usul KP, Usul Klarifikasi PAK, Usul & Konsultasi Jabfung, SKP Kepala Sekolah & Pengawas, PAK Kepala Sekolah & Pengawas.</p></div>
  <div class="service"><h3>Kasim</h3><p>Promosi KSPSTK.</p></div>
  <div class="service"><h3>Wartono</h3><p>Pensiun/Pemberhentian.</p></div>
  <div class="service"><h3>Danny Khairunnisa</h3><p>Izin Cuti, Sakit, Umroh.</p></div>
  <div class="service"><h3>Sucipto</h3><p>TPG/Tamsil.</p></div>
  <div class="service"><h3>Ika Oktaviana Dewi</h3><p>Simtendik dan Super Admin SIMANTAB.</p></div>
  <div class="service"><h3>Rina Ratnawati</h3><p>Kenaikan Gaji Berkala.</p></div>
  <div class="service"><h3>Imam Prabowo</h3><p>Usul Penerbitan SK.</p></div>
  <div class="service"><h3>Mamik Rustiningsih</h3><p>Pengelolaan Arsip dan Aset.</p></div>
 </div></div>`;
}
async function coordinatorOptions(){
 const {data}=await sb.from('profiles').select('id,full_name,role,position').in('role',['SUBKOOR_TK','KASI_SD','KASI_SMP']).eq('is_active',true).order('full_name');
 return data||[];
}
async function decorateActivities(){
 const body=$('activitiesBody');if(!body)return;
 const r=role(),canLead=isAdmin()||r==='KABID',isCoord=Object.hasOwn(COORD_SCOPE,r);
 const formCard=[...body.querySelectorAll('.card')].find(x=>x.querySelector('#actName'));
 if(formCard){
  if(!canLead&&!workflowEditingActivityId){formCard.style.display='none';if(!$('activityAuthorityNotice')){const n=document.createElement('div');n.id='activityAuthorityNotice';n.className='card notice';n.style.marginBottom='12px';n.innerHTML=isCoord?'<b>Kewenangan kegiatan:</b> Kabid membuat kegiatan dan menunjuk Kasi/Subkoor sebagai penanggung jawab. Anda dapat mengubah kegiatan yang ditugaskan kepada Anda.':'<b>Kewenangan kegiatan:</b> pembuatan dan penetapan penanggung jawab kegiatan dilakukan oleh Kabid.';body.prepend(n)}}
  else{
   formCard.style.display='block';
   if(!$('activityWorkflowFields')){
    const officials=$('actOfficials')?.closest('.field');const wrap=document.createElement('div');wrap.id='activityWorkflowFields';wrap.className='s12';
    const coords=await coordinatorOptions();
    wrap.innerHTML=`<div class="grid"><div class="field s6"><label>Lingkup Kegiatan</label><select id="actScope"><option value="ALL">Semua Jenjang</option><option value="TK_PAUD_PNF">TK/PAUD/PNF</option><option value="SD">SD</option><option value="SMP">SMP</option></select></div><div class="field s6"><label>Penanggung Jawab yang Ditunjuk Kabid</label><select id="actResponsible"><option value="">Kabid langsung / belum ditunjuk</option>${coords.map(x=>`<option value="${x.id}" data-role="${x.role}">${esc(x.full_name)} — ${esc(x.position||x.role)}</option>`).join('')}</select><div class="small">Kasi/Subkoor hanya dapat mengubah kegiatan bila namanya ditetapkan sebagai penanggung jawab.</div></div></div>`;
    officials?.parentElement?.insertBefore(wrap,officials);
   }
   const save=[...formCard.querySelectorAll('button')].find(b=>b.textContent.includes('Simpan Terintegrasi'));if(save)save.setAttribute('onclick','saveActivityWorkflow()');
   if(workflowEditingActivityId){const {data}=await sb.from('field_activities').select('scope_level,responsible_user_id').eq('id',workflowEditingActivityId).maybeSingle();if(data){if($('actScope'))$('actScope').value=data.scope_level||'ALL';if($('actResponsible'))$('actResponsible').value=data.responsible_user_id||''}}
   if(isCoord){if($('actScope')){$('actScope').value=COORD_SCOPE[r];$('actScope').disabled=true}if($('actResponsible'))$('actResponsible').disabled=true}
  }
 }
 if(!canLead){[...body.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Hapus').forEach(b=>b.style.display='none')}
 if(!canLead&&!isCoord){[...body.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Ubah').forEach(b=>b.style.display='none')}
}
const oldEditActivity=window.editActivity;
if(oldEditActivity)window.editActivity=async id=>{
 const {data,error}=await sb.from('field_activities').select('id,responsible_user_id').eq('id',id).maybeSingle();if(error){alert(error.message);return}
 const r=role();if(!isAdmin()&&r!=='KABID'&&data?.responsible_user_id!==p().id){alert('Kegiatan ini tidak ditugaskan kepada akun Anda.');return}
 workflowEditingActivityId=id;await oldEditActivity(id);await wait(40);await decorateActivities();
};
window.saveActivityWorkflow=async()=>{
 const msg=$('actMsg'),r=role(),scope=isAdmin()||r==='KABID'?($('actScope')?.value||'ALL'):(COORD_SCOPE[r]||'ALL'),responsible=$('actResponsible')?.value||null;
 if(responsible&&isAdmin()||responsible&&r==='KABID'){
  const opt=$('actResponsible')?.selectedOptions?.[0],rr=opt?.dataset?.role||'',expected=COORD_SCOPE[rr];if(expected&&scope!==expected){msg.className='err';msg.textContent='Lingkup kegiatan harus sesuai dengan jenjang penanggung jawab yang ditunjuk.';return}
 }
 const list=id=>String($(id)?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const common={activity_name:$('actName')?.value.trim(),activity_date:$('actDate')?.value,activity_time:$('actTime')?.value||null,place:$('actPlace')?.value.trim(),participant_personal:list('actParticipantsPersonal'),participant_positions:list('actParticipantPositions'),participants:[...list('actParticipantsPersonal'),...list('actParticipantPositions')],invited_officials:list('actOfficials'),description:$('actDescription')?.value.trim()||'',materials:$('actMaterials')?.value.trim()||'',speakers:list('actSpeakers'),report:$('actReport')?.value.trim()||'',report_background:$('reportBackground')?.value.trim()||'',report_objectives:$('reportObjectives')?.value.trim()||'',report_results:$('reportResults')?.value.trim()||'',report_follow_up:$('reportFollowUp')?.value.trim()||'',report_recommendations:$('reportRecommendations')?.value.trim()||'',report_closing:$('reportClosing')?.value.trim()||'',document_number:$('actNumber')?.value.trim()||'',signatory_name:$('actSignName')?.value.trim()||p().full_name||'',signatory_nip:$('actSignNip')?.value.trim()||'',signatory_title:$('actSignTitle')?.value.trim()||p().position||'',signatory_unit:$('actSignUnit')?.value.trim()||p().unit||'',scope_level:scope,responsible_user_id:responsible,updated_at:new Date().toISOString()};
 if(!common.activity_name||!common.activity_date||!common.place){msg.className='err';msg.textContent='Nama kegiatan, tanggal, dan tempat wajib diisi.';return}
 let error;if(workflowEditingActivityId)({error}=await sb.from('field_activities').update(common).eq('id',workflowEditingActivityId));else({error}=await sb.from('field_activities').insert({...common,created_by:p().id}));
 if(error){msg.className='err';msg.textContent=error.message;return}workflowEditingActivityId=null;await window.showTab('activities');
};
function scopeSelect(currentRole,value='ALL'){
 const fixed=COORD_SCOPE[currentRole];if(fixed)return `<input type="hidden" id="workflowCaseScope" value="${fixed}"><div class="info">Lingkup: <b>${SCOPE_LABEL[fixed]}</b></div>`;
 return `<select id="workflowCaseScope"><option value="ALL" ${value==='ALL'?'selected':''}>Semua Jenjang</option><option value="TK_PAUD_PNF">TK/PAUD/PNF</option><option value="SD">SD</option><option value="SMP">SMP</option></select>`;
}
const canCaseUpdate=row=>isAdmin()||role()==='KABID'||(Object.hasOwn(COORD_SCOPE,role())&&row.coordinator_role===role())||(role()==='STAFF_PROMOSI'&&row.case_type==='PROMOSI_KARIR')||(role()==='PENGAWAS'&&row.created_by===p().id);
async function renderDiscipline(){
 const body=$('disciplineBody');if(!body)return;const {data,error}=await sb.from('supervision_cases').select('*').in('case_type',['PEMBINAAN_DISIPLIN','PERCERAIAN']).order('created_at',{ascending:false});if(error){body.innerHTML=`<div class="card err">${esc(error.message)}</div>`;return}
 const canCreate=isAdmin()||['KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','PENGAWAS'].includes(role());
 body.innerHTML=`${canCreate?`<div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">Tambah Kasus Pembinaan</h3><div class="grid"><div class="field s4"><label>Jenis</label><select id="workflowCaseType"><option value="PEMBINAAN_DISIPLIN">Pembinaan Disiplin</option><option value="PERCERAIAN">Usul Perceraian GTK</option></select></div><div class="field s4"><label>Jenjang</label>${scopeSelect(role())}</div><div class="field s4"><label>Nama GTK</label><input id="workflowSubject"></div><div class="field s6"><label>Sekolah/Unit</label><input id="workflowSchool"></div><div class="field s6"><label>Ringkasan</label><textarea id="workflowSummary"></textarea></div></div><button class="btn primary" onclick="workflowSaveDisciplineCase()">Simpan</button><div id="workflowCaseMsg"></div></div>`:''}<div class="card"><h3 style="margin-top:0">Kasus Sesuai Kewenangan</h3>${data?.length?`<div class="tablewrap"><table><thead><tr><th>Jenis</th><th>Jenjang</th><th>GTK/Sekolah</th><th>Ringkasan</th><th>Status</th></tr></thead><tbody>${data.map(x=>`<tr><td>${x.case_type==='PERCERAIAN'?'Usul Perceraian':'Pembinaan Disiplin'}</td><td>${esc(SCOPE_LABEL[x.scope_level]||x.scope_level||'-')}</td><td><b>${esc(x.subject_name)}</b><br>${esc(x.school_name||'-')}</td><td>${esc(x.summary||'-')}</td><td>${canCaseUpdate(x)?`<select onchange="workflowUpdateCaseStatus('${x.id}',this.value)"><option value="OPEN" ${x.status==='OPEN'?'selected':''}>Open</option><option value="PROCESS" ${x.status==='PROCESS'?'selected':''}>Proses</option><option value="CLOSED" ${x.status==='CLOSED'?'selected':''}>Selesai</option></select>`:esc(x.status)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Belum ada kasus.</div>'}</div>`;
}
window.workflowSaveDisciplineCase=async()=>{const msg=$('workflowCaseMsg'),payload={case_type:$('workflowCaseType').value,scope_level:$('workflowCaseScope').value,subject_name:$('workflowSubject').value.trim(),school_name:$('workflowSchool').value.trim(),summary:$('workflowSummary').value.trim(),created_by:p().id};if(!payload.subject_name){msg.className='err';msg.textContent='Nama GTK wajib diisi.';return}const {error}=await sb.from('supervision_cases').insert(payload);if(error){msg.className='err';msg.textContent=error.message}else await renderDiscipline()};
window.workflowUpdateCaseStatus=async(id,status)=>{const {error}=await sb.from('supervision_cases').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)alert(error.message);else if(document.querySelector('#discipline.active'))await renderDiscipline();else await renderPromotion()};
async function renderPromotion(){
 const body=$('promotionBody');if(!body)return;const {data,error}=await sb.from('supervision_cases').select('*').eq('case_type','PROMOSI_KARIR').order('created_at',{ascending:false});if(error){body.innerHTML=`<div class="card err">${esc(error.message)}</div>`;return}
 const canCreate=isAdmin()||['KABID','STAFF_PROMOSI','PENGAWAS'].includes(role());
 body.innerHTML=`${canCreate?`<div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">Usul Promosi KSPSTK</h3><div class="grid"><div class="field s4"><label>Jenjang</label>${scopeSelect(role())}</div><div class="field s4"><label>Nama GTK</label><input id="workflowPromoSubject"></div><div class="field s4"><label>Sekolah/Unit</label><input id="workflowPromoSchool"></div><div class="field s12"><label>Ringkasan/Rekomendasi</label><textarea id="workflowPromoSummary"></textarea></div></div><button class="btn primary" onclick="workflowSavePromotion()">Simpan Usul</button><div id="workflowPromoMsg"></div></div>`:''}<div class="card"><h3 style="margin-top:0">Daftar Promosi</h3>${data?.length?`<div class="tablewrap"><table><thead><tr><th>Jenjang</th><th>Nama</th><th>Sekolah</th><th>Ringkasan</th><th>Status</th></tr></thead><tbody>${data.map(x=>`<tr><td>${esc(SCOPE_LABEL[x.scope_level]||x.scope_level||'-')}</td><td><b>${esc(x.subject_name)}</b></td><td>${esc(x.school_name||'-')}</td><td>${esc(x.summary||'-')}</td><td>${canCaseUpdate(x)?`<select onchange="workflowUpdateCaseStatus('${x.id}',this.value)"><option value="OPEN" ${x.status==='OPEN'?'selected':''}>Open</option><option value="PROCESS" ${x.status==='PROCESS'?'selected':''}>Proses</option><option value="CLOSED" ${x.status==='CLOSED'?'selected':''}>Selesai</option></select>`:esc(x.status)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Belum ada usul promosi.</div>'}</div>`;
}
window.workflowSavePromotion=async()=>{const msg=$('workflowPromoMsg'),payload={case_type:'PROMOSI_KARIR',scope_level:$('workflowCaseScope').value,subject_name:$('workflowPromoSubject').value.trim(),school_name:$('workflowPromoSchool').value.trim(),summary:$('workflowPromoSummary').value.trim(),created_by:p().id};if(!payload.subject_name){msg.className='err';msg.textContent='Nama GTK wajib diisi.';return}const {error}=await sb.from('supervision_cases').insert(payload);if(error){msg.className='err';msg.textContent=error.message}else await renderPromotion()};
function prependServiceResponsibility(){const body=$('servicesBody'),r=role();if(!body||!STAFF_RESP[r]||$('staffResponsibilityInfo'))return;const n=document.createElement('div');n.id='staffResponsibilityInfo';n.className='info';n.style.marginBottom='12px';n.innerHTML=`<b>Tugas layanan akun ini:</b> ${esc(STAFF_RESP[r])}. Usulan yang tampil telah difilter oleh kewenangan server.`;body.prepend(n)}
const oldShow=window.showTab;window.showTab=async id=>{injectWorkflowNav();await oldShow(id);await wait(50);injectWorkflowNav();if(id==='team')renderTeamMap();if(id==='activities')await decorateActivities();if(id==='discipline')await renderDiscipline();if(id==='promotion')await renderPromotion();if(id==='services')prependServiceResponsibility()};
for(let i=0;i<100&&!window.__simantabProfile;i++)await wait(80);injectWorkflowNav();
if(document.querySelector('#team.active'))renderTeamMap();
})();