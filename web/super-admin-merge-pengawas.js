/* SIMANTEB_SUPER_ADMIN_MERGE_PENGAWAS_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const isSuper=()=>window.__simantabProfile?.role==='SUPER_ADMIN'&&window.__simantabProfile?.is_admin===true;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function install(){
 if(!isSuper()||!$('usersBody')||$('mergePengawasCard'))return;
 const card=document.createElement('div');card.id='mergePengawasCard';card.className='card';card.style.marginBottom='12px';
 card.innerHTML=`<h3 style="margin-top:0">🔗 Gabungkan / Konversi ke Pengawas</h3>
 <div class="info" style="margin-bottom:10px"><b>Gunakan bila satu orang memiliki akun GTK dan akun Pengawas terpisah.</b><br>Sistem memindahkan identitas Pengawas (NIP, jabatan, username), mengalihkan riwayat yang terhubung, lalu menonaktifkan akun Pengawas duplikat. Akun email target menjadi akun utama dengan role <b>PENGAWAS</b>.</div>
 <div class="grid">
  <div class="field s6"><label>Email akun yang akan dipakai</label><input id="mergePengawasEmail" type="email" value="juremi@gmail.com" placeholder="email akun GTK yang dipakai"></div>
  <div class="field s6"><label>Username akun Pengawas sumber</label><input id="mergePengawasUsername" value="juremi" placeholder="contoh: juremi"></div>
 </div>
 <button class="btn primary" onclick="mergePengawasAccount()">🔗 Gabungkan Menjadi Pengawas</button>
 <div id="mergePengawasMsg" style="margin-top:8px"></div>`;
 $('usersBody').prepend(card);
}
window.mergePengawasAccount=async()=>{
 if(!isSuper())return;
 const email=String($('mergePengawasEmail')?.value||'').trim().toLowerCase(),username=String($('mergePengawasUsername')?.value||'').trim().toLowerCase(),msg=$('mergePengawasMsg');
 if(!email.includes('@')||!username){msg.className='err';msg.textContent='Isi email target dan username Pengawas sumber.';return}
 if(!confirm(`Gabungkan akun ${email} dengan akun Pengawas ${username}?\n\nAkun email akan menjadi akun utama Pengawas dan akun sumber akan dinonaktifkan.`))return;
 msg.className='small';msg.textContent='Menggabungkan akun...';
 const {data,error}=await sb.rpc('super_admin_merge_pengawas_account',{p_target_email:email,p_source_username:username});
 if(error){msg.className='err';msg.textContent=error.message||'Gagal menggabungkan akun.';return}
 msg.className='okmsg';msg.innerHTML=`<b>Berhasil.</b> Akun <b>${esc(email)}</b> sekarang menjadi <b>PENGAWAS</b> dengan username <b>${esc(username)}</b>. Akun Pengawas duplikat telah dinonaktifkan.<br><span class="small">Pengguna perlu keluar lalu masuk kembali melalui Login Sekolah / GTK / Pengawas agar menu Pengawas dimuat.</span>`;
 try{await window.showTab('users')}catch(_){ }
 setTimeout(install,120);
};
const prevShow=window.showTab;window.showTab=async id=>{const r=await prevShow(id);if(id==='users'){await wait(80);install()}return r};
install();
})();