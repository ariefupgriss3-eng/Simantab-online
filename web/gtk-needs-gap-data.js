/* SIMANTAB_GTK_NEEDS_GAP_DATA_V9 */
(()=>{
'use strict';
const CENTRAL_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN','STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN','STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK']);
const REVIEW_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const role=()=>String(window.__simantabProfile?.role||'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const isDinas=()=>CENTRAL_ROLES.has(role());
const canReview=()=>REVIEW_ROLES.has(role());
let cache=null,cacheAt=0,busy=false,interval=null,hooked=false;

function ensureStyle(){
 if(document.getElementById('simGtkNeedsGapDataV9Style'))return;
 const st=document.createElement('style');st.id='simGtkNeedsGapDataV9Style';st.textContent=`
 #simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
 .sim-needs-review-v9{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
 .sim-needs-review-v9 .mark{display:inline-block;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900;white-space:nowrap}
 .sim-needs-review-v9 .ok{background:#e9f8ef;color:#16804f}.sim-needs-review-v9 .revision{background:#ffefec;color:#b42318}.sim-needs-review-v9 .wait{background:#eaf3ff;color:#175ea7}
 .sim-needs-review-v9 button{border:0;border-radius:8px;padding:6px 8px;font-size:9px;font-weight:850;cursor:pointer}
 .sim-needs-review-v9 button.verify{background:#16804f;color:#fff}.sim-needs-review-v9 button.revise{background:#fff0ed;color:#b42318}
 #simNeedsSchoolTable th[data-gap-data-v9],#simNeedsSchoolTable td[data-gap-data-v9]{font-weight:800;color:#0a3568}
 @media(max-width:1100px){#simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
 @media(max-width:760px){#simGtkNeedsProgress .sim-needs-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
 `;document.head.appendChild(st);
}

async function loadData(force=false){
 const now=Date.now();if(cache&&!force&&now-cacheAt<1500)return cache;
 const sb=window.__simantabSb;if(!sb)throw new Error('Koneksi Supabase belum siap.');
 const [{data:needs,error:ne},{data:wfs,error:we}]=await Promise.all([
  sb.from('school_gtk_needs').select('school_npsn,gap_riil,gap_data,abk,asn_total,non_asn_total'),
  sb.from('school_gtk_needs_workflow').select('school_npsn,status')
 ]);
 if(ne)throw ne;if(we)throw we;
 const gap=new Map(),gapRiil=new Map();
 for(const r of needs||[]){const n=String(r.school_npsn||'');if(!n)continue;const gd=r.gap_data==null?num(r.abk)-num(r.asn_total)-num(r.non_asn_total):num(r.gap_data);const gr=r.gap_riil==null?num(r.abk)-num(r.asn_total):num(r.gap_riil);gap.set(n,(gap.get(n)||0)+gd);gapRiil.set(n,(gapRiil.get(n)||0)+gr)}
 const wf=new Map((wfs||[]).map(r=>[String(r.school_npsn||''),String(r.status||'').toUpperCase()]));
 cache={gap,gapRiil,wf};cacheAt=now;return cache;
}

function reviewHtml(npsn,status){
 const s=String(status||'').toUpperCase();
 if(s==='SUBMITTED')return canReview()?`<div class="sim-needs-review-v9"><button class="verify" onclick="simGtkNeedsReview('${npsn}','VERIFIED')">✓ Verifikasi</button><button class="revise" onclick="simGtkNeedsReview('${npsn}','REVISION')">↺ Perbaikan</button></div>`:'<div class="sim-needs-review-v9"><span class="mark wait">Menunggu verifikasi</span></div>';
 if(s==='VERIFIED'||s==='APPROVED')return canReview()?`<div class="sim-needs-review-v9"><span class="mark ok">✓ Diverifikasi</span><button class="revise" onclick="simGtkNeedsReview('${npsn}','REVISION')">↺ Perbaikan</button></div>`:'<div class="sim-needs-review-v9"><span class="mark ok">✓ Diverifikasi</span></div>';
 if(s==='REVISION')return '<div class="sim-needs-review-v9"><span class="mark revision">↺ Perlu Perbaikan</span></div>';
 return '—';
}

function ensureGapColumn(table){
 let headers=[...table.querySelectorAll('thead th')];
 let gapIndex=headers.findIndex(th=>/gap\s*data/i.test(String(th.textContent||'')));
 let verifyIndex=headers.findIndex(th=>/verifikasi|akses/i.test(String(th.textContent||'')));
 if(gapIndex<0){
  const th=document.createElement('th');th.textContent='Gap Data';th.dataset.gapDataV9='1';
  const hr=table.querySelector('thead tr');
  if(verifyIndex>=0&&headers[verifyIndex])hr.insertBefore(th,headers[verifyIndex]);else hr.appendChild(th);
 }
 headers=[...table.querySelectorAll('thead th')];
 gapIndex=headers.findIndex(th=>/gap\s*data/i.test(String(th.textContent||'')));
 verifyIndex=headers.findIndex(th=>/verifikasi|akses/i.test(String(th.textContent||'')));
 for(const tr of table.querySelectorAll('tbody>tr')){
  while(tr.cells.length<headers.length){const td=document.createElement('td');if(gapIndex<tr.cells.length)tr.insertBefore(td,tr.cells[gapIndex]);else tr.appendChild(td)}
 }
 return {gapIndex,verifyIndex};
}

function patchTable(data){
 const table=document.getElementById('simNeedsSchoolTable');if(!table)return false;
 const {gapIndex,verifyIndex}=ensureGapColumn(table);if(gapIndex<0)return false;
 for(const tr of table.querySelectorAll('tbody>tr')){
  const npsn=(String(tr.cells?.[0]?.textContent||tr.textContent||'').match(/\b\d{8}\b/)||[])[0];if(!npsn)continue;
  const cells=[...tr.cells];const gd=cells[gapIndex];if(gd){gd.dataset.gapDataV9='1';const value=String(data.gap.get(npsn)||0);if(gd.textContent!==value)gd.textContent=value}
  const vc=verifyIndex>=0?[...tr.cells][verifyIndex]:null;if(vc){const html=reviewHtml(npsn,data.wf.get(npsn)||'');if(vc.innerHTML!==html)vc.innerHTML=html}
 }
 return true;
}

function dashboardGrid(){return [...document.querySelectorAll('#simGtkNeedsProgress .sim-needs-grid')].find(g=>[...g.querySelectorAll('.sim-needs-metric span')].some(s=>/gap riil/i.test(String(s.textContent||''))))||null}
function patchDashboard(data){
 if(!isDinas())return;
 const grid=dashboardGrid();if(!grid)return;
 const cards=[...grid.querySelectorAll('.sim-needs-metric')];
 const gapCard=cards.find(c=>/gap riil/i.test(String(c.querySelector('span')?.textContent||'')));if(!gapCard)return;
 let gd=cards.find(c=>/gap data/i.test(String(c.querySelector('span')?.textContent||'')));
 if(!gd){gd=document.createElement('div');gd.className='sim-needs-metric';gd.innerHTML='<span>Gap Data</span><b>0</b><div class="sim-needs-note">Hanya data yang telah di-approve Dinas</div>';gapCard.insertAdjacentElement('afterend',gd)}
 let totalRiil=0,totalData=0;for(const [n,s] of data.wf){if(!['VERIFIED','APPROVED'].includes(s))continue;totalRiil+=num(data.gapRiil.get(n));totalData+=num(data.gap.get(n))}
 const gv=gapCard.querySelector('b');if(gv&&gv.textContent!==String(totalRiil))gv.textContent=String(totalRiil);
 let note=gapCard.querySelector('.sim-needs-note');if(!note){note=document.createElement('div');note.className='sim-needs-note';gapCard.appendChild(note)}note.textContent='Hanya data yang telah di-approve Dinas';
 const dv=gd.querySelector('b');if(dv&&dv.textContent!==String(totalData))dv.textContent=String(totalData);
}

async function patch(force=false){
 if(busy)return;const section=document.getElementById('needs');if(!section||!section.classList.contains('active'))return;
 busy=true;try{ensureStyle();const data=await loadData(force);patchDashboard(data);patchTable(data)}catch(e){console.error('GTK needs v9',e)}finally{busy=false}
}
function hook(){if(hooked||typeof window.showTab!=='function')return;const original=window.showTab;window.showTab=async function(id){const r=await original.apply(this,arguments);if(id==='needs'){cache=null;setTimeout(()=>patch(true),120);setTimeout(()=>patch(true),600);setTimeout(()=>patch(true),1300)}return r};hooked=true}
document.addEventListener('click',e=>{if(e.target?.closest?.('.sim-needs-review-v9 button,#simNeedsSave,#simNeedsSubmit')){cache=null;setTimeout(()=>patch(true),900)}},true);
ensureStyle();
let hookTimer=setInterval(()=>{hook();if(hooked)clearInterval(hookTimer)},200);
interval=setInterval(()=>patch(false),750);
setTimeout(()=>patch(true),800);
window.__simantabGtkNeedsGapData={version:9,unified:true,gapDataColumn:true,reviewFromWorkflow:true,stablePolling:true};
})();