/* SIMANTEB_PENGAWAS_LOGIN_CHANNEL_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabSb||!window.submitAuth||!window.setChannel);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const DINAS_ALLOWED=new Set(['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN','STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN','STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK']);
const GTK_ALLOWED=new Set(['GTK','KEPALA_SEKOLAH','PENGAWAS']);
const isSignup=()=>!($('nameWrap')?.classList.contains('hidden'));
const isDinasChannel=()=>$('tabDinas')?.classList.contains('active');
const show=(text,type='ok')=>{const m=$('authMsg');if(!m)return;m.className=type==='err'?'err':'okmsg';m.textContent=text};
function cleanDinasSignupRoles(){const s=$('dinasRequestedRole');if(!s)return;const o=[...s.options].find(x=>x.value==='PENGAWAS');o?.remove()}
function refreshUi(){
 const gtk=$('tabGtk'),email=$('email'),btn=$('authBtn');if(gtk)gtk.textContent='🏫 Login Sekolah / GTK / Pengawas';cleanDinasSignupRoles();
 if(!email||!btn)return;
 if(!isDinasChannel()&&!isSignup()){
   email.type='text';email.autocomplete='username';const l=email.closest('.field')?.querySelector('label');if(l)l.textContent='Email / Username';email.placeholder='Email atau username Pengawas';btn.textContent='Masuk';
 }
 if(!isDinasChannel()&&isSignup()){
   email.type='email';email.autocomplete='email';const l=email.closest('.field')?.querySelector('label');if(l)l.textContent='Email';email.placeholder='nama@contoh.id';
 }
}
async function authenticate(login,password){
 if(login.includes('@')){const {data,error}=await sb.auth.signInWithPassword({email:login,password});if(error)throw error;return data.user?.id||null}
 const {data,error}=await sb.functions.invoke('simantab-username-login',{body:{username:login,password}});if(error)throw error;if(!data?.access_token||!data?.refresh_token)throw new Error(data?.error||'Username atau password tidak sesuai.');const {error:setErr}=await sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});if(setErr)throw setErr;const {data:{user}}=await sb.auth.getUser();return user?.id||null;
}
async function channelLogin(){
 const login=String($('email')?.value||'').trim(),password=String($('password')?.value||''),btn=$('authBtn');if(!login||password.length<8){show('Isi email/username dan password minimal 8 karakter.','err');return}
 btn.disabled=true;show('Memeriksa akun...');
 try{
  const uid=await authenticate(login,password);if(!uid)throw new Error('Sesi login tidak ditemukan.');
  const {data:p,error}=await sb.from('profiles').select('role,is_active,approval_status,account_channel').eq('id',uid).maybeSingle();if(error)throw error;if(!p?.is_active){await sb.auth.signOut();throw new Error('Akun tidak aktif.')};if(p.approval_status==='REJECTED'){await sb.auth.signOut();throw new Error('Akun ditolak. Hubungi Super Admin.')}
  const dinas=isDinasChannel(),allowed=dinas?DINAS_ALLOWED:GTK_ALLOWED;
  if(!allowed.has(p.role)){
    await sb.auth.signOut();
    if(p.role==='PENGAWAS'&&dinas)throw new Error('Akun Pengawas masuk melalui Login Sekolah / GTK / Pengawas.');
    if(!dinas&&DINAS_ALLOWED.has(p.role))throw new Error('Akun ini adalah akun Dinas. Gunakan Login Dinas.');
    throw new Error(dinas?'Akun ini bukan akun Dinas.':'Akun ini bukan akun Sekolah/GTK/Pengawas.');
  }
  location.reload();
 }catch(e){let detail='';try{detail=(await e?.context?.clone?.().json())?.error||''}catch(_){}show(detail||e?.message||'Login gagal.','err');btn.disabled=false}
}
const prevSubmit=window.submitAuth;window.submitAuth=async()=>{if(isSignup())return prevSubmit();return channelLogin()};
const prevChannel=window.setChannel;window.setChannel=c=>{prevChannel(c);setTimeout(refreshUi,30)};
const prevToggle=window.toggleAuthMode;window.toggleAuthMode=()=>{prevToggle();setTimeout(refreshUi,30)};
refreshUi();
window.__simantebPengawasLogin={channel:'GTK',allowedGtk:[...GTK_ALLOWED],allowedDinas:[...DINAS_ALLOWED]};
})();