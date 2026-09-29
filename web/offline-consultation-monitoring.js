/* SIMANTAB_OFFLINE_CONSULTATION_MONITORING_V1 */
/* SIMANTAB_OFFLINE_CONSULTATION_MONITORING_V3_ALL_SUBMISSIONS */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
if(!sb||!window.showTab)return;

const role=()=>String(p().role||'').toUpperCase();
const isDinas=()=>String(p().account_channel||'').toUpperCase()==='DINAS'
  || role().startsWith('STAFF_') || role().startsWith('ADMIN_')
  || ['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','PENGAWAS','KORWIL'].includes(role());
if(!isDinas())return;

const LEADERS=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
const isLeader=()=>LEADERS.has(role());
const isStaff=()=>role().startsWith('STAFF_')||role().startsWith('ADMIN_');
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
let state={done:[],mine:[],actions:[],targets:[]};

function ensureStyle(){
 if($('offlineConsultationMonitoringStyle'))return;
 const s=document.createElement('style');s.id='offlineConsultationMonitoringStyle';
 s.textContent=`
 .ocm-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:900}
 .ocm-badge-arahan{background:#fff7ed;color:#9a3412}.ocm-badge-respon{background:#ecfdf5;color:#166534}.ocm-badge-tl{background:#eef2ff;color:#4338ca}
 .ocm-modal{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:18px}
 .ocm-dialog{width:min(900px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 24px 70px rgba(15,23,42,.3);padding:18px}
 .ocm-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ocm-close{border:0;background:#f1f5f9;border-radius:12px;padding:8px 12px;font-weight:900;cursor:pointer}
 .ocm-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.ocm-kv{border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#f8fafc}.ocm-kv b{display:block;font-size:11px;color:#64748b;text-transform:uppercase}.ocm-kv span{display:block;margin-top:3px;font-weight:800;color:#0f2f54}
 .ocm-timeline{display:grid;gap:9px;margin-top:12px}.ocm-action{border:1px solid #e2e8f0;border-left:5px solid #94a3b8;border-radius:12px;padding:10px 12px;background:#fff}.ocm-action.ARAHAN{border-left-color:#f59e0b}.ocm-action.RESPON{border-left-color:#22c55e}.ocm-action.TINDAK_LANJUT{border-left-color:#6366f1}
 .ocm-action-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.ocm-action-msg{margin-top:7px;white-space:pre-wrap;color:#334155}
 .ocm-form{margin-top:14px;padding:12px;border:1px solid #dbeafe;background:#f8fbff;border-radius:14px}.ocm-form textarea,.ocm-form select{width:100%;box-sizing:border-box;margin-top:6px}
 .ocm-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}
 @media(max-width:720px){.ocm-summary{grid-template-columns:1fr}.ocm-dialog{padding:13px}.ocm-actions .btn{width:100%}}
 `;
 document.head.appendChild(s);
}
function ensureMonitoringEntry(){
 const nav=$('nav');
 if(nav&&!nav.querySelector('[data-tab="monitoring"]')){
   const b=document.createElement('button');b.className='navbtn';b.dataset.tab='monitoring';b.onclick=()=>window.showTab?.('monitoring');
   b.innerHTML='<span class="ico">📊</span>Monitoring';
   const act=nav.querySelector('[data-tab="activities"]');act?act.after(b):nav.appendChild(b);
 }
 const main=document.querySelector('main.content');
 if(main&&!$('monitoring')){
   const sec=document.createElement('section');sec.id='monitoring';sec.className='section';
   sec.innerHTML='<div class="head"><div><h2>Monitoring</h2><p>Monitoring layanan Bidang Ketenagaan.</p></div></div><div id="monitoringBody"></div>';
   const footer=main.querySelector('.footer');footer?main.insertBefore(sec,footer):main.appendChild(sec);
 }else if($('monitoring')&&!$('monitoringBody')){
   const body=document.createElement('div');body.id='monitoringBody';$('monitoring').appendChild(body);
 }
}
function scopeText(){
 if(role()==='KASI_SD')return 'Monitoring dan arahan khusus jenjang SD.';
 if(role()==='KASI_SMP')return 'Monitoring dan arahan khusus jenjang SMP.';
 if(role()==='SUBKOOR_TK')return 'Monitoring dan arahan khusus jenjang TK/PAUD.';
 if(['KEPALA_DINAS','SEKRETARIS_DINAS','KABID','SUPER_ADMIN'].includes(role()))return 'Monitoring seluruh jenjang dan pemberian arahan kepada staf.';
 if(isStaff())return 'Monitoring seluruh rekam; staf dapat merespon dan mencatat tindak lanjut arahan pimpinan.';
 return 'Monitoring rekam konsultasi sesuai hak akses akun Dinas.';
}

async function loadRows(){
 const base='id,user_id,full_name,nip,unit_kerja,participant_jenjang,service_label,service_code,topic,queue_no,consultation_date,consultation_time,officer_id,officer_name,status,completed_at,updated_at,created_at';
 const requests=[
   sb.from('offline_consultation_queue').select(base).in('status',['TERJADWAL','DILAYANI','SELESAI']).order('created_at',{ascending:false}).limit(500),
   sb.from('offline_consultation_queue').select(base).eq('officer_id',p().id).in('status',['TERJADWAL','DILAYANI']).order('consultation_date',{ascending:true}).order('consultation_time',{ascending:true}).limit(100),
   sb.from('offline_consultation_actions').select('id,queue_id,action_type,message,author_id,author_name,author_role,target_user_id,target_name,created_at').order('created_at',{ascending:true}).limit(2000)
 ];
 if(isLeader())requests.push(sb.rpc('offline_consultation_staff_targets'));
 const out=await Promise.all(requests);
 for(const x of out)if(x.error)throw x.error;
 return {done:out[0].data||[],mine:out[1].data||[],actions:out[2].data||[],targets:out[3]?.data||[]};
}

function actionBadge(actions){
 if(!actions.length)return '<span class="small">Belum ada arahan</span>';
 const nA=actions.filter(x=>x.action_type==='ARAHAN').length;
 const nR=actions.filter(x=>x.action_type==='RESPON').length;
 const nT=actions.filter(x=>x.action_type==='TINDAK_LANJUT').length;
 return '<div style="display:flex;gap:5px;flex-wrap:wrap">'+
   (nA?'<span class="ocm-badge ocm-badge-arahan">🧭 '+nA+' Arahan</span>':'')+
   (nR?'<span class="ocm-badge ocm-badge-respon">💬 '+nR+' Respons</span>':'')+
   (nT?'<span class="ocm-badge ocm-badge-tl">✅ '+nT+' Tindak lanjut</span>':'')+
 '</div>';
}
function activeHtml(rows){
 if(!rows.length)return '';
 return '<div class="card" style="margin-bottom:12px"><div class="head"><div><h3 style="margin:0">🎟️ Antrian Konsultasi Saya</h3><div class="small">Hanya petugas yang ditugaskan dapat menandai konsultasi selesai.</div></div></div>'+
 '<div class="tablewrap"><table><thead><tr><th>No.</th><th>Jadwal</th><th>Peserta</th><th>Jenjang</th><th>Layanan</th><th>Topik</th><th>Aksi</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td><b>'+String(x.queue_no||0).padStart(3,'0')+'</b></td><td>'+esc(fmtDate(x.consultation_date))+'<div class="small">'+esc(fmtTime(x.consultation_time))+' WIB</div></td><td><b>'+esc(x.full_name)+'</b><div class="small">'+esc(x.unit_kerja||'-')+'</div></td><td>'+esc(x.participant_jenjang||'-')+'</td><td>'+esc(x.service_label||x.service_code||'-')+'</td><td><div style="max-width:320px;white-space:normal">'+esc(x.topic||'-')+'</div></td><td><button class="btn success" onclick="completeOfflineConsultation(\''+x.id+'\')">✓ Tandai Selesai</button></td></tr>').join('')+
 '</tbody></table></div></div>';
}
function statusBadge(v){
 const s=String(v||'').toUpperCase();
 if(s==='SELESAI')return '<span class="ocm-badge ocm-badge-respon">✅ SELESAI</span>';
 if(s==='DILAYANI')return '<span class="ocm-badge ocm-badge-tl">🟣 DILAYANI</span>';
 return '<span class="ocm-badge ocm-badge-arahan">🗓️ TERJADWAL</span>';
}
function doneHtml(rows,actions){
 const scheduled=rows.filter(x=>String(x.status).toUpperCase()==='TERJADWAL').length;
 const serving=rows.filter(x=>String(x.status).toUpperCase()==='DILAYANI').length;
 const completed=rows.filter(x=>String(x.status).toUpperCase()==='SELESAI').length;
 const byQueue=new Map();
 for(const a of actions){if(!byQueue.has(a.queue_id))byQueue.set(a.queue_id,[]);byQueue.get(a.queue_id).push(a)}
 return '<div class="card" id="offlineConsultationMonitoringCard"><div class="head"><div><div class="label">MONITORING DINAS</div><h3 style="margin:3px 0">📚 Rekam Usulan Konsultasi Luring • Monitoring & Arahan</h3><div class="small">'+esc(scopeText())+' Semua usulan ditampilkan sejak TERJADWAL, selama DILAYANI, sampai SELESAI.</div></div><button class="btn soft" onclick="refreshOfflineConsultationMonitoring()">↻ Refresh</button></div>'+
 '<div class="servicegrid" style="margin-bottom:12px"><div class="service"><div class="small">TERJADWAL</div><h3>'+scheduled+'</h3></div><div class="service"><div class="small">DILAYANI</div><h3>'+serving+'</h3></div><div class="service"><div class="small">SELESAI</div><h3>'+completed+'</h3></div><div class="service"><div class="small">TOTAL USULAN</div><h3>'+rows.length+'</h3></div></div>'+
 (rows.length?'<div class="tablewrap"><table><thead><tr><th>Status</th><th>Jadwal</th><th>No.</th><th>Peserta</th><th>Jenjang</th><th>Layanan</th><th>Topik Konsultasi</th><th>Petugas</th><th>Arahan / Tindak Lanjut</th></tr></thead><tbody>'+
 rows.map(x=>{const aa=byQueue.get(x.id)||[];return '<tr><td>'+statusBadge(x.status)+'</td><td>'+esc(fmtDate(x.consultation_date))+'<div class="small">'+esc(fmtTime(x.consultation_time))+' WIB</div></td><td><b>'+String(x.queue_no||0).padStart(3,'0')+'</b></td><td><b>'+esc(x.full_name)+'</b><div class="small">NIP '+esc(x.nip||'-')+'<br>'+esc(x.unit_kerja||'-')+'</div></td><td><b>'+esc(x.participant_jenjang||'-')+'</b></td><td>'+esc(x.service_label||x.service_code||'-')+'</td><td><div style="max-width:300px;white-space:normal">'+esc(x.topic||'-')+'</div></td><td>'+esc(x.officer_name||'-')+'</td><td>'+actionBadge(aa)+'<button class="btn soft" style="margin-top:6px" onclick="openOfflineConsultationRecord(\''+x.id+'\')">🧭 Buka Rekam</button></td></tr>'}).join('')+
 '</tbody></table></div>':'<div class="empty">Belum ada usulan konsultasi luring.</div>')+'</div>';
}
function typeLabel(t){return t==='ARAHAN'?'🧭 ARAHAN PIMPINAN':t==='RESPON'?'💬 RESPONS STAF':'✅ TINDAK LANJUT'}
function actionHtml(a){
 return '<div class="ocm-action '+esc(a.action_type)+'"><div class="ocm-action-head"><span class="ocm-badge '+(a.action_type==='ARAHAN'?'ocm-badge-arahan':a.action_type==='RESPON'?'ocm-badge-respon':'ocm-badge-tl')+'">'+typeLabel(a.action_type)+'</span><span class="small">'+esc(fmtDateTime(a.created_at))+'</span></div>'+
 '<div class="small" style="margin-top:5px"><b>'+esc(a.author_name||'-')+'</b> • '+esc(a.author_role||'-')+(a.target_name?' → <b>'+esc(a.target_name)+'</b>':'')+'</div>'+
 '<div class="ocm-action-msg">'+esc(a.message||'')+'</div></div>';
}
function staffCanAct(q,actions){
 if(!isStaff())return false;
 return actions.some(a=>a.action_type==='ARAHAN'&&(!a.target_user_id||a.target_user_id===p().id||q.officer_id===p().id));
}
function targetOptions(q){
 const rows=state.targets||[];
 const opts=['<option value="">— Petugas konsultasi / tanpa target khusus —</option>'];
 for(const x of rows){
   const sel=x.user_id===q.officer_id?' selected':'';
   opts.push('<option value="'+esc(x.user_id)+'"'+sel+'>'+esc(x.full_name)+' • '+esc(x.position_label||x.role||'Staf')+'</option>');
 }
 return opts.join('');
}
function formFor(q,actions){
 if(isLeader()){
   return '<div class="ocm-form"><b>🧭 Beri Arahan Pimpinan</b><div class="small">Kadin, Sekdin, dan Kabid dapat memberi arahan seluruh jenjang. Kasi/Subkoor hanya pada jenjang kewenangannya.</div>'+
     '<label style="display:block;margin-top:8px">Tujuan staf<select id="ocmTarget">'+targetOptions(q)+'</select></label>'+
     '<label style="display:block;margin-top:8px">Arahan<textarea id="ocmMessage" rows="3" placeholder="Tuliskan arahan yang spesifik dan dapat ditindaklanjuti."></textarea></label>'+
     '<div class="ocm-actions"><button class="btn primary" onclick="submitOfflineConsultationAction(\''+q.id+'\',\'ARAHAN\')">Kirim Arahan</button></div></div>';
 }
 if(isStaff()){
   if(!staffCanAct(q,actions))return '<div class="info" style="margin-top:12px">Belum ada arahan pimpinan yang ditujukan kepada Anda pada rekam ini.</div>';
   return '<div class="ocm-form"><b>💬 Respons & Tindak Lanjut Staf</b><div class="small">Berikan respons atas arahan pimpinan atau catat tindakan yang sudah dilakukan.</div>'+
     '<textarea id="ocmMessage" rows="3" placeholder="Tuliskan respons atau tindak lanjut..."></textarea>'+
     '<div class="ocm-actions"><button class="btn soft" onclick="submitOfflineConsultationAction(\''+q.id+'\',\'RESPON\')">💬 Kirim Respons</button><button class="btn success" onclick="submitOfflineConsultationAction(\''+q.id+'\',\'TINDAK_LANJUT\')">✅ Catat Tindak Lanjut</button></div></div>';
 }
 return '<div class="info" style="margin-top:12px">Akun ini memiliki akses monitoring baca. Arahan dan tindak lanjut mengikuti kewenangan jabatan.</div>';
}
window.openOfflineConsultationRecord=id=>{
 ensureStyle();
 const q=state.done.find(x=>x.id===id)||state.mine.find(x=>x.id===id);if(!q)return;
 const actions=state.actions.filter(x=>x.queue_id===id).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
 $('offlineConsultationRecordModal')?.remove();
 const m=document.createElement('div');m.id='offlineConsultationRecordModal';m.className='ocm-modal';
 m.innerHTML='<div class="ocm-dialog"><div class="ocm-top"><div><div class="label">REKAM KONSULTASI</div><h2 style="margin:4px 0">'+esc(q.full_name)+'</h2><div class="small">'+esc(q.unit_kerja||'-')+' • '+esc(q.participant_jenjang||'-')+'</div></div><button class="ocm-close" onclick="document.getElementById(\'offlineConsultationRecordModal\')?.remove()">✕</button></div>'+
 '<div class="ocm-summary"><div class="ocm-kv"><b>Layanan</b><span>'+esc(q.service_label||q.service_code||'-')+'</span></div><div class="ocm-kv"><b>Topik</b><span>'+esc(q.topic||'-')+'</span></div><div class="ocm-kv"><b>Petugas</b><span>'+esc(q.officer_name||'-')+'</span></div></div>'+
 '<h3 style="margin:12px 0 4px">Riwayat Arahan & Tindak Lanjut</h3>'+
 '<div class="ocm-timeline">'+(actions.length?actions.map(actionHtml).join(''):'<div class="empty">Belum ada arahan atau tindak lanjut.</div>')+'</div>'+
 formFor(q,actions)+'</div>';
 m.addEventListener('click',e=>{if(e.target===m)m.remove()});
 document.body.appendChild(m);
};
window.submitOfflineConsultationAction=async(id,type)=>{
 const msg=$('ocmMessage')?.value.trim()||'';if(msg.length<2)return alert('Tuliskan isi catatan terlebih dahulu.');
 const target=type==='ARAHAN'?($('ocmTarget')?.value||null):null;
 const label=type==='ARAHAN'?'arahan':type==='RESPON'?'respons':'tindak lanjut';
 if(!confirm('Simpan '+label+' ini?'))return;
 try{
   const {error}=await sb.rpc('add_offline_consultation_action',{
     p_queue_id:id,p_action_type:type,p_message:msg,p_target_user_id:target||null
   });
   if(error)throw error;
   const x=await loadRows();state=x;
   const root=$('offlineConsultationMonitoringWrap');if(root)root.innerHTML=activeHtml(x.mine)+doneHtml(x.done,x.actions);
   window.openOfflineConsultationRecord(id);
 }catch(e){alert(e.message||String(e))}
};

async function render(){
 ensureStyle();ensureMonitoringEntry();
 const root=$('monitoringBody');if(!root)return;
 $('offlineConsultationMonitoringWrap')?.remove();
 const wrap=document.createElement('div');wrap.id='offlineConsultationMonitoringWrap';
 wrap.innerHTML='<div class="card"><div class="small">Memuat rekam konsultasi luring…</div></div>';
 root.prepend(wrap);
 try{
   state=await loadRows();
   wrap.innerHTML=activeHtml(state.mine)+doneHtml(state.done,state.actions);
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
 ensureMonitoringEntry();
 const r=await priorShow.apply(this,arguments);
 if(id==='monitoring'){await wait(80);await render()}
 return r;
};
ensureStyle();ensureMonitoringEntry();
for(const ms of [120,400,1000])setTimeout(()=>ensureMonitoringEntry(),ms);
if(document.querySelector('#monitoring.active'))await render();
window.__simantabOfflineConsultationMonitoring={version:3,dinasRead:true,allSubmissions:true,leaderGuidance:true,scopedKasiSubkoor:true,staffResponse:true};
})();