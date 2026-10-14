'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(base,'cloudflare','sw-safe.js'),'utf8');
const installer=fs.readFileSync(path.join(base,'cloudflare','pwa-install-safe.js'),'utf8');
const enable=fs.readFileSync(path.join(base,'cloudflare','enable-pwa.mjs'),'utf8');

test('PWA installation and offline content are public only',()=>{
 assert.match(source,/SIMANTAB_CLOUDFLARE_SAFE_SW_V8/);
 assert.match(installer,/SIMANTAB_CLOUDFLARE_PWA_INSTALL_V8/);
 assert.match(enable,/cloudflareSecurePwa/);
 assert.doesNotMatch(source,/cache\.put\(event\.request/);
 assert.doesNotMatch(source,/caches\.match\(event\.request/);
 assert.doesNotMatch(source,/caches\.open\(.*event\.request/);
 assert.match(source,/event\.request\.mode !== 'navigate'/);
 assert.match(source,/event\.request\.method !== 'GET'/);
});

test('service worker bypasses API, POST and cross-origin requests',()=>{
 const events=new Map();
 const self={
  location:{origin:'https://example.workers.dev'},
  addEventListener:(event,callback)=>events.set(event,callback),
  skipWaiting:()=>Promise.resolve(),
  clients:{claim:()=>Promise.resolve()}
 };
 const context={
  self,caches:{open(){throw new Error('unexpected cache on API')},match(){throw new Error('unexpected offline match')}},
  fetch(){throw new Error('unexpected network interception')},
  URL
 };
 vm.runInNewContext(source,context,{timeout:2000});
 let intercepted=0;
 for(const [method,mode,url] of [
  ['POST','navigate','https://example.workers.dev/'],
  ['GET','cors','https://example.workers.dev/api/status'],
  ['GET','navigate','https://tizxfzvgglkokzvsiwkg.supabase.co/rest/v1/profiles']
 ]){
  events.get('fetch')({
   request:{method,mode,url},
   respondWith(){intercepted++;}
  });
 }
 assert.equal(intercepted,0);
});

test('online navigation is network-only and offline uses generic public page',async()=>{
 const events=new Map();
 const response={status:200};
 const self={location:{origin:'https://example.workers.dev'},addEventListener:(n,fn)=>events.set(n,fn),skipWaiting:()=>Promise.resolve(),clients:{claim:()=>Promise.resolve()}};
 let network=0,offline=0,cacheWrites=0;
 const context={
  self,URL,
  caches:{match:async key=>{offline++;assert.equal(key,'/offline.html');return{publicOnly:true}},open:async()=>({add:async()=>{cacheWrites++}}),keys:async()=>[]},
  fetch:async()=>{network++;return response}
 };
 vm.runInNewContext(source,context);
 const request={method:'GET',mode:'navigate',url:'https://example.workers.dev/dashboard'};
 let promise;
 events.get('fetch')({request,respondWith:p=>promise=p});
 assert.equal(await promise,response);
 assert.equal(network,1);
 assert.equal(offline,0);
 assert.equal(cacheWrites,0);
 context.fetch=async()=>{throw new Error('offline')};
 events.get('fetch')({request,respondWith:p=>promise=p});
 assert.deepEqual(await promise,{publicOnly:true});
 assert.equal(offline,1);
 assert.equal(cacheWrites,0);
});
