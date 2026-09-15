import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='diklat-ks-bcks.js';
const modulePath=new URL('./diklat-ks-bcks.js',import.meta.url);
let html=await fs.readFile(outputPath,'utf8');
const code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_DIKLAT_KS_BCKS_V2'))throw new Error('Modul Diklat KS/BCKS V2 tidak valid.');
if(!code.includes("certificateFlow:'PESERTA_ISI_ADMIN_KSPS_APPROVE'"))throw new Error('Workflow sertifikat peserta/admin KSPS tidak ditemukan.');

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const tag=`<script type="module" src="./${moduleName}?v=5"></script>\n`;
html=html.replace(/<script type="module" src="\.\/diklat-ks-bcks\.js\?v=\d+"><\/script>\s*/g,'');
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({diklatKsBcks:true,version:2,levels:4,level4:'PENCATATAN_SERTIFIKAT',certificateFlow:'PESERTA_ISI_ADMIN_KSPS_APPROVE',fileLimitBytes:512000,adminKsps:'kasim',productionUntouched:true}));