import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='diklat-ks-bcks.js';
const modulePath=new URL('./diklat-ks-bcks.js',import.meta.url);
let html=await fs.readFile(outputPath,'utf8');
let code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_DIKLAT_KS_BCKS_V1'))throw new Error('Modul Diklat KS/BCKS tidak valid.');

// Preview access: Kasim ditetapkan sebagai Admin KSPS melalui capability ADMIN_KSPS.
// Frontend mengenali akun kasim untuk menampilkan panel reviewer; otorisasi final tetap divalidasi RPC/database.
const reviewerNeedle="const isReviewer=()=>REVIEW_ROLES.has(profile().role);";
const reviewerPatch="const isReviewer=()=>REVIEW_ROLES.has(profile().role)||String(profile().username||'').toLowerCase()==='kasim';";
if(!code.includes(reviewerNeedle) && !code.includes(reviewerPatch))throw new Error('Anchor reviewer Diklat KS/BCKS tidak ditemukan.');
code=code.replace(reviewerNeedle,reviewerPatch);

// Level 4 bukan penerbitan oleh SIMANTAB. SIMANTAB hanya mencatat sertifikat
// yang telah diterbitkan oleh lembaga/pihak yang berwenang.
const replacements=[
  [
    'Workflow seleksi administrasi, seleksi substansi, Diklat, dan penerbitan sertifikat.',
    'Workflow seleksi administrasi, seleksi substansi, Diklat, dan pencatatan sertifikat dari pihak berwenang.'
  ],
  [
    "'4. Penerbitan Sertifikat Diklat'",
    "'4. Pencatatan Sertifikat Diklat'"
  ],
  [
    '<h3>Penerbitan Sertifikat Diklat</h3>',
    '<h3>Pencatatan Sertifikat Diklat</h3>'
  ],
  [
    "d.sertifikat_status==='TERBIT'?`<div class=\"small\">Nomor: ${esc(d.sertifikat_nomor)} • ${fmtDate(d.sertifikat_tanggal)}</div>`:''",
    "d.sertifikat_status==='TERCATAT'?`<div class=\"small\">Penerbit: ${esc(d.sertifikat_penerbit||'-')} • Nomor: ${esc(d.sertifikat_nomor)} • ${fmtDate(d.sertifikat_tanggal)}</div>`:''"
  ],
  [
    "d.workflow_stage==='SERTIFIKAT'&&d.sertifikat_status!=='TERBIT'",
    "d.workflow_stage==='SERTIFIKAT'"
  ],
  [
    '<div class=\"grid\"><label class=\"s6\">Nomor Sertifikat<input id=\"certno-${d.submission_id}\"></label><label class=\"s6\">Tanggal Sertifikat<input id=\"certdate-${d.submission_id}\" type=\"date\"></label></div>',
    '<div class=\"grid\"><label class=\"s12\">Lembaga/Pihak Penerbit<input id=\"certissuer-${d.submission_id}\" value=\"${esc(d.sertifikat_penerbit||\'\')}\" placeholder=\"Nama lembaga/pihak yang berwenang\"></label><label class=\"s6\">Nomor Sertifikat<input id=\"certno-${d.submission_id}\" value=\"${esc(d.sertifikat_nomor||\'\')}\"></label><label class=\"s6\">Tanggal Sertifikat<input id=\"certdate-${d.submission_id}\" type=\"date\" value=\"${esc(d.sertifikat_tanggal||\'\')}\"></label></div>'
  ],
  [
    '>Terbitkan Sertifikat</button>',
    ">${d.sertifikat_status==='TERCATAT'?'Perbarui Pencatatan':'Catat Sertifikat'}</button>"
  ],
  [
    'Administrasi → Substansi → Diklat → Penerbitan Sertifikat.',
    'Administrasi → Substansi → Diklat → Pencatatan Sertifikat dari pihak berwenang.'
  ],
  [
    "sb.rpc('ks_bcks_issue_certificate',{p_submission_id:id,p_nomor:$(`certno-${id}`)?.value?.trim(),p_tanggal:$(`certdate-${id}`)?.value||null,p_note:noteFor(id)})",
    "sb.rpc('ks_bcks_record_certificate',{p_submission_id:id,p_nomor:$(`certno-${id}`)?.value?.trim(),p_tanggal:$(`certdate-${id}`)?.value||null,p_penerbit:$(`certissuer-${id}`)?.value?.trim(),p_note:noteFor(id)})"
  ]
];
for(const [from,to] of replacements){
  if(!code.includes(from) && !code.includes(to))throw new Error(`Anchor perubahan Level 4 tidak ditemukan: ${from.slice(0,80)}`);
  code=code.replaceAll(from,to);
}

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const tag=`<script type="module" src="./${moduleName}?v=4"></script>\n`;
html=html.replace(/<script type="module" src="\.\/diklat-ks-bcks\.js\?v=\d+"><\/script>\s*/g,'');
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({diklatKsBcks:true,levels:4,level4:'PENCATATAN_SERTIFIKAT',certificateFormAlwaysVisibleAtLevel4:true,fileLimitBytes:512000,adminKsps:'kasim',productionUntouched:true}));
