import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
let html=await fs.readFile(outputPath,'utf8');

// Build starts from current production; remove prior copies before inserting canonical cards.
html=html.replace(/\n\s*\{t:'TUGAS_BELAJAR'[^\n]*\},?/g,'');
html=html.replace(/\n\s*\{t:'PENGEMBANGAN_KOMPETENSI'[^\n]*\},?/g,'');

const anchor=" {t:'LAINNYA',e:'📁',n:'Layanan Lainnya',d:'Administrasi ketenagaan lainnya.'},";
if(!html.includes(anchor))throw new Error('Anchor Layanan Lainnya tidak ditemukan.');

const addition=
" {t:'TUGAS_BELAJAR',e:'🎓',n:'Tugas Belajar',d:'Pengajuan dan konsultasi administrasi Tugas Belajar bagi GTK sesuai ketentuan.'},\n"+
" {t:'PENGEMBANGAN_KOMPETENSI',e:'📚',n:'Pengembangan Kompetensi',d:'Pengajuan dan konsultasi pengembangan kompetensi GTK, termasuk diklat/pelatihan dan kegiatan pengembangan profesional.'},\n";

html=html.replace(anchor,addition+anchor);

if((html.match(/t:'TUGAS_BELAJAR'/g)||[]).length!==1)throw new Error('Tugas Belajar harus tepat satu kartu layanan.');
if((html.match(/t:'PENGEMBANGAN_KOMPETENSI'/g)||[]).length!==1)throw new Error('Pengembangan Kompetensi harus tepat satu kartu layanan.');

await fs.writeFile(outputPath,html);
console.log(JSON.stringify({
 personnelServices:true,
 added:['TUGAS_BELAJAR','PENGEMBANGAN_KOMPETENSI'],
 flow:'GTK -> Kasi/Subkoor bagi tugas -> Admin/Staf -> Approval Kasi/Subkoor -> Kabid -> GTK',
 productionUntouched:true
}));