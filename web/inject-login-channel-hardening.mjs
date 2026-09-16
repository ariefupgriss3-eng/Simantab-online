import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='login-channel-hardening.js';
let html=await fs.readFile(outputPath,'utf8');
const code=await fs.readFile(new URL(`./${moduleName}`,import.meta.url),'utf8');
if(!code.includes('SIMANTAB_LOGIN_CHANNEL_HARDENING_V3'))throw new Error('Modul login channel hardening v3 tidak valid.');
html=html.replace(/<script type="module" src="\.\/login-channel-hardening\.js\?v=\d+"><\/script>\s*/g,'');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
html=html.slice(0,bodyClose)+`<script type="module" src="./login-channel-hardening.js?v=3"></script>\n`+html.slice(bodyClose);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({loginChannelHardening:true,version:3,gtkLogin:['username','email'],strictChannelValidation:true,roleFirstRouting:true}));
