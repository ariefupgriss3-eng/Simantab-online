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

// Peserta Kegiatan Bidang dapat ditentukan dengan nama personal maupun jabatan.
const oldParticipantsField='<div class="field s6"><label>4. Peserta (satu nama/unit per baris)</label><textarea id="actParticipants"></textarea></div><div class="field s6"><label>5. Pejabat yang Diundang (satu per baris)</label>';
const newParticipantsField='<div class="field s6"><label>4A. Peserta — Nama Personal</label><textarea id="actParticipantsPersonal" placeholder="Contoh:\\nBudi Santoso\\nSiti Aminah"></textarea><div class="small">Isi bila peserta ditentukan berdasarkan nama orang. Satu nama per baris.</div></div><div class="field s6"><label>4B. Peserta — Jabatan</label><textarea id="actParticipantPositions" placeholder="Contoh:\\nKepala SD se-Kecamatan Batang\\nPengawas Sekolah"></textarea><div class="small">Isi bila sasaran peserta ditentukan berdasarkan jabatan. Peserta yang hadir tetap mengisi nama personal pada daftar hadir.</div></div><div class="field s6"><label>5. Pejabat yang Diundang (satu per baris)</label>';
if(html.includes(oldParticipantsField)) html=html.replace(oldParticipantsField,newParticipantsField);

const oldParticipantSave="participants:lineList($('actParticipants').value),invited_officials:lineList($('actOfficials').value)";
const newParticipantSave="participant_personal:lineList($('actParticipantsPersonal').value),participant_positions:lineList($('actParticipantPositions').value),participants:[...lineList($('actParticipantsPersonal').value),...lineList($('actParticipantPositions').value)],invited_officials:lineList($('actOfficials').value)";
if(html.includes(oldParticipantSave)) html=html.replace(oldParticipantSave,newParticipantSave);

const oldParticipantEdit="$('actParticipants').value=(a.participants||[]).join('\\n');$('actOfficials').value=(a.invited_officials||[]).join('\\n');";
const newParticipantEdit="$('actParticipantsPersonal').value=(a.participant_personal?.length?a.participant_personal:(a.participants||[])).join('\\n');$('actParticipantPositions').value=(a.participant_positions||[]).join('\\n');$('actOfficials').value=(a.invited_officials||[]).join('\\n');";
if(html.includes(oldParticipantEdit)) html=html.replace(oldParticipantEdit,newParticipantEdit);

html=html.replace("participants=lineList($('actParticipants').value),place=","participantPersonal=lineList($('actParticipantsPersonal').value),participantPositions=lineList($('actParticipantPositions').value),participants=[...participantPersonal,...participantPositions],place=");
const oldAudience="audience=participants.length?`${participants.length} peserta yang berasal dari unsur ${participants.slice(0,4).join(', ')}${participants.length>4?', dan unsur terkait lainnya':''}`:'peserta dari unsur terkait';";
const newAudience="audience=[participantPersonal.length?`${participantPersonal.length} peserta personal: ${participantPersonal.slice(0,4).join(', ')}${participantPersonal.length>4?', dan lainnya':''}`:'',participantPositions.length?`peserta berdasarkan jabatan: ${participantPositions.join(', ')}`:''].filter(Boolean).join('; ')||'peserta dari unsur terkait';";
if(html.includes(oldAudience)) html=html.replace(oldAudience,newAudience);

html=html.replace("manual=(a.participants||[]).filter(name=>!gtk.some(x=>x.full_name.toLowerCase()===name.toLowerCase()))","manual=(a.participant_personal?.length?a.participant_personal:(a.participants||[])).filter(name=>!gtk.some(x=>x.full_name.toLowerCase()===name.toLowerCase()))");
html=html.replace("rows(a.participants||[],'participant',a.participant_signatures||[])","rows(a.participant_personal?.length?a.participant_personal:(a.participants||[]),'participant',a.participant_signatures||[])");
html=html.replace("(group==='official'?a.invited_officials:a.participants)[index]","(group==='official'?a.invited_officials:(a.participant_personal?.length?a.participant_personal:(a.participants||[])))[index]");
html=html.replace("names=group==='official'?a.invited_officials:a.participants","names=group==='official'?a.invited_officials:(a.participant_personal?.length?a.participant_personal:(a.participants||[]))");

const oldParticipantPrint="if(type==='PARTICIPANTS')return `<h2>DAFTAR HADIR PESERTA</h2>${detail}<table class=\"att\">";
const newParticipantPrint="if(type==='PARTICIPANTS')return `<h2>DAFTAR HADIR PESERTA</h2>${detail}${(a.participant_positions||[]).length?`<p><b>Sasaran peserta berdasarkan jabatan:</b> ${esc((a.participant_positions||[]).join(', '))}</p>`:''}<table class=\"att\">";
if(html.includes(oldParticipantPrint)) html=html.replace(oldParticipantPrint,newParticipantPrint);

const oldReportParticipants="${section('IV. Pelaksanaan dan Peserta',`Kegiatan diikuti oleh ${(a.participants||[]).join(', ')||'peserta dari unsur terkait'}. Pejabat yang diundang: ${(a.invited_officials||[]).join(', ')||'-'}. Narasumber: ${(a.speakers||[]).join(', ')||'-'}.`)}";
const newReportParticipants="${section('IV. Pelaksanaan dan Peserta',`Peserta personal yang ditetapkan: ${(a.participant_personal?.length?a.participant_personal:[]).join(', ')||'diisi melalui daftar hadir'}. Sasaran peserta berdasarkan jabatan: ${(a.participant_positions||[]).join(', ')||'-'}. Pejabat yang diundang: ${(a.invited_officials||[]).join(', ')||'-'}. Narasumber: ${(a.speakers||[]).join(', ')||'-'}.`)}";
if(html.includes(oldReportParticipants)) html=html.replace(oldReportParticipants,newReportParticipants);

if(!html.includes('actParticipantsPersonal')||!html.includes('actParticipantPositions')) throw new Error('Form peserta personal/jabatan belum terpasang.');
await fs.writeFile(path,html);
console.log(JSON.stringify({ok:true,kepalaDinas:true,roleOrder:'SUPER_ADMIN > KEPALA_DINAS > KABID',condroTop:'TK/PAUD/Kesetaraan',condroBottom:'Usul Tugas Belajar',newPersonnelServices:['KLARIFIKASI_PAK','E_JABFUNG','SKP_KS_PENGAWAS','PAK_KS_PENGAWAS'],activityParticipants:['PERSONAL','JABATAN']}));
