/* SIMANTAB_REGISTRATION_UI_FINAL_V6 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const SUPABASE_URL='https://tizxfzvgglkokzvsiwkg.supabase.co';
const SUPABASE_KEY='sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB';
let submitting=false;
function isSignup(){const n=$('nameWrap');return !!n&&!n.classList.contains('hidden')}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function show(text,type='ok'){const m=$('authMsg');if(!m)return;m.className=type==='err'?'err':'okmsg';m.textContent=text}
function headers(){return {'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'}}
async function parseResponse(response){const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}if(!response.ok)throw new Error(data.error_description||data.msg||data.message||data.error||`HTTP ${response.status}`);return data}
async function validateSchool(npsn){const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/registration_school_lookup`,{method:'POST',headers:headers(),body:JSON.stringify({p_npsn:npsn})});const rows=await parseResponse(response);return rows?.[0]||null}
async function registerAccount(payload){const response=await fetch(`${SUPABASE_URL}/functions/v1/simantab-register-pending`,{method:'POST',headers:headers(),body:JSON.stringify(payload)});return parseResponse(response)}
function ensureIdentityFields(){
 const extra=$('signupExtra'),nipInput=$('signupNip');
 if(!extra||!nipInput)return;
 const nipField=nipInput.closest('.field');
 if(!nipField)return;
 if(!$('signupUnit')){
  const field=document.createElement('div');field.className='field';
  field.innerHTML='<label for="signupUnit">Unit Kerja *</label><input id="signupUnit" type="text" maxlength="160" autocomplete="organization" placeholder="Nama sekolah, Korwil, atau instansi" required>';
  nipField.insertAdjacentElement('beforebegin',field);
 }
 if(!$('signupEmploymentStatus')){
  const field=document.createElement('div');field.className='field';
  field.innerHTML='<label for="signupEmploymentStatus">Status Kepegawaian *</label><select id="signupEmploymentStatus" required><option value="">Pilih status kepegawaian</option><option value="PNS">PNS (ASN)</option><option value="PPPK">PPPK (ASN)</option><option value="PPPK_PARUH_WAKTU">PPPK Paruh Waktu (ASN)</option><option value="NON_ASN">Non-ASN</option></select>';
  nipField.insertAdjacentElement('beforebegin',field);
  $('signupEmploymentStatus').addEventListener('change',refreshNipRule);
 }
 if(!$('signupNip').dataset.asnRuleBound){
  nipInput.dataset.asnRuleBound='1';
  $('signupRole')?.addEventListener('change',refreshNipRule);
 }
 refreshNipRule();
}
function refreshNipRule(){
 const employee=String($('signupEmploymentStatus')?.value||'');
 const role=String($('signupRole')?.value||'');
 const required=['PNS','PPPK','PPPK_PARUH_WAKTU'].includes(employee)||role==='PENGAWAS';
 const input=$('signupNip'),label=input?.closest('.field')?.querySelector('label');
 if(input){
  input.required=isSignup()&&required;
  input.setAttribute('inputmode','numeric');
  input.setAttribute('pattern','[0-9]{18}');
  input.setAttribute('maxlength','18');
  input.placeholder=required?'Wajib 18 digit untuk ASN':'Opsional bagi non-ASN (18 digit jika diisi)';
 }
 if(label)label.textContent=required?'NIP * (18 digit)':'NIP (opsional untuk non-ASN)';
}
async function submitRegistration(){
 if(submitting||!isSignup())return;
 const fullName=String($('fullName')?.value||'').trim();
 const email=String($('email')?.value||'').trim().toLowerCase();
 const password=String($('password')?.value||'');
 const role=String($('signupRole')?.value||'');
 const unit=String($('signupUnit')?.value||'').trim();
 const employmentStatus=String($('signupEmploymentStatus')?.value||'');
 const rawNip=String($('signupNip')?.value||'').trim();
 const nip=rawNip.replace(/\D/g,'');
 let npsn=String($('signupNpsn')?.value||'').trim();
 if(!fullName)return show('Nama lengkap wajib diisi.','err');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return show('Gunakan alamat email yang valid.','err');
 if(password.length<8)return show('Password minimal 8 karakter.','err');
 if(!['KEPALA_SEKOLAH','GTK','PENGAWAS'].includes(role))return show('Pilih jenis akun.','err');
 if(unit.length<3||unit.length>160)return show('Unit Kerja wajib diisi (3–160 karakter).','err');
 if(!['PNS','PPPK','PPPK_PARUH_WAKTU','NON_ASN'].includes(employmentStatus))return show('Pilih status kepegawaian.','err');
 if(rawNip&&(!/^\d{18}$/.test(rawNip)))return show('NIP hanya boleh berisi tepat 18 angka.','err');
 if((employmentStatus!=='NON_ASN'||role==='PENGAWAS')&&!/^\d{18}$/.test(nip))return show('NIP 18 digit wajib untuk seluruh ASN dan Pengawas.','err');
 if(role==='KEPALA_SEKOLAH'){
  if(!/^\d{8}$/.test(npsn))return show('NPSN Kepala Sekolah wajib 8 digit.','err');
  try{const school=await validateSchool(npsn);if(!school)return show('NPSN tidak ditemukan pada Master Sekolah aktif.','err')}catch(error){return show(error?.message||'NPSN belum dapat diverifikasi.','err')}
 }else npsn='';
 submitting=true;
 const btn=$('authBtn');if(btn)btn.disabled=true;
 show('Mendaftarkan akun…','ok');
 try{
  const payload={email,password,full_name:fullName,role,unit,employment_status:employmentStatus,nip:nip||'',school_npsn:npsn||''};
  await registerAccount(payload);
  if(role==='KEPALA_SEKOLAH'||role==='PENGAWAS'){
   show(`Pendaftaran berhasil. Akun ${role==='KEPALA_SEKOLAH'?'Kepala Sekolah':'Pengawas'} sudah tercatat dan menunggu persetujuan Super Admin. Tidak perlu menunggu email konfirmasi.`,'ok');
  }else{
   show('Pendaftaran GTK berhasil. Akun siap digunakan tanpa menunggu email konfirmasi. Silakan pilih Masuk.','ok');
  }
 }catch(error){let message=error?.message||'Pendaftaran gagal.';if(/already|registered|exists/i.test(message))message='Email sudah terdaftar. Silakan pilih Masuk atau tunggu persetujuan Super Admin sesuai jenis akun.';show(message,'err')}
 finally{submitting=false;if(btn)btn.disabled=false}
}
function apply(){
 ensureIdentityFields();
 const signup=isSignup();
 if($('signupUnit'))$('signupUnit').required=signup;
 if($('signupEmploymentStatus'))$('signupEmploymentStatus').required=signup;
 refreshNipRule();
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
function bind(){const sw=$('switchLink');if(sw&&!sw.dataset.registrationUiFinal){sw.dataset.registrationUiFinal='6';sw.addEventListener('click',()=>{setTimeout(apply,0);setTimeout(apply,250)},false)}apply()}
document.addEventListener('click',intercept,true);
document.addEventListener('submit',intercept,true);
document.addEventListener('keydown',intercept,true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{bind();setTimeout(apply,1000);setTimeout(apply,3000)}):(()=>{bind();setTimeout(apply,1000);setTimeout(apply,3000)})();
window.__simantabRegistrationUiFinal={version:6,dinasSignupDisabled:true,dedicatedSignupGuard:true,allGtkServerRegistration:true};
})();
