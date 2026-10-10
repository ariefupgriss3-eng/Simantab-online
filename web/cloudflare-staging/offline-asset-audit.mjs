// Read-only Cloudflare staging inventory. Run with an audited PRIVATE local HTML snapshot.
// Never copy the snapshot into this public repository.
import fs from 'node:fs/promises';
import path from 'node:path';
import {extractSavedViewSource,validateSnapshotHtml} from './snapshot-source.mjs';

const GENERATED_SCRIPTS=new Set([
  'supabase-local.js','jspdf.umd.min.js','jspdf.plugin.autotable.min.js'
]);
const EXPECTED_GENERATED_PWA=new Set([
  'manifest.json','sw.js','install.html',
  'simantab-icon-512.svg','simantab-icon-maskable.svg'
]);
const FINAL_PWA_SOURCE='simantab-icon-192.png';
function refs(html,tag,attribute) {
  const result=[];
  const rx=new RegExp('<'+tag+'\\b[^>]*\\b'+attribute+'\\s*=\\s*(["\\'])(.*?)\\1','gi');
  for(const match of html.matchAll(rx))result.push(match[2]);
  return result;
}
function localRef(raw) {
  if(/^data:/i.test(raw))return null;
  if(!raw.startsWith('./')&&!raw.startsWith('/'))throw new Error('Nonlocal asset reference: '+raw.slice(0,70));
  const url=new URL(raw,'https://staging.invalid/');
  const name=url.pathname.replace(/^\\/+/, '');
  if(!name||name.includes('/')||name==='.'||name==='..')throw new Error('Unexpected asset path: '+raw.slice(0,70));
  return name;
}
export async function auditOfflineFrontend({html,sourceDir,assetDir}={}) {
  const source=extractSavedViewSource(html);
  validateSnapshotHtml(source);
  if(!/<\/html>\s*$/i.test(source))throw new Error('Incomplete HTML snapshot.');
  const scriptRefs=refs(source,'script','src').map(localRef);
  const iconRefs=refs(source,'img','src').map(localRef);
  const manifestRefs=refs(source,'link','href').map(localRef).filter(v=>v&&v.startsWith('manifest.json'));
  const uniqueScripts=[...new Set(scriptRefs.filter(Boolean))];
  const missingRepositoryModules=[];
  for(const file of uniqueScripts) {
    if(GENERATED_SCRIPTS.has(file))continue;
    try{await fs.access(path.join(sourceDir,file))}
    catch{missingRepositoryModules.push(file)}
  }
  const artifactDir=assetDir||sourceDir;
  const missingPwaAssets=[];
  const originalIcon=path.join(artifactDir,FINAL_PWA_SOURCE);
  try {
    const file=await fs.readFile(originalIcon);
    if(file.length<1000||file.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('invalid PNG');
  } catch {
    missingPwaAssets.push(FINAL_PWA_SOURCE);
  }
  const generated=[...GENERATED_SCRIPTS,...EXPECTED_GENERATED_PWA];
  return {
    app:'SIMANTAB Online',phase:'private-offline-inventory',
    scriptCount:scriptRefs.length,
    uniqueScriptCount:uniqueScripts.length,
    repositoryModuleCount:uniqueScripts.filter(x=>!GENERATED_SCRIPTS.has(x)).length,
    generatedScriptCount:uniqueScripts.filter(x=>GENERATED_SCRIPTS.has(x)).length,
    missingRepositoryModules,
    pwaReferences:{imageRefs:iconRefs.length,manifestRefs:manifestRefs.length},
    pwaSourceIconPresent:missingPwaAssets.length===0,
    missingPwaAssets,
    producedByBuild:generated,
    scriptInventoryReady:missingRepositoryModules.length===0,
    pwaReady:missingPwaAssets.length===0,
    fullFrontendBuilt:false,
    deploymentPerformed:false,
    warning:'Source HTML is private. No production API or database calls were made.'
  };
}
if(process.argv[1]&&import.meta.url===new URL('file://'+path.resolve(process.argv[1])).href) {
  const filepath=process.argv[2]||process.env.SIMANTAB_STAGING_SNAPSHOT_FILE;
  if(!filepath)throw new Error('Provide path to a private local HTML snapshot.');
  const html=await fs.readFile(filepath,'utf8');
  const sourceDir=path.resolve(new URL('..',import.meta.url).pathname);
  const report=await auditOfflineFrontend({html,sourceDir,assetDir:process.env.SIMANTAB_STAGING_ASSET_DIR||path.dirname(filepath)});
  console.log(JSON.stringify(report,null,2));
  if(!report.scriptInventoryReady||!report.pwaReady)process.exitCode=2;
}
