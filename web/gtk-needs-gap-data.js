/* SIMANTAB_GTK_NEEDS_GAP_DATA_V1 */
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
 if(card)return {card,isNew:false};
 const gapCard=gapRiilCard(grid);if(!gapCard)return {card:null,isNew:false};
 card=document.createElement('div');
 card.className='sim-needs-metric';
 card.dataset.simGapData='1';
 card.innerHTML='<span>Gap Data</span><b>…</b><div class="sim-needs-note">ABK dikurangi ASN & Non-ASN</div>';
 gapCard.insertAdjacentElement('afterend',card);
 return {card,isNew:true};
}

async function loadGapData(){
 const client=window.__simantabSb;if(!client)throw new Error('Koneksi data belum siap.');
 const {data,error}=await client.from('school_gtk_needs').select('abk,pns,pppk,pppk_pw,non_asn_before_2024,non_asn_after_2024');
 if(error)throw error;
 return (data||[]).reduce((sum,r)=>sum+(num(r.abk)-(num(r.pns)+num(r.pppk)+num(r.pppk_pw))-(num(r.non_asn_before_2024)+num(r.non_asn_after_2024))),0);
}

async function sync(){
 scheduled=false;ensureStyle();
 const grid=dashboardGrid();if(!grid)return;
 const {card,isNew}=ensureCard(grid);if(!card)return;
 const valueEl=card.querySelector('b');
 if(lastValue!==null&&valueEl&&valueEl.textContent!==String(lastValue))valueEl.textContent=String(lastValue);
 if(!isNew||busy)return;
 busy=true;
 try{
  const value=await loadGapData();lastValue=value;
  if(card.isConnected&&valueEl&&valueEl.textContent!==String(value))valueEl.textContent=String(value);
 }catch(error){
  console.error('GTK needs Gap Data dashboard',error);
  if(card.isConnected&&valueEl)valueEl.textContent='—';
  const note=card.querySelector('.sim-needs-note');if(note)note.textContent='Gap Data belum dapat dimuat';
 }finally{busy=false}
}

function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>void sync())}
const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('input',e=>{if(e.target?.closest?.('#simNeedsEditor'))schedule()},true);
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="needs"],#simNeedsSave,#simNeedsSubmit'))setTimeout(()=>{lastValue=null;schedule()},250)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
window.__simantabGtkNeedsGapData={version:1,position:'right-of-gap-riil'};
})();
