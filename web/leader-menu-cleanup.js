/* SIMANTAB_LEADER_MENU_CLEANUP_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.showTab||!window.__simantabProfile);i++)await wait(50);
const p=()=>window.__simantabProfile||{};
const isLeader=()=>['KEPALA_DINAS','SEKRETARIS_DINAS'].includes(String(p().role||''));
function clean(){
 if(!isLeader())return;
 const nav=document.getElementById('nav');if(!nav)return;
 nav.querySelectorAll('.navbtn[data-tab="activities"]').forEach(b=>b.remove());
 const acts=[...nav.querySelectorAll('.navbtn')].filter(b=>/kegiatan bidang/i.test(b.textContent||''));
 if(acts.length>1){
   const keep=acts.find(b=>b.dataset.tab==='kadinActivities')||acts[0];
   acts.forEach(b=>{if(b!==keep)b.remove()});
 }
}
const prior=window.showTab;
window.showTab=async function(id){
 const mapped=isLeader()&&id==='activities'?'kadinActivities':id;
 const r=await prior.call(this,mapped);
 clean();
 return r;
};
clean();
const nav=document.getElementById('nav');
if(nav)new MutationObserver(()=>queueMicrotask(clean)).observe(nav,{childList:true,subtree:true});
window.__simantabLeaderMenuCleanup={version:1};
})();