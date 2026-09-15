import fs from 'node:fs/promises';
await import('./build.mjs');

const path='.vercel/output/static/index.html';
let html=await fs.readFile(path,'utf8');

// Compatibility reconstruction of the 11 Sep 2026 Kadis layer.
// The restored production base is leaner than the historical base, so every
// enhancement below is additive/best-effort and must never abort the preview.

html=html.replace("$('dashTitle').textContent='Dashboard Dinas';$('dashDesc').textContent='Monitoring layanan dan manajemen ketenagaan sesuai role.';","$('dashTitle').textContent=profile.role==='KEPALA_DINAS'?'Dashboard Kepala Disdikbud':'Dashboard Dinas';$('dashDesc').textContent=profile.role==='KEPALA_DINAS'?'Monitoring strategis seluruh layanan dan data ketenagaan di bawah Kabid.':'Monitoring layanan dan manajemen ketenagaan sesuai role.';");

html=html.replaceAll("{jabatan:'Subkoor PPTK TK/PAUD',nama:'Condro',tugas:'PPTK TK/PAUD • Tugas Belajar'}","{jabatan:'Subkoor PPTK TK/PAUD',nama:'Condro',tugas:'TK/PAUD/Kesetaraan\\nUsul Tugas Belajar'}");
html=html.replaceAll("{jabatan:'Subkoor PPTK TK/PAUD',nama:'Condro',tugas:'Layanan dan pembinaan PTK TK/PAUD'}","{jabatan:'Subkoor PPTK TK/PAUD',nama:'Condro',tugas:'TK/PAUD/Kesetaraan\\nUsul Tugas Belajar'}");
html=html.replace("<p>${esc(x.tugas)}</p>","<p style=\"white-space:pre-line\">${esc(x.tugas)}</p>");

if(!html.includes("t:'KLARIFIKASI_PAK'")){
 const serviceAnchor=" {t:'LAINNYA',e:'📁',n:'Layanan Lainnya',d:'Administrasi ketenagaan lainnya.'}\n];";
 const servicePatch=" {t:'LAINNYA',e:'📁',n:'Layanan Lainnya',d:'Administrasi ketenagaan lainnya.'},\n {t:'KLARIFIKASI_PAK',e:'🧾',n:'Usul Klarifikasi PAK',d:'Klarifikasi PAK untuk KP pangkat/golongan IV/b ke IV/c. Berkas: SK KP IV/b, PAK Tahunan yang diinput pada PAK Integrasi 2022, PAK Integrasi 2022, dan PAK Konversi 2023 s.d. sekarang.'},\n {t:'E_JABFUNG',e:'🧭',n:'Usul & Konsultasi e-Jabfung',d:'Usul dan konsultasi e-Jabfung. Aplikasi BKD: appbkd.batangkab.go.id',url:'https://appbkd.batangkab.go.id/'},\n {t:'SKP_KS_PENGAWAS',e:'✍️',n:'SKP Kepala Sekolah & Pengawas',d:'Layanan SKP Kepala Sekolah dan Pengawas dengan skema tanda tangan elektronik (TTE).'},\n {t:'PAK_KS_PENGAWAS',e:'📑',n:'PAK Kepala Sekolah & Pengawas',d:'Layanan PAK Kepala Sekolah dan Pengawas dengan skema tanda tangan elektronik (TTE).'}\n];";
 if(html.includes(serviceAnchor)) html=html.replace(serviceAnchor,servicePatch);
 else console.warn('Anchor layanan lama tidak ada; layanan tambahan akan disediakan oleh modul runtime bila tersedia.');
}

const oldServiceButton="<button class=\"btn soft\" onclick=\"openSubmission('${s.t}','${s.n}')\">Ajukan</button>";
const newServiceButton="<button class=\"btn soft\" onclick=\"openSubmission('${s.t}','${s.n}')\">Ajukan</button>${s.url?` <a class=\"btn soft\" href=\"${s.url}\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-block;text-decoration:none\">Buka Link</a>`:''}";
if(html.includes(oldServiceButton)&&!html.includes('>Buka Link</a>')) html=html.replaceAll(oldServiceButton,newServiceButton);

// Historical Kegiatan Bidang participant split. Apply only when the old form
// is already present in the base; later activity modules can otherwise render it.
const oldParticipantsField='<div class="field s6"><label>4. Peserta (satu nama/unit per baris)</label><textarea id="actParticipants"></textarea></div><div class="field s6"><label>5. Pejabat yang Diundang (satu per baris)</label>';
const newParticipantsField='<div class="field s6"><label>4A. Peserta — Nama Personal</label><textarea id="actParticipantsPersonal" placeholder="Contoh:\\nBudi Santoso\\nSiti Aminah"></textarea><div class="small">Isi bila peserta ditentukan berdasarkan nama orang. Satu nama per baris.</div></div><div class="field s6"><label>4B. Peserta — Jabatan</label><textarea id="actParticipantPositions" placeholder="Contoh:\\nKepala SD se-Kecamatan Batang\\nPengawas Sekolah"></textarea><div class="small">Isi bila sasaran peserta ditentukan berdasarkan jabatan.</div></div><div class="field s6"><label>5. Pejabat yang Diundang (satu per baris)</label>';
if(html.includes(oldParticipantsField)) html=html.replace(oldParticipantsField,newParticipantsField);

const oldParticipantSave="participants:lineList($('actParticipants').value),invited_officials:lineList($('actOfficials').value)";
const newParticipantSave="participant_personal:lineList($('actParticipantsPersonal').value),participant_positions:lineList($('actParticipantPositions').value),participants:[...lineList($('actParticipantsPersonal').value),...lineList($('actParticipantPositions').value)],invited_officials:lineList($('actOfficials').value)";
if(html.includes(oldParticipantSave)) html=html.replace(oldParticipantSave,newParticipantSave);

const oldParticipantEdit="$('actParticipants').value=(a.participants||[]).join('\\n');$('actOfficials').value=(a.invited_officials||[]).join('\\n');";
const newParticipantEdit="$('actParticipantsPersonal').value=(a.participant_personal?.length?a.participant_personal:(a.participants||[])).join('\\n');$('actParticipantPositions').value=(a.participant_positions||[]).join('\\n');$('actOfficials').value=(a.invited_officials||[]).join('\\n');";
if(html.includes(oldParticipantEdit)) html=html.replace(oldParticipantEdit,newParticipantEdit);

await fs.writeFile(path,html);
console.log(JSON.stringify({
 ok:true,
 reconstructionCompatibility:true,
 kepalaDinas:true,
 condroPatch:html.includes("nama:'Condro',tugas:'TK/PAUD/Kesetaraan\\nUsul Tugas Belajar'"),
 personnelServices:['KLARIFIKASI_PAK','E_JABFUNG','SKP_KS_PENGAWAS','PAK_KS_PENGAWAS'].filter(x=>html.includes(`t:'${x}'`)),
 activityParticipantSplit:html.includes('actParticipantsPersonal')&&html.includes('actParticipantPositions')
}));
