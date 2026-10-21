/* SIMANTAB_GTK_DAILY_REPORT_V1 — snapshot agregat, read-only.
 * RPC memeriksa peran Dinas di server. Tidak mengekspor identitas pribadi.
 */
(async () => {
'use strict';
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = n => Number(n || 0).toLocaleString('id-ID');
const roleOk = p => p?.account_channel === 'DINAS'
  && p?.approval_status === 'APPROVED' && p?.is_active !== false
  && ['SUPER_ADMIN','KABID','KEPALA_DINAS','SEKRETARIS_DINAS','KASI_SD','KASI_SMP'].includes(p.role);
let state = null, prior = null, loading = false;
const textReport = r => {
 const m=r.metrik,tri=m.pending_triage||{};
 return [
  'LAPORAN PAGI SIMANTAB • SMART-GTK',
  'Snapshot: '+r.tanggal+' (WIB)',
  'Akun GTK terdaftar: '+num(m.gtk_terdaftar),
  'Disetujui: '+num(m.gtk_disetujui)+' (aktif: '+num(m.gtk_disetujui_aktif)+')',
  'Sudah mengisi SMART-GTK: '+num(m.gtk_sudah_mengisi),
  'Belum mengisi di antara akun disetujui aktif: '+num(m.gtk_belum_mengisi_akun_aktif),
  'Draf: '+num(m.gtk_draf)+' | Berkas lengkap (belum tentu diverifikasi): '+num(m.gtk_berkas_lengkap),
  'Akun GTK pending: '+num(m.gtk_pending)+' | NIP bentur akun aktif: '+num(tri.NIP_BENTUR_AKTIF),
  'Kelompok NIP ganda: '+num(m.nip_ganda_kelompok)+' (lebih dari satu akun aktif: '+num(m.nip_ganda_kelompok_aktif)+')',
  'Perhatian: pending aktif tidak lazim '+num(m.gtk_pending_aktif_tidak_lazim),
  'Tindak lanjut: Korwil/Kepala SMP mendampingi pengisian; Super Admin verifikasi pending dan NIP ganda.',
  'Tenggat: 26 Oktober 2026, 23.59 WIB.',
  'CATATAN: angka belum mendaftar se-Kabupaten Batang BELUM TERSEDIA tanpa daftar induk GTK tervalidasi.'
 ].join('\n');
};
const table = (rows, nameKey) => {
 if(!rows?.length)return '<p class="small">Belum ada data terpetakan.</p>';
 return '<div class="tablewrap"><table><thead><tr><th>'+nameKey+'</th><th>Akun aktif</th><th>Mengisi</th><th>Belum mengisi</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+esc(nameKey==='Kecamatan'?x.kecamatan:x.sekolah)+'</td><td>'+num(x.aktif)+'</td><td>'+num(x.mengisi)+'</td><td>'+num(x.belum)+'</td></tr>').join('')+
 '</tbody></table></div>';
};
function draw() {
 const root=$('simGtkDailyReportPanel'); if(!root)return;
 const r=state;
 if(!r?.metrik){root.innerHTML='<b>📊 Laporan Pagi SMART-GTK</b><p class="small">Belum ada snapshot terjadwal yang tersimpan. Pengambilan data otomatis dijadwalkan pukul 08.00 WIB pada 22–26 Oktober 2026.</p><button type="button" class="btn soft" id="simGtkRptReload">↻ Periksa laporan</button>'; $('simGtkRptReload')?.addEventListener('click',refresh);return;}
 const m=r.metrik,tri=m.pending_triage||{},today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const stale=r.tanggal!==today;
 const pct=m.gtk_disetujui_aktif?Math.round(100*m.gtk_sudah_mengisi/m.gtk_disetujui_aktif):0;
 const stat=(label,value)=>'<div class="service" style="min-width:130px"><div class="small">'+esc(label)+'</div><h3 style="margin:4px 0">'+num(value)+'</h3></div>';
 root.innerHTML='<div style="display:flex;justify-content:space-between;gap:9px;align-items:center;flex-wrap:wrap"><div><div class="label">DINAS • PENDATAAN GTK • AGREGAT</div><h3 style="margin:5px 0">📊 Laporan Pagi SMART-GTK</h3><p class="small" style="margin:0">Snapshot '+esc(r.tanggal)+' • dibuat '+esc(new Date(r.dibuat_pada).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}))+' WIB'+(stale?' • Laporan hari ini belum tersedia':'')+'</p></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button type="button" class="btn soft" id="simGtkRptReload">↻ Segarkan</button><button type="button" class="btn primary" id="simGtkRptCopy">Salin laporan WA</button></div></div>'+
 '<div class="servicegrid" style="margin:13px 0">'+stat('Terdaftar GTK',m.gtk_terdaftar)+stat('Aktif disetujui',m.gtk_disetujui_aktif)+stat('Sudah mengisi',m.gtk_sudah_mengisi)+stat('Belum mengisi (akun aktif)',m.gtk_belum_mengisi_akun_aktif)+stat('Pending GTK',m.gtk_pending)+stat('NIP ganda (kelompok)',m.nip_ganda_kelompok)+'</div>'+
 '<p class="small"><b>Capaian dari akun aktif:</b> '+pct+'% · Draf: '+num(m.gtk_draf)+' · Berkas lengkap (belum berarti diverifikasi): '+num(m.gtk_berkas_lengkap)+' · Akun disetujui tetapi nonaktif: '+num(m.gtk_disetujui_nonaktif)+'.</p>'+
 '<p class="small"><b>Antrean Super Admin:</b> NIP berbenturan dengan akun aktif '+num(tri.NIP_BENTUR_AKTIF)+'; NIP ganda tanpa benturan aktif '+num(tri.NIP_GANDA_TIDAK_AKTIF)+'; perlu periksa NIP/status '+num(tri.PERIKSA_STATUS_DAN_NIP)+'; lengkapi unit '+num(tri.LENGKAPI_UNIT)+'; verifikasi administrasi '+num(tri.VERIFIKASI_ADMIN)+'. Pending tetapi ditandai aktif: '+num(m.gtk_pending_aktif_tidak_lazim)+'. Tidak ada persetujuan otomatis.</p>'+
 '<p class="small" style="font-weight:700">Tenggat: 26 Oktober 2026, 23.59 WIB. Angka belum mendaftar seluruh Kabupaten belum tersedia tanpa master GTK tervalidasi.</p>'+
 '<details><summary style="cursor:pointer;font-weight:700">Rincian pendampingan per kecamatan dan SMP</summary><h4>Rekap per Kecamatan</h4>'+table(m.per_kecamatan,'Kecamatan')+'<h4>Rekap per SMP</h4>'+table(m.per_smp,'SMP')+'<p class="small">Unit yang belum memiliki NPSN valid tergabung pada kelompok BELUM TERPETAKAN. Tabel ini menghitung akun, bukan seluruh guru sekolah.</p></details>';
 $('simGtkRptReload')?.addEventListener('click',refresh);
 $('simGtkRptCopy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(textReport(state));$('simGtkRptCopy').textContent='✓ Tersalin';}catch(e){window.prompt('Salin ringkasan laporan:',textReport(state));}});
}
async function refresh() {
 if(loading||!roleOk(window.__simantabProfile))return;
 const root=$('simGtkDailyReportPanel');if(!root)return;
 loading=true;
 root.innerHTML='<b>📊 Laporan Pagi SMART-GTK</b><p class="small">Memuat snapshot terlindungi...</p>';
 try{
  const {data,error}=await window.__simantabSb.rpc('simantab_gtk_daily_report');
  if(error)throw error;
  if(!roleOk(window.__simantabProfile))return;
  state=data;draw();
 }catch(e){root.innerHTML='<b>📊 Laporan Pagi SMART-GTK</b><p class="err">Gagal memuat rekap. Periksa jaringan/hak akses dan hubungi Super Admin. Tidak ada data pribadi yang ditampilkan.</p>';console.warn('SIMANTAB_GTK_DAILY_REPORT',e?.code||'rpc_failed');}
 finally{loading=false;}
}
function mount() {
 const panel=$('simGtkDailyReportPanel');
 if(!roleOk(window.__simantabProfile)){panel?.remove();state=null;return;}
 const dashboard=$('dashboard'),body=$('dashboardBody');
 if(!dashboard||!body)return;
 if(!panel){const el=document.createElement('section');el.id='simGtkDailyReportPanel';el.className='card';el.style.cssText='margin:0 0 15px;border:1px solid #a8c4de';dashboard.insertBefore(el,body);refresh();}
}
window.addEventListener('simantab:profile-ready',mount);
if(window.__simantabProfile)mount();
window.__simantabGtkDailyReport={version:1,readonly:true,refresh};
})();
