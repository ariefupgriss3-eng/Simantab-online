/* SIMANTEB_PENGAWAS_MENU_SCOPE_V1 */
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
const navHtml=()=>'<div class="navhead">Menu Pengawas</div>'+items.map(x=>`<button class="navbtn" data-tab="${x[0]}" onclick="showTab('${x[0]}')"><span class="ico">${x[1]}</span>${x[2]}</button>`).join('');
let patching=false;
function apply(){
 if(profile().role!=='PENGAWAS')return;
 const nav=document.getElementById('nav');if(!nav)return;
 const current=[...nav.querySelectorAll('.navbtn')].map(x=>x.dataset.tab).join(',');
 const wanted=items.map(x=>x[0]).join(',');
 if(current!==wanted){patching=true;nav.innerHTML=navHtml();patching=false}
 const title=document.getElementById('dashTitle');if(title&&document.getElementById('dashboard')?.classList.contains('active'))title.textContent='Dashboard Sekolah Binaan';
 const desc=document.getElementById('dashDesc');if(desc&&document.getElementById('dashboard')?.classList.contains('active'))desc.textContent='Ringkasan sekolah binaan dan layanan ketenagaan sesuai penugasan Pengawas.';
 const discipline=document.querySelector('#discipline .head h2');if(discipline)discipline.textContent='Disiplin & Perceraian';
}
const prevShow=window.showTab;
window.showTab=async id=>{
 if(profile().role==='PENGAWAS'&&!ALLOWED.has(id))id='dashboard';
 const result=await prevShow(id);
 apply();
 document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));
 return result;
};
const obs=new MutationObserver(()=>{if(!patching)apply()});
obs.observe(document.documentElement,{childList:true,subtree:true});
apply();
window.__simantebPengawasMenu={allowed:[...ALLOWED],labels:items.map(x=>x[2])};
})();