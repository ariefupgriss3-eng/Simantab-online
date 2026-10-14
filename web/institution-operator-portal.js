/* SIMANTAB_INSTITUTION_OPERATOR_PORTAL_V1_SCOPED_READONLY */
(()=>{
 const $=id=>document.getElementById(id);
 const profile=()=>window.__simantabProfile||{};
 const isOperator=()=>['OPERATOR_KORWIL','OPERATOR_SMP'].includes(profile().role);
 const ready=()=>isOperator()&&profile().is_active===true&&profile().approval_status==='APPROVED'
   &&window.__simantabSb&&typeof window.showTab==='function';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=v=>new Intl.NumberFormat('id-ID').format(Number(v)||0);
 const txt=v=>String(v||'').replaceAll('_',' ');
 let wrapped=false,loadingDash=false,loadingNeeds=false,lastScope=null;
 function instituteNav(){
  const nav=$('nav');if(!nav)return;
  if(!nav.querySelector('[data-tab="operatorNeeds"]')){
   nav.innerHTML='<div class="navhead">Operator Institusi</div>'+
     '<button class="navbtn" data-tab="dashboard" onclick="showTab(\'dashboard\')"><span class="ico">▦</span>Dashboard Institusi</button>'+
     '<button class="navbtn" data-tab="operatorNeeds" onclick="showTab(\'operatorNeeds\')"><span class="ico">◎</span>Kebutuhan GTK (Baca)</button>'+
     '<button class="navbtn" data-tab="profile" onclick="showTab(\'profile\')"><span class="ico">♙</span>Profil Institusi</button>';
  }
  const main=document.querySelector('main.content');
  if(main&&!$('operatorNeeds')){
   const node=document.createElement('section');
   node.id='operatorNeeds';node.className='section';
   node.innerHTML='<div class="head"><div><h2>Kebutuhan GTK Riil • Baca Saja</h2><p>Hanya sekolah negeri dalam cakupan akun institusi.</p></div></div><div id="operatorNeedsBody"></div>';
   const footer=main.querySelector('.footer');footer?main.insertBefore(node,footer):main.append(node);
  }
  const chip=$('roleChip');
  if(chip)chip.textContent=profile().role==='OPERATOR_KORWIL'?'Operator Korwil':'Operator SMP Negeri';
  const userUnit=$('userUnit');if(userUnit)userUnit.textContent=profile().unit||'Operator Institusi';
 }
 async function overview(){
  const {data,error}=await window.__simantabSb.rpc('operator_institution_overview');
  if(error)throw error;
  if(!Array.isArray(data)||data.length!==1)throw new Error('Akun institusi belum diaktifkan atau batas wilayah tidak terverifikasi.');
  const x=data[0];
  if((x.operator_type==='KORWIL')!==(profile().role==='OPERATOR_KORWIL'))
   throw new Error('Jenis penugasan institusi tidak cocok dengan profil.');
  lastScope=x;return x;
 }
 async function dashboard(){
  if(!ready()||loadingDash)return;
  const body=$('dashboardBody');if(!body)return;
  loadingDash=true;
  const head=$('dashTitle');if(head)head.textContent='Dashboard Operator Institusi';
  const desc=$('dashDesc');if(desc)desc.textContent='Informasi institusi dan kebutuhan GTK berdasarkan akses terverifikasi; tanpa fungsi persetujuan.';
  body.innerHTML='<div class="card">Memuat data operator institusi...</div>';
  try{
   const x=await overview();
   const unit=x.operator_type==='KORWIL'?'Korwil Kecamatan '+x.district:'SMP Negeri • NPSN '+x.school_npsn;
   body.innerHTML='<div class="grid">'+
    '<div class="card s12" style="background:linear-gradient(125deg,#0f3f76,#1767b3);color:white">'+
    '<div class="small" style="color:#dbeafe">SIMANTAB ONLINE • OPERATOR INSTITUSI</div>'+
    '<h2 style="margin:7px 0">'+esc(x.institution_name)+'</h2>'+
    '<p style="margin:0">Cakupan '+esc(unit)+'. Tidak memiliki hak verifikasi atau persetujuan Dinas.</p></div>'+
    '<div class="card s4"><div class="label">Satuan Pendidikan dalam Cakupan</div><div class="metric">'+fmt(x.school_count)+'</div></div>'+
    '<div class="card s4"><div class="label">Entri Kebutuhan GTK Negeri</div><div class="metric">'+fmt(x.gtk_need_rows)+'</div></div>'+
    '<div class="card s4"><div class="label">Akses</div><h3>Terbatas • Baca Saja</h3></div>'+
    '<div class="card s12"><p>Data sekolah dan kebutuhan GTK dibatasi oleh NPSN/kecamatan di server, bukan hanya pada menu layar.</p>'+
    '<button type="button" id="operatorOpenNeeds" class="btn soft">Lihat Kebutuhan GTK</button></div></div>';
   $('operatorOpenNeeds')?.addEventListener('click',()=>window.showTab('operatorNeeds'));
  }catch(e){body.innerHTML='<div class="card err">Dashboard operator tidak dapat dibuka: '+esc(e?.message||e)+'</div>'}
  finally{loadingDash=false}
 }
 async function needs(){
  if(!ready()||loadingNeeds)return;
  const root=$('operatorNeedsBody');if(!root)return;
  loadingNeeds=true;root.innerHTML='<div class="card">Memuat data kebutuhan GTK dalam cakupan institusi...</div>';
  try{
   const x=lastScope||await overview();
   const [schools,needRows]=await Promise.all([
    window.__simantabSb.from('school_master')
      .select('npsn,school_name,school_status,bentuk_pendidikan,jenjang,kecamatan')
      .eq('is_active',true).order('school_name').limit(1200),
    window.__simantabSb.from('school_gtk_needs')
      .select('school_npsn,school_name,position_name,abk,asn_total,gap_riil')
      .order('school_npsn').limit(3000)
   ]);
   if(schools.error)throw schools.error;if(needRows.error)throw needRows.error;
   const masters=schools.data||[],entries=needRows.data||[],names=new Map(masters.map(s=>[s.npsn,s.school_name]));
   if(masters.length!==Number(x.school_count))throw new Error('Perbedaan jumlah sekolah terhadap cakupan server. Akses ditahan.');
   root.innerHTML='<div class="card" style="margin-bottom:12px"><b>'+esc(x.institution_name)+'</b><p class="small">Jumlah sekolah dalam cakupan '+fmt(masters.length)+
    '. Hanya sekolah negeri memiliki data Kebutuhan GTK Riil dalam layanan ini. Data PNF yang belum tersedia di master tidak ditambahkan secara perkiraan.</p></div>'+
    '<div class="card"><h3 style="margin-top:0">Daftar Kebutuhan GTK • Baca Saja</h3>'+
    '<div class="tablewrap"><table><thead><tr><th>Sekolah</th><th>Jabatan/Mapel</th><th>ABK</th><th>ASN</th><th>Gap Riil</th></tr></thead><tbody>'+
    (entries.length?entries.map(r=>'<tr><td>'+esc(names.get(r.school_npsn)||r.school_name)+'<div class="small">NPSN '+esc(r.school_npsn)+'</div></td><td>'+esc(r.position_name)+'</td><td>'+fmt(r.abk)+'</td><td>'+fmt(r.asn_total)+'</td><td>'+fmt(r.gap_riil)+'</td></tr>').join(''):
    '<tr><td colspan="5">Belum ada entri kebutuhan GTK pada sekolah negeri dalam cakupan akun ini.</td></tr>')+
    '</tbody></table></div><p class="small">Tidak tersedia tombol Simpan, Ajukan, Ubah, Hapus, atau Verifikasi.</p></div>';
  }catch(e){root.innerHTML='<div class="card err">Data kebutuhan GTK tidak dapat ditampilkan: '+esc(e?.message||e)+'</div>'}
  finally{loadingNeeds=false}
 }
 function start(){
  if(!ready())return;
  instituteNav();
  if(wrapped)return;
  wrapped=true;
  const previous=window.showTab;
  window.showTab=async function(id,...args){
   if(!ready())return previous.call(this,id,...args);
   if(!['dashboard','operatorNeeds','profile'].includes(id))id='dashboard';
   instituteNav();
   const value=await previous.call(this,id,...args);
   if(id==='dashboard')await dashboard();
   if(id==='operatorNeeds')await needs();
   return value;
  };
  if($('dashboard')?.classList.contains('active'))dashboard();
 }
 window.addEventListener('simantab:profile-ready',start);
 for(const wait of [0,250,900,1800])setTimeout(start,wait);
 window.__simantabOperatorPortal={
   version:1,readOnly:true,requiresServerScope:true,restrictedMenus:true,
   render:()=>{start();return dashboard()},
   refreshNeeds:needs
 };
})();