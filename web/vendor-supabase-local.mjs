import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath='.vercel/output/static/index.html';
const staticDir='.vercel/output/static';
const bundlePath=path.join(staticDir,'supabase-local.js');
const sources=[
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
];

let code='',source='';
for(const url of sources){
 try{
  const r=await fetch(url,{redirect:'follow',cache:'no-store'});
  if(!r.ok)continue;
  const text=await r.text();
  if(text.length<10000||!text.includes('createClient'))continue;
  code=text;source=url;break;
 }catch{}
}
if(!code)throw new Error('Bundle Supabase lokal gagal diunduh saat build.');
await fs.writeFile(bundlePath,code);

let html=await fs.readFile(outputPath,'utf8');
const importPattern=/import\s*\{\s*createClient\s*\}\s*from\s*['\"][^'\"]*@supabase\/supabase-js[^'\"]*['\"]\s*;?/;
if(importPattern.test(html)){
 html=html.replace(importPattern,"const createClient=window.supabase&&window.supabase.createClient;if(!createClient)throw new Error('Supabase local bundle tidak tersedia.');");
}else if(!html.includes("const createClient=window.supabase&&window.supabase.createClient")){
 throw new Error('Import Supabase utama tidak ditemukan untuk dialihkan ke bundle lokal.');
}
const tag='<script src="./supabase-local.js?v=1"></script>';
if(!html.includes(tag)){
 const marker='<script type="module">';
 if(!html.includes(marker))throw new Error('Script utama aplikasi tidak ditemukan.');
 html=html.replace(marker,`${tag}\n${marker}`);
}
if(/https:\/\/(?:esm\.sh|cdn\.jsdelivr\.net|unpkg\.com)\/[^'\"\s]*@supabase\/supabase-js/.test(html)){
 throw new Error('Masih ada import Supabase eksternal pada HTML final tahap vendor.');
}
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({supabaseLocal:true,source,bundleBytes:code.length,tagged:true}));
