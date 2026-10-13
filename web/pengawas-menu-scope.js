/* SIMANTAB_PENGAWAS_MENU_SCOPE_V3_GRANT_GATED */
/* Hanya dua kelompok menu. Korwil/Pengawas SMP mendapat tab sensitif
   jika grant database aktif, jenjang cocok, dan akun dinyatakan sah. */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabProfile||!window.showTab||!window.__simantabSb);i++)await wait(50);
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
const BASE_ALLOWED=new Set(BASE.map(x=>x[0]));
let grantKind=null;
let grantScope=null;
const isSupervisor=()=>profile().role==='PENGAWAS';
const canDiscipline=()=>!!grantKind;
const rows=()=>canDiscipline()?[...BASE,SENSITIVE]:BASE;
const allowed=id=>BASE_ALLOWED.has(id)||(id==='discipline'&&canDiscipline());
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const navHtml=()=>'<div class="navhead">'+(grantKind==='KORWIL'?'Menu Korwil':grantKind==='PENGAWAS_SMP'?'Menu Pengawas SMP':'Menu Pengawas')+'</div>'+
 rows().map(([tab,ico,name])=>'<button type="button" class="navbtn" data-tab="'+esc(tab)+'" onclick="showTab(\''+tab+'\')"><span class="ico">'+ico+'</span>'+name+'</button>').join('');
function patchNav(){
 if(!isSupervisor())return;
 const nav=document.getElementById('nav');if(!nav)return;
 const tabs=rows().map(x=>x[0]).join(',');
 const present=[...nav.querySelectorAll('.navbtn')].map(x=>x.dataset.tab).join(',');
 const title=nav.querySelector('.navhead')?.textContent||'';
 const expectedTitle=grantKind==='KORWIL'?'Menu Korwil':grantKind==='PENGAWAS_SMP'?'Menu Pengawas SMP':'Menu Pengawas';
 if(present!==tabs||nav.querySelectorAll('.navhead').length!==1||title!==expectedTitle){
  nav.innerHTML=navHtml();
 }
 const activeId=[...document.querySelectorAll('main .section.active')].map(s=>s.id)[0]||'dashboard';
 nav.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeId));
}
function patchLabels(){
 if(!isSupervisor())return;
 const dash=document.getElementById('dashboard');
 if(dash?.classList.contains('active')){
  const title=document.getElementById('dashTitle');
  if(title&&title.textContent!=='Dashboard Sekolah Binaan')title.textContent='Dashboard Sekolah Binaan';
  const desc=document.getElementById('dashDesc');
  const text='Ringkasan sekolah binaan dan layanan ketenagaan sesuai penugasan Pengawas.';
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
 const result=await prevShow.call(this,id);
 apply();
 return result;
};
const prevRefresh=window.refreshAll;
if(typeof prevRefresh==='function')window.refreshAll=async function(...args){
 const result=await prevRefresh.apply(this,args);
 apply();
 return result;
};
apply();
await loadSensitivePermission();
apply();
const nav=document.getElementById('nav');
if(nav){
 // Pastikan menu dari modul lain tidak menambah opsi di luar daftar khusus Pengawas.
 const observer=new MutationObserver(()=>{if(isSupervisor())patchNav()});
 observer.observe(nav,{childList:true,subtree:false});
}
for(const ms of [100,300,700,1500,3000])setTimeout(apply,ms);
window.__simantebPengawasMenu={
 version:3,
 get allowed(){return rows().map(x=>x[0])},
 get labels(){return rows().map(x=>x[2])},
 get sensitivePermission(){return grantKind?{kind:grantKind,scope:grantScope}:null},
 domObserver:true
};
})();
