import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='diklat-ks-bcks.js';
const modulePath=new URL('./diklat-ks-bcks.js',import.meta.url);
let html=await fs.readFile(outputPath,'utf8');
let code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_DIKLAT_KS_BCKS_V1'))throw new Error('Modul Diklat KS/BCKS tidak valid.');

// Preview access: Kasim ditetapkan sebagai Admin KSPS melalui capability ADMIN_KSPS.
// Frontend mengenali akun kasim untuk menampilkan panel reviewer; otorisasi final tetap divalidasi RPC/database.
const reviewerNeedle="const isReviewer=()=>REVIEW_ROLES.has(profile().role);";
const reviewerPatch="const isReviewer=()=>REVIEW_ROLES.has(profile().role)||String(profile().username||'').toLowerCase()==='kasim';";
if(!code.includes(reviewerNeedle) && !code.includes(reviewerPatch))throw new Error('Anchor reviewer Diklat KS/BCKS tidak ditemukan.');
code=code.replace(reviewerNeedle,reviewerPatch);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const tag=`<script type="module" src="./${moduleName}?v=2"></script>\n`;
html=html.replace(/<script type="module" src="\.\/diklat-ks-bcks\.js\?v=\d+"><\/script>\s*/g,'');
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({diklatKsBcks:true,levels:4,fileLimitBytes:512000,adminKsps:'kasim',productionUntouched:true}));
