/* SIMANTAB_STAFF_SERVICE_ROLES_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<120&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const STAFF_ROLES={
 STAFF_KGB:'Staf Gaji Berkala',
 STAFF_KP_EKIN:'Staf KP/PAK/Jabfung/SKP-PAK',
 STAFF_PROMOSI:'Staf Promosi Karir',
 STAFF_ARSIP:'Staf Arsip & Aset',
 STAFF_SKP:'Staf SKP',
 STAFF_PENSIUN:'Staf Pensiun/Berhenti',
 STAFF_CUTI:'Staf Izin Cuti/Sakit/Umroh',
 STAFF_SPJ_SIMTENDIK:'Staf Simtendik',
 STAFF_USUL_SK:'Staf Usul Penerbitan SK'
};
const expandedDinas=['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_DINAS','STAFF_TPG',...Object.keys(STAFF_ROLES),'PENGAWAS'];
const isExpandedStaff=()=>Object.hasOwn(STAFF_ROLES,window.__simantabProfile?.role||'');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
function addCreatorOptions(){const sel=$('newDinasRole');if(!sel)return;for(const [value,label] of Object.entries(STAFF_ROLES)){if(sel.querySelector(`option[value="${value}"]`))continue;const o=document.createElement('option');o.value=value;o.textContent=label;const peng=sel.querySelector('option[value="PENGAWAS"]');if(peng)sel.insertBefore(o,peng);else sel.appendChild(o)}}
function credentialCard(){if(!isExpandedStaff()||!$('profileBody')||$('serviceStaffCredentialCard')||$('dinasCredentialCard'))return;const p=window.__simantabProfile||{},wrap=document.createElement('div');wrap.id='serviceStaffCredentialCard';wrap.className='card';wrap.style.marginTop='12px';wrap.innerHTML=`<h3 style="margin-top:0">🔐 Username & Password Login</h3>${p.must_change_password?'<div class="notice" style="margin-bottom:10px"><b>Login pertama:</b> password sementara wajib diganti sebelum menggunakan menu lain.</div>':''}<div class="grid"><div class="field s6"><label>Username</label><input id="staffLoginUsername" value="${esc(p.login_username||'')}" placeholder="username"></div><div class="field s6"><label>Password baru</label><input id="staffNewPassword" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter"></div><div class="field s6"><label>Ulangi password baru</label><input id="staffConfirmPassword" type="password" autocomplete="new-password" placeholder="Ulangi password"></div></div><button class="btn primary" onclick="saveServiceStaffCredentials()">💾 Simpan Username / Password</button><div id="staffCredentialMsg"></div>`;$('profileBody').appendChild(wrap)}
window.saveServiceStaffCredentials=async()=>{if(!isExpandedStaff())return;const username=$('staffLoginUsername').value.trim().toLowerCase(),password=$('staffNewPassword').value,confirm=$('staffConfirmPassword').value,msg=$('staffCredentialMsg'),p=window.__simantabProfile||{};if(!/^[A-Za-z0-9._-]{3,32}$/.test(username)){msg.className='err';msg.textContent='Username harus 3–32 karakter.';return}if(password&&password.length<8){msg.className='err';msg.textContent='Password baru minimal 8 karakter.';return}if(p.must_change_password&&!password){msg.className='err';msg.textContent='Pada login pertama, password baru wajib diisi.';return}if(password!==confirm){msg.className='err';msg.textContent='Ulangi password tidak sama.';return}msg.className='small';msg.textContent='Menyimpan...';const {data:{session}}=await sb.auth.getSession();const {data,error}=await sb.functions.invoke('simantab-account-settings',{body:{username,password:password||undefined},headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}});if(error||!data?.ok){let detail=data?.error||'';try{detail=detail||(await error?.context?.clone?.().json())?.error||''}catch(_){}msg.className='err';msg.textContent=detail||error?.message||'Gagal menyimpan.';return}window.__simantabProfile={...p,...data.profile};msg.className='okmsg';msg.textContent='Username/password berhasil diperbarui.';setTimeout(()=>location.reload(),700)};
const oldShow=window.showTab;window.showTab=async id=>{const p=window.__simantabProfile;if(p?.must_change_password&&expandedDinas.includes(p.role)&&id!=='profile')id='profile';await oldShow(id);await wait(40);if(id==='users')addCreatorOptions();if(id==='profile')credentialCard()};
for(let i=0;i<80&&!window.__simantabProfile;i++)await wait(100);
if($('newDinasRole'))addCreatorOptions();
if(isExpandedStaff()){if(window.__simantabProfile?.must_change_password)await window.showTab('profile');else if(document.querySelector('.section.active')?.id==='profile')credentialCard()}
})();