import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
let html=await fs.readFile(outputPath,'utf8');
const replacement='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const pattern=/https:\/\/esm\.sh\/@supabase\/supabase-js@\d+(?:\.\d+){0,2}/g;
const matches=html.match(pattern)||[];
if(matches.length)html=html.replace(pattern,replacement);
if(!html.includes(replacement))throw new Error('Import Supabase browser tidak ditemukan untuk dipatch.');
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({supabaseBrowserCdn:'jsdelivr',replaced:matches.length,url:replacement}));
