/* SIMANTAB_DIKLAT_KS_BCKS_V2 */
/* SIMANTAB_DIKLAT_KS_BCKS_V3 */
/* SIMANTAB_DIKLAT_KS_BCKS_V4 */
/* SIMANTAB_DIKLAT_KS_BCKS_V5 */
/* SIMANTAB_DIKLAT_KS_BCKS_V6 */
/* SIMANTAB_DIKLAT_KS_BCKS_V7 */
/* SIMANTAB_DIKLAT_KS_BCKS_V8 */
/* SIMANTAB_DIKLAT_KS_BCKS_V9 */
/* SIMANTAB_DIKLAT_KS_BCKS_V10 */
/* SIMANTAB_DIKLAT_KS_BCKS_V11 */
/* SIMANTAB_DIKLAT_KS_BCKS_V12_DIRECT_KABID */
/* SIMANTAB_DIKLAT_KS_BCKS_V13_SUPERADMIN_RESET_DRAFT */
/* SIMANTAB_DIKLAT_KS_BCKS_V14_PARTICIPANT_SEARCH */
/* SIMANTAB_DIKLAT_KS_BCKS_V15_PAKTA_UPLOAD_FALLBACK */
/* SIMANTAB_DIKLAT_KS_BCKS_V16_FIXED_KABID_COMMENT */
/* SIMANTAB_DIKLAT_KS_BCKS_V17_PERSIST_KABID_APPROVAL */
/* SIMANTAB_DIKLAT_KS_BCKS_V18_TOTAL_PENGUSUL */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),profile=()=>window.__simantabProfile||{};
if(!sb||!window.showTab)return;
const FILE_LIMIT=512000,BUCKET='simantab-documents';
const REQUIREMENTS=[
 ['SKP_1','SKP 1'],
 ['SKP_2','SKP 2'],
 ['SK_PENGALAMAN_MANAJERIAL','SK Pengalaman Manajerial'],
 ['SK_HUDIS','SK Bebas Hudis'],
 ['SKCK','SKCK'],
 ['PAKTA_INTEGRITAS','Pakta Integritas'],
 ['SURAT_PERNYATAAN_DIKLAT','Surat Pernyataan Bermeterai Bersedia Mengikuti Seluruh Proses Diklat KS']
];
const REVIEW_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
const LEADER_ROLES=new Set(['KEPALA_DINAS','SEKRETARIS_DINAS']);
const COORD_ROLES=new Set(['KASI_SD','KASI_SMP','SUBKOOR_TK']);
const COORD_SCOPE={KASI_SD:'SD',KASI_SMP:'SMP',SUBKOOR_TK:'TK_PAUD_PNF'};
const KSB_FLOW_LABEL={
 MENUNGGU_DISPOSISI_KOORDINATOR:'Bagi Tugas',
 VERIFIKASI_STAF:'Verifikasi Admin',
 MENUNGGU_PERSETUJUAN_KABID:'Persetujuan Kabid',
 PERBAIKAN:'Perbaikan',
 SELESAI:'Selesai / Naik Level'
};
const isReviewer=()=>REVIEW_ROLES.has(profile().role)||String(profile().username||'').toLowerCase()==='kasim';
const isSuperAdmin=()=>profile().role==='SUPER_ADMIN';
const isLeader=()=>LEADER_ROLES.has(profile().role);
const isKabid=()=>profile().role==='KABID';
const isCoordinator=()=>COORD_ROLES.has(profile().role);
const isApplicant=()=>['GTK','KEPALA_SEKOLAH'].includes(profile().role);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate=v=>v?new Date(v).toLocaleDateString('id-ID'):'-';
const fmtDateTime=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';

function ensureKsbAssignStyle(){
 if($('ksbAssignStyle'))return;
 const s=document.createElement('style');s.id='ksbAssignStyle';s.textContent=`
 .ksb-staff-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:310px;overflow:auto;padding:4px}
 .ksb-staff-option{display:grid!important;grid-template-columns:22px minmax(0,1fr);gap:10px!important;align-items:start!important;margin:0!important;padding:11px 12px!important;border:1px solid #dbe3ec;border-radius:12px;background:#fff;cursor:pointer;line-height:1.25}
 .ksb-staff-option:hover{background:#f5f9ff;border-color:#aac8e8}
 .ksb-staff-option:has(input:checked){background:#edf6ff;border-color:#4b91d1;box-shadow:0 0 0 1px #4b91d122}
 .ksb-staff-option input{width:17px;height:17px;margin:1px 0 0!important}
 .ksb-staff-name{font-size:12px;font-weight:900;color:var(--navy)}
 .ksb-staff-pos{font-size:10px;color:var(--muted);margin-top:3px}
 .ksb-bulkbox{margin:12px 0;padding:12px;border:1px solid #b8d2ec;border-radius:12px;background:#f7fbff;display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap}
 .ksb-distribution{padding:10px 12px;border-radius:11px;background:#f6f9fc;border:1px solid #dfe7ef;font-size:11px;color:#425466}
 @media(max-width:760px){.ksb-staff-grid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}
function ksbStaffChoices(candidates,klass){
 ensureKsbAssignStyle();
 if(!candidates.length)return'<div class="notice">Belum ada admin/staf internal aktif yang tersedia.</div>';
 return `<div class="ksb-staff-grid">${candidates.map(x=>`<label class="ksb-staff-option"><input type="checkbox" class="${klass}" value="${x.id}"><span><div class="ksb-staff-name">${esc(x.full_name)}</div><div class="ksb-staff-pos">${esc(x.position||x.role)}</div></span></label>`).join('')}</div>`;
}
const toast=(msg,bad=false)=>{let t=$('ksBcksToast');if(!t){t=document.createElement('div');t.id='ksBcksToast';Object.assign(t.style,{position:'fixed',right:'18px',bottom:'22px',zIndex:99999,maxWidth:'380px',padding:'12px 16px',borderRadius:'12px',boxShadow:'0 8px 28px #0003',fontWeight:'700'});document.body.appendChild(t)}t.style.background=bad?'#fee2e2':'#dcfce7';t.style.color=bad?'#991b1b':'#166534';t.textContent=msg;clearTimeout(t._x);t._x=setTimeout(()=>t.remove(),4000)};
function mainEl(){return document.querySelector('main.content')}
function ensureSection(){if($('diklatKsBcks'))return;const main=mainEl();if(!main)return;const sec=document.createElement('section');sec.id='diklatKsBcks';sec.className='section';sec.innerHTML='<div class="head"><div><h2>Diklat KS/BCKS</h2><p>Workflow seleksi administrasi, seleksi substansi, Diklat, dan pencatatan sertifikat dari pihak berwenang.</p></div></div><div id="diklatKsBcksBody"></div>';const footer=main.querySelector('.footer');if(footer)main.insertBefore(sec,footer);else main.appendChild(sec)}
function navButton(){const b=document.createElement('button');b.className='navbtn';b.dataset.tab='diklatKsBcks';b.setAttribute('onclick',"showTab('diklatKsBcks')");b.innerHTML='<span class="ico">🎓</span>Diklat KS/BCKS';return b}
function ensureNav(){const nav=$('nav');if(!nav||nav.querySelector('[data-tab="diklatKsBcks"]'))return;if(!(isApplicant()||isReviewer()))return;const b=navButton();if(isReviewer()){const p=nav.querySelector('[data-tab="promotion"]');p?p.after(b):nav.appendChild(b)}else{const s=nav.querySelector('[data-tab="services"]')||nav.querySelector('[data-tab="status"]');s?s.after(b):nav.appendChild(b)}}
const stageIndex=s=>({ADMINISTRASI:0,SUBSTANSI:1,DIKLAT:2,SERTIFIKAT:3}[s]??0);
const stateLabel=(d,i)=>i===0?(d?.admin_status||'BELUM'):i===1?(d?.substansi_status||'TERKUNCI'):i===2?(d?.diklat_status||'TERKUNCI'):(d?.sertifikat_status||'TERKUNCI');
function progressHtml(d){const cur=stageIndex(d?.workflow_stage||'ADMINISTRASI');const labels=['1. Seleksi Administrasi','2. Seleksi Substansi','3. Diklat','4. Pencatatan Sertifikat Diklat'];return `<div class="servicegrid" style="margin-bottom:14px">${labels.map((x,i)=>{const unlocked=i<=cur,active=i===cur;return `<div class="service" style="border:${active?'2px solid #2563eb':'1px solid #dbe3ec'};opacity:${unlocked?1:.6}"><div class="small">LEVEL ${i+1}${active?' • AKTIF':''}</div><h3>${esc(x)}</h3><p>${esc(unlocked?stateLabel(d,i):'TERKUNCI')}</p></div>`}).join('')}</div>`}
async function myDetail(){const {data,error}=await sb.from('ks_bcks_submission_details').select('*').eq('user_id',profile().id).maybeSingle();if(error)throw error;return data}
async function filesFor(id){if(!id)return[];const {data,error}=await sb.from('submission_files').select('*').eq('submission_id',id).order('created_at');if(error)throw error;return data||[]}
function applicantForm(d,files){const editable=!d||['DRAFT','DITOLAK'].includes(d.admin_status),by=Object.fromEntries((files||[]).map(f=>[f.requirement_code,f]));return `<div class="card"><h3 style="margin-top:0">Level 1 • Seleksi Administrasi</h3><div class="grid"><label class="s6">Nama lengkap dan gelar<input id="ksbFullName" value="${esc(d?.full_name||profile().full_name||'')}" ${editable?'':'disabled'}></label><label class="s6">NIP<input id="ksbNip" value="${esc(d?.nip||profile().nip||'')}" ${editable?'':'disabled'}></label><label class="s6">Pangkat, Gol/Ruang<input id="ksbPangkat" value="${esc(d?.pangkat_golruang||'')}" ${editable?'':'disabled'}></label><label class="s6">Unit kerja<input id="ksbUnit" value="${esc(d?.unit_kerja||profile().unit||'')}" ${editable?'':'disabled'}></label><label class="s6">TMT penugasan KS<input id="ksbTmt" type="date" value="${esc(d?.tmt_penugasan_ks||'')}" ${editable?'':'disabled'}></label></div>${d?.admin_status==='DITOLAK'?`<div class="notice" style="margin-top:12px"><b>Perlu perbaikan:</b> ${esc(d.admin_note||'-')}</div>`:''}${editable?'<button class="btn" id="ksbSave" style="margin-top:12px">Simpan Data Administrasi</button>':''}</div><div class="card" style="margin-top:12px"><h3 style="margin-top:0">Upload Berkas <span class="small">(maksimal 500 KB per berkas; PDF/JPG/PNG)</span></h3><div class="info" style="margin-bottom:12px"><b>Surat Pernyataan Bermeterai</b><br>Peserta wajib mengunggah surat pernyataan bersedia mengikuti seluruh proses Diklat KS yang telah ditandatangani dan dibubuhi meterai. <button class="btn secondary" id="ksbDownloadStatementTemplate" type="button" style="margin-top:8px">⬇ Unduh Template Surat Pernyataan (.doc)</button></div><div class="servicegrid">${REQUIREMENTS.map(([code,label])=>{const f=by[code];return `<div class="service" data-ksb-requirement="${code}"><b>${esc(label)}</b><div class="small" style="margin:6px 0">${f?`✅ ${esc(f.file_name)} • ${Math.ceil(Number(f.file_size||0)/1024)} KB`:'Belum diunggah'}</div>${editable&&d?.submission_id?`<input type="file" data-ksb-upload="${code}" accept="application/pdf,image/jpeg,image/png">`:editable?'<div class="small">Simpan data administrasi terlebih dahulu.</div>':''}${f?`<button class="btn secondary" data-ksb-view="${esc(f.storage_path)}" style="margin-top:6px">Lihat berkas</button>`:''}</div>`}).join('')}</div>${editable&&d?.submission_id?'<button class="btn" id="ksbSubmit" style="margin-top:12px">Ajukan Seleksi Administrasi ke Dinas</button>':''}</div>`}
function applicantNextLevels(d){if(!d)return'';return `<div class="card" style="margin-top:12px"><h3 style="margin-top:0">Status Tahapan Berikutnya</h3><div class="servicegrid"><div class="service"><div class="small">LEVEL 2</div><h3>Seleksi Substansi</h3><p>${esc(d.workflow_stage==='ADMINISTRASI'?'Terkunci sampai Administrasi di-approve Dinas':d.substansi_status)}</p>${d.substansi_note?`<div class="small">Catatan: ${esc(d.substansi_note)}</div>`:''}</div><div class="service"><div class="small">LEVEL 3</div><h3>Diklat</h3><p>${esc(['ADMINISTRASI','SUBSTANSI'].includes(d.workflow_stage)?'Terkunci sampai lulus Seleksi Substansi':d.diklat_status)}</p>${d.diklat_note?`<div class="small">Catatan: ${esc(d.diklat_note)}</div>`:''}</div><div class="service"><div class="small">LEVEL 4</div><h3>Pencatatan Sertifikat Diklat</h3><p>${esc(d.workflow_stage!=='SERTIFIKAT'?'Terkunci sampai lulus Diklat':d.sertifikat_status)}</p>${d.workflow_stage==='SERTIFIKAT'&&d.sertifikat_penerbit?`<div class="small">Penerbit: ${esc(d.sertifikat_penerbit)} • Nomor: ${esc(d.sertifikat_nomor||'-')} • ${fmtDate(d.sertifikat_tanggal)}</div>`:''}</div></div></div>`}
function certificateApplicantCard(d){
 if(!d||d.workflow_stage!=='SERTIFIKAT')return'';
 const editable=['MENUNGGU_PENCATATAN','DITOLAK'].includes(d.sertifikat_status);
 if(d.sertifikat_status==='TERCATAT')return `<div class="card" style="margin-top:12px"><h3 style="margin-top:0">Level 4 • Pencatatan Sertifikat Diklat</h3><div class="info"><b>DISETUJUI Admin KSPS</b><br>Data sertifikat dari pihak berwenang telah diverifikasi dan tercatat di SIMANTAB.</div><div class="small" style="margin-top:10px">Penerbit: ${esc(d.sertifikat_penerbit||'-')}<br>Nomor: ${esc(d.sertifikat_nomor||'-')}<br>Tanggal: ${fmtDate(d.sertifikat_tanggal)}</div></div>`;
 if(d.sertifikat_status==='DIAJUKAN')return `<div class="card" style="margin-top:12px"><h3 style="margin-top:0">Level 4 • Pencatatan Sertifikat Diklat</h3><div class="info"><b>Menunggu verifikasi Admin KSPS.</b><br>Data sertifikat telah diajukan dan sementara terkunci.</div><div class="small" style="margin-top:10px">Penerbit: ${esc(d.sertifikat_penerbit||'-')}<br>Nomor: ${esc(d.sertifikat_nomor||'-')}<br>Tanggal: ${fmtDate(d.sertifikat_tanggal)}</div></div>`;
 return `<div class="card" style="margin-top:12px"><h3 style="margin-top:0">Level 4 • Isi Data Sertifikat Diklat</h3><div class="notice" style="margin-bottom:12px">Data diisi oleh KS/peserta Diklat berdasarkan sertifikat yang diterbitkan pihak berwenang. Admin KSPS hanya memverifikasi dan menyetujui.</div>${d.sertifikat_status==='DITOLAK'?`<div class="notice" style="margin-bottom:12px"><b>Perlu perbaikan:</b> ${esc(d.sertifikat_note||'-')}</div>`:''}<div class="grid"><label class="s12">Lembaga/Pihak Penerbit<input id="ksbCertIssuer" value="${esc(d.sertifikat_penerbit||'')}" ${editable?'':'disabled'}></label><label class="s6">Nomor Sertifikat<input id="ksbCertNo" value="${esc(d.sertifikat_nomor||'')}" ${editable?'':'disabled'}></label><label class="s6">Tanggal Sertifikat<input id="ksbCertDate" type="date" value="${esc(d.sertifikat_tanggal||'')}" ${editable?'':'disabled'}></label></div><textarea id="ksbCertNote" placeholder="Catatan peserta (opsional)" ${editable?'':'disabled'}>${esc(d.sertifikat_status==='DITOLAK'?'':(d.sertifikat_note||''))}</textarea>${editable?'<button class="btn" id="ksbCertSubmit" style="margin-top:8px">Ajukan Data Sertifikat ke Admin KSPS</button>':''}</div>`;
}
function ensurePaktaUploadSlot(d,files){
 if(!d||!['DRAFT','DITOLAK'].includes(d.admin_status)||!d.submission_id)return;
 if(document.querySelector('[data-ksb-upload="PAKTA_INTEGRITAS"]'))return;
 const grids=[...document.querySelectorAll('#diklatKsBcksBody .servicegrid')];
 const uploadGrid=grids.find(g=>g.querySelector('[data-ksb-upload]')||g.querySelector('[data-ksb-requirement="SURAT_PERNYATAAN_DIKLAT"]'));
 if(!uploadGrid)return;
 const existing=(files||[]).find(x=>x.requirement_code==='PAKTA_INTEGRITAS');
 const card=document.createElement('div');card.className='service';card.dataset.ksbRequirement='PAKTA_INTEGRITAS';
 card.innerHTML=`<b>Pakta Integritas</b><div class="small" style="margin:6px 0">${existing?`✅ ${esc(existing.file_name)} • ${Math.ceil(Number(existing.file_size||0)/1024)} KB`:'Belum diunggah'}</div><input type="file" data-ksb-upload="PAKTA_INTEGRITAS" accept="application/pdf,image/jpeg,image/png">${existing?`<button class="btn secondary" data-ksb-view="${esc(existing.storage_path)}" style="margin-top:6px">Lihat berkas</button>`:''}`;
 const statement=uploadGrid.querySelector('[data-ksb-requirement="SURAT_PERNYATAAN_DIKLAT"]');
 statement?uploadGrid.insertBefore(card,statement):uploadGrid.appendChild(card);
}
async function renderApplicant(){const body=$('diklatKsBcksBody');if(!body)return;body.innerHTML='<div class="card"><div class="small">Memuat modul Diklat KS/BCKS…</div></div>';try{const d=await myDetail(),files=await filesFor(d?.submission_id);body.innerHTML=progressHtml(d)+applicantForm(d,files)+applicantNextLevels(d)+certificateApplicantCard(d);ensurePaktaUploadSlot(d,files);bindApplicant(d,files)}catch(e){body.innerHTML=`<div class="card err">${esc(e.message||e)}</div>`}}
function formVals(){return {p_full_name:$('ksbFullName')?.value.trim(),p_nip:$('ksbNip')?.value.trim(),p_pangkat_golruang:$('ksbPangkat')?.value.trim(),p_unit_kerja:$('ksbUnit')?.value.trim(),p_tmt_penugasan_ks:$('ksbTmt')?.value||null}}
function downloadStatementTemplate(d){
 const nama=$('ksbFullName')?.value?.trim()||d?.full_name||profile().full_name||'';
 const nip=$('ksbNip')?.value?.trim()||d?.nip||profile().nip||'';
 const pangkat=$('ksbPangkat')?.value?.trim()||d?.pangkat_golruang||'';
 const unit=$('ksbUnit')?.value?.trim()||d?.unit_kerja||profile().unit||'';
 const safe=v=>esc(v||'........................................................');
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>Surat Pernyataan Diklat KS</title><style>@page{size:A4;margin:2.5cm}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.5;color:#000}h1,h2{text-align:center;margin:0}h1{font-size:14pt;text-decoration:underline}h2{font-size:12pt;margin-bottom:24px}.tbl{border-collapse:collapse;width:100%;margin:12px 0 18px}.tbl td{padding:2px 4px;vertical-align:top}.n{width:34%}.c{width:3%}.sign{width:42%;margin-left:auto;text-align:center;margin-top:28px}.meterai{height:72px;display:flex;align-items:center;justify-content:center}.note{font-size:10pt;margin-top:20px}</style></head><body><h1>SURAT PERNYATAAN</h1><h2>BERSEDIA MENGIKUTI SELURUH PROSES DIKLAT KEPALA SEKOLAH</h2><p>Saya yang bertanda tangan di bawah ini:</p><table class="tbl"><tr><td class="n">Nama lengkap dan gelar</td><td class="c">:</td><td>${safe(nama)}</td></tr><tr><td>NIP</td><td>:</td><td>${safe(nip)}</td></tr><tr><td>Pangkat, Golongan/Ruang</td><td>:</td><td>${safe(pangkat)}</td></tr><tr><td>Jabatan</td><td>:</td><td>........................................................</td></tr><tr><td>Unit Kerja</td><td>:</td><td>${safe(unit)}</td></tr><tr><td>Alamat</td><td>:</td><td>........................................................</td></tr></table><p>Dengan ini menyatakan bahwa saya:</p><ol><li>Bersedia mengikuti seluruh tahapan dan proses Diklat Kepala Sekolah sesuai jadwal dan ketentuan penyelenggara.</li><li>Bersedia hadir, berpartisipasi aktif, menyelesaikan seluruh tugas, asesmen/evaluasi, dan kewajiban selama pelaksanaan Diklat Kepala Sekolah.</li><li>Bersedia mematuhi tata tertib serta ketentuan penyelenggaraan Diklat Kepala Sekolah.</li><li>Apabila tidak memenuhi kewajiban tanpa alasan yang dapat dipertanggungjawabkan, bersedia menerima tindak lanjut sesuai ketentuan yang berlaku.</li><li>Menyatakan bahwa surat ini dibuat dengan sebenar-benarnya, dalam keadaan sadar, dan tanpa paksaan dari pihak mana pun.</li></ol><p>Demikian surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.</p><div class="sign"><p>Batang, ................. 20....</p><p>Yang membuat pernyataan,</p><div class="meterai">Meterai Rp10.000</div><p><b><u>${safe(nama)}</u></b><br>NIP. ${safe(nip)}</p></div><div class="note"><b>Petunjuk:</b> cetak pada kertas A4, lengkapi bagian yang kosong, bubuhkan meterai dan tanda tangan, kemudian pindai menjadi PDF/JPG/PNG maksimal 500 KB untuk diunggah ke SIMANTAB.</div></body></html>`;
 const blob=new Blob(['\ufeff',html],{type:'application/msword;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Template_Surat_Pernyataan_Diklat_KS.doc';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function bindApplicant(d,files){
 $('ksbDownloadStatementTemplate')?.addEventListener('click',()=>downloadStatementTemplate(d));
 $('ksbSave')?.addEventListener('click',async()=>{try{const {error}=await sb.rpc('ks_bcks_save_administrasi',formVals());if(error)throw error;toast('Data administrasi tersimpan.');await renderApplicant()}catch(e){toast(e.message||String(e),true)}});
 document.querySelectorAll('[data-ksb-upload]').forEach(inp=>inp.addEventListener('change',async ev=>{const file=ev.target.files?.[0],code=ev.target.dataset.ksbUpload;if(!file)return;if(file.size>FILE_LIMIT)return toast('Berkas melebihi 500 KB.',true);if(!['application/pdf','image/jpeg','image/png'].includes(file.type))return toast('Format hanya PDF/JPG/PNG.',true);if(!d?.submission_id)return toast('Simpan data administrasi terlebih dahulu.',true);try{const old=(files||[]).find(x=>x.requirement_code===code);if(old){await sb.storage.from(BUCKET).remove([old.storage_path]);await sb.from('submission_files').delete().eq('id',old.id)}const clean=file.name.replace(/[^A-Za-z0-9._-]/g,'_'),path=`${profile().id}/${d.submission_id}/diklat-ks-bcks/${code}-${Date.now()}-${clean}`;const up=await sb.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type});if(up.error)throw up.error;const ins=await sb.from('submission_files').insert({submission_id:d.submission_id,user_id:profile().id,storage_path:path,file_name:file.name,file_size:file.size,mime_type:file.type,requirement_code:code});if(ins.error)throw ins.error;toast('Berkas berhasil diunggah.');await renderApplicant()}catch(e){toast(e.message||String(e),true)}}));
 document.querySelectorAll('[data-ksb-view]').forEach(b=>b.addEventListener('click',async()=>{const {data,error}=await sb.storage.from(BUCKET).createSignedUrl(b.dataset.ksbView,600);if(error)return toast(error.message,true);window.open(data.signedUrl,'_blank')}));
 $('ksbSubmit')?.addEventListener('click',async()=>{if(!confirm('Ajukan Seleksi Administrasi ke Dinas?'))return;try{const {error}=await sb.rpc('ks_bcks_submit_administrasi',{p_submission_id:d.submission_id});if(error)throw error;toast('Seleksi Administrasi berhasil diajukan.');await renderApplicant()}catch(e){toast(e.message||String(e),true)}});
 $('ksbCertSubmit')?.addEventListener('click',async()=>{if(!confirm('Ajukan data sertifikat ke Admin KSPS untuk diverifikasi?'))return;try{const {error}=await sb.rpc('ks_bcks_submit_certificate_data',{p_submission_id:d.submission_id,p_penerbit:$('ksbCertIssuer')?.value?.trim(),p_nomor:$('ksbCertNo')?.value?.trim(),p_tanggal:$('ksbCertDate')?.value||null,p_note:$('ksbCertNote')?.value?.trim()||null});if(error)throw error;toast('Data sertifikat berhasil diajukan ke Admin KSPS.');await renderApplicant()}catch(e){toast(e.message||String(e),true)}});
}

async function coordinatorDiklatData(){
 const scope=COORD_SCOPE[profile().role];
 let sq=sb.from('submissions')
  .select('id,user_id,service_type,title,scope_level,workflow_state,assigned_user_id,assigned_role,updated_at,submitted_at')
  .eq('service_type','DIKLAT_KS_BCKS')
  .eq('scope_level',scope)
  .order('submitted_at',{ascending:false})
  .limit(1000);
 const [s,pf,ta]=await Promise.all([
  sq,
  sb.from('profiles').select('id,full_name,unit,position,role,account_channel,is_active').order('full_name'),
  sb.from('team_task_assignments').select('user_id,capability,is_active').eq('is_active',true)
 ]);
 const err=s.error||pf.error||ta.error;if(err)throw err;
 return{subs:s.data||[],profiles:pf.data||[],tasks:ta.data||[]};
}
function coordKsbPill(state){
 const label=KSB_FLOW_LABEL[state]||state||'-';
 const cls=state==='SELESAI'?'#e9f7ef;color:#178354':state==='PERBAIKAN'?'#feeceb;color:#b42318':'#fff3dd;color:#955a00';
 return `<span style="display:inline-block;padding:4px 8px;border-radius:999px;background:${cls};font-size:9px;font-weight:900">${esc(label)}</span>`;
}
function coordKsbFlow(){
 return '<div class="servicegrid" style="margin-bottom:12px"><div class="service"><b>1. Bagi Tugas</b><p>Kasi/Subkoor menetapkan Admin/Staf verifikator.</p></div><div class="service"><b>2. Verifikasi Admin/Staf</b><p>Admin/staf memeriksa 7 berkas administrasi.</p></div><div class="service"><b>3. Persetujuan Kabid</b><p>Hasil verifikasi langsung diteruskan ke Kabid.</p></div><div class="service"><b>4. Naik Level</b><p>Setelah disetujui Kabid, peserta masuk Seleksi Substansi.</p></div></div>';
}
function coordKsbSummary(rows){
 const defs=[
  ['MENUNGGU_DISPOSISI_KOORDINATOR','Bagi Tugas'],
  ['VERIFIKASI_STAF','Verifikasi Admin/Staf'],
  ['MENUNGGU_PERSETUJUAN_KABID','Persetujuan Kabid'],
  ['SELESAI','Selesai / Naik Level']
 ];
 return `<div class="grid" style="margin-bottom:12px">${defs.map(([st,label])=>`<div class="card s4"><div class="label">${esc(label)}</div><div class="metric">${rows.filter(x=>x.workflow_state===st).length}</div></div>`).join('')}</div>`;
}
function coordKsbAction(s){
 if(s.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR')return `<button class="btn" onclick="ksbCoordOpenAssign('${s.id}')">👤 Bagi Tugas</button>`;
 return '';
}
async function renderCoordinatorDiklat(){
 const body=$('diklatKsBcksBody');if(!body)return;
 body.innerHTML='<div class="card"><div class="small">Memuat agregat Diklat KS/BCKS sesuai jenjang…</div></div>';
 try{
  const d=await coordinatorDiklatData();
  window.__ksbCoordData=d;
  const names=new Map(d.profiles.map(x=>[x.id,x]));
  const scope=COORD_SCOPE[profile().role],scopeLabel=scope==='TK_PAUD_PNF'?'TK/PAUD/PNF':scope;
  const rows=d.subs;
  const pendingCount=rows.filter(x=>x.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR').length;
  const bulk=pendingCount>=2?`<div class="ksb-bulkbox"><div><div class="label">PEMBAGIAN TUGAS AGREGAT</div><div class="small">${pendingCount} peserta menunggu pembagian tugas. Sistem membagi satu peserta ke satu petugas secara merata.</div></div><button class="btn" onclick="ksbOpenBulkAssign()">⚖️ Bagi Tugas Agregat (${pendingCount})</button></div>`:'';
  body.innerHTML=`<div class="card" style="margin-bottom:12px">${coordKsbFlow()}<div class="info"><b>Cakupan ${esc(scopeLabel)} saja.</b> Pada level Kasi/Subkoor, berkas administrasi peserta tidak ditampilkan. Berkas hanya diperiksa oleh admin/staf yang ditugaskan. Kasi/Subkoor memantau agregat dan melakukan Bagi Tugas. Setelah staf/admin menyelesaikan verifikasi, usulan langsung diteruskan ke Kabid untuk persetujuan.</div></div>${coordKsbSummary(rows)}${bulk}<div class="card">${rows.length?`<div class="tablewrap"><table><thead><tr><th>Nama</th><th>Unit Kerja</th><th>Jenis / Program</th><th>Status / Proses</th></tr></thead><tbody>${rows.map(s=>{const u=names.get(s.user_id)||{};return `<tr><td><b>${esc(u.full_name||'-')}</b></td><td>${esc(u.unit||'-')}</td><td>Diklat KS/BCKS</td><td>${coordKsbPill(s.workflow_state)}${coordKsbAction(s)}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Belum ada peserta Diklat KS/BCKS pada jenjang ini.</div>'}</div>`;
 }catch(e){body.innerHTML=`<div class="card err">${esc(e.message||e)}</div>`}
}
window.ksbCoordOpenAssign=async id=>{
 const d=window.__ksbCoordData||await coordinatorDiklatData();
 window.__ksbCoordData=d;
 const candidates=d.profiles
  .filter(x=>{const r=String(x.role||'');return x.is_active&&x.account_channel==='DINAS'&&(r.startsWith('STAFF_')||r.startsWith('ADMIN_'))})
  .sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||''),'id'));
 let m=$('ksbCoordAssignModal');m?.remove();m=document.createElement('div');m.id='ksbCoordAssignModal';
 Object.assign(m.style,{position:'fixed',inset:'0',zIndex:'99999',background:'#0b203c99',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'});
 m.onclick=e=>{if(e.target===m)m.remove()};
 const choices=ksbStaffChoices(candidates,'ksb-assignee-check');
 m.innerHTML=`<div class="card" style="width:min(680px,100%);max-height:90vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:8px"><div><div class="label">BAGI TUGAS DIKLAT KS/BCKS</div><h3 style="margin:4px 0">Pilih Admin/Staf Verifikator</h3><div class="small">Dapat memilih lebih dari satu admin/staf internal.</div></div><button class="btn secondary" onclick="document.getElementById('ksbCoordAssignModal')?.remove()">✕</button></div><div class="field"><label>Admin/Staf Internal Dinas</label>${choices}</div><div class="field"><label>Catatan penugasan (opsional)</label><textarea id="ksbCoordAssignNote"></textarea></div><button class="btn" onclick="ksbCoordSaveAssign('${id}')">Tetapkan Tugas</button><div id="ksbCoordAssignMsg" class="small" style="margin-top:7px"></div></div>`;
 document.body.appendChild(m);
};
window.ksbCoordSaveAssign=async id=>{
 const ids=[...document.querySelectorAll('#ksbCoordAssignModal .ksb-assignee-check:checked')].map(x=>x.value),msg=$('ksbCoordAssignMsg');
 if(!ids.length){if(msg)msg.textContent='Pilih minimal satu admin/staf internal.';return}
 if(msg)msg.textContent='Menyimpan penugasan...';
 const {error}=await sb.rpc('submission_assign_staff_multi',{p_submission_id:id,p_assignee_user_ids:ids,p_note:$('ksbCoordAssignNote')?.value?.trim()||null});
 if(error){if(msg)msg.textContent=error.message;return}
 $('ksbCoordAssignModal')?.remove();await renderCoordinatorDiklat();
};

window.ksbBulkPreview=()=>{
 const m=$('ksbBulkAssignModal');if(!m)return;
 const n=Number(m.dataset.submissionCount||0),k=m.querySelectorAll('.ksb-bulk-assignee:checked').length,out=$('ksbBulkPreview');
 if(out)out.innerHTML=k?`<b>${n} peserta</b> akan dibagi ke <b>${k} petugas</b>. Perkiraan masing-masing ${Math.floor(n/k)}–${Math.ceil(n/k)} peserta, menyesuaikan beban aktif.`:'Pilih minimal satu admin/staf internal.';
};
window.ksbOpenBulkAssign=async()=>{
 const d=window.__ksbCoordData||await coordinatorDiklatData();window.__ksbCoordData=d;
 const rows=d.subs.filter(x=>x.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR');
 if(rows.length<2){alert('Pembagian agregat membutuhkan minimal 2 peserta pada tahap Bagi Tugas.');return}
 const candidates=d.profiles.filter(x=>{const r=String(x.role||'');return x.is_active&&x.account_channel==='DINAS'&&(r.startsWith('STAFF_')||r.startsWith('ADMIN_'))}).sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||''),'id'));
 let m=$('ksbBulkAssignModal');m?.remove();m=document.createElement('div');m.id='ksbBulkAssignModal';m.dataset.submissionCount=String(rows.length);
 Object.assign(m.style,{position:'fixed',inset:'0',zIndex:'99999',background:'#0b203c99',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'});
 m.onclick=e=>{if(e.target===m)m.remove()};
 m.innerHTML=`<div class="card" style="width:min(760px,100%);max-height:92vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div class="label">BAGI TUGAS AGREGAT DIKLAT KS/BCKS</div><h3 style="margin:4px 0">${rows.length} Peserta Menunggu Pembagian</h3><div class="small">Satu peserta → satu petugas. Pembagian merata berdasarkan beban aktif.</div></div><button class="btn secondary" onclick="document.getElementById('ksbBulkAssignModal')?.remove()">✕</button></div><div class="field" style="margin-top:12px"><label>Pilih Admin/Staf Internal</label>${ksbStaffChoices(candidates,'ksb-bulk-assignee')}</div><div id="ksbBulkPreview" class="ksb-distribution">Pilih minimal satu admin/staf internal.</div><div class="field" style="margin-top:10px"><label>Catatan penugasan (opsional)</label><textarea id="ksbBulkNote"></textarea></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn secondary" onclick="document.getElementById('ksbBulkAssignModal')?.remove()">Batal</button><button class="btn" onclick="ksbSaveBulkAssign()">⚖️ Bagi Tugas Merata</button></div><div id="ksbBulkMsg" class="small" style="margin-top:7px"></div></div>`;
 document.body.appendChild(m);
 m.querySelectorAll('.ksb-bulk-assignee').forEach(x=>x.addEventListener('change',window.ksbBulkPreview));
};
window.ksbSaveBulkAssign=async()=>{
 const d=window.__ksbCoordData||await coordinatorDiklatData(),rows=d.subs.filter(x=>x.workflow_state==='MENUNGGU_DISPOSISI_KOORDINATOR'),msg=$('ksbBulkMsg');
 const ids=[...document.querySelectorAll('#ksbBulkAssignModal .ksb-bulk-assignee:checked')].map(x=>x.value);
 if(!ids.length){msg.textContent='Pilih minimal satu admin/staf internal.';return}
 if(rows.length<2){msg.textContent='Peserta yang menunggu pembagian tugas kurang dari 2.';return}
 msg.textContent='Membagi '+rows.length+' peserta secara merata...';
 const {error}=await sb.rpc('submission_assign_staff_balanced',{p_submission_ids:rows.map(x=>x.id),p_assignee_user_ids:ids,p_note:$('ksbBulkNote')?.value?.trim()||null});
 if(error){msg.textContent=error.message;return}
 $('ksbBulkAssignModal')?.remove();await renderCoordinatorDiklat();
};
async function leadershipDiklatData(){
 const [s,pf]=await Promise.all([
  sb.from('submissions')
   .select('id,user_id,service_type,title,scope_level,workflow_state,status,updated_at,submitted_at,kabid_approved_by,kabid_approved_at,kabid_approval_note')
   .eq('service_type','DIKLAT_KS_BCKS')
   .order('submitted_at',{ascending:false})
   .limit(1000),
  sb.from('profiles')
   .select('id,full_name,unit,position,role')
   .order('full_name')
 ]);
 const err=s.error||pf.error;if(err)throw err;
 return{subs:s.data||[],profiles:pf.data||[]};
}
function leaderScopeLabel(scope){
 return scope==='TK_PAUD_PNF'?'TK/PAUD/PNF':(scope||'-');
}
function leaderKsbSummary(rows){
 const defs=[
  ['MENUNGGU_DISPOSISI_KOORDINATOR','Bagi Tugas'],
  ['VERIFIKASI_STAF','Verifikasi Admin/Staf'],
  ['MENUNGGU_PERSETUJUAN_KABID','Persetujuan Kabid'],
  ['PERBAIKAN','Perbaikan'],
  ['SELESAI','Selesai / Naik Level']
 ];
 const totalPengusul=new Set((rows||[]).map(x=>x.user_id).filter(Boolean)).size;
 const statusCards=defs.map(([st,label])=>`<div class="card s4"><div class="label">${esc(label)}</div><div class="metric">${rows.filter(x=>x.workflow_state===st).length}</div></div>`).join('');
 const totalCard=`<div class="card s4"><div class="label">TOTAL PENGUSUL</div><div class="metric">${totalPengusul}</div><div class="small">Pengusul unik</div></div>`;
 return `<div class="grid" style="margin-bottom:12px">${statusCards}${totalCard}</div>`;
}

const KABID_SUCCESS_NOTE='Selamat naik Level Bpk/Ibu Peserta Diklat, Sukses👍🙏';
function kabidKsbAction(s,names){
 if(!isKabid())return'';
 if(s.workflow_state==='MENUNGGU_PERSETUJUAN_KABID')return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
  <button class="btn" onclick="ksbKabidApprove('${s.id}',true)">✓ Setujui</button>
  <button class="btn secondary" onclick="ksbKabidApprove('${s.id}',false)">↺ Kembalikan</button>
  <div class="small" style="width:100%;margin-top:4px"><b>Komentar persetujuan:</b> ${esc(KABID_SUCCESS_NOTE)}</div>
 </div>`;
 if(s.kabid_approved_at){
  const approver=names?.get(s.kabid_approved_by)||{};
  const note=String(s.kabid_approval_note||'').trim();
  return `<div style="min-width:190px"><div style="font-weight:900;color:#166534">✅ Disetujui Kabid</div>${note?`<div class="small" style="margin-top:4px"><b>Komentar:</b> ${esc(note)}</div>`:''}<div class="small" style="margin-top:4px">${esc(approver.full_name||'Kabid Ketenagaan')} • ${esc(fmtDateTime(s.kabid_approved_at))}</div></div>`;
 }
 if(s.status==='ADMIN_APPROVED'||s.workflow_state==='SELESAI'){
  return '<div style="font-weight:900;color:#166534">✅ Disetujui Kabid</div><div class="small">Riwayat lama — catatan persetujuan belum tersimpan.</div>';
 }
 return'';
}
window.ksbKabidApprove=async(id,approve)=>{
 const note=approve?KABID_SUCCESS_NOTE:(prompt('Alasan dikembalikan ke staf/admin verifikator:')||'');
 if(!approve&&!note.trim()){alert('Alasan pengembalian wajib diisi.');return}
 if(approve&&!confirm('Setujui peserta dan naikkan ke Level Seleksi Substansi?\n\nKomentar: '+KABID_SUCCESS_NOTE))return;
 const {error}=await sb.rpc('submission_kabid_approve',{p_submission_id:id,p_approve:approve,p_note:note});
 if(error){alert(error.message);return}
 toast(approve?'Usulan disetujui Kabid.':'Usulan dikembalikan untuk perbaikan.');
 await renderLeadershipDiklat();
};
async function renderLeadershipDiklat(){
 const body=$('diklatKsBcksBody');if(!body)return;
 body.innerHTML='<div class="card"><div class="small">Memuat monitoring Diklat KS/BCKS…</div></div>';
 try{
  const d=await leadershipDiklatData();
  const names=new Map(d.profiles.map(x=>[x.id,x]));
  const rows=d.subs;
  const leaderLabel=profile().role==='KEPALA_DINAS'?'Kepala Disdikbud':profile().role==='SEKRETARIS_DINAS'?'Sekretaris Disdikbud':'Kabid Ketenagaan';
  const isKabidView=isKabid();
  body.innerHTML=`<div class="card" style="margin-bottom:12px">
   <div class="info"><b>Monitoring ${esc(leaderLabel)}.</b> Tampilan hanya memuat agregat, identitas pengusul, jenjang, dan status proses. Berkas unggahan peserta tidak ditampilkan dan tetap diperiksa oleh admin/staf verifikator.${isKabidView?' Kabid memberikan persetujuan akhir administrasi dari tampilan ringkas ini.':''}</div>
   ${isKabidView?'':'<div style="margin-top:10px"><button class="btn soft" onclick="showTab(\'leadershipDirections\')">📝 Buka Arahan Pimpinan</button></div>'}
  </div>
  ${leaderKsbSummary(rows)}
  <div class="card">${rows.length?`<div class="tablewrap"><table><thead><tr><th>Nama</th><th>Unit Kerja</th><th>Jenjang</th><th>Jenis / Program</th><th>Status / Proses</th>${isKabidView?'<th>Persetujuan Kabid</th>':''}</tr></thead><tbody>${rows.map(s=>{const u=names.get(s.user_id)||{};return `<tr><td><b>${esc(u.full_name||'-')}</b></td><td>${esc(u.unit||'-')}</td><td>${esc(leaderScopeLabel(s.scope_level))}</td><td>Diklat KS/BCKS</td><td>${coordKsbPill(s.workflow_state)}</td>${isKabidView?`<td>${kabidKsbAction(s,names)||'—'}</td>`:''}</tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Belum ada peserta Diklat KS/BCKS.</div>'}</div>`;
 }catch(e){body.innerHTML=`<div class="card err">${esc(e.message||e)}</div>`}
}
async function reviewerData(){const {data,error}=await sb.from('ks_bcks_submission_details').select('*').order('updated_at',{ascending:false});if(error)throw error;return data||[]}
function certSummary(d){return `<div class="info" style="margin-top:10px"><b>Data Sertifikat dari Peserta</b><br>Lembaga/Pihak Penerbit: ${esc(d.sertifikat_penerbit||'-')}<br>Nomor: ${esc(d.sertifikat_nomor||'-')}<br>Tanggal: ${fmtDate(d.sertifikat_tanggal)}${d.sertifikat_submitted_at?`<br>Diajukan: ${fmtDateTime(d.sertifikat_submitted_at)}`:''}</div>`}
function superAdminDraftAction(d){
 if(!isSuperAdmin()||d.workflow_stage!=='ADMINISTRASI'||d.admin_status==='DRAFT')return '';
 return `<div style="margin-top:10px;padding:10px;border:1px solid #f2c7a5;border-radius:12px;background:#fff8f1"><div class="small" style="margin-bottom:7px"><b>Kontrol Super Admin:</b> turunkan peserta ke Draft agar biodata dan berkas dapat diedit/diganti kembali.</div><button class="btn secondary" data-ksb-action="reset-draft" data-id="${d.submission_id}">↩ Turunkan ke Draft</button></div>`;
}
function reviewerActions(d){
 const reset=superAdminDraftAction(d);
 if(['DIAJUKAN','TERVERIFIKASI','DISETUJUI_KOORDINATOR'].includes(d.admin_status)){
  const msg=d.admin_status==='DIAJUKAN'
   ?'Menunggu pembagian tugas/verifikasi oleh staf/admin.'
   :'Berkas telah diverifikasi staf/admin dan langsung menunggu persetujuan Kabid Ketenagaan.';
  return `<div class="info"><b>Persetujuan Administrasi</b><br>${esc(msg)}</div><button class="btn soft" style="margin-top:8px" onclick="showTab('monitoring')">Buka Workflow Monitoring</button>${reset}`;
 }
 if(d.workflow_stage==='SUBSTANSI')return `<textarea id="note-${d.submission_id}" placeholder="Catatan hasil Seleksi Substansi"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="btn" data-ksb-action="sub-ok" data-id="${d.submission_id}">Lulus Substansi</button><button class="btn secondary" data-ksb-action="sub-no" data-id="${d.submission_id}">Tidak Lulus</button></div>`;
 if(d.workflow_stage==='DIKLAT')return `<textarea id="note-${d.submission_id}" placeholder="Catatan hasil Diklat"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="btn" data-ksb-action="dik-ok" data-id="${d.submission_id}">Lulus Diklat</button><button class="btn secondary" data-ksb-action="dik-no" data-id="${d.submission_id}">Tidak Lulus</button></div>`;
 if(d.workflow_stage==='SERTIFIKAT'&&d.sertifikat_status==='DIAJUKAN')return `${certSummary(d)}<textarea id="note-${d.submission_id}" placeholder="Catatan verifikasi Admin KSPS (opsional)"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="btn" data-ksb-action="cert-ok" data-id="${d.submission_id}">Approve Data Sertifikat</button><button class="btn secondary" data-ksb-action="cert-no" data-id="${d.submission_id}">Tolak/Perbaiki</button></div>`;
 if(d.workflow_stage==='SERTIFIKAT'&&d.sertifikat_status==='TERCATAT')return `${certSummary(d)}<div class="small" style="margin-top:8px">✅ Sudah di-approve Admin KSPS.</div>`;
 if(d.workflow_stage==='SERTIFIKAT'&&d.sertifikat_status==='DITOLAK')return `${certSummary(d)}<div class="small" style="margin-top:8px">Menunggu peserta memperbaiki dan mengajukan ulang data sertifikat.</div>`;
 if(d.workflow_stage==='SERTIFIKAT')return `<div class="small">Menunggu KS/peserta Diklat mengisi dan mengajukan data sertifikat.</div>`;
 if(d.workflow_stage==='ADMINISTRASI'&&reset)return reset;
 return `<div class="small">Tidak ada aksi pada status ini.</div>`;
}
async function renderReviewer(){const body=$('diklatKsBcksBody');if(!body)return;body.innerHTML='<div class="card"><div class="small">Memuat peserta Diklat KS/BCKS…</div></div>';try{const rows=await reviewerData();body.innerHTML=`<div class="card" style="margin-bottom:12px"><div class="info"><b>Workflow:</b> Administrasi: GTK → Kasi/Subkoor bagi tugas → Staf/Admin verifikasi → langsung Persetujuan Kabid. Setelah disetujui Kabid, peserta lanjut Substansi → Diklat → Pencatatan Sertifikat.</div></div>${rows.length?`<div class="card" style="margin-bottom:12px"><label for="ksbParticipantSearch" style="display:block;font-weight:800;margin-bottom:7px">🔎 Cari Nama Peserta</label><input id="ksbParticipantSearch" type="search" placeholder="Ketik nama peserta..." autocomplete="off" style="width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:12px;font-size:14px"><div id="ksbParticipantSearchInfo" class="small" style="margin-top:7px">${rows.length} peserta</div></div>`+rows.map(d=>`<div class="card ksb-participant-card" data-search="${esc([d.full_name,d.nip,d.unit_kerja].filter(Boolean).join(' ').toLowerCase())}" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><div class="small">${esc(d.nip)}</div><h3 style="margin:4px 0">${esc(d.full_name)}</h3><div>${esc(d.pangkat_golruang)} • ${esc(d.unit_kerja)}</div><div class="small">TMT KS: ${fmtDate(d.tmt_penugasan_ks)} • Update: ${fmtDateTime(d.updated_at)}</div></div><div><b>${esc(d.workflow_stage)}</b><div class="small">Adm ${esc(d.admin_status)} • Sub ${esc(d.substansi_status)} • Diklat ${esc(d.diklat_status)} • Sertifikat ${esc(d.sertifikat_status)}</div></div></div><div id="docs-${d.submission_id}" style="margin:12px 0"></div>${reviewerActions(d)}</div>`).join(''):'<div class="card"><div class="empty">Belum ada peserta.</div></div>'}`;for(const d of rows)await loadReviewerDocs(d.submission_id);bindReviewer();const search=$('ksbParticipantSearch'),info=$('ksbParticipantSearchInfo');if(search){const apply=()=>{const q=search.value.trim().toLowerCase();let visible=0;document.querySelectorAll('.ksb-participant-card').forEach(card=>{const ok=!q||String(card.dataset.search||'').includes(q);card.style.display=ok?'':'none';if(ok)visible++});if(info)info.textContent=q?`${visible} dari ${rows.length} peserta ditemukan`:`${rows.length} peserta`};search.addEventListener('input',apply);search.focus()}}catch(e){body.innerHTML=`<div class="card err">${esc(e.message||e)}</div>`}}
async function loadReviewerDocs(id){const box=$(`docs-${id}`);if(!box)return;const fs=await filesFor(id),by=Object.fromEntries(fs.map(f=>[f.requirement_code,f]));box.innerHTML=`<div class="servicegrid">${REQUIREMENTS.map(([code,label])=>{const f=by[code];return `<div class="service"><b>${esc(label)}</b><div class="small">${f?'✅ '+esc(f.file_name):'❌ Belum ada'}</div>${f?`<button class="btn secondary" data-ksb-view="${esc(f.storage_path)}" style="margin-top:6px">Lihat</button>`:''}</div>`}).join('')}</div>`;box.querySelectorAll('[data-ksb-view]').forEach(b=>b.addEventListener('click',async()=>{const {data,error}=await sb.storage.from(BUCKET).createSignedUrl(b.dataset.ksbView,600);if(error)return toast(error.message,true);window.open(data.signedUrl,'_blank')}))}
const noteFor=id=>$(`note-${id}`)?.value?.trim()||null;
function bindReviewer(){document.querySelectorAll('[data-ksb-action]').forEach(b=>b.addEventListener('click',async()=>{const id=b.dataset.id,a=b.dataset.ksbAction;try{
 if(a==='reset-draft'){
  if(!isSuperAdmin())throw new Error('Hanya Super Admin yang dapat menurunkan ke Draft.');
  const reason=(prompt('Alasan menurunkan Seleksi Administrasi ke Draft (wajib):')||'').trim();
  if(!reason)return;
  if(!confirm('Turunkan peserta ini ke DRAFT?\n\nPeserta akan dapat mengedit biodata dan mengganti/menghapus berkas, lalu harus mengajukan ulang.'))return;
  const {error}=await sb.rpc('ks_bcks_superadmin_reset_to_draft',{p_submission_id:id,p_note:reason});
  if(error)throw error;
  toast('Seleksi Administrasi berhasil diturunkan ke Draft.');
  await renderReviewer();
  return;
 }
 let res;if(a==='admin-ok'||a==='admin-no')res=await sb.rpc('ks_bcks_review_administrasi',{p_submission_id:id,p_approve:a==='admin-ok',p_note:noteFor(id)});else if(a==='sub-ok'||a==='sub-no')res=await sb.rpc('ks_bcks_set_substansi_result',{p_submission_id:id,p_lulus:a==='sub-ok',p_note:noteFor(id)});else if(a==='dik-ok'||a==='dik-no')res=await sb.rpc('ks_bcks_set_diklat_result',{p_submission_id:id,p_lulus:a==='dik-ok',p_note:noteFor(id)});else if(a==='cert-ok'||a==='cert-no')res=await sb.rpc('ks_bcks_review_certificate',{p_submission_id:id,p_approve:a==='cert-ok',p_note:noteFor(id)});if(res?.error)throw res.error;toast('Status berhasil diperbarui.');await renderReviewer()}catch(e){toast(e.message||String(e),true)}}))}
async function render(){ensureSection();ensureNav();if(isLeader()||isKabid())return renderLeadershipDiklat();if(isCoordinator())return renderCoordinatorDiklat();if(isReviewer())return renderReviewer();if(isApplicant())return renderApplicant();$('diklatKsBcksBody').innerHTML='<div class="card"><div class="notice">Akun ini tidak memiliki akses ke modul Diklat KS/BCKS.</div></div>'}
ensureSection();ensureNav();const nav=$('nav');if(nav){let busy=false;new MutationObserver(()=>{if(busy)return;busy=true;queueMicrotask(()=>{ensureNav();busy=false})}).observe(nav,{childList:true})}
const priorShow=window.showTab;window.showTab=async id=>{ensureSection();ensureNav();await priorShow(id);if(id==='diklatKsBcks')await render()};
window.__simantabDiklatKsBcks={version:18,totalPengusulCard:true,adminFlow:'KOORDINATOR_ASSIGN_STAFF_VERIFY_DIRECT_KABID',superAdminResetDraft:true,participantSearch:true,paktaUploadFallback:true,fixedKabidComment:true,persistKabidApproval:true,levels:['ADMINISTRASI','SUBSTANSI','DIKLAT','SERTIFIKAT'],certificateFlow:'PESERTA_ISI_ADMIN_KSPS_APPROVE',fileLimit:FILE_LIMIT,coordinatorAggregateOnly:true,leaderAggregateOnly:true,kabidAggregateOnly:true};
})();