/**
 * SIMANTAB Jabfung OCR-only artifact overlay.
 * NOT a production deployer. It never calls Vercel, Supabase, or any AI provider.
 *
 * Usage:
 * node apply-overlay.mjs <baseline-vercel-output-dir> <verified-preview-assets-dir> <new-output-dir> <sha256-of-baseline-index.html>
 *
 * The baseline is an independently downloaded, immutable production Vercel Build
 * Output (including functions, static files and config.json) -- NOT a fresh rebuild.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(dirname, '../../web');
const [baseArg, assetsArg, outputArg, expectedHtmlHash] = process.argv.slice(2);
if (!baseArg || !assetsArg || !outputArg || !/^[a-f0-9]{64}$/i.test(expectedHtmlHash || '')) {
  throw Error('Four arguments required: baseline-dir, extracted-verified-OCR-assets-dir, output-dir, exact-baseline-index-html-sha256');
}
const base = path.resolve(baseArg);
const assets = path.resolve(assetsArg);
const output = path.resolve(outputArg);
const within = (child,parent)=>child===parent||child.startsWith(parent+path.sep);
if (within(output,base) || within(base,output) || within(output,assets) || within(assets,output)) {
  throw Error('Output, baseline and assets must be separate paths.');
}
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => fs.readFile(file);
const getHash = async file => digest(await read(file));
const data = await read(path.join(base,'static/index.html'));
const oldIndex = data.toString('utf8');
if ((await getHash(path.join(base,'static/index.html'))).toLowerCase()!==expectedHtmlHash.toLowerCase()) {
  throw Error('Baseline HTML fingerprint mismatch; refusing deployment artifact mutation.');
}
const config = JSON.parse(await fs.readFile(path.join(base,'config.json'),'utf8'));
if (config.version!==3) throw Error('Expected immutable Vercel Build Output API v3.');
if (!oldIndex.includes('SIMANTAB Online')) throw Error('Not a known SIMANTAB HTML baseline.');
const oldTag='<script type="module" src="./jabfung-jenjang-enhancement.js?v=2"></script>'; // Exact anchor observed at immutable production deployment URL, 13 Oct 2026.
const nextTag='<script type="module" src="./jabfung-jenjang-enhancement.js?v=5"></script>\n<script type="module" src="./jabfung-free-verifier-ui.mjs?v=1"></script>';
const count=oldIndex.split(oldTag).length-1;
if (count!==1 || oldIndex.includes('jabfung-free-verifier-ui.mjs')) {
  throw Error('Unexpected Jabfung script anchor / existing overlay. No changes applied.');
}
const sourceFiles = new Map([
  ['jabfung-jenjang-enhancement.js','web/jabfung-jenjang-enhancement.js'],
  ['jabfung-free-verifier-core.mjs','web/jabfung-free-verifier-core.mjs'],
  ['jabfung-free-verifier-ui.mjs','web/jabfung-free-verifier-ui.mjs']
]);
const markers = new Map([
  ['jabfung-jenjang-enhancement.js','SIMANTAB_JABFUNG_AI_FREE_LOCAL_V4_20261013'],
  ['jabfung-free-verifier-core.mjs','SIMANTAB_JABFUNG_FREE_CORE_V1_20261013'],
  ['jabfung-free-verifier-ui.mjs','SIMANTAB_JABFUNG_FREE_UI_V1_20261013']
]);
for (const [filename] of sourceFiles) {
  const content=(await read(path.join(sourceDir,filename))).toString('utf8');
  if (!content.includes(markers.get(filename))) throw Error('Missing expected source marker: '+filename);
}
const knownAssetHashes = new Map([
  ['ocr/pdf.mjs','a209a2124baa35cbb9015b809926f1bcec9dd1c247296290e205dd9d76cb9128'],
  ['ocr/pdf.worker.mjs','7c237f83fa56bce645d8af51d183c9c56ba7b2d2928ff42754dc7020bea36323'],
  ['ocr/tesseract.esm.min.js','da6267cfe5036ae718a59eece3b5744a4655b0b8faa9f16259362b783d74c9bb'],
  ['ocr/tesseract.worker.min.js','38645599043239c0eb6db08a6504a92dcdc292200535f3e9339cd77c4443b842'],
  ['ocr/core/tesseract-core-lstm.wasm.js','775a35df6f2ae100e02609443e6bd5cafcd07983dd6175454ca4a432a7730687'],
  ['ocr/lang/ind.traineddata.gz','46130be88c603e5a38e2fe5420540d8712f177fbaf46c904aaacccddcc0bc308'],
  ['ocr/lang/eng.traineddata.gz','ed350f3752f81ee8f38769edc14d92d997dababe23b565c59879372cc46a2468']
]);
for (const [asset,sha] of knownAssetHashes) {
  if ((await getHash(path.join(assets,asset)))!==sha) throw Error('Untrusted/mismatched OCR asset: '+asset);
}
const coreHash='d34e69830b82694a9f9758a01a00aa68be8f6455e7bf5340edc6054921c22603';
const uiHash='a8bec8f3adab485aa8a1405c832077ffe4b72654b4b97624db60a0b59d654f11';
for (const [file,sha] of [['jabfung-free-verifier-core.mjs',coreHash],['jabfung-free-verifier-ui.mjs',uiHash]]) {
  if ((await getHash(path.join(sourceDir,file)))!==sha) throw Error('Source changed since validated preview: '+file);
}
try { await fs.access(output); throw Error('Output already exists: refuse to overwrite.'); }
catch (error) { if (error.code!=='ENOENT') throw error; }
const pending=output+'.pending-'+process.pid;
try {
  await fs.cp(base,pending,{recursive:true,errorOnExist:true,force:false});
  const st=path.join(pending,'static');
  // Only mutate explicitly allowlisted files. All existing non-Jabfung files,
  // routes, Vercel functions and config remain byte-identical to the baseline.
  for (const [filename] of sourceFiles) await fs.copyFile(path.join(sourceDir,filename),path.join(st,filename));
  await fs.cp(path.join(assets,'ocr'),path.join(st,'ocr'),{recursive:true,force:false,errorOnExist:true});
  await fs.writeFile(path.join(st,'index.html'),oldIndex.replace(oldTag,nextTag));
  if (oldIndex.replace(oldTag,nextTag)!==(await fs.readFile(path.join(st,'index.html'),'utf8'))) {
    throw Error('Index transformation not exact.');
  }
  const permitted=new Set(['static/index.html',...sourceFiles.keys()].map(x=>x.startsWith('static/')?x:'static/'+x));
  const walk=async (root,rel='')=>{
    const entries=await fs.readdir(path.join(root,rel),{withFileTypes:true});
    const files=[];
    for(const ent of entries){const sub=path.posix.join(rel,ent.name);
      if(ent.isDirectory())files.push(...await walk(root,sub));
      else if(ent.isFile())files.push(sub);
      else throw Error('Unsupported baseline node: '+sub);
    }
    return files;
  };
  const before=await walk(base),after=await walk(pending);
  const beforeSet=new Set(before);
  for(const f of before) {
    if(!after.includes(f))throw Error('Baseline file missing in overlay: '+f);
    if(!permitted.has(f)&&!f.startsWith('static/ocr/')) {
      if (await getHash(path.join(base,f))!==await getHash(path.join(pending,f))) {
        throw Error('Non-Jabfung baseline file unexpectedly changed: '+f);
      }
    }
  }
  for(const f of after) {
    if(beforeSet.has(f))continue;
    if(!permitted.has(f)&&!f.startsWith('static/ocr/'))throw Error('Unauthorized new output file: '+f);
  }
  await fs.rename(pending,output);
  const audit={release:'SIMANTAB_JABFUNG_FREE_OVERLAY_ONLY',sourceBaseIndexSha256:expectedHtmlHash,
    unchangedExistingFiles:before.filter(x=>!permitted.has(x)&&!x.startsWith('static/ocr/')).length,
    allowedChanged:['static/index.html','static/jabfung-jenjang-enhancement.js','static/jabfung-free-verifier-core.mjs','static/jabfung-free-verifier-ui.mjs','static/ocr/**'],
    vercelConfigUnchanged:true,supabaseUntouched:true,
    productionDeploy:false,providerAICalls:false,
    note:'Audit of filesystem only. Not a substitute for browser, authentication or RLS validation.'};
  await fs.writeFile(output+'.audit.json',JSON.stringify(audit,null,2));
  console.log(JSON.stringify({ok:true,output,audit:output+'.audit.json'}));
} catch(e) {
  await fs.rm(pending,{recursive:true,force:true}).catch(()=>{});
  throw e;
}
