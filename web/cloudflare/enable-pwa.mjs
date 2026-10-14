import fs from 'node:fs/promises';
import path from 'node:path';

// Runs AFTER Cloudflare's existing postbuild: preserves all institutional role,
// scope, RLS, and operator QA assertions while replacing preview's no-SW opt-out.
const root = '.vercel/output/static';
const indexPath = path.join(root, 'index.html');
let html = await fs.readFile(indexPath, 'utf8');
const marker = /<script>\s*\/\* SIMANTAB_CLOUDFLARE_PREVIEW_NOSW_20261013 \*\/[\s\S]*?<\/script>\s*/g;
const hits = [...html.matchAll(marker)];
if (hits.length !== 1) throw new Error('Expected exactly one Cloudflare preview SW cleanup script.');
html = html.replace(marker, '');
if (!html.includes('</body>')) throw new Error('SIMANTAB body not found.');
if (html.includes("navigator.serviceWorker.register('./sw.js')")) throw new Error('Unsafe legacy SW registration still present.');
html = html.replace(/<script\s+src=["']\.\/pwa-install\.js\?v=\d+["']\s*><\/script>\s*/gi, '');
html = html.replace('</body>', '<script src="./pwa-install.js?v=8"></script>\n</body>');
if (html.split('./pwa-install.js?v=8').length !== 2) throw new Error('PWA install link must occur once.');
const sourceDir = new URL('./', import.meta.url);
const safeWorker = await fs.readFile(new URL('sw-safe.js', sourceDir), 'utf8');
const installer = await fs.readFile(new URL('pwa-install-safe.js', sourceDir), 'utf8');
const offline = await fs.readFile(new URL('offline.html', sourceDir), 'utf8');
if (!safeWorker.includes('SIMANTAB_CLOUDFLARE_SAFE_SW_V8')) throw new Error('Privacy-safe worker marker missing.');
if (!installer.includes('SIMANTAB_CLOUDFLARE_PWA_INSTALL_V8')) throw new Error('Installer marker missing.');
if (safeWorker.includes('cache.put(event.request') || safeWorker.includes('caches.match(event.request')) throw new Error('Do not cache GTK requests.');
await fs.writeFile(path.join(root, 'sw.js'), safeWorker, 'utf8');
await fs.writeFile(path.join(root, 'pwa-install.js'), installer, 'utf8');
await fs.writeFile(path.join(root, 'offline.html'), offline, 'utf8');
const installPath = path.join(root, 'install.html');
let installHtml = await fs.readFile(installPath, 'utf8');
installHtml = installHtml.replaceAll('SIMANTAB Online v6', 'SIMANTAB Online');
installHtml = installHtml.replaceAll('SIMANTAB v6', 'SIMANTAB');
installHtml = installHtml.replaceAll('pwa-install.js?v=6', 'pwa-install.js?v=8');
installHtml = installHtml.replace('Menyiapkan instalasi…', 'Lihat Petunjuk Instalasi');
installHtml = installHtml.replace('type="button" disabled>', 'type="button">');
if (!installHtml.includes('pwa-install.js?v=8')) throw new Error('Install page missing secure installer.');
await fs.writeFile(installPath, installHtml, 'utf8');
const manifestPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
manifest.id = '/';
manifest.scope = '/';
manifest.start_url = '/';
manifest.display = 'standalone';
manifest.description = 'Sistem Informasi Manajemen Ketenagaan Disdikbud Kabupaten Batang. Akses data GTK memerlukan internet.';
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
await fs.writeFile(indexPath, html, 'utf8');
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

/install.html
  Cache-Control: no-store

/pwa-install.js
  Cache-Control: no-store

/manifest.json
  Cache-Control: no-store

/offline.html
  Cache-Control: no-store
`;
await fs.writeFile(path.join(root, '_headers'), headers, 'utf8');
console.log(JSON.stringify({cloudflareSecurePwa: true, version: 8, startUrl:'/', installPage:'/install.html', noSensitiveCache:true, removedPreviewNoSw:true}));
