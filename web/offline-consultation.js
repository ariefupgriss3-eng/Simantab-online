/* SIMANTAB_OFFLINE_CONSULTATION_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
if(!sb||!window.showTab)return;
const isApplicant=()=>['GTK','KEPALA_SEKOLAH'].includes(String(p().role||''));
if(!isApplicant())return;

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const qno=n=>String(n||0).padStart(3,'0');
const fmtDate=v=>v?new Date(v+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}):'-';
const fmtTime=v=>String(v||'').slice(0,5)||'-';

function ensureStyle(){
 if($('offlineConsultationStyle'))return;
 const s=document.createElement('style');s.id='offlineConsultationStyle';
 s.textContent='.oc-ticket{border:2px dashed #1767b3;border-radius:16px;padding:16px;background:linear-gradient(135deg,#f7fbff,#eef7ff)}.oc-number{font-size:42px;font-weight:950;letter-spacing:2px;color:#0f3f76;line-height:1}.oc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.oc-kv{padding:10px 12px;border:1px solid #d7e4f2;border-radius:12px;background:#fff}.oc-kv .k{font-size:10px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.4px}.oc-kv .v{font-size:13px;font-weight:800;color:#0f2f54;margin-top:3px}.oc-service-hint{margin-top:5px;font-size:11px;color:#64748b}@media(max-width:720px){.oc-grid{grid-template-columns:1fr}.oc-number{font-size:34px}}';
 document.head.appendChild(s);
}
function mainEl(){return document.querySelector('main.content')}
function ensureSection(){
 if($('offlineConsultation'))return;
 const main=mainEl();if(!main)return;
 const sec=document.createElement('section');sec.id='offlineConsultation';sec.className='section';
 sec.innerHTML='<div class="head"><div><h2>Daftar Konsultasi Luring</h2><p>Pendaftaran konsultasi tatap muka Bidang Ketenagaan untuk seluruh layanan SIMANTAB.</p></div></div><div id="offlineConsultationBody"></div>';
 const footer=main.querySelector('.footer');footer?main.insertBefore(sec,footer):main.appendChild(sec);
}
function ensureNav(){
 const nav=$('nav');if(!nav||nav.querySelector('[data-tab="offlineConsultation"]'))return;
 const b=document.createElement('button');b.className='navbtn';b.dataset.tab='offlineConsultation';b.setAttribute('onclick',"showTab('offlineConsultation')");
 b.innerHTML='<span class="ico">🎟️</span>Daftar Konsultasi Luring';
 const services=nav.querySelector('[data-tab="services"]')||nav.querySelector('[data-tab="status"]');
 services?services.after(b):nav.appendChild(b);
}
async function loadData(){
 const a=await Promise.all([
  sb.from('ks_bcks_submission_details').select('full_name,nip,pangkat_golruang,unit_kerja').eq('user_id',p().id).maybeSingle(),
  sb.from('offline_consultation_queue').select('*').eq('user_id',p().id).in('status',['TERJADWAL','DILAYANI']).order('created_at',{ascending:false}).limit(1).maybeSingle(),
  sb.from('offline_consultation_services').select('service_code,service_label,service_group,sort_order').eq('is_active',true).order('sort_order')
 ]);
 if(a[0].error)throw a[0].error;if(a[1].error)throw a[1].error;if(a[2].error)throw a[2].error;
 return {detail:a[0].data||{},ticket:a[1].data||null,services:a[2].data||[]};
}
function ticketHtml(t){
 return '<div class="oc-ticket"><div class="label">NOMOR ANTRIAN KONSULTASI LURING</div><div class="oc-number">'+qno(t.queue_no)+'</div><div class="small" style="margin:6px 0 14px">SIMANTAB • Bidang Ketenagaan</div><div class="oc-grid">'+
 '<div class="oc-kv"><div class="k">Nama</div><div class="v">'+esc(t.full_name)+'</div></div>'+
 '<div class="oc-kv"><div class="k">NIP</div><div class="v">'+esc(t.nip)+'</div></div>'+
 '<div class="oc-kv"><div class="k">Jenis Layanan</div><div class="v">'+esc(t.service_label||t.service_code||'-')+'</div></div>'+
 '<div class="oc-kv"><div class="k">Hari / Tanggal</div><div class="v">'+esc(fmtDate(t.consultation_date))+'</div></div>'+
 '<div class="oc-kv"><div class="k">Jam</div><div class="v">'+esc(fmtTime(t.consultation_time))+' WIB</div></div>'+
 '<div class="oc-kv"><div class="k">Petugas</div><div class="v">'+esc(t.officer_name)+'</div></div>'+
 '<div class="oc-kv"><div class="k">Unit Kerja</div><div class="v">'+esc(t.unit_kerja)+'</div></div></div>'+
 '<div class="info" style="margin-top:12px"><b>Topik konsultasi:</b><br>'+esc(t.topic)+'</div>'+
 '<div class="small" style="margin-top:10px">Mohon hadir 10 menit sebelum jadwal dan menunjukkan nomor antrian ini kepada petugas.</div></div>';
}
function serviceOptions(rows){
 let group='';
 return rows.map(x=>{
   const head=x.service_group!==group?'<option disabled>──────── '+esc(x.service_group)+' ────────</option>':'';
   group=x.service_group;
   return head+'<option value="'+esc(x.service_code)+'">'+esc(x.service_label)+'</option>';
 }).join('');
}
function formHtml(d,services){
 return '<div class="card"><div class="info" style="margin-bottom:12px"><b>Konsultasi luring hanya untuk hal yang memerlukan tatap muka.</b><br>Seluruh proses administrasi dan konsultasi daring tetap dilakukan melalui SIMANTAB dan RGTK. Pilih jenis layanan agar sistem otomatis mengarahkan konsultasi kepada petugas yang relevan.</div><div class="grid">'+
 '<label class="s6">Nama lengkap dan gelar<input id="ocFullName" value="'+esc(d.full_name||p().full_name||'')+'"></label>'+
 '<label class="s6">NIP<input id="ocNip" value="'+esc(d.nip||p().nip||'')+'" inputmode="numeric"></label>'+
 '<label class="s6">Gol., Pangkat/Ruang<input id="ocPangkat" value="'+esc(d.pangkat_golruang||'')+'"></label>'+
 '<label class="s6">Unit Kerja<input id="ocUnit" value="'+esc(d.unit_kerja||p().unit||'')+'"></label>'+
 '<label class="s12">Jenis layanan<select id="ocService"><option value="">— Pilih jenis layanan —</option>'+serviceOptions(services)+'</select><div class="oc-service-hint">Petugas ditentukan otomatis berdasarkan penanggung jawab/capability layanan aktif di SIMANTAB.</div></label>'+
 '<label class="s12">Topik konsultasi<textarea id="ocTopic" rows="4" placeholder="Tuliskan secara singkat dan spesifik hal yang ingin dikonsultasikan."></textarea></label></div>'+
 '<button class="btn primary" id="ocTakeQueue" style="margin-top:12px">🎟️ Ambil Nomor Antrian</button><div id="ocMsg" class="small" style="margin-top:8px"></div></div>';
}
async function render(){
 ensureStyle();ensureSection();ensureNav();
 const body=$('offlineConsultationBody');if(!body)return;
 body.innerHTML='<div class="card"><div class="small">Memuat data konsultasi…</div></div>';
 try{
  const x=await loadData();
  body.innerHTML=x.ticket?ticketHtml(x.ticket):formHtml(x.detail,x.services);
  if(!x.ticket)$('ocTakeQueue')?.addEventListener('click',takeQueue);
 }catch(e){body.innerHTML='<div class="card err">'+esc(e.message||e)+'</div>'}
}
async function takeQueue(){
 const btn=$('ocTakeQueue'),msg=$('ocMsg');
 const vals={
  p_full_name:$('ocFullName')?.value.trim(),
  p_nip:$('ocNip')?.value.trim(),
  p_pangkat_golruang:$('ocPangkat')?.value.trim(),
  p_unit_kerja:$('ocUnit')?.value.trim(),
  p_service_code:$('ocService')?.value,
  p_topic:$('ocTopic')?.value.trim()
 };
 if(!vals.p_full_name||!vals.p_nip||!vals.p_pangkat_golruang||!vals.p_unit_kerja||!vals.p_service_code||!vals.p_topic){
  msg.className='err';msg.textContent='Lengkapi data, pilih jenis layanan, dan tuliskan topik konsultasi sebelum mengambil nomor antrian.';return;
 }
 btn.disabled=true;msg.className='small';msg.textContent='Menentukan petugas, nomor antrian, dan jadwal…';
 try{
  const r=await sb.rpc('take_offline_consultation_queue',vals);
  if(r.error)throw r.error;
  const t=Array.isArray(r.data)?r.data[0]:r.data;
  if(!t)throw new Error('Nomor antrian belum berhasil dibuat.');
  await render();
 }catch(e){msg.className='err';msg.textContent=e.message||String(e)}
 finally{btn.disabled=false}
}
const priorShow=window.showTab;
window.showTab=async function(id){
 ensureSection();ensureNav();
 const r=await priorShow.apply(this,arguments);
 await wait(50);
 if(id==='offlineConsultation')await render();
 return r;
};
ensureStyle();ensureSection();ensureNav();
for(const ms of [120,400,1000])setTimeout(()=>{ensureSection();ensureNav()},ms);
if(document.querySelector('#offlineConsultation.active'))await render();
window.__simantabOfflineConsultation={version:2,allServices:true,autoRouting:true,applicantOnly:true};
})();