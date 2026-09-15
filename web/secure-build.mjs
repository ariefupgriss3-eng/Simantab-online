import fs from 'node:fs/promises';

// Minimal production hotfix builder.
// Bootstrap from the currently working SIMANTAB production frontend and apply
// only narrowly scoped fixes that are safe against the restored production UI.

const SOURCE = 'https://simantab-online.vercel.app/';
const USER_AGENT = 'SIMANTAB-Vercel-Hotfix/1.1';

async function fetchResponse(path = '') {
  const r = await fetch(SOURCE + path, {
    headers: { 'user-agent': USER_AGENT },
    cache: 'no-store',
    redirect: 'follow'
  });
  if (!r.ok) throw new Error(`Gagal mengambil ${path || 'frontend'}: ${r.status} ${r.statusText}`);
  return r;
}

const response = await fetchResponse();
let html = await response.text();
if (!html.includes('SIMANTAB Online')) throw new Error('Frontend SIMANTAB produksi tidak valid.');

// 1) Kelola Pengguna freeze fix.
const badHeading = "const heading=$('usersBody')?.querySelector('h3');if(heading)heading.textContent='Buat Akun Dinas/Sekolah';";
const safeHeading = "const heading=$('usersBody')?.querySelector('h3');if(heading&&heading.textContent!=='Buat Akun Dinas/Sekolah')heading.textContent='Buat Akun Dinas/Sekolah';";
const badObserver = "new MutationObserver(enhanceAccountForm).observe($('usersBody'),{childList:true,subtree:true});";
const safeObserver = "new MutationObserver(enhanceAccountForm).observe($('usersBody'),{childList:true});";

if (html.includes(badHeading)) html = html.replace(badHeading, safeHeading);
else if (!html.includes(safeHeading)) throw new Error('Anchor heading Kelola Pengguna tidak ditemukan.');

if (html.includes(badObserver)) html = html.replace(badObserver, safeObserver);
else if (!html.includes(safeObserver)) throw new Error('Anchor MutationObserver Kelola Pengguna tidak ditemukan.');

// 2) Channel classification fix.
// Kepala Sekolah is a school-side account and must use Login GTK, not Login Dinas.
const oldChannelHelper = "const isDinas=()=>profile && profile.role!=='GTK';";
const newChannelHelper = "const isGtkSide=()=>profile && ['GTK','KEPALA_SEKOLAH'].includes(profile.role);const isDinas=()=>profile && !isGtkSide();";
if (html.includes(oldChannelHelper)) html = html.replace(oldChannelHelper, newChannelHelper);
else if (!html.includes(newChannelHelper)) throw new Error('Anchor helper kanal pengguna tidak ditemukan.');

const channelReplacements = [
  ["if(channel==='GTK' && profile.role!=='GTK')", "if(channel==='GTK' && !isGtkSide())"],
  ["if(channel==='DINAS' && profile.role==='GTK')", "if(channel==='DINAS' && isGtkSide())"],
  ["if(profile.role==='GTK'){", "if(isGtkSide()){"],
  ["${profile.role==='GTK'?", "${isGtkSide()?"],
  ["showTab(profile.role==='GTK'?'status':'sk')", "showTab(isGtkSide()?'status':'sk')"]
];

for (const [from, to] of channelReplacements) {
  html = html.split(from).join(to);
}

if (!html.includes("const isGtkSide=()=>profile && ['GTK','KEPALA_SEKOLAH'].includes(profile.role)")) {
  throw new Error('Validasi helper kanal GTK/Kepala Sekolah gagal.');
}
if (!html.includes("if(channel==='GTK' && !isGtkSide())") || !html.includes("if(channel==='DINAS' && isGtkSide())")) {
  throw new Error('Validasi pemisahan Login Dinas/GTK gagal.');
}
if (html.includes("if(channel==='GTK' && profile.role!=='GTK')") || html.includes("if(channel==='DINAS' && profile.role==='GTK')")) {
  throw new Error('Logika kanal lama masih tersisa.');
}
if (!html.includes(safeHeading) || !html.includes(safeObserver)) {
  throw new Error('Validasi hotfix Kelola Pengguna gagal.');
}

await fs.mkdir('.vercel/output/static', { recursive: true });
await fs.writeFile('.vercel/output/config.json', JSON.stringify({ version: 3 }));
await fs.writeFile('.vercel/output/static/index.html', html);

for (const asset of ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png']) {
  try {
    const r = await fetchResponse(asset);
    const body = Buffer.from(await r.arrayBuffer());
    await fs.writeFile('.vercel/output/static/' + asset, body);
  } catch (error) {
    if (asset === 'manifest.json' || asset === 'sw.js') throw error;
    console.warn(`Asset opsional ${asset} dilewati: ${error?.message || error}`);
  }
}

console.log(JSON.stringify({
  ok: true,
  buildMode: 'production-hotfix',
  kelolaPenggunaFreezeFix: true,
  kepalaSekolahLoginChannel: 'GTK',
  gtkSideRoles: ['GTK','KEPALA_SEKOLAH'],
  unrelatedApplicationLogicChanged: false
}));
