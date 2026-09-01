import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await import('./build-workflow.mjs');
const path='.vercel/output/static/index.html';
let html=await fs.readFile(path,'utf8');
const MODS=[
 ['team-multi-capability.js','SIMANTAB_TEAM_MULTI_CAPABILITY_V1',1],
 ['activity-input-access.js','SIMANTAB_ACTIVITY_INPUT_ACCESS_V1',1],
 ['tpg-consultation.js','SIMANTAB_TPG_CONSULTATION_INFO_V1',1]
];
for(const [file,marker,version] of MODS){
 const url=`https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/${file}`;
 const r=await fetch(url,{headers:{'user-agent':'SIMANTAB-Activity-Access-Build/1.0'},cache:'no-store'});
 if(!r.ok)throw new Error(`Gagal mengambil ${file}: ${r.status}`);
 const code=await r.text();if(!code.includes(marker))throw new Error(`Marker ${file} tidak ditemukan.`);
 const tmp=`/tmp/${file}.mjs`;await fs.writeFile(tmp,code);const check=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});if(check.status!==0)throw new Error(`Syntax ${file} gagal: ${(check.stderr||check.stdout||'').trim()}`);
 const safe=file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');html=html.replace(new RegExp(`<script\\s+type=["']module["']\\s+src=["']\\./${safe}(?:\\?v=\\d+)?["']><\\/script>\\s*`,'gi'),'');
 const body=html.lastIndexOf('</body>');if(body<0)throw new Error('Tag body penutup tidak ditemukan.');html=html.slice(0,body)+`<script type="module" src="./${file}?v=${version}"></script>\n`+html.slice(body);await fs.writeFile(`.vercel/output/static/${file}`,code);
}
await fs.writeFile(path,html);
console.log(JSON.stringify({ok:true,activityInput:['KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','IKA_CAPABILITY'],otherDinas:'READ_ONLY',delete:'KABID_ONLY',multiCapability:true,tpgConsultation:true,tpgTopics:['TPG','Tamsil','TPG THR','TPG Gaji ke-13']}));
