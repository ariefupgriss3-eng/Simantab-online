/* SIMANTAB_GTK_NEEDS_REVIEW_V7 */
(()=>{
'use strict';
const REVIEW_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
let observer=null,observedBody=null,scheduled=false,retryTimer=null;
const role=()=>String(window.__simantabProfile?.role||'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const canReview=()=>REVIEW_ROLES.has(role());
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function ensureStyle(){
 if(document.getElementById('simGtkNeedsReviewV7Style'))return;
 const st=document.createElement('style');st.id='simGtkNeedsReviewV7Style';st.textContent=`
 .sim-needs-review-v7{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
 .sim-needs-review-v7 .mark{display:inline-block;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900;white-space:nowrap}
 .sim-needs-review-v7 .ok{background:#e9f8ef;color:#16804f}.sim-needs-review-v7 .revision{background:#ffefec;color:#b42318}.sim-needs-review-v7 .wait{background:#eef4ff;color:#2457a7}
 .sim-needs-review-v7 button{border:0;border-radius:8px;padding:6px 8px;font-size:9px;font-weight:800;cursor:pointer}
 .sim-needs-review-v7 button.verify{background:#16804f;color:white}.sim-needs-review-v7 button.revise{background:#fff0ed;color:#b42318}
 `;document.head.appendChild(st);
}
function statusOf(text){const t=String(text||'').toLowerCase();if(t.includes('diajukan'))return'SUBMITTED';if(t.includes('diverifikasi'))return'VERIFIED';if(t.includes('perlu perbaikan')||t.includes('perbaikan'))return'REVISION';if(t.includes('draft'))return'DRAFT';return'NOT_STARTED'}
function html(npsn,status){
 const n=esc(npsn);
 if(status==='SUBMITTED')return canReview()?`<div class="sim-needs-review-v7"><button class="verify" onclick="simGtkNeedsReview('${n}','VERIFIED')">✓ Verifikasi</button><button class="revise" onclick="simGtkNeedsReview('${n}','REVISION')">↺ Perbaikan</button></div>`:`<div class="sim-needs-review-v7"><span class="mark wait">Menunggu verifikasi</span></div>`;
 if(status==='VERIFIED')return canReview()?`<div class="sim-needs-review-v7"><span class="mark ok">✓ Diverifikasi</span><button class="revise" onclick="simGtkNeedsReview('${n}','REVISION')">↺ Perbaikan</button></div>`:`<div class="sim-needs-review-v7"><span class="mark ok">✓ Diverifikasi</span></div>`;
 if(status==='REVISION')return `<div class="sim-needs-review-v7"><span class="mark revision">↺ Perlu Perbaikan</span></div>`;
 return '';
}
function indices(table){
 const th=[...table.querySelectorAll('thead th')];
 const labels=th.map(x=>String(x.textContent||'').trim().toLowerCase());
 return {status:labels.findIndex(x=>x.includes('status')),verify:labels.findIndex(x=>x.includes('verifikasi'))};
}
function patch(){
 scheduled=false;ensureStyle();
 const table=document.getElementById('simNeedsSchoolTable');if(!table)return false;
 const idx=indices(table);if(idx.status<0||idx.verify<0)return false;
 const rows=[...table.querySelectorAll('tbody tr')];if(!rows.length)return false;
 for(const tr of rows){
  const cells=[...tr.cells];if(cells.length<=Math.max(idx.status,idx.verify))continue;
  const match=String(tr.textContent||'').match(/\d{8}/);if(!match)continue;
  const status=statusOf(cells[idx.status]?.textContent);const target=cells[idx.verify];if(!target)continue;
  const next=html(match[0],status);
  if(target.innerHTML!==next)target.innerHTML=next;
 }
 bindObserver(table);
 return true;
}
function schedule(delay=0){if(scheduled)return;scheduled=true;setTimeout(patch,delay)}
function bindObserver(table){
 const body=table.querySelector('tbody');if(!body||body===observedBody)return;
 if(observer)observer.disconnect();observedBody=body;
 observer=new MutationObserver(()=>schedule(0));
 observer.observe(body,{subtree:true,childList:true,characterData:true});
}
function retry(attempt=0){if(attempt>50)return;if(retryTimer)clearTimeout(retryTimer);retryTimer=setTimeout(()=>{if(!patch())retry(attempt+1)},200)}
document.addEventListener('input',e=>{if(e.target?.closest?.('#simGtkNeedsProgress')||document.getElementById('simNeedsSchoolTable'))schedule(40)},true);
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="needs"],#simNeedsSave,#simNeedsSubmit,.sim-needs-action')){schedule(120);setTimeout(()=>schedule(0),700)}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>retry(),{once:true});else retry();
window.__simantabGtkNeedsReview={version:7,semanticColumns:true,tableSubtreeObserver:true};
})();
