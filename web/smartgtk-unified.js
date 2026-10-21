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
const dinas=()=>p().account_channel==='DINAS'&&['SUPER_ADMIN','KABID','STAFF_USUL_SK'].includes(p().role)&&p().approval_status==='APPROVED'&&p().is_active!==false;
const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const qualified=['S1','DIV','S2','S3'];
const options={
 profession:[['','Pilih tugas'],['GURU','Guru'],['KEPALA_SEKOLAH','Kepala Sekolah'],['PENGAWAS','Pengawas Sekolah'],['TENDIK','Tenaga Kependidikan']],
 employment:[['','Pilih status kepegawaian'],['PNS','PNS'],['PPPK','PPPK'],['PPPK_PW','PPPK paruh waktu'],['NON_ASN','Non-ASN'],['LAINNYA','Lainnya']],
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
const modal=document.createElement('div');modal.id='smartgtkModal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
modal.innerHTML='<div class="sg-container"><div class="sg-head"><b>SMART-GTK • Satu Data, Tiga Analisis</b><button type="button" data-action="close">✕ Tutup</button></div><p id="sgMessage" role="status"></p><div id="sgBody"></div></div>';document.body.append(modal);
const style=document.createElement('style');
style.textContent='#smartgtkModal{display:none;position:fixed;inset:0;z-index:1000010;background:#10223fcb;padding:12px;overflow:auto;align-items:flex-start;justify-content:center}#smartgtkModal .sg-container{background:#fff;color:#1b3451;border-radius:14px;padding:17px;width:min(940px,100%);max-height:calc(100vh - 24px);overflow:auto;font:14px system-ui,sans-serif}#smartgtkModal .sg-head,#smartgtkModal .sg-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}#smartgtkModal .sg-box{border:1px solid #d5e0ed;border-radius:11px;margin:12px 0;padding:12px}#smartgtkModal .sg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#smartgtkModal label{display:flex;flex-direction:column;gap:6px;margin:7px 0}#smartgtkModal select,#smartgtkModal input{box-sizing:border-box;width:100%;padding:10px;border-radius:8px;border:1px solid #aebed1;color:#1d3652;background:white}#smartgtkModal button{cursor:pointer;padding:9px;border-radius:8px;border:1px solid #9dbed7;background:#eaf4fc;color:#185782;font-weight:700}#smartgtkModal button.primary{background:#ee7d17;border:0;color:white}#smartgtkModal .sg-note{background:#edf6ff;border-radius:9px;padding:10px;line-height:1.5}#smartgtkModal .sg-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}#smartgtkModal .sg-result{border:1px solid #b9cadc;border-radius:9px;padding:11px}#smartgtkModal .sg-result b{display:block;margin-bottom:8px}#smartgtkModal .sg-scroll{overflow:auto}#smartgtkModal table{min-width:610px;border-collapse:collapse;width:100%}#smartgtkModal td,#smartgtkModal th{border-bottom:1px solid #dbe5ef;padding:9px;text-align:left;vertical-align:top}@media(max-width:650px){#smartgtkModal .sg-grid,#smartgtkModal .sg-results{grid-template-columns:1fr}}';document.head.append(style);
const body=()=>document.getElementById('sgBody');
const info=(s='',error=false)=>{const el=document.getElementById('sgMessage');el.textContent=s;el.style.color=error?'#ae2d25':'#156595'};
const option=(v,l,selected)=>'<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(l)+'</option>';
const select=(name,label,value,required=true)=>'<label>'+esc(label)+'<select name="'+name+'" '+(required?'required':'')+'>'+options[name].map(([v,l])=>option(v,l,value)).join('')+'</select></label>';
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
 '#smartgtkPrimaryNav{background:#fff1d5;color:#7d410b;font-weight:800;border-left:4px solid #d18219}',
 '@media(max-width:520px){#smartgtkDashboardPriority{padding:15px}#smartgtkDashboardPriority .sg-priority-action{max-width:none}}'
].join('');
document.head.append(priorityCss);
function removeOldGTKServiceTiles(){
 document.getElementById('smartgtkTile')?.remove();
 document.getElementById('jf2026ServiceTile')?.remove();
 document.getElementById('jf2030ServiceTile')?.remove();
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
  '<h3>🧭 SMART-GTK — Satu Data, Tiga Analisis</h3>'+
  '<p>Satu kali isi untuk pendataan guru, kepala sekolah, pengawas, dan tenaga kependidikan.</p>'+
  '<p class="sg-deadline">⏰ Deadline input data paling lambat 26 Oktober 2026, pukul 23.59 WIB.</p>'+
  '<button type="button" class="sg-priority-action">Lihat SMART-GTK</button>'+
  '<p class="sg-priority-help" role="status">Memeriksa apakah akun dapat mengisi SMART-GTK...</p>';
  card.querySelector('button').addEventListener('click',open);
 }
 if(card.parentElement!==root||card.nextElementSibling!==body)root.insertBefore(card,body);
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
   msg.textContent='Akun dapat mengisi. Simpan data dahulu, lalu lengkapi berkas sesuai status kepegawaian.';
  }else{
   btn.textContent='Lihat informasi SMART-GTK →';
   msg.textContent='Saat ini masih uji coba terbatas. Pengisian tersedia setelah akun ditetapkan Dinas atau layanan dibuka secara umum.';
  }
 }catch(error){
  if(token!==priorityCheck||!card.isConnected)return;
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
function ensureDinasService(){
 const root=document.getElementById('servicesBody');
 if(!dinas()||!root){document.getElementById('smartgtkTile')?.remove();return}
 if(document.getElementById('smartgtkTile'))return;
 const item=document.createElement('div');item.id='smartgtkTile';item.className='card';
 item.style.cssText='padding:14px;margin:12px 0;background:#eef8ff;border:1px solid #b8d9ed;border-radius:12px';
 item.innerHTML='<h3>🧭 Monitoring SMART-GTK</h3><p class="small">Pantau pendataan dan skrining awal guru/KS PNS berdasarkan laporan GTK. Bukan persetujuan SK.</p><button type="button" class="btn primary">Buka Monitoring</button>';
 item.querySelector('button').addEventListener('click',open);
 root.prepend(item);
}
function placeSmartGtk(){
 if(gtk()){ensureGTKDashboard();ensureGTKNav();return}
 document.getElementById(dashboardCardId)?.remove();
 document.getElementById(navButtonId)?.remove();
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
if(navRoot)new MutationObserver(()=>{if(gtk()&&!document.getElementById(navButtonId))ensureGTKNav()}).observe(navRoot,{childList:true});
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
 body().innerHTML='<p class="sg-note">Semua GTK mengisi data yang sama. Identitas berasal dari Profil GTK dan data pendidikan sebelumnya dipakai kembali. SIMANTAB menganalisis secara otomatis; petugas tetap memverifikasi persyaratan sebelum usulan resmi.</p>'+
 '<div class="sg-box"><b>'+esc(p().full_name||'GTK')+'</b><p>NIP '+esc(p().nip||'-')+' • '+esc(p().unit_gtk||p().unit||'')+'</p></div>'+
 '<form id="smartgtkForm"><div class="sg-box"><b>A. Tugas dan Status Kepegawaian</b><div class="sg-grid">'+
 select('profession','Tugas utama *',profession)+
 select('employment','Status kepegawaian *',x.employment)+
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
 '<p class="sg-note">Data boleh disimpan sebagai draf. PNS wajib berkas sesuai jalur; PPPK/PPPK PW boleh unggah yang dimiliki; non-ASN tanpa unggah. Hasil bukan keputusan atau SK.</p>'+
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
  if(['KEPALA_SEKOLAH','PENGAWAS'].includes(p().role))f.elements.profession.disabled=true;
 }
 f.elements.education.addEventListener('change',sync);
 f.elements.study_status.addEventListener('change',sync);
 f.elements.employment.addEventListener('change',sync);
 f.elements.profession.addEventListener('change',sync);
 f.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;busy=true;info('Menyimpan dan menganalisis data...');
  const submit=f.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
  try{await save()}catch(error){info(error.message||String(error),true)}
  finally{busy=false;if(submit)submit.disabled=false}
 });sync();
}
function results(data){
 const branches=[['Penyesuaian Nomenklatur JF',data.nomenklatur],['Pengangkatan JF Guru',data.pengangkatan],['Pemenuhan Pendidikan S-1/D-IV',data.kualifikasi]];
 body().innerHTML='<div class="sg-box"><h3>Hasil Skrining Awal SMART-GTK</h3><p>Seorang GTK bisa masuk lebih dari satu kelompok. Semua tindak lanjut perlu verifikasi petugas.</p><div class="sg-results">'+
 branches.map(([title,val])=>'<div class="sg-result"><b>'+esc(title)+'</b>'+esc(meanings[val]||val)+'</div>').join('')+
 '</div><p class="sg-note">SLTA/SPG memerlukan telaah khusus; tenggat diploma tidak otomatis berlaku. Hasil tidak menerbitkan SK atau menyampaikan usulan resmi.</p>'+
 '<div class="sg-actions"><button data-action="edit">Perbarui Data</button></div></div><div id="sgDocumentStep"></div>';
 void renderDocumentStep();
}

async function renderDocumentStep(){
 const target=document.getElementById('sgDocumentStep');if(!target||!gtk())return;
 const r=await sb.rpc('smartgtk_mass_status');if(r.error){info(r.error.message,true);return}
 const q=r.data||{},status=q.state||'BELUM_MENGISI';
 const policy=q.evidence_policy||'TANPA_UNGGAH';
 if(policy==='TANPA_UNGGAH'){
  target.innerHTML='<div class="sg-box"><b>Pendataan tanpa berkas</b><p>GTK non-ASN hanya menyimpan data. Tidak perlu mengunggah dokumen.</p>'+
  '<p>Status: '+esc(status)+'</p><button data-action="complete" type="button">Konfirmasi Data Saya</button></div>';
  return;
 }
 const labels=policy==='WAJIB'?q.required||[]:(q.employment==='PPPK'?
  ['SK_PPPK','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS']:
  ['SK_PPPK_PW','IJAZAH_TERAKHIR','SERDIK','SURAT_TUGAS']);
 const missing=q.missing||[];
 target.innerHTML='<div class="sg-box"><h3>Dokumen '+(policy==='WAJIB'?'Wajib PNS':'PPPK/PPPK PW (hanya yang dimiliki)')+'</h3>'+
 '<p class="sg-note">'+(policy==='WAJIB'?'PNS harus melengkapi semua berkas wajib sebelum status BERKAS LENGKAP. Simpan draf tetap boleh.':
 'Tidak perlu mengunggah SK Jabfung yang belum dimiliki. Semua unggahan bersifat opsional.')+'</p>'+
 '<p>Status saat ini: <b>'+esc(status)+'</b>'+(policy==='WAJIB'?' • Berkas kurang: '+missing.length:'')+'</p>'+
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
 info(r.data?.state==='BERKAS_LENGKAP'?'Semua berkas wajib PNS tercatat. Menunggu telaah Dinas.':'Pendataan GTK tercatat. Terima kasih.');
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
async function listDinas(){
 const [r,sum]=await Promise.all([sb.rpc('smartgtk_mass_officer_list',{p_page:pg}),
  sb.rpc('smartgtk_mass_onboarding_summary')]);
 if(r.error)throw r.error;if(sum.error)throw sum.error;
 items=r.data||[];onboarding=sum.data||null;
}
function dashboard(){
 const counts={n:0,a:0,q:0};for(const x of items){if(x.screening?.nomenklatur==='POTENSI_USUL')counts.n++;if(['POTENSI_USUL','TERTAHAN_KUALIFIKASI'].includes(x.screening?.pengangkatan))counts.a++;if(['PERLU_PEMENUHAN_2030','TELAAH_KHUSUS'].includes(x.screening?.kualifikasi))counts.q++}
 body().innerHTML='<p class="sg-note">Rekap pada halaman ini saja, bukan seluruh GTK Batang. Data berupa laporan GTK dan bukan keputusan kepegawaian.</p>'+
 '<div class="sg-box"><b>Progres Akun GTK SIMANTAB</b><p>Terdaftar: '+esc(onboarding?.registered_accounts??'-')+
 ' • Aktif/disetujui: '+esc(onboarding?.approved_active??'-')+
 ' • Belum pernah login: '+esc(onboarding?.never_signed_in??'-')+
 ' • Mengisi SMART-GTK: '+esc(onboarding?.smartgtk_reported??'-')+'</p>'+
 '<p style="font-size:12px">Jumlah GTK yang belum memiliki akun tidak dapat dihitung tanpa daftar induk GTK. Jumlah di atas hanya mencakup akun yang sudah tercatat di SIMANTAB.</p></div>'+
 '<div class="sg-box"><b>Monitoring Hasil Skrining • Halaman '+(pg+1)+'</b><p>Nomenklatur: '+counts.n+' • Pengangkatan: '+counts.a+' • Kualifikasi: '+counts.q+'</p>'+
 '<div class="sg-scroll"><table><thead><tr><th>GTK</th><th>Tugas/ASN</th><th>Nomenklatur</th><th>Pengangkatan</th><th>Pendidikan/Berkas</th></tr></thead><tbody>'+
 (items.length?items.map(x=>'<tr><td>'+esc(x.full_name)+'<div>'+esc(x.unit_work)+'</div></td><td>'+esc(x.profession)+' / '+esc(x.employment)+'</td><td>'+esc(meanings[x.screening?.nomenklatur]||x.screening?.nomenklatur)+'</td><td>'+esc(meanings[x.screening?.pengangkatan]||x.screening?.pengangkatan)+'</td><td>'+esc(x.education)+' — '+esc(x.data_stage)+' ('+esc(x.docs_present)+' berkas; '+esc(x.required_count)+' wajib)'+'</td></tr>').join(''):'<tr><td colspan="5">Belum ada GTK mengisi SMART-GTK.</td></tr>')+
 '</tbody></table></div><div class="sg-actions"><button data-action="prev" '+(pg===0?'disabled':'')+'>Sebelumnya</button><button data-action="next" '+(items.length<50?'disabled':'')+'>Berikutnya</button></div></div>';
}
async function open(){
 if(!gtk()&&!dinas())return;modal.style.display='flex';info('Memuat data...');
 try{
   if(dinas()){pg=0;await listDinas();dashboard()}
   else {
    const enrolled=await sb.rpc('smartgtk_pilot_status');
    if(enrolled.error)throw enrolled.error;
    if(enrolled.data===true){await loadGTK();form()}
    else {body().innerHTML='<p class="sg-note">SMART-GTK masih tahap pilot terbatas. Akun GTK ini belum ditetapkan sebagai peserta oleh Dinas. Silakan tetap menggunakan layanan SIMANTAB lainnya.</p>'}
   }
   info('')
  }
 catch(e){body().innerHTML='<p class="sg-note">Modul belum diaktifkan pada database ini. Hubungi admin.</p>';info(e.message||String(e),true)}
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
 }catch(error){info(error.message||String(error),true)}finally{busy=false}
});
window.__smartGtkUnified={open,version:11,backendRequired:true};
})();