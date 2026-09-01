import fs from 'node:fs/promises';
await import('./build.mjs');
const path='.vercel/output/static/index.html';
let html=await fs.readFile(path,'utf8');
const roleOld="const ROLE_LABEL={SUPER_ADMIN:'Super Admin SIMANTAB',KABID:'Kabid Ketenagaan',KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP',SUBKOOR_TK:'Subkoor PPTK TK/PAUD',STAFF_TPG:'Staff TPG/Tamsil',PENGAWAS:'Pengawas',KEPALA_SEKOLAH:'Kepala Sekolah',GTK:'GTK'};";
const roleNew="const ROLE_LABEL={SUPER_ADMIN:'Super Admin SIMANTAB',KEPALA_DINAS:'Kepala Disdikbud',KABID:'Kabid Ketenagaan',KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP',SUBKOOR_TK:'Subkoor PPTK TK/PAUD',STAFF_TPG:'Staff TPG/Tamsil',PENGAWAS:'Pengawas',KEPALA_SEKOLAH:'Kepala Sekolah',GTK:'GTK'};";
const dinasOld="const DINAS_ROLES=['SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_TPG','PENGAWAS'];";
const dinasNew="const DINAS_ROLES=['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_TPG','PENGAWAS'];";
if(!html.includes(roleOld)&&!html.includes("KEPALA_DINAS:'Kepala Disdikbud'")) throw new Error('ROLE_LABEL anchor not found');
if(!html.includes(dinasOld)&&!html.includes("'KEPALA_DINAS','KABID'")) throw new Error('DINAS_ROLES anchor not found');
html=html.replace(roleOld,roleNew).replace(dinasOld,dinasNew);
html=html.replace("$('dashTitle').textContent='Dashboard Dinas';$('dashDesc').textContent='Monitoring layanan dan manajemen ketenagaan sesuai role.';","$('dashTitle').textContent=profile.role==='KEPALA_DINAS'?'Dashboard Kepala Disdikbud':'Dashboard Dinas';$('dashDesc').textContent=profile.role==='KEPALA_DINAS'?'Monitoring strategis seluruh layanan dan data ketenagaan di bawah Kabid.':'Monitoring layanan dan manajemen ketenagaan sesuai role.';");
html=html.replaceAll("{jabatan:'Subkoor PPTK TK/PAUD',nama:'Condro',tugas:'PPTK TK/PAUD • Tugas Belajar'}","{jabatan:'Subkoor PPTK TK/PAUD',nama:'Condro',tugas:'TK/PAUD/Kesetaraan\\nUsul Tugas Belajar'}");
html=html.replaceAll("{jabatan:'Subkoor PPTK TK/PAUD',nama:'Condro',tugas:'Layanan dan pembinaan PTK TK/PAUD'}","{jabatan:'Subkoor PPTK TK/PAUD',nama:'Condro',tugas:'TK/PAUD/Kesetaraan\\nUsul Tugas Belajar'}");
html=html.replace("<p>${esc(x.tugas)}</p>","<p style=\"white-space:pre-line\">${esc(x.tugas)}</p>");
if(!html.includes("nama:'Condro',tugas:'TK/PAUD/Kesetaraan\\nUsul Tugas Belajar'")) throw new Error('Revisi tugas Condro belum terpasang.');

if(!html.includes("t:'KLARIFIKASI_PAK'")){
 const serviceAnchor=" {t:'LAINNYA',e:'📁',n:'Layanan Lainnya',d:'Administrasi ketenagaan lainnya.'}\n];";
 const servicePatch=" {t:'LAINNYA',e:'📁',n:'Layanan Lainnya',d:'Administrasi ketenagaan lainnya.'},\n {t:'KLARIFIKASI_PAK',e:'🧾',n:'Usul Klarifikasi PAK',d:'Klarifikasi PAK untuk KP pangkat/golongan IV/b ke IV/c. Berkas: SK KP IV/b, PAK Tahunan yang diinput pada PAK Integrasi 2022, PAK Integrasi 2022, dan PAK Konversi 2023 s.d. sekarang.'},\n {t:'E_JABFUNG',e:'🧭',n:'Usul & Konsultasi e-Jabfung',d:'Usul dan konsultasi e-Jabfung. Aplikasi BKD: appbkd.batangkab.go.id',url:'https://appbkd.batangkab.go.id/'},\n {t:'SKP_KS_PENGAWAS',e:'✍️',n:'SKP Kepala Sekolah & Pengawas',d:'Layanan SKP Kepala Sekolah dan Pengawas dengan skema tanda tangan elektronik (TTE).'},\n {t:'PAK_KS_PENGAWAS',e:'📑',n:'PAK Kepala Sekolah & Pengawas',d:'Layanan PAK Kepala Sekolah dan Pengawas dengan skema tanda tangan elektronik (TTE).'}\n];";
 if(!html.includes(serviceAnchor)) throw new Error('Anchor daftar layanan kepegawaian tidak ditemukan.');
 html=html.replace(serviceAnchor,servicePatch);
}
const oldServiceButton="<button class=\"btn soft\" onclick=\"openSubmission('${s.t}','${s.n}')\">Ajukan</button>";
const newServiceButton="<button class=\"btn soft\" onclick=\"openSubmission('${s.t}','${s.n}')\">Ajukan</button>${s.url?` <a class=\"btn soft\" href=\"${s.url}\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-block;text-decoration:none\">Buka Link</a>`:''}";
if(html.includes(oldServiceButton)&&!html.includes('target=\"_blank\" rel=\"noopener\" style=\"display:inline-block;text-decoration:none\">Buka Link</a>')) html=html.replaceAll(oldServiceButton,newServiceButton);
if(!html.includes("t:'KLARIFIKASI_PAK'")||!html.includes("t:'E_JABFUNG'")||!html.includes("t:'SKP_KS_PENGAWAS'")||!html.includes("t:'PAK_KS_PENGAWAS'")) throw new Error('Empat layanan baru belum terpasang.');
await fs.writeFile(path,html);
console.log(JSON.stringify({ok:true,kepalaDinas:true,roleOrder:'SUPER_ADMIN > KEPALA_DINAS > KABID',condroTop:'TK/PAUD/Kesetaraan',condroBottom:'Usul Tugas Belajar',newPersonnelServices:['KLARIFIKASI_PAK','E_JABFUNG','SKP_KS_PENGAWAS','PAK_KS_PENGAWAS']}));
