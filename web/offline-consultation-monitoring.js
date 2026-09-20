/* SIMANTAB_OFFLINE_CONSULTATION_MONITORING_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
if(!sb||!window.showTab)return;

const role=()=>String(p().role||'');
const isDinas=()=>String(p().account_channel||'').toUpperCase()==='DINAS'
  || role().startsWith('STAFF_') || role().startsWith('ADMIN_')
  || ['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','PENGAWAS'].includes(role());
if(!isDinas())return;

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate=v=>v?new Date(v+'T00:00:00').toLocaleDateString('id-ID',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}):'-';
const fmtTime=v=>String(v||'').slice(0,5)||'-';
const fmtDateTime=v=>v?new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}):'-';
const dateKey=v=>{
 if(!v)return'';
 const d=new Date(v);
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 const get=t=>parts.find(x=>x.type===t)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day');
};
const monthKey=v=>dateKey(v).slice(0,7);

async function loadRows(){
 const [done,mine]=await Promise.all([
   sb.from('offline_consultation_queue')
     .select('id,full_name,nip,unit_kerja,service_label,service_code,topic,queue_no,consultation_date,consultation_time,officer_id,officer_name,status,completed_at,updated_at')
     .eq('status','SELESAI').order('completed_at',{ascending:false}).limit(300),
   sb.from('offline_consultation_queue')
     .select('id,full_name,nip,unit_kerja,service_label,service_code,topic,queue_no,consultation_date,consultation_time,officer_id,officer_name,status')
     .eq('officer_id',p().id).in('status',['TERJADWAL','DILAYANI'])
     .order('consultation_date',{ascending:true}).order('consultation_time',{ascending:true}).limit(100)
 ]);
 if(done.error)throw done.error;if(mine.error)throw mine.error;
 return {done:done.data||[],mine:mine.data||[]};
}

function activeHtml(rows){
 if(!rows.length)return '';
 return '<div class="card" style="margin-bottom:12px"><div class="head"><div><h3 style="margin:0">🎟️ Antrian Konsultasi Saya</h3><div class="small">Hanya petugas yang ditugaskan dapat menandai konsultasi selesai.</div></div></div>'+
 '<div class="tablewrap"><table><thead><tr><th>No.</th><th>Jadwal</th><th>Peserta</th><th>Layanan</th><th>Topik</th><th>Aksi</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td><b>'+String(x.queue_no||0).padStart(3,'0')+'</b></td><td>'+esc(fmtDate(x.consultation_date))+'<div class="small">'+esc(fmtTime(x.consultation_time))+' WIB</div></td><td><b>'+esc(x.full_name)+'</b><div class="small">'+esc(x.unit_kerja||'-')+'</div></td><td>'+esc(x.service_label||x.service_code||'-')+'</td><td><div style="max-width:320px;white-space:normal">'+esc(x.topic||'-')+'</div></td><td><button class="btn success" onclick="completeOfflineConsultation(\''+x.id+'\')">✓ Tandai Selesai</button></td></tr>').join('')+
 '</tbody></table></div></div>';
}

function doneHtml(rows){
 const now=new Date(),today=dateKey(now),ym=monthKey(now);
 const todayCount=rows.filter(x=>dateKey(x.completed_at||x.updated_at)===today).length;
 const monthCount=rows.filter(x=>monthKey(x.completed_at||x.updated_at)===ym).length;
 return '<div class="card" id="offlineConsultationMonitoringCard"><div class="head"><div><div class="label">MONITORING DINAS</div><h3 style="margin:3px 0">📚 Rekam Konsultasi Luring Selesai</h3><div class="small">Riwayat konsultasi yang telah diselesaikan oleh petugas dan dapat dilihat seluruh akun Dinas.</div></div><button class="btn soft" onclick="refreshOfflineConsultationMonitoring()">↻ Refresh</button></div>'+
 '<div class="servicegrid" style="margin-bottom:12px"><div class="service"><div class="small">SELESAI HARI INI</div><h3>'+todayCount+'</h3></div><div class="service"><div class="small">SELESAI BULAN INI</div><h3>'+monthCount+'</h3></div><div class="service"><div class="small">TOTAL TEREKAM</div><h3>'+rows.length+'</h3></div></div>'+
 (rows.length?'<div class="tablewrap"><table><thead><tr><th>Selesai</th><th>No.</th><th>Peserta</th><th>Layanan</th><th>Topik Konsultasi</th><th>Petugas</th><th>Jadwal</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+esc(fmtDateTime(x.completed_at||x.updated_at))+'</td><td><b>'+String(x.queue_no||0).padStart(3,'0')+'</b></td><td><b>'+esc(x.full_name)+'</b><div class="small">NIP '+esc(x.nip||'-')+'<br>'+esc(x.unit_kerja||'-')+'</div></td><td>'+esc(x.service_label||x.service_code||'-')+'</td><td><div style="max-width:340px;white-space:normal">'+esc(x.topic||'-')+'</div></td><td>'+esc(x.officer_name||'-')+'</td><td>'+esc(fmtDate(x.consultation_date))+'<div class="small">'+esc(fmtTime(x.consultation_time))+' WIB</div></td></tr>').join('')+
 '</tbody></table></div>':'<div class="empty">Belum ada konsultasi luring yang berstatus selesai.</div>')+'</div>';
}

async function render(){
 const root=$('monitoringBody');if(!root)return;
 $('offlineConsultationMonitoringWrap')?.remove();
 const wrap=document.createElement('div');wrap.id='offlineConsultationMonitoringWrap';
 wrap.innerHTML='<div class="card"><div class="small">Memuat rekam konsultasi luring…</div></div>';
 root.prepend(wrap);
 try{
   const x=await loadRows();
   wrap.innerHTML=activeHtml(x.mine)+doneHtml(x.done);
 }catch(e){
   wrap.innerHTML='<div class="card err">'+esc(e.message||e)+'</div>';
 }
}

window.completeOfflineConsultation=async id=>{
 if(!confirm('Tandai konsultasi ini sebagai selesai?'))return;
 try{
   const {error}=await sb.rpc('complete_offline_consultation',{p_queue_id:id});
   if(error)throw error;
   await render();
 }catch(e){alert(e.message||String(e))}
};
window.refreshOfflineConsultationMonitoring=render;

const priorShow=window.showTab;
window.showTab=async function(id){
 const r=await priorShow.apply(this,arguments);
 if(id==='monitoring'){await wait(80);await render()}
 return r;
};
if(document.querySelector('#monitoring.active'))await render();
window.__simantabOfflineConsultationMonitoring={version:1,dinasRead:true,officerComplete:true};
})();