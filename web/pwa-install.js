/* SIMANTAB_PWA_INSTALL_V4 */
/* SIMANTAB_PWA_INSTALL_V5 */
/* SIMANTAB_PWA_INSTALL_V6 */
(()=>{
  const VERSION='6';
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true;
  const isIos=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredPrompt=null;
  let swRegistration=null;

  function setStatus(msg,type=''){
    const el=document.getElementById('simPwaInstallStatus');
    if(!el)return;
    el.textContent=msg;
    el.dataset.type=type;
  }

  function updateToast(msg){
    let el=document.getElementById('simPwaUpdateToast');
    if(!el){
      el=document.createElement('div');
      el.id='simPwaUpdateToast';
      el.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10000;max-width:min(92vw,560px);background:#0f3f76;color:#fff;border-radius:14px;padding:12px 16px;font:800 13px system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 12px 34px rgba(15,63,118,.32);display:none';
      document.body.appendChild(el);
    }
    el.textContent=msg;
    el.style.display='block';
    clearTimeout(updateToast._timer);
    updateToast._timer=setTimeout(()=>{el.style.display='none'},7000);
  }

  function mainButton(){return document.getElementById('simPwaInstallMain')}

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
      setStatus('SIMANTAB v6 sudah terpasang di perangkat ini.','ok');
      return;
    }
    if(!deferredPrompt){
      if(isIos())setStatus('Di iPhone/iPad: buka menu Bagikan di Safari lalu pilih “Tambahkan ke Layar Utama”.','info');
      else setStatus('Jika tombol instalasi belum tersedia, buka menu browser lalu pilih “Install app” / “Pasang aplikasi”.','info');
      return;
    }
    deferredPrompt.prompt();
    const choice=await deferredPrompt.userChoice;
    setStatus(choice?.outcome==='accepted'?'SIMANTAB v6 sedang dipasang.':'Instalasi dibatalkan.',choice?.outcome==='accepted'?'ok':'');
    deferredPrompt=null;
    const b=floatingButton(); if(b)b.style.display='none';
    const m=mainButton(); if(m)m.disabled=true;
  }

  function readyPrompt(e){
    e.preventDefault();
    deferredPrompt=e;
    const b=floatingButton(); if(b)b.style.display='block';
    const m=mainButton();
    if(m){m.disabled=false;m.textContent='⬇ Pasang SIMANTAB v6'}
    setStatus('Perangkat siap memasang SIMANTAB v6 sebagai aplikasi.','ok');
  }

  async function registerServiceWorker(){
    if(!('serviceWorker' in navigator))return;
    try{
      swRegistration=await navigator.serviceWorker.register('./sw.js?v=6',{scope:'./',updateViaCache:'none'});
      await swRegistration.update().catch(()=>{});

      if(swRegistration.waiting){
        updateToast('Pembaruan SIMANTAB v6 tersedia. Tutup lalu buka kembali aplikasi.');
      }

      swRegistration.addEventListener('updatefound',()=>{
        const worker=swRegistration.installing;
        if(!worker)return;
        worker.addEventListener('statechange',()=>{
          if(worker.state==='installed'&&navigator.serviceWorker.controller){
            updateToast('Versi SIMANTAB terbaru sudah siap. Tutup lalu buka kembali aplikasi.');
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        updateToast('SIMANTAB telah diperbarui ke versi terbaru.');
      });

      setInterval(()=>swRegistration?.update().catch(()=>{}),30*60*1000);
    }catch(e){
      console.warn('PWA service worker gagal didaftarkan:',e);
    }
  }

  window.addEventListener('beforeinstallprompt',readyPrompt);
  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    const b=document.getElementById('simPwaInstallFloating'); if(b)b.remove();
    const m=mainButton(); if(m){m.disabled=true;m.textContent='✓ SIMANTAB v6 Terpasang'}
    setStatus('SIMANTAB v6 berhasil dipasang.','ok');
  });

  function init(){
    registerServiceWorker();
    if(isStandalone()){
      const m=mainButton(); if(m){m.disabled=true;m.textContent='✓ SIMANTAB v6 Terpasang'}
      setStatus('SIMANTAB v6 sudah berjalan sebagai aplikasi.','ok');
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
          if(!deferredPrompt)setStatus('Menunggu browser menyiapkan opsi instalasi SIMANTAB v6…','info');
        }
      }
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.__simantabPwaInstall={version:6,promptInstall,isStandalone,checkUpdate:()=>swRegistration?.update()};
})();