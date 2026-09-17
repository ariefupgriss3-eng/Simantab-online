/* SIMANTAB_GTK_NEEDS_TABLE_FINAL_V8 */
(()=>{
'use strict';
const REVIEW_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
let observer=null,observedBox=null,busy=false,retryTimer=null;
const role=()=>String(window.__simantabProfile?.role||'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const canReview=()=>REVIEW_ROLES.has(role());
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;

function ensureStyle(){
 if(document.getElementById('simGtkNeedsTableFinalV8Style'))return;
 const st=document.createElement('style');
 st.id='simGtkNeedsTableFinalV8Style';
 st.textContent=`
 .sim-needs-review-final{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
 .sim-needs-review-final .mark{display:inline-block;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900;white-space:nowrap}
 .sim-needs-review-final .ok{background:#e9f8ef;color:#16804f}
 .sim-needs-review-final .revision{background:#ffefec;color:#b42318}
 .sim-needs-review-final .wait{background:#eaf3ff;color:#175ea7}
 .sim-needs-review-final button{border:0;border-radius:8px;padding:6px 8px;font-size:9px;font-weight:850;cursor:pointer}
 .sim-needs-review-final button.verify{background:#16804f;color:#fff}
 .sim-needs-review-final button.revise{background:#fff0ed;color:#b42318}
 #simNeedsSchoolTable th[data-final-gap-data="1"],#simNeedsSchoolTable td[data-final-gap-data="1"]{font-weight:800;color:#0a3568}
 `;
 document.head.appendChild(st);
}

function reviewHtml(npsn,status){
 const n=esc(npsn),s=String(status||'').toUpperCase();
 if(s==='SUBMITTED'){
  if(canReview())return `<div class="sim-needs-review-final"><button class="verify" onclick="simGtkNeedsReview('${n}','VERIFIED')">✓ Verifikasi</button><button class="revise" onclick="simGtkNeedsReview('${n}','REVISION')">↺ Perbaikan</button></div>`;
  return '<div class="sim-needs-review-final"><span class="mark wait">Menunggu verifikasi</span></div>';
 }
 if(s==='VERIFIED'||s==='APPROVED'){
  if(canReview())return `<div class="sim-needs-review-final"><span class="mark ok">✓ Diverifikasi</span><button class="revise" onclick="simGtkNeedsReview('${n}','REVISION')">↺ Perbaikan</button></div>`;
  return '<div class="sim-needs-review-final"><span class="mark ok">✓ Diverifikasi</span></div>';
 }
 if(s==='REVISION')return '<div class="sim-needs-review-final"><span class="mark revision">↺ Perlu Perbaikan</span></div>';
 return '—';
}

async function loadMaps(){
 const sb=window.__simantabSb;if(!sb)throw new Error('Koneksi data belum siap.');
 const [{data:needs,error:ne},{data:wfs,error:we}]=await Promise.all([
  sb.from('school_gtk_needs').select('school_npsn,gap_data,abk,asn_total,non_asn_total'),
  sb.from('school_gtk_needs_workflow').select('school_npsn,status')
 ]);
 if(ne)throw ne;if(we)throw we;
 const gap=new Map();
 for(const r of needs||[]){
  const n=String(r.school_npsn||'');if(!n)continue;
  const value=r.gap_data==null?(num(r.abk)-num(r.asn_total)-num(r.non_asn_total)):num(r.gap_data);
  gap.set(n,(gap.get(n)||0)+value);
 }
 const wf=new Map((wfs||[]).map(r=>[String(r.school_npsn||''),String(r.status||'').toUpperCase()]));
 return {gap,wf};
}

function ensureGapColumn(table){
 const header=[...table.querySelectorAll('thead th')];
 let gapIndex=header.findIndex(th=>/gap\s*data/i.test(String(th.textContent||'')));
 let verifyIndex=header.findIndex(th=>/verifikasi|akses/i.test(String(th.textContent||'')));
 if(gapIndex<0){
  const th=document.createElement('th');th.textContent='Gap Data';th.dataset.finalGapData='1';
  const row=table.querySelector('thead tr');
  if(verifyIndex>=0&&header[verifyIndex])row.insertBefore(th,header[verifyIndex]);else row.appendChild(th);
 }
 const finalHeader=[...table.querySelectorAll('thead th')];
 gapIndex=finalHeader.findIndex(th=>/gap\s*data/i.test(String(th.textContent||'')));
 verifyIndex=finalHeader.findIndex(th=>/verifikasi|akses/i.test(String(th.textContent||'')));
 return {gapIndex,verifyIndex};
}

async function patch(){
 if(busy)return false;
 const table=document.getElementById('simNeedsSchoolTable');if(!table)return false;
 const rows=[...table.querySelectorAll('tbody>tr')];if(!rows.length)return false;
 busy=true;
 try{
  ensureStyle();
  const {gap,wf}=await loadMaps();
  const {gapIndex,verifyIndex}=ensureGapColumn(table);
  if(gapIndex<0)return false;
  for(const tr of rows){
   const match=String(tr.cells?.[0]?.textContent||tr.textContent||'').match(/\b\d{8}\b/);if(!match)continue;
   const npsn=match[0];
   while(tr.cells.length<table.querySelectorAll('thead th').length){
    const td=document.createElement('td');
    if(verifyIndex>=0&&tr.cells[verifyIndex])tr.insertBefore(td,tr.cells[verifyIndex]);else tr.appendChild(td);
   }
   const cells=[...tr.cells];
   const gapCell=cells[gapIndex];if(gapCell){gapCell.dataset.finalGapData='1';gapCell.textContent=String(gap.get(npsn)||0)}
   const verifyCell=verifyIndex>=0?[...tr.cells][verifyIndex]:null;
   if(verifyCell)verifyCell.innerHTML=reviewHtml(npsn,wf.get(npsn)||'');
  }
  return true;
 }catch(e){console.error('GTK needs final table renderer',e);return false}
 finally{busy=false}
}

function observe(){
 const box=document.getElementById('simGtkNeedsProgress');if(!box)return false;
 if(box!==observedBox){
  if(observer)observer.disconnect();observedBox=box;
  observer=new MutationObserver(()=>setTimeout(()=>patch(),40));
  observer.observe(box,{childList:true,subtree:false});
 }
 return true;
}
function retry(attempt=0){
 if(attempt>60)return;
 if(retryTimer)clearTimeout(retryTimer);
 retryTimer=setTimeout(async()=>{observe();const ok=await patch();if(!ok)retry(attempt+1)},200);
}
function hook(){
 if(window.__simGtkNeedsTableFinalHookedV8)return;
 if(typeof window.showTab!=='function'){setTimeout(hook,200);return}
 const original=window.showTab;
 window.showTab=async function(id){
  const r=await original.apply(this,arguments);
  if(id==='needs'){observe();setTimeout(()=>patch(),180);setTimeout(()=>patch(),650);setTimeout(()=>patch(),1300)}
  return r;
 };
 window.__simGtkNeedsTableFinalHookedV8=true;
}

ensureStyle();hook();retry();
window.__simantabGtkNeedsTableFinal={version:8,gapDataColumn:true,reviewFromWorkflow:true,directDatabaseMap:true};
})();