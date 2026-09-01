/* SIMANTAB_TPG_CONSULTATION_INFO_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.showTab||!window.openSubmission);i++)await wait(50);
const $=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
const DINAS_ROLES=['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN','STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN','STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK','PENGAWAS'];
const isDinas=()=>DINAS_ROLES.includes(p().role);
const isApplicant=()=>['GTK','KEPALA_SEKOLAH'].includes(p().role);
function infoHtml(){return `<div class="card" id="tpgConsultInfo" style="margin-bottom:13px">
 <div class="head" style="margin-bottom:10px"><div><h3 style="margin:0">💬 Ruang Konsultasi dan Informasi TPG/Tamsil</h3><p>Konsultasi layanan aneka tunjangan dan informasi penyelesaian kendala data.</p></div></div>
 <div class="grid">
  <div class="card s6" style="box-shadow:none"><div class="label">Pengelolaan Data</div><p class="small">Informasi input dan pembaruan data guru/tenaga kependidikan pada sistem pendataan, termasuk keterkaitan Dapodik dan SIMTUN.</p></div>
  <div class="card s6" style="box-shadow:none"><div class="label">Verifikasi & Validasi</div><p class="small">Konsultasi kevalidan beban kerja, kualifikasi, status kepegawaian, nomor rekening, dan unsur data lain yang memengaruhi kelayakan penyaluran.</p></div>
  <div class="card s6" style="box-shadow:none"><div class="label">Sinkronisasi Sistem</div><p class="small">Informasi penyelarasan data satuan pendidikan dengan server pusat agar data siap ditarik dan diproses oleh kementerian terkait.</p></div>
  <div class="card s6" style="box-shadow:none"><div class="label">Penanganan Kendala</div><p class="small">Konsultasi data invalid pada Info GTK serta kendala administrasi/teknis pencairan TPG, Tamsil, THR, dan Gaji ke-13.</p></div>
 </div>
 ${isApplicant()?`<div class="info" style="margin-top:10px"><b>Pilih topik konsultasi.</b> Pertanyaan akan masuk ke antrean TPG/Tamsil dan dapat dipantau melalui Status Usulan.</div><div class="quick" style="margin-top:10px">
  <button onclick="openTpgConsultation('TPG')">🎓<b>Konsultasi TPG</b><span>Validasi, Info GTK, rekening, pencairan.</span></button>
  <button onclick="openTpgConsultation('Tamsil')">💳<b>Konsultasi Tamsil</b><span>Status data dan penyaluran tambahan penghasilan.</span></button>
  <button onclick="openTpgConsultation('THR')">🎁<b>Konsultasi THR</b><span>Informasi kelayakan dan proses penyaluran.</span></button>
  <button onclick="openTpgConsultation('Gaji ke-13')">📅<b>Konsultasi Gaji ke-13</b><span>Informasi data dan proses pembayaran.</span></button>
 </div>`:`<div class="info" style="margin-top:10px"><b>Ruang layanan Dinas.</b> Konsultasi dari GTK/sekolah tampil pada antrean TPG/Tamsil di bawah. Petugas dapat memverifikasi dan memperbarui status sesuai kewenangan.${p().role==='STAFF_TPG'?'<br><b>Petugas utama:</b> layanan TPG/Tamsil.':''}</div>`}
 </div>`}
function decorateTpg(){const body=$('tpgBody');if(!body||$('tpgConsultInfo'))return;body.insertAdjacentHTML('afterbegin',infoHtml())}
window.openTpgConsultation=async topic=>{
 if(!isApplicant())return;
 window.openSubmission('TPG_TAMSIL',`Konsultasi ${topic}`);
 await wait(30);
 const title=$('subTitle'),desc=$('subDesc');
 if(title)title.value=`Konsultasi ${topic}`;
 if(desc)desc.value=`Topik konsultasi: ${topic}\n\nPertanyaan/kendala:\n\nData pendukung yang perlu diperiksa (bila ada):\n- Status Info GTK / validasi data\n- Beban kerja / kualifikasi / status kepegawaian\n- Rekening\n- Sinkronisasi Dapodik/SIMTUN\n- Status/proses penyaluran\n\nKeterangan tambahan:`;
};
const priorShow=window.showTab;
window.showTab=async id=>{await priorShow(id);if(id==='tpg'){await wait(60);decorateTpg()}};
if(document.querySelector('.section.active')?.id==='tpg'){await wait(60);decorateTpg()}
})();
