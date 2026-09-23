import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='diklat-ks-bcks-v31.js';
const modulePath=new URL('./diklat-ks-bcks-v31.js',import.meta.url);
let html=await fs.readFile(outputPath,'utf8');
let code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_DIKLAT_KS_BCKS_V2'))throw new Error('Modul Diklat KS/BCKS V2 tidak valid.');
if(!code.includes("certificateFlow:'PESERTA_ISI_ADMIN_KSPS_APPROVE'"))throw new Error('Workflow sertifikat peserta/admin KSPS tidak ditemukan.');

// Seleksi Administrasi: 7 dokumen wajib, termasuk Surat Pernyataan Bermeterai.
const oldRequirements=`const REQUIREMENTS=[
 ['IJAZAH_TERAKHIR','Ijazah terakhir'],['SERTIFIKAT_PENDIDIK','Sertifikat Pendidik'],['SK_PNS','SK PNS'],
 ['SKP_1','SKP 1'],['SKP_2','SKP 2'],['SK_PENGALAMAN_MANAJERIAL','SK pengalaman Manajerial'],
 ['SK_HUDIS','SK Hudis'],['SKCK','SKCK'],['PAKTA_INTEGRITAS','Pakta Integritas']
];`;
const newRequirements=`const REQUIREMENTS=[
 ['SKP_1','SKP 1'],
 ['SKP_2','SKP 2'],
 ['SK_PENGALAMAN_MANAJERIAL','SK Pengalaman Manajerial'],
 ['SK_HUDIS','SK Bebas Hudis'],
 ['SKCK','SKCK'],
 ['PAKTA_INTEGRITAS','Pakta Integritas'],
 ['SURAT_PERNYATAAN_DIKLAT','Surat Pernyataan Bermeterai Bersedia Mengikuti Seluruh Proses Diklat KS']
];`;
if(!code.includes(oldRequirements) && !code.includes(newRequirements) && !code.includes("SURAT_PERNYATAAN_DIKLAT"))throw new Error('Daftar berkas Seleksi Administrasi tidak ditemukan.');
if(code.includes(oldRequirements)) code=code.replace(oldRequirements,newRequirements);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const tag=`<script type="module" src="./${moduleName}?v=21"></script>\n`;
html=html.replace(/<script type="module" src="\.\/diklat-ks-bcks(?:-v31)?\.js\?v=\d+"><\/script>\s*/g,'');
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({diklatKsBcks:true,version:17,adminFlow:'KOORDINATOR_ASSIGN_STAFF_VERIFY_DIRECT_KABID',superAdminResetDraft:true,participantSearch:true,paktaUploadFallback:true,fixedKabidComment:true,persistKabidApproval:true,levels:4,level4:'PENCATATAN_SERTIFIKAT',certificateFlow:'PESERTA_ISI_ADMIN_KSPS_APPROVE',adminRequiredFiles:['SKP_1','SKP_2','SK_PENGALAMAN_MANAJERIAL','SK_HUDIS','SKCK','PAKTA_INTEGRITAS','SURAT_PERNYATAAN_DIKLAT'],adminRequiredFileCount:7,fileLimitBytes:512000,adminKsps:'kasim',productionUntouched:true}));