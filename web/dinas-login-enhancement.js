/* SIMANTAB_DINAS_USERNAME_LOGIN_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<120&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const DINAS=['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN','STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN','STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK','PENGAWAS'];
const SELF_ROLES={KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP',SUBKOOR_TK:'Subkoor PPTK TK/PAUD',STAFF_DINAS:'Staf Dinas',STAFF_TPG:'Staf TPG/Tamsil',STAFF_KGB:'Staf Gaji Berkala',STAFF_KP_EKIN:'Staf KP & E-Kin',STAFF_PROMOSI:'Staf Promosi Karir',STAFF_ARSIP:'Staf Arsip',STAFF_SKP:'Staf SKP',STAFF_PENSIUN:'Staf Pensiun/Berhenti',STAFF_CUTI:'Staf Izin Cuti',STAFF_SPJ_SIMTENDIK:'Staf SPJ & Simtendik',STAFF_USUL_SK:'Staf Usul Penerbitan SK',PENGAWAS:'Pengawas'};
const CREATE_ROLES={KEPALA_DINAS:'Kepala Disdikbud',KABID:'Kabid Ketenagaan',...SELF_ROLES};
const PENGAWAS_SD=[
 {full_name:'ASMUNI, S.Pd.SD, M.Pd',nip:'197106291997031003',username:'psd.asmuni'},
 {full_name:'SUGIYANA, S.Pd, M.Pd',nip:'196705111993011001',username:'psd.sugiyana'},
 {full_name:'MULYONO, S.Pd',nip:'197002141999031006',username:'psd.mulyono'},
 {full_name:'SUDADI, S.Pd, M.Pd',nip:'197107171993031008',username:'psd.sudadi'},
 {full_name:'SUPRIYANTO, M.Pd',nip:'196809141994011002',username:'psd.supriyanto'},
 {full_name:'LASMIYANTO, S.Pd, M.Pd',nip:'197404201995031001',username:'psd.lasmiyanto'},
 {full_name:'KABUL HINDARTO, S.Pd., M.Si',nip:'196710011991021001',username:'psd.kabulhindarto'},
 {full_name:'ENI NURYANTI, S.Pd.SD',nip:'197601031999032004',username:'psd.eninuryanti'},
 {full_name:'ASIM, M.Pd',nip:'197011231995031002',username:'psd.asim'},
 {full_name:'MINARTO, S.Pd, M.Pd',nip:'196807131996031005',username:'psd.minarto'},
 {full_name:'DWI YULIANTO, S.Pd, M.Si',nip:'197107211998031005',username:'psd.dwiyulianto'},
 {full_name:'RUSMANTO, S.Pd., M.Pd',nip:'197308051997031005',username:'psd.rusmanto'},
 {full_name:'SULOMO, S.Pd, M.Si',nip:'197208111995031004',username:'psd.sulomo'},
 {full_name:'AGUS SUPRIANTO, S.Pd., M.Si',nip:'196804151998031005',username:'psd.agussuprianto'},
 {full_name:'WARYONO, S.Pd, M.Si',nip:'196608071988061001',username:'psd.waryono'},
 {full_name:'RAHAJU MURDIJATI, S.Pd, M.Si',nip:'196906221993032010',username:'psd.rahajumurdijati'},
 {full_name:'COYO, M.Pd',nip:'197207041999031008',username:'psd.coyo'},
 {full_name:'JUREMI, S.Pd, M.Pd',nip:'197109101996031002',username:'psd.juremi'},
 {full_name:'SISWADI, M.Pd',nip:'197303261999031009',username:'psd.siswadi'},
 {full_name:'SALI, S.Pd., M.Pd',nip:'197107191999031005',username:'psd.sali'},
 {full_name:'ANUNG MARGONO, S.Pd., M.Si',nip:'197203231998031006',username:'psd.anungmargono'},
 {full_name:'TUKIRIN, S.Pd., M.Pd',nip:'196809031999031002',username:'psd.tukirin'},
 {full_name:'RUDIYANTO, S.Pd.SD',nip:'197406071998031008',username:'psd.rudiyanto'},
 {full_name:'AFRONI, S.Pd.SD',nip:'196905111999031007',username:'psd.afroni'}
];
let bulkPengawasSdResults=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isDinas=()=>DINAS.includes(window.__simantabProfile?.role||'');
const isSuper=()=>window.__simantabProfile?.role==='SUPER_ADMIN'&&window.__simantabProfile?.is_admin===true;
const isSignup=()=>!($('nameWrap')?.classList.contains('hidden'));
const isDinasChannel=()=>$('tabDinas')?.classList.contains('active');
function msg(text,type='ok'){const m=$('authMsg');if(!m)return;m.className=type==='err'?'err':'okmsg';m.textContent=text}
function roleWrap(){let w=$('dinasRequestedRoleWrap');if(w)return w;w=document.createElement('div');w.id='dinasRequestedRoleWrap';w.className='field';w.innerHTML=`<label>Role yang diajukan</label><select id="dinasRequestedRole">${Object.entries(SELF_ROLES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><div class="small">Akun aktif setelah disetujui Super Admin.</div>`;const n=$('nameWrap');n?.insertAdjacentElement('afterend',w);return w}
function authUi(){const email=$('email'),btn=$('authBtn'),hint=document.querySelector('.loginbox .hint');if(!email||!btn)return;const signup=isSignup(),dinas=isDinasChannel();$('dinasRequestedRoleWrap')?.classList.toggle('hidden',!(dinas&&signup));if(dinas){email.type=signup?'email':'text';email.autocomplete=signup?'email':'username';const label=email.closest('.field')?.querySelector('label');if(label)label.textContent=signup?'Email aktif':'Username / Email';email.placeholder=signup?'nama@contoh.id':'contoh: agus atau email';if(signup){roleWrap().classList.remove('hidden');btn.disabled=false;btn.textContent='Daftar Akun Dinas';if(hint)hint.innerHTML='<b>Pendaftaran Akun Dinas:</b> pilih role yang diajukan. Setelah mendaftar, akun berstatus <b>Menunggu Persetujuan Super Admin</b>. Setelah disetujui, pengguna dapat login melalui Login Dinas.';}else{btn.disabled=false;btn.textContent='Masuk';if(hint)hint.innerHTML='<b>Login Dinas:</b> gunakan username sederhana atau email yang sudah terdaftar. Akun yang masih menunggu persetujuan belum dapat masuk.';}}else{email.type='email';email.autocomplete='email';const label=email.closest('.field')?.querySelector('label');if(label)label.textContent='Email';email.placeholder='nama@contoh.id';btn.disabled=false;btn.textContent=signup?'Daftar Akun':'Masuk';$('dinasRequestedRoleWrap')?.classList.add('hidden')}}
const oldChannel=window.setChannel;if(oldChannel&&!window.__dinasLoginChannelWrap){window.__dinasLoginChannelWrap=true;window.setChannel=c=>{oldChannel(c);setTimeout(authUi,0)}}
const oldToggle=window.toggleAuthMode;if(oldToggle&&!window.__dinasLoginToggleWrap){window.__dinasLoginToggleWrap=true;window.toggleAuthMode=()=>{oldToggle();setTimeout(authUi,0)}}
async function dinasSignup(){const email=String($('email')?.value||'').trim(),password=String($('password')?.value||''),fullName=String($('fullName')?.value||'').trim(),requestedRole=String($('dinasRequestedRole')?.value||'');if(!fullName){msg('Nama lengkap wajib diisi.','err');return}if(!email||!email.includes('@')){msg('Isi email aktif yang valid.','err');return}if(password.length<8){msg('Password minimal 8 karakter.','err');return}if(!SELF_ROLES[requestedRole]){msg('Pilih role Dinas yang valid.','err');return}const btn=$('authBtn');btn.disabled=true;try{const emailRedirectTo=new URL('./',window.location.href).href;const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:fullName,account_channel:'DINAS',requested_role:requestedRole,registration_note:`Pendaftaran mandiri ${SELF_ROLES[requestedRole]}`},emailRedirectTo}});if(error)throw error;if(data.user?.identities?.length===0)throw new Error('Email sudah terdaftar. Silakan gunakan menu Masuk.');if(data.session)await sb.auth.signOut();msg('Pendaftaran berhasil. Akun menunggu persetujuan Super Admin. Jika menerima email konfirmasi, klik tautan konfirmasi terlebih dahulu.','ok')}catch(e){msg(e?.message||'Pendaftaran gagal.','err')}finally{btn.disabled=false}}
async function dinasLogin(){const login=String($('email')?.value||'').trim(),password=String($('password')?.value||'');if(!login||password.length<8){msg('Isi username/email dan password minimal 8 karakter.','err');return}const btn=$('authBtn');btn.disabled=true;msg('Memeriksa akun...','ok');try{if(login.includes('@')){const {data,error}=await sb.auth.signInWithPassword({email:login,password});if(error)throw error;const uid=data.user?.id;if(!uid)throw new Error('Sesi login tidak ditemukan.');const {data:prof,error:pe}=await sb.from('profiles').select('role,is_active,approval_status,account_channel').eq('id',uid).maybeSingle();if(pe)throw pe;if(prof?.account_channel==='DINAS'&&(prof.approval_status==='PENDING'||!prof.is_active)){await sb.auth.signOut();throw new Error('Akun Dinas masih menunggu persetujuan Super Admin.')}if(prof?.approval_status==='REJECTED'){await sb.auth.signOut();throw new Error('Pendaftaran akun Dinas ditolak. Hubungi Super Admin.')}location.reload();return}const {data,error}=await sb.functions.invoke('simantab-username-login',{body:{username:login,password}});if(error)throw error;if(!data?.access_token||!data?.refresh_token)throw new Error(data?.error||'Username atau password tidak sesuai.');const {error:setErr}=await sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});if(setErr)throw setErr;location.reload()}catch(e){let detail='';try{detail=(await e?.context?.clone?.().json())?.error||''}catch(_){}msg(detail||e?.message||'Username/email atau password tidak sesuai.','err');btn.disabled=false}}
const oldSubmit=window.submitAuth;if(oldSubmit&&!window.__dinasLoginSubmitWrap){window.__dinasLoginSubmitWrap=true;window.submitAuth=async()=>{if(isDinasChannel())return isSignup()?dinasSignup():dinasLogin();return oldSubmit()}}
function tempPassword(username){const clean=String(username||'user').replace(/[^A-Za-z0-9]/g,'')||'User';let p=clean.charAt(0).toUpperCase()+clean.slice(1)+'@123';if(p.length<8)p+='4';return p}
function randomTempPassword(){
 const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
 const a=new Uint32Array(12);crypto.getRandomValues(a);
 return 'Psd@'+Array.from(a,n=>chars[n%chars.length]).join('');
}
function renderBulkPengawasSdResult(){
 const box=$('pengawasSdBulkResult');if(!box)return;
 if(!bulkPengawasSdResults.length){box.innerHTML='';return}
 const made=bulkPengawasSdResults.filter(x=>x.status==='DIBUAT').length;
 const exists=bulkPengawasSdResults.filter(x=>x.status==='SUDAH ADA').length;
 const failed=bulkPengawasSdResults.filter(x=>x.status==='GAGAL').length;
 box.innerHTML='<div class="info" style="margin-top:10px"><b>Hasil:</b> '+made+' dibuat • '+exists+' sudah pernah dibuat dengan username batch • '+failed+' gagal. '+(made?'<b>Unduh kredensial sekarang; password sementara hanya ditampilkan pada hasil pembuatan ini.</b>':'')+'</div>'+
 '<div class="tablewrap" style="margin-top:8px;max-height:420px"><table><thead><tr><th>No</th><th>Nama</th><th>NIP</th><th>Username</th><th>Password sementara</th><th>Status</th></tr></thead><tbody>'+
 bulkPengawasSdResults.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(x.full_name)+'</td><td>'+esc(x.nip)+'</td><td><b>'+esc(x.username)+'</b></td><td>'+(x.password?'<b>'+esc(x.password)+'</b>':'—')+'</td><td>'+esc(x.status+(x.detail?' • '+x.detail:''))+'</td></tr>').join('')+
 '</tbody></table></div>'+
 (made?'<button class="btn success" style="margin-top:8px" onclick="downloadPengawasSdCredentials()">⬇ Unduh Kredensial CSV</button>':'');
}
function bulkPengawasSdCard(){
 if(!isSuper()||!$('usersBody')||$('pengawasSdBulkCard'))return;
 const box=document.createElement('div');box.id='pengawasSdBulkCard';box.className='card';box.style.marginBottom='12px';
 box.innerHTML='<h3 style="margin-top:0">👥 Buat 24 Akun Pengawas SD</h3><div class="info">Sumber daftar: SK pembagian tugas Pengawas SD Tahun Pelajaran 2026/2027. Akun lama <b>tidak digunakan sebagai pengganti</b>; setiap pengawas dibuatkan akun baru khusus batch dengan username <b>psd.nama</b>. Role: <b>PENGAWAS</b>, status langsung aktif/APPROVED, dan wajib mengganti password pada login pertama.</div><div style="margin-top:10px"><button id="createAllPengawasSdBtn" class="btn primary" onclick="createAllPengawasSdAccounts()">Buat 24 Akun Pengawas SD</button> <button class="btn" onclick="previewPengawasSdAccounts()">Lihat Daftar</button></div><div id="pengawasSdBulkProgress" class="small" style="margin-top:8px"></div><div id="pengawasSdBulkResult"></div>';
 const creator=$('dinasAccountCreator');if(creator)creator.insertAdjacentElement('afterend',box);else $('usersBody').prepend(box);
}
window.previewPengawasSdAccounts=()=>{
 bulkPengawasSdResults=PENGAWAS_SD.map(x=>({...x,password:'',status:'SIAP DIBUAT',detail:''}));
 renderBulkPengawasSdResult();
};
window.createAllPengawasSdAccounts=async()=>{
 if(!isSuper())return;
 if(!confirm('Buat akun BARU untuk seluruh 24 Pengawas SD? Akun lama tetap dibiarkan.'))return;
 const btn=$('createAllPengawasSdBtn'),p=$('pengawasSdBulkProgress');if(btn)btn.disabled=true;
 bulkPengawasSdResults=[];
 try{
  p.textContent='Memeriksa username batch yang sudah ada...';
  const names=PENGAWAS_SD.map(x=>x.username);
  const {data:existing,error:ee}=await sb.from('profiles').select('username').in('username',names);
  if(ee)throw ee;
  const existingSet=new Set((existing||[]).map(x=>String(x.username||'').toLowerCase()));
  const {data:{session}}=await sb.auth.getSession();
  if(!session?.access_token)throw new Error('Sesi Super Admin tidak ditemukan. Silakan login ulang.');
  for(let i=0;i<PENGAWAS_SD.length;i++){
   const x=PENGAWAS_SD[i];p.textContent='Membuat akun '+(i+1)+'/'+PENGAWAS_SD.length+' — '+x.full_name;
   if(existingSet.has(x.username)){
    bulkPengawasSdResults.push({...x,password:'',status:'SUDAH ADA',detail:'username batch sudah ada'});
    renderBulkPengawasSdResult();continue;
   }
   const password=randomTempPassword();
   const {data,error}=await sb.functions.invoke('simantab-admin-create-dinas-user',{
    body:{full_name:x.full_name,username:x.username,password,role:'PENGAWAS',unit:'Dinas Pendidikan dan Kebudayaan Kabupaten Batang',position:'Pengawas SD',nip:x.nip},
    headers:{Authorization:'Bearer '+session.access_token}
   });
   if(error||!data?.ok){
    let detail=data?.error||'';try{detail=detail||(await error?.context?.clone?.().json())?.error||''}catch(_){}
    bulkPengawasSdResults.push({...x,password:'',status:'GAGAL',detail:detail||error?.message||'Gagal membuat akun'});
   }else{
    bulkPengawasSdResults.push({...x,password,status:'DIBUAT',detail:'aktif • wajib ganti password'});
   }
   renderBulkPengawasSdResult();
  }
  p.textContent='Selesai memproses 24 Pengawas SD.';
 }catch(e){
  p.textContent='Proses dihentikan: '+(e?.message||String(e));
 }finally{if(btn)btn.disabled=false;renderBulkPengawasSdResult()}
};
window.downloadPengawasSdCredentials=()=>{
 const rows=bulkPengawasSdResults.filter(x=>x.status==='DIBUAT');if(!rows.length)return alert('Belum ada kredensial baru untuk diunduh.');
 const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 const lines=[['No','Nama','NIP','Username','Password Sementara','Role','Jabatan','Status'],...rows.map((x,i)=>[i+1,x.full_name,x.nip,x.username,x.password,'PENGAWAS','Pengawas SD','Wajib ganti password saat login pertama'])];
 const blob=new Blob(['\ufeff'+lines.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='akun_pengawas_sd_simantab_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
function createForm(){if(!isSuper()||!$('usersBody')||$('dinasAccountCreator'))return;const box=document.createElement('div');box.id='dinasAccountCreator';box.className='card';box.style.marginBottom='12px';box.innerHTML=`<h3 style="margin-top:0">➕ Buat Akun Dinas Langsung</h3><div class="info" style="margin-bottom:10px">Alternatif selain pendaftaran mandiri: Super Admin dapat membuat akun aktif dengan <b>username + password sementara</b>.</div><div class="grid"><div class="field s6"><label>Nama lengkap</label><input id="newDinasName" placeholder="Nama pegawai"></div><div class="field s3"><label>Username</label><input id="newDinasUsername" autocomplete="off" placeholder="contoh: agus"></div><div class="field s3"><label>Password sementara</label><input id="newDinasPassword" autocomplete="new-password" placeholder="Agus@123"></div><div class="field s4"><label>Role</label><select id="newDinasRole">${Object.entries(CREATE_ROLES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div><div class="field s4"><label>Unit</label><input id="newDinasUnit" value="Dinas Pendidikan dan Kebudayaan Kabupaten Batang"></div><div class="field s4"><label>Jabatan</label><input id="newDinasPosition" placeholder="Jabatan/unit kerja"></div></div><button class="btn primary" onclick="createDinasAccount()">Buat Akun</button><div id="newDinasMsg"></div>`;$('usersBody').prepend(box);const u=$('newDinasUsername'),p=$('newDinasPassword');u?.addEventListener('input',()=>{if(!p.dataset.manual)p.value=tempPassword(u.value)});p?.addEventListener('input',()=>p.dataset.manual='1')}
window.createDinasAccount=async()=>{if(!isSuper())return;const full_name=$('newDinasName').value.trim(),username=$('newDinasUsername').value.trim().toLowerCase(),password=$('newDinasPassword').value,role=$('newDinasRole').value,unit=$('newDinasUnit').value.trim(),position=$('newDinasPosition').value.trim(),m=$('newDinasMsg');if(!full_name||!/^[A-Za-z0-9._-]{3,32}$/.test(username)||password.length<8){m.className='err';m.textContent='Isi nama, username 3–32 karakter, dan password sementara minimal 8 karakter.';return}m.className='small';m.textContent='Membuat akun...';const {data:{session}}=await sb.auth.getSession();const {data,error}=await sb.functions.invoke('simantab-admin-create-dinas-user',{body:{full_name,username,password,role,unit,position},headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}});if(error||!data?.ok){let detail=data?.error||'';try{detail=detail||(await error?.context?.clone?.().json())?.error||''}catch(_){}m.className='err';m.textContent=detail||error?.message||'Gagal membuat akun.';return}m.className='okmsg';m.innerHTML=`<b>Akun berhasil dibuat.</b><br>Username: <b>${esc(username)}</b><br>Password sementara: <b>${esc(password)}</b>`;}
let pendingCache=[];
async function pendingApprovals(){if(!isSuper()||!$('usersBody'))return;const old=$('dinasPendingApprovals');old?.remove();const {data,error}=await sb.from('profiles').select('id,full_name,requested_role,registration_note,created_at,unit,position,approval_status,account_channel').eq('account_channel','DINAS').eq('approval_status','PENDING').order('created_at',{ascending:false});if(error){console.error(error);return}pendingCache=data||[];const box=document.createElement('div');box.id='dinasPendingApprovals';box.className='card';box.style.marginBottom='12px';box.innerHTML=`<h3 style="margin-top:0">⏳ Persetujuan Pendaftaran Akun Dinas</h3>${pendingCache.length?`<div class="tablewrap"><table><thead><tr><th>Nama</th><th>Role Diajukan</th><th>Catatan</th><th>Aksi</th></tr></thead><tbody>${pendingCache.map(x=>`<tr><td><b>${esc(x.full_name)}</b><br><span class="small">${new Date(x.created_at).toLocaleString('id-ID')}</span></td><td>${esc(SELF_ROLES[x.requested_role]||x.requested_role||'-')}</td><td>${esc(x.registration_note||'-')}</td><td><button class="btn success" onclick="approveDinasRegistration('${x.id}')">✓ Setujui</button> <button class="btn danger" onclick="rejectDinasRegistration('${x.id}')">Tolak</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Tidak ada pendaftaran Dinas yang menunggu persetujuan.</div>'}`;const creator=$('dinasAccountCreator');if(creator)creator.insertAdjacentElement('afterend',box);else $('usersBody').prepend(box)}
window.approveDinasRegistration=async id=>{if(!isSuper())return;const r=pendingCache.find(x=>x.id===id);if(!r||!SELF_ROLES[r.requested_role])return alert('Role yang diajukan tidak valid.');const {error}=await sb.from('profiles').update({role:r.requested_role,is_active:true,approval_status:'APPROVED',account_channel:'DINAS',unit:r.unit||'Dinas Pendidikan dan Kebudayaan Kabupaten Batang',position:r.position||SELF_ROLES[r.requested_role]}).eq('id',id);if(error)alert(error.message);else{alert('Akun Dinas disetujui dan sudah aktif.');await window.showTab('users')}};
window.rejectDinasRegistration=async id=>{if(!isSuper()||!confirm('Tolak pendaftaran akun Dinas ini?'))return;const {error}=await sb.from('profiles').update({is_active:false,approval_status:'REJECTED'}).eq('id',id);if(error)alert(error.message);else await window.showTab('users')};
function credentialCard(){if(!isDinas()||!$('profileBody')||$('dinasCredentialCard'))return;const p=window.__simantabProfile||{},wrap=document.createElement('div');wrap.id='dinasCredentialCard';wrap.className='card';wrap.style.marginTop='12px';wrap.innerHTML=`<h3 style="margin-top:0">🔐 Username & Password Login</h3>${p.must_change_password?'<div class="notice" style="margin-bottom:10px"><b>Login pertama:</b> password sementara wajib diganti sebelum menggunakan menu lain.</div>':''}<div class="grid"><div class="field s6"><label>Username</label><input id="profileLoginUsername" value="${esc(p.login_username||'')}" placeholder="username"></div><div class="field s6"><label>Password baru</label><input id="profileNewPassword" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter"></div><div class="field s6"><label>Ulangi password baru</label><input id="profileConfirmPassword" type="password" autocomplete="new-password" placeholder="Ulangi password"></div></div><button class="btn primary" onclick="saveDinasCredentials()">💾 Simpan Username / Password</button><div id="dinasCredentialMsg"></div>`;$('profileBody').appendChild(wrap)}
window.saveDinasCredentials=async()=>{if(!isDinas())return;const username=$('profileLoginUsername').value.trim().toLowerCase(),password=$('profileNewPassword').value,confirm=$('profileConfirmPassword').value,m=$('dinasCredentialMsg'),p=window.__simantabProfile||{};if(!/^[A-Za-z0-9._-]{3,32}$/.test(username)){m.className='err';m.textContent='Username harus 3–32 karakter.';return}if(password&&password.length<8){m.className='err';m.textContent='Password baru minimal 8 karakter.';return}if(p.must_change_password&&!password){m.className='err';m.textContent='Pada login pertama, password baru wajib diisi.';return}if(password!==confirm){m.className='err';m.textContent='Ulangi password tidak sama.';return}m.className='small';m.textContent='Menyimpan...';const {data:{session}}=await sb.auth.getSession();const {data,error}=await sb.functions.invoke('simantab-account-settings',{body:{username,password:password||undefined},headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}});if(error||!data?.ok){let detail=data?.error||'';try{detail=detail||(await error?.context?.clone?.().json())?.error||''}catch(_){}m.className='err';m.textContent=detail||error?.message||'Gagal menyimpan.';return}window.__simantabProfile={...p,...data.profile};m.className='okmsg';m.textContent='Username/password berhasil diperbarui.';setTimeout(()=>location.reload(),700)};
const oldShow=window.showTab;if(oldShow&&!window.__dinasLoginShowWrap){window.__dinasLoginShowWrap=true;window.showTab=async id=>{const p=window.__simantabProfile;if(p?.must_change_password&&DINAS.includes(p.role)&&id!=='profile')id='profile';await oldShow(id);await wait(40);if(id==='users'){createForm();bulkPengawasSdCard();await pendingApprovals()}if(id==='profile')credentialCard()}}
for(let i=0;i<80&&!window.__simantabProfile;i++)await wait(100);
authUi();
if(window.__simantabProfile){if(window.__simantabProfile.must_change_password&&isDinas())await window.showTab('profile');else if(document.querySelector('.section.active')?.id==='profile')credentialCard();if(isSuper()&&document.querySelector('.section.active')?.id==='users'){createForm();bulkPengawasSdCard();await pendingApprovals()}}
})();