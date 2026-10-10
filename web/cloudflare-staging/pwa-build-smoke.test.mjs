import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

function crc32(input){
 let crc=0xffffffff;
 for(const b of input){
  crc^=b;
  for(let j=0;j<8;j++)crc=(crc>>>1)^(crc&1?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function chunk(type,contents){
 const name=Buffer.from(type,'ascii');
 const count=Buffer.alloc(4);count.writeUInt32BE(contents.length);
 const check=Buffer.alloc(4);check.writeUInt32BE(crc32(Buffer.concat([name,contents])));
 return Buffer.concat([count,name,contents,check]);
}
function fixturePng(){
 const size=192;
 const header=Buffer.alloc(13);
 header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);
 header[8]=8;header[9]=2;
 const scanlines=Buffer.alloc(size*(1+size*3));
 for(let row=0;row<size;row++){
  for(let col=0;col<size;col++){
   const at=row*(1+size*3)+1+col*3;
   scanlines[at]=(row*3+col*7)%256;
   scanlines[at+1]=(row*11+col*2)%256;
   scanlines[at+2]=(row*17+col*5)%256;
  }
 }
 return Buffer.concat([
  Buffer.from('89504e470d0a1a0a','hex'),
  chunk('IHDR',header),
  chunk('IDAT',zlib.deflateSync(scanlines)),
  chunk('IEND',Buffer.alloc(0))
 ]);
}

test('offline SIMANTAB PWA generator creates valid icons and manifest assets',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'simantab-pwa-smoke-'));
 try{
  const staticDir=path.join(temp,'.vercel','output','static');
  await fs.mkdir(staticDir,{recursive:true});
  await fs.writeFile(path.join(staticDir,'index.html'),'<!doctype html><html lang="id"><head><title>SIMANTAB Online</title></head><body><h1>Staging Fixture</h1></body></html>');
  const icon=path.join(temp,'user-icon.png');
  await fs.writeFile(icon,fixturePng());
  const importer=fileURLToPath(new URL('./copy-icon.mjs',import.meta.url));
  const importerRun=spawnSync(process.execPath,[importer],{
   cwd:temp,encoding:'utf8',env:{...process.env,SIMANTAB_CLOUDFLARE_STAGING:'1',SIMANTAB_STAGING_ICON_FILE:icon}
  });
  assert.equal(importerRun.status,0,importerRun.stderr);
  const generator=fileURLToPath(new URL('../inject-pwa.mjs',import.meta.url));
  const generated=spawnSync(process.execPath,[generator],{cwd:temp,encoding:'utf8'});
  assert.equal(generated.status,0,generated.stderr);
  const required=['simantab-icon-192.png','simantab-icon-512.svg',
     'simantab-icon-maskable.svg','manifest.json','sw.js','install.html','pwa-install.js'];
  for(const file of required)assert.ok((await fs.stat(path.join(staticDir,file))).size>500,file);
  const manifest=JSON.parse(await fs.readFile(path.join(staticDir,'manifest.json'),'utf8'));
  assert.equal(manifest.short_name,'SIMANTAB');
  assert.equal(manifest.icons.length,3);
  assert.equal(manifest.icons[0].sizes,'192x192');
  assert.equal(manifest.icons[1].sizes,'512x512');
  assert.equal(manifest.icons[2].purpose,'maskable');
  const html=await fs.readFile(path.join(staticDir,'index.html'),'utf8');
  assert.match(html,/manifest\.json\?v=6/);
  assert.match(html,/pwa-install\.js\?v=6/);
  const sw=await fs.readFile(path.join(staticDir,'sw.js'),'utf8');
  assert.match(sw,/SIMANTAB_PWA_UPDATED/);
  assert.deepEqual(await fs.readFile(path.join(staticDir,'simantab-icon-192.png')),await fs.readFile(icon));
 } finally {await fs.rm(temp,{recursive:true,force:true});}
});
