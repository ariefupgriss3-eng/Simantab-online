/* SIMANTAB_STAFF_ASSIGNED_SERVICES_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
if(!sb||!window.showTab)return;
const role=()=>String(p().role||'');
const isStaff=()=>role().startsWith('STAFF_')||role().startsWith('ADMIN_');
if(!isStaff())return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
const LABEL={
 KP:'Kenaikan Pangkat',CUTI:'Cuti',PENSIUN:'Pensiun',MUTASI:'Mutasi',KGB:'Kenaikan Gaji Berkala',
 LAINNYA:'Layanan Lainnya',KLARIFIKASI_PAK:'Klarifikasi PAK',E_JABFUNG:'e-Jabfung',
 SKP_KS_PENGAWAS:'SKP KS/Pengawas',PAK_KS_PENGAWAS:'PAK KS/Pengawas',
 DIKLAT_KS_BCKS:'Diklat KS/BCKS',USUL_SK:'Usul Penerbitan SK',TPG_TAMSIL:'TPG/Tamsil'
};
const FLOW={
 MENUNGGU_DISPOSISI_KOORDINATOR:'Menunggu Bagi Tugas',
 VERIFIKASI_STAF:'Verifikasi Admin/Staf',
 MENUNGGU_APPROVAL_KOORDINATOR:'Menunggu Approve Kasi/Subkoor',
 MENUNGGU_PERSETUJUAN_KABID:'Menunggu Persetujuan Kabid',
 PERBAIKAN:'Perlu Perbaikan',SELESAI:'Selesai'
};
function labelService(v){return LABEL[v]||String(v||'-').replaceAll('_',' ')}
function flowPill(v){const bad=v==='PERBAIKAN',done=v==='SELESAI';return '<span style="display:inline-block;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:900;background:'+(done?'#e9f7ef':bad?'#feeceb':'#fff3dd')+';color:'+(done?'#178354':bad?'#b42318':'#955a00')+'">'+esc(FLOW[v]||v||'-')+'</span>'}
async function loadAssigned(){
 const uid=p().id;
 const [aa,legacy]=await Promise.all([
  sb.from('submission_assignees').select('submission_id,user_id,assigned_at,assignment_note,verified_at,verification_result').eq('user_id',uid),
  sb.from('submissions').select('id,user_id,service_type,title,description,status,scope_level,workflow_state,assigned_user_id,assignment_note,submitted_at,updated_at').eq('assigned_user_id',uid).order('submitted_at',{ascending:false})
 ]);
 if(aa.error)throw aa.error;if(legacy.error)throw legacy.error;
 const ids=[...new Set((aa.data||[]).map(x=>x.submission_id))];
 let subs=[];
 if(ids.length){
  const q=await sb.from('submissions').select('id,user_id,service_type,title,description,status,scope_level,workflow_state,assigned_user_id,assignment_note,submitted_at,updated_at').in('id',ids).order('submitted_at',{ascending:false});
  if(q.error)throw q.error;subs=q.data||[];
 }
 const by=new Map(subs.map(x=>[x.id,x]));
 for(const x of legacy.data||[])if(!by.has(x.id))by.set(x.id,x);
 subs=[...by.values()].sort((a,b)=>new Date(b.submitted_at||b.updated_at||0)-new Date(a.submitted_at||a.updated_at||0));
 const uids=[...new Set(subs.map(x=>x.user_id).filter(Boolean))];
 let prof=[];
 if(uids.length){
  const q=await sb.from('profiles').select('id,full_name,unit,position').in('id',uids);
  if(q.error)throw q.error;prof=q.data||[];
 }
 return{subs,profiles:new Map(prof.map(x=>[x.id,x]))};
}
async function renderStaffServices(){
 const body=$('servicesBody');if(!body)return;
 if($('servicesDesc'))$('servicesDesc').textContent='Usulan yang benar-benar ditugaskan kepada akun Anda untuk diverifikasi.';
 body.innerHTML='<div class="card empty">Memuat tugas layanan...</div>';
 try{
  const d=await loadAssigned(),rows=d.subs;
  const active=rows.filter(x=>x.workflow_state==='VERIFIKASI_STAF').length;
  body.innerHTML='<div class="info" style="margin-bottom:12px"><b>Tugas akun ini:</b> '+active+' usulan sedang menunggu verifikasi. Klik <b>Lihat Isi Usulan</b> untuk membaca maksud GTK, catatan penugasan, dan berkas pendukung.</div>'+
  '<div class="card">'+(rows.length?'<div class="tablewrap"><table><thead><tr><th>Waktu</th><th>Pemohon</th><th>Layanan</th><th>Isi / Maksud GTK</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'+
  rows.map(s=>{const u=d.profiles.get(s.user_id)||{};const purpose=s.description||s.title||'-';const actions='<button class="btn soft" onclick="staffOpenSubmissionDetail(\''+s.id+'\')">🔎 Lihat Isi Usulan</button>'+(s.workflow_state==='VERIFIKASI_STAF'?'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn success" onclick="staffVerifyAssigned(\''+s.id+'\',true)">✓ Terverifikasi</button><button class="btn danger" onclick="staffVerifyAssigned(\''+s.id+'\',false)">↺ Perlu Perbaikan</button></div>':'');return '<tr><td>'+fmt(s.submitted_at)+'</td><td><b>'+esc(u.full_name||'-')+'</b><div class="small">'+esc(u.unit||'-')+'</div></td><td>'+esc(labelService(s.service_type))+'</td><td><div style="max-width:360px;white-space:normal"><b>'+esc(s.title||labelService(s.service_type))+'</b><div class="small" style="margin-top:4px">'+esc(purpose)+'</div></div></td><td>'+flowPill(s.workflow_state)+'</td><td>'+actions+'</td></tr>'}).join('')+
  '</tbody></table></div>':'<div class="empty">Belum ada usulan yang ditugaskan kepada akun Anda.</div>')+'</div>';
 }catch(e){body.innerHTML='<div class="card err">'+esc(e.message||e)+'</div>'}
}
window.staffOpenSubmissionDetail=async id=>{
 try{
  const [s,f]=await Promise.all([
   sb.from('submissions').select('id,user_id,service_type,title,description,scope_level,workflow_state,assignment_note,submitted_at').eq('id',id).single(),
   sb.from('submission_files').select('id,storage_path,file_name,file_size,mime_type,requirement_code,created_at').eq('submission_id',id).order('created_at')
  ]);
  if(s.error)throw s.error;if(f.error)throw f.error;
  const sub=s.data;
  const pr=await sb.from('profiles').select('full_name,unit,position').eq('id',sub.user_id).maybeSingle();
  if(pr.error)throw pr.error;
  let m=$('staffSubmissionDetailModal');m?.remove();m=document.createElement('div');m.id='staffSubmissionDetailModal';
  m.style='position:fixed;inset:0;z-index:99999;background:#0b203c99;display:flex;align-items:center;justify-content:center;padding:16px';
  m.onclick=e=>{if(e.target===m)m.remove()};
  const files=(f.data||[]).length?(f.data||[]).map(x=>'<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)"><div><b>'+esc(x.file_name)+'</b><div class="small">'+Math.ceil(Number(x.file_size||0)/1024)+' KB'+(x.requirement_code?' • '+esc(x.requirement_code):'')+'</div></div><button class="btn soft" onclick="staffOpenAssignedFile(\''+encodeURIComponent(x.storage_path)+'\')">Buka</button></div>').join(''):'<div class="empty">Tidak ada berkas pendukung.</div>';
  m.innerHTML='<div class="card" style="width:min(820px,100%);max-height:92vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="label">ISI USULAN GTK</div><h3 style="margin:3px 0">'+esc(sub.title||labelService(sub.service_type))+'</h3><div class="small">'+esc(pr.data?.full_name||'-')+' • '+esc(pr.data?.unit||'-')+'</div></div><button class="btn soft" onclick="document.getElementById(\'staffSubmissionDetailModal\')?.remove()">✕</button></div><div class="info" style="margin-top:12px"><b>Maksud/Keterangan GTK</b><div style="margin-top:6px;white-space:pre-wrap">'+esc(sub.description||'-')+'</div></div><div class="notice" style="margin-top:10px"><b>Catatan penugasan Kasi/Subkoor</b><div style="margin-top:6px;white-space:pre-wrap">'+esc(sub.assignment_note||'-')+'</div></div><div class="small" style="margin:10px 0"><b>Jenjang:</b> '+esc(sub.scope_level||'-')+' • <b>Status:</b> '+esc(FLOW[sub.workflow_state]||sub.workflow_state||'-')+' • <b>Diajukan:</b> '+fmt(sub.submitted_at)+'</div><h3>Berkas Pendukung</h3>'+files+'</div>';
  document.body.appendChild(m);
 }catch(e){alert(e.message||String(e))}
};
window.staffOpenAssignedFile=async encoded=>{const path=decodeURIComponent(encoded);const {data,error}=await sb.storage.from('simantab-documents').createSignedUrl(path,120);if(error)alert(error.message);else window.open(data.signedUrl,'_blank','noopener')};
window.staffVerifyAssigned=async(id,ok)=>{
 const note=prompt(ok?'Catatan hasil verifikasi (opsional):':'Tuliskan kekurangan/perbaikan yang harus dilakukan GTK:')||'';
 if(!ok&&!note.trim()){alert('Catatan wajib diisi jika mengembalikan untuk perbaikan.');return}
 const {error}=await sb.rpc('submission_staff_verify',{p_submission_id:id,p_approve:ok,p_note:note.trim()||null});
 if(error){alert(error.message);return}
 await renderStaffServices();
};
const priorShow=window.showTab;
window.showTab=async function(id){
 const r=await priorShow.apply(this,arguments);
 if(id==='services'&&isStaff())await renderStaffServices();
 return r;
};
if(document.querySelector('#services.active'))await renderStaffServices();
window.__simantabStaffAssignedServices={version:1,assignedOnly:true,showsPurpose:true,showsFiles:true};
})();