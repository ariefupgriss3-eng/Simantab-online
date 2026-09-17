/* SIMANTAB_GTK_NEEDS_GAP_DATA_V6 */
(()=>{
'use strict';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const CENTRAL_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN','STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN','STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK']);
const REVIEW_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
let busy=false,lastMetrics=null,retryTimer=null,hookTimer=null,reviewRetryTimer=null,reviewObserver=null,reviewTbody=null;

function role(){return String(window.__simantabProfile?.role||'').toUpperCase()}
function isDinas(){return CENTRAL_ROLES.has(role())}
function canReview(){return REVIEW_ROLES.has(role())}

function ensureStyle(){
 if(document.getElementById('simGtkNeedsGapDataStyle'))return;
 const st=document.createElement('style');
 st.id='simGtkNeedsGapDataStyle';
 st.textContent=`
 #simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
 #simGtkNeedsProgress .sim-needs-metric[data-sim-gap-data="1"]{border-color:#d7e8f7}
 #simGtkNeedsProgress .sim-needs-metric[data-sim-gap-data="1"] b{color:#0a3568}
 .sim-needs-review-mark{display:inline-block;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900;white-space:nowrap}
 .sim-needs-review-mark.ok{background:#e9f8ef;color:#16804f}
 .sim-needs-review-mark.revision{background:#ffefec;color:#b42318}
 .sim-needs-review-actions{display:flex;gap:5px;flex-wrap:wrap;align-items:center}
 @media(max-width:1100px){#simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
 @media(max-width:760px){#simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
 `;
 document.head.appendChild(st);
}

function dashboardGrid(){
 const grids=[...document.querySelectorAll('#simGtkNeedsProgress .sim-needs-grid')];
 return grids.find(grid=>[...grid.querySelectorAll('.sim-needs-metric span')].some(s=>/gap riil/i.test(String(s.textContent||''))))||null;
}
function metricCard(grid,pattern){return [...grid.querySelectorAll('.sim-needs-metric')].find(card=>pattern.test(String(card.querySelector('span')?.textContent||'')))||null}
function gapRiilCard(grid){return metricCard(grid,/gap riil/i)}
function ensureGapDataCard(grid){
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

async function loadMetrics(){
 const client=window.__simantabSb;if(!client)throw new Error('Koneksi data belum siap.');
 if(!isDinas()){
  const {data,error}=await client.from('school_gtk_needs').select('gap_data');
  if(error)throw error;
  return {gapData:(data||[]).reduce((sum,r)=>sum+num(r.gap_data),0),approvedOnly:false};
 }
 const [{data:workflow,error:we},{data:needs,error:ne}]=await Promise.all([
  client.from('school_gtk_needs_workflow').select('school_npsn,status'),
  client.from('school_gtk_needs').select('school_npsn,gap_riil,gap_data')
 ]);
 if(we)throw we;if(ne)throw ne;
 const approved=new Set((workflow||[]).filter(w=>['VERIFIED','APPROVED'].includes(String(w.status||'').toUpperCase())).map(w=>String(w.school_npsn||'')));
 let gapRiil=0,gapData=0;
 for(const r of needs||[]){const npsn=String(r.school_npsn||'');if(!approved.has(npsn))continue;gapRiil+=num(r.gap_riil);gapData+=num(r.gap_data)}
 return {gapRiil,gapData,approvedOnly:true,approvedSchools:approved.size};
}

function setNote(card,text){
 if(!card)return;
 let note=card.querySelector('.sim-needs-note');
 if(!note){note=document.createElement('div');note.className='sim-needs-note';card.appendChild(note)}
 if(note.textContent!==text)note.textContent=text;
}
function paintMetrics(metrics){
 const grid=dashboardGrid();if(!grid)return false;
 const gapDataCard=ensureGapDataCard(grid);if(!gapDataCard)return false;
 const gapDataValue=gapDataCard.querySelector('b'),gapDataText=String(metrics.gapData??0);
 if(gapDataValue&&gapDataValue.textContent!==gapDataText)gapDataValue.textContent=gapDataText;
 if(metrics.approvedOnly){
  const gapCard=gapRiilCard(grid),gapValue=gapCard?.querySelector('b'),gapText=String(metrics.gapRiil??0);
  if(gapValue&&gapValue.textContent!==gapText)gapValue.textContent=gapText;
  const note='Hanya data yang telah di-approve Dinas';setNote(gapCard,note);setNote(gapDataCard,note);
 }else setNote(gapDataCard,'ABK dikurangi ASN & Non-ASN');
 return true;
}

function npsnFromRow(tr){
 const text=String(tr?.cells?.[0]?.textContent||'');
 return text.match(/\b\d{8}\b/)?.[0]||'';
}
function reviewHtml(npsn,status){
 if(!canReview())return status==='VERIFIED'?'<span class="sim-needs-review-mark ok">✓ Diverifikasi</span>':status==='REVISION'?'<span class="sim-needs-review-mark revision">↺ Perbaikan</span>':'—';
 if(status==='SUBMITTED')return `<div class="sim-needs-review-actions"><button class="sim-needs-action" onclick="simGtkNeedsReview('${npsn}','VERIFIED')">✓ Verifikasi</button><button class="sim-needs-action soft" onclick="simGtkNeedsReview('${npsn}','REVISION')">↺ Perbaikan</button></div>`;
 if(status==='VERIFIED')return `<div class="sim-needs-review-actions"><span class="sim-needs-review-mark ok">✓ Diverifikasi</span><button class="sim-needs-action soft" onclick="simGtkNeedsReview('${npsn}','REVISION')">↺ Perbaikan</button></div>`;
 if(status==='REVISION')return '<span class="sim-needs-review-mark revision">↺ Perbaikan</span>';
 return '—';
}
function restoreReviewColumn(){
 if(!isDinas())return false;
 const table=document.getElementById('simNeedsSchoolTable');if(!table)return false;
 const rows=[...table.querySelectorAll('tbody>tr')];if(!rows.length)return false;
 for(const tr of rows){
  const npsn=npsnFromRow(tr);if(!npsn||!tr.cells.length)continue;
  const statusText=String(tr.cells[1]?.textContent||'').toLowerCase();
  const status=statusText.includes('diajukan')?'SUBMITTED':statusText.includes('diverifikasi')?'VERIFIED':statusText.includes('perlu perbaikan')?'REVISION':statusText.includes('draft')?'DRAFT':'NOT_STARTED';
  const last=tr.cells[tr.cells.length-1];if(!last)continue;
  const html=reviewHtml(npsn,status);
  if(last.innerHTML!==html)last.innerHTML=html;
 }
 return true;
}
function bindReviewObserver(){
 if(!isDinas())return false;
 const tbody=document.querySelector('#simNeedsSchoolTable tbody');if(!tbody)return false;
 if(reviewTbody!==tbody){
  if(reviewObserver)reviewObserver.disconnect();
  reviewTbody=tbody;
  reviewObserver=new MutationObserver(()=>setTimeout(()=>restoreReviewColumn(),0));
  reviewObserver.observe(tbody,{childList:true});
 }
 return restoreReviewColumn();
}
function scheduleReviewRestore(attempt=0){
 if(!isDinas()||attempt>40)return;
 if(reviewRetryTimer)clearTimeout(reviewRetryTimer);
 reviewRetryTimer=setTimeout(()=>{
  if(bindReviewObserver())return;
  scheduleReviewRestore(attempt+1);
 },200);
}

async function refreshUi(force=false){
 ensureStyle();
 const grid=dashboardGrid(),table=document.getElementById('simNeedsSchoolTable');
 if(!grid&&!table)return false;
 if(table&&!bindReviewObserver())scheduleReviewRestore();
 if(grid){
  if(lastMetrics&&!force)paintMetrics(lastMetrics);
  else if(!busy){
   busy=true;
   try{lastMetrics=await loadMetrics();paintMetrics(lastMetrics)}
   catch(error){console.error('GTK needs dashboard metric',error);const card=ensureGapDataCard(grid),value=card?.querySelector('b');if(value)value.textContent='—';setNote(card,'Gap Data belum dapat dimuat')}
   finally{busy=false}
  }
 }
 return true;
}

function boundedRefresh(force=true,attempt=0){
 if(retryTimer)clearTimeout(retryTimer);
 Promise.resolve(refreshUi(force)).then(ok=>{
  if(ok||attempt>=30)return;
  retryTimer=setTimeout(()=>boundedRefresh(force,attempt+1),300);
 });
}

function hookShowTab(){
 if(window.__simNeedsStableUiHookedV6)return;
 if(typeof window.showTab!=='function'){
  if(hookTimer)clearTimeout(hookTimer);hookTimer=setTimeout(hookShowTab,250);return;
 }
 const original=window.showTab;
 window.showTab=async function(id){
  const result=await original.apply(this,arguments);
  if(id==='needs'){lastMetrics=null;setTimeout(()=>boundedRefresh(true),180);setTimeout(()=>scheduleReviewRestore(),260);setTimeout(()=>boundedRefresh(true),900)}
  return result;
 };
 window.__simNeedsStableUiHookedV6=true;
}

document.addEventListener('click',e=>{
 const t=e.target;
 if(t?.closest?.('[data-tab="needs"]')){lastMetrics=null;setTimeout(()=>boundedRefresh(true),300);setTimeout(()=>scheduleReviewRestore(),380)}
 if(t?.closest?.('#simNeedsSave,#simNeedsSubmit')){lastMetrics=null;setTimeout(()=>boundedRefresh(true),650);setTimeout(()=>scheduleReviewRestore(),750)}
 if(t?.closest?.('.sim-needs-action')){lastMetrics=null;setTimeout(()=>boundedRefresh(true),1200);setTimeout(()=>scheduleReviewRestore(),1300)}
},true);
document.addEventListener('input',()=>{
 if(document.getElementById('simNeedsSchoolTable'))setTimeout(()=>scheduleReviewRestore(),80);
},true);

ensureStyle();hookShowTab();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>boundedRefresh(true),700);setTimeout(()=>scheduleReviewRestore(),800)},{once:true});
else{setTimeout(()=>boundedRefresh(true),700);setTimeout(()=>scheduleReviewRestore(),800)}
window.__simantabGtkNeedsGapData={version:6,position:'right-of-gap-riil',dinasSource:'VERIFIED-only',reviewIndicators:'async-table-safe',observer:'tbody-childlist-only'};
})();
