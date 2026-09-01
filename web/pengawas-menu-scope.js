/* SIMANTEB_PENGAWAS_MENU_SCOPE_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabProfile||!window.showTab);i++)await wait(50);
const profile=()=>window.__simantabProfile||{};
const ALLOWED=new Set(['dashboard','profile','services','monitoring','notifications','needs','promotion','discipline']);
const items=[
 ['dashboard','▦','Dashboard Sekolah Binaan'],
 ['profile','♙','Profil'],
 ['services','☑','Layanan Kepegawaian'],
 ['monitoring','◫','Monitoring'],
 ['notifications','🔔','Notifikasi'],
 ['needs','◎','Kebutuhan Riil GTK'],
 ['promotion','★','Usul Promosi Karir'],
 ['discipline','⚖','Disiplin & Perceraian']
];
const wanted=items.map(x=>x[0]).join(',');
const navHtml=()=>'<div class="navhead">Menu Pengawas</div>'+items.map(x=>`<button class="navbtn" data-tab="${x[0]}" onclick="showTab('${x[0]}')"><span class="ico">${x[1]}</span>${x[2]}</button>`).join('');
function patchNav(){
 if(profile().role!=='PENGAWAS')return;
 const nav=document.getElementById('nav');if(!nav)return;
 const current=[...nav.querySelectorAll('.navbtn')].map(x=>x.dataset.tab).join(',');
 if(current!==wanted)nav.innerHTML=navHtml();
}
function patchLabels(){
 if(profile().role!=='PENGAWAS')return;
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
}
function apply(){patchNav();patchLabels()}
const prevShow=window.showTab;
window.showTab=async id=>{
 if(profile().role==='PENGAWAS'&&!ALLOWED.has(id))id='dashboard';
 const result=await prevShow(id);
 apply();
 document.querySelectorAll('#nav .navbtn').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));
 return result;
};
const prevRefresh=window.refreshAll;
if(prevRefresh)window.refreshAll=async(...args)=>{const result=await prevRefresh(...args);apply();return result};
// Re-apply a few times during initial asynchronous module startup, then stop.
apply();
for(const ms of [100,300,700,1500,3000])setTimeout(apply,ms);
window.__simantebPengawasMenu={version:2,allowed:[...ALLOWED],labels:items.map(x=>x[2]),domObserver:false};
})();