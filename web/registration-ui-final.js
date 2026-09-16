/* SIMANTAB_REGISTRATION_UI_FINAL_V2 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
function isSignup(){const n=$('nameWrap');return !!n&&!n.classList.contains('hidden')}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function apply(){
 const signup=isSignup();
 const d=$('tabDinas'),g=$('tabGtk'),box=document.querySelector('.loginbox'),sub=box?.querySelector(':scope > .small');
 if(signup){
  setText(d,'🏢 Akun Dinas oleh Admin');
  setText(g,'🏫 Daftar Sekolah / GTK / Pengawas');
  setText(sub,'Silakan isi data pendaftaran akun SIMANTAB-ONLINE.');
  if(d){
   d.disabled=true;
   d.setAttribute('aria-disabled','true');
   d.title='Akun Dinas dibuat oleh Admin SIMANTAB dan tidak didaftarkan mandiri.';
   d.style.cursor='not-allowed';
   d.style.opacity='.62';
   d.classList.remove('active');
  }
  if(g)g.classList.add('active');
 }else{
  setText(d,'🏢 Login Dinas');
  setText(g,'🏫 Login Sekolah / GTK / Pengawas');
  setText(sub,'Silakan login untuk mengakses layanan SIMANTAB-ONLINE.');
  if(d){
   d.disabled=false;
   d.removeAttribute('aria-disabled');
   d.title='';
   d.style.cursor='';
   d.style.opacity='';
  }
 }
}
function bind(){
 const sw=$('switchLink');
 if(sw&&!sw.dataset.registrationUiFinal){sw.dataset.registrationUiFinal='2';sw.addEventListener('click',()=>{setTimeout(apply,0);setTimeout(apply,250)},false)}
 apply();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{bind();setTimeout(apply,1000);setTimeout(apply,3000)}):(()=>{bind();setTimeout(apply,1000);setTimeout(apply,3000)})();
window.__simantabRegistrationUiFinal={version:2,dinasSignupDisabled:true};
})();
