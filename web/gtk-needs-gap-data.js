/* SIMANTAB_GTK_NEEDS_GAP_DATA_V4 */
(()=>{
'use strict';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const CENTRAL_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN','STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN','STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK']);
let busy=false,lastMetrics=null,retryTimer=null;

function role(){return String(window.__simantabProfile?.role||'').toUpperCase()}
function isDinas(){return CENTRAL_ROLES.has(role())}

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

function metricCard(grid,pattern){
 return [...grid.querySelectorAll('.sim-needs-metric')].find(card=>pattern.test(String(card.querySelector('span')?.textContent||'')))||null;
}
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

async function loadAllGapData(){
 const client=window.__simantabSb;if(!client)throw new Error('Koneksi data belum siap.');
 const {data,error}=await client.from('school_gtk_needs').select('gap_data');
 if(error)throw error;
 return {gapData:(data||[]).reduce((sum,r)=>sum+num(r.gap_data),0),approvedOnly:false};
}

async function loadApprovedDinasMetrics(){
 const client=window.__simantabSb;if(!client)throw new Error('Koneksi data belum siap.');
 const [{data:schools,error:se},{data:workflow,error:we},{data:needs,error:ne}]=await Promise.all([
  client.from('school_master').select('npsn,school_status,is_active').eq('is_active',true).eq('school_status','NEGERI'),
  client.from('school_gtk_needs_workflow').select('school_npsn,status'),
  client.from('school_gtk_needs').select('school_npsn,gap_riil,gap_data')
 ]);
 if(se)throw se;if(we)throw we;if(ne)throw ne;
 const negeri=new Set((schools||[]).map(s=>String(s.npsn||'')));
 const approved=new Set((workflow||[]).filter(w=>['VERIFIED','APPROVED'].includes(String(w.status||'').toUpperCase())&&negeri.has(String(w.school_npsn||''))).map(w=>String(w.school_npsn||'')));
 let gapRiil=0,gapData=0;
 for(const r of needs||[]){
  const npsn=String(r.school_npsn||'');if(!approved.has(npsn))continue;
  gapRiil+=num(r.gap_riil);gapData+=num(r.gap_data);
 }
 return {gapRiil,gapData,approvedOnly:true,approvedSchools:approved.size};
}

function setNote(card,text){
 if(!card)return;
 let note=card.querySelector('.sim-needs-note');
 if(!note){note=document.createElement('div');note.className='sim-needs-note';card.appendChild(note)}
 if(note.textContent!==text)note.textContent=text;
}

function paint(metrics){
 const grid=dashboardGrid();if(!grid)return false;
 const gapDataCard=ensureGapDataCard(grid);if(!gapDataCard)return false;
 const gapDataValue=gapDataCard.querySelector('b');
 const gapDataText=String(metrics.gapData??0);
 if(gapDataValue&&gapDataValue.textContent!==gapDataText)gapDataValue.textContent=gapDataText;
 if(metrics.approvedOnly){
  const gapCard=gapRiilCard(grid),gapValue=gapCard?.querySelector('b'),gapText=String(metrics.gapRiil??0);
  if(gapValue&&gapValue.textContent!==gapText)gapValue.textContent=gapText;
  const note='Hanya data yang telah di-approve Dinas';
  setNote(gapCard,note);setNote(gapDataCard,note);
 }else setNote(gapDataCard,'ABK dikurangi ASN & Non-ASN');
 return true;
}

async function refreshMetrics(force=false){
 ensureStyle();
 if(!dashboardGrid())return false;
 if(lastMetrics&&!force){paint(lastMetrics);return true}
 if(busy)return true;
 busy=true;
 try{
  lastMetrics=isDinas()?await loadApprovedDinasMetrics():await loadAllGapData();
  paint(lastMetrics);
 }catch(error){
  console.error('GTK needs Gap Data dashboard',error);
  const grid=dashboardGrid(),card=grid?ensureGapDataCard(grid):null,value=card?.querySelector('b');
  if(value)value.textContent='—';setNote(card,'Gap Data belum dapat dimuat');
 }finally{busy=false}
 return true;
}

function boundedRefresh(force=true,attempt=0){
 if(retryTimer)clearTimeout(retryTimer);
 const done=refreshMetrics(force);
 Promise.resolve(done).then(ok=>{
  if(ok||attempt>=8)return;
  retryTimer=setTimeout(()=>boundedRefresh(force,attempt+1),250);
 });
}

// Tanpa MutationObserver global: mencegah loop render pada tabel ratusan sekolah.
document.addEventListener('click',e=>{
 const t=e.target;
 if(t?.closest?.('[data-tab="needs"]'))setTimeout(()=>boundedRefresh(true),250);
 if(t?.closest?.('#simNeedsSave,#simNeedsSubmit'))setTimeout(()=>boundedRefresh(true),500);
 if(t?.closest?.('.sim-needs-action')&&/verifikasi|perbaikan/i.test(String(t.textContent||'')))setTimeout(()=>boundedRefresh(true),900);
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>boundedRefresh(true),400),{once:true});
else setTimeout(()=>boundedRefresh(true),400);

window.__simantabGtkNeedsGapData={version:4,position:'right-of-gap-riil',dinasSource:'VERIFIED-only',observer:'disabled'};
})();
