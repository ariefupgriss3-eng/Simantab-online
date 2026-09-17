/* SIMANTAB_SUPER_ADMIN_COMMAND_CENTER_V2 */
(async()=>{
const w=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<100&&(!window.__simantabSb||!window.showTab);i++)await w(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),sa=()=>window.__simantabProfile?.role==='SUPER_ADMIN';if(!sb)return;
function installRegistrationUi(){
 const apply=()=>{const n=$('nameWrap'),signup=!!n&&!n.classList.contains('hidden'),d=$('tabDinas'),g=$('tabGtk'),hint=document.querySelector('.loginbox>.hint'),head=document.querySelector('.loginbox h2');if(!d||!g)return;if(signup){d.textContent='🏢 Akun Dinas oleh Admin';g.textContent='🏫 Daftar Sekolah / GTK / Pengawas';if(head)head.textContent='Daftar Akun SIMANTAB';if(hint)hint.innerHTML='<b>Pendaftaran mandiri:</b> Kepala Sekolah, GTK, dan Pengawas melalui kanal Sekolah/GTK/Pengawas. Kepala Sekolah wajib mengisi NPSN; KS dan Pengawas menunggu persetujuan Super Admin. Akun Dinas dibuat oleh Admin SIMANTAB.';}else{d.textContent='🏢 Login Dinas';g.textContent='🏫 Login Sekolah / GTK / Pengawas';if(head)head.textContent='Masuk SIMANTAB Online';if(hint)hint.innerHTML='<b>Jalur login:</b> akun Dinas menggunakan Login Dinas. Kepala Sekolah, GTK, dan Pengawas menggunakan Login Sekolah / GTK / Pengawas.';}};
 const t=window.toggleAuthMode;if(t&&!window.__simantabRegToggleWrapped){window.__simantabRegToggleWrapped=true;window.toggleAuthMode=()=>{t();setTimeout(apply,0)}}
 const c=window.setChannel;if(c&&!window.__simantabRegChannelWrapped){window.__simantabRegChannelWrapped=true;window.setChannel=x=>{c(x);setTimeout(apply,0)}}apply();
}
installRegistrationUi();
async function c(t,f){let q=sb.from(t).select('*',{count:'exact',head:true});if(f)q=f(q);let{count,error}=await q;if(error)throw error;return count||0}
async function m(){let[a,g]=await Promise.all([Promise.all([c('profiles'),c('school_master',q=>q.eq('is_active',true)),c('submissions'),c('submission_files'),c('field_activities'),c('activity_attendance_entries'),c('notifications'),c('supervision_cases'),c('submissions',q=>q.eq('service_type','PTK_BARU_SWASTA')),c('submissions',q=>q.eq('service_type','KP'))]),sb.rpc('super_admin_gtk_summary')]);if(g.error)throw g.error;let gtk=(g.data||[])[0]||{};return{profiles:a[0],schools:a[1],subs:a[2],files:a[3],activities:a[4],attendance:a[5],notifications:a[6],cases:a[7],ptk:a[8],kp:a[9],gtk}}
async function svc(){if(!sa())return;let b=$('servicesBody');if(!b)return;b.querySelector('[data-sa]')?.remove();try{let x=await m(),d=document.createElement('div');d.className='card';d.dataset.sa='1';d.style.marginBottom='12px';d.innerHTML=`<h3 style="margin-top:0">Ringkasan Super Admin</h3><div class="grid"><div class="s3"><div class="label">Usulan</div><div class="metric">${x.subs}</div></div><div class="s3"><div class="label">Dokumen</div><div class="metric">${x.files}</div></div><div class="s3"><div class="label">PTK Baru</div><div class="metric">${x.ptk}</div></div><div class="s3"><div class="label">KP</div><div class="metric">${x.kp}</div></div></div><div class="info" style="margin-top:10px">Persetujuan akun Kepala Sekolah/Pengawas tersedia pada menu Kelola Pengguna.</div>`;b.prepend(d)}catch(e){console.error(e)}}

function installPasswordResetActions(){
 if(!sa())return;const body=$('usersBody');if(!body)return;
 body.querySelectorAll('tbody tr').forEach(tr=>{
  const save=[...tr.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('saveUser('));if(!save)return;
  const match=(save.getAttribute('onclick')||'').match(/saveUser\('([^']+)'\)/);if(!match)return;
  const id=match[1],cell=save.closest('td');if(!cell||cell.querySelector(`[data-reset-password="${id}"]`))return;
  const name=(tr.querySelector('td')?.textContent||'pengguna').replace(/\s+/g,' ').trim();
  const btn=document.createElement('button');btn.className='btn soft';btn.style.marginLeft='6px';btn.dataset.resetPassword=id;btn.textContent='🔐 Reset Password';btn.onclick=()=>window.simantabAdminSendPasswordReset(id,name);cell.appendChild(btn);
 });
}
window.simantabAdminSendPasswordReset=async(id,name)=>{
 if(!sa())return alert('Hanya Super Admin.');
 if(!confirm(`Kirim tautan reset password untuk ${name}?\n\nPengguna akan menerima email dan wajib membuat password baru.`))return;
 try{
  const {data:{session}}=await sb.auth.getSession();
  const {data,error}=await sb.functions.invoke('simantab-admin-send-password-reset',{body:{user_id:id},headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}});
  if(error||data?.error){let detail=data?.error||'';try{detail=detail||(await error?.context?.clone?.().json())?.error||''}catch(_){}throw new Error(detail||error?.message||'Gagal mengirim reset password.');}
  alert(`Tautan reset password berhasil dikirim.\n\nNama: ${data.full_name||name}\nEmail: ${data.email}\n\nPassword tidak ditampilkan kepada Super Admin.`);
 }catch(e){alert(e?.message||'Gagal mengirim reset password.')}
};
const usersBody=$('usersBody');if(usersBody&&!window.__simantabResetPasswordObserver){window.__simantabResetPasswordObserver=true;new MutationObserver(()=>installPasswordResetActions()).observe(usersBody,{childList:true})}

const old=window.showTab;window.showTab=async id=>{await old(id);await w(40);if(id==='services')await svc();if(id==='users')installPasswordResetActions()};for(let i=0;i<60&&!window.__simantabProfile;i++)await w(100);if(sa()&&document.querySelector('.section.active')?.id==='services')await svc();if(sa()&&document.querySelector('.section.active')?.id==='users')installPasswordResetActions();
})();
