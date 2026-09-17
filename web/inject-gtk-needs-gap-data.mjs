import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath='.vercel/output/static/index.html';
const staticDir='.vercel/output/static';
const file='gtk-needs-gap-data.js';
const code=await fs.readFile(new URL(`./${file}`,import.meta.url),'utf8');
if(!/SIMANTAB_GTK_NEEDS_GAP_DATA_V5/.test(code))throw new Error('GTK needs Gap Data v5 tidak valid.');
await fs.writeFile(path.join(staticDir,file),code);
let html=await fs.readFile(outputPath,'utf8');
html=html.replace(/\s*<script\s+type="module"\s+src="\.\/gtk-needs-gap-data\.js\?v=\d+"\s*><\/script>\s*/g,'\n');
const close=html.lastIndexOf('</body>');
if(close<0)throw new Error('Tag </body> tidak ditemukan saat inject Gap Data.');
const tag='<script type="module" src="./gtk-needs-gap-data.js?v=5"></script>\n';
html=html.slice(0,close)+tag+html.slice(close);
if(html.split('./gtk-needs-gap-data.js?v=5').length-1!==1)throw new Error('Referensi Gap Data v5 harus tepat satu kali.');
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({gtkNeedsGapData:true,version:5,position:'right-of-gap-riil',dinasSource:'VERIFIED-only',reviewIndicators:'restored',observer:'disabled'}));
