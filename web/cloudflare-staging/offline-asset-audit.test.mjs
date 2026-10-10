import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {auditOfflineFrontend} from './offline-asset-audit.mjs';

const HTML='<!doctype html><html lang="id"><head><title>SIMANTAB Online</title>'+
  '<link rel="manifest" href="./manifest.json?v=6"></head><body>'+
  '<img src="./simantab-icon-192.png?v=3">'+
  '<script src="./known.js?v=1"></script>'+
  '<script src="./supabase-local.js?v=1"></script></body></html>';

async function withFixture(fn) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'simantab-asset-audit-'));
  try {
    await fs.writeFile(path.join(dir,'known.js'),'export const enabled=true;');
    return await fn(dir);
  } finally {await fs.rm(dir,{recursive:true,force:true})}
}
test('reference inventory distinguishes repository modules from build-generated scripts',()=>withFixture(async dir=>{
  const audit=await auditOfflineFrontend({html:HTML,sourceDir:dir});
  assert.equal(audit.scriptCount,2);
  assert.equal(audit.repositoryModuleCount,1);
  assert.equal(audit.generatedScriptCount,1);
  assert.deepEqual(audit.missingRepositoryModules,[]);
  assert.deepEqual(audit.missingPwaAssets,['simantab-icon-192.png']);
  assert.equal(audit.scriptInventoryReady,true);
  assert.equal(audit.pwaReady,false);
  assert.equal(audit.fullFrontendBuilt,false);
}));
test('an existing PNG icon enables PWA inventory only after its signature is verified',()=>withFixture(async dir=>{
  await fs.writeFile(path.join(dir,'simantab-icon-192.png'),Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(1200)
  ]));
  const audit=await auditOfflineFrontend({html:HTML,sourceDir:dir});
  assert.equal(audit.pwaReady,true);
  assert.equal(audit.scriptInventoryReady,true);
}));
test('missing script module is a deployment blocker',()=>withFixture(async dir=>{
  const html=HTML.replace('./known.js','./missing.js');
  const audit=await auditOfflineFrontend({html,sourceDir:dir});
  assert.deepEqual(audit.missingRepositoryModules,['missing.js']);
  assert.equal(audit.scriptInventoryReady,false);
}));
test('reject external and traversing static asset references',()=>withFixture(async dir=>{
  await assert.rejects(()=>auditOfflineFrontend({
    html:HTML.replace('./known.js','https://example.net/malicious.js'),sourceDir:dir
  }),/Nonlocal asset reference/);
  await assert.rejects(()=>auditOfflineFrontend({
    html:HTML.replace('./known.js','./../malicious.js'),sourceDir:dir
  }),/Unexpected asset path/);
}));
