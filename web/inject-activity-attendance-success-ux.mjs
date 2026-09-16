import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='activity-attendance-success-ux.js';
let html=await fs.readFile(outputPath,'utf8');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const code=await fs.readFile(new URL(`./${moduleName}`,import.meta.url),'utf8');
if(!/SIMANTAB_ACTIVITY_ATTENDANCE_SUCCESS_UX_V[12]/.test(code))throw new Error('Modul attendance success UX tidak valid.');
html=html.replace(/<script type="module" src="\.\/activity-attendance-success-ux\.js\?v=\d+"><\/script>\s*/g,'');
html=html.slice(0,bodyClose)+`<script type="module" src="./activity-attendance-success-ux.js?v=3"></script>\n`+html.slice(bodyClose);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({attendanceSuccessUx:true,version:3,nipOnly:true,nipRequired:true,successSummary:['name','nip','unit','position','time'],pcSignature:true,meetingLinkFallback:true,signaturePreview:true,mobileOptimized:true}));
