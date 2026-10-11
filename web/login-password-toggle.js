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
/* SIMANTAB_FORGOT_PASSWORD_V1: self-service recovery request, using the existing recovery handler. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const RECOVERY_URL='https://simantab-online.vercel.app/';
  const AUTH_URL='https://tizxfzvgglkokzvsiwkg.supabase.co';
  const PUBLIC_KEY='sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB';
  let busy=false,lastSent=0;
  const style=document.createElement('style');
  style.textContent=[
    '.sim-forgot-row{display:flex;justify-content:flex-end;margin:-5px 0 14px}',
    '.sim-forgot-link{background:transparent;border:0;color:#125eaa;cursor:pointer;font-size:13px;font-weight:750;padding:5px;text-decoration:underline;text-underline-offset:3px}',
    '.sim-forgot-cover{position:fixed;inset:0;background:rgba(11,30,54,.7);z-index:100001;display:grid;place-items:center;padding:16px}',
    '.sim-forgot-dialog{width:min(440px,100%);background:#fff;padding:24px;border-radius:18px;color:#142d47;box-shadow:0 20px 65px rgba(0,0,0,.25)}',
    '.sim-forgot-dialog h3{margin:4px 0 10px;color:#0f3f76;font-size:24px}',
    '.sim-forgot-dialog p{font-size:14px;line-height:1.5;color:#4e5f72}',
    '.sim-forgot-dialog input{display:block;width:100%;margin-top:7px;padding:12px;border:1px solid #bbc8d5;border-radius:9px;font-size:15px}',
    '.sim-forgot-buttons{display:flex;gap:10px;margin-top:16px}',
    '.sim-forgot-buttons button{border:0;padding:12px;border-radius:9px;font-weight:750;cursor:pointer}',
    '.sim-forgot-back{background:#ebf2f9;color:#173f6a}',
    '.sim-forgot-send{background:#f4770d;color:#fff;flex:1}',
    '.sim-forgot-msg{font-size:13px;line-height:1.5;margin-top:12px;color:#166647;min-height:20px}',
    '.sim-forgot-msg.error{color:#b42318}',
    '.sim-forgot-dialog button:focus-visible,.sim-forgot-dialog input:focus-visible,.sim-forgot-link:focus-visible{outline:2px solid #1767b3;outline-offset:2px}'
  ].join('\n');
  document.head.appendChild(style);

  function signup(){return !!$('nameWrap')&&!$('nameWrap').classList.contains('hidden')}
  function sync(){const row=$('simForgotRow');if(row)row.style.display=signup()?'none':'flex'}
  function mount(){
    const field=$('password')?.closest('.field');
    if(!field||$('simForgotRow'))return;
    const row=document.createElement('div');
    row.id='simForgotRow';row.className='sim-forgot-row';
    const link=document.createElement('button');
    link.type='button';link.id='simForgotLink';link.className='sim-forgot-link';
    link.textContent='Lupa Password?';link.setAttribute('aria-haspopup','dialog');
    link.addEventListener('click',open);
    row.appendChild(link);
    field.insertAdjacentElement('afterend',row);
    sync();
    const n=$('nameWrap');if(n)new MutationObserver(sync).observe(n,{attributes:true,attributeFilter:['class']});
  }
  function open(){
    if(signup()||$('simForgotCover')||$('simantabRecoveryModal'))return;
    const prev=document.activeElement,cover=document.createElement('div');
    cover.id='simForgotCover';cover.className='sim-forgot-cover';
    cover.innerHTML='<section class="sim-forgot-dialog" role="dialog" aria-modal="true" aria-labelledby="simForgotTitle">'+
      '<div style="font-size:12px;font-weight:800;color:#1767b3">PEMULIHAN AKUN SIMANTAB</div>'+
      '<h3 id="simForgotTitle">Lupa Password?</h3>'+
      '<p>Masukkan <b>email terdaftar</b> akun SIMANTAB, bukan username. Kami akan mengirim tautan untuk membuat password baru.</p>'+
      '<form id="simForgotForm" novalidate><label for="simForgotEmail"><b>Email akun</b></label>'+
      '<input id="simForgotEmail" type="email" autocomplete="email" placeholder="nama@contoh.id" maxlength="254" required>'+
      '<div class="sim-forgot-buttons"><button class="sim-forgot-back" id="simForgotBack" type="button">Kembali</button>'+
      '<button class="sim-forgot-send" id="simForgotSend" type="submit">Kirim Link Reset</button></div>'+
      '<div class="sim-forgot-msg" id="simForgotMsg" role="status" aria-live="polite"></div></form></section>';
    document.body.appendChild(cover);
    const existing=String($('email')?.value||'').trim();
    if(existing.includes('@'))$('simForgotEmail').value=existing;
    function close(){if(busy)return;cover.remove();if(prev?.isConnected)prev.focus()}
    $('simForgotBack').addEventListener('click',close);
    cover.addEventListener('click',e=>{if(e.target===cover)close()});
    cover.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();close()}
      if(e.key==='Tab'){
        const els=Array.from(cover.querySelectorAll('input,button')).filter(el=>!el.disabled);
        if(els.length){
          if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1].focus()}
          else if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0].focus()}
        }
      }
    });
    $('simForgotForm').addEventListener('submit',e=>{e.preventDefault();void submit()});
    $('simForgotEmail').focus();
  }
  function message(t,err=false){const m=$('simForgotMsg');if(m){m.classList.toggle('error',err);m.textContent=t}}
  async function submit(){
    if(busy)return;
    const email=String($('simForgotEmail')?.value||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return message('Masukkan email yang valid.',true);
    if(Date.now()-lastSent<60000)return message('Permintaan sudah diproses. Periksa Kotak Masuk dan Spam.');
    busy=true;const btn=$('simForgotSend');btn.disabled=true;btn.textContent='Mengirim…';
    message('Memproses permintaan…');
    try{
      const sb=window.__simantabSb;
      if(sb?.auth?.resetPasswordForEmail){
        const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:RECOVERY_URL});
        if(error)throw error;
      }else{
        const endpoint=AUTH_URL+'/auth/v1/recover?redirect_to='+encodeURIComponent(RECOVERY_URL);
        const r=await fetch(endpoint,{method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify({email})});
        if(!r.ok){const e=new Error('Gagal');e.status=r.status;throw e}
      }
      lastSent=Date.now();
      btn.textContent='Permintaan Terkirim';
      message('Jika email terdaftar, tautan pemulihan akan dikirim. Periksa Kotak Masuk dan Spam. Jangan bagikan tautannya.');
    }catch(e){
      message(e?.status===429||/rate.limit|too many/i.test(String(e?.message||''))
        ?'Terlalu banyak permintaan. Coba lagi nanti.'
        :'Pengiriman belum berhasil. Periksa koneksi atau hubungi Admin SIMANTAB.',true);
      btn.disabled=false;btn.textContent='Coba Kirim Lagi';
    }finally{busy=false}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  window.__simantabForgotPassword={version:1};
})();
