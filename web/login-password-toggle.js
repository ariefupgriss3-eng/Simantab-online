/* SIMANTAB_LOGIN_PASSWORD_TOGGLE_V1 */
/* SIMANTAB_LOGIN_PASSWORD_TOGGLE_V2 */
(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .sim-password-wrap{position:relative;display:block}
    .sim-password-wrap input{padding-right:48px!important}
    .sim-password-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0;border-radius:9px;background:transparent;color:#35536f;display:grid;place-items:center;font-size:18px;cursor:pointer;z-index:2}
    .sim-password-toggle:hover{background:#eef5fb}
    .sim-password-toggle:focus-visible{outline:2px solid #1769b0;outline-offset:2px}
  `;
  document.head.appendChild(style);

  function mount(){
    const input=document.getElementById('password');
    if(!input || input.dataset.simPasswordToggle==='1') return;
    input.dataset.simPasswordToggle='1';

    const wrap=document.createElement('span');
    wrap.className='sim-password-wrap';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);

    const btn=document.createElement('button');
    btn.type='button';
    btn.className='sim-password-toggle';
    btn.setAttribute('aria-label','Lihat password');
    btn.setAttribute('title','Lihat password');
    btn.textContent='👁️';
    btn.addEventListener('click',()=>{
      const showing=input.type==='text';
      input.type=showing?'password':'text';
      btn.textContent=showing?'👁️':'🙈';
      btn.setAttribute('aria-label',showing?'Lihat password':'Sembunyikan password');
      btn.setAttribute('title',showing?'Lihat password':'Sembunyikan password');
      input.focus({preventScroll:true});
      try{input.setSelectionRange(input.value.length,input.value.length)}catch{}
    });
    wrap.appendChild(btn);
  }

  mount();
  window.__simantabLoginPasswordToggle={version:2,enabled:true,observer:false};
})();
