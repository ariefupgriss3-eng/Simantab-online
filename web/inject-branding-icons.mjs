import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='ui-branding-icons.js';
const modulePath=new URL('./ui-branding-icons.js',import.meta.url);
let html=await fs.readFile(outputPath,'utf8');
const code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_UI_BRANDING_ICONS_V1'))throw new Error('Modul branding/icon SIMANTAB tidak valid.');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
html=html.replace(/<script type="module" src="\.\/ui-branding-icons\.js\?v=\d+"><\/script>\s*/g,'');
const tag=`<script type="module" src="./${moduleName}?v=1"></script>\n`;
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({developerFooter:true,developer:'M. Arief Rohman, S.Pd.SD., M.Si., M.Pd., M.Pd',unit:'Dinas Pendidikan dan Kebudayaan',year:2026,svgIcons:true,productionUntouched:true}));
