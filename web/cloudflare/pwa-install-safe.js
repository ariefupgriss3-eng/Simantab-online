/* SIMANTAB_CLOUDFLARE_PWA_INSTALL_V8 */
(() => {
  'use strict';
  const APP_VERSION = '8';
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
    if (!b) return;
    b.disabled = isInstalled();
    b.textContent = isInstalled() ? '✓ SIMANTAB Sudah Terpasang' :
      deferredPrompt ? '⬇ Pasang SIMANTAB Sekarang' : 'Lihat Petunjuk Instalasi';
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
    // Do not place a persistent overlay over confidential GTK/Operator workspaces.
    const container = document.querySelector('.loginbox');
    if (!container || $('simPwaLoginLink')) return;
    const row = document.createElement('div');
    row.id = 'simPwaLoginLink';
    row.style.cssText = 'text-align:center;margin:12px 0 4px';
    const link = document.createElement('a');
    link.href = './install.html';
    link.textContent = '📲 Pasang SIMANTAB sebagai Aplikasi';
    link.style.cssText = 'color:#1767b3;font-weight:800;font-size:13px;text-decoration:underline';
    row.appendChild(link);
    container.appendChild(row);
  }
  async function registerWorker() {
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
    try {
      registration = await navigator.serviceWorker.register('./sw.js?v=8', {scope:'./', updateViaCache:'none'});
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