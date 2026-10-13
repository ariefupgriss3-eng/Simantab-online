// End-to-end smoke for the actual zipped standalone preview, not production.
// Requires assembled preview-package/ and chromium on GitHub Actions runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,resolve,join,extname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';

const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const root=join(repoRoot,'preview-package');
function chromeExecutable(){
 for(const bin of ['google-chrome','google-chrome-stable','chromium']){
  try{return execFileSync('which',[bin],{encoding:'utf8'}).trim()}catch{}
 }
 throw new Error('Chromium not found');
}
const contentType=(name)=>{
 const ext=extname(name);
 if(ext==='.mjs'||ext==='.js')return 'text/javascript; charset=utf-8';
 if(ext==='.css')return 'text/css; charset=utf-8';
 if(ext==='.wasm')return 'application/wasm';
 if(ext==='.html')return 'text/html; charset=utf-8';
 if(ext==='.gz')return 'application/gzip';
 return 'application/octet-stream';
};
test('actual isolated preview: desktop PDF, Android-size PNG, empty file; no external requests', {timeout:240000},async t=>{
 const server=createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   const path=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/,'');
   const source=resolve(root,path);
   if(relative(root,source).startsWith('..'))throw new Error('Bad path');
   const bytes=await readFile(source);
   res.writeHead(200,{'content-type':contentType(source),'cache-control':'no-store'});
   res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found')}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const port=server.address().port;
 t.after(()=>new Promise(ok=>server.close(ok)));
 const browser=await chromium.launch({executablePath:chromeExecutable(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 t.after(()=>browser.close());
 const outgoing=[];
 const testPage=async mobile=>{
  const context=await browser.newContext(mobile?{viewport:{width:393,height:851},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
  await context.route('**/*',route=>{
   const address=route.request().url();
   if(address.startsWith('http://127.0.0.1:'+port+'/')||address.startsWith('blob:')||address.startsWith('data:'))return route.continue();
   outgoing.push(address.slice(0,120));return route.abort('blockedbyclient');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:'+port+'/');
  await page.waitForFunction('typeof window.__verifyJabfungFreeFromForm==="function"');
  return {context,page,errors};
 };
 const desktop=await testPage(false);
 await desktop.page.locator('[data-test="pdf-text"]').click();
 assert.match(await desktop.page.locator('#fileName').textContent(),/SKP_2025_TEKS_UJI\.pdf/);
 await desktop.page.locator('#run').click();
 await desktop.page.waitForFunction(()=>document.querySelector('#jabfungFreeProgress')?.textContent?.includes('Selesai'),null,{timeout:60000});
 const pdfResult=await desktop.page.locator('#jabfungFreeResults').textContent();
 assert.match(pdfResult,/Terbaca awal|Perlu telaah/);
 assert.ok(!pdfResult.includes('Pembacaan lokal belum berhasil'));
 await desktop.page.locator('#jabfungFreeClose').click();
 await desktop.page.locator('[data-test="pdf-scan"]').click();
 await desktop.page.locator('#run').click();
 await desktop.page.waitForFunction(()=>document.querySelector('#jabfungFreeProgress')?.textContent?.includes('Selesai'),null,{timeout:70000});
 const scanResult=await desktop.page.locator('#jabfungFreeResults').textContent();
 assert.match(scanResult,/Terbaca awal|Perlu telaah/);
 assert.ok(!scanResult.includes('Pembacaan lokal belum berhasil'));
 assert.deepEqual(desktop.errors,[]);
 await desktop.context.close();
 const mobile=await testPage(true);
 await mobile.page.locator('[data-test="png"]').click();
 assert.match(await mobile.page.locator('#fileName').textContent(),/IJAZAH_UJI_SINTETIS/);
 await mobile.page.locator('#run').click();
 await mobile.page.waitForFunction(()=>document.querySelector('#jabfungFreeProgress')?.textContent?.includes('Selesai'),null,{timeout:75000});
 const imageResult=await mobile.page.locator('#jabfungFreeResults').textContent();
 assert.match(imageResult,/Terbaca awal|Perlu telaah/);
 assert.ok(!imageResult.includes('Pembacaan lokal belum berhasil'));
 await mobile.page.locator('#jabfungFreeClose').click();
 await mobile.page.locator('[data-test="empty"]').click();
 await mobile.page.locator('#run').click();
 await mobile.page.waitForFunction(()=>document.querySelector('#jabfungFreeProgress')?.textContent?.includes('Selesai'),null,{timeout:8000});
 assert.match(await mobile.page.locator('#jabfungFreeResults').textContent(),/Perlu telaah/);
 assert.deepEqual(mobile.errors,[]);
 await mobile.context.close();
 assert.deepEqual(outgoing,[],'Preview must not fetch any remote API or CDN, including Supabase and paid AI');
 console.log(JSON.stringify({isolatedPreview:true,desktopPDF:'handled',scannedPDF:'handled',
  androidSizePNG:'handled',emptyFile:'PERLU_TELAAH',
  externalRequests:0,paidAiCalls:0,caveat:'Simulated Android viewport, not physical hardware'}));
});
