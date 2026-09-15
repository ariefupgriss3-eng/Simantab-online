/* SIMANTAB_LOGIN_DEVELOPER_BRANDING_V1 */
(()=>{
  const DEV_NAME='M. Arief Rohman, S.Pd.SD., M.Si., M.Pd., M.Pd';
  const DEV_UNIT='Dinas Pendidikan dan Kebudayaan';
  const DEV_YEAR='2026';

  const icon=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l1 3 3 1v10l-3 1-1 3H8l-1-3-3-1V7l3-1 1-3Z"/><circle cx="12" cy="12" r="3"/></svg>`;

  function ensureStyle(){
    if(document.getElementById('simantabLoginDeveloperStyle'))return;
    const style=document.createElement('style');
    style.id='simantabLoginDeveloperStyle';
    style.textContent=`
      .sim-login-developer{margin-top:18px;padding-top:16px;border-top:1px solid rgba(148,163,184,.35);text-align:center;color:#64748b;font-size:12px;line-height:1.5}
      .sim-login-developer .sim-login-dev-title{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;color:#334155;font-weight:700}
      .sim-login-developer .sim-login-dev-icon{width:24px;height:24px;border-radius:8px;background:#eaf4ff;color:#0f5f9f;display:inline-flex;align-items:center;justify-content:center;flex:0 0 24px}
      .sim-login-developer .sim-login-dev-icon svg{width:15px;height:15px;display:block}
      .sim-login-developer .sim-login-dev-unit{margin-top:2px;font-weight:600}
      .sim-login-developer .sim-login-dev-year{margin-top:1px;color:#0f5f9f;font-weight:800;letter-spacing:.08em}
      @media(max-width:640px){.sim-login-developer{font-size:11px;margin-top:14px;padding-top:13px}}
    `;
    document.head.appendChild(style);
  }

  function normalizedText(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()}

  function findLoginHeading(){
    return [...document.querySelectorAll('h1,h2,h3,h4,.title,.heading')]
      .find(el=>normalizedText(el).includes('masuk simantab online')) || null;
  }

  function findLoginPanel(heading){
    let node=heading;
    for(let i=0;i<8 && node;i++,node=node.parentElement){
      if(node.querySelector?.('input[type="password"]') && node.querySelector?.('button'))return node;
    }
    return heading.parentElement || document.body;
  }

  function decorateLogin(){
    ensureStyle();
    const heading=findLoginHeading();
    if(!heading)return;
    const panel=findLoginPanel(heading);
    if(panel.querySelector?.('.sim-login-developer'))return;
    const block=document.createElement('div');
    block.className='sim-login-developer';
    block.innerHTML=`<div class="sim-login-dev-title"><span class="sim-login-dev-icon">${icon}</span><span>Pengembang: ${DEV_NAME}</span></div><div class="sim-login-dev-unit">${DEV_UNIT}</div><div class="sim-login-dev-year">${DEV_YEAR}</div>`;
    panel.appendChild(block);
  }

  let timer=null;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(decorateLogin,80);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateLogin,{once:true});
  else decorateLogin();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
