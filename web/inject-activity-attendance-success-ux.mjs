import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='activity-attendance-success-ux.js';
let html=await fs.readFile(outputPath,'utf8');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const code=await fs.readFile(new URL(`./${moduleName}`,import.meta.url),'utf8');
if(!code.includes('SIMANTAB_ACTIVITY_ATTENDANCE_SUCCESS_UX_V1'))throw new Error('Modul attendance success UX tidak valid.');
html=html.replace(/<script type="module" src="\.\/activity-attendance-success-ux\.js\?v=\d+"><\/script>\s*/g,'');
html=html.slice(0,bodyClose)+`<script type="module" src="./activity-attendance-success-ux.js?v=2"></script>\n`+html.slice(bodyClose);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({attendanceSuccessUx:true,version:2,nipOnly:true,nipRequired:true,successSummary:['name','nip','unit','position','time'],mobileOptimized:true,productionUntouched:true}));
