/* SIMANTAB_INSTITUTION_OPERATORS_ADMIN_V2_BULK_PROVISION_LOCKED */
(async()=>{
 const ready=()=>window.__simantabSb&&window.showTab&&window.__simantabProfile?.id;
 if(!ready())await new Promise(resolve=>{
  const listener=()=>{if(ready()){window.removeEventListener('simantab:profile-ready',listener);resolve()}};
  window.addEventListener('simantab:profile-ready',listener);
 });
 const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
 const isAdmin=()=>p().role==='SUPER_ADMIN'&&p().is_active===true&&p().approval_status==='APPROVED';
 if(!isAdmin())return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let records=[],waiting=false,provisioning=false;
 function ensure(){
  if(!isAdmin())return;
  const nav=$('nav');
  if(nav&&!nav.querySelector('[data-tab="operatorInstitusi"]')){
   const b=document.createElement('button');b.type='button';b.className='navbtn';
   b.dataset.tab='operatorInstitusi';b.setAttribute('onclick',"showTab('operatorInstitusi')");
   b.innerHTML='<span class="ico">🏫</span>Operator Institusi';
   nav.appendChild(b);
  }
  const main=document.querySelector('main.content');
  if(main&&!$('operatorInstitusi')){
   const sec=document.createElement('section');sec.id='operatorInstitusi';sec.className='section';
   sec.innerHTML='<div class="head"><div><h2>Aktivasi Operator Institusi</h2><p>15 Operator Korwil dan 51 Operator SMP Negeri. Undangan hanya oleh Super Admin.</p></div></div><div id="institutionOperatorsBody"></div>';
   const footer=main.querySelector('.footer');footer?main.insertBefore(sec,footer):main.appendChild(sec);
  }
 }
 async function invoke(data){
  const {data:response,error}=await sb.functions.invoke('simantab-institution-operator-admin',{body:data});
  if(error)throw error;
  if(!response?.ok)throw new Error(response?.error||'Aktivasi belum dapat diproses');
  return response;
 }
 function lines(){
  const target=$('operatorSlotRows');if(!target)return;
  const keyword=String($('operatorSlotSearch')?.value||'').trim().toLowerCase();
  const kind=String($('operatorSlotKind')?.value||'ALL');
  const selected=records.filter(x=>(kind==='ALL'||kind===x.operator_type)&&
   (!keyword||[x.username,x.institution_name,x.district,x.school_npsn,x.invited_email].some(t=>String(t||'').toLowerCase().includes(keyword))));
  target.innerHTML=selected.length?selected.map(s=>'<tr>'+
   '<td><b>'+esc(s.institution_name)+'</b><div class="small">'+esc(s.operator_type==='KORWIL'?'Korwil Kecamatan':'SMP Negeri')+'</div></td>'+
   '<td><code>'+esc(s.username)+'</code></td>'+
   '<td>'+esc(s.district)+'<div class="small">'+esc(s.school_npsn||'Kecamatan')+'</div></td>'+
   '<td><b>'+esc(s.activation_state)+'</b><div class="small">'+esc(s.invited_email||'Tanpa email petugas')+'</div></td>'+
   '<td><span class="small">'+(s.activation_state==='RESERVED'?'Menunggu pembuatan akun':'Kredensial belum diterbitkan')+'</span></td></tr>').join(''):'<tr><td colspan="5">Tidak ada institusi sesuai filter.</td></tr>';
  // No individual recipient email is required for these institutional accounts.
 }
 function show(){
  const root=$('institutionOperatorsBody');if(!root)return;
  const kor=records.filter(x=>x.operator_type==='KORWIL').length;
  const smp=records.filter(x=>x.operator_type==='SMP').length;
  const reserved=records.filter(x=>x.activation_state==='RESERVED').length;
  const provisioned=records.filter(x=>x.activation_state==='PROVISIONED').length;
  root.innerHTML='<div class="card" style="margin-bottom:13px">'+
   '<div class="info"><b>Aktivasi bertahap dan aman.</b> Username sudah dicadangkan, tidak ada password bersama. Akun sistem disiapkan berdasarkan kecamatan atau NPSN tanpa email petugas perorangan. Password acak tidak ditampilkan. Login tetap nonaktif sampai hak akses dinyatakan lulus QA dan Super Admin menerbitkan kredensial awal secara terpisah.</div>'+
   '<div class="servicegrid" style="margin:12px 0"><div class="service"><div class="small">KORWIL</div><h3>'+kor+'</h3></div><div class="service"><div class="small">SMP NEGERI</div><h3>'+smp+'</h3></div><div class="service"><div class="small">LOGIN BELUM AKTIF</div><h3>'+(reserved+provisioned)+'</h3></div></div>'+
   '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:10px 0">'+
   '<button id="operatorProvisionAll" type="button" class="btn primary">Siapkan 66 Akun Login (Nonaktif)</button><span id="operatorProvisionProgress" class="small">'+provisioned+' akun sistem disiapkan • '+reserved+' menunggu</span>'+
   '<input id="operatorSlotSearch" placeholder="Cari kecamatan, SMP, NPSN" aria-label="Cari institusi" style="padding:9px;min-width:190px">'+
   '<select id="operatorSlotKind"><option value="ALL">Semua Institusi</option><option value="KORWIL">Operator Korwil</option><option value="SMP">Operator SMP</option></select>'+
   '<button type="button" class="btn soft" id="operatorSlotsRefresh">↻ Refresh</button></div>'+
   '<div class="tablewrap"><table><thead><tr><th>Institusi</th><th>Username</th><th>Cakupan</th><th>Status</th><th>Pengelolaan</th></tr></thead><tbody id="operatorSlotRows"></tbody></table></div>'+
   '<p class="small">Pembuatan akun Auth bukan aktivasi login. Kredensial awal baru dapat diterbitkan oleh Super Admin setelah dashboard, RLS, dan pergantian petugas diuji.</p></div>';
  $('operatorSlotSearch').addEventListener('input',lines);
  $('operatorSlotKind').addEventListener('change',lines);
  $('operatorSlotsRefresh').addEventListener('click',load);
  $('operatorProvisionAll').disabled=!reserved||provisioning;
  $('operatorProvisionAll').addEventListener('click',provisionAll);
  lines();
 }
 async function load(){
  if(waiting)return;
  waiting=true;
  const root=$('institutionOperatorsBody');if(root)root.innerHTML='<div class="card">Memuat 66 slot operator institusi...</div>';
  try{
   const response=await invoke({action:'list'});
   records=response.slots||[];
   show();
  }catch(e){
   if(root)root.innerHTML='<div class="card err">Daftar Operator Institusi tidak dapat dimuat: '+esc(e?.message||e)+'</div>';
  }finally{waiting=false}
 }
 async function provisionAll(){
  if(provisioning)return;
  if(!confirm('Siapkan 66 akun sistem Korwil/SMP berdasarkan nama institusi dan NPSN?\n\nSemua tetap NONAKTIF. Password dibuat acak oleh server, tidak dibagikan, dan tidak ada perubahan RLS/layanan produksi.'))return;
  provisioning=true;
  const button=$('operatorProvisionAll'),info=$('operatorProvisionProgress');
  if(button)button.disabled=true;
  let total=0;
  try{
   for(let i=0;i<10;i++){
    if(info)info.textContent='Menyiapkan akun institusi... ('+total+' akun baru)';
    const {data,error}=await sb.functions.invoke('simantab-institution-operator-provision',{body:{action:'provision_batch'}});
    if(error)throw error;
    if(!data||typeof data.remaining!=='number')throw new Error('Server tidak mengembalikan status yang sah');
    total+=Number(data.created||0);
    if(info)info.textContent='Berhasil dibuat '+total+' akun; tersisa '+data.remaining+'. Semua login terkunci.';
    if(data.failures?.length){const sample=data.failures.slice(0,3).map(x=>x.username+': '+x.error).join('\n');throw new Error('Terdapat '+data.failures.length+' kegagalan.\n'+sample+'\nProses dihentikan, slot berhasil tidak akan digandakan.');}
    if(data.remaining===0)break;
    if(Number(data.created||0)===0)throw new Error('Belum ada progres; periksa status Supabase');
   }
   alert('Penyiapan selesai. '+total+' identitas Auth baru dibuat melalui Supabase Admin API. Tidak ada kredensial yang diterbitkan; login tetap terkunci.');
  }catch(e){
   alert('Proses berhenti dengan aman. '+(e?.message||String(e))+'\nSlot yang berhasil dibuat tetap tersimpan; tombol dapat digunakan kembali setelah diperiksa.');
  }finally{provisioning=false;await load();}
 }
 async function invite(username){
  const slot=records.find(s=>s.username===username);
  if(!slot||slot.activation_state!=='RESERVED')return;
  const recipient=prompt('Email penerima resmi untuk '+slot.institution_name+':');
  if(!recipient)return;
  const email=recipient.trim().toLowerCase();
  const retype=prompt('Ketik ulang email penerima untuk memastikan tidak salah kirim:');
  if(!retype||retype.trim().toLowerCase()!==email){alert('Email tidak cocok. Undangan dibatalkan.');return}
  if(!confirm('Pastikan penetapan operator telah diverifikasi.\nInstitusi: '+slot.institution_name+'\nUsername: '+username+'\nEmail: '+email+'\n\nKirim undangan? Akun tetap NONAKTIF sampai disetujui dan diverifikasi.'))return;
  try{
   const r=await invoke({action:'invite',username,confirm_username:username,recipient_email:email,confirm_email:email,operator_assigned:true});
   alert('Undangan sudah diproses untuk '+r.username+'. Login operator masih dinonaktifkan.');
   await load();
  }catch(e){alert('Undangan gagal: '+(e?.message||String(e)))}
 }
 const old=window.showTab;
 window.showTab=async function(id){
  ensure();
  const v=await old.apply(this,arguments);
  if(id==='operatorInstitusi'&&$('operatorInstitusi')?.classList.contains('active'))await load();
  return v;
 };
 ensure();
 for(const delay of [250,1000,2500])setTimeout(ensure,delay);
 window.addEventListener('simantab:profile-ready',ensure);
 window.__simantabOperatorAdmin={version:2,adminOnly:true,bulkProvision:true,safeInvitations:true,activationDisabled:true};
})();