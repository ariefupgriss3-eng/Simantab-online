/* SIMANTAB_INSTITUTION_OPERATOR_PORTAL_V2_SIX_SERVICES_SCOPED */
(()=>{
 const $=id=>document.getElementById(id),p=()=>window.__simantabProfile||{},sb=()=>window.__simantabSb;
 const isOperator=()=>['OPERATOR_KORWIL','OPERATOR_SMP'].includes(p().role);
 const ready=()=>isOperator()&&p().is_active===true&&p().approval_status==='APPROVED'&&sb()&&typeof window.showTab==='function';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=v=>new Intl.NumberFormat('id-ID').format(Number(v)||0);
 const dt=v=>v?new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}):'-';
 const tabIds=['dashboard','profile','operatorCuti','operatorKGB','operatorNotifications','operatorStatus'];
 const navs=[['dashboard','▦','Dashboard'],['profile','♙','Profil'],
             ['operatorCuti','🗓','Cuti'],['operatorKGB','💳','KGB'],
             ['operatorNotifications','🔔','Notifikasi'],['operatorStatus','⌛','Status Usulan']];
 let installed=false,rendering=false,scopeInfo=null,schoolCache=null,historyCache=null;
 const titleFor=id=>navs.find(r=>r[0]===id)?.[2]||'Operator Institusi';
 function navHTML(){
  return '<div class="navhead">Operator Institusi</div>'+
   navs.map(n=>'<button class="navbtn" data-tab="'+n[0]+'" onclick="showTab(\''+n[0]+'\')"><span class="ico">'+n[1]+'</span>'+n[2]+'</button>').join('');
 }
 function ensureShell(){
  if(!isOperator())return;
  const nav=$('nav');
  if(nav && (nav.querySelectorAll('.navbtn').length!==6 ||
      !nav.querySelector('[data-tab="operatorCuti"]')))nav.innerHTML=navHTML();
  const content=document.querySelector('main.content');
  if(content){
   const titles={
    operatorCuti:['Cuti','Administrasi cuti GTK pada sekolah dalam penugasan institusi.'],
    operatorKGB:['KGB','Administrasi Kenaikan Gaji Berkala GTK pada sekolah dalam penugasan institusi.'],
    operatorNotifications:['Notifikasi','Pemberitahuan yang ditujukan khusus kepada akun operator ini.'],
    operatorStatus:['Status Usulan','Pemantauan status usulan Cuti dan KGB dalam cakupan institusi.']
   };
   for(const [id,definition] of Object.entries(titles)){
    if($(id))continue;
    const section=document.createElement('section');section.id=id;section.className='section';
    section.innerHTML='<div class="head"><div><h2>'+definition[0]+'</h2><p>'+definition[1]+'</p></div></div><div id="'+id+'Body"></div>';
    const footer=content.querySelector('.footer');
    footer?content.insertBefore(section,footer):content.appendChild(section);
   }
  }
  if($('roleChip'))$('roleChip').textContent=p().role==='OPERATOR_KORWIL'?'Operator Korwil':'Operator SMP';
  if($('userUnit'))$('userUnit').textContent=p().unit||'Operator Institusi';
 }
 async function overview(){
  if(scopeInfo)return scopeInfo;
  const {data,error}=await sb().rpc('operator_institution_overview');
  if(error)throw error;
  if(!Array.isArray(data)||data.length!==1)throw new Error('Penugasan operator belum aktif atau belum terverifikasi.');
  const x=data[0];
  if((x.operator_type==='KORWIL') !== (p().role==='OPERATOR_KORWIL'))
   throw new Error('Jenis institusi tidak sesuai dengan hak akses akun.');
  scopeInfo=x;return x;
 }
 async function schoolRows(){
  const x=await overview();
  if(schoolCache)return schoolCache;
  const {data,error}=await sb().from('school_master')
   .select('npsn,school_name,bentuk_pendidikan,jenjang,kecamatan,school_status')
   .eq('is_active',true).order('school_name').limit(1000);
  if(error)throw error;
  const rows=data||[];
  if(rows.length!==Number(x.school_count))throw new Error('Cakupan sekolah berbeda dengan izin server. Akses data ditahan.');
  schoolCache=rows;return rows;
 }
 async function statuses(){
  if(historyCache)return historyCache;
  const {data,error}=await sb().rpc('operator_service_status');
  if(error)throw error;
  const rows=Array.isArray(data)?data:[];
  if(rows.some(x=>!['CUTI','KGB'].includes(x.service_type)))
   throw new Error('Jenis layanan di luar kewenangan operator ditemukan; data tidak ditampilkan.');
  historyCache=rows;return rows;
 }
 function statusTable(rows){
  return '<div class="tablewrap"><table><thead><tr>'+
   '<th>Tanggal</th><th>Pengusul</th><th>Sekolah</th><th>Layanan</th><th>Status</th>'+
   '</tr></thead><tbody>'+
   (rows.length?rows.map(x=>'<tr><td>'+esc(dt(x.submitted_at))+'</td><td>'+esc(x.requester_name)+'</td><td>'+
      esc(x.school_name)+'<div class="small">NPSN '+esc(x.school_npsn)+'</div></td><td>'+esc(x.service_type)+'</td><td><b>'+
      esc(x.status)+'</b><div class="small">'+esc(x.workflow_state)+'</div></td></tr>').join(''):
    '<tr><td colspan="5">Belum ada usulan Cuti/KGB yang tercatat dalam cakupan institusi ini.</td></tr>')+
   '</tbody></table></div>';
 }
 async function dashboard(){
  const body=$('dashboardBody');if(!body)return;
  if($('dashTitle'))$('dashTitle').textContent='Dashboard Operator Institusi';
  if($('dashDesc'))$('dashDesc').textContent='Layanan Cuti dan KGB sesuai penugasan Korwil atau SMP Negeri.';
  body.innerHTML='<div class="card">Memuat dashboard operator...</div>';
  try{
   const x=await overview(),unit=x.operator_type==='KORWIL'?'Kecamatan '+x.district:'NPSN '+x.school_npsn;
   const rows=await statuses(),onProcess=rows.filter(a=>!['COMPLETED','REJECTED'].includes(a.status)).length;
   body.innerHTML='<div class="grid"><div class="card s12" style="background:linear-gradient(125deg,#0f3f76,#1767b3);color:white">'+
    '<div class="small" style="color:#dbeafe">SIMANTAB-ONLINE • OPERATOR INSTITUSI</div>'+
    '<h2 style="margin:7px 0">'+esc(x.institution_name)+'</h2><p style="margin:0">'+esc(unit)+
    ' • Pengelolaan administrasi terbatas; tanpa hak persetujuan Dinas.</p></div>'+
    '<div class="card s4"><div class="label">Sekolah dalam Cakupan</div><div class="metric">'+fmt(x.school_count)+'</div></div>'+
    '<div class="card s4"><div class="label">Usulan Cuti/KGB</div><div class="metric">'+fmt(rows.length)+'</div></div>'+
    '<div class="card s4"><div class="label">Usulan Masih Diproses</div><div class="metric">'+fmt(onProcess)+'</div></div>'+
    '<div class="card s12"><h3 style="margin-top:0">Layanan Utama</h3>'+
    '<div class="quick"><button data-operator-link="operatorCuti">🗓️<b>Cuti</b><span>Administrasi cuti</span></button>'+
    '<button data-operator-link="operatorKGB">💳<b>KGB</b><span>Kenaikan gaji berkala</span></button>'+
    '<button data-operator-link="operatorStatus">⌛<b>Status Usulan</b><span>Pantau proses</span></button>'+
    '<button data-operator-link="operatorNotifications">🔔<b>Notifikasi</b><span>Pemberitahuan akun</span></button></div></div></div>';
   body.querySelectorAll('[data-operator-link]').forEach(b=>b.addEventListener('click',()=>window.showTab(b.dataset.operatorLink)));
  }catch(e){body.innerHTML='<div class="card err">Dashboard belum dapat dibuka: '+esc(e?.message||e)+'</div>'}
 }
 function profileInfo(){
  const body=$('profileBody');if(!body)return;
  body.innerHTML='<div class="grid"><div class="card s6"><div class="label">Institusi</div><h3>'+esc(p().full_name)+'</h3>'+
   '<p class="small">'+esc(p().unit)+'</p></div><div class="card s6"><div class="label">Username Institusi</div>'+
   '<h3>'+esc(p().username)+'</h3><p class="small">'+esc(titleFor('profile'))+' • '+esc(p().role)+'</p></div>'+
   '<div class="card s12"><div class="info">Identitas institusi dan username ditetapkan oleh Super Admin. Perubahan akun dilakukan melalui pengelolaan institusi; bukan dari halaman profil operator.</div></div></div>';
 }
 async function service(kind){
  const id=kind==='CUTI'?'operatorCuti':'operatorKGB',root=$(id+'Body');if(!root)return;
  root.innerHTML='<div class="card">Memeriksa cakupan layanan '+esc(kind)+'...</div>';
  try{
   const x=await overview(),schools=await schoolRows(),history=(await statuses()).filter(v=>v.service_type===kind);
   root.innerHTML='<div class="card" style="margin-bottom:12px"><b>Pelayanan '+(kind==='CUTI'?'Cuti':'Kenaikan Gaji Berkala (KGB)')+'</b>'+
    '<p class="small">Institusi: '+esc(x.institution_name)+'. Sekolah dalam kewenangan akun: '+fmt(schools.length)+'.</p>'+
    '<div class="field"><label>Daftar sekolah terverifikasi (baca saja)</label><select id="'+id+'School">'+
    schools.map(x=>'<option value="'+esc(x.npsn)+'">'+esc(x.school_name)+' — '+esc(x.npsn)+'</option>').join('')+
    '</select></div><div class="notice">Pembuatan usulan baru oleh Operator Institusi belum dibuka. Pengajuan atas nama GTK harus melalui proses delegasi, validasi dokumen, dan verifikasi server terlebih dahulu. Tidak ada usulan yang dikirim dari halaman ini.</div></div>'+
    '<div class="card"><h3 style="margin-top:0">Status '+esc(kind)+' di Wilayah Institusi</h3>'+statusTable(history)+'</div>';
  }catch(e){root.innerHTML='<div class="card err">Layanan '+esc(kind)+' belum dapat dibuka: '+esc(e?.message||e)+'</div>'}
 }
 async function status(){
  const root=$('operatorStatusBody');if(!root)return;
  root.innerHTML='<div class="card">Memuat Status Usulan...</div>';
  try{
   const rows=await statuses();
   root.innerHTML='<div class="card"><h3 style="margin-top:0">Status Cuti dan KGB</h3>'+
    '<p class="small">Hanya data yang ditetapkan server sebagai kewenangan institusi ini. Tanpa hak verifikasi, perubahan status, atau unduh dokumen rahasia.</p>'+
    statusTable(rows)+'</div>';
  }catch(e){root.innerHTML='<div class="card err">Status usulan tidak dapat ditampilkan: '+esc(e?.message||e)+'</div>'}
 }
 async function notifications(){
  const root=$('operatorNotificationsBody');if(!root)return;
  root.innerHTML='<div class="card">Memuat notifikasi...</div>';
  try{
   const {data,error}=await sb().from('notifications')
    .select('id,title,message,is_read,created_at').eq('user_id',p().id)
    .order('created_at',{ascending:false}).limit(100);
   if(error)throw error;
   const rows=data||[];
   root.innerHTML=rows.length?rows.map(x=>'<div class="card" style="margin-bottom:10px;opacity:'+
    (x.is_read?'.72':'1')+'"><b>'+esc(x.title)+'</b><div class="small" style="margin:7px 0">'+esc(x.message)+'</div>'+
    '<div class="small">'+esc(dt(x.created_at))+(x.is_read?' • Dibaca':' • Baru')+'</div></div>').join(''):
    '<div class="card empty">Belum ada notifikasi yang ditujukan kepada akun institusi ini.</div>';
  }catch(e){root.innerHTML='<div class="card err">Notifikasi tidak dapat dibaca: '+esc(e?.message||e)+'</div>'}
 }
 async function draw(id){
  if(id==='dashboard')return dashboard();
  if(id==='profile')return profileInfo();
  if(id==='operatorCuti')return service('CUTI');
  if(id==='operatorKGB')return service('KGB');
  if(id==='operatorNotifications')return notifications();
  if(id==='operatorStatus')return status();
 }
 function init(){
  if(!ready())return;
  ensureShell();
  if(installed)return;
  installed=true;
  const previous=window.showTab;
  window.showTab=async function(id,...args){
   if(!ready())return previous.call(this,id,...args);
   if(!tabIds.includes(id))id='dashboard';
   ensureShell();
   await previous.call(this,id,...args);
   await draw(id);
  };
  if($('dashboard')?.classList.contains('active'))dashboard();
 }
 window.addEventListener('simantab:profile-ready',init);
 for(const ms of [0,250,900,1800])setTimeout(init,ms);
 window.__simantabOperatorPortal={version:2,restrictedMenus:true,scopeRequired:true,readOnly:true,
  allowedMenus:tabIds,render:()=>{init();return dashboard();},reload:()=>{historyCache=null;schoolCache=null;scopeInfo=null;}};
})();