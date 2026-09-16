import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='activity-attendance-recap.js';
let html=await fs.readFile(outputPath,'utf8');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const code=await fs.readFile(new URL(`./${moduleName}`,import.meta.url),'utf8');
if(!code.includes('SIMANTAB_ACTIVITY_ATTENDANCE_RECAP_V2'))throw new Error('Modul attendance recap V2 tidak valid.');
html=html.replace(/<script type="module" src="\.\/activity-attendance-recap\.js\?v=\d+"><\/script>\s*/g,'');
html=html.slice(0,bodyClose)+`<script type="module" src="./activity-attendance-recap.js?v=2"></script>\n`+html.slice(bodyClose);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({attendanceRecap:true,version:2,directPdfDownload:true,mobileSharePdf:true,print:true,excelExport:true,signatureIncluded:true}));
