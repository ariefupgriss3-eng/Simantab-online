// Cloudflare SIMANTAB staging: source snapshot loader.
// This module intentionally performs only local file reads and never contacts Vercel.
import fs from 'node:fs/promises';
import path from 'node:path';

const SAFE_STATIC_FILES=new Set([
  'manifest.json','icon-192.png','icon-512.png',
  'simantab-icon-192.png','simantab-icon-512.png',
  'favicon.ico','robots.txt'
]);

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
      const html=body.toString('utf8');
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
