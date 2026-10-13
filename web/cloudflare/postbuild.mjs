import fs from 'node:fs/promises';
import path from 'node:path';

const output = '.vercel/output/static';
const htmlPath = path.join(output, 'index.html');
const modulePath = path.join(output, 'pengawas-menu-scope.js');
const html = await fs.readFile(htmlPath, 'utf8');
const module = await fs.readFile(modulePath, 'utf8');

function assert(ok, message) {
  if (!ok) throw new Error('[Cloudflare migration build] ' + message);
}
assert(html.includes('SIMANTAB Online'), 'index.html bukan hasil build SIMANTAB.');
assert(html.includes('./pengawas-menu-scope.js?v=4'),
  'Menu Pengawas versi 4 tidak dimuat.');
assert(module.includes('SIMANTAB_PENGAWAS_MENU_SCOPE_V4_SERVICE_CATALOG'),
  'Kode katalog layanan Pengawas tidak cocok.');
assert(module.includes('Riwayat Usulan Saya'),
  'Katalog dan riwayat usulan Pengawas belum tersedia.');
assert(module.includes('discipline_submitter_grants'),
  'Pemeriksaan izin khusus Korwil/Pengawas SMP tidak tersedia.');

const required = ['manifest.json', 'sw.js', 'pwa-install.js', 'gtk-redistribution-analysis.js'];
for (const file of required) {
  await fs.access(path.join(output, file));
}

const headers = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), payment=(), usb=()

/index.html
  Cache-Control: no-cache, must-revalidate

/sw.js
  Cache-Control: no-cache, must-revalidate
`;
await fs.writeFile(path.join(output, '_headers'), headers, 'utf8');
console.log(JSON.stringify({
  cloudflareStaticBuild: 'prepared',
  output,
  menuPengawasVersion: 4,
  securityHeaders: true,
  check: 'build-time only; not an end-to-end QA approval',
  aiApis: 'separate migration required before production cutover'
}));
