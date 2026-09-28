import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='school-status-access-v1.js';
let html=await fs.readFile(outputPath,'utf8');
const code=await fs.readFile(new URL(`./${moduleName}`,import.meta.url),'utf8');

if(!code.includes('SIMANTAB_SCHOOL_STATUS_ACCESS_V1')||!code.includes('SIMANTAB_SCHOOL_STATUS_ACCESS_V9_NAV_LOOP_GUARD'))throw new Error('Modul status sekolah V9 tidak valid.');
if(!code.includes("PRIVATE_ALLOWED_TABS=new Set(['profile','tpg','attendance','offlineConsultation','status','docs','notifications','newSubmission'])"))throw new Error('Whitelist menu sekolah swasta V9 belum sesuai.');
if(!code.includes("target==='needs'&&!isNegeri"))throw new Error('Guard Kebutuhan GTK Riil sekolah negeri belum aktif.');
if(!code.includes('skbNegeriIncluded:true'))throw new Error('Cakupan SKB negeri belum ditandai.');
if(!code.includes("privateServices:['TPG_KONSULTASI','PTK_BARU_SWASTA']")||!code.includes('ptkBaruSwastaOnly:true'))throw new Error('Usul PTK Baru belum dibatasi khusus sekolah swasta.');

// Patch modul PTK lama: pada KS negeri jangan tampilkan kartu error PTK Swasta sama sekali.
const ptkPath='.vercel/output/static/ptk-swasta-enhancement.js';
try{
 let ptkCode=await fs.readFile(ptkPath,'utf8');
 const oldCatch="}catch(e){x.innerHTML=`<h3>Usul PTK Baru Swasta</h3><p>${esc(e.message)}</p>`}g.prepend(x)}";
 const newCatch="}catch(e){return}g.prepend(x)}";
 if(ptkCode.includes(oldCatch)){
   ptkCode=ptkCode.replace(oldCatch,newCatch);
   await fs.writeFile(ptkPath,ptkCode);
 }
}catch(e){console.warn('Patch kartu PTK lama dilewati:',e?.message||e)}

html=html.replace(/<script type="module" src="\.\/school-status-access-v1\.js\?v=\d+"><\/script>\s*/g,'');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
html=html.slice(0,bodyClose)+`<script type="module" src="./${moduleName}?v=9"></script>\n`+html.slice(bodyClose);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
await fs.writeFile(outputPath,html);

console.log(JSON.stringify({
 schoolStatusAccess:true,
 version:9,
 negeriNeedsOnly:true,
 skbNegeriIncluded:true,
 privateSchoolServices:['TPG_KONSULTASI','PTK_BARU_SWASTA'],
 privateSchoolMenu:['profile','tpg','ptkBaruSwasta','attendance','offlineConsultation','status','docs','notifications'],
 privateDashboard:false,
 ptkBaruSwastaMenu:true
}));
