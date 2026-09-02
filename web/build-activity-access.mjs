import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await import('./build-workflow.mjs');
const path='.vercel/output/static/index.html';
let html=await fs.readFile(path,'utf8');
const MODS=[
 ['team-multi-capability.js','SIMANTAB_TEAM_MULTI_CAPABILITY_V1',1],
 ['activity-input-access.js','SIMANTAB_ACTIVITY_INPUT_ACCESS_V1',1],
 ['tpg-consultation.js','SIMANTAB_TPG_CONSULTATION_INFO_V1',1],
 ['sk-plt-enhancement.js','SIMANTAB_SK_PLT_KS_V1',1],
 ['activity-schedule-committee.js','SIMANTAB_ACTIVITY_SCHEDULE_COMMITTEE_V1',1],
 ['activity-responsible-signatory-fix.js','SIMANTAB_ACTIVITY_RESPONSIBLE_SIGNATORY_V1',1],
 ['activity-report-signatory-fix.js','SIMANTAB_ACTIVITY_REPORT_SIGNATORY_FIX_V1',1],
 ['discipline-evidence.js','SIMANTAB_DISCIPLINE_EVIDENCE_V4',4],
 ['pengawas-nip-tcs-link.js','SIMANTAB_PENGAWAS_NIP_TCS_LINK_V1',1],
 ['simanteb-branding.js','SIMANTEB_BRANDING_V1',1],
 ['pengawas-menu-scope.js','SIMANTEB_PENGAWAS_MENU_SCOPE_V2',2],
 ['pengawas-login-channel.js','SIMANTEB_PENGAWAS_LOGIN_CHANNEL_V1',1],
 ['pengawas-dashboard-kadin.js','SIMANTEB_PENGAWAS_KADIN_DASHBOARD_V1',1],
 ['korwil-scope-dashboard.js','SIMANTEB_KORWIL_SCOPE_DASHBOARD_V2',2],
 ['super-admin-merge-pengawas.js','SIMANTEB_SUPER_ADMIN_MERGE_PENGAWAS_V1',1]
];
for(const [file,marker,version] of MODS){
 let code='';
 const forceRemote=['pengawas-menu-scope.js','pengawas-dashboard-kadin.js','korwil-scope-dashboard.js','super-admin-merge-pengawas.js'].includes(file);
 if(!forceRemote){try{code=await fs.readFile(file,'utf8')}catch(_){}}
 if(!code){
  const url=`https://raw.githubusercontent.com/ariefupgriss3-eng/Simantab-online/main/web/${file}?cb=${Date.now()}-${Math.random()}`;
  const r=await fetch(url,{headers:{'user-agent':'SIMANTAB-Activity-Access-Build/1.0','cache-control':'no-cache'},cache:'no-store'});
  if(!r.ok)throw new Error(`Gagal mengambil ${file}: ${r.status}`);
  code=await r.text();
 }
 if(marker&&!code.includes(marker))throw new Error(`Marker ${file} tidak ditemukan.`);
 const tmp=`/tmp/${file}.mjs`;await fs.writeFile(tmp,code);const check=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});if(check.status!==0)throw new Error(`Syntax ${file} gagal: ${(check.stderr||check.stdout||'').trim()}`);
 const safe=file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');html=html.replace(new RegExp(`<script\\s+type=["']module["']\\s+src=["']\\./${safe}(?:\\?v=\\d+)?["']><\\/script>\\s*`,'gi'),'');
 const body=html.lastIndexOf('</body>');if(body<0)throw new Error('Tag body penutup tidak ditemukan.');html=html.slice(0,body)+`<script type="module" src="./${file}?v=${version}"></script>\n`+html.slice(body);await fs.writeFile(`.vercel/output/static/${file}`,code);
}
await fs.writeFile(path,html);
try{
 const manifestPath='.vercel/output/static/manifest.json';
 const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 manifest.name='SIMANTEB Online';manifest.short_name='SIMANTEB';
 await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
}catch(e){console.warn('Manifest branding dilewati:',e?.message||e)}
console.log(JSON.stringify({ok:true,displayBrand:'SIMANTEB',technicalBrand:'SIMANTAB',pengawasMenu:['dashboard','attendance','profile','services','monitoring','notifications','needs','promotion','discipline','tpg','status','docs'],pengawasLogin:{channel:'GTK',username:true,dinasBlocked:true},pengawasMenuV2:true,pengawasDashboard:{kadinStyle:true,districtScoped:true,profileDistrict:true,tcsFallback:true},korwilScope:{version:2,levels:['TK','SD','PNF'],exclude:['SMP'],backendRls:true,directSchoolMasterMetrics:true},superAdminMergePengawas:true}));
