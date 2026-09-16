/* SIMANTAB_LOGIN_CLICK_RESCUE_V2 */
(()=>{
const $=id=>document.getElementById(id);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const SUPABASE_URL='https://tizxfzvgglkokzvsiwkg.supabase.co';
const SUPABASE_KEY='sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB';
const GTK_ROLES=new Set(['GTK','KEPALA_SEKOLAH','PENGAWAS']);
let busy=false;
const show=(text,type='ok')=>{const m=$('authMsg');if(!m)return;m.className=type==='err'?'err':'okmsg';m.textContent=text};
const isSignup=()=>!($('nameWrap')?.classList.contains('hidden'));
const selectedChannel=()=>{
 if($('tabDinas')?.classList.contains('active'))return 'DINAS';
 if($('tabGtk')?.classList.contains('active'))return 'GTK';
 return window.__simantabSelectedLoginChannel==='GTK'?'GTK':'DINAS';
};
const effectiveChannel=p=>{
 const role=String(p?.role||'').toUpperCase(),position=String(p?.position||'').toUpperCase();
 if(GTK_ROLES.has(role)||/KEPALA\s*SEKOLAH|KEPALA\s*SATUAN\s*PENDIDIKAN/.test(position))return 'GTK';
 const c=String(p?.account_channel||'').toUpperCase();
 if(c==='GTK'||c==='DINAS')return c;
 return 'DINAS';
};
async function getClient(){
 for(let i=0;i<40;i++){if(window.__simantabSb)return window.__simantabSb;await wait(50)}
 show('Menyiapkan koneksi login…','ok');
 try{
  const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  if(!mod?.createClient)throw new Error('Library Supabase tidak tersedia.');
  window.__simantabSb=mod.createClient(SUPABASE_URL,SUPABASE_KEY);
  return window.__simantabSb;
 }catch(e){throw new Error('Komponen login gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.')}
}
async function authenticate(sb,login,password){
 if(login.includes('@')){
  const {data,error}=await sb.auth.signInWithPassword({email:login,password});
  if(error)throw error;
  return data?.user?.id||null;
 }
 const {data,error}=await sb.functions.invoke('simantab-username-login',{body:{username:login,password}});
 if(error)throw error;
 if(!data?.access_token||!data?.refresh_token)throw new Error(data?.error||'Username atau password tidak sesuai.');
 const {error:setErr}=await sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
 if(setErr)throw setErr;
 const {data:{user}}=await sb.auth.getUser();
 return user?.id||null;
}
async function runLogin(){
 if(busy)return;
 if(isSignup()){
  const fn=window.submitAuth;
  if(typeof fn==='function')return fn();
  show('Form pendaftaran belum siap. Muat ulang halaman.','err');
  return;
 }
 const login=String($('email')?.value||'').trim();
 const password=String($('password')?.value||'');
 if(!login||password.length<8){show('Isi username/email dan password minimal 8 karakter.','err');return}
 busy=true;const btn=$('authBtn');if(btn)btn.disabled=true;show('Memeriksa akun…','ok');
 try{
  const sb=await getClient();
  const uid=await Promise.race([authenticate(sb,login,password),wait(15000).then(()=>{throw new Error('Koneksi login terlalu lama. Silakan coba lagi.')})]);
  if(!uid)throw new Error('Sesi login tidak ditemukan.');
  const {data:prof,error}=await sb.from('profiles').select('role,is_active,approval_status,account_channel,full_name,position,school_npsn').eq('id',uid).maybeSingle();
  if(error)throw error;
  if(!prof){await sb.auth.signOut();throw new Error('Profil akun SIMANTAB tidak ditemukan. Hubungi Super Admin.');}
  if(!prof.is_active){await sb.auth.signOut();throw new Error('Akun dinonaktifkan. Hubungi Super Admin.');}
  if(prof.approval_status==='PENDING'){await sb.auth.signOut();throw new Error('Akun masih menunggu persetujuan Super Admin.');}
  if(prof.approval_status==='REJECTED'){await sb.auth.signOut();throw new Error('Pendaftaran akun ditolak. Hubungi Super Admin.');}
  const actual=effectiveChannel(prof),wanted=selectedChannel();
  if(actual!==wanted){await sb.auth.signOut();throw new Error(actual==='GTK'?'Akun ini adalah akun Sekolah/GTK/Pengawas. Gunakan Login GTK.':'Akun ini adalah akun Dinas. Gunakan Login Dinas.');}
  show(`Login berhasil. Membuka SIMANTAB${prof.full_name?` untuk ${prof.full_name}`:''}…`,'ok');
  location.reload();
 }catch(e){
  let detail='';try{detail=(await e?.context?.clone?.().json())?.error||''}catch(_){}
  show(detail||e?.message||'Username/email atau password tidak sesuai.','err');
  busy=false;if(btn)btn.disabled=false;
 }
}
function bind(){
 const btn=$('authBtn');if(btn&&btn.dataset.loginRescue!=='2'){
  btn.dataset.loginRescue='2';
  btn.removeAttribute('onclick');
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();void runLogin()},true);
 }
 const pw=$('password');if(pw&&!pw.dataset.loginRescueEnter){pw.dataset.loginRescueEnter='2';pw.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void runLogin()}})}
 const d=$('tabDinas'),g=$('tabGtk');
 if(d&&!d.dataset.channelTrack){d.dataset.channelTrack='2';d.addEventListener('click',()=>{window.__simantabSelectedLoginChannel='DINAS'},true)}
 if(g&&!g.dataset.channelTrack){g.dataset.channelTrack='2';g.addEventListener('click',()=>{window.__simantabSelectedLoginChannel='GTK'},true)}
}
bind();
new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
window.__simantabLoginRescue={version:2,enabled:true};
})();
