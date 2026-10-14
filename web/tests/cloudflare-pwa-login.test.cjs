'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const base = path.join(__dirname, '..');
const pwa = fs.readFileSync(path.join(base, 'cloudflare/pwa-install-safe.js'), 'utf8');
const builder = fs.readFileSync(path.join(base, 'cloudflare/enable-pwa.mjs'), 'utf8');

class El {
  constructor(tag){this.tag=tag;this.id='';this.textContent='';this.href='';this.type='';this.children=[];this.events={};this.style={};}
  appendChild(child){this.children.push(child);}
  addEventListener(name, handler){(this.events[name] ||= []).push(handler);}
  setAttribute(){}
  async click(){for(const f of this.events.click||[])await f();}
}
function descendants(root){return [root,...root.children.flatMap(descendants)];}
function environment(){
  const loginbox=new El('div'), handlers={};
  const document={
    readyState:'complete',
    createElement:tag=>new El(tag),
    querySelector:selector=>selector==='.loginbox'?loginbox:null,
    getElementById:id=>descendants(loginbox).find(node=>node.id===id)||null
  };
  const window={
    matchMedia:()=>({matches:false}),
    addEventListener:(event,fn)=>{(handlers[event] ||= []).push(fn);}
  };
  const navigator={userAgent:'Mozilla/5.0 Android Chrome'};
  const location={protocol:'https:'};
  vm.runInNewContext(pwa,{window,document,navigator,location,console:{warn() {}}},{timeout:2000});
  return {loginbox,document,handlers};
}
test('PWA install button belongs to canonical login, not a duplicate login form',()=>{
  const f=environment();
  assert.equal(f.document.getElementById('simPwaLoginInstall').textContent,'⬇ Pasang Aplikasi SIMANTAB');
  assert.equal(descendants(f.loginbox).filter(el=>el.tag==='input').length,0);
  assert.equal(descendants(f.loginbox).filter(el=>el.tag==='a')[0].href,'./panduan-instal.html');
});
test('PWA installs from login through native browser prompt',async()=>{
  const f=environment(); let prompted=false;
  for(const fn of f.handlers.beforeinstallprompt||[])fn({
    preventDefault(){},
    async prompt(){prompted=true;},
    userChoice:Promise.resolve({outcome:'accepted'})
  });
  await f.document.getElementById('simPwaLoginInstall').click();
  assert.equal(prompted,true);
  assert.match(f.document.getElementById('simPwaInstallStatus').textContent,/Pemasangan sedang diproses/);
});
test('PWA falls back to supported manual installation help',async()=>{
  const f=environment();
  await f.document.getElementById('simPwaLoginInstall').click();
  assert.match(f.document.getElementById('simPwaInstallStatus').textContent,/Android.*Chrome/);
});
test('existing install QR address routes to canonical login while guide remains separate',()=>{
  assert.match(builder,/window\.location\.replace\('\.\/\?source=pwa'\)/);
  assert.match(builder,/panduan-instal\.html/);
  assert.match(builder,/manifest\.start_url = '\/'/);
  assert.match(builder,/pwa-install\.js\?v=9/);
  assert.match(builder,/Cache-Control: no-store/);
  assert.doesNotMatch(builder,/removeAttribute\('password'\)/);
});
