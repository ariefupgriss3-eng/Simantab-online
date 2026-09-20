import fs from 'node:fs/promises';
import path from 'node:path';

const staticDir='.vercel/output/static';
const indexPath=path.join(staticDir,'index.html');
const pwaScript='pwa-install.js';
const icon192='simantab-icon-192.png';
const icon512='simantab-icon-512.svg';
const iconMask='simantab-icon-maskable.svg';

let html=await fs.readFile(indexPath,'utf8');
const png=await fs.readFile(path.join(staticDir,icon192));
const b64=png.toString('base64');

const svg512=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><image href="data:image/png;base64,${b64}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet"/></svg>`;
const svgMask=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0f3f76"/><image href="data:image/png;base64,${b64}" x="46" y="46" width="420" height="420" preserveAspectRatio="xMidYMid meet"/></svg>`;
await fs.writeFile(path.join(staticDir,icon512),svg512);
await fs.writeFile(path.join(staticDir,iconMask),svgMask);

const manifest={
  id:'./',
  name:'SIMANTAB Online',
  short_name:'SIMANTAB',
  description:'Sistem Informasi Manajemen Guru dan Tenaga Kependidikan Kabupaten Batang',
  start_url:'./',
  scope:'./',
  display:'standalone',
  display_override:['window-controls-overlay','standalone'],
  orientation:'any',
  background_color:'#f4f7fb',
  theme_color:'#0f3f76',
  lang:'id-ID',
  categories:['education','government','productivity'],
  icons:[
    {src:'./simantab-icon-192.png?v=2',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'./simantab-icon-512.svg?v=2',sizes:'512x512',type:'image/svg+xml',purpose:'any'},
    {src:'./simantab-icon-maskable.svg?v=2',sizes:'512x512',type:'image/svg+xml',purpose:'maskable'}
  ]
};
await fs.writeFile(path.join(staticDir,'manifest.json'),JSON.stringify(manifest,null,2));

const sw=`const CACHE='simantab-pwa-v2';
const SHELL=['./','./manifest.json','./simantab-icon-192.png?v=2','./simantab-icon-512.svg?v=2','./simantab-icon-maskable.svg?v=2','./pwa-install.js?v=2','./install.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./'))));
  return;
 }
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{})}return r})));
});
`;
await fs.writeFile(path.join(staticDir,'sw.js'),sw);

const installHtml=`<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Pasang SIMANTAB Online</title><meta name="theme-color" content="#0f3f76"><meta name="description" content="Pasang SIMANTAB Online sebagai aplikasi di HP atau laptop.">
<link rel="manifest" href="./manifest.json"><link rel="icon" type="image/png" href="./simantab-icon-192.png?v=2"><link rel="apple-touch-icon" href="./simantab-icon-192.png?v=2">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:linear-gradient(145deg,#071d3a,#0f3f76 55%,#1767b3);color:#0f172a;display:grid;place-items:center;padding:20px}
.card{width:min(720px,100%);background:#fff;border-radius:26px;padding:30px;box-shadow:0 26px 70px rgba(0,0,0,.28)}
.brand{display:flex;align-items:center;gap:16px}.brand img{width:82px;height:82px;border-radius:20px;box-shadow:0 8px 24px rgba(15,63,118,.22)}
h1{margin:0;color:#0f3f76;font-size:clamp(26px,5vw,42px)}.sub{margin:5px 0 0;color:#64748b;font-weight:700}.lead{font-size:17px;line-height:1.6;margin:22px 0}
button,.link{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:14px;padding:14px 20px;font-weight:900;font-size:15px;text-decoration:none;cursor:pointer}.primary{background:#0f3f76;color:#fff}.primary:disabled{opacity:.55;cursor:not-allowed}.link{background:#eef5fb;color:#0f3f76;margin-left:8px}
#simPwaInstallStatus{margin-top:16px;padding:12px 14px;border-radius:12px;background:#f1f5f9;color:#475569;font-weight:700}#simPwaInstallStatus[data-type="ok"]{background:#ecfdf5;color:#166534}
.steps{margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0}.steps b{color:#0f3f76}.steps p{margin:8px 0;color:#475569;line-height:1.5}.foot{margin-top:22px;color:#64748b;font-size:13px;font-weight:700}
@media(max-width:560px){.card{padding:22px}.brand img{width:68px;height:68px}.link{margin:8px 0 0;width:100%}.primary{width:100%}}
</style></head><body><main class="card">
<div class="brand"><img src="./simantab-icon-192.png?v=2" alt="Ikon SIMANTAB"><div><h1>SIMANTAB Online</h1><div class="sub">Dinas Pendidikan dan Kebudayaan Kabupaten Batang</div></div></div>
<p class="lead">Pasang SIMANTAB sebagai aplikasi di <b>HP Android, laptop, atau PC</b>. Setelah terpasang, SIMANTAB dapat dibuka dari ikon aplikasi tanpa mengetik alamat web lagi.</p>
<button id="simPwaInstallMain" class="primary" type="button" disabled>Menyiapkan instalasi…</button><a class="link" href="./">Buka SIMANTAB</a>
<div id="simPwaInstallStatus">Menyiapkan opsi instalasi…</div>
<div class="steps"><p><b>Android (Chrome):</b> tekan “Pasang SIMANTAB”. Jika tombol belum aktif, pilih menu ⋮ → <b>Install app / Tambahkan ke layar utama</b>.</p><p><b>Laptop/PC (Chrome/Edge):</b> tekan “Pasang SIMANTAB” atau gunakan ikon instalasi di sisi kanan address bar.</p><p><b>iPhone/iPad (Safari):</b> pilih <b>Bagikan → Tambahkan ke Layar Utama</b>.</p></div>
<div class="foot">SIMANTAB Online • Bidang Ketenagaan • 2026</div>
</main><script src="./pwa-install.js?v=2"></script></body></html>`;
await fs.writeFile(path.join(staticDir,'install.html'),installHtml);

const installScript=await fs.readFile(new URL('./pwa-install.js',import.meta.url),'utf8');
if(!installScript.includes('SIMANTAB_PWA_INSTALL_V2'))throw new Error('PWA install script tidak valid.');
await fs.writeFile(path.join(staticDir,pwaScript),installScript);

html=html.replace(/<link rel="manifest"[^>]*>\s*/gi,'');
html=html.replace(/<meta name="theme-color"[^>]*>\s*/gi,'');
html=html.replace(/<script[^>]+src="\.\/pwa-install\.js\?v=\d+"[^>]*><\/script>\s*/gi,'');
html=html.replace('</head>',`<link rel="manifest" href="./manifest.json?v=2">
<meta name="theme-color" content="#0f3f76">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="SIMANTAB">
</head>`);
html=html.replace('</body>',`<script src="./pwa-install.js?v=2"></script>
</body>`);
await fs.writeFile(indexPath,html);

console.log(JSON.stringify({pwa:true,version:2,installPage:'install.html',manifest:'manifest.json',serviceWorker:'sw.js',icons:['simantab-icon-192.png','simantab-icon-512.svg','simantab-icon-maskable.svg'],installTargets:['Android','Windows','macOS','ChromeOS','iOS-home-screen']}));