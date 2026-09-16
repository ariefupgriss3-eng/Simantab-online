import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='school-status-access-v1.js';
let html=await fs.readFile(outputPath,'utf8');
const code=await fs.readFile(new URL(`./${moduleName}`,import.meta.url),'utf8');
if(!code.includes('SIMANTAB_SCHOOL_STATUS_ACCESS_V1'))throw new Error('Modul status sekolah tidak valid.');
html=html.replace(/<script type="module" src="\.\/school-status-access-v1\.js\?v=\d+"><\/script>\s*/g,'');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
html=html.slice(0,bodyClose)+`<script type="module" src="./${moduleName}?v=1"></script>\n`+html.slice(bodyClose);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({schoolStatusAccess:true,negeriNeedsOnly:true,privateSchoolService:'TPG_ONLY'}));
