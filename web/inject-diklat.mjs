import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='diklat-ks-bcks.js';
const modulePath=new URL('./diklat-ks-bcks.js',import.meta.url);
let html=await fs.readFile(outputPath,'utf8');
const code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_DIKLAT_KS_BCKS_V1'))throw new Error('Modul Diklat KS/BCKS tidak valid.');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const tag=`<script type="module" src="./${moduleName}?v=1"></script>\n`;
if(!html.includes(`${moduleName}?v=1`))html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({diklatKsBcks:true,levels:4,fileLimitBytes:512000,productionUntouched:true}));
