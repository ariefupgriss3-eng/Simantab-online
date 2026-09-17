/* SIMANTAB_GTK_NEEDS_GAP_DATA_V2 */
(()=>{
'use strict';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
let scheduled=false,busy=false,lastValue=null;

function ensureStyle(){
 if(document.getElementById('simGtkNeedsGapDataStyle'))return;
 const st=document.createElement('style');
 st.id='simGtkNeedsGapDataStyle';
 st.textContent=`
 #simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
 #simGtkNeedsProgress .sim-needs-metric[data-sim-gap-data="1"]{border-color:#d7e8f7}
 #simGtkNeedsProgress .sim-needs-metric[data-sim-gap-data="1"] b{color:#0a3568}
 @media(max-width:1100px){#simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
 @media(max-width:760px){#simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
 `;
 document.head.appendChild(st);
}

function dashboardGrid(){
 const grids=[...document.querySelectorAll('#simGtkNeedsProgress .sim-needs-grid')];
 return grids.find(grid=>[...grid.querySelectorAll('.sim-needs-metric span')].some(s=>/gap riil/i.test(String(s.textContent||''))))||null;
}

function gapRiilCard(grid){
 return [...grid.querySelectorAll('.sim-needs-metric')].find(card=>/gap riil/i.test(String(card.querySelector('span')?.textContent||'')))||null;
}

function ensureCard(grid){
 let card=grid.querySelector('.sim-needs-metric[data-sim-gap-data="1"]');
 if(card)return card;
 const gapCard=gapRiilCard(grid);if(!gapCard)return null;
 card=document.createElement('div');
 card.className='sim-needs-metric';
 card.dataset.simGapData='1';
 card.innerHTML='<span>Gap Data</span><b>…</b><div class="sim-needs-note">ABK dikurangi ASN & Non-ASN</div>';
 gapCard.insertAdjacentElement('afterend',card);
 return card;
}

async function loadGapData(){
 const client=window.__simantabSb;if(!client)throw new Error('Koneksi data belum siap.');
 const {data,error}=await client.from('school_gtk_needs').select('gap_data');
 if(error)throw error;
 return (data||[]).reduce((sum,r)=>sum+num(r.gap_data),0);
}

function paint(value,note='ABK dikurangi ASN & Non-ASN'){
 const grid=dashboardGrid();if(!grid)return false;
 const card=ensureCard(grid);if(!card)return false;
 const valueEl=card.querySelector('b');
 if(valueEl)valueEl.textContent=String(value);
 const noteEl=card.querySelector('.sim-needs-note');if(noteEl)noteEl.textContent=note;
 return true;
}

async function sync(force=false){
 scheduled=false;ensureStyle();
 const grid=dashboardGrid();if(!grid)return;
 ensureCard(grid);
 if(lastValue!==null&&!force){paint(lastValue);return}
 if(busy)return;
 busy=true;
 try{
  const value=await loadGapData();
  lastValue=value;
  paint(value);
 }catch(error){
  console.error('GTK needs Gap Data dashboard',error);
  paint('—','Gap Data belum dapat dimuat');
 }finally{
  busy=false;
  if(lastValue!==null)setTimeout(()=>paint(lastValue),0);
 }
}

function schedule(force=false){
 if(force)lastValue=null;
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>void sync(force));
}

const observer=new MutationObserver(()=>{
 const grid=dashboardGrid();
 if(!grid)return;
 const card=grid.querySelector('.sim-needs-metric[data-sim-gap-data="1"]');
 if(!card){schedule(false);return}
 if(lastValue!==null&&card.querySelector('b')?.textContent!==String(lastValue))paint(lastValue);
});
observer.observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener('input',e=>{if(e.target?.closest?.('#simNeedsEditor'))schedule(true)},true);
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="needs"],#simNeedsSave,#simNeedsSubmit'))setTimeout(()=>schedule(true),350)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(true),{once:true});else schedule(true);
window.__simantabGtkNeedsGapData={version:2,position:'right-of-gap-riil',source:'gap_data'};
})();
