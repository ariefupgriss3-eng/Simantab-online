/* SIMANTAB_LOGIN_CHANNEL_HARDENING_V3 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.submitAuth);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb||!window.submitAuth)return;
const GTK_ROLES=new Set(['GTK','KEPALA_SEKOLAH','PENGAWAS']);
const oldSubmit=window.submitAuth;
const oldChannel=window.setChannel;
const oldToggle=window.toggleAuthMode;
const isSignup=()=>!($('nameWrap')?.classList.contains('hidden'));
const selectedChannel=()=>{
 if($('tabDinas')?.classList.contains('active'))return 'DINAS';
 if($('tabGtk')?.classList.contains('active'))return 'GTK';
 return window.__simantabSelectedLoginChannel==='GTK'?'GTK':'DINAS';
};
const show=(text,type='err')=>{const m=$('authMsg');if(!m)return;m.className=type==='err'?'err':'okmsg';m.textContent=text};
function updateUi(){
 const input=$('email'),label=input?.closest('.field')?.querySelector('label'),hint=document.querySelector('.loginbox .hint');
 if(!input||isSignup())return;
 const ch=selectedChannel();input.type='text';input.autocomplete='username';
 if(label)label.textContent='Username / Email';
 input.placeholder=ch==='GTK'?'username KS/GTK/Pengawas atau email':'username Dinas atau email';
 if(ch==='GTK'&&hint)hint.innerHTML='<b>Login Sekolah / GTK / Pengawas:</b> gunakan <b>username atau email</b> akun yang sudah terdaftar. Akun Dinas tidak dapat masuk melalui kanal ini.';
 if(ch==='DINAS'&&hint)hint.innerHTML='<b>Login Dinas:</b> gunakan <b>username atau email</b> akun Dinas yang sudah aktif. Akun Sekolah/GTK/Pengawas tidak dapat masuk melalui kanal ini.';
}
function effectiveChannel(prof){
 const role=String(prof?.role||'').toUpperCase();
 const position=String(prof?.position||'').toUpperCase();
 // Role sekolah/GTK selalu GTK. account_channel tidak boleh mengalahkan role.
 if(GTK_ROLES.has(role)||/KEPALA\s*SEKOLAH|KEPALA\s*SATUAN\s*PENDIDIKAN/.test(position))return 'GTK';
 const explicit=String(prof?.account_channel||'').toUpperCase();
 if(explicit==='GTK'||explicit==='DINAS')return explicit;
 return 'DINAS';
}
async function authenticate(login,password){
 if(login.includes('@')){
  const {data,error}=await sb.auth.signInWithPassword({email:login,password});
  if(error)throw error;return data?.user?.id||null;
 }
 const {data,error}=await sb.functions.invoke('simantab-username-login',{body:{username:login,password}});
 if(error)throw error;if(!data?.access_token||!data?.refresh_token)throw new Error(data?.error||'Username atau password tidak sesuai.');
 const {error:setErr}=await sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});if(setErr)throw setErr;
 const {data:{user}}=await sb.auth.getUser();return user?.id||null;
}
async function hardenedLogin(){
 const login=String($('email')?.value||'').trim(),password=String($('password')?.value||''),btn=$('authBtn'),wanted=selectedChannel();
 if(!login||password.length<8){show('Isi username/email dan password minimal 8 karakter.');return}
 btn.disabled=true;show('Memeriksa akun...','ok');
 try{
  const uid=await authenticate(login,password);if(!uid)throw new Error('Sesi login tidak ditemukan.');
  const {data:prof,error}=await sb.from('profiles').select('role,is_active,approval_status,account_channel,full_name,position,school_npsn').eq('id',uid).maybeSingle();if(error)throw error;
  if(!prof){await sb.auth.signOut();throw new Error('Profil akun SIMANTAB tidak ditemukan. Hubungi Super Admin.');}
  if(!prof.is_active){await sb.auth.signOut();throw new Error('Akun dinonaktifkan. Hubungi Super Admin.');}
  if(prof.approval_status==='PENDING'){await sb.auth.signOut();throw new Error('Akun masih menunggu persetujuan Super Admin.');}
  if(prof.approval_status==='REJECTED'){await sb.auth.signOut();throw new Error('Pendaftaran akun ditolak. Hubungi Super Admin.');}
  const actual=effectiveChannel(prof);
  if(actual!==wanted){await sb.auth.signOut();throw new Error(actual==='GTK'?'Akun ini adalah akun Sekolah/GTK/Pengawas. Gunakan Login GTK.':'Akun ini adalah akun Dinas. Gunakan Login Dinas.');}
  location.reload();
 }catch(e){let detail='';try{detail=(await e?.context?.clone?.().json())?.error||''}catch(_){}show(detail||e?.message||'Username/email atau password tidak sesuai.');btn.disabled=false}
}
window.submitAuth=async()=>isSignup()?oldSubmit():hardenedLogin();
if(oldChannel)window.setChannel=c=>{window.__simantabSelectedLoginChannel=String(c||'').toUpperCase()==='GTK'?'GTK':'DINAS';oldChannel(c);setTimeout(updateUi,0)};
if(oldToggle)window.toggleAuthMode=()=>{oldToggle();setTimeout(updateUi,0)};
document.addEventListener('click',e=>{const t=e.target?.closest?.('#tabDinas,#tabGtk');if(!t)return;window.__simantabSelectedLoginChannel=t.id==='tabGtk'?'GTK':'DINAS';setTimeout(updateUi,0)},true);
setTimeout(updateUi,0);
})();
