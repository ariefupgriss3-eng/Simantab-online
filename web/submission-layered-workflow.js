/* SIMANTAB_LAYERED_SERVICE_WORKFLOW_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<600&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const p=()=>window.__simantabProfile||{},role=()=>String(p().role||'');
const LEADERS=new Set(['KEPALA_DINAS','SEKRETARIS_DINAS']);
const COORDS=new Set(['KASI_SD','KASI_SMP','SUBKOOR_TK']);
const STATE_LABEL={
 DRAFT:'Draft',
 MENUNGGU_DISPOSISI_KOORDINATOR:'Menunggu Pembagian Tugas',
 VERIFIKASI_STAF:'Verifikasi Staf/Admin',
 MENUNGGU_APPROVAL_KOORDINATOR:'Menunggu Approval Kasi/Subkoor',
 MENUNGGU_PERSETUJUAN_KABID:'Menunggu Persetujuan Kabid',
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
.lwf-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.lwf-metric{border:1px solid var(--line);border-radius:14px;background:#fff;padding:12px;cursor:pointer}.lwf-metric:hover{box-shadow:0 6px 18px #16395d18}.lwf-num{font-size:26px;font-weight:950;color:var(--navy)}.lwf-flow{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-bottom:12px}.lwf-flow>div{padding:10px;border:1px solid var(--line);border-radius:12px;background:#f8fbff;text-align:center;font-size:10px}.lwf-flow b{display:block;color:var(--navy);font-size:11px}.lwf-actions{display:flex;gap:6px;flex-wrap:wrap}.lwf-modal{position:fixed;inset:0;z-index:99999;background:#0b203c99;display:flex;align-items:center;justify-content:center;padding:16px}.lwf-box{width:min(1080px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:16px}.lwf-badge{display:inline-block;padding:4px 7px;border-radius:999px;background:#edf5ff;color:#175ea7;font-size:9px;font-weight:900}.lwf-done{background:#e9f7ef;color:#178354}.lwf-warn{background:#fff3dd;color:#955a00}.lwf-bad{background:#feeceb;color:#b42318}.lwf-step{font-size:10px;color:var(--muted);line-height:1.45}.lwf-click{cursor:pointer;text-decoration:underline;text-decoration-style:dotted}@media(max-width:900px){.lwf-grid{grid-template-columns:repeat(2,1fr)}.lwf-flow{grid-template-columns:1fr}.lwf-actions{display:block}.lwf-actions button{margin:3px 0}}`;document.head.appendChild(s)}
async function fetchWorkflowData(){
 const [s,u,t]=await Promise.all([
  sb.from('submissions').select('id,user_id,service_type,title,status,scope_level,coordinator_role,assigned_role,workflow_state,assigned_user_id,assigned_by,assigned_at,assignment_note,staff_verified_by,staff_verified_at,staff_verification_note,coordinator_approved_by,coordinator_approved_at,coordinator_approval_note,kabid_approved_by,kabid_approved_at,kabid_approval_note,workflow_completed_at,submitted_at,updated_at').order('submitted_at',{ascending:false}).limit(1000),
  sb.from('profiles').select('id,full_name,role,account_channel,unit,position,is_active').order('full_name'),
  sb.from('team_task_assignments').select('user_id,capability,is_active').eq('is_active',true)
 ]);
 const e=s.error||u.error||t.error;if(e)throw e;
 return{subs:s.data||[],profiles:u.data||[],tasks:t.data||[]};
}
function maps(d){return{names:new Map(d.profiles.map(x=>[x.id,x.full_name||'-'])),prof:new Map(d.profiles.map(x=>[x.id,x]))}}
function labelService(s){return SERVICE_LABEL[s]||s||'-'}
function statePill(s){const cls=s==='SELESAI'?'lwf-done':s==='PERBAIKAN'?'lwf-bad':'lwf-warn';return `<span class="lwf-badge ${cls}">${esc(STATE_LABEL[s]||s||'-')}</span>`}
function visibleRows(d){
 const r=role(),uid=p().id;
 if(r==='SUPER_ADMIN'||r==='KABID')return d.subs;
 if(COORDS.has(r))return d.subs.filter(x=>x.coordinator_role===r);
 if(LEADERS.has(r))return d.subs;
 return d.subs.filter(x=>x.assigned_user_id===uid);
}
function candidateStaff(d,sub){
 const taskMap=new Map;
 for(const t of d.tasks){if(!taskMap.has(t.user_id))taskMap.set(t.user_id,new Set);taskMap.get(t.user_id).add(t.capability)}
 let arr=d.profiles.filter(x=>x.is_active&&x.account_channel==='DINAS'&&!['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','PENGAWAS','KORWIL'].includes(x.role));
 if(sub.assigned_role==='ADMIN_KSPS')arr=arr.filter(x=>taskMap.get(x.id)?.has('ADMIN_KSPS'));
 arr.sort((a,b)=>{
  const ar=a.role===sub.assigned_role?0:1,br=b.role===sub.assigned_role?0:1;
  return ar-br||String(a.full_name).localeCompare(String(b.full_name),'id');
 });
 return arr;
}
function actionHtml(s,d){
 const r=role(),uid=p().id;
 if((r==='SUPER_ADMIN'||r===s.coordinator_role)&&s.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR')
   return `<button class="btn primary" onclick="layerOpenAssign('${s.id}')">👤 Bagi Tugas</button>`;
 if((r==='SUPER_ADMIN'||s.assigned_user_id===uid)&&s.workflow_state==='VERIFIKASI_STAF')
   return `<button class="btn success" onclick="layerStaffVerify('${s.id}',true)">✓ Terverifikasi</button><button class="btn danger" onclick="layerStaffVerify('${s.id}',false)">↺ Perbaikan</button>`;
 if((r==='SUPER_ADMIN'||r===s.coordinator_role)&&s.workflow_state==='MENUNGGU_APPROVAL_KOORDINATOR')
   return `<button class="btn success" onclick="layerCoordinatorApprove('${s.id}',true)">✓ Approve</button><button class="btn danger" onclick="layerCoordinatorApprove('${s.id}',false)">↺ Kembalikan</button>`;
 if((r==='SUPER_ADMIN'||r==='KABID')&&s.workflow_state==='MENUNGGU_PERSETUJUAN_KABID')
   return `<button class="btn success" onclick="layerKabidApprove('${s.id}',true)">✓ Setujui</button><button class="btn danger" onclick="layerKabidApprove('${s.id}',false)">↺ Kembalikan</button>`;
 return '<span class="small">Monitoring</span>';
}
let currentData=null;
function aggregateHtml(rows){
 const states=['MENUNGGU_DISPOSISI_KOORDINATOR','VERIFIKASI_STAF','MENUNGGU_APPROVAL_KOORDINATOR','MENUNGGU_PERSETUJUAN_KABID','PERBAIKAN','SELESAI'];
 return `<div class="lwf-grid">${states.map(st=>{const n=rows.filter(x=>x.workflow_state===st).length;return `<div class="lwf-metric" onclick="layerOpenFiltered('${st}')"><div class="label">${esc(STATE_LABEL[st])}</div><div class="lwf-num">${n}</div><div class="small">Klik untuk melihat rincian</div></div>`}).join('')}</div>`;
}
function workflowFlow(){return '<div class="lwf-flow"><div><b>1. GTK</b>Ajukan layanan</div><div><b>2. Kasi/Subkoor</b>Bagi tugas staf/admin</div><div><b>3. Staf/Admin</b>Verifikasi</div><div><b>4. Kasi/Subkoor</b>Approve</div><div><b>5. Kabid</b>Setujui → selesai</div></div>'}
function tableHtml(rows,d,withActions=true){
 const {names}=maps(d);
 if(!rows.length)return '<div class="empty">Belum ada data pada tahap ini.</div>';
 return `<div class="tablewrap"><table><thead><tr><th>Pemohon</th><th>Layanan</th><th>Jenjang</th><th>Tahap</th><th>Pelaksana</th><th>Update</th>${withActions?'<th>Aksi</th>':''}</tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(names.get(s.user_id)||'-')}</b><div class="small">${esc(s.title||'')}</div></td><td>${esc(labelService(s.service_type))}</td><td>${esc(SCOPE_LABEL[s.scope_level]||s.scope_level||'-')}</td><td>${statePill(s.workflow_state)}<div class="lwf-step">${esc(s.coordinator_role||'-')}</div></td><td>${esc(s.assigned_user_id?(names.get(s.assigned_user_id)||'-'):'Belum ditugaskan')}</td><td>${fmt(s.updated_at)}</td>${withActions?`<td><div class="lwf-actions">${actionHtml(s,d)}${s.service_type==='DIKLAT_KS_BCKS'?'<button class="btn soft" onclick="showTab(\'diklatKsBcks\')">🎓 Buka Diklat</button>':''}</div></td>`:''}</tr>`).join('')}</tbody></table></div>`;
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
 m.innerHTML=`<div class="lwf-box" style="width:min(620px,100%)"><div style="display:flex;justify-content:space-between;gap:8px"><div><div class="label">PEMBAGIAN TUGAS</div><h3 style="margin:3px 0">${esc(s.title||labelService(s.service_type))}</h3><div class="small">Jenjang ${esc(SCOPE_LABEL[s.scope_level]||s.scope_level)} • rekomendasi ${esc(s.assigned_role||'-')}</div></div><button class="btn soft" onclick="document.getElementById('layerAssignModal')?.remove()">✕</button></div><div class="field"><label>Staf/Admin Verifikator</label><select id="layerAssignee"><option value="">Pilih staf/admin...</option>${cand.map(x=>`<option value="${x.id}">${esc(x.full_name)} — ${esc(x.position||x.role)}</option>`).join('')}</select></div><div class="field"><label>Catatan penugasan (opsional)</label><textarea id="layerAssignNote"></textarea></div><button class="btn primary" onclick="layerSaveAssign('${id}')">Tetapkan Tugas</button><div id="layerAssignMsg" class="small" style="margin-top:7px"></div></div>`;document.body.appendChild(m);
};
window.layerSaveAssign=async id=>{const uid=$('layerAssignee')?.value,msg=$('layerAssignMsg');if(!uid){msg.textContent='Pilih staf/admin terlebih dahulu.';return}msg.textContent='Menyimpan penugasan...';const {error}=await sb.rpc('submission_assign_staff',{p_submission_id:id,p_assignee_user_id:uid,p_note:$('layerAssignNote')?.value?.trim()||null});if(error){msg.textContent=error.message;return}$('layerAssignModal')?.remove();await renderMonitoring()};
async function askAction(id,fn,approve,promptText){
 const note=prompt(promptText||'Catatan (opsional):')||'';
 if(!approve&&!note.trim()){alert('Catatan wajib diisi jika mengembalikan/menolak.');return}
 const {error}=await sb.rpc(fn,{p_submission_id:id,p_approve:approve,p_note:note.trim()||null});if(error){alert(error.message);return}await renderMonitoring();
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
  const states=['MENUNGGU_DISPOSISI_KOORDINATOR','VERIFIKASI_STAF','MENUNGGU_APPROVAL_KOORDINATOR','MENUNGGU_PERSETUJUAN_KABID','PERBAIKAN','SELESAI'];
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
window.showTab=async function(id){const r=await priorShow.apply(this,arguments);if(id==='monitoring')await renderMonitoring();if(id==='leadershipDirections'&&LEADERS.has(role()))await renderLeaderDirections();return r};
style();
window.__simantabLayeredWorkflow={version:1,states:STATE_LABEL,renderMonitoring,renderLeaderDirections};
})();