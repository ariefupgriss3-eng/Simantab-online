/* SIMANTAB_ADMIN_DATA_SUMMARY_FIX_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=window.__simantabProfile||{};
if(!sb||!window.showTab||p.role!=='SUPER_ADMIN')return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function render(){
 const body=$('adminDataBody');if(!body)return;
 body.innerHTML='<div class="card"><div class="small">Memuat ringkasan data admin…</div></div>';
 const {data,error}=await sb.rpc('super_admin_data_summary_restore');
 if(error){body.innerHTML=`<div class="card err">${esc(error.message)}</div>`;return}
 const d=data||{};
 const cards=[
  ['Usulan Layanan',d.submissions??0],
  ['Riwayat Status',d.submission_events??0],
  ['Metadata Berkas',d.submission_files??0],
  ['Notifikasi',d.notifications??0],
  ['Promosi/Disiplin',d.supervision_cases??0],
  ['Daftar Hadir',d.attendance_entries??0]
 ];
 body.innerHTML=`<div class="card" style="margin-bottom:12px"><div class="notice"><b>Mode Preview aman:</b> Ringkasan ini dibaca melalui RPC khusus Super Admin. Tombol revisi/hapus tetap belum diaktifkan karena Preview memakai database restorasi yang sama dengan Production.</div></div><div class="grid">${cards.map(x=>`<div class="card s4"><div class="label">${esc(x[0])}</div><div class="metric">${esc(x[1])}</div></div>`).join('')}</div>`;
}
const oldShow=window.showTab;
window.showTab=async id=>{await oldShow(id);if(id==='adminData')await render()};
if(document.querySelector('#adminData.section.active'))await render();
window.__simantabAdminDataSummaryFix={version:1,rpc:'super_admin_data_summary_restore'};
})();