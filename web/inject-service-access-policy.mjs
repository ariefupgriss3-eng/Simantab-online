import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath='.vercel/output/static/index.html';
const staticDir='.vercel/output/static';
const file='service-access-policy.js';
const source=await fs.readFile(new URL('./'+file,import.meta.url),'utf8');
if(!/SIMANTAB_SERVICE_ACCESS_POLICY_V1/.test(source))throw new Error('Service access policy v1 tidak valid.');
await fs.writeFile(path.join(staticDir,file),source);

let html=await fs.readFile(outputPath,'utf8');
html=html.replace(/\s*<script\s+type="module"\s+src="\.\/service-access-policy\.js\?v=\d+"\s*><\/script>\s*/g,'\n');
if(!html.includes('</body>'))throw new Error('Tag </body> tidak ditemukan.');
html=html.replace('</body>',`<script type="module" src="./service-access-policy.js?v=1"></script>
</body>`);

const refs=html.match(/\.\/service-access-policy\.js\?v=1/g)||[];
if(refs.length!==1)throw new Error(`Service access policy harus tepat 1 kali, ditemukan ${refs.length}.`);
await fs.writeFile(outputPath,html);

console.log(JSON.stringify({
 serviceAccessPolicy:true,
 version:1,
 tpg:['STAFF_TPG','ADMIN_TPG','STAFF_TPG_TAMSIL','ADMIN_TPG_TAMSIL'],
 pension:['STAFF_PENSIUN','ADMIN_PENSIUN'],
 locations:{tpg:'services-only',pension:'services-only'}
}));