/* SIMANTAB_CLOUDFLARE_PWA_INSTALL_V9_LOGIN */
(() => {
  'use strict';
  const APP_VERSION = '9';
  const $ = id => document.getElementById(id);
  const isInstalled = () => window.matchMedia?.('(display-mode: standalone)')?.matches === true || navigator.standalone === true;
  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredPrompt = null;
  let registration = null;
  function status(msg) {
    const el = $('simPwaInstallStatus');
    if (el) el.textContent = msg;
  }
  function buttonLabel() {
    const b = $('simPwaInstallMain');
    if (b) {
      b.disabled = isInstalled();
      b.textContent = isInstalled() ? '✓ SIMANTAB Sudah Terpasang' :
        deferredPrompt ? '⬇ Pasang SIMANTAB Sekarang' : 'Lihat Petunjuk Instalasi';
    }
    const loginButton = $('simPwaLoginInstall');
    if (loginButton) {
      loginButton.disabled = isInstalled();
      loginButton.textContent = isInstalled() ? '✓ SIMANTAB Sudah Terpasang' : '⬇ Pasang Aplikasi SIMANTAB';
    }
  }
  function help() {
    if (isIos()) return 'iPhone/iPad: gunakan Safari → Bagikan → Tambahkan ke Layar Utama.';
    if (/android/i.test(navigator.userAgent)) return 'Android: Chrome → menu ⋮ → Instal aplikasi atau Tambahkan ke layar utama.';
    return 'Laptop/PC: Chrome/Edge → ikon Instal aplikasi di bilah alamat atau menu ⋮ → Instal SIMANTAB.';
  }
  async function install() {
    if (isInstalled()) { status('SIMANTAB sudah terpasang di perangkat ini.'); return; }
    if (!deferredPrompt) { status(help()); return; }
    const prompt = deferredPrompt;
    deferredPrompt = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      status(choice?.outcome === 'accepted' ? 'Pemasangan sedang diproses. Cari ikon SIMANTAB di layar utama.' : help());
    } catch (err) {
      status('Browser belum dapat memasang otomatis. ' + help());
    }
    buttonLabel();
  }
  function mountLink() {
    // On the public login screen, offer PWA installation without creating a
    // duplicate login form, exposing passwords, or covering GTK/Operator pages.
    const container = document.querySelector('.loginbox');
    if (!container || $('simPwaLoginLink')) return;
    const row = document.createElement('div');
    row.id = 'simPwaLoginLink';
    row.style.cssText = 'margin:16px 0 3px;padding:14px 12px;border:1px solid #c6d7e8;background:#f1f7fe;border-radius:14px;text-align:center';

    const heading = document.createElement('div');
    heading.textContent = '📲 SIMANTAB dalam aplikasi';
    heading.style.cssText = 'font-weight:800;color:#0f3f76;font-size:14px;margin:0 0 8px';

    const installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.id = 'simPwaLoginInstall';
    installButton.textContent = '⬇ Pasang Aplikasi SIMANTAB';
    installButton.style.cssText = 'display:block;width:100%;background:#0f3f76;color:#fff;border:0;border-radius:10px;padding:11px 14px;font-weight:800;cursor:pointer';
    installButton.addEventListener('click', install);

    const guide = document.createElement('a');
    guide.href = './panduan-instal.html';
    guide.textContent = 'Lihat panduan instalasi Android, iPhone & laptop';
    guide.style.cssText = 'display:inline-block;margin-top:11px;color:#1767b3;font-size:12px;text-decoration:underline;font-weight:700';

    const feedback = document.createElement('div');
    feedback.id = 'simPwaInstallStatus';
    feedback.setAttribute('role','status');
    feedback.setAttribute('aria-live','polite');
    feedback.style.cssText = 'margin-top:8px;color:#475569;font-size:12px;line-height:1.45';

    row.appendChild(heading);
    row.appendChild(installButton);
    row.appendChild(guide);
    row.appendChild(feedback);
    container.appendChild(row);
    if (isInstalled()) {
      installButton.textContent = '✓ SIMANTAB Sudah Terpasang';
      installButton.disabled = true;
    }
  }
  async function registerWorker() {
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
    try {
      registration = await navigator.serviceWorker.register('./sw.js?v=9', {scope:'./', updateViaCache:'none'});
      registration.update().catch(() => {});
    } catch (err) {
      console.warn('SIMANTAB PWA registration unavailable:', err?.message || String(err));
    }
  }
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    buttonLabel();
    status('SIMANTAB siap dipasang sebagai aplikasi.');
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    buttonLabel();
    status('SIMANTAB telah berhasil terpasang.');
  });
  function init() {
    registerWorker();
    mountLink();
    const btn = $('simPwaInstallMain');
    if (btn) btn.addEventListener('click', install);
    buttonLabel();
    status(isInstalled() ? 'SIMANTAB sudah berjalan sebagai aplikasi.' : help());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  window.__simantabPwaInstall = {version: APP_VERSION, isInstalled, install, checkUpdate: () => registration?.update()};
})();