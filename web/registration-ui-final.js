/* SIMANTAB_REGISTRATION_UI_FINAL_V2 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const SUPABASE_URL='https://tizxfzvgglkokzvsiwkg.supabase.co';
const SUPABASE_KEY='sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB';
let submitting=false;
function isSignup(){const n=$('nameWrap');return !!n&&!n.classList.contains('hidden')}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function show(text,type='ok'){const m=$('authMsg');if(!m)return;m.className=type==='err'?'err':'okmsg';m.textContent=text}
function headers(){return {'apikey':SUPABASE_KEY,'Content-Type':'application/json'}}
async function parseResponse(response){const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}if(!response.ok)throw new Error(data.error_description||data.msg||data.message||data.error||`HTTP ${response.status}`);return data}
async function validateSchool(npsn){const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/registration_school_lookup`,{method:'POST',headers:headers(),body:JSON.stringify({p_npsn:npsn})});const rows=await parseResponse(response);return rows?.[0]||null}
async function submitRegistration(){
 if(submitting||!isSignup())return;
 const fullName=String($('fullName')?.value||'').trim();
 const email=String($('email')?.value||'').trim();
 const password=String($('password')?.value||'');
 const role=String($('signupRole')?.value||'');
 const nip=String($('signupNip')?.value||'').replace(/\D/g,'');
 let npsn=String($('signupNpsn')?.value||'').trim();
 if(!fullName)return show('Nama lengkap wajib diisi.','err');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return show('Gunakan alamat email yang valid.','err');
 if(password.length<8)return show('Password minimal 8 karakter.','err');
 if(!['KEPALA_SEKOLAH','GTK','PENGAWAS'].includes(role))return show('Pilih jenis akun.','err');
 if(role==='PENGAWAS'&&nip.length!==18)return show('NIP Pengawas wajib 18 digit.','err');
 if(role==='KEPALA_SEKOLAH'){
  if(!/^\d{8}$/.test(npsn))return show('NPSN Kepala Sekolah wajib 8 digit.','err');
  try{const school=await validateSchool(npsn);if(!school)return show('NPSN tidak ditemukan pada Master Sekolah aktif.','err')}catch(error){return show(error?.message||'NPSN belum dapat diverifikasi.','err')}
 }else npsn='';
 submitting=true;
 const btn=$('authBtn');if(btn)btn.disabled=true;
 show('Mendaftarkan akun…','ok');
 try{
  const response=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:'POST',headers:headers(),body:JSON.stringify({email,password,data:{full_name:fullName,account_channel:'GTK',requested_role:role,nip:nip||'',school_npsn:npsn||'',registration_note:`Pendaftaran mandiri ${role} melalui SIMANTAB`}})});
  const data=await parseResponse(response);
  const pending=role!=='GTK';
  if(pending)show(`Pendaftaran berhasil. Akun ${role==='KEPALA_SEKOLAH'?'Kepala Sekolah':'Pengawas'} menunggu persetujuan Super Admin sebelum dapat login.${data?.access_token?'':' Silakan konfirmasi email jika diminta.'}`,'ok');
  else show(data?.access_token?'Pendaftaran berhasil. Silakan pilih Masuk untuk membuka SIMANTAB.':'Pendaftaran berhasil. Silakan cek email untuk konfirmasi, lalu login kembali.','ok');
 }catch(error){let message=error?.message||'Pendaftaran gagal.';if(/already|registered|exists/i.test(message))message='Email sudah terdaftar. Silakan pilih Masuk.';show(message,'err')}
 finally{submitting=false;if(btn)btn.disabled=false}
}
function apply(){
 const signup=isSignup();
 const d=$('tabDinas'),g=$('tabGtk'),box=document.querySelector('.loginbox'),sub=box?.querySelector(':scope > .small');
 if(signup){
  setText(d,'🏢 Akun Dinas oleh Admin');
  setText(g,'🏫 Daftar Sekolah / GTK / Pengawas');
  setText(sub,'Silakan isi data pendaftaran akun SIMANTAB-ONLINE.');
  if(d){d.disabled=true;d.setAttribute('aria-disabled','true');d.title='Akun Dinas dibuat oleh Admin SIMANTAB dan tidak didaftarkan mandiri.';d.style.cursor='not-allowed';d.style.opacity='.62';d.classList.remove('active')}
  if(g)g.classList.add('active');
 }else{
  setText(d,'🏢 Login Dinas');
  setText(g,'🏫 Login Sekolah / GTK / Pengawas');
  setText(sub,'Silakan login untuk mengakses layanan SIMANTAB-ONLINE.');
  if(d){d.disabled=false;d.removeAttribute('aria-disabled');d.title='';d.style.cursor='';d.style.opacity=''}
 }
}
function intercept(event){if(!isSignup())return;const target=event.target;if(event.type==='click'&&target?.closest?.('#authBtn')){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void submitRegistration()}else if(event.type==='submit'){const form=target;if(form?.querySelector?.('#authBtn')){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void submitRegistration()}}else if(event.type==='keydown'&&event.key==='Enter'&&!target?.matches?.('textarea,select,button')){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void submitRegistration()}}
function bind(){const sw=$('switchLink');if(sw&&!sw.dataset.registrationUiFinal){sw.dataset.registrationUiFinal='3';sw.addEventListener('click',()=>{setTimeout(apply,0);setTimeout(apply,250)},false)}apply()}
document.addEventListener('click',intercept,true);
document.addEventListener('submit',intercept,true);
document.addEventListener('keydown',intercept,true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{bind();setTimeout(apply,1000);setTimeout(apply,3000)}):(()=>{bind();setTimeout(apply,1000);setTimeout(apply,3000)})();
window.__simantabRegistrationUiFinal={version:3,dinasSignupDisabled:true,dedicatedSignupGuard:true};
})();
