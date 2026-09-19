/* SIMANTAB_TPG_SERVICE_PLACEMENT_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabProfile||!window.showTab);i++)await wait(50);
const $=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
const role=()=>String(p().role||'');
const isGtk=()=>['GTK','KEPALA_SEKOLAH'].includes(role())||String(p().account_channel||'')==='GTK';
const isDinas=()=>!isGtk();
const isAsnGtk=()=>isGtk()&&/^\d{18}$/.test(String(p().nip||'').replace(/\D/g,''));
function ensureDinasTpgBridge(){
 if(!isDinas())return;
 const nav=$('nav');if(!nav)return;
 let b=nav.querySelector('.navbtn[data-tab="tpg"]');
 if(!b){
   b=document.createElement('button');
   b.className='navbtn';b.dataset.tab='tpg';b.style.display='none';
   b.onclick=()=>window.showTab?.('tpg');
   b.innerHTML='<span class="ico">◉</span>TPG / Tamsil';
   nav.appendChild(b);
 }else b.style.display='none';
}
function serviceCard(){
 const body=$('servicesBody');if(!body)return;
 body.querySelector('#tpgInsideServices')?.remove();
 const shouldShow=isDinas()||isAsnGtk();
 if(!shouldShow)return;
 const card=document.createElement('div');
 card.id='tpgInsideServices';card.className='card';card.style.marginBottom='12px';
 const applicant=isGtk();
 card.innerHTML=`<div class="head" style="margin-bottom:0"><div><div class="label">LAYANAN KEPEGAWAIAN</div><h3 style="margin:4px 0">🎓 TPG / Tamsil</h3><div class="small">${applicant?'Layanan konsultasi TPG/Tamsil untuk GTK ASN (PNS/PPPK).':'Monitoring, konsultasi, verifikasi, dan tindak lanjut layanan TPG/Tamsil.'}</div></div><button class="btn primary" onclick="showTab('tpg')">${applicant?'Buka Layanan TPG/Tamsil':'Buka Modul TPG/Tamsil'}</button></div>`;
 body.prepend(card);
}
function applyNavPlacement(){
 if(isDinas())ensureDinasTpgBridge();
 // GTK and private-school accounts intentionally keep their existing top-level TPG/Tamsil menu.
}
const priorShow=window.showTab;
window.showTab=async function(id){
 applyNavPlacement();
 const r=await priorShow.apply(this,arguments);
 await wait(40);
 applyNavPlacement();
 if(id==='services')serviceCard();
 return r;
};
applyNavPlacement();
if(document.querySelector('#services.active')){await wait(50);serviceCard()}
window.__simantabTpgServicePlacement={version:1,dinasInsideServices:true,asnGtkInsideServices:true,gtkMainMenuPreserved:true,privateSchoolMainMenuPreserved:true};
})();