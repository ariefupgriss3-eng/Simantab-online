/* SIMANTAB_PENGAWAS_NIP_TCS_LINK_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};if(!sb)return;
const isSuper=()=>p().role==='SUPER_ADMIN'&&p().is_admin===true;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function checkTcsNip(){
 const nip=String($('newDinasNip')?.value||'').replace(/\D/g,''),role=$('newDinasRole')?.value||'',m=$('newDinasTcsMatch');if(!m)return;
 if(role!=='PENGAWAS'){m.innerHTML='<span class="small">NIP wajib khusus Role Pengawas.</span>';return}
 if(nip.length!==18){m.innerHTML='<span class="small">Masukkan NIP Pengawas 18 digit.</span>';return}
 m.innerHTML='<span class="small">Memeriksa referensi TCS...</span>';
 const {data,error}=await sb.from('tcs_sd_dabin_reference').select('supervisor_name,supervisor_nip,district,school_npsn').eq('supervisor_nip',nip).eq('is_active',true).limit(200);
 if(error){m.innerHTML=`<span class="err">${esc(error.message)}</span>`;return}
 const rows=data||[],districts=[...new Set(rows.map(x=>x.district).filter(Boolean))];
 m.innerHTML=rows.length?`<div class="okmsg">✅ <b>Tertaut TCS:</b> ${esc(rows[0].supervisor_name)}<br><span class="small">${rows.length} SD binaan${districts.length?' • '+esc(districts.join(', ')):''}</span></div>`:'<div class="notice">NIP belum ditemukan pada referensi Pengawas Dabin SD TCS. Akun tetap dapat dibuat jika Pengawas bukan Dabin SD.</div>';
}
function ensureField(){
 if(!isSuper())return;const box=$('dinasAccountCreator');if(!box||$('newDinasNip'))return;
 const roleField=$('newDinasRole')?.closest('.field');if(!roleField)return;
 const f=document.createElement('div');f.className='field s4';f.innerHTML='<label>NIP <span id="newDinasNipReq" class="small"></span></label><input id="newDinasNip" inputmode="numeric" maxlength="18" placeholder="18 digit"><div id="newDinasTcsMatch" class="small" style="margin-top:5px"></div>';roleField.insertAdjacentElement('beforebegin',f);
 const role=$('newDinasRole'),nip=$('newDinasNip');
 const refresh=()=>{const req=$('newDinasNipReq');if(req)req.textContent=role?.value==='PENGAWAS'?'(wajib untuk Pengawas)':'(opsional)';checkTcsNip()};
 role?.addEventListener('change',refresh);nip?.addEventListener('input',()=>{nip.value=nip.value.replace(/\D/g,'').slice(0,18);clearTimeout(window.__simantabTcsNipTimer);window.__simantabTcsNipTimer=setTimeout(checkTcsNip,250)});refresh();
}
const original=window.createDinasAccount;
window.createDinasAccount=async()=>{
 if(!isSuper())return;ensureField();
 const full_name=$('newDinasName')?.value.trim()||'',username=$('newDinasUsername')?.value.trim().toLowerCase()||'',password=$('newDinasPassword')?.value||'',role=$('newDinasRole')?.value||'',unit=$('newDinasUnit')?.value.trim()||'',position=$('newDinasPosition')?.value.trim()||'',nip=String($('newDinasNip')?.value||'').replace(/\D/g,''),m=$('newDinasMsg');
 if(!m)return original?.();
 if(!full_name||!/^[A-Za-z0-9._-]{3,32}$/.test(username)||password.length<8){m.className='err';m.textContent='Isi nama, username 3–32 karakter, dan password sementara minimal 8 karakter.';return}
 if(role==='PENGAWAS'&&!/^\d{18}$/.test(nip)){m.className='err';m.textContent='NIP Pengawas wajib diisi 18 digit agar dapat ditautkan dengan Dabin TCS.';return}
 if(nip&&!/^\d{18}$/.test(nip)){m.className='err';m.textContent='NIP harus 18 digit.';return}
 m.className='small';m.textContent='Membuat akun dan menautkan referensi TCS...';
 const {data:{session}}=await sb.auth.getSession();
 const {data,error}=await sb.functions.invoke('simantab-admin-create-dinas-user',{body:{full_name,username,password,role,unit,position,nip},headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}});
 if(error||!data?.ok){let detail=data?.error||'';try{detail=detail||(await error?.context?.clone?.().json())?.error||''}catch(_){}m.className='err';m.textContent=detail||error?.message||'Gagal membuat akun.';return}
 m.className='okmsg';m.innerHTML=`<b>Akun berhasil dibuat.</b><br>Username: <b>${esc(username)}</b>${nip?`<br>NIP: <b>${esc(nip)}</b>`:''}${role==='PENGAWAS'?`<br>${data.tcs_sd_dabin_match?'✅ Tertaut dengan Dabin SD TCS':'ℹ️ Belum memiliki relasi Dabin SD TCS'}`:''}`;
};
const obs=new MutationObserver(()=>ensureField());obs.observe(document.documentElement,{childList:true,subtree:true});ensureField();
})();