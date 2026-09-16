import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='login-channel-hardening.js';
let html=await fs.readFile(outputPath,'utf8');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const code=await fs.readFile(new URL(`./${moduleName}`,import.meta.url),'utf8');
if(!code.includes('SIMANTAB_LOGIN_CHANNEL_HARDENING_V1'))throw new Error('Modul login channel hardening tidak valid.');
html=html.replace(/<script type="module" src="\.\/login-channel-hardening\.js\?v=\d+"><\/script>\s*/g,'');
html=html.slice(0,bodyClose)+`<script type="module" src="./login-channel-hardening.js?v=1"></script>\n`+html.slice(bodyClose);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({loginChannelHardening:true,gtkLogin:['username','email'],strictChannelValidation:true,productionUntouched:true}));
