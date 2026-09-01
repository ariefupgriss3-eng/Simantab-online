import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await import('./build-kadis.mjs');
const path='.vercel/output/static/index.html';
let html=await fs.readFile(path,'utf8');
const modules=[
 ['team-workflow-authority.js','SIMANTAB_TEAM_WORKFLOW_AUTHORITY_V1'],
 ['team-multi-capability.js','SIMANTAB_TEAM_MULTI_CAPABILITY_V1']
];
for(const [file,marker] of modules){
 const url='https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/'+file;
 const r=await fetch(url,{headers:{'user-agent':'SIMANTAB-Workflow-Build/1.1'},cache:'no-store'});if(!r.ok)throw new Error(`Gagal mengambil ${file}: ${r.status}`);
 const code=await r.text();if(!code.includes(marker))throw new Error(`Marker ${file} tidak ditemukan.`);
 const tmp='/tmp/'+file+'.mjs';await fs.writeFile(tmp,code);const check=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});if(check.status!==0)throw new Error(`Syntax ${file} gagal: ${(check.stderr||check.stdout||'').trim()}`);
 html=html.replace(new RegExp(`<script\\s+type=["']module["']\\s+src=["']\\./${file.replace('.','\\.')}(?:\\?v=\\d+)?["']><\\/script>\\s*`,'gi'),'');
 await fs.writeFile('.vercel/output/static/'+file,code);
}
html=html.replaceAll("STAFF_KP_EKIN:'Staf KP & E-Kin'","STAFF_KP_EKIN:'Staf KP/PAK/Jabfung/SKP-PAK'");
html=html.replaceAll("STAFF_ARSIP:'Staf Arsip'","STAFF_ARSIP:'Staf Arsip & Aset'");
html=html.replaceAll("STAFF_CUTI:'Staf Izin Cuti'","STAFF_CUTI:'Staf Izin Cuti/Sakit/Umroh'");
html=html.replaceAll("STAFF_SPJ_SIMTENDIK:'Staf SPJ & Simtendik'","STAFF_SPJ_SIMTENDIK:'Staf Simtendik'");
const body=html.lastIndexOf('</body>');if(body<0)throw new Error('Body penutup tidak ditemukan.');
html=html.slice(0,body)+'<script type="module" src="./team-workflow-authority.js?v=1"></script>\n<script type="module" src="./team-multi-capability.js?v=1"></script>\n'+html.slice(body);
await fs.writeFile(path,html);
console.log(JSON.stringify({ok:true,workflowAuthority:true,multiCapability:true,serviceRouting:'Kabid > Kasi/Subkoor per jenjang > staf layanan',discipline:['PEMBINAAN_DISIPLIN','PERCERAIAN'],activityPIC:['KASI_SD','KASI_SMP','SUBKOOR_TK']}));
