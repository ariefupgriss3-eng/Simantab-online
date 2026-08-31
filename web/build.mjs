import fs from 'node:fs/promises';

// Known-good SIMANTAB deployment from immediately before the KP UI patch.
// Do not use the production alias as build source: it can recursively copy a broken deployment.
const SOURCE = 'https://simantab-online-ibyhlusfk-mariefrohman-6773.vercel.app/';
const PATCH = 'https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/kp-enhancement.js';
const marker = 'SIMANTAB_KP_SOP_UI_V1';

async function getText(url, fallback='') {
  try {
    const r = await fetch(url, {headers:{'user-agent':'SIMANTAB-Vercel-Build/1.1'}, cache:'no-store'});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.text();
  } catch(e) {
    console.error('fetch text failed', url, e.message);
    return fallback;
  }
}
async function getBinary(url) {
  try {
    const r=await fetch(url, {headers:{'user-agent':'SIMANTAB-Vercel-Build/1.1'}, cache:'no-store'});
    if(!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch(e) { return null; }
}

let html = await getText(SOURCE);
const enhancement = await getText(PATCH);
if(!html || !html.includes('SIMANTAB Online')) throw new Error('Gagal mengambil basis frontend SIMANTAB yang stabil.');
if(html.includes(marker)) throw new Error('Basis frontend sudah mengandung patch KP; build dihentikan untuk mencegah injeksi berulang.');
if(!enhancement || !enhancement.includes(marker)) throw new Error('Patch frontend KP tidak tersedia.');

// Expose only the objects required by the separately loaded KP module.
const sbNeedle = 'const sb = createClient(SUPABASE_URL, SUPABASE_KEY);';
if(!html.includes(sbNeedle)) throw new Error('Anchor Supabase client tidak ditemukan.');
html = html.replace(sbNeedle, sbNeedle + '\nwindow.__simantabSb=sb;');

const profileNeedle = 'profile=await ensureProfile();';
if(!html.includes(profileNeedle)) throw new Error('Anchor profil login tidak ditemukan.');
html = html.replace(profileNeedle, profileNeedle + 'window.__simantabProfile=profile;');

const saveProfileNeedle = 'profile=data;';
if(html.includes(saveProfileNeedle)) html = html.replace(saveProfileNeedle, saveProfileNeedle + 'window.__simantabProfile=profile;');

// IMPORTANT: inject before the LAST closing body tag. The app contains the text
// "</body>" inside a print-template string, so String.replace('</body>', ...)
// corrupts the main JavaScript module and prevents login.
const bodyClose = html.lastIndexOf('</body>');
if(bodyClose < 0) throw new Error('Tag penutup body tidak ditemukan.');
const kpTag = '<script type="module" src="./kp-enhancement.js?v=2"></script>\n';
html = html.slice(0, bodyClose) + kpTag + html.slice(bodyClose);

// Structural guards: KP marker must not be embedded in the main inline script.
const mainScriptStart = html.indexOf('<script type="module">');
const mainScriptEnd = html.indexOf('</script>', mainScriptStart);
const externalKpPos = html.lastIndexOf('kp-enhancement.js?v=2');
if(mainScriptStart < 0 || mainScriptEnd < 0 || externalKpPos <= mainScriptEnd) {
  throw new Error('Struktur script tidak aman; modul KP tidak berada di luar script utama.');
}
if(!html.includes('window.__simantabSb=sb;') || !html.includes('window.__simantabProfile=profile;')) {
  throw new Error('Global bridge SIMANTAB untuk modul KP tidak lengkap.');
}

await fs.mkdir('.vercel/output/static', {recursive:true});
await fs.writeFile('.vercel/output/config.json', JSON.stringify({version:3}));
await fs.writeFile('.vercel/output/static/index.html', html);
await fs.writeFile('.vercel/output/static/kp-enhancement.js', enhancement);

const manifest = await getText(SOURCE+'manifest.json', JSON.stringify({name:'SIMANTAB Online',short_name:'SIMANTAB',start_url:'/',display:'standalone',theme_color:'#0f3f76',background_color:'#f4f7fb'}));
await fs.writeFile('.vercel/output/static/manifest.json', manifest);

// Network-first SW and purge old caches so clients do not keep the broken JS/HTML.
const sw = `const CACHE_VERSION='simantab-v8';self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)))})`;
await fs.writeFile('.vercel/output/static/sw.js', sw);
for (const f of ['icon-192.png','icon-512.png']) { const b=await getBinary(SOURCE+f); if(b) await fs.writeFile('.vercel/output/static/'+f,b); }

console.log(JSON.stringify({
  ok:true,
  sourceStable:!html.slice(0,mainScriptEnd).includes(marker),
  kpExternal:externalKpPos>mainScriptEnd,
  globals:html.includes('__simantabSb')&&html.includes('__simantabProfile'),
  htmlBytes:Buffer.byteLength(html),
  kpBytes:Buffer.byteLength(enhancement)
}));
