/* SIMANTAB_DASHBOARD_ORDER_FIX_V1 */
(()=>{
const $=id=>document.getElementById(id);
function reorderDashboard(){
  const body=$('dashboardBody');
  if(!body)return;
  const welcome=body.querySelector('.sim-premium-welcome');
  const menu=body.querySelector('.sim-premium-section');
  if(!welcome||!menu)return;

  // Urutan wajib seluruh akun: Welcome -> Menu Layanan Utama -> ringkasan/statistik -> Pengumuman/Agenda.
  if(welcome.nextElementSibling!==menu)welcome.insertAdjacentElement('afterend',menu);

  const bottom=menu.querySelector('.sim-premium-bottom');
  const motto=menu.querySelector('.sim-premium-motto');
  if(bottom)body.appendChild(bottom);
  if(motto)body.appendChild(motto);

  menu.dataset.orderFixed='true';
}

let timer;
const run=()=>{clearTimeout(timer);timer=setTimeout(reorderDashboard,60)};
const body=$('dashboardBody');
if(body)new MutationObserver(run).observe(body,{childList:true,subtree:true});

const prior=window.showTab;
if(prior)window.showTab=async id=>{
  const result=await prior(id);
  if(id==='dashboard')setTimeout(reorderDashboard,100);
  return result;
};

setTimeout(reorderDashboard,700);
window.__simantabDashboardOrder={version:1,order:['WELCOME','MENU_LAYANAN_UTAMA','RINGKASAN_STATISTIK','PENGUMUMAN_AGENDA'],allAccounts:true};
})();
