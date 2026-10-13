/* SIMANTAB_PENGAWAS_MENU_SCOPE_V4_SERVICE_CATALOG */
/* Hanya dua kelompok menu. Korwil/Pengawas SMP mendapat tab sensitif
   jika grant database aktif, jenjang cocok, dan akun dinyatakan sah. */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Login is asynchronous and may happen long after initial page load.
 // Await an explicit post-authentication event rather than timing out after 10 seconds.
await new Promise(resolve=>{
 const event='simantab:profile-ready';
 const check=()=>{
  if(!window.__simantabSb||typeof window.showTab!=='function'||!window.__simantabProfile?.role)return;
  window.removeEventListener(event,check);
  resolve();
 };
 window.addEventListener(event,check);
 check();
});
const profile=()=>window.__simantabProfile||{};
const sb=window.__simantabSb;
if(!sb||profile().role!=='PENGAWAS')return;
const BASE=[
 ['dashboard','▦','Dashboard Sekolah Binaan'],
 ['attendance','✍️','Daftar Hadir Kegiatan'],
 ['profile','♙','Profil'],
 ['services','☑','Layanan Kepegawaian'],
 ['monitoring','◫','Monitoring'],
 ['notifications','🔔','Notifikasi'],
 ['needs','◎','Kebutuhan Riil GTK'],
 ['promotion','★','Usul Promosi KSPS'],
 ['gtkRedistributionAnalysis','⇄','Analisis Redistribusi'],
 ['tpg','◉','TPG / Tamsil'],
 ['status','⌛','Status Usulan'],
 ['docs','▣','Dokumen Saya']
];
const SENSITIVE=['discipline','⚖','Disiplin & Perceraian'];

const STAFFING_SERVICES=[
 ['KP','📈','Kenaikan Pangkat','Pengajuan KP dan pemeriksaan persyaratan sesuai SOP.'],
 ['E_JABFUNG','🧭','Kenaikan Jenjang Jabfung','Usul SK kenaikan jenjang Jabatan Fungsional.'],
 ['KLARIFIKASI_PAK','🧾','Klarifikasi PAK','Klarifikasi PAK dan dokumen pendukung.'],
 ['KGB','💳','Kenaikan Gaji Berkala','Layanan administrasi KGB.'],
 ['CUTI','🗓️','Cuti','Permohonan dan konsultasi cuti.'],
 ['PENSIUN','🏁','Pensiun / Pemberhentian','Pengajuan administrasi pensiun dan pemberhentian.'],
 ['MUTASI','🔄','Mutasi','Pengusulan atau konsultasi mutasi.'],
 ['TUGAS_BELAJAR','🎓','Tugas Belajar','Pengusulan administrasi tugas belajar.'],
 ['PENGEMBANGAN_KOMPETENSI','📚','Pengembangan Kompetensi','Diklat, pelatihan, dan kompetensi profesi.'],
 ['SKP_KS_PENGAWAS','✍️','SKP Kepala Sekolah & Pengawas','Layanan SKP dengan dukungan TTE.'],
 ['PAK_KS_PENGAWAS','📑','PAK Kepala Sekolah & Pengawas','Layanan PAK dan dokumen pendukung.'],
 ['LAINNYA','📁','Layanan Kepegawaian Lainnya','Administrasi kepegawaian yang belum tercakup di atas.']
];
const SERVICE_TYPES=new Set(STAFFING_SERVICES.map(s=>s[0]));
const statusLabel=s=>({
 SUBMITTED:'Diajukan',VERIFYING:'Dalam Verifikasi',REVISION:'Perlu Perbaikan',
 APPROVED:'Disetujui',COMPLETED:'Selesai',REJECTED:'Ditolak'
}[s]||s||'Belum diproses');
const fmtDate=v=>{try{return v?new Date(v).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'-'}catch{return'-'}};
async function renderSupervisorServices(){
 if(!isSupervisor())return;
 const body=document.getElementById('servicesBody');
 if(!body)return;
 const desc=document.getElementById('servicesDesc');
 if(desc)desc.textContent='Pilih layanan kepegawaian untuk pengajuan pribadi Pengawas. Dokumen dan proses mengikuti persyaratan masing-masing layanan.';
 const cards=STAFFING_SERVICES.map(([type,ico,name,detail])=>
  '<div class="service"><div class="emoji">'+ico+'</div><h3>'+esc(name)+'</h3><p>'+esc(detail)+'</p>'+
  '<button class="btn soft" type="button" data-supervisor-service="'+esc(type)+'">Ajukan</button></div>').join('');
 body.innerHTML='<div class="card" style="margin-bottom:14px"><h3 style="margin:0 0 7px">Layanan Kepegawaian Pengawas</h3>'+
  '<div class="small">Pilih jenis layanan di bawah ini untuk memulai pengajuan. Hak memantau atau memverifikasi usulan dinas tetap mengikuti penugasan, bukan menu ini.</div></div>'+
  '<div class="servicegrid">'+cards+'</div>'+
  '<div class="card" style="margin-top:16px"><h3 style="margin-top:0">Riwayat Usulan Saya</h3><div id="pengawasOwnSubmissions" class="small">Memuat riwayat...</div></div>';
 body.querySelectorAll('[data-supervisor-service]').forEach(btn=>btn.addEventListener('click',async()=>{
  const type=btn.dataset.supervisorService;
  if(!SERVICE_TYPES.has(type))return;
  const item=STAFFING_SERVICES.find(x=>x[0]===type);
  if(item&&typeof window.openSubmission==='function')await window.openSubmission(item[0],item[2]);
 }));
 const history=document.getElementById('pengawasOwnSubmissions');
 if(!profile().id){history.textContent='Profil akun belum tersedia.';return}
 try{
  const {data,error}=await sb.from('submissions')
   .select('id,service_type,title,status,submitted_at')
   .eq('user_id',profile().id)
   .order('submitted_at',{ascending:false}).limit(15);
  if(error)throw error;
  if(!data?.length){history.textContent='Belum ada usulan yang Anda ajukan. Pilih salah satu layanan di atas.';return}
  history.innerHTML='<div class="tablewrap"><table><thead><tr><th>Tanggal</th><th>Layanan</th><th>Judul</th><th>Status</th></tr></thead><tbody>'+
   data.map(x=>'<tr><td>'+esc(fmtDate(x.submitted_at))+'</td><td>'+esc(x.service_type)+'</td><td>'+esc(x.title)+'</td><td>'+esc(statusLabel(x.status))+'</td></tr>').join('')+
   '</tbody></table></div>';
 }catch(e){
  history.textContent='Riwayat belum dapat dimuat: '+String(e?.message||e);
 }
}

const BASE_ALLOWED=new Set(BASE.map(x=>x[0]));
let grantKind=null;
let grantScope=null;
const isSupervisor=()=>profile().role==='PENGAWAS';
const canDiscipline=()=>!!grantKind;
const rows=()=>{const base=grantKind==='KORWIL'?BASE.map(x=>x[0]==='dashboard'?['dashboard','▦','Dashboard Biddik Kecamatan']:x):BASE;return canDiscipline()?[...base,SENSITIVE]:base;};
const allowed=id=>BASE_ALLOWED.has(id)||id==='newSubmission'||(id==='discipline'&&canDiscipline());
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const navHtml=()=>'<div class="navhead">'+(grantKind==='KORWIL'?'Menu Korwil':grantKind==='PENGAWAS_SMP'?'Menu Pengawas SMP':'Menu Pengawas')+'</div>'+
 rows().map(([tab,ico,name])=>'<button type="button" class="navbtn" data-tab="'+esc(tab)+'" onclick="showTab(\''+tab+'\')"><span class="ico">'+ico+'</span>'+name+'</button>').join('');
function patchNav(){
 if(!isSupervisor())return;
 const sidebar=document.getElementById('sidebar');
 const originalNav=document.getElementById('nav');
 if(!sidebar||!originalNav)return;
 // Legacy integrations still use #nav but cannot change the visible supervisor sidebar.
 // Keeping the legacy nav intact allows other nav observers to settle without fighting.
 originalNav.style.setProperty('display','none','important');
 originalNav.setAttribute('aria-hidden','true');
 let nav=document.getElementById('pengawasStableNav');
 if(!nav){
  nav=document.createElement('div');
  nav.id='pengawasStableNav';
  nav.setAttribute('role','navigation');
  nav.setAttribute('aria-label','Menu khusus Pengawas');
  sidebar.appendChild(nav);
 }
 const tabs=rows().map(x=>x[0]).join(',');
 const present=[...nav.querySelectorAll('.navbtn')].map(x=>x.dataset.tab).join(',');
 const title=nav.querySelector('.navhead')?.textContent||'';
 const expectedTitle=grantKind==='KORWIL'?'Menu Korwil':grantKind==='PENGAWAS_SMP'?'Menu Pengawas SMP':'Menu Pengawas';
 if(present!==tabs||nav.querySelectorAll('.navhead').length!==1||title!==expectedTitle){
  nav.innerHTML=navHtml();
 }
 const activeId=[...document.querySelectorAll('main .section.active')].map(x=>x.id)[0]||'dashboard';
 nav.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeId));
}
function patchLabels(){
 if(!isSupervisor())return;
 const dash=document.getElementById('dashboard');
 if(dash?.classList.contains('active')){
  const title=document.getElementById('dashTitle');
  const expectedTitle=grantKind==='KORWIL'?'Dashboard Biddik Kecamatan':'Dashboard Sekolah Binaan';
  if(title&&title.textContent!==expectedTitle)title.textContent=expectedTitle;
  const desc=document.getElementById('dashDesc');
  const text=grantKind==='KORWIL'?'Ringkasan TK, SD, dan PNF se-kecamatan penugasan Korwil.':'Ringkasan sekolah dalam Dabin aktif Pengawas.';
  if(desc&&desc.textContent!==text)desc.textContent=text;
 }
 const discipline=document.querySelector('#discipline .head h2');
 if(discipline&&discipline.textContent!=='Disiplin & Perceraian')discipline.textContent='Disiplin & Perceraian';
 const promo=document.querySelector('#promotion .head h2');
 if(promo&&promo.textContent!=='Usul Promosi KSPS')promo.textContent='Usul Promosi KSPS';
}
function apply(){patchNav();patchLabels()}
async function loadSensitivePermission(){
 // SQL RLS discipline_submitter_read_own: hanya membaca grant milik sendiri.
 // Fallback aman: bila query gagal, menu sensitif tetap disembunyikan.
 grantKind=null;grantScope=null;
 const p=profile();
 if(!p.id||!p.is_active||p.approval_status!=='APPROVED'||p.account_channel!=='DINAS')return;
 const {data,error}=await sb.from('discipline_submitter_grants')
  .select('submitter_kind,scope_level,is_active')
  .eq('user_id',p.id).eq('is_active',true);
 if(error){console.warn('Menu pengusul disiplin belum dapat diverifikasi.',error.message);return}
 const pos=String(p.position||'').trim().toUpperCase();
 const grant=(data||[]).find(g=>
  (g.submitter_kind==='KORWIL'&&g.scope_level==='SD'&&pos==='PENGAWAS SD')||
  (g.submitter_kind==='PENGAWAS_SMP'&&g.scope_level==='SMP'&&pos==='PENGAWAS SMP'));
 if(grant){grantKind=grant.submitter_kind;grantScope=grant.scope_level}
}
const prevShow=window.showTab;
window.showTab=async function(id){
 if(isSupervisor()&&!allowed(id))id='dashboard';
 if(isSupervisor()&&id==='gtkRedistributionAnalysis'){
  if(typeof window.openGtkRedistributionAnalysis==='function'){
   window.openGtkRedistributionAnalysis();
   apply();
   return;
  }
  for(let i=0;i<30&&typeof window.openGtkRedistributionAnalysis!=='function';i++)await wait(50);
  if(typeof window.openGtkRedistributionAnalysis==='function'){
   window.openGtkRedistributionAnalysis();
   apply();
   return;
  }
  id='dashboard';
 }
 let result;
 try{
  result=await prevShow.call(this,id);
 }catch(e){
  if(id!=='services')throw e;
  console.warn('Antrean dinas tidak relevan bagi layanan pribadi Pengawas.',e);
 }
 if(isSupervisor()&&id==='services')await renderSupervisorServices();
 apply();
 return result;
};
const prevRefresh=window.refreshAll;
if(typeof prevRefresh==='function')window.refreshAll=async function(...args){
 const result=await prevRefresh.apply(this,args);
 if(isSupervisor()&&document.getElementById('services')?.classList.contains('active'))await renderSupervisorServices();
 apply();
 return result;
};
apply();
await loadSensitivePermission();
apply();
// Restore the legacy sidebar if this tab later authenticates as another role.
window.addEventListener('simantab:profile-ready',()=>{
 if(!isSupervisor()){
  document.getElementById('pengawasStableNav')?.remove();
  const old=document.getElementById('nav');
  old?.style.removeProperty('display');
  old?.removeAttribute('aria-hidden');
  return;
 }
 apply();
 loadSensitivePermission().then(apply).catch(e=>console.warn('Izin Pengawas tidak dapat dimuat:',e));
});
// The stable sidebar has no competing MutationObservers.
 // Active state is updated on showTab/refresh and the grant check above.
for(const ms of [100,300,700,1500,3000])setTimeout(apply,ms);
window.__simantebPengawasMenu={
 version:4,
 get allowed(){return rows().map(x=>x[0])},
 get labels(){return rows().map(x=>x[2])},
 get sensitivePermission(){return grantKind?{kind:grantKind,scope:grantScope}:null},
 domObserver:false,
 isolatedNavigation:true
};
})();
