/* SIMANTAB_KORWIL_SUBMISSION_MONITORING_V1_READONLY */
(async()=>{
 const ready=()=>!!(window.__simantabProfile?.id&&window.__simantabSb&&window.showTab&&window.__simantabSupervisorScope);
 await new Promise(resolve=>{
  if(ready())return resolve();
  const onReady=()=>{if(ready()){window.removeEventListener('simantab:profile-ready',onReady);resolve()}};
  window.addEventListener('simantab:profile-ready',onReady);
 });
 const sb=window.__simantabSb,$=id=>document.getElementById(id),profile=()=>window.__simantabProfile||{};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const localDate=v=>v?new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}):'-';
 const text=v=>String(v||'').replace(/_/g,' ');
 let busy=false,items=[],activeScope=null;
 async function scope(){
  const x=await window.__simantabSupervisorScope.get();
  return profile().role==='PENGAWAS'&&x.kind==='KORWIL'?x:null;
 }
 function renderRows(){
  const root=$('ksmRows');if(!root)return;
  const q=String($('ksmSearch')?.value||'').toLowerCase().trim();
  const rows=items.filter(x=>!q||[x.requester_name,x.school_name,x.service_type,x.title,x.status].some(v=>String(v||'').toLowerCase().includes(q)));
  root.innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(localDate(x.submitted_at))+'</td><td><b>'+esc(x.requester_name)+'</b></td><td><b>'+esc(x.school_name)+'</b><div class="small">'+esc(x.school_level)+' • NPSN '+esc(x.school_npsn)+'</div></td><td>'+esc(text(x.service_type))+'</td><td>'+esc(x.title)+'</td><td><b>'+esc(text(x.status))+'</b><div class="small">'+esc(text(x.workflow_state))+'</div></td></tr>').join(''):'<tr><td colspan="6">Belum ada usulan terpetakan yang cocok dengan pencarian.</td></tr>';
 }
 function draw(){
  const body=$('monitoringBody');if(!body||!activeScope)return;
  const district=activeScope.district.replace(/\b[a-z]/g,c=>c.toUpperCase());
  const done=items.filter(x=>['COMPLETED','REJECTED'].includes(String(x.status).toUpperCase())).length;
  const tiles='<div class="servicegrid" style="margin:12px 0">'+
   '<div class="service"><div class="small">TOTAL USULAN</div><h3>'+items.length+'</h3></div>'+
   '<div class="service"><div class="small">DALAM PROSES</div><h3>'+(items.length-done)+'</h3></div>'+
   '<div class="service"><div class="small">SELESAI / DITOLAK</div><h3>'+done+'</h3></div></div>';
  body.innerHTML='<div class="card" style="margin-bottom:12px;background:#0f3f76;color:#fff"><div class="small" style="color:#dbeafe">MONITORING KORWIL • BACA SAJA</div><h3 style="margin:6px 0">Usulan GTK Kecamatan '+esc(district)+'</h3><div class="small" style="color:#dbeafe">Hanya TK, SD, dan PNF berdasarkan NPSN sekolah. Tidak memuat konsultasi luring.</div></div>'+
   tiles+'<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px"><h3 style="margin:0">Daftar Usulan Layanan</h3><div><input id="ksmSearch" placeholder="Cari GTK, sekolah, layanan" aria-label="Cari usulan" style="padding:9px;max-width:220px"> <button id="ksmRefresh" type="button" class="btn soft">↻ Segarkan</button></div></div>'+
   '<div class="tablewrap"><table><thead><tr><th>Tanggal</th><th>Pengusul</th><th>Sekolah</th><th>Layanan</th><th>Judul</th><th>Status</th></tr></thead><tbody id="ksmRows"></tbody></table></div>'+
   '<p class="small">Usulan tanpa NPSN sekolah valid belum bisa dipetakan. Korwil tidak memiliki tombol verifikasi, persetujuan, atau perubahan status.</p></div>';
  $('ksmSearch').addEventListener('input',renderRows);
  $('ksmRefresh').addEventListener('click',render);
  renderRows();
 }
 async function render(){
  const body=$('monitoringBody');if(busy||!body)return;
  let grant;try{grant=await scope()}catch(e){console.warn('Penugasan Korwil tidak dapat dibaca.',e);return}
  if(!grant)return;
  busy=true;activeScope=grant;
  const h=$('monitoring')?.querySelector('.head h2'),d=$('monitoring')?.querySelector('.head p');
  if(h)h.textContent='Monitoring Usulan GTK Kecamatan';
  if(d)d.textContent='Pemantauan baca-saja atas layanan GTK sesuai wilayah Korwil.';
  body.innerHTML='<div class="card">Memuat usulan GTK dalam wilayah Korwil...</div>';
  try{
   // Cross-user access MUST be checked in a narrow server-side read-only RPC.
   const {data,error}=await sb.rpc('korwil_monitor_submissions');
   if(error)throw error;
   items=(data||[]).filter(x=>['TK','SD','PNF'].includes(String(x.school_level||'').toUpperCase()));
   draw();
  }catch(e){
   const missing=['PGRST202','42883'].includes(String(e.code||''))||/korwil_monitor_submissions/i.test(String(e.message||''));
   body.innerHTML='<div class="card"><b>'+(missing?'Monitoring usulan GTK Kecamatan belum diaktifkan di server.':'Data monitoring Korwil belum dapat dimuat.')+'</b><p class="small">'+(missing?'Fungsi baca-saja berbasis penugasan kecamatan dan NPSN memerlukan pemeriksaan serta persetujuan sebelum diaktifkan. Tidak ada data produksi yang diubah.':'Periksa koneksi dan hak akses server. Sistem tidak menampilkan usulan lintas kecamatan.')+'</p></div>';
   console.warn('Korwil monitoring requires secure RPC',e);
  }finally{busy=false}
 }
 const originalShow=window.showTab;
 window.showTab=async function(id){
  const result=await originalShow.apply(this,arguments);
  if(id==='monitoring'&&$('monitoring')?.classList.contains('active'))await render();
  return result;
 };
 if($('monitoring')?.classList.contains('active'))await render();
 window.__simantabKorwilSubmissionMonitoring={version:1,readOnly:true,rpc:'korwil_monitor_submissions',refresh:render};
})();