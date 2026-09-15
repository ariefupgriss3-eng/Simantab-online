import fs from 'node:fs/promises';

// Preview-only reconstruction wrapper for the pre-restoration SIMANTAB structure.
// The historical build chain is kept intact, but its base HTML is sourced from
// the current public production alias and normalized only enough to satisfy the
// anchors expected by the 11 Sep 2026 builder. All GitHub modules are read from
// this exact branch checkout, never from mutable remote main.

const PROD_PREFIX = 'https://simantab-online.vercel.app/';
const RAW_PREFIX = 'https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/';
const nativeFetch = globalThis.fetch.bind(globalThis);

function requestUrl(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return String(input?.url || input);
}

function localPatchName(urlText) {
  if (!urlText.startsWith(RAW_PREFIX)) return null;
  const parsed = new URL(urlText);
  const marker = '/ariefupgriss3-eng/Simantab-online/main/web/';
  const pos = parsed.pathname.indexOf(marker);
  if (pos < 0) return null;
  const rel = decodeURIComponent(parsed.pathname.slice(pos + marker.length));
  if (!/^[A-Za-z0-9._-]+$/.test(rel)) throw new Error('Unsafe build module path blocked: ' + rel);
  return rel;
}

function normalizeBaseHtml(html) {
  if (!html.includes('SIMANTAB Online')) throw new Error('Base frontend SIMANTAB tidak valid.');

  // The restored UI no longer declares DINAS_ROLES, while the historical
  // builder expects that anchor before replacing it with the final hierarchy.
  if (!/const DINAS_ROLES=\[[^;]+\];/.test(html)) {
    const roleMatch = html.match(/const ROLE_LABEL=\{[^;]+\};/);
    if (!roleMatch) throw new Error('ROLE_LABEL base tidak ditemukan.');
    const compatibilityRoles = "const DINAS_ROLES=['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN','STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN','STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK','PENGAWAS'];";
    html = html.replace(roleMatch[0], roleMatch[0] + '\n' + compatibilityRoles);
  }
  return html;
}

globalThis.fetch = async (input, init = {}) => {
  const url = requestUrl(input);

  const localName = localPatchName(url);
  if (localName) {
    try {
      const body = await fs.readFile(new URL('./' + localName, import.meta.url));
      return new Response(body, {
        status: 200,
        headers: {
          'content-type': localName.endsWith('.js') || localName.endsWith('.mjs')
            ? 'text/javascript; charset=utf-8'
            : 'application/octet-stream',
          'x-simantab-build-source': 'branch-checkout'
        }
      });
    } catch (error) {
      throw new Error(`Required local build module ${localName} is missing: ${error?.message || error}`);
    }
  }

  if (url.startsWith(PROD_PREFIX)) {
    const response = await nativeFetch(input, { ...init, cache: 'no-store', redirect: 'follow' });
    if (!response.ok) return response;
    const suffix = url.slice(PROD_PREFIX.length);
    const type = response.headers.get('content-type') || '';
    if ((suffix === '' || suffix.startsWith('?')) && type.includes('text/html')) {
      const html = normalizeBaseHtml(await response.text());
      return new Response(html, {
        status: response.status,
        headers: { 'content-type': 'text/html; charset=utf-8', 'x-simantab-base': 'current-production-normalized' }
      });
    }
    return response;
  }

  return nativeFetch(input, init);
};

console.log(JSON.stringify({
  reconstructionPreview: true,
  sourceSnapshot: '754730b-2026-09-11',
  productionBootstrap: 'current-production-normalized',
  githubBuildModules: 'branch-checkout'
}));

await import('./build-activity-access.mjs');

// Preserve the two fixes proven necessary during today's restoration.
const outputPath = '.vercel/output/static/index.html';
let html = await fs.readFile(outputPath, 'utf8');

// A) Kelola Pengguna freeze fix: avoid self-triggering subtree mutation loop.
const badHeading = "const heading=$('usersBody')?.querySelector('h3');if(heading)heading.textContent='Buat Akun Dinas/Sekolah';";
const safeHeading = "const heading=$('usersBody')?.querySelector('h3');if(heading&&heading.textContent!=='Buat Akun Dinas/Sekolah')heading.textContent='Buat Akun Dinas/Sekolah';";
const badObserver = "new MutationObserver(enhanceAccountForm).observe($('usersBody'),{childList:true,subtree:true});";
const safeObserver = "new MutationObserver(enhanceAccountForm).observe($('usersBody'),{childList:true});";
if (html.includes(badHeading)) html = html.replace(badHeading, safeHeading);
if (html.includes(badObserver)) html = html.replace(badObserver, safeObserver);

// B) Kepala Sekolah belongs to the school/GTK login side, not Dinas.
const oldChannelHelper = "const isDinas=()=>profile && profile.role!=='GTK';";
const newChannelHelper = "const isGtkSide=()=>profile && ['GTK','KEPALA_SEKOLAH'].includes(profile.role);const isDinas=()=>profile && !isGtkSide();";
if (html.includes(oldChannelHelper)) html = html.replace(oldChannelHelper, newChannelHelper);
if (html.includes(newChannelHelper)) {
  const channelReplacements = [
    ["if(channel==='GTK' && profile.role!=='GTK')", "if(channel==='GTK' && !isGtkSide())"],
    ["if(channel==='DINAS' && profile.role==='GTK')", "if(channel==='DINAS' && isGtkSide())"],
    ["if(profile.role==='GTK'){", "if(isGtkSide()){"],
    ["${profile.role==='GTK'?", "${isGtkSide()?"],
    ["showTab(profile.role==='GTK'?'status':'sk')", "showTab(isGtkSide()?'status':'sk')"]
  ];
  for (const [from, to] of channelReplacements) html = html.split(from).join(to);
}

await fs.writeFile(outputPath, html);

console.log(JSON.stringify({
  reconstructionPreviewReady: true,
  preservedRestoredDatabase: true,
  kelolaPenggunaFreezeFix: html.includes(safeObserver) || !html.includes(badObserver),
  kepalaSekolahLoginChannel: html.includes("['GTK','KEPALA_SEKOLAH']") ? 'GTK' : 'historical-module',
  productionUntouched: true
}));
