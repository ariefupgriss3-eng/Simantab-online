import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const SOURCE = 'https://simantab-online.vercel.app/';
const KP_PATCH = 'https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/kp-enhancement.js';
const PTK_PATCH = 'https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/ptk-swasta-enhancement.js';
const SA_PATCH = 'https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/super-admin-enhancement.js';
const KP_MARKER = 'SIMANTAB_KP_SOP_UI_V1';
const PTK_MARKER = 'SIMANTAB_PTK_SWASTA_UI_V1';
const SA_MARKER = 'SIMANTAB_SUPER_ADMIN_COMMAND_CENTER_V1';
const externalKpTagRe = /<script\s+type=["']module["']\s+src=["']\.\/kp-enhancement\.js(?:\?v=\d+)?["']><\/script>\s*/gi;
const externalPtkTagRe = /<script\s+type=["']module["']\s+src=["']\.\/ptk-swasta-enhancement\.js(?:\?v=\d+)?["']><\/script>\s*/gi;
const externalSaTagRe = /<script\s+type=["']module["']\s+src=["']\.\/super-admin-enhancement\.js(?:\?v=\d+)?["']><\/script>\s*/gi;
const FILE_LIMIT = 512000;

async function getText(url, fallback='') {
  try {
    const r = await fetch(url, {headers:{'user-agent':'SIMANTAB-Vercel-Build/1.6'}, cache:'no-store'});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.text();
  } catch(e) {
    console.error('fetch text failed', url, e.message);
    return fallback;
  }
}
async function getBinary(url) {
  try {
    const r=await fetch(url, {headers:{'user-agent':'SIMANTAB-Vercel-Build/1.6'}, cache:'no-store'});
    if(!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch(e) { return null; }
}
function stripBrokenInline(source, marker, label){
  let html=source,removed=0;
  for(let guard=0;guard<4 && html.includes(marker);guard++){
    const markerPos=html.indexOf(marker),start=html.lastIndexOf('<script type="module">',markerPos),end=html.indexOf('</script>',markerPos);
    if(start<0||end<0) throw new Error(`Patch ${label} lama terdeteksi tetapi batas script tidak dapat dipulihkan.`);
    html=html.slice(0,start)+html.slice(end+'</script>'.length); removed++;
  }
  if(html.includes(marker)) throw new Error(`Patch ${label} lama belum bersih sepenuhnya.`);
  return {html,removed};
}
function checkModuleSyntax(name, code){
  const path=`/tmp/${name}.mjs`;
  return fs.writeFile(path,code).then(()=>{const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(r.status!==0)throw new Error(`Syntax check ${name} gagal: ${(r.stderr||r.stdout||'').trim()}`)});
}
let html=await getText(SOURCE);
let kpEnhancement=await getText(KP_PATCH);
let ptkEnhancement=await getText(PTK_PATCH);
let saEnhancement=await getText(SA_PATCH);
if(!html||!html.includes('SIMANTAB Online')) throw new Error('Gagal mengambil frontend SIMANTAB produksi.');
if(!kpEnhancement||!kpEnhancement.includes(KP_MARKER)) throw new Error('Patch frontend KP tidak tersedia.');
if(!ptkEnhancement||!ptkEnhancement.includes(PTK_MARKER)) throw new Error('Patch frontend PTK Baru Swasta tidak tersedia.');
if(!saEnhancement||!saEnhancement.includes(SA_MARKER)) throw new Error('Patch frontend Super Admin tidak tersedia.');
const recoveredKp=stripBrokenInline(html,KP_MARKER,'KP'); html=recoveredKp.html;
const recoveredPtk=stripBrokenInline(html,PTK_MARKER,'PTK Baru Swasta'); html=recoveredPtk.html;
const recoveredSa=stripBrokenInline(html,SA_MARKER,'Super Admin'); html=recoveredSa.html;
html=html.replace(externalKpTagRe,'').replace(externalPtkTagRe,'').replace(externalSaTagRe,'');
html=html.replaceAll('maksimal 1 MB per berkas','maksimal 500 KB per berkas').replaceAll('maksimal 1 MB per file','maksimal 500 KB per file').replaceAll('batas 1 MB','batas 500 KB').replaceAll('f.size<=1048576',`f.size<=${FILE_LIMIT}`).replaceAll('f.size>1048576',`f.size>${FILE_LIMIT}`);

const oldRoleLabel="const ROLE_LABEL={KABID:'Kabid Ketenagaan',KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP',SUBKOOR_TK:'Subkoor PPTK TK/PAUD',STAFF_TPG:'Staff TPG/Tamsil',PENGAWAS:'Pengawas',KEPALA_SEKOLAH:'Kepala Sekolah',GTK:'GTK'};";
const newRoleLabel="const ROLE_LABEL={SUPER_ADMIN:'Super Admin SIMANTAB',KABID:'Kabid Ketenagaan',KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP',SUBKOOR_TK:'Subkoor PPTK TK/PAUD',STAFF_TPG:'Staff TPG/Tamsil',PENGAWAS:'Pengawas',KEPALA_SEKOLAH:'Kepala Sekolah',GTK:'GTK'};";
if(html.includes(oldRoleLabel)) html=html.replace(oldRoleLabel,newRoleLabel);
else if(!html.includes("SUPER_ADMIN:'Super Admin SIMANTAB'")) throw new Error('Anchor ROLE_LABEL tidak ditemukan.');

const oldDinas="const DINAS_ROLES=['KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_TPG','PENGAWAS'];";
const newDinas="const DINAS_ROLES=['SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_TPG','PENGAWAS'];";
if(html.includes(oldDinas)) html=html.replace(oldDinas,newDinas);
else if(!html.includes("const DINAS_ROLES=['SUPER_ADMIN'")) throw new Error('Anchor DINAS_ROLES tidak ditemukan.');

html=html.replace(
  '<b>Inisialisasi pertama:</b> daftarkan akun Kabid/admin lebih dulu. Akun pertama otomatis menjadi <b>Kabid + Admin SIMANTAB</b>. Akun berikutnya otomatis menjadi GTK dan dapat diubah perannya dari menu <b>Kelola Pengguna</b>.',
  '<b>Pendaftaran akun:</b> akun baru otomatis masuk sebagai GTK. <b>Super Admin SIMANTAB</b> menetapkan role dan hak akses melalui menu <b>Kelola Pengguna</b>. Akun Super Admin dan Kabid menggunakan email yang berbeda.'
);

kpEnhancement=kpEnhancement.replaceAll('1048576',String(FILE_LIMIT)).replaceAll('1 MB','500 KB');
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
const moduleTags='<script type="module" src="./kp-enhancement.js?v=4"></script>\n<script type="module" src="./ptk-swasta-enhancement.js?v=1"></script>\n<script type="module" src="./super-admin-enhancement.js?v=1"></script>\n';
html=html.slice(0,bodyClose)+moduleTags+html.slice(bodyClose);
const mainOpen='<script type="module">',mainScriptStart=html.indexOf(mainOpen),mainScriptEnd=html.indexOf('</script>',mainScriptStart+mainOpen.length),externalKpPos=html.lastIndexOf('kp-enhancement.js?v=4'),externalPtkPos=html.lastIndexOf('ptk-swasta-enhancement.js?v=1'),externalSaPos=html.lastIndexOf('super-admin-enhancement.js?v=1');
if(mainScriptStart<0||mainScriptEnd<0||externalKpPos<=mainScriptEnd||externalPtkPos<=mainScriptEnd||externalSaPos<=mainScriptEnd) throw new Error('Modul enhancement tidak berada di luar script utama.');
const mainJs=html.slice(mainScriptStart+mainOpen.length,mainScriptEnd);
await checkModuleSyntax('simantab-main',mainJs);
await checkModuleSyntax('simantab-kp',kpEnhancement);
await checkModuleSyntax('simantab-ptk-swasta',ptkEnhancement);
await checkModuleSyntax('simantab-super-admin',saEnhancement);
if(!mainJs.includes(`f.size<=${FILE_LIMIT}`)||!mainJs.includes(`f.size>${FILE_LIMIT}`)) throw new Error('Validasi upload generik 500 KB belum terpasang.');
if(!mainJs.includes("SUPER_ADMIN:'Super Admin SIMANTAB'")||!mainJs.includes("const DINAS_ROLES=['SUPER_ADMIN'")) throw new Error('Role Super Admin belum terpasang di frontend.');
if(kpEnhancement.includes('1048576')||!kpEnhancement.includes('500 KB')) throw new Error('Validasi upload KP 500 KB belum terpasang.');
if(!ptkEnhancement.includes('500 KB')||!ptkEnhancement.includes(String(FILE_LIMIT))) throw new Error('Validasi upload PTK Baru Swasta 500 KB belum terpasang.');
await fs.mkdir('.vercel/output/static',{recursive:true});
await fs.writeFile('.vercel/output/config.json',JSON.stringify({version:3}));
await fs.writeFile('.vercel/output/static/index.html',html);
await fs.writeFile('.vercel/output/static/kp-enhancement.js',kpEnhancement);
await fs.writeFile('.vercel/output/static/ptk-swasta-enhancement.js',ptkEnhancement);
await fs.writeFile('.vercel/output/static/super-admin-enhancement.js',saEnhancement);
const manifest=await getText(SOURCE+'manifest.json',JSON.stringify({name:'SIMANTAB Online',short_name:'SIMANTAB',start_url:'/',display:'standalone',theme_color:'#0f3f76',background_color:'#f4f7fb'}));
await fs.writeFile('.vercel/output/static/manifest.json',manifest);
const sw=`const CACHE_VERSION='simantab-v13';self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)))})`;
await fs.writeFile('.vercel/output/static/sw.js',sw);
for(const f of ['icon-192.png','icon-512.png']){const b=await getBinary(SOURCE+f);if(b)await fs.writeFile('.vercel/output/static/'+f,b)}
console.log(JSON.stringify({ok:true,recoveredInlineKp:recoveredKp.removed,recoveredInlinePtk:recoveredPtk.removed,recoveredInlineSa:recoveredSa.removed,mainSyntax:true,kpSyntax:true,ptkSyntax:true,saSyntax:true,superAdmin:true,kpExternal:externalKpPos>mainScriptEnd,ptkExternal:externalPtkPos>mainScriptEnd,saExternal:externalSaPos>mainScriptEnd,uploadLimitBytes:FILE_LIMIT,generic500k:true,kp500k:true,ptk500k:true,htmlBytes:Buffer.byteLength(html),kpBytes:Buffer.byteLength(kpEnhancement),ptkBytes:Buffer.byteLength(ptkEnhancement),saBytes:Buffer.byteLength(saEnhancement)}));
