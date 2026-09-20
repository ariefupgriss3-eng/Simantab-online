/* SIMANTAB_SERVICE_ACCESS_POLICY_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabProfile||!window.showTab);i++)await wait(50);

const p=()=>window.__simantabProfile||{};
const role=()=>String(p().role||'').toUpperCase();
const TPG_ROLES=new Set(['STAFF_TPG','ADMIN_TPG','STAFF_TPG_TAMSIL','ADMIN_TPG_TAMSIL']);
const PENSION_ROLES=new Set(['STAFF_PENSIUN','ADMIN_PENSIUN']);
const canTpg=()=>TPG_ROLES.has(role());
const canPension=()=>PENSION_ROLES.has(role());

function ensureStyle(){
 if(document.getElementById('simantabServiceAccessPolicyStyle'))return;
 const s=document.createElement('style');
 s.id='simantabServiceAccessPolicyStyle';
 s.textContent='#pensionNavBtn{display:none!important}';
 document.head.appendChild(s);
}

function removeServiceTiles(root,matcher,keepId){
 if(!root)return;
 root.querySelectorAll('.service').forEach(el=>{
   if(keepId&&el.closest('#'+keepId))return;
   if(matcher(el))el.remove();
 });
}

function applyTpgPolicy(){
 const body=document.getElementById('servicesBody');
 const nav=document.querySelector('#nav .navbtn[data-tab="tpg"]');
 if(nav)nav.style.display='none';

 // The authoritative TPG/Tamsil entry is the dedicated card inside Layanan Kepegawaian.
 // Generic/legacy tiles are removed to avoid duplicate or leaked access.
 removeServiceTiles(body,el=>/TPG\s*\/\s*Tamsil|TPG|Tamsil/i.test(el.textContent||''),'tpgInsideServices');

 const card=document.getElementById('tpgInsideServices');
 if(!canTpg())card?.remove();
}

function applyPensionPolicy(){
 const body=document.getElementById('servicesBody');
 // Proses Pensiun must not be a top-level navigation item.
 const nav=document.getElementById('pensionNavBtn');
 if(nav)nav.style.display='none';

 // Remove any generic pension tile; the only approved entry is the internal shortcut
 // created inside Layanan Kepegawaian for the pension service account.
 removeServiceTiles(body,el=>/Pensiun/i.test(el.textContent||''));

 const shortcut=document.getElementById('pensionDinasShortcut');
 if(!canPension())shortcut?.remove();

 if(!canPension()){
   document.querySelectorAll('.pension-process-btn').forEach(x=>x.remove());
   document.getElementById('ownerPensionPanel')?.remove();
 }
}

function applyPolicy(){
 ensureStyle();
 applyTpgPolicy();
 applyPensionPolicy();
}

const previousShow=window.showTab;
window.showTab=async function(id){
 let target=id;
 if(id==='tpg'&&!canTpg())target='services';
 const r=await previousShow.call(this,target);
 await wait(40);
 applyPolicy();
 return r;
};

function guardGlobal(name,allowed){
 const original=window[name];
 if(typeof original!=='function')return;
 window[name]=async function(...args){
   if(!allowed()){
     await window.showTab?.('services');
     return;
   }
   const result=await original.apply(this,args);
   await wait(20);
   applyPolicy();
   return result;
 };
}

guardGlobal('__openPensionHub',canPension);
guardGlobal('__showPensionChecklist',canPension);
guardGlobal('__openPensionLetterForm',canPension);
guardGlobal('__submitPensionLetter',canPension);
guardGlobal('__openPensionProcess',canPension);
guardGlobal('__savePensionOutputs',canPension);
guardGlobal('__setPensionStatus',canPension);

applyPolicy();
for(const ms of [100,350,900])setTimeout(applyPolicy,ms);

const active=document.querySelector('.section.active')?.id;
if(active==='tpg'&&!canTpg())await window.showTab('services');
if(active==='newSubmission'&&!canPension()&&/pensiun/i.test(document.getElementById('newSubmission')?.textContent||''))await window.showTab('services');

window.__simantabServiceAccessPolicy={
 version:1,
 tpgRoles:[...TPG_ROLES],
 pensionRoles:[...PENSION_ROLES],
 tpgLocation:'services-only',
 pensionLocation:'services-only'
};
})();