import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {validateSnapshotHtml,resolveSnapshotFile,localSnapshotResponse} from './snapshot-source.mjs';

const LIVE='https://simantab-online.vercel.app/';
const HTML='<!doctype html><html lang="id"><head><title>SIMANTAB Online</title></head><body><h1>SIMANTAB Online</h1></body></html>';

test('reject a missing source snapshot path before a live fetch can occur',()=>{
  assert.throws(()=>resolveSnapshotFile('',LIVE,LIVE),/Snapshot lokal belum tersedia/);
});
test('validate a clearly identified HTML source',()=>{
  assert.equal(validateSnapshotHtml(HTML),true);
  assert.throws(()=>validateSnapshotHtml('<html>other application</html>'),/tidak valid/);
});
test('block snapshots containing recognizable server secrets',()=>{
  assert.throws(()=>validateSnapshotHtml(HTML+' sb_secret_EXAMPLE'),/rahasia server/);
});
test('cannot resolve URLs from a different origin',()=>{
  assert.throws(()=>resolveSnapshotFile('/tmp/base.html','https://evil.example/test',LIVE),/origin/);
});
test('deny path traversal and unapproved asset names',()=>{
  assert.throws(()=>resolveSnapshotFile('/tmp/base.html',LIVE+'../config.json',LIVE),/tidak termasuk/);
});
test('load local source without contacting production, and normalize before returning it',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'simantab-staging-'));
  const source=path.join(root,'index.html');
  try{
    await fs.writeFile(source,HTML);
    const response=await localSnapshotResponse(LIVE,LIVE,source,html=>html.replace('</body>','<p>normalized</p></body>'));
    assert.equal(response.status,200);
    assert.equal(response.headers.get('x-simantab-base'),'local-snapshot');
    assert.match(await response.text(),/normalized/);
    assert.equal(response.headers.get('content-type'),'text/html; charset=utf-8');
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('a missing local static asset returns 404, without remote fallback',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'simantab-staging-'));
  try {
    const source=path.join(root,'index.html');
    await fs.writeFile(source,HTML);
    const response=await localSnapshotResponse(LIVE+'manifest.json',LIVE,source,x=>x);
    assert.equal(response.status,404);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
