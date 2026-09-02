/* SIMANTEB_KORWIL_DASHBOARD_TITLE_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabProfile||!window.showTab);i++)await wait(50);
const p=()=>window.__simantabProfile||{};
const isKorwil=()=>p().role==='PENGAWAS'&&/korwil/i.test(String(p().position||''));
function apply(){
 if(!isKorwil())return;
 const nav=document.getElementById('nav');
 const btn=nav?.querySelector('.navbtn[data-tab="dashboard"]');
 if(btn){
  const ico=btn.querySelector('.ico')?.outerHTML||'<span class="ico">▦</span>';
  const target=`${ico}Dashboard Biddik Kecamatan`;
  if(btn.innerHTML!==target)btn.innerHTML=target;
 }
 const title=document.getElementById('dashTitle');
 if(title&&title.textContent!=='Dashboard Biddik Kecamatan')title.textContent='Dashboard Biddik Kecamatan';
}
const prevShow=window.showTab;
window.showTab=async id=>{const r=await prevShow(id);if(id==='dashboard'){await wait(30);apply();setTimeout(apply,500)}return r};
const prevRefresh=window.refreshAll;
if(prevRefresh)window.refreshAll=async(...args)=>{const r=await prevRefresh(...args);apply();return r};
apply();
for(const ms of [100,350,900,1800])setTimeout(apply,ms);
window.__simantebKorwilDashboardTitle={version:1,title:'Dashboard Biddik Kecamatan'};
})();