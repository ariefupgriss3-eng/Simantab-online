/* SIMANTAB_SMARTGTK_UNIFIED_INTAKE_V1: user reports data once; backend classifies 3 potential routes */
(async()=>{
if(window.__simantabSmartGtkLoaded)return;
window.__simantabSmartGtkLoaded=true;
await new Promise(resolve=>{
 const ready=()=>window.__simantabSb&&window.__simantabProfile?.role&&typeof window.showTab==='function';
 if(ready())return resolve();
 const next=()=>{if(ready()){window.removeEventListener('simantab:profile-ready',next);resolve()}};
 window.addEventListener('simantab:profile-ready',next);
});
const sb=window.__simantabSb,p=()=>window.__simantabProfile||{};
const gtk=()=>((p().account_channel==='GTK'&&['GTK','KEPALA_SEKOLAH'].includes(p().role))||p().role==='PENGAWAS')&&p().approval_status==='APPROVED'&&p().is_active!==false;
const dinas=()=>p().account_channel==='DINAS'&&(['SUPER_ADMIN','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(p().role)||/^STAFF_|^ADMIN_/.test(p().role||''))&&p().approval_status==='APPROVED'&&p().is_active!==false;
const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const qualified=['S1','DIV','S2','S3'];
const employmentLabel=(value)=>({'PB':'Pendamping Belajar (PB)','PLS':'Pendamping Layanan Satpen (PLS)','NON_ASN':'Pendamping (data lama: belum dipilah PB/PLS)'}[value]||value);
const options={
 profession:[['','Pilih tugas'],['GURU','Guru'],['KEPALA_SEKOLAH','Kepala Sekolah'],['PENGAWAS','Pengawas Sekolah'],['TENDIK','Tenaga Kependidikan']],
 employment:[['','Pilih status kepegawaian'],['PNS','PNS'],['PPPK','PPPK'],['PPPK_PW','PPPK paruh waktu'],['PB','Pendamping Belajar (PB)'],['PLS','Pendamping Layanan Satpen (PLS)'],['LAINNYA','Lainnya']],
 jf_sk:[['','Pilih'],['YA','Sudah ada SK JF Guru'],['TIDAK','Belum ada SK JF Guru'],['BELUM_TAHU','Belum tahu']],
 old_position:[['','Pilih jabatan sesuai SK'],...['Guru Pertama','Guru Muda','Guru Madya','Guru Ahli Pertama','Guru Ahli Muda','Guru Ahli Madya','Jabatan lain pada SK'].map(x=>[x,x])],
 nomenclature_updated:[['','Pilih'],['YA','Sudah disesuaikan'],['TIDAK','Belum disesuaikan'],['BELUM_TAHU','Belum tahu'],['TIDAK_BERLAKU','Tidak berlaku']],
 pns_jf_formation:[['','Pilih'],['YA','Formasi awal PNS JF Guru'],['TIDAK','Bukan formasi PNS JF Guru'],['BELUM_TAHU','Belum tahu']],
 education:[['','Pilih ijazah terakhir'],...['SLTA','SPG','DI','DII','DIII','S1','DIV','S2','S3'].map(x=>[x,({'DI':'D-I','DII':'D-II','DIII':'D-III','DIV':'D-IV','S1':'S-1','S2':'S-2','S3':'S-3'}[x]||x)])],
 study_status:[['','Pilih perkembangan studi'],['BELUM_KULIAH','Belum melanjutkan kuliah'],['SEDANG_KULIAH','Sedang kuliah'],['LULUS_BELUM_VERIF','Lulus, belum diverifikasi'],['SUDAH_MEMENUHI','Sudah S-1/D-IV atau lebih tinggi']]
};
const docLabels={SK_KP:'SK Pangkat Terakhir',IJAZAH_TERAKHIR:'Ijazah terakhir',SK_JF:'SK JF Guru',SERDIK:'Sertifikat Pendidik',PENGALAMAN_2TH:'Keterangan pengalaman mengajar ≥ 2 tahun',SKP_TAHUN_1:'SKP tahun pertama',SKP_TAHUN_2:'SKP tahun kedua',SK_PPPK:'SK PPPK (jika ada)',SK_PPPK_PW:'SK PPPK Paruh Waktu (jika ada)',SURAT_TUGAS:'Surat tugas (jika ada)'};
const meanings={
 POTENSI_USUL:'Potensi usulan — perlu verifikasi Dinas',
 TERTAHAN_KUALIFIKASI:'Potensi usul setelah pemenuhan kualifikasi',
 PERLU_DATA:'Perlu konfirmasi data',
 TIDAK_TERINDIKASI:'Tidak terindikasi',
 DATABASE_ONLY:'Pendataan GTK saja — tidak dianalisis untuk usulan JF Guru',
 PERLU_PEMENUHAN_2030:'Perlu pemenuhan S-1/D-IV (D-I–D-III)',
 TELAAH_KHUSUS:'SLTA/SPG: pemeriksaan khusus',
 DINYATAKAN_MEMENUHI_BELUM_VERIFIKASI:'Sudah memenuhi menurut pernyataan, ijazah belum diverifikasi'
};
let old=null,education=null,items=[],pg=0,busy=false,onboarding=null;const maxDocBytes=1572864;
let workflowPage=0,workflowItems=[],workflowTotal=0,workflowStaff=[];
let workflowDraftPage=0,workflowDraftItems=[],workflowDraftTotal=0;
let contractPages={PPPK:0,PPPK_PW:0},contractRecords={PPPK:[],PPPK_PW:[]},contractTotals={PPPK:0,PPPK_PW:0};
const modal=document.createElement('div');modal.id='smartgtkModal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
modal.innerHTML='<div class="sg-container"><div class="sg-head"><b>SMART-GTK • 3 Analisis PNS | Tampungan PPPK</b><button type="button" data-action="close">✕ Tutup</button></div><p id="sgMessage" role="status"></p><div id="sgBody"></div></div>';document.body.append(modal);
const style=document.createElement('style');
style.textContent='#smartgtkModal{display:none;position:fixed;inset:0;z-index:1000010;background:#10223fcb;padding:12px;overflow:auto;align-items:flex-start;justify-content:center}#smartgtkModal .sg-container{background:#fff;color:#1b3451;border-radius:14px;padding:17px;width:min(940px,100%);max-height:calc(100vh - 24px);overflow:auto;font:14px system-ui,sans-serif}#smartgtkModal .sg-head,#smartgtkModal .sg-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}#smartgtkModal .sg-box{border:1px solid #d5e0ed;border-radius:11px;margin:12px 0;padding:12px}#smartgtkModal .sg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#smartgtkModal label{display:flex;flex-direction:column;gap:6px;margin:7px 0}#smartgtkModal select,#smartgtkModal input{box-sizing:border-box;width:100%;padding:10px;border-radius:8px;border:1px solid #aebed1;color:#1d3652;background:white}#smartgtkModal button{cursor:pointer;padding:9px;border-radius:8px;border:1px solid #9dbed7;background:#eaf4fc;color:#185782;font-weight:700}#smartgtkModal button.primary{background:#ee7d17;border:0;color:white}#smartgtkModal .sg-note{background:#edf6ff;border-radius:9px;padding:10px;line-height:1.5}#smartgtkModal .sg-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}#smartgtkModal .sg-result{border:1px solid #b9cadc;border-radius:9px;padding:11px}#smartgtkModal .sg-result b{display:block;margin-bottom:8px}#smartgtkModal .sg-scroll{overflow:auto}#smartgtkModal table{min-width:610px;border-collapse:collapse;width:100%}#smartgtkModal td,#smartgtkModal th{border-bottom:1px solid #dbe5ef;padding:9px;text-align:left;vertical-align:top}@media(max-width:650px){#smartgtkModal .sg-grid,#smartgtkModal .sg-results{grid-template-columns:1fr}}';document.head.append(style);
const body=()=>document.getElementById('sgBody');
const info=(s='',error=false)=>{const el=document.getElementById('sgMessage');el.textContent=s;el.style.color=error?'#ae2d25':'#156595'};
const option=(v,l,selected)=>'<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(l)+'</option>';
const select=(name,label,value,required=true)=>'<label>'+esc(label)+'<select name="'+name+'" '+(required?'required':'')+'>'+options[name].map(([v,l])=>option(v,l,value)).join('')+(name==='employment'&&value==='NON_ASN'?option('NON_ASN','Pendamping (data lama — pilih PB atau PLS)',value):'')+'</select></label>';
const input=(name,label,value,type='text')=>'<label>'+esc(label)+'<input name="'+name+'" type="'+type+'" value="'+esc(value||'')+'"></label>';
/* GTK uses the landing dashboard + main nav, not the services grid.
   Dinas monitoring retains an officer-only services entry. */
const dashboardCardId='smartgtkDashboardPriority';
const navButtonId='smartgtkPrimaryNav';
const priorityCss=document.createElement('style');priorityCss.id='smartgtkPriorityCss';
priorityCss.textContent=[
 '#smartgtkDashboardPriority{background:linear-gradient(110deg,#fff3df 0%,#fffaf1 65%,#f2f8ff 100%);border:2px solid #e9a441;color:#163956;border-radius:17px;padding:17px;margin:0 0 18px;box-shadow:0 5px 20px rgba(51,94,135,.10)}',
 '#smartgtkDashboardPriority .sg-priority-tag{display:inline-block;border-radius:7px;background:#b85b0b;color:#fff;font-size:12px;font-weight:750;letter-spacing:.03em;padding:5px 9px}',
 '#smartgtkDashboardPriority h3{font-size:clamp(19px,4vw,24px);line-height:1.3;margin:12px 0 5px;color:#15395a}',
 '#smartgtkDashboardPriority p{margin:7px 0 13px;line-height:1.55;color:#31516e}',
 '#smartgtkDashboardPriority .sg-deadline{background:#fff0d8;border:1px solid #d99a36;border-radius:10px;padding:11px 13px;color:#793d0a;font-size:14px;font-weight:700;line-height:1.5;margin:12px 0 15px}',
 '#smartgtkDashboardPriority .sg-priority-action{background:#c56b11;color:#fff;border:0;border-radius:10px;padding:13px 19px;font-weight:750;font-size:15px;width:100%;max-width:340px;cursor:pointer}',
 '#smartgtkDashboardPriority .sg-priority-action:focus-visible,#smartgtkPrimaryNav:focus-visible{outline:3px solid #206a9e;outline-offset:2px}',
 '#smartgtkDashboardPriority .sg-priority-help{font-size:13px;line-height:1.5;color:#355675;margin-top:9px}',
 '#smartgtkDashboardPriority .sg-reminder{padding:12px 14px;border:1px solid #ecbc6f;border-radius:11px;background:#fff9ec;color:#8a420b;margin:12px 0;line-height:1.5;font-size:13px}',
 '#smartgtkDashboardPriority .sg-reminder[data-level="urgent"]{background:#fff1ef;border-color:#e59e91;color:#9b271c}',
 '#smartgtkDashboardPriority .sg-reminder[data-level="done"]{background:#ecfdf3;border-color:#9bd9b6;color:#166534}',
 '#smartgtkDashboardPriority .sg-reminder[data-level="expired"]{background:#f1f3f5;border-color:#bdc5cc;color:#404b57}',
 '#smartgtkDashboardPriority .sg-reminder strong{display:block;font-size:15px}',
 '#smartgtkDashboardPriority .sg-countdown{font-weight:850;font-variant-numeric:tabular-nums}',
 '#smartgtkPrimaryNav{background:#fff1d5;color:#7d410b;font-weight:800;border-left:4px solid #d18219}',
 '@media(max-width:520px){#smartgtkDashboardPriority{padding:15px}#smartgtkDashboardPriority .sg-priority-action{max-width:none}}'
].join('');
document.head.append(priorityCss);
function removeOldGTKServiceTiles(){
 document.getElementById('smartgtkTile')?.remove();
 document.getElementById('jf2026ServiceTile')?.remove();
 document.getElementById('jf2030ServiceTile')?.remove();
}
/* SIMANTAB_SMARTGTK_DEADLINE_REMINDER_V1: client-only reminder; do NOT enforce automatic closure.
 * Deadline is 26 Oct 2026 at 23:59 WIB (UTC+7), equivalently 16:59 UTC.
 * Whether an account is complete is decided from its own Supabase SMART-GTK status. */
const smartGtkDeadlineMs=Date.UTC(2026,9,26,16,59,0);
const smartGtkCompleted=new Set(['BERKAS_LENGKAP','DATA_TERCATAT']);
let smartGtkDeadlineTick=null;
function smartGtkTimeLeft(nowMs=Date.now()){
 const remaining=Math.max(0,smartGtkDeadlineMs-nowMs);
 const days=Math.floor(remaining/86400000),hours=Math.floor((remaining%86400000)/3600000),
  minutes=Math.floor((remaining%3600000)/60000);
 return {remaining,days,hours,minutes,text:(days?days+' hari ':'')+hours+' jam '+minutes+' menit'};
}
function smartGtkReminderHTML(state,missingCount=0,nowMs=Date.now()){
 const completed=smartGtkCompleted.has(String(state||''))&&missingCount===0;
 const left=smartGtkTimeLeft(nowMs);
 const overdue=left.remaining<=0;
 const level=completed?'done':overdue?'expired':left.remaining<=86400000?'urgent':'normal';
 const heading=completed?'✅ Isian SMART GTK sudah lengkap':overdue?'Tenggat pengisian SMART GTK telah lewat':
  level==='urgent'?'🔴 Pengingat terakhir SMART GTK':'⏰ Segera lengkapi SMART GTK';
 const detail=completed?'Data Anda sudah dicatat. Tetap pantau jika Dinas meminta perbaikan.':
  state==='DRAFT'?'Data masih DRAF. Lanjutkan, lengkapi persyaratan, lalu konfirmasi data.':
  state==='BELUM_MENGISI'?'Anda belum mengisi SMART GTK. Segera lakukan pendataan.':
  state==='AKSES_BELUM_MEMENUHI'?'Lengkapi Kebutuhan GTK Riil terlebih dahulu sebelum mengakses SMART GTK.':
  'Periksa kembali kelengkapan dan status pengiriman data Anda.';
 const counter=completed?'':'<span class="sg-countdown">'+(overdue?'Tenggat terlewati': 'Sisa waktu: '+left.text)+'</span>';
 return '<div class="sg-reminder" data-level="'+level+'" role="status" aria-live="polite">'+
  '<strong>'+heading+'</strong>'+
  '<div>Batas pengisian: <b>Senin, 26 Oktober 2026 · 23.59 WIB</b></div>'+
  '<div>'+detail+'</div>'+counter+'</div>';
}
function smartGtkRenderReminder(card){
 const target=card?.querySelector('[data-smartgtk-reminder]');
 if(!target)return;
 const state=card.dataset.smartgtkStage||'BELUM_MENGISI';
 if(state==='SEDANG_DIPERIKSA'){
  target.innerHTML='<div class="sg-reminder"><strong>⏰ Batas pengisian SMART GTK</strong>'+
   '<div>26 Oktober 2026, pukul 23.59 WIB</div><div>Status kelengkapan sedang diperiksa…</div></div>';
  return;
 }
 const missing=Number(card.dataset.smartgtkMissing||0);
 target.innerHTML=smartGtkReminderHTML(state,missing);
}
function smartGtkStartDeadlineTimer(){
 if(smartGtkDeadlineTick!==null)return;
 smartGtkDeadlineTick=setInterval(()=>{
  const card=document.getElementById(dashboardCardId);
  if(!card||!gtk()){clearInterval(smartGtkDeadlineTick);smartGtkDeadlineTick=null;return;}
  smartGtkRenderReminder(card);
 },60000);
}
function ensureGTKDashboard(){
 const root=document.getElementById('dashboard');
 const body=document.getElementById('dashboardBody');
 if(!gtk()||!root||!body){document.getElementById(dashboardCardId)?.remove();return}
 removeOldGTKServiceTiles();
 let card=document.getElementById(dashboardCardId);
 if(!card){
  card=document.createElement('section');card.id=dashboardCardId;
  card.setAttribute('aria-label','Prioritas utama pendataan SMART-GTK');
  card.innerHTML='<div class="sg-priority-tag">📌 PRIORITAS PENDATAAN GTK</div>'+
  '<h3>🧭 SMART-GTK — Analisis PNS dan Tampungan PPPK</h3>'+
  '<p>PNS Guru/Kepala Sekolah: 3 analisis. PPPK dan PPPK PW: tampungan data terpisah. PB/PLS: pendataan pendamping.</p>'+
  '<p class="sg-deadline">⏰ Deadline input data paling lambat 26 Oktober 2026, pukul 23.59 WIB.</p>'+
  '<div data-smartgtk-reminder></div>'+
  '<button type="button" class="sg-priority-action">Lihat SMART-GTK</button>'+
  '<p class="sg-priority-help" role="status">Memeriksa apakah akun dapat mengisi SMART-GTK...</p>';
  card.querySelector('button').addEventListener('click',open);
  card.dataset.smartgtkStage='SEDANG_DIPERIKSA';
 }
 if(card.parentElement!==root||card.nextElementSibling!==body)root.insertBefore(card,body);
 smartGtkRenderReminder(card);
 smartGtkStartDeadlineTimer();
 void refreshDashboardPriority(card);
}
let priorityCheck=0;
async function refreshDashboardPriority(card){
 const token=++priorityCheck;
 const msg=card.querySelector('.sg-priority-help'),btn=card.querySelector('button');
 if(!gtk())return;
 try{
  const access=await sb.rpc('smartgtk_pilot_status');
  if(access.error)throw access.error;
  if(token!==priorityCheck||!card.isConnected)return;
  if(access.data===true){
   btn.textContent='Isi / Lanjutkan SMART-GTK →';
   const status=await sb.rpc('smartgtk_mass_status');
   if(token!==priorityCheck||!card.isConnected)return;
   if(status.error){
    card.dataset.smartgtkStage='SEDANG_DIPERIKSA';
    msg.textContent='Akses tersedia, tetapi status kelengkapan belum dapat diperiksa. Buka SMART GTK untuk melihat rincian.';
   }else{
    card.dataset.smartgtkStage=String(status.data?.state||'BELUM_MENGISI');
    card.dataset.smartgtkMissing=String(Array.isArray(status.data?.missing)?status.data.missing.length:0);
    const isDone=smartGtkCompleted.has(card.dataset.smartgtkStage)&&Number(card.dataset.smartgtkMissing)===0;
    btn.textContent=isDone?'Lihat hasil SMART GTK →':'Lengkapi SMART GTK sekarang →';
    msg.textContent=isDone?'Pendataan telah lengkap; menunggu tindak lanjut verifikasi Dinas.':
     'Simpan isian, lengkapi dokumen sesuai jalur, kemudian klik Konfirmasi Data Saya / Selesaikan Pendataan.';
   }
  }else{
   card.dataset.smartgtkStage=p().role==='KEPALA_SEKOLAH'?'AKSES_BELUM_MEMENUHI':'SEDANG_DIPERIKSA';
   btn.textContent='Lihat informasi SMART-GTK →';
   msg.textContent='Akun belum dapat mengisi SMART-GTK. Untuk KS negeri, ajukan Kebutuhan GTK Riil terlebih dahulu; akun lain dapat menghubungi admin jika akses masih terkendala.';
  }
  smartGtkRenderReminder(card);
 }catch(error){
  if(token!==priorityCheck||!card.isConnected)return;
  card.dataset.smartgtkStage='SEDANG_DIPERIKSA';
  smartGtkRenderReminder(card);
  btn.textContent='Lihat informasi SMART-GTK →';
  msg.textContent='Status akses belum dapat diperiksa. Coba buka lagi atau hubungi admin SIMANTAB.';
 }
}
function ensureGTKNav(){
 const root=document.getElementById('nav');
 if(!root)return;
 if(!gtk()){document.getElementById(navButtonId)?.remove();return}
 if(document.getElementById(navButtonId))return;
 const item=document.createElement('button');item.type='button';item.className='navbtn';
 item.id=navButtonId;item.innerHTML='<span class="ico" aria-hidden="true">🧭</span>SMART-GTK • Prioritas';
 item.setAttribute('aria-label','Buka prioritas pendataan SMART-GTK');
 item.addEventListener('click',open);
 const dashboardButton=root.querySelector('.navbtn[data-tab="dashboard"]');
 if(dashboardButton)dashboardButton.insertAdjacentElement('afterend',item);
 else root.prepend(item);
}
/* SIMANTAB_SMARTGTK_DINAS_NAV_V1: visible independently of the Services dashboard route. */
const dinasWorkflowNavId='smartgtkDinasWorkflowNav';
function ensureDinasWorkflowNav(){
 const root=document.getElementById('nav');
 if(!dinas()||!root){document.getElementById(dinasWorkflowNavId)?.remove();return;}
 if(document.getElementById(dinasWorkflowNavId))return;
 const btn=document.createElement('button');
 btn.type='button';btn.id=dinasWorkflowNavId;btn.className='navbtn';
 btn.innerHTML='<span class="ico" aria-hidden="true">🧭</span>Workflow SMART-GTK';
 btn.setAttribute('aria-label','Buka workflow SMART-GTK untuk petugas Dinas');
 btn.addEventListener('click',open);
 const first=root.querySelector('.navbtn[data-tab="dashboard"]');
 if(first)first.insertAdjacentElement('afterend',btn);
 else root.prepend(btn);
}
function ensureDinasService(){
 const root=document.getElementById('servicesBody');
 if(!dinas()||!root){document.getElementById('smartgtkTile')?.remove();return}
 if(document.getElementById('smartgtkTile'))return;
 const item=document.createElement('div');item.id='smartgtkTile';item.className='card';
 item.style.cssText='padding:14px;margin:12px 0;background:#eef8ff;border:1px solid #b8d9ed;border-radius:12px';
 item.innerHTML='<h3>🧭 Workflow SMART-GTK</h3><p class="small">Staf memeriksa; Kasi SD, Kasi SMP, atau Subkoor TK/PAUD/PNF memvalidasi sesuai jenjang; Kabid memberikan keputusan telaah akhir. Bukan persetujuan SK.</p><button type="button" class="btn primary">Buka Workflow SMART-GTK</button>';
 item.querySelector('button').addEventListener('click',open);
 root.prepend(item);
}
function placeSmartGtk(){
 if(gtk()){document.getElementById(dinasWorkflowNavId)?.remove();ensureGTKDashboard();ensureGTKNav();return}
 document.getElementById(dashboardCardId)?.remove();
 document.getElementById(navButtonId)?.remove();
 ensureDinasWorkflowNav();
 ensureDinasService();
}
window.__simantabSmartGtkReady=true;
const originalShow=window.showTab;
window.showTab=async function(...args){
 const result=await originalShow.apply(this,args);
 if(args[0]==='dashboard'||args[0]==='services')placeSmartGtk();
 return result;
};
const navRoot=document.getElementById('nav');
if(navRoot)new MutationObserver(()=>{
 if(gtk()&&!document.getElementById(navButtonId))ensureGTKNav();
 if(dinas()&&!document.getElementById(dinasWorkflowNavId))ensureDinasWorkflowNav();
}).observe(navRoot,{childList:true});
window.addEventListener('simantab:profile-ready',placeSmartGtk);
placeSmartGtk();
async function loadGTK(){
 const [a,b]=await Promise.all([
  sb.from('smartgtk_intake').select('*').eq('owner_id',p().id).maybeSingle(),
  sb.from('jf2030_qualification').select('education_initial,study_status,university,study_program,start_year,target_graduation,graduation_date,review_status').eq('owner_id',p().id).maybeSingle()
 ]);
 if(a.error)throw a.error;if(b.error)throw b.error;old=a.data||null;education=b.data||null;
}
function form(){
 const x=old||{},q=education||{},edu=x.education||q.education_initial||'',study=x.study_status||q.study_status||(qualified.includes(edu)?'SUDAH_MEMENUHI':'');
 const profession=x.profession||({'KEPALA_SEKOLAH':'KEPALA_SEKOLAH','PENGAWAS':'PENGAWAS'}[p().role]||'');
 body().innerHTML='<p class="sg-note">Identitas dari Profil GTK. Tiga analisis (penyesuaian JF, pengangkatan JF, pemenuhan S-1/D-IV) KHUSUS PNS Guru/Kepala Sekolah. Data PPPK dan PPPK PW masuk tampungan masing-masing, bukan daftar analisis atau usulan PNS.</p>'+
 '<div class="sg-box"><b>'+esc(p().full_name||'GTK')+'</b><p>NIP '+esc(p().nip||'-')+' • '+esc(p().unit_gtk||p().unit||'')+'</p></div>'+
 '<form id="smartgtkForm"><div class="sg-box"><b>A. Tugas dan Status Kepegawaian</b><div class="sg-grid">'+
 select('profession','Tugas utama *',profession)+
 select('employment','Kategori kepegawaian/pendamping *',x.employment)+
 '</div><div id="sgJFFields" class="sg-grid">'+
 select('jf_sk','Kepemilikan SK JF Guru *',x.jf_sk)+
 select('old_position','Jabatan sesuai SK JF (jika ada)',x.old_position,false)+
 select('nomenclature_updated','Penyesuaian nomenklatur SK JF *',x.nomenclature_updated)+
 select('pns_jf_formation','Formasi pengangkatan PNS sebagai JF Guru? *',x.pns_jf_formation)+
 '</div></div><div class="sg-box"><b>B. Pendidikan</b><div class="sg-grid">'+
 select('education','Pendidikan tertinggi yang sudah selesai *',edu)+
 select('study_status','Status studi *',study)+
 input('university','Perguruan tinggi',x.university||q.university)+
 input('program','Program studi',x.study_program||q.study_program)+
 input('start_year','Tahun mulai kuliah',x.start_year||q.start_year,'number')+
 input('target_graduation','Target kelulusan',x.target_graduation||q.target_graduation,'date')+
 input('graduation_date','Tanggal kelulusan sesuai ijazah',x.graduation_date||q.graduation_date,'date')+
 '</div>'+input('notes','Keterangan tambahan (opsional)',x.notes)+'</div>'+
 '<div class="sg-actions"><button type="submit" class="primary">Simpan & Analisis Otomatis</button></div></form>'+
 '<p class="sg-note">PNS melengkapi dokumen sesuai jalur tiga analisis. PPPK/PPPK Paruh Waktu boleh melampirkan dokumen yang dimiliki; data disimpan dalam tampungan masing-masing dan bukan analisis JF/S-1 PNS. PB/PLS cukup melakukan pendataan tanpa unggah berkas. Istilah pendamping bukan status kepegawaian atau dasar pengangkatan.</p>'+
 (old?'<div class="sg-actions"><button type="button" data-action="prior">Lihat Analisis Tersimpan</button></div>':'');
 const f=document.getElementById('smartgtkForm');
 function sync(){
  const isDeg=qualified.includes(f.elements.education.value);
  if(isDeg)f.elements.study_status.value='SUDAH_MEMENUHI';
  else if(f.elements.study_status.value==='SUDAH_MEMENUHI')f.elements.study_status.value='';
  for(const o of f.elements.study_status.options)o.disabled=(isDeg&&o.value&&o.value!=='SUDAH_MEMENUHI')||(!isDeg&&o.value==='SUDAH_MEMENUHI');
  const val=f.elements.study_status.value;
  f.elements.graduation_date.required=['SUDAH_MEMENUHI','LULUS_BELUM_VERIF'].includes(val);
  f.elements.university.required=val==='SEDANG_KULIAH';
  f.elements.program.required=val==='SEDANG_KULIAH';
  f.elements.target_graduation.disabled=isDeg;
  if(isDeg)f.elements.target_graduation.value='';
  if(p().role==='KEPALA_SEKOLAH')f.elements.profession.value='KEPALA_SEKOLAH';
  if(p().role==='PENGAWAS')f.elements.profession.value='PENGAWAS';
  const eligible=f.elements.employment.value==='PNS'&&['GURU','KEPALA_SEKOLAH'].includes(f.elements.profession.value);
  const fields=document.getElementById('sgJFFields');if(fields)fields.style.display=eligible?'grid':'none';
  for(const n of ['jf_sk','nomenclature_updated','pns_jf_formation'])f.elements[n].required=eligible;
  if(!eligible){
   f.elements.jf_sk.value='BELUM_TAHU';f.elements.old_position.value='';
   f.elements.pns_jf_formation.value='TIDAK';f.elements.nomenclature_updated.value='TIDAK_BERLAKU';
  }
  const employment=f.elements.employment.value;
  for(const o of f.elements.employment.options){
   if(['PB','PLS'].includes(o.value))o.disabled=['KEPALA_SEKOLAH','PENGAWAS'].includes(p().role);
  }
  let categoryError='';
  if(employment==='NON_ASN')categoryError='Pilih kategori Pendamping Belajar (PB) atau Pendamping Layanan Satpen (PLS) untuk memperbarui data lama.';
  if(employment==='PB'&&f.elements.profession.value!=='GURU')categoryError='Pendamping Belajar (PB) harus memilih tugas utama Guru.';
  if(employment==='PLS'&&f.elements.profession.value!=='TENDIK')categoryError='Pendamping Layanan Satpen (PLS) harus memilih tugas utama Tenaga Kependidikan.';
  f.elements.employment.setCustomValidity(categoryError);
  if(['KEPALA_SEKOLAH','PENGAWAS'].includes(p().role))f.elements.profession.disabled=true;
 }
 f.elements.education.addEventListener('change',sync);
 f.elements.study_status.addEventListener('change',sync);
 f.elements.employment.addEventListener('change',()=>{
  if(p().role==='GTK'&&f.elements.employment.value==='PB')f.elements.profession.value='GURU';
  if(p().role==='GTK'&&f.elements.employment.value==='PLS')f.elements.profession.value='TENDIK';
  sync();
 });
 f.elements.profession.addEventListener('change',sync);
 f.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;busy=true;info('Menyimpan dan menganalisis data...');
  const submit=f.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
  try{await save()}catch(error){info(error.message||String(error),true)}
  finally{busy=false;if(submit)submit.disabled=false}
 });sync();
}
/* SIMANTAB_SMARTGTK_PNS_THREE_GOAL_UI_V1: non-PNS results never render PNS screening cards. */
function results(data){
 const report=old||{};
 const pnsEligible=report.employment==='PNS'&&['GURU','KEPALA_SEKOLAH'].includes(report.profession)&&
  data?.hasil!=='PENDATAAN_BUKAN_USULAN';
 if(!pnsEligible){
  const employee=String(report.employment||'');
  const label=employee==='PPPK'?'PPPK':employee==='PPPK_PW'?'PPPK Paruh Waktu':
   employee==='PB'?'Pendamping Belajar':employee==='PLS'?'Pendamping Layanan Satuan Pendidikan':'Pendataan GTK';
  const isContract=employee==='PPPK'||employee==='PPPK_PW';
  body().innerHTML='<div class="sg-box"><h3>📁 '+esc(isContract?'Tampungan Data '+label:'Pendataan '+label)+'</h3>'+
   '<p>Data '+esc(label)+' disimpan '+(isContract?'pada tampungan khusus berdasarkan kategori kepegawaiannya.':
   'untuk kebutuhan pemetaan, terpisah dari analisis PNS.')+'</p>'+
   '<p class="sg-note"><b>Tidak termasuk tiga analisis PNS:</b> penyesuaian JF, pengangkatan JF, atau pemenuhan S-1/D-IV PNS.'+
   ' Tidak menghasilkan usulan atau SK kepegawaian.</p>'+
   '<div class="sg-actions"><button data-action="edit">Perbarui Data</button></div></div><div id="sgDocumentStep"></div>';
  void renderDocumentStep();return;
 }
 const branches=[['1. Penyesuaian Nomenklatur JF',data.nomenklatur],
  ['2. Pengangkatan JF Guru',data.pengangkatan],
  ['3. Pemenuhan Kualifikasi S-1/D-IV',data.kualifikasi]];
 body().innerHTML='<div class="sg-box"><h3>Hasil Skrining SMART-GTK · PNS Guru/Kepala Sekolah</h3>'+
 '<p>Ketiga tujuan ini khusus PNS dan harus diverifikasi Dinas. Satu PNS dapat memerlukan lebih dari satu tindak lanjut.</p><div class="sg-results">'+
 branches.map(([title,val])=>'<div class="sg-result"><b>'+esc(title)+'</b>'+esc(meanings[val]||val)+'</div>').join('')+
 '</div><p class="sg-note">Kualifikasi di bawah S-1/D-IV memerlukan tindak lanjut sesuai aturan yang berlaku. Hasil ini bukan SK atau usulan resmi.</p>'+
 '<div class="sg-actions"><button data-action="edit">Perbarui Data</button></div></div><div id="sgDocumentStep"></div>';
 void renderDocumentStep();
}

function documentStageLabel(stage,missing=0){
 if(stage==='BERKAS_LENGKAP'){
  return missing>0?'Berkas Perlu Dilengkapi Ulang':'Berkas Lengkap — Menunggu Verifikasi Dinas';
 }
 if(stage==='DATA_TERCATAT')return 'Data Tercatat';
 if(stage==='DRAFT')return missing===0?'Draf — Silakan Periksa Kelengkapan':'Draf — Belum Lengkap';
 return stage==='BELUM_MENGISI'?'Belum Mengisi':String(stage||'Belum Mengisi');
}
async function renderDocumentStep(){
 const target=document.getElementById('sgDocumentStep');if(!target||!gtk())return;
 const r=await sb.rpc('smartgtk_mass_status');if(r.error){info(r.error.message,true);return}
 const q=r.data||{},status=q.state||'BELUM_MENGISI';
 const policy=q.evidence_policy||'TANPA_UNGGAH';
 /* SIMANTAB_SMARTGTK_OWNER_FEEDBACK_V1: only the applicant can read their own returned correction note. */
 const wfResult=await sb.rpc('smartgtk_workflow_my_status');
 const wf=wfResult.error?{}:wfResult.data||{};
 const wfState=String(wf.state||'');
 const wfTitles={MENUNGGU_DATA:'Data perlu dikonfirmasi ulang',MENUNGGU_PENUGASAN:'Menunggu penugasan staf',
  MENUNGGU_STAF:'Sedang diperiksa staf',MENUNGGU_KASI:'Sedang diverifikasi Kasi/Subkoor',
  MENUNGGU_KABID:'Menunggu telaah akhir Kabid',PERBAIKAN_GTK:'Perlu perbaikan data GTK',
  PERBAIKAN_STAF:'Sedang diperbaiki staf',PERBAIKAN_KASI:'Sedang diperbaiki Kasi/Subkoor',
  SELESAI:'Telaah administratif SMART-GTK selesai'};
 const wfNotice=wfTitles[wfState]?
  '<div class="sg-box" role="'+(wfState==='PERBAIKAN_GTK'?'alert':'status')+'" style="border:1px solid '+(wfState==='PERBAIKAN_GTK'?'#ed9c79':'#b7d8f2')+'">'+
  '<b>Status tindak lanjut Dinas: '+esc(wfTitles[wfState])+'</b>'+
  (wfState==='PERBAIKAN_GTK'?'<p>'+esc(wf.note||'Periksa data, lakukan perbaikan bila diperlukan, lalu konfirmasi kelengkapan kembali.')+'</p>':'')+
  '<p class="small">Status verifikasi administratif, bukan SK atau penetapan jabatan.</p></div>':'';
 if(policy==='TANPA_UNGGAH'){
  target.innerHTML=wfNotice+'<div class="sg-box"><b>Pendataan tanpa berkas</b><p>Pendamping Belajar (PB) dan Pendamping Layanan Satpen (PLS) cukup mengisi data tanpa mengunggah dokumen.</p>'+
  '<p>Status: '+esc(status)+'</p><button data-action="complete" type="button">Konfirmasi Data Saya</button></div>';
  return;
 }
 const labels=policy==='WAJIB'?q.required||[]:(q.employment==='PPPK'?
  ['SK_PPPK','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS']:
  ['SK_PPPK_PW','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS']);
 const missing=q.missing||[];
 const stageLabel=documentStageLabel(status,missing.length);
 const awaitingDinas=policy==='WAJIB'&&status==='BERKAS_LENGKAP'&&missing.length===0;
 target.innerHTML=wfNotice+'<div class="sg-box"><h3>Dokumen '+(policy==='WAJIB'?'Wajib PNS':'PPPK/PPPK PW (hanya yang dimiliki)')+'</h3>'+
 '<p class="sg-note">'+(policy==='WAJIB'?'PNS melengkapi dokumen wajib sebelum status Berkas Lengkap. Simpan draf tetap diperbolehkan. Status lengkap belum berarti dokumen diverifikasi Dinas.':
 'PPPK/PPPK PW disimpan di tampungan khusus dan tidak mengikuti tiga analisis PNS. Tidak wajib mengunggah SK Jabfung yang belum dimiliki. Semua unggahan pada jalur ini opsional.')+'</p>'+
 '<p role="status" aria-live="polite"><strong>Status saat ini: '+esc(stageLabel)+'</strong>'+(policy==='WAJIB'?' • Berkas kurang: '+missing.length:'')+'</p>'+ 
 (awaitingDinas?'<p class="sg-note"><b>Seluruh dokumen wajib sudah tercatat.</b> Menunggu verifikasi administratif oleh Dinas. Belum merupakan persetujuan usulan, penetapan JF, atau penerbitan SK.</p>':'')+
 labels.map(t=>'<label class="sg-box">'+esc(docLabels[t]||t)+(policy==='WAJIB'?(missing.includes(t)?' — Belum ada':' — Tercatat'):' — Opsional')+
 '<input type="file" data-docfile="'+esc(t)+'" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png">'+
 '<div class="sg-actions"><button type="button" data-action="cabinet" data-type="'+esc(t)+'">📁 Ambil dari Lemari Dokumenku</button>'+
 '<button type="button" data-action="fileupload" data-type="'+esc(t)+'">Unggah ke Lemari Dokumenku</button></div></label>').join('')+
 '<div id="sgCabinetPicker" class="sg-box" hidden></div>'+
 '<p style="font-size:12px">PDF/JPG/PNG, maksimal 1,5 MB. Gunakan berkas asli yang sesuai. Status belum berarti berkas diverifikasi Dinas.</p>'+
 '<button type="button" data-action="complete">'+(policy==='WAJIB'?'Periksa Kelengkapan PNS':'Selesaikan Pendataan')+'</button></div>';
}
async function openCabinetPicker(type){
 if(!gtk()||!Object.hasOwn(docLabels,type))throw Error('Jenis berkas tidak valid');
 const container=document.getElementById('sgCabinetPicker');if(!container)return;
 const response=await sb.rpc('smartgtk_cabinet_candidates',{p_type:type});
 if(response.error)throw response.error;
 const rows=response.data||[];
 const count=rows.length;
 container.hidden=false;
 container.innerHTML='<b>📁 Lemari Dokumenku — '+esc(docLabels[type])+'</b>'+
 '<p class="sg-note">Pilih berkas dengan kategori dokumen yang sesuai. Hanya dokumen dengan jenis cocok yang ditampilkan; berkas hanya ditautkan dari lemari pribadi tanpa unggah ulang. Penetapan jenis dokumen belum berarti diverifikasi Dinas.</p>'+
 (count?'<div class="sg-scroll"><table><thead><tr><th>Dokumen tersedia</th><th>Ukuran</th><th>Tindakan</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+esc(x.file_name)+'<div style="font-size:12px">'+
 (type==='SK_JF'&&x.requirement_code==='SK_JABATAN_SEBELUMNYA'?
 'SK Jabfung Terakhir (kode arsip lama) — pastikan benar, perlu verifikasi Dinas':esc(x.requirement_code||'Dokumen pribadi'))+
 '</div></td><td>'+
 (Number(x.file_size)/1048576).toFixed(2)+' MB</td><td><button type="button" data-action="pickcabinet" data-type="'+esc(type)+
 '" data-fileid="'+esc(x.file_id)+'">Gunakan berkas ini</button></td></tr>').join('')+
 '</tbody></table></div>':
 '<p>Belum ada berkas dengan jenis yang sesuai di Lemari Dokumenku. Gunakan unggah berkas baru untuk memenuhi persyaratan ini.</p>')+
 '<button type="button" data-action="hidecabinet">Tutup pilihan</button>';
 container.scrollIntoView({block:'nearest'});
}
async function attachCabinetFile(type,fileId){
 if(!gtk()||!Object.hasOwn(docLabels,type)||!/^[a-f0-9-]{36}$/i.test(fileId||''))
  throw Error('Pilihan dokumen tidak valid');
 const response=await sb.rpc('smartgtk_import_cabinet',{p_type:type,p_file_id:fileId});
 if(response.error)throw response.error;
 info('Berkas '+(docLabels[type]||type)+' berhasil diambil dari Lemari Dokumenku sebagai referensi. Belum diverifikasi Dinas.');
 await renderDocumentStep();
}

async function uploadDocument(type){
 if(!gtk())throw Error('Hanya pemilik akun yang dapat mengunggah');
 if(!Object.hasOwn(docLabels,type))throw Error('Jenis berkas tidak dikenal');
 const file=document.querySelector('#sgDocumentStep input[data-docfile="'+type+'"]')?.files?.[0];
 if(!file)throw Error('Silakan pilih berkas terlebih dahulu');
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 const mime={'pdf':'application/pdf','jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png'}[ext];
 if(!mime||file.type!==mime)throw Error('Format berkas harus PDF, JPG, atau PNG yang sesuai');
 if(file.size>maxDocBytes||file.size===0)throw Error('Berkas harus lebih dari 0 dan maksimal 1,5 MB');
 const extSafe=ext==='jpeg'?'jpg':ext;
 const path=p().id+'/SMARTGTK/'+crypto.randomUUID()+'.'+extSafe;
 const uploaded=await sb.storage.from('simantab-documents').upload(path,file,{upsert:false,contentType:mime});
 if(uploaded.error)throw uploaded.error;
 const attached=await sb.rpc('smartgtk_locker_register',{
  p_type:type,p_path:path,p_name:file.name.slice(0,180),p_size:file.size,p_mime:mime
 });
 if(attached.error){
  // Undo only the brand-new object if metadata registration was rejected.
  await sb.storage.from('simantab-documents').remove([path]).catch(()=>{});
  throw attached.error;
 }
 info('Berkas '+(docLabels[type]||type)+' berhasil disimpan sekali di Lemari Dokumenku dan tercatat untuk SMART-GTK. Menunggu verifikasi Dinas.');
 await renderDocumentStep();
}
async function confirmCompleteness(){
 const r=await sb.rpc('smartgtk_mass_complete');if(r.error)throw r.error;
 info(r.data?.state==='BERKAS_LENGKAP'?'Berkas Lengkap — Menunggu Verifikasi Dinas. Kelengkapan belum berarti berkas disahkan.':'Pendataan GTK tercatat. Terima kasih.');
 const card=document.getElementById(dashboardCardId);
 if(card)void refreshDashboardPriority(card);
 await renderDocumentStep();
}

async function save(){
 if(!gtk())throw Error('Hanya GTK aktif yang dapat menyimpan');
 const f=document.getElementById('smartgtkForm');if(!f||!f.reportValidity())return;
 const v=Object.fromEntries(new FormData(f).entries());
 v.profession=f.elements.profession.value;
 if(v.employment==='PNS'&&['GURU','KEPALA_SEKOLAH'].includes(v.profession)&&v.jf_sk==='YA'&&!v.old_position){info('Silakan pilih jabatan sesuai SK Jabfung.',true);return}
 const args={p_profession:v.profession,p_employment:v.employment,p_jf_sk:v.jf_sk,p_old_position:v.old_position||'',p_nomenclature_updated:v.nomenclature_updated,p_pns_jf_formation:v.pns_jf_formation,
 p_education:v.education,p_study_status:v.study_status,p_university:v.university||'',p_program:v.program||'',p_start_year:v.start_year?Number(v.start_year):null,p_target_graduation:v.target_graduation||null,p_graduation_date:v.graduation_date||null,p_notes:v.notes||''};
 const r=await sb.rpc('smartgtk_mass_save',args);if(r.error)throw r.error;
 await loadGTK();results(r.data);info('Data tersimpan dan berhasil diklasifikasikan.');
}
/* SIMANTAB_SMARTGTK_ROLE_WORKFLOW_V1: all transitions validated by Supabase RPC; the UI never writes workflow rows directly. */
const flowRoles={KABID:'Kabid Ketenagaan',KASI_SD:'Kasi SD',KASI_SMP:'Kasi SMP',SUBKOOR_TK:'Subkoor TK/PAUD/PNF'};
const flowLabels={
 MENUNGGU_DATA:'Data GTK perlu dilengkapi',MENUNGGU_PENUGASAN:'Menunggu penugasan staf',
 MENUNGGU_STAF:'Pemeriksaan staf',MENUNGGU_KASI:'Validasi Kasi/Subkoor',
 MENUNGGU_KABID:'Keputusan Kabid',PERBAIKAN_GTK:'Perbaikan oleh GTK',
 PERBAIKAN_STAF:'Perbaikan oleh staf',PERBAIKAN_KASI:'Perbaikan Kasi/Subkoor',
 SELESAI:'Telaah administratif selesai'
};
const flowCoordinator=()=>['KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(p().role);
const flowStaff=()=>/^STAFF_|^ADMIN_/.test(p().role||'');
async function loadDinasWorkflow(){
 const officer=['KABID','SUPER_ADMIN','KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(p().role);
 const req=[
  sb.rpc('smartgtk_workflow_list',{p_page:workflowPage}),
  flowCoordinator()?sb.rpc('smartgtk_workflow_staff'):Promise.resolve({data:[]}),
  officer?sb.rpc('smartgtk_workflow_drafts',{p_page:workflowDraftPage}):
   Promise.resolve({data:{items:[],total:0,read_only:true}}),
  officer?sb.rpc('smartgtk_contract_buffer_list',{p_jenis:'PPPK',p_page:contractPages.PPPK}):
   Promise.resolve({data:{items:[],total:0,read_only:true}}),
  officer?sb.rpc('smartgtk_contract_buffer_list',{p_jenis:'PPPK_PW',p_page:contractPages.PPPK_PW}):
   Promise.resolve({data:{items:[],total:0,read_only:true}})
 ];
 const response=await Promise.all(req);
 for(const result of response)if(result.error)throw result.error;
 const data=response[0].data||{},draftData=response[2].data||{};
 workflowItems=Array.isArray(data.items)?data.items:[];
 workflowTotal=Number(data.total||0);
 workflowStaff=Array.isArray(response[1]?.data)?response[1].data:[];
 workflowDraftItems=Array.isArray(draftData.items)?draftData.items:[];
 workflowDraftTotal=Number(draftData.total||0);
 for(const [key,index] of [['PPPK',3],['PPPK_PW',4]]){
  const holding=response[index].data||{};
  contractRecords[key]=Array.isArray(holding.items)?holding.items:[];
  contractTotals[key]=Number(holding.total||0);
 }
}

function workflowActions(item){
 const status=item.status,role=p().role;
 const make=(action,title)=>'<button type="button" data-action="wf-act" data-owner="'+esc(item.owner_id)+'" data-operation="'+esc(action)+'">'+esc(title)+'</button>';
 if(role==='KABID'){
  if(item.scope==='BELUM_TERPETAKAN'&&status==='MENUNGGU_PENUGASAN')return make('SET_SCOPE','Tentukan Jenjang');
  if(status==='MENUNGGU_KABID')return make('APPROVE','✓ Selesaikan Telaah')+make('RETURN_COORD','↶ Kembalikan ke Kasi/Subkoor')+make('RETURN_GTK','↶ Perbaikan GTK');
 }
 if(flowCoordinator()){
  if(['MENUNGGU_PENUGASAN','MENUNGGU_STAF','PERBAIKAN_STAF'].includes(status))
   return '<div class="sg-actions"><select data-staff-for="'+esc(item.owner_id)+'" aria-label="Pilih staf pemeriksa">'+
    '<option value="">Pilih staf pemeriksa</option>'+
    workflowStaff.map(x=>option(x.id,(x.name||'Staf')+' · '+x.role,'')).join('')+
    '</select>'+make('ASSIGN_STAFF','Tugaskan Staf')+'</div>';
  if(['MENUNGGU_KASI','PERBAIKAN_KASI'].includes(status))
   return make('FORWARD_KABID','✓ Teruskan ke Kabid')+(item.assigned_staff?make('RETURN_STAFF','↶ Perbaikan Staf'):'')+make('RETURN_GTK','↶ Perbaikan GTK');
 }
 if(flowStaff()&&item.assigned_staff===p().id&&['MENUNGGU_STAF','PERBAIKAN_STAF'].includes(status))
  return make('SEND_KASI','✓ Kirim ke Kasi/Subkoor')+make('RETURN_GTK','↶ Minta Perbaikan GTK');
 return '<span class="small">Menunggu tahap berikutnya</span>';
}
/* SIMANTAB_SMARTGTK_KABID_DRAFT_MONITOR_V1: read-only preview; never include drafts in approval or staff assignment. */
function workflowDraftsPanel(){
 if(!['KABID','SUPER_ADMIN','KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(p().role))return '';
 return '<div class="sg-box" style="margin:12px 0;border:1px solid #e3b86a;background:#fffaf0">'+
 '<h3>📝 Pemantauan Draf SMART GTK · '+workflowDraftTotal+' akun</h3>'+
 '<p class="small">Draf belum diajukan oleh GTK. Nama terlihat untuk pemantauan saja; <b>belum dapat ditugaskan kepada staf, diverifikasi, atau disetujui</b>.</p>'+
 '<div class="sg-scroll"><table><thead><tr><th>Nama dan Satuan Pendidikan</th><th>Status Kepegawaian</th><th>Jenjang</th><th>Status Isian</th></tr></thead><tbody>'+
 (workflowDraftItems.length?workflowDraftItems.map(x=>'<tr>'+
  '<td><b>'+esc(x.full_name||'-')+'</b><div class="small">'+esc(x.unit_work||'-')+'</div></td>'+
  '<td>'+esc(x.profession||'-')+' / '+esc(employmentLabel(x.employment)||'-')+'</td>'+
  '<td>'+esc(x.scope||'BELUM_TERPETAKAN')+'</td>'+
  '<td><b style="color:#995c14">DRAFT</b><div class="small">'+esc(x.document_records??0)+' dokumen tercatat</div>'+
  '<div class="small">Menunggu GTK mengonfirmasi kelengkapan</div></td></tr>').join(''):
  '<tr><td colspan="4">Tidak ada draf pada cakupan akun ini.</td></tr>')+
 '</tbody></table></div><div class="sg-actions" style="margin-top:8px">'+
 '<button type="button" data-action="wf-draft-prev" '+(workflowDraftPage===0?'disabled':'')+'>← Draf sebelumnya</button>'+
 '<button type="button" data-action="wf-draft-next" '+((workflowDraftPage+1)*50>=workflowDraftTotal?'disabled':'')+'>Draf berikutnya →</button></div></div>';
}
/* SIMANTAB_SMARTGTK_SEPARATE_CONTRACT_BUCKETS_UI_V1: category-specific read-only holding lists. */
function workflowContractPanel(kind){
 if(!['KABID','SUPER_ADMIN','KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(p().role))return '';
 const title=kind==='PPPK'?'PPPK':'PPPK Paruh Waktu';
 const records=contractRecords[kind]||[],total=contractTotals[kind]||0;
 const page=contractPages[kind]||0;
 return '<div class="sg-box" style="margin:12px 0;border:1px solid #c5d6ee;background:#f5f9ff">'+
  '<h3>📁 Tampungan Data '+title+' · '+total+' akun</h3>'+
  '<p class="small">Database khusus '+title+'. Data dipertahankan sebagai catatan administratif, terpisah dari tiga analisis dan penetapan JF/S-1 bagi PNS. '+ 
  'Bukan antrean persetujuan PNS. Jika NPSN belum terpetakan, jenjang belum terkonfirmasi.</p>'+
  '<div class="sg-scroll"><table><thead><tr><th>Nama dan Satuan Pendidikan</th><th>NIP</th><th>Jenis dan Pendidikan</th><th>Status Pendataan</th></tr></thead><tbody>'+
  (records.length?records.map(x=>'<tr><td><b>'+esc(x.full_name||'-')+'</b><div class="small">'+esc(x.unit_work||'-')+'</div></td>'+
   '<td>'+esc(x.nip||'-')+'</td><td>'+esc(x.profession||'-')+' / '+esc(x.education||'-')+
   '<div class="small">Jenjang: '+esc(x.scope||'BELUM_TERPETAKAN')+'</div></td>'+
   '<td><b>'+esc(x.data_stage||'-')+'</b><div class="small">Tampungan '+title+' — tidak termasuk analisis PNS</div></td></tr>').join(''):
   '<tr><td colspan="4">Belum ada isian '+title+' dalam cakupan akun ini.</td></tr>')+
  '</tbody></table></div><div class="sg-actions" style="margin-top:9px">'+
  '<button type="button" data-action="wf-contract-prev" data-contract-kind="'+kind+'" '+(page===0?'disabled':'')+'>← Sebelumnya</button>'+
  '<button type="button" data-action="wf-contract-next" data-contract-kind="'+kind+'" '+((page+1)*50>=total?'disabled':'')+'>Berikutnya →</button></div></div>';
}
function workflowDashboard(){
 const role=flowRoles[p().role]||(flowStaff()?'Staf Ketenagaan':'Monitoring Dinas');
 const grouped={};for(const i of workflowItems)grouped[i.status]=(grouped[i.status]||0)+1;
 const counters=Object.entries(grouped).map(([k,n])=>'<span style="display:inline-block;background:#edf6ff;border-radius:7px;padding:6px 8px;margin:4px 5px 4px 0">'+esc(flowLabels[k]||k)+': <b>'+n+'</b></span>').join('');
 body().innerHTML='<div class="sg-box"><h3>🧭 Workflow SMART-GTK · '+esc(role)+'</h3>'+
 '<p class="sg-note">Alur: staf memeriksa → Kasi/Subkoor memvalidasi menurut jenjang → Kabid menyelesaikan telaah. Kasus NPSN belum terpetakan menunggu penetapan jenjang oleh Kabid. Tidak mengubah isian awal GTK maupun menerbitkan SK/JF.</p>'+
 '<p><b>'+workflowTotal+'</b> kasus PNS siap diproses · <b>'+workflowDraftTotal+'</b> draf PNS · <b>'+contractTotals.PPPK+'</b> tampungan PPPK · <b>'+contractTotals.PPPK_PW+'</b> tampungan PPPK PW. Halaman antrean '+(workflowPage+1)+'.</p>'+
 '<div>'+counters+'</div>'+workflowDraftsPanel()+workflowContractPanel('PPPK')+workflowContractPanel('PPPK_PW')+
 (['KABID','SUPER_ADMIN','STAFF_USUL_SK'].includes(p().role)?'<button type="button" data-action="wf-legacy">Lihat Skrining Lama</button>':'')+
 '<div class="sg-scroll"><table><thead><tr><th>Nama dan Satuan Pendidikan</th><th>Data GTK</th><th>Jenjang/Tahap</th><th>Staf Pemeriksa</th><th>Keputusan/Tindakan</th></tr></thead><tbody>'+
 (workflowItems.length?workflowItems.map(x=>'<tr><td><b>'+esc(x.full_name||'-')+'</b><div class="small">'+esc(x.unit_work||'-')+'</div></td>'+
 '<td>'+esc(x.profession||'-')+' / '+esc(employmentLabel(x.employment)||'-')+'<div class="small">Status berkas: '+esc(x.data_stage||'-')+' · '+esc(x.document_records||0)+' dokumen tercatat</div></td>'+
 '<td><b>'+esc(x.scope||'-')+'</b><div class="small">'+esc(flowLabels[x.status]||x.status||'-')+'</div></td>'+
 '<td>'+esc(x.staff_name||'Belum ditugaskan')+'</td>'+
 '<td><div class="sg-actions">'+workflowActions(x)+'</div>'+
 (x.staff_note?'<div class="small">Staf: '+esc(x.staff_note)+'</div>':'')+
 (x.coordinator_note?'<div class="small">Kasi/Subkoor: '+esc(x.coordinator_note)+'</div>':'')+
 (x.kabid_note?'<div class="small">Kabid: '+esc(x.kabid_note)+'</div>':'')+
 '</td></tr>').join(''):'<tr><td colspan="5">Tidak ada antrean dalam cakupan peran ini. Draf GTK belum masuk alur verifikasi.</td></tr>')+
 '</tbody></table></div><div class="sg-actions" style="margin-top:10px">'+
 '<button type="button" data-action="wf-prev" '+(workflowPage===0?'disabled':'')+'>← Sebelumnya</button>'+
 '<button type="button" data-action="wf-next" '+((workflowPage+1)*50>=workflowTotal?'disabled':'')+'>Berikutnya →</button>'+
 '<button type="button" data-action="wf-refresh">↻ Segarkan</button></div></div>';
}
async function workflowAction(btn){
 const owner=String(btn.dataset.owner||'');
 const action=String(btn.dataset.operation||'');
 const row=workflowItems.find(x=>x.owner_id===owner);
 if(!row)throw Error('Peserta tidak ditemukan di antrean saat ini. Segarkan daftar.');
 const valid=/^[a-f0-9-]{36}$/i.test(owner);
 if(!valid)throw Error('Identitas peserta tidak valid');
 let staff=null,scope=null,note='';
 if(action==='SET_SCOPE'){
  scope=(prompt('Pemetaan resmi '+row.full_name+'. Isi SD, SMP, atau TK_PAUD_PNF:')||'').trim().toUpperCase();
  if(!['SD','SMP','TK_PAUD_PNF'].includes(scope))return info('Jenjang tidak valid. Tidak ada perubahan.',true);
 }
 if(action==='ASSIGN_STAFF'){
  staff=document.querySelector('[data-staff-for="'+owner+'"]')?.value||'';
  if(!staff)return info('Pilih staf pemeriksa yang aktif.',true);
 }
 if(['RETURN_GTK','RETURN_STAFF','RETURN_COORD'].includes(action)){
  note=(prompt('Catatan perbaikan untuk '+row.full_name+' (minimal 10 karakter):')||'').trim();
  if(note.length<10)return info('Perbaikan dibatalkan: catatan minimal 10 karakter.',true);
 }else if(action==='SEND_KASI'||action==='FORWARD_KABID'||action==='APPROVE'){
  note='Verifikasi administratif SMART-GTK dilakukan sesuai tugas dan jenjang.';
 }
 if(!confirm('Proses '+row.full_name+'?\nTahap saat ini: '+(flowLabels[row.status]||row.status)+
  '\nTindakan: '+action+'\nTindakan ini dicatat dalam audit.'))return;
 const result=await sb.rpc('smartgtk_workflow_act',{
  p_owner:owner,p_action:action,p_note:note||null,p_staff:staff||null,p_scope:scope||null
 });
 if(result.error)throw result.error;
 if(result.data?.ok!==true)throw Error('Server belum mengonfirmasi perubahan workflow.');
 info('Alur berhasil diperbarui untuk '+row.full_name+'.');
 await loadDinasWorkflow();workflowDashboard();
}

async function listDinas(){
 const [r,sum]=await Promise.all([sb.rpc('smartgtk_mass_officer_list',{p_page:pg}),
  sb.rpc('smartgtk_mass_onboarding_summary')]);
 if(r.error)throw r.error;if(sum.error)throw sum.error;
 items=r.data||[];onboarding=sum.data||null;
}
function dashboard(){
 const counts={n:0,a:0,q:0};for(const x of items){if(x.screening?.nomenklatur==='POTENSI_USUL')counts.n++;if(['POTENSI_USUL','TERTAHAN_KUALIFIKASI'].includes(x.screening?.pengangkatan))counts.a++;if(['PERLU_PEMENUHAN_2030','TELAAH_KHUSUS'].includes(x.screening?.kualifikasi))counts.q++}
 body().innerHTML='<p class="sg-note">Rekap analisis tiga tujuan hanya untuk PNS Guru/Kepala Sekolah pada halaman ini. PPPK dan PPPK PW tersedia pada tampungan khusus; ini bukan keputusan kepegawaian.</p>'+
 '<div class="sg-box"><b>Progres Akun GTK SIMANTAB</b><p>Terdaftar: '+esc(onboarding?.registered_accounts??'-')+
 ' • Aktif/disetujui: '+esc(onboarding?.approved_active??'-')+
 ' • Belum pernah login: '+esc(onboarding?.never_signed_in??'-')+
 ' • Mengisi SMART-GTK: '+esc(onboarding?.smartgtk_reported??'-')+'</p>'+
 '<p style="font-size:12px">Jumlah GTK yang belum memiliki akun tidak dapat dihitung tanpa daftar induk GTK. Jumlah di atas hanya mencakup akun yang sudah tercatat di SIMANTAB.</p></div>'+
 '<div class="sg-box"><b>Monitoring 3 Analisis PNS • Halaman '+(pg+1)+'</b><p>Penyesuaian JF: '+counts.n+' • Pengangkatan JF: '+counts.a+' • Pemenuhan S-1/D-IV: '+counts.q+'</p>'+
 '<div class="sg-scroll"><table><thead><tr><th>GTK</th><th>Tugas/ASN</th><th>Nomenklatur</th><th>Pengangkatan</th><th>Pendidikan/Berkas</th></tr></thead><tbody>'+
 (items.length?items.map(x=>'<tr><td>'+esc(x.full_name)+'<div>'+esc(x.unit_work)+'</div></td><td>'+esc(x.profession)+' / '+esc(employmentLabel(x.employment))+'</td><td>'+esc(meanings[x.screening?.nomenklatur]||x.screening?.nomenklatur)+'</td><td>'+esc(meanings[x.screening?.pengangkatan]||x.screening?.pengangkatan)+'</td><td>'+esc(x.education)+' — '+esc(x.data_stage==='BERKAS_LENGKAP'?'Berkas Lengkap (belum diverifikasi Dinas)':x.data_stage)+' ('+esc(x.docs_present)+' berkas; '+esc(x.required_count)+' wajib)'+'</td></tr>').join(''):'<tr><td colspan="5">Belum ada GTK mengisi SMART-GTK.</td></tr>')+
 '</tbody></table></div><div class="sg-actions"><button data-action="prev" '+(pg===0?'disabled':'')+'>Sebelumnya</button><button data-action="next" '+(items.length<50?'disabled':'')+'>Berikutnya</button></div></div>';
}
/* SIMANTAB_SMARTGTK_KS_NEEDS_PRIORITY_V1: KS negeri must submit GTK needs before opening SMART-GTK. */
async function ksRealNeedsPending(){
 if(p().role!=='KEPALA_SEKOLAH')return false;
 const npsn=String(p().school_npsn||'').trim();
 if(!/^\d{8}$/.test(npsn))return true;
 const school=await sb.from('school_master').select('school_status,is_active').eq('npsn',npsn).maybeSingle();
 if(school.error||!school.data||school.data.is_active!==true)return true;
 if(String(school.data.school_status||'').toUpperCase()!=='NEGERI')return false;
 const workflow=await sb.from('school_gtk_needs_workflow').select('status').eq('school_npsn',npsn).maybeSingle();
 if(workflow.error)return true;
 return !['SUBMITTED','VERIFIED','APPROVED'].includes(String(workflow.data?.status||'').toUpperCase());
}
async function open(){
 if(!gtk()&&!dinas())return;
 if(gtk()&&p().role==='KEPALA_SEKOLAH'){
  const mustComplete=await ksRealNeedsPending();
  if(mustComplete){
   await window.showTab?.('needs');
   return;
  }
 }
 modal.style.display='flex';info('Memuat data...');
 try{
   if(dinas()){workflowPage=0;workflowDraftPage=0;contractPages={PPPK:0,PPPK_PW:0};await loadDinasWorkflow();workflowDashboard()}
   else {
    const enrolled=await sb.rpc('smartgtk_pilot_status');
    if(enrolled.error)throw enrolled.error;
    if(enrolled.data===true){await loadGTK();form()}
    else {body().innerHTML='<p class="sg-note">Akun belum memenuhi ketentuan akses SMART-GTK. Pastikan akun aktif dan disetujui Dinas; jika perlu, hubungi admin SIMANTAB. Layanan lainnya tetap dapat digunakan.</p>'}
   }
   info('')
  }
 catch(e){body().innerHTML='<p class="sg-note">SMART-GTK belum dapat dimuat. Segarkan halaman dan coba kembali. Jika kendala berlanjut, hubungi admin SIMANTAB.</p>';info(e.message||String(e),true)}
}
modal.addEventListener('click',async e=>{
 const b=e.target.closest('button[data-action]');if(!b||busy)return;
 const act=b.dataset.action;if(act==='close'){modal.style.display='none';return}
 try{
  busy=true;info('');
  if(act==='edit'){await loadGTK();form()}
  if(act==='fileupload'){await uploadDocument(b.dataset.type)}
  if(act==='cabinet'){await openCabinetPicker(b.dataset.type)}
  if(act==='pickcabinet'){await attachCabinetFile(b.dataset.type,b.dataset.fileid)}
  if(act==='hidecabinet'){const el=document.getElementById('sgCabinetPicker');if(el)el.hidden=true}
  if(act==='complete'){await confirmCompleteness()}
  if(act==='education'){modal.style.display='none';window.__simantabJF2030?.open()}
  if(act==='prior'){const r=await sb.rpc('smartgtk_mass_get');if(r.error)throw r.error;results(r.data?.classification||{})}
  if(act==='next'||act==='prev'){pg=Math.max(0,pg+(act==='next'?1:-1));await listDinas();dashboard()}
  if(act==='wf-act')await workflowAction(b);
  if(act==='wf-next'||act==='wf-prev'||act==='wf-refresh'){
   if(act==='wf-next')workflowPage++;
   if(act==='wf-prev')workflowPage=Math.max(0,workflowPage-1);
   await loadDinasWorkflow();workflowDashboard();
  }
  if(act==='wf-draft-next'||act==='wf-draft-prev'){
   if(act==='wf-draft-next')workflowDraftPage++;
   if(act==='wf-draft-prev')workflowDraftPage=Math.max(0,workflowDraftPage-1);
   await loadDinasWorkflow();workflowDashboard();
  }
  if(act==='wf-contract-prev'||act==='wf-contract-next'){
   const kind=String(b.dataset.contractKind||'');
   if(!['PPPK','PPPK_PW'].includes(kind))throw Error('Kategori tampungan tidak dikenal');
   if(act==='wf-contract-prev')contractPages[kind]=Math.max(0,contractPages[kind]-1);
   else if((contractPages[kind]+1)*50<contractTotals[kind])contractPages[kind]++;
   await loadDinasWorkflow();workflowDashboard();
  }
  if(act==='wf-legacy'){pg=0;await listDinas();dashboard();
   body().insertAdjacentHTML('afterbegin','<button type="button" data-action="wf-return">← Kembali ke Workflow SMART-GTK</button>');
  }
  if(act==='wf-return'){await loadDinasWorkflow();workflowDashboard();}
 }catch(error){info(error.message||String(error),true)}finally{busy=false}
});
window.__smartGtkUnified={open,version:23,pnsThreeGoals:true,contractBuffers:true,draftMonitoring:true,deadlineReminder:true,deadlineAt:'2026-10-26T23:59:00+07:00',ksNeedsPriority:true,backendRequired:true,dinasWorkflowNav:true,roleWorkflow:true,ownerWorkflowFeedback:true};
})();