// Cloudflare SIMANTAB staging: source snapshot loader.
// This module intentionally performs only local file reads and never contacts Vercel.
import fs from 'node:fs/promises';
import path from 'node:path';

const SAFE_STATIC_FILES=new Set([
  'manifest.json','icon-192.png','icon-512.png',
  'simantab-icon-192.png','simantab-icon-512.png',
  'favicon.ico','robots.txt'
]);

// Decode a Chrome "View page source" document saved with Ctrl+S.
// Only the syntax-highlighted text rows are extracted; browser wrapper markup is discarded.
export function extractSavedViewSource(contents) {
  if(typeof contents!=='string')throw new TypeError('Snapshot must be UTF-8 text.');
  if(!contents.includes('class="source-container"'))return contents;
  const lines=[...contents.matchAll(/<td class="line-content">([\s\S]*?)<\/td>/g)];
  if(lines.length<5)throw new Error('Chrome View Source rows are missing or malformed.');
  const named={lt:'<',gt:'>',amp:'&',quot:'"',apos:"'",nbsp:'\u00a0'};
  const decode=text=>text.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos|nbsp);/gi,(whole,part)=>{
    const entity=part.toLowerCase();
    if(Object.hasOwn(named,entity))return named[entity];
    const value=entity.startsWith('#x')?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);
    if(value<1||value>0x10ffff||(value>=0xd800&&value<=0xdfff))return whole;
    return String.fromCodePoint(value);
  });
  const source=lines.map((line)=>{
    const plain=line[1].replace(/<\/?(?:span|a)\b[^>]*>/gi,'').replace(/<br\s*\/?>/gi,'');
    if(/<\/?[a-z]/i.test(plain))throw new Error('Unexpected HTML element in browser source wrapper.');
    return decode(plain);
  }).join('\n');
  if(!/^\s*<!doctype html>/i.test(source)||!/<\/html>\s*$/i.test(source)){
    throw new Error('Extracted SIMANTAB snapshot is not a complete HTML document.');
  }
  return source;
}

export function validateSnapshotHtml(html) {
  if(typeof html!=='string'||!html.includes('SIMANTAB Online')||!html.includes('<html')){
    throw new Error('Snapshot HTML SIMANTAB tidak valid.');
  }
  if(/\bsb_secret_[A-Za-z0-9_]+|SUPABASE_SERVICE_ROLE_KEY\s*[:=]|-----BEGIN PRIVATE KEY-----/i.test(html)){
    throw new Error('Snapshot tampaknya memuat rahasia server; hentikan dan audit sumber.');
  }
  return true;
}
export function resolveSnapshotFile(snapshotFile,requestedUrl,productionPrefix){
  if(!snapshotFile)throw new Error('Snapshot lokal belum tersedia. Jangan mengakses Vercel produksi pada build staging.');
  const current=new URL(requestedUrl),production=new URL(productionPrefix);
  if(current.origin!==production.origin){
    throw new Error('Snapshot source only supports explicitly known production origin.');
  }
  const resource=current.pathname.replace(/^\/+/, '');
  const base=path.resolve(snapshotFile);
  if(resource===''||resource==='index.html')return base;
  if(!SAFE_STATIC_FILES.has(resource)){
    throw new Error('Resource tidak termasuk daftar snapshot lokal yang disetujui: '+resource);
  }
  return path.resolve(path.dirname(base),resource);
}
export async function localSnapshotResponse(requestedUrl,productionPrefix,snapshotFile,normalizeBaseHtml){
  const current=new URL(requestedUrl);
  const filePath=resolveSnapshotFile(snapshotFile,requestedUrl,productionPrefix);
  const baseFile=path.resolve(snapshotFile);
  try {
    const body=await fs.readFile(filePath);
    if(filePath===baseFile){
      const html=extractSavedViewSource(body.toString('utf8'));
      validateSnapshotHtml(html);
      return new Response(normalizeBaseHtml(html),{
        status:200,
        headers:{'content-type':'text/html; charset=utf-8','x-simantab-base':'local-snapshot'}
      });
    }
    const type=current.pathname.endsWith('.json')?'application/json':
      current.pathname.endsWith('.png')?'image/png':
      current.pathname.endsWith('.ico')?'image/x-icon':'application/octet-stream';
    return new Response(body,{status:200,headers:{'content-type':type,'x-simantab-base':'local-snapshot'}});
  }catch(error){
    if(error?.code==='ENOENT')return new Response('Snapshot asset not available',{status:404});
    throw error;
  }
}
