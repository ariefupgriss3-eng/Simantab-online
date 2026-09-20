/* SIMANTAB_STAFF_MINIMAL_NAV_V1 */
/* SIMANTAB_STAFF_MINIMAL_NAV_V2 */
/* SIMANTAB_STAFF_MINIMAL_NAV_V3 */
/* SIMANTAB_STAFF_MINIMAL_NAV_V4 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabProfile||!window.showTab);i++)await wait(50);
const p=()=>window.__simantabProfile||{},role=()=>String(p().role||'');
const isStaffAdmin=()=>role().startsWith('STAFF_')||role().startsWith('ADMIN_');
if(!isStaffAdmin())return;
const $=id=>document.getElementById(id);
const ITEMS=[
 ['activities','📅','Kegiatan Bidang'],
 ['monitoring','📊','Monitoring'],
 ['profile','♙','Profil'],
 ['services','☑','Layanan Kepegawaian'],
 ['notifications','🔔','Notifikasi'],
 ['team','👥','Tim Ketenagaan']
];
const ALLOWED=new Set(ITEMS.map(x=>x[0]));
const INTERNAL_ALLOWED=new Set(['tpg','newSubmission']);
let pruning=false;
function makeButton([id,ico,label]){
 const b=document.createElement('button');
 b.className='navbtn';b.dataset.tab=id;
 b.innerHTML='<span class="ico">'+ico+'</span>'+label;
 b.onclick=()=>window.showTab?.(id);
 return b;
}
function navIsCorrect(nav){
 const buttons=[...nav.querySelectorAll('.navbtn[data-tab]')];
 const visible=buttons.filter(b=>b.style.display!=='none').map(b=>b.dataset.tab);
 const hiddenTpg=buttons.some(b=>b.dataset.tab==='tpg'&&b.style.display==='none');
 return visible.length===ITEMS.length&&visible.every((id,i)=>id===ITEMS[i][0])&&hiddenTpg;
}
function pruneNav(){
 if(pruning)return;
 const nav=$('nav');if(!nav||navIsCorrect(nav))return;
 pruning=true;
 try{
   const existing=new Map([...nav.querySelectorAll('.navbtn[data-tab]')].map(b=>[b.dataset.tab,b]));
   const frag=document.createDocumentFragment();
   const head=document.createElement('div');head.className='navhead';head.textContent='MENU STAF / ADMIN';frag.appendChild(head);
   for(const item of ITEMS){
     const b=existing.get(item[0])||makeButton(item);
     b.style.display='';
     const ico=b.querySelector('.ico');if(ico)ico.textContent=item[1];
     for(const n of [...b.childNodes])if(n.nodeType===Node.TEXT_NODE)n.remove();
     b.appendChild(document.createTextNode(item[2]));
     frag.appendChild(b);
   }
   const bridge=existing.get('tpg')||document.createElement('button');
   bridge.className='navbtn';bridge.dataset.tab='tpg';bridge.style.display='none';
   bridge.innerHTML='<span class="ico">◉</span>TPG / Tamsil';bridge.onclick=()=>window.showTab?.('tpg');
   frag.appendChild(bridge);
   nav.replaceChildren(frag);
 }finally{pruning=false}
}
function normalizeActive(){
 const active=document.querySelector('.section.active')?.id;
 if(!ALLOWED.has(active))window.showTab?.('activities');
}
const priorShow=window.showTab;
window.showTab=async function(id){
 const target=(ALLOWED.has(id)||INTERNAL_ALLOWED.has(id))?id:'activities';
 pruneNav();
 const r=await priorShow.call(this,target);
 pruneNav();
 return r;
};
pruneNav();
for(const ms of [80,250,700])setTimeout(()=>{pruneNav()},ms);
await wait(100);
pruneNav();normalizeActive();
window.__simantabStaffMinimalNav={version:4,allowed:[...ALLOWED],internal:[...INTERNAL_ALLOWED],landing:'activities',observer:false};
})();