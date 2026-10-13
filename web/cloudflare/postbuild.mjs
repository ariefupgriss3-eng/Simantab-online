import fs from 'node:fs/promises';
import path from 'node:path';

const output = '.vercel/output/static';
const htmlPath = path.join(output, 'index.html');
const modulePath = path.join(output, 'pengawas-menu-scope.js');
let html = await fs.readFile(htmlPath, 'utf8');
const module = await fs.readFile(modulePath, 'utf8');
const legacyMenu = await fs.readFile(path.join(output, 'legacy-shell-restore.js'), 'utf8');
const rgtkMenu = await fs.readFile(path.join(output, 'rgtk-monitoring.js'), 'utf8');
const workflowMenu = await fs.readFile(path.join(output, 'team-workflow-authority.js'), 'utf8');
const redistribMenu = await fs.readFile(path.join(output, 'gtk-redistribution-analysis.js'), 'utf8');
const diklatMenu = await fs.readFile(path.join(output, 'diklat-ks-bcks-v32.js'), 'utf8');

function assert(ok, message) {
  if (!ok) throw new Error('[Cloudflare migration build] ' + message);
}
assert(html.includes('SIMANTAB Online'), 'index.html bukan hasil build SIMANTAB.');
assert(html.includes('./pengawas-menu-scope.js?v=6'),
  'Menu Pengawas dengan cache key v5 tidak dimuat.');
assert(module.includes('SIMANTAB_PENGAWAS_MENU_SCOPE_V4_SERVICE_CATALOG'),
  'Kode katalog layanan Pengawas tidak cocok.');
assert(module.includes('simantab:profile-ready'), 'Menu Pengawas masih menggunakan timeout login.');
assert(module.includes("nav.id='pengawasStableNav'") &&
       module.includes("originalNav.style.setProperty('display','none','important')") &&
       module.includes('isolatedNavigation:true'),
  'Menu Pengawas belum dipisahkan dari nav lama.');
assert(!module.includes('observer.observe(nav,{childList:true'),
  'Pengamat menu lama masih dapat menulis ulang sidebar Pengawas.');
assert(module.includes('Riwayat Usulan Saya'),
  'Katalog dan riwayat usulan Pengawas belum tersedia.');
assert(module.includes('discipline_submitter_grants'),
  'Pemeriksaan izin khusus Korwil/Pengawas SMP tidak tersedia.');
assert(legacyMenu.includes("profile().role==='PENGAWAS')return;"),
  'Modul legacy masih berpotensi menambahkan ulang menu Pengawas tanpa henti.');
assert(workflowMenu.includes("if(role()==='PENGAWAS')return;"), 'Workflow masih menambahkan menu sensitif Pengawas tanpa izin.');
assert(rgtkMenu.includes("if(ROLE()==='PENGAWAS')return;"),
  'Modul RGTK masih berpotensi menambahkan ulang menu Pengawas tanpa henti.');
assert(html.includes('./legacy-shell-restore.js?v=3'), 'Cache version modul legacy belum diperbarui.');
assert(html.includes('./rgtk-monitoring.js?v=2'), 'Cache version modul RGTK belum diperbarui.');
assert(redistribMenu.includes("if(['PENGAWAS','KORWIL'].includes(role()))return;"), 'Redistribusi masih menambahkan tombol ke sidebar Pengawas.');
assert(diklatMenu.includes("if(profile().role==='PENGAWAS')return;"), 'Diklat KS/BCKS masih menambahkan tombol ke sidebar Pengawas.');
assert(html.includes('./gtk-redistribution-analysis.js?v=9'), 'Cache Redistribusi GTK Cloudflare belum diganti.');
assert(html.includes('./diklat-ks-bcks-v32.js?v=20'), 'Cache Diklat KS/BCKS Cloudflare belum diganti.');

const required = ['manifest.json', 'sw.js', 'pwa-install.js', 'gtk-redistribution-analysis.js'];
for (const file of required) {
  await fs.access(path.join(output, file));
}


// Cloudflare preview only: signal authentication completion to role modules.
// Original HTML sets window.__simantabProfile before applyProfile/buildNav.
const loginAnchor=/\bapplyProfile\(\);\s*buildNav\(\);/g;
const loginMatches=[...html.matchAll(loginAnchor)];
assert(loginMatches.length===1, 'Titik autentikasi setelah buildNav tidak unik.');
html=html.replace(loginAnchor,match=>match+" window.dispatchEvent(new Event('simantab:profile-ready'));");

// The Cloudflare preview should never cache old login bundles via the PWA worker.
// Production PWA support on Vercel/main remains untouched.
const pwaScript=/<script\s+src=["']\.\/pwa-install\.js\?v=\d+["']\s*><\/script>\s*/gi;
assert(pwaScript.test(html), 'Penginstal PWA tidak ditemukan pada preview.');
html=html.replace(pwaScript,'');
const swRegister="if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}";
assert(html.includes(swRegister), 'Pendaftaran service worker lama tidak ditemukan.');
html=html.replace(swRegister,'');
const previewNoSw=`<script>
/* SIMANTAB_CLOUDFLARE_PREVIEW_NOSW_20261013 */
if('serviceWorker' in navigator){
 navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});
 if(window.caches) caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{});
}
</script>`;
assert(html.includes('</head>'),'HTML head tidak valid.');
html=html.replace('</head>',previewNoSw+'\n</head>');
await fs.writeFile(htmlPath,html,'utf8');
assert(html.includes("simantab:profile-ready"),'Event profil belum terpasang.');
assert(!html.includes("navigator.serviceWorker.register('./sw.js')"),'Registrasi PWA preview masih aktif.');

const headers = `/*
  Cache-Control: no-store
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), payment=(), usb=()

/index.html
  Cache-Control: no-store

/sw.js
  Cache-Control: no-store
`;
await fs.writeFile(path.join(output, '_headers'), headers, 'utf8');
console.log(JSON.stringify({
  cloudflareStaticBuild: 'prepared',
  output,
  menuPengawasVersion: 4,
  menuPengawasCacheVersion: 5,
  supervisorNavigationGuards: ['redistribusi','diklat','workflow','rgtk','legacy'],
  securityHeaders: true,
  check: 'build-time only; not an end-to-end QA approval',
  aiApis: 'separate migration required before production cutover'
}));
