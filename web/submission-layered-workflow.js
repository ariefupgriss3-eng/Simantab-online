/* SIMANTAB_LAYERED_SERVICE_WORKFLOW_V1 */
/* SIMANTAB_LAYERED_SERVICE_WORKFLOW_V4 */
/* SIMANTAB_LAYERED_SERVICE_WORKFLOW_V5 */
/* SIMANTAB_LAYERED_SERVICE_WORKFLOW_V6 */
/* SIMANTAB_LAYERED_SERVICE_WORKFLOW_V7 */
/* SIMANTAB_COORDINATOR_SERVICE_AGGREGATE_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<600&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const p=()=>window.__simantabProfile||{},role=()=>String(p().role||'');
const LEADERS=new Set(['KEPALA_DINAS','SEKRETARIS_DINAS']);
const COORDS=new Set(['KASI_SD','KASI_SMP','SUBKOOR_TK']);
const COORD_SCOPE={KASI_SD:'SD',KASI_SMP:'SMP',SUBKOOR_TK:'TK_PAUD_PNF'};
const COORD_STAGE_LABEL={
 MENUNGGU_DISPOSISI_KOORDINATOR:'Bagi Tugas',
 VERIFIKASI_STAF:'Verifikasi Admin/Staf',
 MENUNGGU_APPROVAL_KOORDINATOR:'Approve Kasi/Subkoor',
 MENUNGGU_PERSETUJUAN_KABID:'Persetujuan Kabid',
 MENUNGGU_KONFIRMASI_GTK:'Menunggu Konfirmasi GTK',
 PERBAIKAN:'Perbaikan',
 SELESAI:'Selesai'
};
const STATE_LABEL={
 DRAFT:'Draft',
 MENUNGGU_DISPOSISI_KOORDINATOR:'Menunggu Pembagian Tugas',
 VERIFIKASI_STAF:'Verifikasi Staf/Admin',
 MENUNGGU_APPROVAL_KOORDINATOR:'Menunggu Approval Kasi/Subkoor',
 MENUNGGU_PERSETUJUAN_KABID:'Menunggu Persetujuan Kabid',
 MENUNGGU_KONFIRMASI_GTK:'Menunggu Konfirmasi GTK',
 PERBAIKAN:'Perlu Perbaikan',
 SELESAI:'Selesai'
};
const SCOPE_LABEL={SD:'SD',SMP:'SMP',TK_PAUD_PNF:'TK/PAUD/PNF',ALL:'Belum Terpetakan'};
const SERVICE_LABEL={
 KP:'Kenaikan Pangkat',KLARIFIKASI_PAK:'Klarifikasi PAK',E_JABFUNG:'Usul/Konsultasi Jabfung',
 SKP_KS_PENGAWAS:'SKP KS/Pengawas',PAK_KS_PENGAWAS:'PAK KS/Pengawas',
 KGB:'Kenaikan Gaji Berkala',CUTI:'Izin/Cuti',TPG_TAMSIL:'TPG/Tamsil',TPG_KONSULTASI:'Konsultasi TPG/Tamsil',
 USUL_SK:'Usul Penerbitan SK',PENSIUN:'Pensiun/Pemberhentian',PENSIUN_HUDIS_PIDANA:'Hudis/Pidana',
 PENSIUN_SKMD:'SKMD',DIKLAT_KS_BCKS:'Diklat KS/BCKS'
};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
function style(){if($('layeredWorkflowStyle'))return;const s=document.createElement('style');s.id='layeredWorkflowStyle';s.textContent=`
.lwf-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.lwf-metric{border:1px solid var(--line);border-radius:14px;background:#fff;padding:12px;cursor:pointer}.lwf-metric:hover{box-shadow:0 6px 18px #16395d18}.lwf-num{font-size:26px;font-weight:950;color:var(--navy)}.lwf-flow{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin-bottom:12px}.lwf-flow>div{padding:10px;border:1px solid var(--line);border-radius:12px;background:#f8fbff;text-align:center;font-size:10px}.lwf-flow b{display:block;color:var(--navy);font-size:11px}.lwf-actions{display:flex;gap:6px;flex-wrap:wrap}.lwf-modal{position:fixed;inset:0;z-index:99999;background:#0b203c99;display:flex;align-items:center;justify-content:center;padding:16px}.lwf-box{width:min(1080px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:16px}.lwf-badge{display:inline-block;padding:4px 7px;border-radius:999px;background:#edf5ff;color:#175ea7;font-size:9px;font-weight:900}.lwf-done{background:#e9f7ef;color:#178354}.lwf-warn{background:#fff3dd;color:#955a00}.lwf-bad{background:#feeceb;color:#b42318}.lwf-step{font-size:10px;color:var(--muted);line-height:1.45}.lwf-click{cursor:pointer;text-decoration:underline;text-decoration-style:dotted}.lwf-staff-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:310px;overflow:auto;padding:4px}.lwf-staff-option{display:grid!important;grid-template-columns:22px minmax(0,1fr);gap:10px!important;align-items:start!important;margin:0!important;padding:11px 12px!important;border:1px solid #dbe3ec;border-radius:12px;background:#fff;cursor:pointer;line-height:1.25}.lwf-staff-option:hover{background:#f5f9ff;border-color:#aac8e8}.lwf-staff-option:has(input:checked){background:#edf6ff;border-color:#4b91d1;box-shadow:0 0 0 1px #4b91d122}.lwf-staff-option input{width:17px;height:17px;margin:1px 0 0!important}.lwf-staff-name{font-size:12px;font-weight:900;color:var(--navy)}.lwf-staff-pos{font-size:10px;color:var(--muted);margin-top:3px}.lwf-bulkbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}.lwf-bulkbtn{border:1px solid #b8d2ec;background:#f3f8ff;color:#155b9d;border-radius:11px;padding:9px 11px;font-weight:900;cursor:pointer}.lwf-bulkbtn:hover{background:#e9f3ff}.lwf-distribution{padding:10px 12px;border-radius:11px;background:#f6f9fc;border:1px solid #dfe7ef;font-size:11px;color:#425466}@media(max-width:900px){.lwf-grid{grid-template-columns:repeat(2,1fr)}.lwf-flow{grid-template-columns:1fr}.lwf-actions{display:block}.lwf-actions button{margin:3px 0}.lwf-staff-grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
async function fetchWorkflowData(scopeOnly=null){
 let sq=sb.from('submissions').select('id,user_id,service_type,title,description,status,scope_level,coordinator_role,assigned_role,workflow_state,assigned_user_id,assigned_by,assigned_at,assignment_note,staff_verified_by,staff_verified_at,staff_verification_note,coordinator_approved_by,coordinator_approved_at,coordinator_approval_note,kabid_approved_by,kabid_approved_at,kabid_approval_note,staff_response,staff_response_by,staff_response_at,workflow_completed_at,submitted_at,updated_at').order('submitted_at',{ascending:false}).limit(1000);
 if(scopeOnly)sq=sq.eq('scope_level',scopeOnly);
 const [s,u,t,a,cx]=await Promise.all([
  sq,
  sb.from('profiles').select('id,full_name,role,account_channel,unit,position,is_active').order('full_name'),
  sb.from('team_task_assignments').select('user_id,capability,is_active').eq('is_active',true),
  sb.from('submission_assignees').select('submission_id,user_id,assigned_at,verified_at,verification_result'),
  sb.from('submission_response_cycles').select('id,submission_id,cycle_no,staff_response,staff_response_by,staff_response_at,coordinator_status,coordinator_note,kabid_status,kabid_note,delivered_at,gtk_reply,gtk_replied_at,cycle_status,closed_at').order('cycle_no',{ascending:false}).limit(3000)
 ]);
 const e=s.error||u.error||t.error||a.error||cx.error;if(e)throw e;
 return{subs:s.data||[],profiles:u.data||[],tasks:t.data||[],assignees:a.data||[],cycles:cx.data||[]};
}
function maps(d){return{names:new Map(d.profiles.map(x=>[x.id,x.full_name||'-'])),prof:new Map(d.profiles.map(x=>[x.id,x]))}}
function latestCycle(d,submissionId){
 return (d.cycles||[]).filter(x=>x.submission_id===submissionId).sort((a,b)=>Number(b.cycle_no||0)-Number(a.cycle_no||0))[0]||null;
}
function responseText(s,d){
 const cy=latestCycle(d,s.id);
 return cy?.staff_response||s.staff_response||'';
}
function labelService(s){return SERVICE_LABEL[s]||s||'-'}
function statePill(s){const cls=s==='SELESAI'?'lwf-done':s==='PERBAIKAN'?'lwf-bad':'lwf-warn';return `<span class="lwf-badge ${cls}">${esc(STATE_LABEL[s]||s||'-')}</span>`}
function assigneeIds(d,submissionId){return (d.assignees||[]).filter(a=>a.submission_id===submissionId).map(a=>a.user_id)}
function visibleRows(d){
 const r=role(),uid=p().id;
 if(r==='SUPER_ADMIN'||r==='KABID')return d.subs;
 if(COORDS.has(r)){const scope=COORD_SCOPE[r];return d.subs.filter(x=>x.scope_level===scope);}
 if(LEADERS.has(r))return d.subs;
 return d.subs.filter(x=>assigneeIds(d,x.id).includes(uid)||x.assigned_user_id===uid);
}
function candidateStaff(d,sub){
 let arr=d.profiles.filter(x=>{
  const r=String(x.role||'');
  return x.is_active&&x.account_channel==='DINAS'&&(r.startsWith('STAFF_')||r.startsWith('ADMIN_'));
 });
 arr.sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||''),'id'));
 return arr;
}
function actionHtml(s,d){
 const r=role(),uid=p().id;
 if((r==='SUPER_ADMIN'||r===s.coordinator_role)&&s.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR')
   return `<button class="btn primary" onclick="layerOpenAssign('${s.id}')">👤 Bagi Tugas</button>`;
 if((r==='SUPER_ADMIN'||assigneeIds(d,s.id).includes(uid)||s.assigned_user_id===uid)&&s.workflow_state==='VERIFIKASI_STAF'){
   if(s.service_type==='DIKLAT_KS_BCKS')return `<button class="btn success" onclick="layerStaffVerify('${s.id}',true)">✓ Terverifikasi</button><button class="btn danger" onclick="layerStaffVerify('${s.id}',false)">↺ Perbaikan</button>`;
   return '<button class="btn primary" onclick="showTab(\'services\')">💬 Susun Respon</button>';
 }
 if((r==='SUPER_ADMIN'||r===s.coordinator_role)&&s.workflow_state==='MENUNGGU_APPROVAL_KOORDINATOR')
   return `<button class="btn success" onclick="layerCoordinatorApprove('${s.id}',true)">✓ Approve Respon</button><button class="btn danger" onclick="layerCoordinatorApprove('${s.id}',false)">↺ Kembalikan</button>`;
 if((r==='SUPER_ADMIN'||r==='KABID')&&s.workflow_state==='MENUNGGU_PERSETUJUAN_KABID')
   return `<button class="btn success" onclick="layerKabidApprove('${s.id}',true)">✓ Setujui Respon</button><button class="btn danger" onclick="layerKabidApprove('${s.id}',false)">↺ Kembalikan</button>`;
 return '<span class="small">Monitoring</span>';
}
let currentData=null;
function aggregateHtml(rows){
 const states=['MENUNGGU_DISPOSISI_KOORDINATOR','VERIFIKASI_STAF','MENUNGGU_APPROVAL_KOORDINATOR','MENUNGGU_PERSETUJUAN_KABID','MENUNGGU_KONFIRMASI_GTK','PERBAIKAN','SELESAI'];
 return `<div class="lwf-grid">${states.map(st=>{const n=rows.filter(x=>x.workflow_state===st).length;return `<div class="lwf-metric" onclick="layerOpenFiltered('${st}')"><div class="label">${esc(STATE_LABEL[st])}</div><div class="lwf-num">${n}</div><div class="small">Klik untuk melihat rincian</div></div>`}).join('')}</div>`;
}
function workflowFlow(){return '<div class="lwf-flow"><div><b>1. GTK</b>Ajukan layanan</div><div><b>2. Kasi/Subkoor</b>Bagi tugas</div><div><b>3. Staf/Admin</b>Susun respon</div><div><b>4. Kasi/Subkoor</b>Approve respon</div><div><b>5. Kabid</b>Setujui respon</div><div><b>6. GTK</b>Konfirmasi / tindak lanjut</div></div>'}
function tableHtml(rows,d,withActions=true){
 const {names}=maps(d);
 if(!rows.length)return '<div class="empty">Belum ada data pada tahap ini.</div>';
 const assigneeLabel=s=>{const ids=assigneeIds(d,s.id),vals=ids.map(id=>names.get(id)).filter(Boolean);if(vals.length)return vals.join(', ');return s.assigned_user_id?(names.get(s.assigned_user_id)||'-'):'Belum ditugaskan'};
 return `<div class="tablewrap"><table><thead><tr><th>Pemohon</th><th>Layanan</th><th>Respon Admin/Staf</th><th>Jenjang</th><th>Tahap</th><th>Pelaksana</th><th>Update</th>${withActions?'<th>Aksi</th>':''}</tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(names.get(s.user_id)||'-')}</b><div class="small">${esc(s.title||'')}</div></td><td>${esc(labelService(s.service_type))}</td><td><div style="max-width:360px;white-space:normal">${responseText(s,d)?esc(responseText(s,d)):'<span class="small">Belum ada respon</span>'}</div></td><td>${esc(SCOPE_LABEL[s.scope_level]||s.scope_level||'-')}</td><td>${statePill(s.workflow_state)}<div class="lwf-step">${esc(s.coordinator_role||'-')}</div></td><td>${esc(assigneeLabel(s))}</td><td>${fmt(s.updated_at)}</td>${withActions?`<td><div class="lwf-actions">${actionHtml(s,d)}${s.service_type==='DIKLAT_KS_BCKS'?'<button class="btn soft" onclick="showTab(\'diklatKsBcks\')">🎓 Buka Diklat</button>':''}</div></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}

function coordinatorFlow(){
 return '<div class="lwf-flow"><div><b>1. Bagi Tugas</b>Tetapkan admin/staf</div><div><b>2. Respon Admin/Staf</b>Susun jawaban</div><div><b>3. Approve Kasi/Subkoor</b>Periksa respon</div><div><b>4. Persetujuan Kabid</b>Setujui respon</div><div><b>5. Ke GTK</b>Respon resmi tampil</div><div><b>6. Siklus</b>Selesai / tindak lanjut</div></div>';
}
function coordinatorStagePill(s){
 const label=COORD_STAGE_LABEL[s]||STATE_LABEL[s]||s||'-';
 const cls=s==='SELESAI'?'lwf-done':s==='PERBAIKAN'?'lwf-bad':'lwf-warn';
 return `<span class="lwf-badge ${cls}">${esc(label)}</span>`;
}
function coordinatorServiceRows(d){
 const scope=COORD_SCOPE[role()];
 return d.subs.filter(x=>x.scope_level===scope);
}
function coordinatorServiceTable(rows,d){
 const {names,prof}=maps(d);
 if(!rows.length)return '<div class="empty">Belum ada usulan layanan pada jenjang ini.</div>';
 return `<div class="tablewrap"><table><thead><tr><th>Nama</th><th>Unit Kerja</th><th>Jenis Layanan</th><th>Isi / Maksud GTK</th><th>Respon Admin/Staf</th><th>Status / Proses</th></tr></thead><tbody>${rows.map(s=>{
   const person=prof.get(s.user_id)||{};
   const action=actionHtml(s,d);
   const actionPart=action.includes('<button')?`<div class="lwf-actions" style="margin-top:7px">${action}</div>`:'';
   return `<tr><td><b>${esc(names.get(s.user_id)||'-')}</b></td><td>${esc(person.unit||'-')}</td><td>${esc(labelService(s.service_type))}</td><td><div style="max-width:320px;white-space:normal">${esc(s.description||s.title||'-')}</div></td><td><div style="max-width:360px;white-space:normal">${responseText(s,d)?esc(responseText(s,d)):'<span class="small">Belum ada respon</span>'}</div></td><td>${coordinatorStagePill(s.workflow_state)}${actionPart}</td></tr>`;
 }).join('')}</tbody></table></div>`;
}

function coordinatorBulkHtml(rows){
 const pending=rows.filter(x=>x.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR');
 const groups=new Map;
 for(const s of pending){const k=s.service_type||'OTHER';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s)}
 const items=[...groups.entries()].filter(([,list])=>list.length>=2).sort((a,b)=>String(labelService(a[0])).localeCompare(String(labelService(b[0])),'id'));
 if(!items.length)return'';
 return `<div class="card" style="margin-top:12px"><div class="label">PEMBAGIAN TUGAS AGREGAT</div><div class="small" style="margin:4px 0 8px">Usulan dengan jenis layanan yang sama dibagi otomatis dan merata. Satu usulan hanya mendapat satu petugas.</div><div class="lwf-bulkbar">${items.map(([service,list])=>`<button class="lwf-bulkbtn" onclick="layerOpenBulkAssign('${esc(service)}')">⚖️ ${esc(labelService(service))} <b>(${list.length})</b></button>`).join('')}</div></div>`;
}
function staffChoicesHtml(cand,klass){
 if(!cand.length)return'<div class="notice">Belum ada admin/staf internal aktif yang tersedia.</div>';
 return `<div class="lwf-staff-grid">${cand.map(x=>`<label class="lwf-staff-option"><input type="checkbox" class="${klass}" value="${x.id}"><span><div class="lwf-staff-name">${esc(x.full_name)}</div><div class="lwf-staff-pos">${esc(x.position||x.role)}</div></span></label>`).join('')}</div>`;
}
window.layerBulkPreview=()=>{
 const box=$('layerBulkAssignModal');if(!box)return;
 const n=Number(box.dataset.submissionCount||0),m=box.querySelectorAll('.layer-bulk-assignee:checked').length,out=$('layerBulkPreview');
 if(out)out.innerHTML=m?`<b>${n} usulan</b> akan dibagi ke <b>${m} petugas</b>. Perkiraan masing-masing ${Math.floor(n/m)}–${Math.ceil(n/m)} usulan, menyesuaikan beban aktif.`:'Pilih minimal satu admin/staf internal.';
};
window.layerOpenBulkAssign=serviceType=>{
 const d=currentData;if(!d)return;
 const scope=COORD_SCOPE[role()];
 const rows=d.subs.filter(x=>x.scope_level===scope&&x.service_type===serviceType&&x.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR');
 if(rows.length<2){alert('Pembagian agregat membutuhkan minimal 2 usulan sejenis pada tahap Bagi Tugas.');return}
 const cand=candidateStaff(d,rows[0]);let m=$('layerBulkAssignModal');m?.remove();m=document.createElement('div');m.id='layerBulkAssignModal';m.className='lwf-modal';m.dataset.submissionCount=String(rows.length);m.onclick=e=>{if(e.target===m)m.remove()};
 m.innerHTML=`<div class="lwf-box" style="width:min(760px,100%)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div class="label">BAGI TUGAS AGREGAT</div><h3 style="margin:3px 0">${esc(labelService(serviceType))}</h3><div class="small">${rows.length} usulan • jenjang ${esc(SCOPE_LABEL[scope]||scope)}</div></div><button class="btn soft" onclick="document.getElementById('layerBulkAssignModal')?.remove()">✕</button></div><div class="info" style="margin:12px 0"><b>Pembagian otomatis merata.</b> Setiap usulan hanya ditugaskan kepada satu admin/staf. Sistem mendahulukan petugas dengan beban aktif lebih sedikit.</div><div class="field"><label>Pilih Admin/Staf Internal</label>${staffChoicesHtml(cand,'layer-bulk-assignee')}</div><div id="layerBulkPreview" class="lwf-distribution">Pilih minimal satu admin/staf internal.</div><div class="field" style="margin-top:10px"><label>Catatan penugasan (opsional)</label><textarea id="layerBulkNote"></textarea></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn soft" onclick="document.getElementById('layerBulkAssignModal')?.remove()">Batal</button><button class="btn primary" onclick="layerSaveBulkAssign('${esc(serviceType)}')">⚖️ Bagi Tugas Merata</button></div><div id="layerBulkMsg" class="small" style="margin-top:7px"></div></div>`;
 document.body.appendChild(m);
 m.querySelectorAll('.layer-bulk-assignee').forEach(x=>x.addEventListener('change',window.layerBulkPreview));
};
window.layerSaveBulkAssign=async serviceType=>{
 const d=currentData,scope=COORD_SCOPE[role()],msg=$('layerBulkMsg');
 const rows=d.subs.filter(x=>x.scope_level===scope&&x.service_type===serviceType&&x.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR');
 const ids=[...document.querySelectorAll('#layerBulkAssignModal .layer-bulk-assignee:checked')].map(x=>x.value);
 if(!ids.length){msg.textContent='Pilih minimal satu admin/staf internal.';return}
 if(rows.length<2){msg.textContent='Usulan sejenis yang belum dibagi tugas kurang dari 2.';return}
 msg.textContent='Membagi '+rows.length+' usulan secara merata...';
 const {data,error}=await sb.rpc('submission_assign_staff_balanced',{p_submission_ids:rows.map(x=>x.id),p_assignee_user_ids:ids,p_note:$('layerBulkNote')?.value?.trim()||null});
 if(error){msg.textContent=error.message;return}
 $('layerBulkAssignModal')?.remove();
 await renderCoordinatorServices();
};
function coordinatorServiceSummary(rows){
 const stages=[
  ['MENUNGGU_DISPOSISI_KOORDINATOR','Bagi Tugas'],
  ['VERIFIKASI_STAF','Verifikasi Admin/Staf'],
  ['MENUNGGU_APPROVAL_KOORDINATOR','Approve Kasi/Subkoor'],
  ['MENUNGGU_PERSETUJUAN_KABID','Persetujuan Kabid'],
  ['MENUNGGU_KONFIRMASI_GTK','Menunggu Konfirmasi GTK'],
  ['SELESAI','Selesai / Naik Level']
 ];
 return `<div class="lwf-grid">${stages.map(([st,label])=>`<div class="lwf-metric" style="cursor:default"><div class="label">${esc(label)}</div><div class="lwf-num">${rows.filter(x=>x.workflow_state===st).length}</div></div>`).join('')}</div>`;
}
async function renderCoordinatorServices(){
 const body=$('servicesBody');if(!body||!COORDS.has(role()))return;
 const scope=COORD_SCOPE[role()];
 const scopeLabel=SCOPE_LABEL[scope]||scope;
 if($('servicesDesc'))$('servicesDesc').textContent=`Monitoring agregat layanan kepegawaian jenjang ${scopeLabel}. Berkas unggahan tidak ditampilkan pada level Kasi/Subkoor.`;
 body.innerHTML='<div class="card empty">Memuat antrean layanan jenjang...</div>';
 try{
  const d=await fetchWorkflowData(scope);currentData=d;
  const rows=coordinatorServiceRows(d);
  const revision=rows.filter(x=>x.workflow_state==='PERBAIKAN').length;
  body.innerHTML=`<div class="card" style="margin-bottom:12px">${coordinatorFlow()}<div class="info"><b>Cakupan: ${esc(scopeLabel)} saja.</b> Tampilan hanya memuat nama, unit kerja, jenis layanan, dan status proses. Berkas unggahan tetap diperiksa oleh admin/staf verifikator dan tidak ditampilkan di layar Kasi/Subkoor.</div>${revision?`<div class="notice" style="margin-top:9px"><b>Perlu perbaikan:</b> ${revision} usulan sedang dikembalikan untuk perbaikan.</div>`:''}</div>${coordinatorServiceSummary(rows)}${coordinatorBulkHtml(rows)}<div style="height:12px"></div><div class="card">${coordinatorServiceTable(rows,d)}</div>`;
 }catch(e){body.innerHTML=`<div class="card err">${esc(e?.message||e)}</div>`}
}
function activateCoordinatorServicesTab(){
 document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active',x.id==='services'));
 document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.tab==='services'));
 $('sidebar')?.classList.remove('open');
}
async function refreshWorkflowSurface(){
 if(COORDS.has(role())&&$('services')?.classList.contains('active'))return renderCoordinatorServices();
 return renderMonitoring();
}
async function renderMonitoring(){
 const body=$('monitoringBody');if(!body)return;
 body.innerHTML='<div class="card empty">Memuat workflow layanan...</div>';
 try{
  const d=await fetchWorkflowData();currentData=d;const rows=visibleRows(d);
  if(LEADERS.has(role())){
   body.innerHTML=`<div class="card" style="margin-bottom:12px">${workflowFlow()}<div class="info"><b>Mode Pimpinan:</b> dashboard hanya menampilkan agregat. Klik angka untuk melihat rincian seluruh GTK.</div></div>${aggregateHtml(rows)}`;
   return;
  }
  body.innerHTML=`<div class="card" style="margin-bottom:12px">${workflowFlow()}<div class="info"><b>Kewenangan aktif:</b> ${COORDS.has(role())?'membagi tugas dan approve sesuai jenjang':role()==='KABID'?'persetujuan akhir seluruh jenjang':role()==='SUPER_ADMIN'?'administrasi penuh workflow':'memverifikasi layanan yang ditugaskan kepada akun Anda'}.</div></div><div class="card">${tableHtml(rows,d,true)}</div>`;
 }catch(e){body.innerHTML=`<div class="card err">${esc(e?.message||e)}</div>`}
}
window.layerOpenAssign=id=>{
 const d=currentData;if(!d)return;const s=d.subs.find(x=>x.id===id);if(!s)return;
 const cand=candidateStaff(d,s);let m=$('layerAssignModal');m?.remove();m=document.createElement('div');m.id='layerAssignModal';m.className='lwf-modal';m.onclick=e=>{if(e.target===m)m.remove()};
 const choices=staffChoicesHtml(cand,'layer-assignee-check');
 m.innerHTML=`<div class="lwf-box" style="width:min(680px,100%)"><div style="display:flex;justify-content:space-between;gap:8px"><div><div class="label">PEMBAGIAN TUGAS</div><h3 style="margin:3px 0">${esc(s.title||labelService(s.service_type))}</h3><div class="small">Jenjang ${esc(SCOPE_LABEL[s.scope_level]||s.scope_level)} • dapat memilih lebih dari satu admin/staf internal</div></div><button class="btn soft" onclick="document.getElementById('layerAssignModal')?.remove()">✕</button></div><div class="field"><label>Admin/Staf Verifikator</label>${choices}</div><div class="field"><label>Catatan penugasan (opsional)</label><textarea id="layerAssignNote"></textarea></div><button class="btn primary" onclick="layerSaveAssign('${id}')">Tetapkan Tugas</button><div id="layerAssignMsg" class="small" style="margin-top:7px"></div></div>`;document.body.appendChild(m);
};
window.layerSaveAssign=async id=>{const ids=[...document.querySelectorAll('#layerAssignModal .layer-assignee-check:checked')].map(x=>x.value),msg=$('layerAssignMsg');if(!ids.length){msg.textContent='Pilih minimal satu admin/staf internal.';return}msg.textContent='Menyimpan penugasan...';const {error}=await sb.rpc('submission_assign_staff_multi',{p_submission_id:id,p_assignee_user_ids:ids,p_note:$('layerAssignNote')?.value?.trim()||null});if(error){msg.textContent=error.message;return}$('layerAssignModal')?.remove();await refreshWorkflowSurface()};
async function askAction(id,fn,approve,promptText){
 const note=prompt(promptText||'Catatan (opsional):')||'';
 if(!approve&&!note.trim()){alert('Catatan wajib diisi jika mengembalikan/menolak.');return}
 const {error}=await sb.rpc(fn,{p_submission_id:id,p_approve:approve,p_note:note.trim()||null});if(error){alert(error.message);return}await refreshWorkflowSurface();
}
window.layerStaffVerify=(id,ok)=>askAction(id,'submission_staff_verify',ok,ok?'Catatan hasil verifikasi (opsional):':'Tuliskan kekurangan/perbaikan yang harus dilakukan GTK:');
window.layerCoordinatorApprove=(id,ok)=>askAction(id,'submission_coordinator_approve',ok,ok?'Catatan approval Kasi/Subkoor (opsional):':'Alasan dikembalikan ke staf/admin:');
window.layerKabidApprove=(id,ok)=>askAction(id,'submission_kabid_approve',ok,ok?'Catatan persetujuan Kabid (opsional):':'Arahan Kabid untuk peninjauan kembali:');
window.layerOpenFiltered=async st=>{if(!currentData)currentData=await fetchWorkflowData();const rows=visibleRows(currentData).filter(x=>x.workflow_state===st);openDetailModal(STATE_LABEL[st]||st,rows,currentData,false)};
function openDetailModal(title,rows,d,leadership=false){
 let m=$('layerDetailModal');m?.remove();m=document.createElement('div');m.id='layerDetailModal';m.className='lwf-modal';m.onclick=e=>{if(e.target===m)m.remove()};
 const {names}=maps(d);
 m.innerHTML=`<div class="lwf-box"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><div class="label">RINCIAN</div><h3 style="margin:3px 0">${esc(title)}</h3><div class="small">${rows.length} usulan</div></div><button class="btn soft" onclick="document.getElementById('layerDetailModal')?.remove()">✕</button></div><div style="height:10px"></div><div class="tablewrap"><table><thead><tr><th>Pemohon</th><th>Layanan</th><th>Jenjang</th><th>Tahap</th>${leadership?'<th>Arahan</th>':''}</tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(names.get(s.user_id)||'-')}</b><div class="small">${esc(s.title||'')}</div></td><td>${esc(labelService(s.service_type))}</td><td>${esc(SCOPE_LABEL[s.scope_level]||s.scope_level||'-')}</td><td>${statePill(s.workflow_state)}</td>${leadership?`<td><button class="btn primary" onclick="openLeadershipDirection('${s.id}',decodeURIComponent('${encodeURIComponent(s.title||labelService(s.service_type))}'))">💬 Beri Arahan</button></td>`:''}</tr>`).join('')}</tbody></table></div></div>`;document.body.appendChild(m);
}
let leaderCache=null;
async function fetchLeaderData(){
 const [w,d]=await Promise.all([fetchWorkflowData(),sb.from('leadership_directions').select('*').order('created_at',{ascending:false}).limit(1000)]);
 if(d.error)throw d.error;return{...w,dirs:d.data||[]};
}
async function renderLeaderDirections(){
 const body=$('leadershipDirectionsBody');if(!body)return;
 body.innerHTML='<div class="card empty">Memuat agregat arahan pimpinan...</div>';
 try{
  const d=await fetchLeaderData();leaderCache=d;
  const states=['MENUNGGU_DISPOSISI_KOORDINATOR','VERIFIKASI_STAF','MENUNGGU_APPROVAL_KOORDINATOR','MENUNGGU_PERSETUJUAN_KABID','MENUNGGU_KONFIRMASI_GTK','PERBAIKAN','SELESAI'];
  const open=d.dirs.filter(x=>x.follow_up_status==='PERLU_DITINDAKLANJUTI').length,work=d.dirs.filter(x=>x.follow_up_status==='DIPROSES').length,done=d.dirs.filter(x=>x.follow_up_status==='SELESAI').length;
  body.innerHTML=`<div class="card" style="margin-bottom:12px">${workflowFlow()}<div class="info"><b>Mode Pimpinan:</b> nama GTK dan rincian usulan tidak ditampilkan di layar utama. Klik agregat untuk membuka rinciannya, lalu beri komentar/petunjuk/arahan bila diperlukan.</div></div><div class="lwf-grid" style="margin-bottom:12px">${states.map(st=>`<div class="lwf-metric" onclick="leaderDirectionDrill('workflow','${st}')"><div class="label">${esc(STATE_LABEL[st])}</div><div class="lwf-num">${d.subs.filter(x=>x.workflow_state===st).length}</div><div class="small">Klik untuk rincian</div></div>`).join('')}</div><div class="lwf-grid"><div class="lwf-metric" onclick="leaderDirectionDrill('direction','PERLU_DITINDAKLANJUTI')"><div class="label">Arahan Perlu Ditindaklanjuti</div><div class="lwf-num">${open}</div></div><div class="lwf-metric" onclick="leaderDirectionDrill('direction','DIPROSES')"><div class="label">Arahan Diproses</div><div class="lwf-num">${work}</div></div><div class="lwf-metric" onclick="leaderDirectionDrill('direction','SELESAI')"><div class="label">Arahan Selesai</div><div class="lwf-num">${done}</div></div><div class="lwf-metric" onclick="leaderDirectionDrill('workflow','ALL')"><div class="label">Seluruh Layanan</div><div class="lwf-num">${d.subs.length}</div><div class="small">Klik untuk melihat seluruh GTK</div></div></div>`;
 }catch(e){body.innerHTML=`<div class="card err">${esc(e?.message||e)}</div>`}
}
window.leaderDirectionDrill=async(kind,val)=>{
 if(!leaderCache)leaderCache=await fetchLeaderData();let rows=leaderCache.subs,title='';
 if(kind==='workflow'){if(val!=='ALL')rows=rows.filter(x=>x.workflow_state===val);title=val==='ALL'?'Seluruh Layanan':STATE_LABEL[val]||val}
 else{const ids=new Set(leaderCache.dirs.filter(x=>x.follow_up_status===val).map(x=>x.submission_id));rows=rows.filter(x=>ids.has(x.id));title='Arahan '+(val==='PERLU_DITINDAKLANJUTI'?'Perlu Ditindaklanjuti':val==='DIPROSES'?'Diproses':'Selesai')}
 openDetailModal(title,rows,leaderCache,true);
};
const oldLead=window.loadLeadershipDirections;
if(typeof oldLead==='function')window.loadLeadershipDirections=async function(force=false){if(LEADERS.has(role()))return renderLeaderDirections();return oldLead(force)};
const priorShow=window.showTab;
window.showTab=async function(id){
 if(id==='services'&&COORDS.has(role())){
  activateCoordinatorServicesTab();
  await renderCoordinatorServices();
  return;
 }
 const r=await priorShow.apply(this,arguments);
 if(id==='monitoring')await renderMonitoring();
 if(id==='leadershipDirections'&&LEADERS.has(role()))await renderLeaderDirections();
 return r;
};
style();
window.__simantabLayeredWorkflow={version:7,states:STATE_LABEL,renderMonitoring,renderLeaderDirections,renderCoordinatorServices,coordinatorAggregateOnly:true};
})();