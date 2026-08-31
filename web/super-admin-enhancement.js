/* SIMANTAB_SUPER_ADMIN_COMMAND_CENTER_V1 */
(async()=>{
const w=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<100&&(!window.__simantabSb||!window.showTab);i++)await w(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),sa=()=>window.__simantabProfile?.role==='SUPER_ADMIN'&&window.__simantabProfile?.is_admin===true;
if(!sb)return;
function installRegistrationUi(){
 const apply=()=>{const nameWrap=$('nameWrap'),signup=!!nameWrap&&!nameWrap.classList.contains('hidden'),d=$('tabDinas'),g=$('tabGtk'),hint=document.querySelector('.loginbox .hint'),head=document.querySelector('.loginbox h2');if(!d||!g)return;if(signup){d.textContent='🏢 Daftar Akun Dinas';g.textContent='🏫 Daftar Akun Sekolah / GTK';if(head)head.textContent='Daftar Akun SIMANTAB';if(hint)hint.innerHTML='<b>Pendaftaran dipisah:</b> pegawai Dinas memilih <b>Daftar Akun Dinas</b>; Kepala Sekolah/GTK memilih <b>Daftar Akun Sekolah / GTK</b>. Akun Dinas baru belum memiliki role operasional sampai ditetapkan oleh <b>Super Admin</b> melalui Kelola Pengguna.';}else{d.textContent='🏢 Login Dinas';g.textContent='🏫 Login Sekolah / GTK';if(head)head.textContent='Masuk SIMANTAB Online';if(hint)hint.innerHTML='<b>Jalur akun:</b> pegawai Dinas menggunakan Login Dinas; Kepala Sekolah/GTK menggunakan Login Sekolah / GTK. Untuk akun Dinas baru, daftar terlebih dahulu lalu Super Admin menetapkan role melalui Kelola Pengguna.';}};
 const oldToggle=window.toggleAuthMode;if(oldToggle&&!window.__simantabRegToggleWrapped){window.__simantabRegToggleWrapped=true;window.toggleAuthMode=()=>{oldToggle();setTimeout(apply,0)}}
 const oldChannel=window.setChannel;if(oldChannel&&!window.__simantabRegChannelWrapped){window.__simantabRegChannelWrapped=true;window.setChannel=c=>{oldChannel(c);setTimeout(apply,0)}}
 apply();
}
installRegistrationUi();
async function c(t,f){let q=sb.from(t).select('*',{count:'exact',head:true});if(f)q=f(q);let{count,error}=await q;if(error)throw error;return count||0}
async function m(){let [a,g]=await Promise.all([Promise.all([c('profiles'),c('school_master',q=>q.eq('is_active',true)),c('submissions'),c('submission_files'),c('field_activities'),c('activity_attendance_entries'),c('notifications'),c('supervision_cases'),c('submissions',q=>q.eq('service_type','PTK_BARU_SWASTA')),c('submissions',q=>q.eq('service_type','KP'))]),sb.rpc('super_admin_gtk_summary')]);if(g.error)throw g.error;let gtk=(g.data||[])[0]||{};return{profiles:a[0],schools:a[1],subs:a[2],files:a[3],activities:a[4],attendance:a[5],notifications:a[6],cases:a[7],ptk:a[8],kp:a[9],gtk}}
async function svc(){if(!sa())return;let b=$('servicesBody');if(!b)return;b.querySelector('[data-sa]')?.remove();try{let x=await m(),d=document.createElement('div');d.className='card';d.dataset.sa='1';d.style.marginBottom='12px';d.innerHTML=`<h3 style="margin-top:0">Ringkasan Super Admin</h3><div class="grid"><div class="s3"><div class="label">Usulan</div><div class="metric">${x.subs}</div></div><div class="s3"><div class="label">Dokumen</div><div class="metric">${x.files}</div></div><div class="s3"><div class="label">PTK Baru</div><div class="metric">${x.ptk}</div></div><div class="s3"><div class="label">KP</div><div class="metric">${x.kp}</div></div></div><div class="info" style="margin-top:10px">Dashboard utama Super Admin menggunakan infografis pimpinan. Halaman ini khusus ringkasan antrean layanan dan akses teknis tetap tersedia melalui menu Administrasi.</div>`;b.prepend(d)}catch(e){console.error(e)}}
const old=window.showTab;window.showTab=async id=>{await old(id);await w(40);if(id==='services')await svc()};
for(let i=0;i<60&&!window.__simantabProfile;i++)await w(100);
if(sa()&&document.querySelector('.section.active')?.id==='services')await svc();
})();
