/* SMARTGTK_MASS_ONBOARDING_V1 — auth helper, existing Supabase login remains authority. */
(()=>{
 if(window.__smartGtkOnboardingLoaded)return;window.__smartGtkOnboardingLoaded=true;
 function init(){
  const pane=document.querySelector('#loginPage .loginbox');
  if(!pane||document.getElementById('smartGtkJoinGuide'))return;
  const helper=document.createElement('div');helper.id='smartGtkJoinGuide';
  helper.style.cssText='margin:14px 0;padding:12px;border:1px solid #b9d5ed;background:#f2f9ff;color:#173c5c;border-radius:12px;line-height:1.55';
  helper.innerHTML='<strong>📱 GTK Baru? Cukup 3 Langkah</strong>'+
   '<ol style="padding-left:21px;margin:8px 0"><li>Daftar memakai email pribadi yang aktif.</li><li>Konfirmasi email dan tunggu persetujuan akun GTK.</li><li>Login, lengkapi Profil GTK, lalu buka SMART-GTK.</li></ol>'+
   '<div style="display:flex;flex-wrap:wrap;gap:6px"><button id="smartGtkJoinBtn" type="button">Daftar GTK</button>'+
   '<button id="smartGtkLoginBtn" type="button">Sudah punya akun</button>'+
   '<button id="smartGtkRecoverBtn" type="button">Lupa password</button></div>'+
   '<div id="smartGtkRecoverPanel" hidden style="margin-top:10px"><label for="smartGtkRecoverEmail">Email akun SIMANTAB</label>'+
   '<input type="email" id="smartGtkRecoverEmail" autocomplete="email" placeholder="alamat@email.id" style="width:100%;padding:10px;margin:5px 0;box-sizing:border-box;border:1px solid #c0d3e4;border-radius:7px">'+
   '<button type="button" id="smartGtkSendReset">Kirim tautan pemulihan</button></div>'+
   '<p id="smartGtkJoinMsg" role="status" style="font-size:12px;margin:7px 0 0"></p>'+
   '<small>Gunakan akun sendiri. Jangan mendaftar ulang jika sudah mempunyai akun. Operator sekolah dapat membantu panduan, tetapi tidak meminta password.</small>';
  const tabs=pane.querySelector('.tabs');if(tabs)tabs.insertAdjacentElement('beforebegin',helper);else pane.prepend(helper);
  const msg=s=>{document.getElementById('smartGtkJoinMsg').textContent=s};
  const setGtk=()=>typeof window.setChannel==='function'&&window.setChannel('GTK');
  function authMode(target){
   setGtk();
   const btn=document.getElementById('authBtn');
   const current=btn?.textContent?.trim();
   const wanted=target==='signup'?'Daftar Akun':'Masuk';
   if(current!==wanted&&typeof window.toggleAuthMode==='function')window.toggleAuthMode();
   document.getElementById('email')?.focus();
  }
  document.getElementById('smartGtkJoinBtn').addEventListener('click',()=>authMode('signup'));
  document.getElementById('smartGtkLoginBtn').addEventListener('click',()=>authMode('login'));
  document.getElementById('smartGtkRecoverBtn').addEventListener('click',()=>{
   document.getElementById('smartGtkRecoverPanel').hidden=false;
   document.getElementById('smartGtkRecoverEmail').focus();
  });
  document.getElementById('smartGtkSendReset').addEventListener('click',async e=>{
   const email=document.getElementById('smartGtkRecoverEmail').value.trim();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg('Masukkan alamat email yang benar.');return}
   const btn=e.currentTarget;btn.disabled=true;
   try{
    const client=window.__simantabSb;if(!client)throw Error('Koneksi login belum siap.');
    const {error}=await client.auth.resetPasswordForEmail(email);
    if(error)throw error;
    msg('Jika email terdaftar, petunjuk pemulihan akan dikirim. Periksa inbox dan spam. Jangan bagikan tautannya.');
   }catch(error){msg('Belum dapat mengirim pemulihan. Coba lagi atau hubungi admin resmi SIMANTAB.')}
   finally{btn.disabled=false}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();