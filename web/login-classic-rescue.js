/* SIMANTAB_LOGIN_CLASSIC_RESCUE_V1 */
(function(){
  'use strict';
  var SUPABASE_URL='https://tizxfzvgglkokzvsiwkg.supabase.co';
  var SUPABASE_KEY='sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB';
  var STORAGE_KEY='sb-tizxfzvgglkokzvsiwkg-auth-token';
  var busy=false;
  function $(id){return document.getElementById(id)}
  function show(text,type){var m=$('authMsg');if(!m)return;m.className=type==='err'?'err':'okmsg';m.textContent=text}
  function isSignup(){var n=$('nameWrap');return n && !n.classList.contains('hidden')}
  function selectedChannel(){var t=$('tabGtk');return t&&t.classList.contains('active')?'GTK':'DINAS'}
  function effectiveChannel(p){var c=String((p&&p.account_channel)||'').toUpperCase();if(c==='GTK'||c==='DINAS')return c;var r=String((p&&p.role)||'').toUpperCase();return (r==='GTK'||r==='KEPALA_SEKOLAH'||r==='PENGAWAS')?'GTK':'DINAS'}
  function headers(token){var h={'apikey':SUPABASE_KEY,'Content-Type':'application/json'};if(token)h.Authorization='Bearer '+token;return h}
  function parseResponse(r){return r.text().then(function(t){var j={};try{j=t?JSON.parse(t):{}}catch(_){j={message:t}}if(!r.ok){var e=new Error(j.error_description||j.msg||j.message||j.error||('HTTP '+r.status));e.status=r.status;throw e}return j})}
  function authEmail(email,password){return fetch(SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:headers(),body:JSON.stringify({email:email,password:password})}).then(parseResponse)}
  function authUsername(username,password){return fetch(SUPABASE_URL+'/functions/v1/simantab-username-login',{method:'POST',headers:headers(),body:JSON.stringify({username:username,password:password})}).then(parseResponse)}
  function profileFor(uid,token){var q='/rest/v1/profiles?id=eq.'+encodeURIComponent(uid)+'&select=role,is_active,approval_status,account_channel,full_name';return fetch(SUPABASE_URL+q,{method:'GET',headers:headers(token)}).then(parseResponse).then(function(rows){return rows&&rows[0]})}
  function persistSession(session){
    var now=Math.floor(Date.now()/1000);
    if(!session.expires_at&&session.expires_in)session.expires_at=now+Number(session.expires_in||3600);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(session));return true}catch(e){return false}
  }
  function normalizeUsernameSession(data){
    if(!data||!data.access_token||!data.refresh_token)throw new Error((data&&data.error)||'Username atau password tidak sesuai.');
    var user=data.user||null;
    return {access_token:data.access_token,refresh_token:data.refresh_token,token_type:data.token_type||'bearer',expires_in:Number(data.expires_in||3600),expires_at:data.expires_at,user:user};
  }
  function getUserFromToken(session){
    if(session.user&&session.user.id)return Promise.resolve(session.user);
    return fetch(SUPABASE_URL+'/auth/v1/user',{method:'GET',headers:headers(session.access_token)}).then(parseResponse)
  }
  function run(){
    if(busy)return;
    if(isSignup()){
      if(typeof window.submitAuth==='function'){window.submitAuth();return}
      show('Form pendaftaran belum siap. Buka ulang halaman di Chrome.','err');return;
    }
    var login=String(($('email')&&$('email').value)||'').trim();
    var password=String(($('password')&&$('password').value)||'');
    if(!login||password.length<8){show('Isi email/username dan password minimal 8 karakter.','err');return}
    busy=true;var btn=$('authBtn');if(btn)btn.disabled=true;show('Memeriksa akun…','ok');
    var authPromise=login.indexOf('@')>=0?authEmail(login,password):authUsername(login,password).then(normalizeUsernameSession);
    authPromise.then(function(session){
      return getUserFromToken(session).then(function(user){if(!user||!user.id)throw new Error('Sesi login tidak ditemukan.');session.user=user;return profileFor(user.id,session.access_token).then(function(profile){return {session:session,profile:profile}})})
    }).then(function(result){
      var p=result.profile;if(!p)throw new Error('Profil akun SIMANTAB tidak ditemukan. Hubungi Super Admin.');
      if(!p.is_active)throw new Error('Akun dinonaktifkan. Hubungi Super Admin.');
      if(p.approval_status==='PENDING')throw new Error('Akun masih menunggu persetujuan Super Admin.');
      if(p.approval_status==='REJECTED')throw new Error('Pendaftaran akun ditolak. Hubungi Super Admin.');
      var actual=effectiveChannel(p),wanted=selectedChannel();
      if(actual!==wanted)throw new Error(actual==='GTK'?'Akun ini adalah akun Sekolah/GTK/Pengawas. Gunakan Login GTK.':'Akun ini adalah akun Dinas. Gunakan Login Dinas.');
      if(!persistSession(result.session))throw new Error('Browser tidak mengizinkan penyimpanan sesi. Buka SIMANTAB langsung di Chrome.');
      show('Login berhasil. Membuka SIMANTAB…','ok');
      setTimeout(function(){location.reload()},150);
    }).catch(function(e){show((e&&e.message)||'Username/email atau password tidak sesuai.','err');busy=false;if(btn)btn.disabled=false})
  }
  function bind(){
    var btn=$('authBtn');if(!btn||btn.getAttribute('data-classic-rescue')==='1')return;
    btn.setAttribute('data-classic-rescue','1');
    btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();run()},true);
    var pw=$('password');if(pw&&pw.getAttribute('data-classic-enter')!=='1'){pw.setAttribute('data-classic-enter','1');pw.addEventListener('keydown',function(e){if(e.key==='Enter'||e.keyCode===13){e.preventDefault();run()}})}
  }
  function ready(){bind();try{new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true})}catch(_){setInterval(bind,1000)}window.__simantabClassicLoginRescue={version:1,enabled:true}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
