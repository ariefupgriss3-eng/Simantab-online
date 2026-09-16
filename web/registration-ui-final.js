/* SIMANTAB_REGISTRATION_UI_FINAL_V1 */
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
 }else{
  setText(d,'🏢 Login Dinas');
  setText(g,'🏫 Login Sekolah / GTK / Pengawas');
  setText(sub,'Silakan login untuk mengakses layanan SIMANTAB-ONLINE.');
 }
}
function bind(){
 const sw=$('switchLink');
 if(sw&&!sw.dataset.registrationUiFinal){sw.dataset.registrationUiFinal='1';sw.addEventListener('click',()=>{setTimeout(apply,0);setTimeout(apply,250)},false)}
 apply();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{bind();setTimeout(apply,1000);setTimeout(apply,3000)}):(()=>{bind();setTimeout(apply,1000);setTimeout(apply,3000)})();
window.__simantabRegistrationUiFinal={version:1};
})();
