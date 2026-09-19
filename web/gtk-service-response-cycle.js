/* SIMANTAB_GTK_SERVICE_RESPONSE_CYCLE_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
if(!sb||!window.showTab)return;
const role=()=>String(p().role||'');
const isGtk=()=>String(p().account_channel||'')==='GTK'||['GTK','KEPALA_SEKOLAH'].includes(role());
if(!isGtk())return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
const LABEL={
 KP:'Kenaikan Pangkat',CUTI:'Cuti',PENSIUN:'Pensiun',MUTASI:'Mutasi',KGB:'Kenaikan Gaji Berkala',
 LAINNYA:'Layanan Lainnya',KLARIFIKASI_PAK:'Klarifikasi PAK',E_JABFUNG:'e-Jabfung',
 SKP_KS_PENGAWAS:'SKP KS/Pengawas',PAK_KS_PENGAWAS:'PAK KS/Pengawas',
 USUL_SK:'Usul Penerbitan SK',TPG_TAMSIL:'TPG/Tamsil'
};
const labelService=v=>LABEL[v]||String(v||'-').replaceAll('_',' ');
async function loadData(){
 const s=await sb.from('submissions')
   .select('id,service_type,title,description,status,workflow_state,submitted_at,updated_at')
   .eq('user_id',p().id)
   .neq('service_type','DIKLAT_KS_BCKS')
   .order('submitted_at',{ascending:false});
 if(s.error)throw s.error;
 const subs=s.data||[],ids=subs.map(x=>x.id);
 let cycles=[];
 if(ids.length){
  const c=await sb.from('submission_response_cycles')
   .select('id,submission_id,cycle_no,staff_response,staff_response_at,coordinator_status,kabid_status,delivered_at,gtk_reply,gtk_replied_at,cycle_status,closed_at')
   .in('submission_id',ids)
   .not('delivered_at','is',null)
   .order('cycle_no',{ascending:true});
  if(c.error)throw c.error;cycles=c.data||[];
 }
 return{subs,cycles};
}
function cycleHistory(list){
 return '<div style="display:grid;gap:8px">'+list.map(c=>'<div style="border:1px solid var(--line);border-radius:12px;padding:11px;background:#fff"><div style="display:flex;justify-content:space-between;gap:8px"><b>Siklus '+esc(c.cycle_no)+'</b><span class="small">'+fmt(c.delivered_at)+'</span></div><div class="info" style="margin-top:8px"><b>Respon Resmi</b><div style="white-space:pre-wrap;margin-top:5px">'+esc(c.staff_response||'-')+'</div></div>'+(c.gtk_reply?'<div class="notice" style="margin-top:8px"><b>Tindak Lanjut Anda</b><div style="white-space:pre-wrap;margin-top:5px">'+esc(c.gtk_reply)+'</div><div class="small" style="margin-top:4px">'+fmt(c.gtk_replied_at)+'</div></div>':'')+'</div>').join('')+'</div>';
}
async function renderGtkResponses(){
 const body=$('statusBody');if(!body)return;
 body.querySelector('#gtkResponseCyclePanel')?.remove();
 try{
  const d=await loadData(),by=new Map;
  for(const c of d.cycles){if(!by.has(c.submission_id))by.set(c.submission_id,[]);by.get(c.submission_id).push(c)}
  const rows=d.subs.filter(s=>(by.get(s.id)||[]).length);
  if(!rows.length)return;
  const html='<div id="gtkResponseCyclePanel" class="card" style="margin-bottom:14px;border-color:#b9d6ef"><div class="label">RESPON RESMI LAYANAN</div><h3 style="margin:4px 0 6px">Respon yang Telah Disetujui Kabid</h3><div class="small" style="margin-bottom:12px">Respon hanya tampil di sini setelah melalui Admin/Staf → Kasi/Subkoor → Kabid.</div>'+
   rows.map(s=>{const list=by.get(s.id)||[],latest=list[list.length-1],waiting=s.workflow_state==='MENUNGGU_KONFIRMASI_GTK'&&latest?.cycle_status==='DELIVERED';return '<div style="border-top:1px solid var(--line);padding:13px 0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap"><div><b>'+esc(s.title||labelService(s.service_type))+'</b><div class="small">'+esc(labelService(s.service_type))+' • diajukan '+fmt(s.submitted_at)+'</div></div><span class="chip">'+esc(waiting?'Menunggu Konfirmasi Anda':s.workflow_state==='SELESAI'?'Selesai':'Dalam Tindak Lanjut')+'</span></div><div style="margin-top:10px">'+cycleHistory(list)+'</div>'+(waiting?'<div class="card" style="margin-top:10px;background:#f8fbff"><div class="label">KONFIRMASI GTK</div><div class="small" style="margin:5px 0 8px">Jika jawaban sudah menyelesaikan kebutuhan, pilih <b>Layanan Selesai</b>. Jika masih ada yang perlu ditindaklanjuti, tuliskan pesan lalu kirim.</div><div class="field"><label>Tindak lanjut / pertanyaan tambahan</label><textarea id="gtkFollowup-'+s.id+'" placeholder="Tuliskan tindak lanjut apabila layanan belum selesai..."></textarea></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn success" onclick="gtkMarkServiceDone(\''+s.id+'\')">✅ Layanan Selesai</button><button class="btn primary" onclick="gtkSendServiceFollowup(\''+s.id+'\')">↩️ Kirim Tindak Lanjut</button></div><div id="gtkResponseMsg-'+s.id+'" class="small" style="margin-top:7px"></div></div>':'')+'</div>'}).join('')+
   '</div>';
  body.insertAdjacentHTML('afterbegin',html);
 }catch(e){console.error('GTK response cycle',e)}
}
window.gtkMarkServiceDone=async id=>{
 if(!confirm('Nyatakan layanan ini sudah selesai?'))return;
 const msg=$('gtkResponseMsg-'+id);if(msg)msg.textContent='Menyimpan konfirmasi...';
 const {error}=await sb.rpc('submission_gtk_response',{p_submission_id:id,p_done:true,p_followup:null});
 if(error){if(msg)msg.textContent=error.message;return}
 if(msg)msg.textContent='Layanan telah dinyatakan selesai.';
 if(typeof window.loadStatus==='function')await window.loadStatus();
 await renderGtkResponses();
};
window.gtkSendServiceFollowup=async id=>{
 const text=String($('gtkFollowup-'+id)?.value||'').trim(),msg=$('gtkResponseMsg-'+id);
 if(!text){if(msg)msg.textContent='Tindak lanjut/pertanyaan wajib diisi.';return}
 if(msg)msg.textContent='Mengirim tindak lanjut...';
 const {error}=await sb.rpc('submission_gtk_response',{p_submission_id:id,p_done:false,p_followup:text});
 if(error){if(msg)msg.textContent=error.message;return}
 if(msg)msg.textContent='Tindak lanjut terkirim ke admin/staf untuk siklus berikutnya.';
 if(typeof window.loadStatus==='function')await window.loadStatus();
 await renderGtkResponses();
};
const priorShow=window.showTab;
window.showTab=async function(id){
 const r=await priorShow.apply(this,arguments);
 if(id==='status'&&isGtk())await renderGtkResponses();
 return r;
};
if($('status')?.classList.contains('active'))await renderGtkResponses();
window.__simantabGtkServiceResponseCycle={version:1,approvalRequired:true,gtkConfirmation:true,repeatUntilClosed:true};
})();