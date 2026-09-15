/* SIMANTAB_LEGACY_SHELL_RESTORE_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),profile=()=>window.__simantabProfile||{};
if(!sb||!window.showTab)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
const DINAS_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN','STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN','STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK','PENGAWAS']);
const isDinas=()=>DINAS_ROLES.has(profile().role);
const isSchoolSide=()=>['GTK','KEPALA_SEKOLAH'].includes(profile().role);
const isAdmin=()=>profile().role==='SUPER_ADMIN'||profile().is_admin===true;

function mainEl(){return document.querySelector('main.content')}
function ensureSection(id,title,desc,bodyId){
 if($(id))return;
 const main=mainEl();if(!main)return;
 const sec=document.createElement('section');sec.id=id;sec.className='section';
 sec.innerHTML=`<div class="head"><div><h2>${title}</h2><p>${desc}</p></div></div><div id="${bodyId}"></div>`;
 const footer=main.querySelector('.footer');if(footer)main.insertBefore(sec,footer);else main.appendChild(sec);
}
function ensureSections(){
 ensureSection('activities','Kegiatan Bidang','Undangan, daftar hadir, berita acara, laporan, dan dokumentasi kegiatan bidang.','activitiesBody');
 ensureSection('attendance','Daftar Hadir Kegiatan','Daftar hadir dan tanda tangan kegiatan melalui akun GTK/Sekolah.','attendanceBody');
 ensureSection('schoolMaster','Master Sekolah Dapodik','Database satuan pendidikan Kabupaten Batang yang tersimpan pada SIMANTAB.','schoolMasterBody');
 ensureSection('team','Tim Kerja Bidang Ketenagaan','Pembagian tugas dan penanggung jawab layanan SIMANTAB.','teamBody');
 ensureSection('adminData','Pusat Kelola Data Admin','Validasi data operasional SIMANTAB. Pada Preview, fungsi penghapusan dinonaktifkan.','adminDataBody');
}
function navButton(id,icon,label){const b=document.createElement('button');b.className='navbtn';b.dataset.tab=id;b.setAttribute('onclick',`showTab('${id}')`);b.innerHTML=`<span class="ico">${icon}</span>${label}`;return b}
function navHead(text){const d=document.createElement('div');d.className='navhead';d.textContent=text;return d}
function ensureNav(){
 const nav=$('nav');if(!nav||!profile().role)return;
 if(isDinas()){
  if(!nav.querySelector('[data-tab="activities"]')){const dash=nav.querySelector('[data-tab="dashboard"]');dash?.after(navButton('activities','📅','Kegiatan Bidang'))}
  if(!nav.querySelector('[data-tab="schoolMaster"]')){const dist=nav.querySelector('[data-tab="distribution"]');if(dist)dist.before(navButton('schoolMaster','🏫','Master Sekolah Dapodik'))}
  if(!nav.querySelector('[data-tab="team"]')){
   const adminBtn=nav.querySelector('[data-tab="users"]'),promotion=nav.querySelector('[data-tab="promotion"]');
   const anchor=adminBtn?.previousElementSibling?.classList?.contains('navhead')?adminBtn.previousElementSibling:(promotion?.previousElementSibling?.classList?.contains('navhead')?promotion.previousElementSibling:null);
   const h=navHead('Tim Kerja'),b=navButton('team','👥','Tim Ketenagaan');
   if(anchor){nav.insertBefore(h,anchor);nav.insertBefore(b,anchor)}else{nav.append(h,b)}
  }
  if(isAdmin()&&!nav.querySelector('[data-tab="adminData"]')){const users=nav.querySelector('[data-tab="users"]');if(users)users.after(navButton('adminData','🛠','Kelola Seluruh Data'))}
 }else if(isSchoolSide()&&!nav.querySelector('[data-tab="attendance"]')){
  const dash=nav.querySelector('[data-tab="dashboard"]');dash?.after(navButton('attendance','✍️','Daftar Hadir Kegiatan'));
 }
}

const TEAM=[
 ['Kabid Ketenagaan','M. Arief Rohman','Koordinator Bidang Ketenagaan'],
 ['Kasi PPTK SD','Agus Arfianto','Layanan dan pembinaan PTK SD'],
 ['Kasi PPTK SMP','Elok Faiqoh','Layanan dan pembinaan PTK SMP'],
 ['Subkoor PPTK TK/PAUD','Condro','TK/PAUD/Kesetaraan\nUsul Tugas Belajar'],
 ['Staf TPG/Tamsil','Sucipto','TPG dan Tamsil'],
 ['Staf Gaji Berkala','Rina','Kenaikan Gaji Berkala'],
 ['Staf KP dan E-Kin','Kasim • Afif','Kenaikan Pangkat dan E-Kin'],
 ['Staf Promosi KSPSTK','Kasim','Promosi Karir KSPSTK'],
 ['Staf Arsip','Mamik','Arsip dan persuratan bidang'],
 ['Staf SKP, Pensiun/Berhenti','Wartono','SKP serta pensiun/berhenti'],
 ['Staf Izin Cuti','Danny','Layanan izin cuti'],
 ['Staf Simtendik','Icha','Pengelolaan Simtendik'],
 ['Staf Penerbitan SK','Prabowo','Usul Penerbitan SK • MC'],
 ['Usul PTK Baru Swasta','Kasi PPTK SD/SMP • Subkoor TK/PAUD','Verifikasi sesuai jenjang satuan pendidikan']
];
function renderTeam(){const body=$('teamBody');if(!body)return;body.innerHTML=`<div class="servicegrid">${TEAM.map(x=>`<div class="service"><div class="small">${esc(x[0])}</div><h3>${esc(x[1])}</h3><p style="white-space:pre-line">${esc(x[2])}</p></div>`).join('')}</div>`}

async function loadActivities(){
 const body=$('activitiesBody');if(!body)return;
 body.innerHTML='<div class="card"><div class="small">Memuat Kegiatan Bidang…</div></div>';
 const {data,error}=await sb.from('field_activities').select('id,activity_name,activity_date,activity_time,place,document_number,speakers,updated_at').order('activity_date',{ascending:false}).limit(100);
 if(error){body.innerHTML=`<div class="card err">${esc(error.message)}</div>`;return}
 const rows=data||[];
 body.innerHTML=`<div class="card" style="margin-bottom:12px"><div class="info"><b>Struktur Kegiatan Bidang berhasil dipulihkan.</b> Preview ini memakai database hasil restorasi saat ini. Untuk mencegah perubahan tidak sengaja saat validasi struktur, aksi simpan/hapus belum diaktifkan pada lapisan kompatibilitas ini.</div></div><div class="card"><h3 style="margin-top:0">Daftar Kegiatan</h3>${rows.length?`<div class="tablewrap"><table><thead><tr><th>Tanggal</th><th>Kegiatan</th><th>Tempat</th><th>Nomor</th><th>Narasumber</th><th>Update</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${esc(a.activity_date||'-')}<br><span class="small">${esc(a.activity_time||'')}</span></td><td><b>${esc(a.activity_name)}</b></td><td>${esc(a.place||'-')}</td><td>${esc(a.document_number||'-')}</td><td>${esc((a.speakers||[]).join(', ')||'-')}</td><td>${fmt(a.updated_at)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Belum ada kegiatan.</div>'}</div>`;
}
async function loadAttendance(){
 const body=$('attendanceBody');if(!body)return;
 const {data,error}=await sb.from('activity_attendance_entries').select('full_name,nip,work_unit,position,signed_at,updated_at').order('updated_at',{ascending:false}).limit(50);
 if(error){body.innerHTML=`<div class="card"><div class="info">Daftar Hadir Kegiatan sudah kembali pada struktur menu.</div><div class="small" style="margin-top:8px">${esc(error.message)}</div></div>`;return}
 const rows=data||[];body.innerHTML=`<div class="card"><div class="info"><b>Daftar Hadir Kegiatan aktif kembali.</b> Tanda tangan kegiatan tetap mengikuti tautan presensi yang dibuka panitia.</div>${rows.length?`<div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>Nama</th><th>NIP</th><th>Unit</th><th>Jabatan</th><th>Waktu</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.nip||'-')}</td><td>${esc(x.work_unit||'-')}</td><td>${esc(x.position||'-')}</td><td>${fmt(x.signed_at||x.updated_at)}</td></tr>`).join('')}</tbody></table></div>`:''}</div>`;
}
async function loadSchoolMaster(){
 const body=$('schoolMasterBody');if(!body)return;body.innerHTML='<div class="card"><div class="small">Memuat Master Sekolah…</div></div>';
 const {data,error}=await sb.from('school_master').select('npsn,school_name,bentuk_pendidikan,jenjang,school_status,kecamatan,students,rombel,teachers,staff,status_sinkron,source_synced_at').eq('is_active',true).order('school_name').limit(1200);
 if(error){body.innerHTML=`<div class="card err">${esc(error.message)}</div>`;return}
 const rows=data||[],form=x=>String(x.bentuk_pendidikan||x.jenjang||'').toUpperCase(),count=l=>rows.filter(x=>form(x)===l).length;
 body.innerHTML=`<div class="grid" style="margin-bottom:12px"><div class="card s3"><div class="label">Total Sekolah</div><div class="metric">${rows.length}</div></div><div class="card s3"><div class="label">TK</div><div class="metric">${count('TK')}</div></div><div class="card s3"><div class="label">SD</div><div class="metric">${count('SD')}</div></div><div class="card s3"><div class="label">SMP</div><div class="metric">${count('SMP')}</div></div></div><div class="card"><div class="info" style="margin-bottom:10px">Master Sekolah Dapodik dipulihkan dalam mode baca untuk validasi Preview.</div><div class="tablewrap"><table><thead><tr><th>NPSN</th><th>Sekolah</th><th>Jenjang</th><th>Status</th><th>Kecamatan</th><th>PD</th><th>Rombel</th><th>Guru</th><th>Tendik</th><th>Sinkron</th></tr></thead><tbody>${rows.slice(0,500).map(r=>`<tr><td>${esc(r.npsn)}</td><td><b>${esc(r.school_name)}</b></td><td>${esc(form(r)||'-')}</td><td>${esc(r.school_status||'-')}</td><td>${esc(r.kecamatan||'-')}</td><td>${Number(r.students)||0}</td><td>${Number(r.rombel)||0}</td><td>${Number(r.teachers)||0}</td><td>${Number(r.staff)||0}</td><td>${esc(r.status_sinkron||'-')}</td></tr>`).join('')}</tbody></table></div></div>`;
}
async function loadAdminData(){
 const body=$('adminDataBody');if(!body||!isAdmin())return;
 const tables=[['submissions','Usulan Layanan'],['submission_events','Riwayat Status'],['submission_files','Metadata Berkas'],['notifications','Notifikasi'],['supervision_cases','Promosi/Disiplin'],['activity_attendance_entries','Daftar Hadir']];
 const cards=[];for(const [table,label] of tables){try{const {count,error}=await sb.from(table).select('*',{count:'exact',head:true});cards.push([label,error?'—':count||0,error?.message||''])}catch(e){cards.push([label,'—',String(e?.message||e)])}}
 body.innerHTML=`<div class="card" style="margin-bottom:12px"><div class="notice"><b>Mode Preview aman:</b> Pusat Kelola Data dipulihkan untuk pemeriksaan struktur, tetapi tombol revisi/hapus sengaja belum diaktifkan karena Preview memakai database restorasi yang sama dengan Production.</div></div><div class="grid">${cards.map(x=>`<div class="card s4"><div class="label">${esc(x[0])}</div><div class="metric">${esc(x[1])}</div>${x[2]?`<div class="small">${esc(x[2])}</div>`:''}</div>`).join('')}</div>`;
}

ensureSections();ensureNav();renderTeam();
const nav=$('nav');if(nav){let busy=false;new MutationObserver(()=>{if(busy)return;busy=true;queueMicrotask(()=>{ensureNav();busy=false})}).observe(nav,{childList:true})}
const priorShow=window.showTab;
window.showTab=async id=>{ensureSections();ensureNav();await priorShow(id);if(id==='activities')await loadActivities();if(id==='attendance')await loadAttendance();if(id==='schoolMaster')await loadSchoolMaster();if(id==='team')renderTeam();if(id==='adminData')await loadAdminData()};
window.__simantabLegacyShell={version:1,restored:['activities','attendance','schoolMaster','team','adminData'],previewReadOnly:true};
})();