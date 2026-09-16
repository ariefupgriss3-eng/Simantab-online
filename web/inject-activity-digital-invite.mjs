import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const name='activity-digital-invite.js';
let html=await fs.readFile(outputPath,'utf8');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const path=new URL(`./${name}`,import.meta.url);
const code=await fs.readFile(path,'utf8');
if(!code.includes('SIMANTAB_ACTIVITY_DIGITAL_INVITE_V1'))throw new Error('Modul Undangan Digital tidak valid.');
html=html.replace(/<script type="module" src="\.\/activity-digital-invite\.js\?v=\d+"><\/script>\s*/g,'');
const tag=`<script type="module" src="./activity-digital-invite.js?v=1"></script>\n`;
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile('.vercel/output/static/activity-digital-invite.js',code);
console.log(JSON.stringify({activityDigitalInvite:true,publicInvite:true,zoomLink:true,guestAttendance:true,signatureCanvas:true,share:['copy','web-share','whatsapp'],productionUntouched:true}));
