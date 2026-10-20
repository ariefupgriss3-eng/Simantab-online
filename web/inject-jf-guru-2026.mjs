import fs from 'node:fs/promises';
import path from 'node:path';
// Inject after legacy service setup; isolated opt-in module, no changes to old E_JABFUNG.
const file='jf-guru-2026.js';
const dir='.vercel/output/static';
const source=await fs.readFile(new URL('./'+file,import.meta.url),'utf8');
if(!source.includes('SIMANTAB_JF_GURU_SURAT_0294_2026_V1'))throw new Error('Modul JF Guru 2026 tidak ditemukan');
await fs.writeFile(path.join(dir,file),source);
const output=path.join(dir,'index.html');
let html=await fs.readFile(output,'utf8');
html=html.replace(/\s*<script\s+type="module"\s+src="\.\/jf-guru-2026\.js\?v=\d+"\s*><\/script>\s*/g,'\n');
if(!html.includes('</body>'))throw new Error('Body SIMANTAB tidak ditemukan');
html=html.replace('</body>','<script type="module" src="./jf-guru-2026.js?v=1"></script>\n</body>');
if((html.match(/jf-guru-2026\.js\?v=1/g)||[]).length!==1)throw new Error('Duplikasi modul JF Guru 2026');
await fs.writeFile(output,html);
console.log(JSON.stringify({jfGuru2026Injected:true,version:1,legacyEJabfungUntouched:true,backendMigrationRequired:true,productionUntouched:true}));
