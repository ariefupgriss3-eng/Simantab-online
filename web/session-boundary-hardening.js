/* SIMANTAB_SESSION_BOUNDARY_HARDENING_V1 */
(()=>{
const PROJECT_REF='tizxfzvgglkokzvsiwkg';
const AUTH_KEY='sb-'+PROJECT_REF+'-auth-token';
let loggingOut=false;

function clearRuntime(){
  try{window.__simantabProfile=null}catch(_){}
  try{window.__simantabSelectedLoginChannel=null}catch(_){}
  try{window.__simantabSignupSchool=null}catch(_){}
  try{window.__simantabLeaderCoreRendered=false}catch(_){}
}

function clearStoredSession(){
  try{
    localStorage.removeItem(AUTH_KEY);
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i)||'';
      if(k.includes(PROJECT_REF) && /auth|token|session/i.test(k)) localStorage.removeItem(k);
    }
  }catch(_){}
  try{
    for(let i=sessionStorage.length-1;i>=0;i--){
      const k=sessionStorage.key(i)||'';
      if(/simantab|supabase|auth|session/i.test(k)) sessionStorage.removeItem(k);
    }
  }catch(_){}
}

async function hardLogout(){
  if(loggingOut)return;
  loggingOut=true;
  const btn=document.querySelector('button[onclick="logout()"]');
  if(btn){btn.disabled=true;btn.textContent='Keluar…'}
  const sb=window.__simantabSb;
  try{
    if(sb?.auth?.signOut){
      await Promise.race([
        sb.auth.signOut({scope:'local'}),
        new Promise(resolve=>setTimeout(resolve,3000))
      ]);
    }
  }catch(_){}
  clearStoredSession();
  clearRuntime();
  const u=new URL(location.origin+'/');
  u.searchParams.set('signedout',String(Date.now()));
  location.replace(u.toString());
}

window.logout=hardLogout;
window.__simantabSessionBoundary={version:1,hardLogout:true,projectRef:PROJECT_REF};
})();