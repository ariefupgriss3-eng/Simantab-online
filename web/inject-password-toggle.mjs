import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='login-password-toggle.js';
const modulePath=new URL('./login-password-toggle.js',import.meta.url);

let html=await fs.readFile(outputPath,'utf8');
const code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_LOGIN_PASSWORD_TOGGLE_V1'))throw new Error('Modul lihat password login tidak valid.');

html=html.replace(/<script type="module" src="\.\/login-password-toggle\.js\?v=\d+"><\/script>\s*/g,'');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const tag=`<script type="module" src="./${moduleName}?v=1"></script>\n`;
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);

await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({loginPasswordToggle:true,productionUntouched:true}));
