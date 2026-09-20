/* SIMANTAB_PWA_INSTALL_V2 */
(()=>{
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true;
  const isIos=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredPrompt=null;

  function setStatus(msg,type=''){
    const el=document.getElementById('simPwaInstallStatus');
    if(!el)return;
    el.textContent=msg;
    el.dataset.type=type;
  }
  function mainButton(){
    return document.getElementById('simPwaInstallMain');
  }
  function floatingButton(){
    let b=document.getElementById('simPwaInstallFloating');
    if(b||isStandalone())return b;
    b=document.createElement('button');
    b.id='simPwaInstallFloating';
    b.type='button';
    b.textContent='⬇ Pasang SIMANTAB';
    b.setAttribute('aria-label','Pasang SIMANTAB Online di perangkat ini');
    b.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9998;border:0;border-radius:999px;padding:11px 16px;background:#0f3f76;color:#fff;font:800 13px system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 10px 28px rgba(15,63,118,.28);cursor:pointer;display:none';
    b.addEventListener('click',promptInstall);
    document.body.appendChild(b);
    return b;
  }
  async function promptInstall(){
    if(isStandalone()){
      setStatus('SIMANTAB sudah terpasang di perangkat ini.','ok');
      return;
    }
    if(!deferredPrompt){
      if(isIos()){
        setStatus('Di iPhone/iPad: buka menu Bagikan di Safari lalu pilih “Tambahkan ke Layar Utama”.','info');
      }else{
        setStatus('Jika tombol instalasi belum tersedia, buka menu browser lalu pilih “Install app” / “Pasang aplikasi”.','info');
      }
      return;
    }
    deferredPrompt.prompt();
    const choice=await deferredPrompt.userChoice;
    setStatus(choice?.outcome==='accepted'?'SIMANTAB sedang dipasang.':'Instalasi dibatalkan.',choice?.outcome==='accepted'?'ok':'');
    deferredPrompt=null;
    const b=floatingButton(); if(b)b.style.display='none';
    const m=mainButton(); if(m)m.disabled=true;
  }
  function readyPrompt(e){
    e.preventDefault();
    deferredPrompt=e;
    const b=floatingButton(); if(b)b.style.display='block';
    const m=mainButton();
    if(m){m.disabled=false;m.textContent='⬇ Pasang SIMANTAB';}
    setStatus('Perangkat siap memasang SIMANTAB sebagai aplikasi.','ok');
  }

  window.addEventListener('beforeinstallprompt',readyPrompt);
  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    const b=document.getElementById('simPwaInstallFloating'); if(b)b.remove();
    const m=mainButton(); if(m){m.disabled=true;m.textContent='✓ SIMANTAB Terpasang';}
    setStatus('SIMANTAB berhasil dipasang.','ok');
  });

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}),{once:true});
  }

  function init(){
    if(isStandalone()){
      const m=mainButton(); if(m){m.disabled=true;m.textContent='✓ SIMANTAB Terpasang';}
      setStatus('SIMANTAB sudah berjalan sebagai aplikasi.','ok');
    }else{
      floatingButton();
      const m=mainButton();
      if(m){
        m.addEventListener('click',promptInstall);
        if(isIos()){
          m.disabled=false;
          m.textContent='Lihat Cara Pasang di iPhone/iPad';
          setStatus('Safari iPhone/iPad menggunakan menu Bagikan → Tambahkan ke Layar Utama.','info');
        }else{
          m.disabled=!deferredPrompt;
          if(!deferredPrompt)setStatus('Menunggu browser menyiapkan opsi instalasi…','info');
        }
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.__simantabPwaInstall={version:2,promptInstall,isStandalone};
})();