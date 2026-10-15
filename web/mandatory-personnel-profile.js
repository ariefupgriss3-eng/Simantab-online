/* SIMANTAB_PROFILE_WAJIB_LENGKAP_V1_CLOUDFLARE */
(()=>{
 'use strict';
 const PERSONAL_ROLES=new Set(['GTK','KEPALA_SEKOLAH','PENGAWAS','KORWIL']);
 const READ_FIELDS='id,full_name,nip,pangkat,golongan_ruang,unit,address,phone,role,approval_status,is_active';
 const state={userId:null,profile:null,loading:false,blocked:false,saving:false,error:''};
 const $=id=>document.getElementById(id);
 const getProfile=()=>window.__simantabProfile||null;
 const client=()=>window.__simantabSb||null;
 const eligible=()=>PERSONAL_ROLES.has(String(getProfile()?.role||'').toUpperCase());
 const trim=x=>String(x??'').trim();
 const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalizePhone=x=>trim(x).replace(/[\s().-]/g,'');
 function missingFields(v){
   const missing=[];
   if(trim(v?.full_name).length<3)missing.push('Nama lengkap beserta gelar');
   if(!/^\d{18}$/.test(trim(v?.nip)))missing.push('NIP 18 digit');
   if(trim(v?.pangkat).length<2)missing.push('Pangkat');
   if(trim(v?.golongan_ruang).length<2)missing.push('Golongan/ruang');
   if(trim(v?.unit).length<3)missing.push('Unit kerja');
   if(trim(v?.address).length<8)missing.push('Alamat lengkap');
   if(!/^(?:\+62|62|0)8\d{7,12}$/.test(normalizePhone(v?.phone)))missing.push('Nomor WhatsApp aktif');
   return missing;
 }
 function field(id,label,value,attr=''){
   return '<div class="field"><label for="'+id+'">'+label+' <strong style="color:#b42318">*</strong></label>'+
     '<input id="'+id+'" value="'+escapeHtml(value)+'" '+attr+' required></div>';
 }
 function renderPanel(force=false){
   if(!eligible()){ $('simantabRequiredProfilePanel')?.remove(); return; }
   const body=$('profileBody');if(!body)return;
   const parent=body.querySelector('.grid')||body;
   let panel=$('simantabRequiredProfilePanel');
   if(panel&&!force)return;
   if(!panel){panel=document.createElement('div');panel.id='simantabRequiredProfilePanel';panel.className='card s12';parent.prepend(panel);}
   if(state.loading&&!state.profile){
     panel.innerHTML='<h3 style="margin-top:0">🪪 Profil Kepegawaian Wajib</h3><p>Memeriksa kelengkapan data profil...</p>';
     return;
   }
   const v=state.profile||getProfile()||{};
   const missing=missingFields(v);
   const heading='<h3 style="margin-top:0">🪪 Profil Kepegawaian Wajib</h3>'+
     '<p class="small">Lengkapi tujuh data wajib sesuai dokumen kepegawaian. Sebelum lengkap dan tersimpan, menu layanan lainnya belum bisa dibuka.</p>';
   const notice=state.error?'<div class="err" role="alert">'+escapeHtml(state.error)+'</div>':
     (missing.length?'<div class="info" role="status"><b>Masih perlu dilengkapi:</b> '+escapeHtml(missing.join(', '))+'.</div>':
       '<div class="okmsg" role="status">Seluruh isian sudah lengkap. Data dapat diperbarui melalui formulir ini.</div>');
   panel.innerHTML=heading+notice+
    '<form id="simPersonnelProfileForm" autocomplete="on"><div class="formrow">'+
      field('simPersonnelFullName','Nama lengkap dan gelar',v.full_name,'autocomplete="name" maxlength="200"')+
      field('simPersonnelNip','NIP',v.nip,'inputmode="numeric" pattern="[0-9]{18}" minlength="18" maxlength="18" autocomplete="off"')+
      field('simPersonnelPangkat','Pangkat',v.pangkat,'placeholder="Contoh: Pembina" maxlength="100"')+
      field('simPersonnelGolongan','Golongan/ruang',v.golongan_ruang,'placeholder="Contoh: IV/a" maxlength="35"')+
      field('simPersonnelUnit','Unit kerja',v.unit,'placeholder="Nama sekolah/satuan kerja" maxlength="200"')+
      '<div class="field"><label for="simPersonnelAddress">Alamat lengkap <strong style="color:#b42318">*</strong></label><textarea id="simPersonnelAddress" rows="3" maxlength="700" required>'+escapeHtml(v.address)+'</textarea></div>'+
      field('simPersonnelWa','Nomor WhatsApp',v.phone,'type="tel" inputmode="tel" autocomplete="tel" placeholder="Contoh: 081234567890" maxlength="20"')+
    '</div><p class="small">Gunakan NIP 18 angka dan nomor WA Indonesia yang aktif (08... atau +628...). Semua kolom bertanda * wajib diisi.</p>'+
    '<button id="simPersonnelSaveBtn" type="submit" class="btn primary">💾 Simpan Profil dan Buka Layanan</button>'+
    '<div id="simPersonnelProfileMsg" class="small" role="status" aria-live="polite" style="margin-top:10px"></div></form>';
   $('simPersonnelProfileForm')?.addEventListener('submit',async e=>{e.preventDefault();await saveProfile();});
 }
 function collectForm(){
   const value=id=>trim($(id)?.value);
   return {full_name:value('simPersonnelFullName'),nip:value('simPersonnelNip'),pangkat:value('simPersonnelPangkat'),
     golongan_ruang:value('simPersonnelGolongan'),unit:value('simPersonnelUnit'),address:value('simPersonnelAddress'),
     phone:normalizePhone(value('simPersonnelWa'))};
 }
 function showMessage(message,isError=false){
   const box=$('simPersonnelProfileMsg');
   if(box){box.className=isError?'err':'okmsg';box.textContent=message;}
 }
 async function saveProfile(){
   if(!eligible()||state.saving||state.loading)return;
   const sb=client();
   if(!sb){showMessage('Koneksi database belum tersedia. Muat ulang halaman.',true);return;}
   const payload=collectForm();
   const missing=missingFields(payload);
   if(missing.length){showMessage('Lengkapi atau perbaiki: '+missing.join(', ')+'.',true);return;}
   state.saving=true;
   const button=$('simPersonnelSaveBtn');
   if(button)button.disabled=true;
   showMessage('Menyimpan dan memeriksa profil...');
   try{
     const {data:auth,error:authError}=await sb.auth.getUser();
     const userId=auth?.user?.id;
     if(authError||!userId||userId!==getProfile()?.id||userId!==state.userId)
       throw new Error('Sesi akun tidak sesuai. Keluar lalu masuk kembali untuk mengubah profil.');
     const {data:current,error:currentError}=await sb.from('profiles')
       .select('id,approval_status,is_active,role').eq('id',userId).single();
     if(currentError||!current||current.is_active!==true||current.approval_status!=='APPROVED')
       throw new Error('Status akun tidak dapat diverifikasi atau belum disetujui. Hubungi Super Admin.');
     if(!PERSONAL_ROLES.has(String(current.role||'').toUpperCase()))
       throw new Error('Hak akses akun berubah. Silakan masuk ulang.');
     const {data:saved,error:saveError}=await sb.from('profiles').update(payload).eq('id',userId).select(READ_FIELDS).single();
     if(saveError)throw saveError;
     if(!saved||saved.id!==userId||missingFields(saved).length)
       throw new Error('Profil belum tersimpan lengkap di database. Periksa isian dan coba kembali.');
     state.profile=saved;state.blocked=false;state.error='';
     showMessage('✅ Profil tersimpan dan terverifikasi. Menyegarkan aplikasi untuk membuka layanan...');
     window.setTimeout(()=>window.location.reload(),700);
   }catch(e){
     state.blocked=true;
     showMessage('Gagal menyimpan: '+trim(e?.message||e),true);
   }finally{
     state.saving=false;
     if(button)button.disabled=false;
   }
 }
 function releaseProfileNav(){
   if(!eligible())return;
   document.querySelectorAll('#nav .navbtn[data-tab="profile"],#pengawasStableNav [data-tab="profile"]')
    .forEach(btn=>{if(btn.disabled)btn.disabled=false;});
 }
 async function loadProfile(){
   if(!eligible()){state.userId=null;state.profile=null;state.blocked=false;state.loading=false;return;}
   const p=getProfile(),sb=client();
   if(!p?.id||!sb)return;
   state.userId=p.id;state.profile=null;state.loading=true;state.blocked=true;state.error='';
   releaseProfileNav();
   await window.showTab('profile');
   renderPanel(true);
   try{
     const {data,error}=await sb.from('profiles').select(READ_FIELDS).eq('id',p.id).single();
     if(error)throw error;
     if(!data||data.id!==getProfile()?.id)throw new Error('Identitas profil tidak sesuai akun yang login.');
     state.profile=data;
     state.blocked=missingFields(data).length>0;
     if(!data.is_active||data.approval_status!=='APPROVED')state.blocked=true;
   }catch(e){
     state.profile={...p,pangkat:'',golongan_ruang:'',address:p.address||'',phone:p.phone||''};
     state.blocked=true;
     state.error='Data profil belum dapat diperiksa: '+trim(e?.message||e)+'. Coba masuk ulang atau hubungi admin.';
   }finally{
     state.loading=false;
     renderPanel(true);
     releaseProfileNav();
     if(!state.blocked&&state.profile)await window.showTab('dashboard');
   }
 }
 const oldShowTab=window.showTab;
 if(typeof oldShowTab==='function')window.showTab=async function(id,...args){
   const target=(eligible()&&(state.blocked||state.loading))?'profile':id;
   const result=await oldShowTab.call(this,target,...args);
   if(target==='profile'){renderPanel();releaseProfileNav();}
   return result;
 };
 const oldOpenSubmission=window.openSubmission;
 if(typeof oldOpenSubmission==='function')window.openSubmission=function(...args){
   if(eligible()&&(state.blocked||state.loading)){
     window.showTab('profile');
     return;
   }
   return oldOpenSubmission.apply(this,args);
 };
 // Covers dashboard shortcuts and dynamically generated service buttons, too.
 document.addEventListener('click',e=>{
   if(!eligible()||!(state.blocked||state.loading)||!$('app')?.contains(e.target))return;
   const control=e.target?.closest?.('button,a,[role="button"]');
   if(!control||control.closest('#profile')||control.matches('[onclick*="logout("]')||
      control.matches('[data-tab="profile"]')||control.closest('#simantabRequiredProfilePanel'))return;
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   window.showTab('profile');
 },true);
 window.addEventListener('simantab:profile-ready',()=>{loadProfile().catch(e=>{state.loading=false;state.blocked=true;state.error=trim(e?.message||e);renderPanel(true);});});
 if(getProfile()?.id)setTimeout(()=>loadProfile(),0);
 window.simantabSavePersonnelProfile=saveProfile;
 window.__simantabMandatoryPersonnelProfile={version:1,roles:[...PERSONAL_ROLES],missingFields,isBlocked:()=>eligible()&&(state.blocked||state.loading)};
})();
