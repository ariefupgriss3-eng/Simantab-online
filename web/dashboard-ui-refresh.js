/* SIMANTAB_DASHBOARD_UI_REFRESH_V1 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const css=`
:root{
  --sim-navy-950:#062746;--sim-navy-900:#07335d;--sim-navy-800:#0a4277;
  --sim-blue:#0f7af5;--sim-blue-2:#2d95ff;--sim-cyan:#13b7c8;
  --sim-green:#17b66c;--sim-orange:#ff9c1a;--sim-red:#e34b4b;
  --sim-bg:#f3f7fb;--sim-card:#ffffff;--sim-ink:#0f2d4a;--sim-muted:#6d8194;
  --sim-line:#dfe9f2;--sim-shadow:0 10px 28px rgba(12,56,92,.08);
}
html,body{background:var(--sim-bg)!important;color:var(--sim-ink)}
body.sim-ui-refresh-v1{min-height:100vh}
body.sim-ui-refresh-v1 .top{
  height:68px!important;background:#fff!important;color:var(--sim-ink)!important;
  border-bottom:1px solid var(--sim-line)!important;box-shadow:0 4px 18px rgba(7,51,93,.07)!important;
  padding-left:16px!important;padding-right:16px!important;z-index:1200!important
}
body.sim-ui-refresh-v1 .top .btitle{color:#0a3763!important;font-weight:950!important;letter-spacing:-.02em}
body.sim-ui-refresh-v1 .top .bsub,body.sim-ui-refresh-v1 .top .small{color:#71869a!important}
body.sim-ui-refresh-v1 .top .sim-top-accent{color:#13aebc!important}
body.sim-ui-refresh-v1 .top .mark{background:linear-gradient(145deg,#f7fbff,#e8f2fb)!important;color:#0a4277!important;border:1px solid #d8e8f5!important;box-shadow:none!important}
body.sim-ui-refresh-v1 .top .chip{background:#f0f6fb!important;color:#34536f!important;border:1px solid #dce8f2!important}
body.sim-ui-refresh-v1 .top .avatar{background:linear-gradient(145deg,#157bf1,#0a62c3)!important;color:#fff!important;box-shadow:0 5px 12px rgba(15,122,245,.2)}
body.sim-ui-refresh-v1 .top .btn.soft{background:#f4f8fc!important;color:#34536f!important;border:1px solid #dce8f2!important}
body.sim-ui-refresh-v1 .layout{grid-template-columns:270px minmax(0,1fr)!important}
body.sim-ui-refresh-v1 .side{
  top:68px!important;height:calc(100vh - 68px)!important;padding:16px 12px!important;
  background:linear-gradient(180deg,var(--sim-navy-900) 0%,var(--sim-navy-950) 100%)!important;
  box-shadow:8px 0 30px rgba(5,38,69,.09)!important;border-right:0!important
}
body.sim-ui-refresh-v1 .side:before{content:'SIMANTAB-ONLINE';display:block;color:#fff;font-size:14px;font-weight:950;letter-spacing:.025em;padding:4px 11px 2px}
body.sim-ui-refresh-v1 .side:after{content:'Dinas Pendidikan dan Kebudayaan • Bidang Ketenagaan';display:block;color:#83a8c7;font-size:9px;line-height:1.45;padding:16px 11px 4px;margin-top:16px;border-top:1px solid rgba(255,255,255,.09)}
body.sim-ui-refresh-v1 .navhead{color:#81a9cd!important;font-size:9px!important;letter-spacing:.1em!important;margin:13px 10px 5px!important}
body.sim-ui-refresh-v1 .navbtn{color:#dceaf7!important;border-radius:10px!important;padding:10px 11px!important;margin:2px 0!important;font-size:12px!important;font-weight:750!important}
body.sim-ui-refresh-v1 .navbtn:hover{background:rgba(255,255,255,.075)!important;color:#fff!important}
body.sim-ui-refresh-v1 .navbtn.active{background:linear-gradient(135deg,#177ff0,#2497ff)!important;color:#fff!important;box-shadow:0 8px 18px rgba(20,124,235,.25)!important}
body.sim-ui-refresh-v1 .navbtn .ico{color:#9dc5e9!important}
body.sim-ui-refresh-v1 .navbtn.active .ico{color:#fff!important}
body.sim-ui-refresh-v1 .content{padding:18px 20px 24px!important;background:var(--sim-bg)!important;min-width:0}
body.sim-ui-refresh-v1 .head{margin-bottom:12px!important}
body.sim-ui-refresh-v1 .head h2{font-size:23px!important;color:#0b3b69!important;letter-spacing:-.02em!important}
body.sim-ui-refresh-v1 .head p{color:#74879a!important}
body.sim-ui-refresh-v1 .card,body.sim-ui-refresh-v1 .service{border:1px solid var(--sim-line)!important;border-radius:15px!important;box-shadow:var(--sim-shadow)!important}
body.sim-ui-refresh-v1 .footer{border-top:1px solid #dfe8f1!important;color:#6e8295!important;background:transparent!important}
.sim-ui-search{flex:1;max-width:430px;margin-left:18px;margin-right:auto;position:relative;display:flex;align-items:center}
.sim-ui-search:before{content:'⌕';position:absolute;left:13px;top:50%;transform:translateY(-52%);font-size:19px;color:#688096;pointer-events:none}
.sim-ui-search input{width:100%;height:38px;border:1px solid #dce7f0;border-radius:999px;background:#f4f8fc;padding:0 15px 0 38px;color:#173b5b;font-size:12px;outline:none;transition:.16s}
.sim-ui-search input:focus{background:#fff;border-color:#78b8f7;box-shadow:0 0 0 3px rgba(15,122,245,.09)}
.sim-ui-search-results{position:absolute;left:0;right:0;top:44px;background:#fff;border:1px solid #dce7f0;border-radius:12px;box-shadow:0 16px 35px rgba(6,39,70,.16);padding:6px;display:none;z-index:1600;max-height:300px;overflow:auto}
.sim-ui-search.open .sim-ui-search-results{display:block}
.sim-ui-search-result{width:100%;border:0;background:#fff;border-radius:8px;padding:9px 10px;text-align:left;color:#23435e;font-size:11px;font-weight:750;cursor:pointer}
.sim-ui-search-result:hover,.sim-ui-search-result:focus{background:#eef6ff;outline:none}
.sim-ui-search-empty{padding:11px;color:#7c8e9f;font-size:11px}
/* dashboard umum */
body.sim-ui-refresh-v1 #dashboardBody{min-width:0}
body.sim-ui-refresh-v1 .sim-premium-welcome{
  background:linear-gradient(110deg,#fff 0%,#f4faff 53%,#eaf7fb 100%)!important;
  border:1px solid #d8e8f4!important;border-radius:16px!important;padding:18px 20px!important;box-shadow:0 8px 24px rgba(11,66,110,.06)!important
}
body.sim-ui-refresh-v1 .sim-premium-welcome:after{color:#d9eafa!important;opacity:.58!important;font-size:38px!important}
body.sim-ui-refresh-v1 .sim-premium-welcome h3{font-size:21px!important;color:#0a4277!important}
body.sim-ui-refresh-v1 .sim-premium-kicker{color:#0f7af5!important}
body.sim-ui-refresh-v1 .sim-welcome-badges span{background:#fff!important;border-color:#d7e8f4!important;color:#53728b!important}
body.sim-ui-refresh-v1 .sim-premium-section-title h3{color:#0b3d6d!important}
body.sim-ui-refresh-v1 .sim-premium-tiles{gap:10px!important}
body.sim-ui-refresh-v1 .sim-premium-tile{border:1px solid #e0eaf3!important;border-radius:14px!important;box-shadow:0 7px 18px rgba(9,52,90,.06)!important;background:#fff!important}
body.sim-ui-refresh-v1 .sim-premium-tile:nth-child(4n+2){background:#f3fbf7!important}
body.sim-ui-refresh-v1 .sim-premium-tile:nth-child(4n+3){background:#f2f9ff!important}
body.sim-ui-refresh-v1 .sim-premium-tile:nth-child(4n){background:#fff8ec!important}
body.sim-ui-refresh-v1 .sim-premium-tile .arrow{background:#137cf2!important}
body.sim-ui-refresh-v1 .sim-premium-panel{border:1px solid #e0eaf3!important;border-radius:14px!important;box-shadow:0 7px 18px rgba(9,52,90,.05)!important}
body.sim-ui-refresh-v1 #dashboardBody>.grid>.card.s3{border:0!important;border-radius:15px!important;overflow:hidden;box-shadow:0 8px 22px rgba(10,62,103,.09)!important;background:linear-gradient(135deg,#187df0,#0767ca)!important;color:#fff!important}
body.sim-ui-refresh-v1 #dashboardBody>.grid>.card.s3:nth-child(2){background:linear-gradient(135deg,#0cb8a5,#0a9c8d)!important}
body.sim-ui-refresh-v1 #dashboardBody>.grid>.card.s3:nth-child(3){background:linear-gradient(135deg,#ffb21e,#f49712)!important}
body.sim-ui-refresh-v1 #dashboardBody>.grid>.card.s3:nth-child(4){background:linear-gradient(135deg,#20bc64,#11a653)!important}
body.sim-ui-refresh-v1 #dashboardBody>.grid>.card.s3 .label,body.sim-ui-refresh-v1 #dashboardBody>.grid>.card.s3 .metric,body.sim-ui-refresh-v1 #dashboardBody>.grid>.card.s3 .small{color:#fff!important}
/* authoritative dashboard pimpinan */
body.sim-ui-refresh-v1 #dashboardBody .lad-grid{gap:12px!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-hero{
  position:relative;overflow:hidden;background:linear-gradient(110deg,#fdfefe 0%,#eef8ff 62%,#e3f4f7 100%)!important;
  color:#0a3e6d!important;border:1px solid #d8e8f4!important;border-radius:16px!important;padding:18px 20px!important;box-shadow:0 8px 24px rgba(12,66,108,.06)!important
}
body.sim-ui-refresh-v1 #dashboardBody .lad-hero:after{content:'SIMANTAB';position:absolute;right:22px;top:10px;font-size:42px;font-weight:950;color:#dcecf7;letter-spacing:-.05em;opacity:.78}
body.sim-ui-refresh-v1 #dashboardBody .lad-hero h2{position:relative;z-index:1;font-size:24px!important;color:#0a3e6d!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-hero p{position:relative;z-index:1;color:#597289!important;opacity:1!important;max-width:72%}
body.sim-ui-refresh-v1 #dashboardBody .lad-note{background:#f7fbff!important;border:1px solid #dce8f4!important;color:#617990!important;border-radius:11px!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-card{grid-column:span 3!important;position:relative;overflow:hidden;border:0!important;border-radius:15px!important;padding:15px!important;min-height:112px!important;box-shadow:0 8px 22px rgba(10,62,103,.08)!important;background:#fff!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-card:before{content:'';position:absolute;width:66px;height:66px;border-radius:22px;right:-12px;top:-15px;background:linear-gradient(145deg,#e8f4ff,#f6fbff)}
body.sim-ui-refresh-v1 #dashboardBody .lad-card:nth-of-type(4):before{background:linear-gradient(145deg,#e9fbf4,#f6fffa)}
body.sim-ui-refresh-v1 #dashboardBody .lad-card:nth-of-type(5):before{background:linear-gradient(145deg,#fff4dd,#fffaf0)}
body.sim-ui-refresh-v1 #dashboardBody .lad-label{position:relative;z-index:1;color:#6b8195!important;font-size:9px!important;letter-spacing:.065em!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-value{position:relative;z-index:1;color:#0a3f72!important;font-size:28px!important;letter-spacing:-.03em!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-sub{position:relative;z-index:1;color:#687d90!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-wide{border:1px solid #e0eaf3!important;border-radius:15px!important;padding:15px!important;box-shadow:0 7px 18px rgba(10,58,95,.055)!important;background:#fff!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-wide h3{color:#0b3d6c!important;font-size:15px!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-track{height:8px!important;background:#edf3f7!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-fill{background:linear-gradient(90deg,#0f7af5,#45a3ff)!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-fill.asn{background:linear-gradient(90deg,#14a95f,#30c87b)!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-fill.gap{background:linear-gradient(90deg,#f49a12,#ffbd3b)!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-state{border-color:#edf2f6!important;color:#526d83!important}
body.sim-ui-refresh-v1 #dashboardBody .lad-edu-btn{background:#eef6ff!important;color:#0b62b7!important;border-color:#cfe3f7!important}
/* aksesibilitas dan status */
body.sim-ui-refresh-v1 button:focus-visible,body.sim-ui-refresh-v1 [role='button']:focus-visible{outline:3px solid rgba(15,122,245,.28)!important;outline-offset:2px!important}
body.sim-ui-refresh-v1 .kpill,body.sim-ui-refresh-v1 .badge{font-weight:850!important}
@media(max-width:1180px){
  body.sim-ui-refresh-v1 .layout{grid-template-columns:235px minmax(0,1fr)!important}
  body.sim-ui-refresh-v1 #dashboardBody .lad-card{grid-column:span 4!important}
}
@media(max-width:980px){
  body.sim-ui-refresh-v1 .layout{grid-template-columns:1fr!important}
  body.sim-ui-refresh-v1 .side{top:68px!important;height:calc(100vh - 68px)!important}
  .sim-ui-search{max-width:300px;margin-left:10px}
  body.sim-ui-refresh-v1 #dashboardBody .lad-card{grid-column:span 6!important}
}
@media(max-width:700px){
  body.sim-ui-refresh-v1 .content{padding:11px!important}
  .sim-ui-search{display:none!important}
  body.sim-ui-refresh-v1 #dashboardBody .lad-hero p{max-width:100%}
  body.sim-ui-refresh-v1 #dashboardBody .lad-hero:after{display:none}
  body.sim-ui-refresh-v1 #dashboardBody .lad-card,body.sim-ui-refresh-v1 #dashboardBody .lad-wide{grid-column:span 12!important}
  body.sim-ui-refresh-v1 .sim-premium-tiles{grid-template-columns:1fr 1fr!important}
}
@media(max-width:480px){body.sim-ui-refresh-v1 .sim-premium-tiles{grid-template-columns:1fr!important}}
`;
function ensureStyle(){
  if($('simantabDashboardUiRefreshStyle'))return;
  const st=document.createElement('style');st.id='simantabDashboardUiRefreshStyle';st.textContent=css;document.head.appendChild(st);
}
function normalize(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim()}
function ensureSearch(){
  const top=qs('.top');if(!top||qs('.sim-ui-search',top))return;
  const box=document.createElement('div');box.className='sim-ui-search';
  box.innerHTML='<input type="search" aria-label="Cari menu SIMANTAB" placeholder="Cari layanan, menu, atau fitur…" autocomplete="off"><div class="sim-ui-search-results" role="listbox"></div>';
  const anchor=qs('.brand',top)||top.firstElementChild;
  if(anchor?.nextSibling)top.insertBefore(box,anchor.nextSibling);else top.appendChild(box);
  const input=qs('input',box),results=qs('.sim-ui-search-results',box);
  const refresh=()=>{
    const q=normalize(input.value);results.innerHTML='';
    if(q.length<2){box.classList.remove('open');return}
    const matches=qsa('.navbtn').map(btn=>({btn,label:btn.textContent.replace(/\s+/g,' ').trim()})).filter(x=>normalize(x.label).includes(q)).slice(0,8);
    if(!matches.length){results.innerHTML='<div class="sim-ui-search-empty">Menu tidak ditemukan.</div>';box.classList.add('open');return}
    matches.forEach(({btn,label})=>{const b=document.createElement('button');b.type='button';b.className='sim-ui-search-result';b.textContent=label;b.addEventListener('click',()=>{input.value='';box.classList.remove('open');btn.click()});results.appendChild(b)});
    box.classList.add('open');
  };
  input.addEventListener('input',refresh);
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';box.classList.remove('open');input.blur()}else if(e.key==='Enter'){const first=qs('.sim-ui-search-result',results);if(first){e.preventDefault();first.click()}}});
  document.addEventListener('click',e=>{if(!box.contains(e.target))box.classList.remove('open')});
}
function apply(){
  ensureStyle();document.body.classList.add('sim-ui-refresh-v1');ensureSearch();
  const body=$('dashboardBody');if(body)body.dataset.uiRefresh='v1';
}
function boot(){apply();let pending=false;const schedule=()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;apply()},80)};new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.__simantabDashboardUiRefresh={version:1,scope:'presentation-only',backendUntouched:true,workflowUntouched:true,roleGuardsUntouched:true};
})();
