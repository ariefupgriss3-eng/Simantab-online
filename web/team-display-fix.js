/* SIMANTAB_TEAM_DISPLAY_FIX_V1 */
/* SIMANTAB_TEAM_DISPLAY_FIX_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&!window.showTab;i++)await wait(50);
const $=id=>document.getElementById(id);
function style(){
 if($('teamCurrentMapStyle'))return;
 const s=document.createElement('style');s.id='teamCurrentMapStyle';s.textContent=`
 .team-map-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.team-map-flow>div{background:#f8fbff;border:1px solid #dce8f3;border-radius:13px;padding:12px;text-align:center}.team-map-flow b{display:block;color:#0a3568;margin-bottom:4px}.team-map-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.team-map-staff{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.team-map-item{border:1px solid #e0e8f0;border-radius:12px;padding:11px;background:#fff}.team-map-item h3{margin:0 0 5px;color:#0a3568;font-size:14px}.team-map-item p{margin:0;color:#53697d;font-size:11px;line-height:1.5}.team-map-number{display:inline-flex;width:23px;height:23px;border-radius:50%;background:#eaf3fb;color:#0a3568;align-items:center;justify-content:center;font-size:10px;font-weight:900;margin-right:6px}.team-map-role{font-size:10px;font-weight:900;letter-spacing:.04em;color:#1767b3;text-transform:uppercase}.team-map-list{margin:8px 0 0;padding-left:19px}.team-map-list li{margin:6px 0;line-height:1.55}.team-map-note{margin-top:10px;padding:10px 12px;border-left:4px solid #1767b3;background:#f5f9fd;border-radius:9px;font-size:11px;line-height:1.55}.team-map-title{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.team-map-title h3{margin:0}.team-map-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#edf5ff;color:#175ea7;font-size:9px;font-weight:900}@media(max-width:800px){.team-map-flow,.team-map-grid,.team-map-staff{grid-template-columns:1fr}}
 `;document.head.appendChild(s)
}
function render(){
 const body=$('teamBody');if(!body)return;
 style();
 body.innerHTML=`
 <div class="card" id="leadershipAuthorityCard" style="margin-bottom:12px">
  <div class="team-map-title"><div><div class="team-map-role">Pimpinan Dinas</div><h3>Kepala Disdikbud & Sekretaris Disdikbud</h3></div><span class="team-map-badge">MONITORING & ARAHAN</span></div>
  <div class="team-map-note"><b>Kewenangan:</b> memonitor seluruh kegiatan internal dan layanan kepegawaian semua jenjang, melihat progres dan hasil, serta memberikan komentar, petunjuk, dan arahan. Pimpinan Dinas tidak mengambil alih proses teknis; tindak lanjut operasional dikendalikan Kabid.</div>
 </div>
 <div class="card" style="margin-bottom:12px">
  <h3 style="margin-top:0">🧭 Alur Kerja & Kewenangan Tim Ketenagaan</h3>
  <div class="team-map-flow">
   <div><b>Kadis / Sekdin</b><span>Monitoring, komentar, petunjuk & arahan</span></div>
   <div><b>Kabid</b><span>Memimpin, mengoordinasikan & mengendalikan</span></div>
   <div><b>Kasi / Subkoor</b><span>Koordinator jenjang & verifikasi</span></div>
   <div><b>Staf</b><span>Pelaksana teknis sesuai jenis layanan</span></div>
  </div>
  <div class="team-map-note"><b>Alur layanan:</b> Pemohon/Unit Kerja → Kasi/Subkoor sesuai jenjang → Staf sesuai jenis layanan → Kasi/Subkoor verifikasi/koordinasi → Kabid pengendalian → proses lanjutan/selesai. Kadis dan Sekdin dapat memonitor serta memberi arahan pada seluruh tahapan.</div>
 </div>
 <div class="card" style="margin-bottom:12px">
  <div class="team-map-role">A. Kabid</div><h3>Kabid Pembinaan Ketenagaan</h3>
  <ol class="team-map-list">
   <li>Memimpin dan mengkoordinasikan seluruh kegiatan internal dan layanan kepegawaian semua jenjang.</li>
   <li>Memimpin dan mengkoordinasikan kegiatan pembinaan disiplin termasuk usul perceraian GTK semua jenjang.</li>
  </ol>
 </div>
 <div class="card" style="margin-bottom:12px">
  <div class="team-map-role">B. Kasi dan Subkoordinator PPTK</div>
  <h3>Kewenangan berdasarkan jenjang</h3>
  <div class="team-map-grid" style="margin-top:10px">
   <div class="team-map-item"><h3>Subkoor PPTK TK/PAUD/PNF</h3><p><b>Lingkup:</b> TK/PAUD/PNF</p><ol class="team-map-list"><li>Melaksanakan peran sebagai penanggung jawab kegiatan bidang saat ditunjuk Kabid dan mengkoordinasikan staf pada layanan kepegawaian sesuai jenjang.</li><li>Melaksanakan dan mengkoordinasikan kegiatan pembinaan disiplin termasuk usul perceraian GTK sesuai jenjang.</li></ol></div>
   <div class="team-map-item"><h3>Kasi PPTK SD</h3><p><b>Lingkup:</b> SD</p><ol class="team-map-list"><li>Melaksanakan peran sebagai penanggung jawab kegiatan bidang saat ditunjuk Kabid dan mengkoordinasikan staf pada layanan kepegawaian sesuai jenjang.</li><li>Melaksanakan dan mengkoordinasikan kegiatan pembinaan disiplin termasuk usul perceraian GTK sesuai jenjang.</li></ol></div>
   <div class="team-map-item"><h3>Kasi PPTK SMP</h3><p><b>Lingkup:</b> SMP</p><ol class="team-map-list"><li>Melaksanakan peran sebagai penanggung jawab kegiatan bidang saat ditunjuk Kabid dan mengkoordinasikan staf pada layanan kepegawaian sesuai jenjang.</li><li>Melaksanakan dan mengkoordinasikan kegiatan pembinaan disiplin termasuk usul perceraian GTK sesuai jenjang.</li></ol></div>
  </div>
 </div>
 <div class="card">
  <div class="team-map-role">C. Staf — Pemetaan Tugas Teknis</div>
  <div class="team-map-staff" style="margin-top:10px">
   <div class="team-map-item"><h3><span class="team-map-number">1</span>Kasim, Risna Afif Anshori, Wartono</h3><p>Usul KP, usul Klarifikasi PAK, usul dan konsultasi Jabfung, SKP Kepala Sekolah dan Pengawas, PAK Kepala Sekolah dan Pengawas.</p></div>
   <div class="team-map-item"><h3><span class="team-map-number">2</span>Kasim</h3><p>Promosi KSPSTK.</p></div>
   <div class="team-map-item"><h3><span class="team-map-number">3</span>Wartono</h3><p>Pensiun/Pemberhentian.</p></div>
   <div class="team-map-item"><h3><span class="team-map-number">4</span>Danny Khairunnisa</h3><p>Izin Cuti, Sakit, Umroh.</p></div>
   <div class="team-map-item"><h3><span class="team-map-number">5</span>Sucipto</h3><p>TPG/Tamsil.</p></div>
   <div class="team-map-item"><h3><span class="team-map-number">6</span>Ika Oktaviana Dewi</h3><p>Simtendik dan Admin Kegiatan Bidang.</p></div>
   <div class="team-map-item"><h3><span class="team-map-number">7</span>Rina Ratnawati</h3><p>Kenaikan Gaji Berkala.</p></div>
   <div class="team-map-item"><h3><span class="team-map-number">8</span>Imam Prabowo</h3><p>Usul Penerbitan SK.</p></div>
   <div class="team-map-item"><h3><span class="team-map-number">9</span>Mamik Rustiningsih</h3><p>Pengelolaan Arsip dan Aset.</p></div>
  </div>
  <div class="team-map-note"><b>Prinsip kewenangan:</b> staf melakukan pemeriksaan, pengolahan, verifikasi administratif, pencatatan kekurangan, dan pembaruan status sesuai tugas teknis. Verifikasi/koordinasi jenjang berada pada Kasi/Subkoor, sedangkan pengendalian akhir internal Bidang berada pada Kabid.</div>
 </div>`;
}
function install(){
 const old=window.showTab;
 if(typeof old==='function'&&!window.__teamCurrentMapHook){window.__teamCurrentMapHook=true;window.showTab=async function(id){const r=await old.apply(this,arguments);if(id==='team')setTimeout(render,70);return r}}
 if(document.querySelector('#team.active'))setTimeout(render,70);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
