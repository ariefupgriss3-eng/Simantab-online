const CACHE='simantab-pwa-v8';
const VERSION='8';
const SHELL=['./','./manifest.json','./simantab-icon-192.png?v=6','./simantab-icon-512.svg?v=6','./simantab-icon-maskable.svg?v=6','./pwa-install.js?v=6','./install.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:'window'})).then(clients=>clients.forEach(client=>client.postMessage({type:'SIMANTAB_PWA_UPDATED',version:VERSION}))))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./'))));
  return;
 }
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{})}return r})));
});
