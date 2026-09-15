import fs from 'node:fs/promises';

// Security wrapper for the legacy SIMANTAB build chain.
// 1) Bootstrap the next release from the current public production alias.
//    The legacy build chain patches the previous known-good frontend forward.
// 2) Never download build modules from the mutable GitHub `main` branch.
//    Use files from the exact checkout/commit being built instead.

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
          'x-simantab-build-source': 'local-checkout'
        }
      });
    } catch (error) {
      throw new Error(`Required local build module ${localName} is missing: ${error?.message || error}`);
    }
  }

  if (url.startsWith(PROD_PREFIX)) {
    return nativeFetch(input, { ...init, redirect: 'follow' });
  }

  return nativeFetch(input, init);
};

console.log(JSON.stringify({
  securityBuild: true,
  productionBootstrap: 'current-production-alias',
  githubBuildModules: 'local-checkout'
}));

await import('./build-activity-access.mjs');
