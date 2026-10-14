import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

/* SIMANTAB_CLOUDFLARE_LOGIN_SHARE_PREVIEW_V1
 * Render a genuine PNG at build time so WhatsApp, Facebook and other
 * Open Graph consumers do not need SVG support or JavaScript execution.
 * The picture is a REPRESENTATION of the login screen, not an interactive
 * login form. Never embed credentials or person data in social metadata.
 */
const root = '.vercel/output/static';
const BASE = 'https://simantab-cf-preview.m-arief-rohman.workers.dev';
const IMAGE = BASE + '/og-simantab-login.png?v=20261014';
const TITLE = 'SIMANTAB-ONLINE | Login Layanan GTK Kabupaten Batang';
const DESCRIPTION = 'Layanan Dinas Pendidikan dan Kebudayaan Kabupaten Batang. Login Dinas, Operator Korwil/SMP, Sekolah, GTK dan Pengawas.';
const svg = await fs.readFile(new URL('./og-simantab-login.svg', import.meta.url), 'utf8');
if (!svg.includes('Masuk SIMANTAB Online') || !svg.includes('Login Dinas')) {
  throw new Error('Artwork does not represent SIMANTAB login.');
}
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
const rendered = resvg.render();
if (rendered.width !== 1200 || rendered.height !== 630) {
  throw new Error('Invalid OG dimensions: ' + rendered.width + 'x' + rendered.height);
}
const imageBytes = rendered.asPng();
if (imageBytes.length < 1000 || imageBytes.length > 2_000_000) {
  throw new Error('Invalid OG image size: ' + imageBytes.length);
}
await fs.writeFile(path.join(root, 'og-simantab-login.png'), imageBytes);
function safeAttr(v) {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
const metadata = [
  ['property','og:type','website'],
  ['property','og:locale','id_ID'],
  ['property','og:site_name','SIMANTAB-ONLINE'],
  ['property','og:title',TITLE],
  ['property','og:description',DESCRIPTION],
  ['property','og:url',BASE + '/'],
  ['property','og:image',IMAGE],
  ['property','og:image:secure_url',IMAGE],
  ['property','og:image:type','image/png'],
  ['property','og:image:width','1200'],
  ['property','og:image:height','630'],
  ['property','og:image:alt','Pratinjau halaman login SIMANTAB-ONLINE Kabupaten Batang'],
  ['name','twitter:card','summary_large_image'],
  ['name','twitter:title',TITLE],
  ['name','twitter:description',DESCRIPTION],
  ['name','twitter:image',IMAGE],
  ['name','twitter:image:alt','Halaman login SIMANTAB-ONLINE']
].map(([attr,key,value])=>'<meta '+attr+'="'+key+'" content="'+safeAttr(value)+'">').join('\n');
async function apply(file) {
  let html=await fs.readFile(path.join(root,file),'utf8');
  if (!html.includes('</head>')) throw new Error('Missing head for social share: ' + file);
  // Remove earlier platform metadata to prevent crawlers picking an old
  // Vercel logo/thumbnail. Keep other (e.g. viewport) metadata untouched.
  html=html.replace(/<meta\b[^>]*\b(?:property|name)=["'](?:og:[\w:]+|twitter:[\w:]+)["'][^>]*>\s*/gi,'');
  html=html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi,'');
  const canonical=BASE + '/';
  html=html.replace('</head>',
    '<link rel="canonical" href="'+canonical+'">\n' + metadata + '\n</head>');
  if (html.split('property="og:image"').length!==2) {
    throw new Error('OG image must be declared exactly once in ' + file);
  }
  await fs.writeFile(path.join(root,file),html,'utf8');
}
await apply('index.html');
// Keep preview on previously shared /install.html QR/install links.
// The browser still navigates from this page to the actual login screen.
await apply('install.html');
console.log(JSON.stringify({
  cloudflareSocialLoginPreview:true,
  renderedPng:'og-simantab-login.png',
  size:imageBytes.length,
  dimensions:'1200x630',
  pages:['/','/install.html'],
  canonical:BASE + '/',
  webLoginPreserved:true,
  cachedPreviewMayNeedRefresh:true
}));
