import fs from 'node:fs/promises';

const SOURCE = 'https://simantab-online.vercel.app/';
const PATCH = 'https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/kp-enhancement.js';
const marker = 'SIMANTAB_KP_SOP_UI_V1';

async function getText(url, fallback='') {
  try {
    const r = await fetch(url, {headers:{'user-agent':'SIMANTAB-Vercel-Build/1.0'}, cache:'no-store'});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.text();
  } catch(e) {
    console.error('fetch text failed', url, e.message);
    return fallback;
  }
}
async function getBinary(url) {
  try {
    const r=await fetch(url, {headers:{'user-agent':'SIMANTAB-Vercel-Build/1.0'}, cache:'no-store'});
    if(!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch(e) { return null; }
}

let html = await getText(SOURCE);
const enhancement = await getText(PATCH);
if(!html || !html.includes('SIMANTAB Online')) throw new Error('Gagal mengambil basis frontend SIMANTAB produksi.');
if(!enhancement || !enhancement.includes(marker)) throw new Error('Patch frontend KP tidak tersedia.');

if(!html.includes(marker)) {
  const sbNeedle = 'const sb = createClient(SUPABASE_URL, SUPABASE_KEY);';
  if(!html.includes(sbNeedle)) throw new Error('Anchor Supabase client tidak ditemukan.');
  html = html.replace(sbNeedle, sbNeedle + '\nwindow.__simantabSb=sb;');

  const profileNeedle = 'profile=await ensureProfile();';
  if(!html.includes(profileNeedle)) throw new Error('Anchor profil login tidak ditemukan.');
  html = html.replace(profileNeedle, profileNeedle + 'window.__simantabProfile=profile;');

  const saveProfileNeedle = 'profile=data;';
  if(html.includes(saveProfileNeedle)) html = html.replace(saveProfileNeedle, saveProfileNeedle + 'window.__simantabProfile=profile;');

  html = html.replace('</body>', `<script type="module">\n${enhancement}\n</script>\n</body>`);
}

await fs.mkdir('.vercel/output/static', {recursive:true});
await fs.writeFile('.vercel/output/config.json', JSON.stringify({version:3}));
await fs.writeFile('.vercel/output/static/index.html', html);

const manifest = await getText(SOURCE+'manifest.json', JSON.stringify({name:'SIMANTAB Online',short_name:'SIMANTAB',start_url:'/',display:'standalone',theme_color:'#0f3f76',background_color:'#f4f7fb'}));
await fs.writeFile('.vercel/output/static/manifest.json', manifest);
const sw = `self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));`;
await fs.writeFile('.vercel/output/static/sw.js', sw);
for (const f of ['icon-192.png','icon-512.png']) { const b=await getBinary(SOURCE+f); if(b) await fs.writeFile('.vercel/output/static/'+f,b); }
console.log(JSON.stringify({ok:true,marker:html.includes(marker),globals:html.includes('__simantabSb')&&html.includes('__simantabProfile'),bytes:Buffer.byteLength(html)}));
