// Chromium smoke test for same-origin Jabfung OCR: synthetic PDF and PNG only.
// Uses temporary localhost server. No user documents, Supabase, or paid providers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,resolve,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {jsPDF} from 'jspdf';

const web=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=[
 '<!doctype html><html lang="id"><head><meta charset="UTF-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>',
 '<h1>SIMANTAB synthetic Jabfung OCR QA</h1>',
 '<input class="jabfungReqFile" data-code="SKP_2025" type="file" accept=".pdf,image/png">',
 '<script>window.__simantabSb={};',
 'window.__simantabProfile={id:"00000000-0000-4000-8000-000000000001",role:"GTK"};</script>',
 '<script type="module" src="/jabfung-free-verifier-ui.mjs"></script>',
 '</body></html>'
].join('');

function chromePath(){
 for(const candidate of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
  try{return execFileSync('which',[candidate],{encoding:'utf8'}).trim()}catch{}
 }
 throw new Error('Chrome/Chromium unavailable on the isolated QA runner');
}
function mimeType(file){
 const ext=extname(file);
 if(ext==='.mjs'||ext==='.js')return 'text/javascript; charset=utf-8';
 if(ext==='.wasm')return 'application/wasm';
 if(ext==='.pdf')return 'application/pdf';
 if(ext==='.png')return 'image/png';
 return 'application/octet-stream';
}
const pdf=new jsPDF({unit:'pt'});
pdf.setFont('helvetica','bold');pdf.setFontSize(16);
pdf.text('SASARAN KINERJA PEGAWAI TAHUN 2025',45,90);
pdf.setFont('helvetica','normal');pdf.setFontSize(12);
pdf.text('Dokumen contoh sintetis untuk pengujian lokal Jabfung.',45,125);
pdf.text('Indikator sasaran pekerjaan guru untuk tahun 2025 telah ditentukan.',45,146);
pdf.text('Tidak ada identitas pegawai asli atau keputusan resmi di berkas ini.',45,167);
const fixture=Array.from(new Uint8Array(pdf.output('arraybuffer')));

test('Chromium desktop PDF plus mobile-size image OCR; no external network', {timeout:210000},async t=>{
 const server=createServer(async(req,res)=>{
  try{
   const u=new URL(req.url,'http://127.0.0.1');
   if(u.pathname==='/'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(html);return;
   }
   const pathname=decodeURIComponent(u.pathname);
   if(!/^\/(?:ocr\/[a-zA-Z0-9._/-]+|jabfung-free-verifier-(?:ui|core)\.mjs)$/.test(pathname)||pathname.includes('..')){
    res.writeHead(404);res.end('Not found');return;
   }
   const file=pathname.startsWith('/ocr/')
    ?join(web,'.vercel/output/static',pathname)
    :join(web,pathname.slice(1));
   const content=await readFile(file);
   res.writeHead(200,{'content-type':mimeType(file),'cache-control':'no-store','x-qa-synthetic':'true'});
   res.end(content);
  }catch(e){res.writeHead(404);res.end('Not found')}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const port=server.address().port;
 t.after(()=>new Promise(done=>server.close(done)));
 const browser=await chromium.launch({executablePath:chromePath(),headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 t.after(()=>browser.close());
 const blocked=[];
 async function createPage(mobile){
  const context=await browser.newContext(mobile?{
   viewport:{width:393,height:851},deviceScaleFactor:2,isMobile:true,hasTouch:true,
   userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Mobile Safari/537.36'
  }:{viewport:{width:1280,height:800}});
  await context.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith('blob:')||u.startsWith('data:')||u.startsWith('http://127.0.0.1:'+port+'/'))
    return route.continue();
   blocked.push(u.split('?')[0]);
   return route.abort('blockedbyclient');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/');
  await page.waitForFunction('typeof window.__verifyJabfungFreeFromForm==="function"',null,{timeout:15000});
  return {page,context,errors};
 }
 const desktop=await createPage(false);
 const pdfResult=await desktop.page.evaluate(async bytes=>{
  const input=document.querySelector('.jabfungReqFile'),dt=new DataTransfer();
  dt.items.add(new File([new Uint8Array(bytes)],'SKP_2025_synthetic.pdf',{type:'application/pdf'}));
  input.files=dt.files;
  await window.__verifyJabfungFreeFromForm();
  const modal=document.getElementById('jabfungFreeVerifierModal');
  return {progress:modal.querySelector('#jabfungFreeProgress').textContent,
   text:modal.querySelector('#jabfungFreeResults').textContent};
 },fixture);
 assert.match(pdfResult.progress,/Selesai/);
 assert.match(pdfResult.text,/Terbaca awal/,'PDF text must be really extracted by PDF.js');
 assert.ok(!pdfResult.text.includes('Pembacaan lokal belum berhasil'));
 // Build an image-only PDF from a synthetic canvas. This forces PDF.js OCR fallback.
 const sampleImage=await desktop.page.evaluate(()=>{
  const cv=document.createElement('canvas');cv.width=1600;cv.height=500;
  const c=cv.getContext('2d');c.fillStyle='white';c.fillRect(0,0,1600,500);
  c.fillStyle='black';c.font='bold 68px Arial';
  c.fillText('SASARAN KINERJA PEGAWAI 2025',45,110);
  c.font='48px Arial';
  c.fillText('Dokumen sintetis untuk tes PDF scan',45,210);
  c.fillText('Pemeriksaan kinerja guru oleh petugas',45,290);
  c.fillText('Tanpa data pribadi atau surat resmi',45,365);
  return cv.toDataURL('image/png');
 });
 const scannedPdf=new jsPDF({unit:'pt'});
 scannedPdf.addImage(sampleImage,'PNG',35,65,540,170);
 const scannedBytes=Array.from(new Uint8Array(scannedPdf.output('arraybuffer')));
 const scannedResult=await desktop.page.evaluate(async bytes=>{
  const input=document.querySelector('.jabfungReqFile'),dt=new DataTransfer();
  dt.items.add(new File([new Uint8Array(bytes)],'SKP_2025_SCAN_SINTETIS.pdf',{type:'application/pdf'}));
  input.files=dt.files;
  await window.__verifyJabfungFreeFromForm();
  const modal=document.getElementById('jabfungFreeVerifierModal');
  return {progress:modal.querySelector('#jabfungFreeProgress').textContent,
   text:modal.querySelector('#jabfungFreeResults').textContent};
 },scannedBytes);
 assert.match(scannedResult.progress,/Selesai/);
 assert.ok(!scannedResult.text.includes('Pembacaan lokal belum berhasil'),
  'Image-only PDF must use a working OCR fallback, not return a worker error');
 assert.deepEqual(desktop.errors,[]);
 await desktop.context.close();

 const mobile=await createPage(true);
 const pngResult=await mobile.page.evaluate(async()=>{
  const canvas=document.createElement('canvas');
  canvas.width=1600;canvas.height=500;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,1600,500);
  ctx.fillStyle='#000';ctx.font='bold 70px Arial';
  ctx.fillText('IJAZAH GURU PENDIDIKAN 2025',50,110);
  ctx.font='48px Arial';
  ctx.fillText('Dokumen sintetis untuk pengujian OCR',50,210);
  ctx.fillText('Identitas dan keputusan harus dicek petugas',50,290);
  ctx.fillText('Tidak ada data guru nyata di sini',50,370);
  const blob=await new Promise(ok=>canvas.toBlob(ok,'image/png'));
  const dt=new DataTransfer();
  dt.items.add(new File([blob],'uji_sintetis.png',{type:'image/png'}));
  const input=document.querySelector('.jabfungReqFile');
  input.dataset.code='IJAZAH';input.files=dt.files;
  await window.__verifyJabfungFreeFromForm();
  const modal=document.getElementById('jabfungFreeVerifierModal');
  return {progress:modal.querySelector('#jabfungFreeProgress').textContent,
   text:modal.querySelector('#jabfungFreeResults').textContent};
 });
 assert.match(pngResult.progress,/Selesai/);
 assert.ok(!pngResult.text.includes('Pembacaan lokal belum berhasil'),
  'Mobile-size OCR worker must complete using local WASM and language pack');
 assert.match(pngResult.text,/Ijazah/);
 assert.deepEqual(mobile.errors,[]);
 await mobile.context.close();
 assert.deepEqual(blocked,[],'No paid AI/CDN or other external requests');
 console.log(JSON.stringify({desktopPDF:pdfResult.progress,mobileEmulatedPNG:pngResult.progress,
  scannedPdfOCR:scannedResult.progress,
  externalRequests:blocked.length,paidModelCalls:0,
  caveat:'Browser viewport emulation is not a real Android device'}));
});
