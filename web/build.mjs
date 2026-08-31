import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const SOURCE = 'https://simantab-online.vercel.app/';
const PATCH = 'https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/kp-enhancement.js';
const marker = 'SIMANTAB_KP_SOP_UI_V1';
const externalTagRe = /<script\s+type=["']module["']\s+src=["']\.\/kp-enhancement\.js(?:\?v=\d+)?["']><\/script>\s*/gi;
const FILE_LIMIT = 512000; // 500 KB

async function getText(url, fallback='') {
  try {
    const r = await fetch(url, {headers:{'user-agent':'SIMANTAB-Vercel-Build/1.3'}, cache:'no-store'});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.text();
  } catch(e) {
    console.error('fetch text failed', url, e.message);
    return fallback;
  }
}
async function getBinary(url) {
  try {
    const r=await fetch(url, {headers:{'user-agent':'SIMANTAB-Vercel-Build/1.3'}, cache:'no-store'});
    if(!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch(e) { return null; }
}
function stripBrokenInlineKp(source){
  let html=source,removed=0;
  for(let guard=0;guard<4 && html.includes(marker);guard++){
    const markerPos=html.indexOf(marker),start=html.lastIndexOf('<script type="module">',markerPos),end=html.indexOf('</script>',markerPos);
    if(start<0||end<0) throw new Error('Patch KP lama terdeteksi tetapi batas script tidak dapat dipulihkan.');
    html=html.slice(0,start)+html.slice(end+'</script>'.length); removed++;
  }
  if(html.includes(marker)) throw new Error('Patch KP lama belum bersih sepenuhnya.');
  return {html,removed};
}
function checkModuleSyntax(name, code){
  const path=`/tmp/${name}.mjs`;
  return fs.writeFile(path,code).then(()=>{const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(r.status!==0)throw new Error(`Syntax check ${name} gagal: ${(r.stderr||r.stdout||'').trim()}`)});
}
let html=await getText(SOURCE);
let enhancement=await getText(PATCH);
if(!html||!html.includes('SIMANTAB Online')) throw new Error('Gagal mengambil frontend SIMANTAB produksi.');
if(!enhancement||!enhancement.includes(marker)) throw new Error('Patch frontend KP tidak tersedia.');
const recovered=stripBrokenInlineKp(html); html=recovered.html.replace(externalTagRe,'');
html=html.replaceAll('maksimal 1 MB per berkas','maksimal 500 KB per berkas').replaceAll('maksimal 1 MB per file','maksimal 500 KB per file').replaceAll('batas 1 MB','batas 500 KB').replaceAll('f.size<=1048576',`f.size<=${FILE_LIMIT}`).replaceAll('f.size>1048576',`f.size>${FILE_LIMIT}`);
enhancement=enhancement.replaceAll('1048576',String(FILE_LIMIT)).replaceAll('1 MB','500 KB');
const sbNeedle='const sb = createClient(SUPABASE_URL, SUPABASE_KEY);';
if(!html.includes(sbNeedle)) throw new Error('Anchor Supabase client tidak ditemukan.');
if(!html.includes('window.__simantabSb=sb;')) html=html.replace(sbNeedle,sbNeedle+'\nwindow.__simantabSb=sb;');
const profileNeedle='profile=await ensureProfile();';
if(!html.includes(profileNeedle)) throw new Error('Anchor profil login tidak ditemukan.');
if(!html.includes('profile=await ensureProfile();window.__simantabProfile=profile;')) html=html.replace(profileNeedle,profileNeedle+'window.__simantabProfile=profile;');
const saveProfileNeedle='profile=data;';
if(html.includes(saveProfileNeedle)&&!html.includes('profile=data;window.__simantabProfile=profile;')) html=html.replace(saveProfileNeedle,saveProfileNeedle+'window.__simantabProfile=profile;');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('Tag penutup body tidak ditemukan.');
const kpTag='<script type="module" src="./kp-enhancement.js?v=4"></script>\n';
html=html.slice(0,bodyClose)+kpTag+html.slice(bodyClose);
const mainOpen='<script type="module">',mainScriptStart=html.indexOf(mainOpen),mainScriptEnd=html.indexOf('</script>',mainScriptStart+mainOpen.length),externalKpPos=html.lastIndexOf('kp-enhancement.js?v=4');
if(mainScriptStart<0||mainScriptEnd<0||externalKpPos<=mainScriptEnd) throw new Error('Modul KP tidak berada di luar script utama.');
const mainJs=html.slice(mainScriptStart+mainOpen.length,mainScriptEnd);
await checkModuleSyntax('simantab-main',mainJs); await checkModuleSyntax('simantab-kp',enhancement);
if(!mainJs.includes(`f.size<=${FILE_LIMIT}`)||!mainJs.includes(`f.size>${FILE_LIMIT}`)) throw new Error('Validasi upload generik 500 KB belum terpasang.');
if(enhancement.includes('1048576')||!enhancement.includes('500 KB')) throw new Error('Validasi upload KP 500 KB belum terpasang.');
await fs.mkdir('.vercel/output/static',{recursive:true});
await fs.writeFile('.vercel/output/config.json',JSON.stringify({version:3}));
await fs.writeFile('.vercel/output/static/index.html',html);
await fs.writeFile('.vercel/output/static/kp-enhancement.js',enhancement);
const manifest=await getText(SOURCE+'manifest.json',JSON.stringify({name:'SIMANTAB Online',short_name:'SIMANTAB',start_url:'/',display:'standalone',theme_color:'#0f3f76',background_color:'#f4f7fb'}));
await fs.writeFile('.vercel/output/static/manifest.json',manifest);
const sw=`const CACHE_VERSION='simantab-v10';self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)))})`;
await fs.writeFile('.vercel/output/static/sw.js',sw);
for(const f of ['icon-192.png','icon-512.png']){const b=await getBinary(SOURCE+f);if(b)await fs.writeFile('.vercel/output/static/'+f,b)}
console.log(JSON.stringify({ok:true,recoveredInlineKp:recovered.removed,mainSyntax:true,kpSyntax:true,kpExternal:externalKpPos>mainScriptEnd,uploadLimitBytes:FILE_LIMIT,generic500k:true,kp500k:true,htmlBytes:Buffer.byteLength(html),kpBytes:Buffer.byteLength(enhancement)}));
