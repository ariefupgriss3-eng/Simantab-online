/* SIMANTAB_SUPER_ADMIN_COMMAND_CENTER_V1 */
/* SIMANTAB_SUPER_ADMIN_PASSWORD_RESET_V2 */
/* SIMANTAB_SUPER_ADMIN_MISSING_DINAS_ACCOUNTS_V1 */
/* SIMANTAB_SUPER_ADMIN_NEW_DINAS_ACCOUNTS_V1 */
/* SIMANTAB_SUPER_ADMIN_NEW_WARTONO_ACCOUNT_V8 */
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


const MISSING_DINAS_ACCOUNTS=[
 {full_name:'Mamik',username:'mamik1234',role:'STAFF_ARSIP',position:'Staf Arsip/Persuratan'},
 {full_name:'Danny',username:'danny1234',role:'STAFF_CUTI',position:'Staf Izin Cuti'},
 {full_name:'Icha',username:'icha1234',role:'STAFF_SPJ_SIMTENDIK',position:'Staf SPJ & Simtendik'}
];
const NEW_DINAS_ACCOUNTS=[
 {full_name:'Imam Prabowo',username:'prabowo',role:'STAFF_USUL_SK',position:'Staf Usul SK'},
 {full_name:'Sucipto',username:'sucipto',role:'STAFF_TPG',position:'Staf TPG'},
 {full_name:'Rina Ratnawati',username:'rina',role:'STAFF_KGB',position:'Staf KGB'},
 {full_name:'Wartono',username:'wartono',role:'STAFF_PENSIUN',position:'Staf Pensiun/Berhenti'}
];
function makeTempPassword(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
 const bytes=new Uint32Array(10);crypto.getRandomValues(bytes);
 return 'Sm!'+[...bytes].map(x=>alphabet[x%alphabet.length]).join('');
}
function showDinasCredentials(rows){
 document.getElementById('simDinasCredentialsModal')?.remove();
 const modal=document.createElement('div');modal.id='simDinasCredentialsModal';
 modal.style.cssText='position:fixed;inset:0;z-index:10050;background:rgba(6,20,38,.62);display:flex;align-items:center;justify-content:center;padding:16px';
 const text=rows.map(x=>x.full_name+' | '+x.username+' | '+x.password).join('\n');
 modal.innerHTML=`<div style="width:min(720px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.3)"><div style="display:flex;justify-content:space-between;gap:12px"><div><div class="label">AKUN DINAS BARU</div><h3 style="margin:4px 0">Kredensial sementara</h3><div class="small">Simpan/serahkan secara aman. Setiap pengguna wajib mengganti password pada login pertama.</div></div><button class="btn soft" onclick="document.getElementById('simDinasCredentialsModal')?.remove()">✕</button></div><div style="margin-top:14px;overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Nama</th><th style="text-align:left">Username</th><th style="text-align:left">Password Sementara</th></tr></thead><tbody>${rows.map(x=>`<tr><td style="padding:8px 4px;border-top:1px solid #e5e7eb"><b>${x.full_name}</b><div class="small">${x.position}</div></td><td style="padding:8px 4px;border-top:1px solid #e5e7eb"><code>${x.username}</code></td><td style="padding:8px 4px;border-top:1px solid #e5e7eb"><code>${x.password}</code></td></tr>`).join('')}</tbody></table></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn" id="simCopyDinasCredentials">📋 Salin Semua</button><button class="btn soft" onclick="document.getElementById('simDinasCredentialsModal')?.remove()">Selesai</button></div></div>`;
 modal.onclick=e=>{if(e.target===modal)modal.remove()};document.body.appendChild(modal);
 document.getElementById('simCopyDinasCredentials').onclick=async()=>{try{await navigator.clipboard.writeText(text);alert('Username dan password sementara berhasil disalin.')}catch{alert(text)}};
}
async function installMissingDinasAccounts(){
 if(!sa())return;const body=$('usersBody');if(!body||body.querySelector('[data-missing-dinas-accounts]'))return;
 const card=document.createElement('div');card.className='card';card.dataset.missingDinasAccounts='1';card.style.marginBottom='12px';
 card.innerHTML='<h3 style="margin-top:0">Akun Staf Dinas yang Belum Dibuat</h3><div class="small">Memeriksa Mamik, Danny, dan Icha…</div>';body.prepend(card);
 try{
  const usernames=MISSING_DINAS_ACCOUNTS.map(x=>x.username);
  const {data,error}=await sb.from('profiles').select('username,full_name,role,is_active,approval_status').in('username',usernames);if(error)throw error;
  const existing=new Set((data||[]).map(x=>x.username));
  const missing=MISSING_DINAS_ACCOUNTS.filter(x=>!existing.has(x.username));
  card.innerHTML=`<h3 style="margin-top:0">Akun Staf Dinas yang Belum Dibuat</h3><div class="small" style="margin-bottom:10px">Daftar ini hanya mencakup staf yang belum memiliki akun. Akun yang sudah ada tidak akan dibuat ulang.</div><div style="display:grid;gap:7px">${MISSING_DINAS_ACCOUNTS.map(x=>`<div class="info" style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b>${x.full_name}</b><div class="small">${x.position} • ${x.username}</div></div><b style="color:${existing.has(x.username)?'#166534':'#9a3412'}">${existing.has(x.username)?'✓ Sudah ada':'Belum ada'}</b></div>`).join('')}</div><div style="margin-top:12px"><button id="simCreateMissingDinasBtn" class="btn" ${missing.length?'':'disabled'}>➕ Buat ${missing.length} Akun yang Belum Ada</button></div>`;
  const btn=$('simCreateMissingDinasBtn');if(btn)btn.onclick=()=>window.simantabCreateMissingDinasAccounts();
 }catch(e){card.innerHTML=`<h3 style="margin-top:0">Akun Staf Dinas yang Belum Dibuat</h3><div class="err">${e?.message||'Gagal memeriksa akun.'}</div>`}
}
window.simantabCreateMissingDinasAccounts=async()=>{
 if(!sa())return alert('Hanya Super Admin.');
 try{
  const usernames=MISSING_DINAS_ACCOUNTS.map(x=>x.username);
  const {data:exists,error:qe}=await sb.from('profiles').select('username').in('username',usernames);if(qe)throw qe;
  const existing=new Set((exists||[]).map(x=>x.username));
  const missing=MISSING_DINAS_ACCOUNTS.filter(x=>!existing.has(x.username));
  if(!missing.length)return alert('Semua akun staf Dinas tersebut sudah tersedia.');
  if(!confirm(`Buat ${missing.length} akun staf Dinas yang belum ada?\n\n${missing.map(x=>'• '+x.full_name+' — '+x.position).join('\n')}\n\nPassword sementara akan ditampilkan satu kali setelah berhasil dibuat.`))return;
  const btn=$('simCreateMissingDinasBtn');if(btn){btn.disabled=true;btn.textContent='Membuat akun…'}
  const {data:{session}}=await sb.auth.getSession();if(!session?.access_token)throw new Error('Sesi Super Admin tidak tersedia. Silakan login ulang.');
  const created=[];
  for(const item of missing){
   const password=makeTempPassword();
   const {data,error}=await sb.functions.invoke('simantab-admin-create-dinas-user',{body:{full_name:item.full_name,username:item.username,password,role:item.role,unit:'Dinas Pendidikan dan Kebudayaan Kabupaten Batang',position:item.position,nip:'',school_npsn:''},headers:{Authorization:`Bearer ${session.access_token}`}});
   if(error||data?.error){let detail=data?.error||'';try{detail=detail||(await error?.context?.clone?.().json())?.error||''}catch(_){}throw new Error(`${item.full_name}: ${detail||error?.message||'gagal dibuat'}`)}
   created.push({...item,password});
  }
  if(created.length)showDinasCredentials(created);
  document.querySelector('[data-missing-dinas-accounts]')?.remove();
  await installMissingDinasAccounts();
 }catch(e){alert(e?.message||'Gagal membuat akun staf Dinas.');const btn=$('simCreateMissingDinasBtn');if(btn){btn.disabled=false;btn.textContent='➕ Coba Lagi'}}
};


async function installNewDinasAccounts(){
 if(!sa())return;const body=$('usersBody');if(!body||body.querySelector('[data-new-dinas-accounts]'))return;
 const card=document.createElement('div');card.className='card';card.dataset.newDinasAccounts='1';card.style.marginBottom='12px';
 card.innerHTML='<h3 style="margin-top:0">Akun Dinas Baru — termasuk Wartono</h3><div class="small">Memeriksa username baru…</div>';body.prepend(card);
 try{
  const usernames=NEW_DINAS_ACCOUNTS.map(x=>x.username);
  const {data,error}=await sb.from('profiles').select('username,full_name,role').in('username',usernames);if(error)throw error;
  const existing=new Set((data||[]).map(x=>x.username));
  const pending=NEW_DINAS_ACCOUNTS.filter(x=>!existing.has(x.username));
  card.innerHTML=`<h3 style="margin-top:0">Akun Dinas Baru — termasuk Wartono</h3><div class="small" style="margin-bottom:10px">Akun lama tetap aktif. Username baru dibuat terpisah agar tidak bentrok.</div><div style="display:grid;gap:7px">${NEW_DINAS_ACCOUNTS.map(x=>`<div class="info" style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b>${x.full_name}</b><div class="small">${x.position} • username baru: ${x.username}</div></div><b style="color:${existing.has(x.username)?'#166534':'#9a3412'}">${existing.has(x.username)?'✓ Sudah dibuat':'Siap dibuat'}</b></div>`).join('')}</div><div style="margin-top:12px"><button id="simCreateNewDinasBtn" class="btn" ${pending.length?'':'disabled'}>➕ Buat ${pending.length} Akun Baru</button></div>`;
  const btn=$('simCreateNewDinasBtn');if(btn)btn.onclick=()=>window.simantabCreateNewDinasAccounts();
 }catch(e){card.innerHTML=`<h3 style="margin-top:0">Akun Dinas Baru — termasuk Wartono</h3><div class="err">${e?.message||'Gagal memeriksa akun baru.'}</div>`}
}
window.simantabCreateNewDinasAccounts=async()=>{
 if(!sa())return alert('Hanya Super Admin.');
 try{
  const usernames=NEW_DINAS_ACCOUNTS.map(x=>x.username);
  const {data:exists,error:qe}=await sb.from('profiles').select('username').in('username',usernames);if(qe)throw qe;
  const existing=new Set((exists||[]).map(x=>x.username));
  const pending=NEW_DINAS_ACCOUNTS.filter(x=>!existing.has(x.username));
  if(!pending.length)return alert('Semua akun Dinas baru pada daftar ini sudah tersedia.');
  if(!confirm(`Buat ${pending.length} akun Dinas baru?\n\n${pending.map(x=>'• '+x.full_name+' — '+x.username).join('\n')}\n\nAkun lama tetap aktif. Password sementara akan ditampilkan satu kali.`))return;
  const btn=$('simCreateNewDinasBtn');if(btn){btn.disabled=true;btn.textContent='Membuat akun…'}
  const {data:{session}}=await sb.auth.getSession();if(!session?.access_token)throw new Error('Sesi Super Admin tidak tersedia. Silakan login ulang.');
  const created=[];
  for(const item of pending){
   const password=makeTempPassword();
   const {data,error}=await sb.functions.invoke('simantab-admin-create-dinas-user',{body:{full_name:item.full_name,username:item.username,password,role:item.role,unit:'Dinas Pendidikan dan Kebudayaan Kabupaten Batang',position:item.position,nip:'',school_npsn:''},headers:{Authorization:`Bearer ${session.access_token}`}});
   if(error||data?.error){let detail=data?.error||'';try{detail=detail||(await error?.context?.clone?.().json())?.error||''}catch(_){}throw new Error(`${item.full_name}: ${detail||error?.message||'gagal dibuat'}`)}
   created.push({...item,password});
  }
  if(created.length)showDinasCredentials(created);
  document.querySelector('[data-new-dinas-accounts]')?.remove();
  await installNewDinasAccounts();
 }catch(e){alert(e?.message||'Gagal membuat akun Dinas baru.');const btn=$('simCreateNewDinasBtn');if(btn){btn.disabled=false;btn.textContent='➕ Coba Lagi'}}
};

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


/* SIMANTAB_SUPER_ADMIN_USER_DATA_CONTROL_V1 */
function escAdmin(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function focusExistingUserRow(id){
 const btn=[...document.querySelectorAll('#usersBody button')].find(b=>(b.getAttribute('onclick')||'').includes("saveUser('"+id+"')"));
 const tr=btn?.closest('tr');
 if(!tr)return alert('Baris pengguna belum tampil. Gunakan pencarian pada tabel Kelola Pengguna.');
 tr.scrollIntoView({behavior:'smooth',block:'center'});tr.style.outline='3px solid #f59e0b';setTimeout(()=>tr.style.outline='',2600);
 tr.querySelector('input,select')?.focus();
}
async function installUserDataManagement(){
 if(!sa())return;const body=$('usersBody');if(!body)return;
 body.querySelector('[data-user-data-management]')?.remove();
 const card=document.createElement('div');card.className='card';card.dataset.userDataManagement='1';card.style.marginBottom='12px';
 card.innerHTML='<h3 style="margin-top:0">Kelola Data dan Status Pengguna</h3><div class="small">Memuat akun dan jumlah data input…</div>';body.prepend(card);
 try{
  const [pr,su]=await Promise.all([
   sb.from('profiles').select('id,full_name,username,role,position,unit,is_active').order('full_name').limit(1000),
   sb.from('submissions').select('id,user_id').limit(5000)
  ]);
  if(pr.error||su.error)throw pr.error||su.error;
  const counts=new Map;for(const x of su.data||[])counts.set(x.user_id,(counts.get(x.user_id)||0)+1);
  const rows=(pr.data||[]).map(x=>({...x,input_count:counts.get(x.id)||0}));
  card.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:start;flex-wrap:wrap"><div><h3 style="margin:0">Kelola Data dan Status Pengguna</h3><div class="small">Ubah profil melalui tombol <b>Ubah Profil</b>. Aktif/nonaktif memengaruhi akses akun. Hapus Input menghapus seluruh usulan beserta riwayat workflow pengguna, tetapi tidak menghapus akun.</div></div><button class="btn soft" id="simRefreshUserData">↻ Segarkan</button></div>
  <input id="simUserDataSearch" placeholder="Cari nama, username, jabatan, atau role…" style="width:100%;margin:12px 0;padding:10px;border:1px solid #d4dee8;border-radius:10px">
  <div style="overflow:auto;max-height:520px;border:1px solid #e2e8f0;border-radius:12px"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr><th style="text-align:left;padding:8px">Pengguna</th><th style="text-align:left;padding:8px">Role/Jabatan</th><th style="text-align:center;padding:8px">Status</th><th style="text-align:center;padding:8px">Input</th><th style="text-align:left;padding:8px">Tindakan Super Admin</th></tr></thead><tbody id="simUserDataRows"></tbody></table></div>`;
  const renderRows=(term='')=>{
   const q=String(term).toLowerCase().trim();
   const filtered=rows.filter(x=>!q||[x.full_name,x.username,x.role,x.position,x.unit].some(v=>String(v||'').toLowerCase().includes(q)));
   $('simUserDataRows').innerHTML=filtered.map(x=>`<tr style="border-top:1px solid #e8eef4"><td style="padding:8px"><b>${escAdmin(x.full_name||'-')}</b><div class="small">${escAdmin(x.username||'-')} • ${escAdmin(x.unit||'-')}</div></td><td style="padding:8px">${escAdmin(x.position||x.role||'-')}<div class="small">${escAdmin(x.role||'-')}</div></td><td style="padding:8px;text-align:center"><b style="color:${x.is_active===false?'#b91c1c':'#166534'}">${x.is_active===false?'NONAKTIF':'AKTIF'}</b></td><td style="padding:8px;text-align:center"><b>${x.input_count}</b></td><td style="padding:8px;white-space:nowrap"><button class="btn soft" data-edit-user="${x.id}">✏️ Ubah Profil</button> <button class="btn soft" data-toggle-user="${x.id}">${x.is_active===false?'▶ Aktifkan':'⏸ Nonaktifkan'}</button> <button class="btn" style="background:#b91c1c" data-delete-inputs="${x.id}" ${x.input_count?'':'disabled'}>🗑 Hapus Input</button></td></tr>`).join('')||'<tr><td colspan="5" style="padding:18px;text-align:center">Pengguna tidak ditemukan.</td></tr>';
   for(const x of filtered){
    document.querySelector(`[data-edit-user="${x.id}"]`)?.addEventListener('click',()=>focusExistingUserRow(x.id));
    document.querySelector(`[data-toggle-user="${x.id}"]`)?.addEventListener('click',()=>window.simantabSetUserActive(x.id,x.full_name,x.is_active===false));
    document.querySelector(`[data-delete-inputs="${x.id}"]`)?.addEventListener('click',()=>window.simantabDeleteUserInputs(x.id,x.full_name,x.input_count));
   }
  };
  renderRows();$('simUserDataSearch').oninput=e=>renderRows(e.target.value);$('simRefreshUserData').onclick=()=>installUserDataManagement();
 }catch(e){card.innerHTML=`<h3 style="margin-top:0">Kelola Data dan Status Pengguna</h3><div class="err">${escAdmin(e?.message||'Gagal memuat data pengguna.')}</div>`}
}
window.simantabSetUserActive=async(id,name,activate)=>{
 if(!sa())return alert('Hanya Super Admin.');
 const verb=activate?'mengaktifkan':'menonaktifkan';
 if(!confirm(`Yakin ${verb} akun ${name}?\n\nData pengguna tidak dihapus.`))return;
 const {data,error}=await sb.rpc('super_admin_manage_user_data',{p_user_id:id,p_action:'SET_ACTIVE',p_active:activate});
 if(error)return alert(error.message);alert(`Akun ${data?.full_name||name} berhasil ${activate?'diaktifkan':'dinonaktifkan'}.`);await installUserDataManagement();
};
window.simantabDeleteUserInputs=async(id,name,count)=>{
 if(!sa())return alert('Hanya Super Admin.');
 if(!confirm(`PERINGATAN: hapus permanen seluruh ${count} data input/usulan milik ${name}?\n\nRiwayat workflow dan data turunan juga ikut terhapus. Akun pengguna tetap tersedia.`))return;
 const typed=prompt(`Ketik HAPUS untuk mengonfirmasi penghapusan seluruh input milik ${name}:`);
 if(typed!=='HAPUS')return alert('Penghapusan dibatalkan.');
 const {data,error}=await sb.rpc('super_admin_manage_user_data',{p_user_id:id,p_action:'DELETE_INPUTS',p_active:null});
 if(error)return alert(error.message);alert(`${data?.deleted_submissions||0} data input milik ${data?.full_name||name} berhasil dihapus permanen.`);await installUserDataManagement();await svc();
};

const old=window.showTab;window.showTab=async id=>{await old(id);await w(40);if(id==='services')await svc();if(id==='users'){installPasswordResetActions();await installMissingDinasAccounts();await installNewDinasAccounts();await installUserDataManagement()}};for(let i=0;i<60&&!window.__simantabProfile;i++)await w(100);if(sa()&&document.querySelector('.section.active')?.id==='services')await svc();if(sa()&&document.querySelector('.section.active')?.id==='users'){installPasswordResetActions();await installMissingDinasAccounts();await installNewDinasAccounts();await installUserDataManagement();}
})();
