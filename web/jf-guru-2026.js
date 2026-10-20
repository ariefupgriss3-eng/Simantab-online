/* SIMANTAB_JF_GURU_SURAT_0294_2026_V1 — separate from E_JABFUNG */
(async()=>{
if(window.__simantabJF2026Loaded)return;
window.__simantabJF2026Loaded=true;
// Wait for actual authentication, including delayed logins and page reloads.
await new Promise(resolve=>{
 const ready=()=>Boolean(window.__simantabSb&&window.__simantabProfile?.role&&typeof window.showTab==='function');
 if(ready()){resolve();return;}
 const onReady=()=>{if(!ready())return;window.removeEventListener('simantab:profile-ready',onReady);resolve();};
 window.addEventListener('simantab:profile-ready',onReady);
});
const sb=window.__simantabSb;
if(!sb){window.__simantabJF2026Loaded=false;return;}
const BUCKET='simantab-jf-guru-2026',LIMIT=1572864;
const OFFICERS=new Set(['SUPER_ADMIN','KABID','STAFF_USUL_SK']);
const p=()=>window.__simantabProfile||{};
const officer=()=>p().account_channel==='DINAS'&&OFFICERS.has(p().role)&&p().is_active!==false&&p().approval_status==='APPROVED';
const applicant=()=>p().account_channel==='GTK'&&p().is_active!==false&&p().approval_status==='APPROVED';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=s=>s?new Date(s).toLocaleDateString('id-ID'):'-';
const statusLabel={DRAFT:'Draf',SUBMITTED:'Diajukan',PERBAIKAN:'Perlu Perbaikan',VERIFIED:'Terverifikasi Staf',DISETUJUI_DINAS:'Disetujui Dinas',DIKIRIM_BKPSDM:'Dikirim ke BKPSDM',SK_TERBIT:'SK Terbit'};
const flow={SUBMITTED:['VERIFIED','PERBAIKAN'],VERIFIED:['DISETUJUI_DINAS','PERBAIKAN'],DISETUJUI_DINAS:['DIKIRIM_BKPSDM','PERBAIKAN'],DIKIRIM_BKPSDM:['SK_TERBIT','PERBAIKAN']};
const docsN=[['SK_JF','SK Pengangkatan Jabatan Fungsional Guru'],['SK_KP','SK Kenaikan Pangkat Terakhir'],['IJAZAH_TERAKHIR','Ijazah terakhir (SLTA/SPG/Diploma/S-1/D-IV; telaah khusus untuk kualifikasi lama)']];
const docsP=[['SK_KP','SK Kenaikan Pangkat Terakhir'],['IJAZAH_TERAKHIR','Ijazah S-1/D-IV'],['SERDIK','Sertifikat Pendidik'],['PENGALAMAN_2TH','Surat Keterangan Pengalaman Mengajar ≥ 2 Tahun'],['SKP_TAHUN_1','Penilaian Kinerja Tahun Pertama (minimal Baik)'],['SKP_TAHUN_2','Penilaian Kinerja Tahun Kedua (minimal Baik)']];
const ranks=['II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'];
const nomenclaturePositions=['Guru Pertama','Guru Muda','Guru Madya','Guru Ahli Pertama','Guru Ahli Muda','Guru Ahli Madya'];
let rows=[],total=0,page=0,pathFilter='',statusFilter='',searchText='',editCase=null,docRows=[],busy=false;
let modal=document.getElementById('simJf2026Modal');
const style=document.createElement('style');style.id='simJf2026Style';
style.textContent=`
#simJf2026Modal{position:fixed;inset:0;z-index:1000002;background:#081c35bf;padding:14px;overflow:auto;display:none;align-items:flex-start;justify-content:center}
#simJf2026Modal .jf-shell{width:min(1100px,100%);min-height:340px;max-height:calc(100vh - 28px);overflow:auto;background:#fff;color:#172c47;border-radius:18px;padding:18px;box-shadow:0 16px 70px #08172f6b;font:14px system-ui,sans-serif}
#simJf2026Modal .jf-top{display:flex;justify-content:space-between;align-items:center;gap:12px}
#simJf2026Modal .jf-help{background:#eff7ff;border:1px solid #d1e5fb;padding:12px;border-radius:12px;line-height:1.5}
#simJf2026Modal .jf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#simJf2026Modal .jf-card{background:#fff;border:1px solid #dce7f1;border-radius:12px;padding:13px;margin:10px 0}
#simJf2026Modal .jf-field{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;min-width:0}
#simJf2026Modal .jf-field label{font-weight:700;font-size:12px}
#simJf2026Modal input,#simJf2026Modal select,#simJf2026Modal textarea{width:100%;padding:10px;border:1px solid #adc5d8;border-radius:9px;background:#fff;color:#183147}
#simJf2026Modal .jf-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
#simJf2026Modal button{border:1px solid #a8c8e5;padding:9px 12px;border-radius:10px;cursor:pointer;background:#f3f8ff;color:#164f88;font-weight:750}
#simJf2026Modal button.jf-primary{background:#116ab0;color:white;border-color:#116ab0}
#simJf2026Modal button:disabled{opacity:.55;cursor:wait}
#simJf2026Modal .jf-table-wrap{overflow:auto;max-width:100%}
#simJf2026Modal table{width:100%;border-collapse:collapse;min-width:640px;font-size:12px}
#simJf2026Modal th,#simJf2026Modal td{border-bottom:1px solid #e2e8f0;text-align:left;padding:9px;vertical-align:top}
#simJf2026Modal .jf-muted{color:#677b8e;font-size:12px;line-height:1.5}
#simJf2026Modal .jf-msg{white-space:pre-line;margin:8px 0;color:#0e5d95}
#simJf2026Modal .jf-bad{color:#b42318}
#simJf2026Modal .jf-file{border-bottom:1px solid #e4e9f0;padding:9px 0}
@media(max-width:700px){#simJf2026Modal .jf-grid{grid-template-columns:1fr}#simJf2026Modal .jf-shell{padding:12px}}
`;
document.head.appendChild(style);
if(!modal){modal=document.createElement('div');modal.id='simJf2026Modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.innerHTML='<div class="jf-shell"><div class="jf-top"><h2 style="margin:0">JF Guru 2026 • Surat 0294</h2><button data-act="close" aria-label="Tutup">✕ Tutup</button></div><div class="jf-msg" id="jf2026Msg" role="status"></div><div id="jf2026Content"></div></div>';document.body.appendChild(modal);}
const content=()=>document.getElementById('jf2026Content');
const msg=(text,error=false)=>{const el=document.getElementById('jf2026Msg');el.textContent=text||'';el.className='jf-msg'+(error?' jf-bad':'');};
const setBusy=b=>{busy=b;modal.querySelectorAll('button[data-act]').forEach(e=>{if(e.dataset.act!=='close')e.disabled=b;});};
function show(){modal.style.display='flex';document.body.style.overflow='hidden';}
function close(){modal.style.display='none';document.body.style.overflow='';editCase=null;msg('');}
function ensureTile(){
 const root=document.getElementById('servicesBody');
 if(!root||!(applicant()||officer())||document.getElementById('jf2026ServiceTile'))return;
 const box=document.createElement('div');box.id='jf2026ServiceTile';box.className='card';
 box.style.cssText='margin:12px 0;border:1px solid #a4c9ed;background:#f4f9ff;padding:13px;border-radius:12px';
 box.innerHTML='<b>📋 Penyesuaian dan Pengangkatan JF Guru 2026</b><div class="small" style="margin:7px 0">Pelaksanaan Surat Dirjen GTK 0294/B/B.B1/HK.07.00/2026. Jalur khusus, tidak menggantikan usul kenaikan jenjang Jabfung lama.</div><button id="jf2026OpenBtn" class="btn primary" type="button">Buka Layanan JF Guru 2026</button>';
 root.prepend(box);box.querySelector('button').addEventListener('click',()=>open());
}
const oldShow=window.showTab;
window.showTab=async function(...args){const r=await oldShow.apply(this,args);if(args[0]==='services')setTimeout(ensureTile,60);return r;};
const serviceRoot=document.getElementById('servicesBody');
if(serviceRoot)new MutationObserver(()=>{if(!document.getElementById('jf2026ServiceTile'))ensureTile();}).observe(serviceRoot,{childList:true});
window.addEventListener('simantab:profile-ready',()=>{
 const tile=document.getElementById('jf2026ServiceTile');
 if(tile&&!(applicant()||officer()))tile.remove();
 setTimeout(ensureTile,0);
});
ensureTile();
window.__openJF2026=()=>open();

async function load(){
 let q=sb.from('jf2026_cases').select('id,owner_id,pathway,full_name,nip,unit_work,old_position,rank_group,education,birth_date,pns_formasi_jf,notes,status,sk_number,sk_date,submitted_at,updated_at,created_at',{count:'exact'}).order('updated_at',{ascending:false});
 if(pathFilter)q=q.eq('pathway',pathFilter);
 if(statusFilter)q=q.eq('status',statusFilter);
 if(searchText)q=q.ilike('full_name','%'+searchText.slice(0,60).replace(/[%_]/g,'')+'%');
 const {data,error,count}=await q.range(page*100,page*100+99);
 if(error)throw error;
 rows=data||[];total=count||0;
}
async function open(){show();msg('Memuat data usulan...');try{page=0;await load();renderList();msg('');}catch(e){content().innerHTML='<div class="jf-card jf-bad">Modul belum tersedia di database atau akses ditolak. Minta admin memeriksa migrasi dan hak akses.</div>';msg(e.message||String(e),true);}}
function renderList(){
 editCase=null;
 const dueN='11 Mei 2027',dueP='11 Mei 2028';
 content().innerHTML=`<p class="jf-help"><b>Dua jalur terpisah:</b> (1) Penyesuaian nomenklatur paling lambat ${dueN}, tanpa pelantikan. (2) Pengangkatan PNS formasi JF Guru yang belum diangkat, paling lambat ${dueP}, dengan pelantikan. Guru diploma wajib S-1/D-IV paling lambat 11 Mei 2030. Seluruh keputusan tetap diverifikasi petugas.</p>
 <div class="jf-actions">${applicant()?'<button data-act="new" data-path="NOMENKLATUR" class="jf-primary">+ Penyesuaian Nomenklatur</button><button data-act="new" data-path="PENGANGKATAN" class="jf-primary">+ Pengangkatan JF Guru</button>':'<span class="jf-muted">Pengajuan baru hanya melalui akun GTK yang disetujui; akun Dinas menangani pemantauan dan verifikasi.</span>'}${officer()?'<button data-act="csv">⬇ Ekspor Rekap CSV</button>':''}<button data-act="qualification">📚 Pemenuhan S-1/D-IV • 2030</button></div>
 <div class="jf-card"><b>${officer()?'Dashboard Pemantauan Dinas':'Daftar Usulan Saya'}</b> <span class="jf-muted">• ${total} kasus sesuai filter • Halaman ${page+1}</span>
 <div class="jf-grid" style="margin-top:10px"><div class="jf-field"><label>Jalur</label><select id="jfFilterPath"><option value="">Semua</option><option value="NOMENKLATUR" ${pathFilter==='NOMENKLATUR'?'selected':''}>Penyesuaian Nomenklatur</option><option value="PENGANGKATAN" ${pathFilter==='PENGANGKATAN'?'selected':''}>Pengangkatan Baru</option></select></div><div class="jf-field"><label>Status</label><select id="jfFilterStatus"><option value="">Semua</option>${Object.entries(statusLabel).map(([v,l])=>`<option value="${v}" ${statusFilter===v?'selected':''}>${esc(l)}</option>`).join('')}</select></div></div>
 <div class="jf-field"><label>Cari nama pemohon</label><input id="jfFilterName" value="${esc(searchText)}" placeholder="Nama guru"><button data-act="filter">Cari / Terapkan Filter</button></div>
 <div class="jf-table-wrap"><table><thead><tr><th>Nama / NIP</th><th>Satuan Kerja</th><th>Jalur</th><th>Status</th><th>Tindak Lanjut</th></tr></thead><tbody>${rows.length?rows.map(x=>`<tr><td><b>${esc(x.full_name)}</b><br><span class="jf-muted">${esc(x.nip)}</span></td><td>${esc(x.unit_work)}</td><td>${x.pathway==='NOMENKLATUR'?'Nomenklatur':'Pengangkatan'}</td><td>${esc(statusLabel[x.status]||x.status)}</td><td><button data-act="view" data-id="${x.id}">Buka</button></td></tr>`).join(''):'<tr><td colspan="5">Belum ada kasus sesuai filter.</td></tr>'}</tbody></table></div>
 <div class="jf-actions"><button data-act="prev" ${page===0?'disabled':''}>← Sebelumnya</button><button data-act="next" ${(page+1)*100>=total?'disabled':''}>Berikutnya →</button></div></div>
 <p class="jf-muted">Catatan: status “Dikirim ke BKPSDM” dicatat oleh petugas berdasarkan bukti administrasi. Modul tidak otomatis terhubung dengan I-Mut, SIMPEG, atau SIASN.</p>`;
}
async function openForm(c,path){
 if(!c&&!applicant())throw new Error('Pengajuan JF Guru 2026 hanya tersedia untuk akun GTK yang disetujui');
 editCase=c||null;docRows=[];
 if(c){const q=await sb.from('jf2026_documents').select('id,code,storage_path,file_name,created_at').eq('case_id',c.id);if(q.error)throw q.error;docRows=q.data||[];}
 const pathway=c?.pathway||path,editable=applicant()&&(!c||((c.owner_id===p().id)&&['DRAFT','PERBAIKAN'].includes(c.status)));
 const isNew=pathway==='PENGANGKATAN',required=isNew?docsP:docsN;
 let warning='';
 if(c?.status==='PERBAIKAN')warning='<p class="jf-help">Petugas meminta perbaikan. Lihat riwayat status di bawah, ganti dokumen yang diperlukan, lalu kirim ulang.</p>';
 const f=(name,label,value='',attrs='')=>`<div class="jf-field"><label for="jf_${name}">${label}</label><input id="jf_${name}" name="${name}" value="${esc(value||'')}" ${attrs} ${editable?'':'disabled'}></div>`;
 content().innerHTML=`<div class="jf-actions"><button data-act="list">← Daftar Usulan</button></div>
 <h3>${isNew?'Pengangkatan PNS ke JF Guru Ahli Pertama':'Penyesuaian Nomenklatur JF Guru'}</h3>
 <p class="jf-help">${isNew?'Batas 11 Mei 2028. Jalur ini khusus PNS dengan formasi JF Guru yang telah mengajar namun belum diangkat dalam JF Guru. Pangkat minimal III/a; pengangkatan dan pelantikan sebelum usia 58 tahun. Tanpa uji kompetensi.':'Batas 11 Mei 2027. Jalur ini bagi pemilik SK JF Guru bernomenklatur lama. Tidak memerlukan pelantikan. Guru D-I sampai D-III wajib memenuhi S-1/D-IV paling lambat 11 Mei 2030.'}</p>
 ${warning}<div class="jf-card"><b>Status:</b> ${esc(statusLabel[c?.status]||'Draf baru')} ${c?.sk_number?'<span class="jf-muted"> • SK '+esc(c.sk_number)+'</span>':''}
 <form id="jf2026Form" autocomplete="off"><div class="jf-grid">
 ${f('full_name','Nama lengkap *',c?.full_name||p().full_name,'required maxlength="160"')}
 ${f('nip','NIP (18 digit) *',c?.nip||p().nip,'required pattern="[0-9]{18}" inputmode="numeric"')}
 ${f('unit_work','Unit kerja *',c?.unit_work||p().unit,'required maxlength="200"')}
 ${isNew?f('old_position','Posisi / tugas mengajar saat ini (jika ada)',c?.old_position||'','maxlength="160"'):
 `<div class="jf-field"><label for="jf_old_position">Jabfung lama (sesuai SK Jabfung) *</label><select id="jf_old_position" name="old_position" ${editable?'':'disabled'} required><option value="" disabled ${c?.old_position?'':'selected'}>Pilih jabatan sesuai SK Jabfung</option>${nomenclaturePositions.map(x=>`<option value="${x}" ${c?.old_position===x?'selected':''}>${x}</option>`).join('')}${c?.old_position&&!nomenclaturePositions.includes(c.old_position)?`<option value="${esc(c.old_position)}" selected>${esc(c.old_position)} (data tersimpan; periksa SK)</option>`:''}</select><span class="jf-muted">Pilih berdasarkan nomenklatur yang tercantum pada SK Jabfung. Untuk jalur pengangkatan baru, tidak wajib memiliki SK Jabfung sebelumnya.</span></div>`}
 <div class="jf-field"><label>Golongan ruang *</label><select name="rank_group" ${editable?'':'disabled'} required><option value="">Pilih golongan</option>${ranks.filter(x=>!isNew||!x.startsWith('II')).map(x=>`<option value="${x}" ${c?.rank_group===x||(!c&&p().golongan_ruang===x)?'selected':''}>${x}</option>`).join('')}</select></div>
 <div class="jf-field"><label>Pendidikan terakhir *</label><select name="education" ${editable?'':'disabled'} required><option value="" disabled ${c?.education?'':'selected'}>Pilih pendidikan sesuai ijazah</option>${(isNew?['S1','DIV']:['SLTA','SPG','DI','DII','DIII','S1','DIV']).map(x=>`<option value="${x}" ${c?.education===x?'selected':''}>${x==='DIV'?'D-IV':x==='S1'?'S-1':x==='SLTA'||x==='SPG'?x:x.replace('D','D-')}</option>`).join('')}</select><span class="jf-muted">Pendidikan wajib dipilih berdasarkan ijazah; belum otomatis terverifikasi di Profil GTK.</span>${!isNew?'<span class="jf-muted">SLTA/SPG dicatat untuk telaah kasus lama, bukan otomatis dinyatakan memenuhi kualifikasi atau ketentuan tenggat diploma.</span>':''}</div>
 ${isNew?`<div class="jf-field"><label>Tanggal lahir (untuk pemeriksaan batas usia)</label><input type="date" name="birth_date" value="${esc(c?.birth_date||'')}" required ${editable?'':'disabled'}></div><div class="jf-field"><label>Formasi kepegawaian</label><label><input style="width:auto" type="checkbox" name="pns_formasi_jf" ${c?.pns_formasi_jf?'checked':''} ${editable?'':'disabled'}> Saya PNS dengan formasi JF Guru</label></div>`:''}
 </div><div class="jf-field"><label>Catatan/keterangan</label><textarea name="notes" rows="3" maxlength="2000" ${editable?'':'disabled'}>${esc(c?.notes||'')}</textarea></div>
 <hr><h4>Dokumen pendukung • PDF/JPG/PNG • maksimal 1,5 MB per berkas</h4>
 ${required.map(([code,label])=>{const d=docRows.find(x=>x.code===code);return`<div class="jf-file"><b>${esc(label)} *</b>${d?`<div class="jf-muted">Sudah diunggah: ${esc(d.file_name)} <button type="button" data-act="file" data-path="${esc(d.storage_path)}">Lihat berkas</button></div>`:'<div class="jf-muted">Belum diunggah</div>'}${editable?`<input type="file" name="file_${code}" data-doc-code="${code}" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png">`:''}</div>`}).join('')}
 ${editable?'<div class="jf-actions"><button data-act="save" type="button">Simpan Draf & Unggah Berkas</button><button data-act="submit" class="jf-primary" type="button">Kirim Usulan ke Dinas</button></div>':''}
 </form></div><div id="jf2026AfterForm"></div>`;
 if(c)await renderTimeline(c);
}
async function renderTimeline(c){
 const out=document.getElementById('jf2026AfterForm');if(!out)return;
 const r=await sb.from('jf2026_events').select('action,from_status,to_status,note,created_at').eq('case_id',c.id).order('created_at',{ascending:false}).limit(40);
 let html='<div class="jf-card"><h4>Jejak Proses (Audit)</h4>';
 if(r.error)html+='<p class="jf-bad">Riwayat belum bisa dibaca.</p>';
 else html+=(r.data||[]).map(x=>`<div class="jf-file"><b>${esc(statusLabel[x.to_status]||x.action)}</b> <span class="jf-muted"> • ${fmt(x.created_at)}</span><div class="jf-muted">${esc(x.note)}</div></div>`).join('');
 if(officer()&&flow[c.status])html+=`<h4>Tindak Lanjut Petugas Dinas</h4><p class="jf-muted">Perubahan status dicatat atas identitas petugas. Untuk SK Terbit, unggah bukti SK terlebih dahulu.</p>${c.status==='DIKIRIM_BKPSDM'?'<div class="jf-field"><label>Unggah bukti SK penetapan dari BKPSDM</label><input type="file" id="jfSkFile" accept=".pdf,.jpg,.jpeg,.png"></div>':''}<div class="jf-actions">${flow[c.status].filter(x=>x!=='DISETUJUI_DINAS'||p().role==='KABID').map(x=>`<button type="button" data-act="transition" data-to="${x}">${esc(statusLabel[x])}</button>`).join('')}</div>`;
 html+='</div>';out.innerHTML=html;
}
async function saveForm(submit){
 if(!applicant())throw new Error('Hanya akun GTK yang dapat menyimpan atau mengirim usulan');
 const form=document.getElementById('jf2026Form');if(!form)throw new Error('Formulir belum tersedia');
 if(!form.reportValidity())return;
 const v=Object.fromEntries(new FormData(form).entries());
 const pathway=editCase?.pathway||modal.dataset.pathway;
 if(!pathway)throw new Error('Jenis jalur belum dipilih');
 const arg={p_id:editCase?.id||null,p_pathway:pathway,p_full_name:v.full_name,p_nip:v.nip,p_unit_work:v.unit_work,
 p_old_position:v.old_position||'',p_rank_group:v.rank_group,p_education:v.education,
 p_birth_date:v.birth_date||null,p_pns_formasi_jf:!!v.pns_formasi_jf,p_notes:v.notes||''};
 const resp=await sb.rpc('jf2026_save_case',arg);
 if(resp.error)throw resp.error;
 const id=resp.data;
 msg('Draf tersimpan. Memproses unggahan berkas...');
 const files=[...form.querySelectorAll('input[data-doc-code]')].filter(x=>x.files?.length);
 for(const input of files){
  const f=input.files[0],code=input.dataset.docCode;
  if(f.size<1||f.size>LIMIT||!['application/pdf','image/jpeg','image/png'].includes(f.type))throw new Error(code+': format atau ukuran tidak sesuai, maksimum 1,5 MB.');
  const ext=f.type==='application/pdf'?'pdf':f.type==='image/png'?'png':'jpg';
  const owner=editCase?.owner_id||p().id;
  const path=owner+'/'+id+'/'+code+'-'+crypto.randomUUID()+'.'+ext;
  const up=await sb.storage.from(BUCKET).upload(path,f,{contentType:f.type,upsert:false});
  if(up.error)throw new Error('Gagal unggah '+code+': '+up.error.message);
  const m=await sb.from('jf2026_documents').upsert({case_id:id,code,storage_path:path,file_name:f.name,mime_type:f.type,file_size:f.size,uploaded_by:p().id},{onConflict:'case_id,code'});
  if(m.error)throw new Error('Gagal catat berkas '+code+': '+m.error.message);
 }
 if(submit){
  const send=await sb.rpc('jf2026_submit_case',{p_case_id:id});
  if(send.error)throw new Error('Draf dan berkas tersimpan, tetapi belum terkirim: '+send.error.message);
 }
 msg(submit?'Usulan berhasil dikirim ke Dinas. Belum merupakan SK.':'Draf dan berkas tersimpan. Silakan lanjutkan berkas yang belum lengkap.');
 await load();renderList();
}
async function transition(to){
 if(!editCase||!officer())throw new Error('Akses petugas diperlukan');
 let note=window.prompt('Catatan petugas untuk perubahan status menjadi '+statusLabel[to]+':','');
 if(note===null)return;
 let sknum=null,skdate=null;
 if(to==='SK_TERBIT'){
  const input=document.getElementById('jfSkFile');
  if(input?.files?.length){
    const f=input.files[0];if(f.size<1||f.size>LIMIT||!['application/pdf','image/png','image/jpeg'].includes(f.type))throw new Error('Bukti SK tidak valid atau melebihi 1,5 MB.');
    const ext=f.type==='application/pdf'?'pdf':f.type==='image/png'?'png':'jpg';
    const path=editCase.owner_id+'/'+editCase.id+'/SK_PENETAPAN-'+crypto.randomUUID()+'.'+ext;
    const up=await sb.storage.from(BUCKET).upload(path,f,{contentType:f.type,upsert:false});
    if(up.error)throw up.error;
    const m=await sb.from('jf2026_documents').upsert({case_id:editCase.id,code:'SK_PENETAPAN',storage_path:path,file_name:f.name,mime_type:f.type,file_size:f.size,uploaded_by:p().id},{onConflict:'case_id,code'});
    if(m.error)throw m.error;
  }
  sknum=window.prompt('Nomor SK penetapan yang sudah resmi terbit:','');
  if(sknum===null)return;
  skdate=window.prompt('Tanggal SK resmi (YYYY-MM-DD):',new Date().toISOString().slice(0,10));
  if(skdate===null)return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(skdate))throw new Error('Format tanggal SK harus YYYY-MM-DD');
 }
 const r=await sb.rpc('jf2026_transition',{p_case_id:editCase.id,p_next_status:to,p_note:note,p_sk_number:sknum,p_sk_date:skdate});
 if(r.error)throw r.error;
 msg('Status berhasil diperbarui dan tercatat dalam audit.');
 await load();renderList();
}
async function viewFile(path){const popup=window.open('about:blank','_blank');const r=await sb.storage.from(BUCKET).createSignedUrl(path,60);if(r.error){popup?.close();throw r.error;}if(popup)popup.location.href=r.data.signedUrl;else window.location.assign(r.data.signedUrl);}
function csvCell(v){let s=String(v??'').replace(/"/g,'""');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s+'"';}
async function exportCsv(){
 if(!officer())throw new Error('Hanya petugas Dinas yang boleh mengunduh rekap');
 const all=[];let at=0;
 for(;;){const r=await sb.from('jf2026_cases').select('full_name,nip,unit_work,pathway,rank_group,education,status,created_at,submitted_at,sk_number,sk_date').order('created_at',{ascending:true}).range(at,at+499);if(r.error)throw r.error;all.push(...(r.data||[]));if((r.data||[]).length<500)break;at+=500;if(at>100000)throw new Error('Rekap terlalu besar');}
 const cols=['full_name','nip','unit_work','pathway','rank_group','education','status','created_at','submitted_at','sk_number','sk_date'];
 const csv='\uFEFF'+cols.join(';')+'\r\n'+all.map(r=>cols.map(c=>csvCell(r[c])).join(';')).join('\r\n');
 const audited=await sb.rpc('jf2026_register_export',{p_row_count:all.length});
 if(audited.error)throw new Error('Audit ekspor gagal, unduhan dibatalkan: '+audited.error.message);
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='Rekap-JF-Guru-2026-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 msg('Rekap '+all.length+' baris diunduh. Berisi data kepegawaian pribadi: simpan hanya pada perangkat dinas yang aman.');
}
modal.addEventListener('click',async ev=>{
 const btn=ev.target.closest('button[data-act]');if(!btn||busy)return;
 const act=btn.dataset.act;
 try{
  if(act==='close'){close();return;}
  if(act==='list'){await load();renderList();msg('');return;}
  if(act==='file'){await viewFile(btn.dataset.path);return;}
  if(act==='qualification'){close();if(!window.__simantabJF2030?.open)throw new Error('Modul pendidikan 2030 belum dimuat');window.__simantabJF2030.open();return;}
  if(act==='new'){if(!applicant())throw new Error('Pengajuan hanya untuk akun GTK');modal.dataset.pathway=btn.dataset.path;await openForm(null,btn.dataset.path);msg('');return;}
  if(act==='view'){
   const item=rows.find(x=>x.id===btn.dataset.id);if(!item)throw new Error('Kasus tidak ditemukan pada halaman ini');
   modal.dataset.pathway=item.pathway;await openForm(item,item.pathway);msg('');return;
  }
  if(act==='filter'){pathFilter=document.getElementById('jfFilterPath')?.value||'';statusFilter=document.getElementById('jfFilterStatus')?.value||'';searchText=document.getElementById('jfFilterName')?.value.trim()||'';page=0;await load();renderList();return;}
  if(act==='next'){page++;await load();renderList();return;}
  if(act==='prev'){page=Math.max(0,page-1);await load();renderList();return;}
  setBusy(true);
  if(act==='save'||act==='submit')await saveForm(act==='submit');
  else if(act==='transition')await transition(btn.dataset.to);
  else if(act==='csv')await exportCsv();
 }catch(e){msg(e.message||String(e),true);}
 finally{setBusy(false);}
});
modal.addEventListener('click',ev=>{if(ev.target===modal&&!busy)close()});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&modal.style.display==='flex'&&!busy)close()});
window.__simantabJF2026={version:1,open,isolatedService:true,source:'Surat Dirjen GTK 0294/B/B.B1/HK.07.00/2026'};
})();
