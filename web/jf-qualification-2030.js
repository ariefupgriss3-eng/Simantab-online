/* SIMANTAB_JF2030_QUALIFICATION_V1; additional service, not a legal eligibility decision. */
(async()=>{
if(window.__simantabJF2030Loaded)return;
window.__simantabJF2030Loaded=true;
// Await profile-ready instead of timing out before GTK login.
await new Promise(resolve=>{
 const ready=()=>Boolean(window.__simantabSb&&window.__simantabProfile?.role&&typeof window.showTab==='function');
 if(ready()){resolve();return;}
 const onReady=()=>{if(!ready())return;window.removeEventListener('simantab:profile-ready',onReady);resolve();};
 window.addEventListener('simantab:profile-ready',onReady);
});
const sb=window.__simantabSb;if(!sb){window.__simantabJF2030Loaded=false;return;}
const profile=()=>window.__simantabProfile||{};
const officer=()=>profile().account_channel==='DINAS'&&['SUPER_ADMIN','KABID','STAFF_USUL_SK'].includes(profile().role)&&profile().is_active!==false&&profile().approval_status==='APPROVED';
const gtk=()=>profile().account_channel==='GTK'&&profile().is_active!==false&&profile().approval_status==='APPROVED';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const bucket='simantab-jf-ijazah-2030',MAX=1572864;
const status={BELUM_KULIAH:'Belum kuliah',SEDANG_KULIAH:'Sedang kuliah',LULUS_BELUM_VERIF:'Lulus, menunggu verifikasi',SUDAH_MEMENUHI:'Sudah S-1/D-IV atau lebih tinggi (belum diverifikasi)'};
const qualifiedEducation=['S1','DIV','S2','S3'];
const educationLevels=['SLTA','SPG','DI','DII','DIII',...qualifiedEducation];
const reviewStatus={BELUM_DITELAAH:'Belum ditelaah',PERLU_PERBAIKAN:'Perlu perbaikan',TERVERIFIKASI:'Ijazah diverifikasi administratif'};
// Documentary status is derived, not an approval field: a qualification declared by GTK is not verified.
function documentStatus(q){
 if(!q || !q.study_status)return 'Data pendidikan belum diisi';
 if(q.review_status==='TERVERIFIKASI')return 'Ijazah telah diverifikasi Dinas';
 if(q.study_status==='SUDAH_MEMENUHI' && !q.evidence_path)
  return 'Sudah Memenuhi (Pernyataan GTK) — Dokumen Belum Tersedia';
 if(q.review_status==='PERLU_PERBAIKAN')return 'Dokumen perlu perbaikan sesuai catatan Dinas';
 if(q.evidence_path)return 'Dokumen Diunggah — Menunggu Verifikasi Dinas';
 if(q.study_status==='LULUS_BELUM_VERIF')return 'Lulus (Pernyataan GTK) — Dokumen Belum Tersedia';
 return 'Belum ada dokumen ijazah yang diverifikasi';
}
let mine=null,rows=[],total=0,page=0,filter='',busy=false,mode='tracked',coverage=null,unreported=[];
const modal=document.createElement('div');modal.id='jf2030Modal';modal.setAttribute('role','dialog');
modal.innerHTML='<div class="jf2030-panel"><div class="jf2030-head"><b>Pemenuhan S-1/D-IV — 2030</b><button data-act="close">✕ Tutup</button></div><p id="jf2030Msg" role="status"></p><div id="jf2030Body"></div></div>';
document.body.appendChild(modal);
const style=document.createElement('style');
style.textContent='#jf2030Modal{display:none;position:fixed;inset:0;z-index:1000004;overflow:auto;background:#071c38bb;padding:12px;justify-content:center;align-items:flex-start}#jf2030Modal .jf2030-panel{background:white;color:#19344e;width:min(1020px,100%);max-height:calc(100vh - 24px);overflow:auto;padding:16px;border-radius:14px;font:14px system-ui,sans-serif}#jf2030Modal .jf2030-head,#jf2030Modal .jf2030-buttons{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}#jf2030Modal .jf2030-card{padding:12px;border:1px solid #cfdfeb;border-radius:11px;margin:10px 0}#jf2030Modal .jf2030-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#jf2030Modal label{display:flex;flex-direction:column;gap:5px;margin:8px 0}#jf2030Modal input,#jf2030Modal select,#jf2030Modal textarea{width:100%;padding:9px;border:1px solid #b4c6d8;border-radius:7px;box-sizing:border-box;background:#fff;color:#17314b}#jf2030Modal button{padding:9px 12px;border:1px solid #aac9e8;border-radius:8px;background:#eef6ff;color:#175481;font-weight:bold;cursor:pointer}#jf2030Modal button.primary{background:#116ab0;color:white}#jf2030Modal button:disabled{opacity:.5}#jf2030Modal .jf2030-note{background:#eff7ff;padding:12px;border-radius:9px;line-height:1.6}#jf2030Modal table{border-collapse:collapse;min-width:640px;width:100%}#jf2030Modal td,#jf2030Modal th{padding:8px;border-bottom:1px solid #dce6ed;text-align:left}#jf2030Modal .jf2030-scroll{overflow:auto}#jf2030Modal .jf2030-muted{color:#5b7088;font-size:12px}@media(max-width:650px){#jf2030Modal .jf2030-grid{grid-template-columns:1fr}}';
document.head.appendChild(style);
const content=()=>document.getElementById('jf2030Body');
const msg=(s='',err=false)=>{const e=document.getElementById('jf2030Msg');e.textContent=s;e.style.color=err?'#bb241e':'#12649e';};
function tile(){
 const root=document.getElementById('servicesBody');
 if(!(gtk()||officer())||!root||document.getElementById('jf2030ServiceTile'))return;
 const isGtk=gtk();
 const el=document.createElement('div');el.id='jf2030ServiceTile';el.className=isGtk?'service':'card';el.style.cssText='margin:12px 0;padding:13px;background:#f1faf5;border:1px solid #b6dac3;border-radius:12px';
 el.innerHTML='<div class="emoji">📚</div><h3>Pemenuhan Kualifikasi S-1/D-IV • 2030</h3><p class="small">Monitoring D-I/D-II/D-III sampai 11 Mei 2030. SLTA/SPG memerlukan telaah khusus.</p><button type="button" class="btn primary">Buka Monitoring Pendidikan 2030</button>';
 el.querySelector('button').addEventListener('click',open);
 const target=isGtk?(root.querySelector('.servicegrid')||root):root;
 target.prepend(el);
}
const oldShow=window.showTab;window.showTab=async function(...args){const x=await oldShow.apply(this,args);if(args[0]==='services')setTimeout(tile,80);return x;};
const root=document.getElementById('servicesBody');if(root)new MutationObserver(()=>{if(!document.getElementById('jf2030ServiceTile'))tile()}).observe(root,{childList:true});
window.addEventListener('simantab:profile-ready',()=>{
 const existing=document.getElementById('jf2030ServiceTile');
 if(existing&&!(gtk()||officer()))existing.remove();
 setTimeout(tile,0);
});
tile();
function guidance(education){
 const detail=['DI','DII','DIII'].includes(education)
  ?'<b>D-I/D-II/D-III:</b> Pemantauan pemenuhan S-1/D-IV paling lambat <b>11 Mei 2030</b>.'
  :education==='SLTA'||education==='SPG'
   ?'<b>SLTA/SPG:</b> Wajib ditelaah secara individual; tenggat yang disebut untuk diploma tidak otomatis berlaku.'
   :qualifiedEducation.includes(education)
    ?'<b>Sudah S-1/D-IV atau lebih tinggi:</b> Pernyataan GTK tersimpan tanpa perlu langsung mengunggah ijazah. Bukti dapat dilengkapi kemudian untuk verifikasi Dinas.'
    :'<b>Pilih pendidikan terakhir sesuai ijazah</b> agar ketentuan dan formulir yang relevan ditampilkan.';
 return '<p class="jf2030-note">'+detail+'<br>Data ini untuk pembinaan dan pemantauan, bukan penetapan kelayakan Jabfung atau SK.</p>';
}
function opt(v,c,label){return '<option value="'+esc(v)+'" '+(v===c?'selected':'')+'>'+esc(label)+'</option>';}
async function loadMine(){
 const x=await sb.from('jf2030_qualification').select('*').eq('owner_id',profile().id).maybeSingle();if(x.error)throw x.error;mine=x.data||null;
}
async function open(){
 if(!(gtk()||officer()))return;modal.style.display='flex';msg('Memuat data...');
 try{if(officer()){page=0;mode='tracked';await loadCoverage();await loadOfficer();renderOfficer();}else{await loadMine();renderMine();}msg('');}
 catch(e){content().innerHTML='<p>Database pemantauan belum siap. Jangan mengisi data sebelum migrasi dipasang.</p>';msg(e.message||String(e),true);}
}
function renderMine(){
 const x=mine||{},locked=x.review_status==='TERVERIFIKASI';
 content().innerHTML='<div class="jf2030-card"><b>'+esc(profile().full_name||x.full_name||'GTK')+'</b> — NIP '+esc(profile().nip||x.nip||'-')+'<p class="jf2030-muted">'+esc(profile().unit||x.unit_work||'')+'</p></div>'+
 '<div id="jf2030EducationGuidance">'+guidance(x.education_initial)+'</div>'+
 '<div class="jf2030-card"><b>Status verifikasi: '+esc(reviewStatus[x.review_status]||'Belum mengisi')+'</b><p><b>Status dokumen: '+esc(documentStatus(x))+'</b></p><p>'+esc(x.review_note||'')+'</p>'+
 '<form id="jf2030Form"><div class="jf2030-grid">'+
 '<label>Pendidikan terakhir *<select required name="education" '+(locked?'disabled':'')+'>'+opt('','','Pilih pendidikan')+
 educationLevels.map(v=>opt(v,x.education_initial||'',v==='DI'?'D-I':v==='DII'?'D-II':v==='DIII'?'D-III':v==='DIV'?'D-IV':v==='S1'?'S-1':v==='S2'?'S-2':v==='S3'?'S-3':v)).join('')+'</select></label>'+
 '<label>Perkembangan studi *<select required name="status" '+(locked?'disabled':'')+'>'+opt('','','Pilih status')+
 Object.entries(status).filter(([v])=>qualifiedEducation.includes(x.education_initial||'')?v==='SUDAH_MEMENUHI':v!=='SUDAH_MEMENUHI').map(([v,l])=>opt(v,x.study_status||'',l)).join('')+'</select></label>'+
 '<label>Perguruan tinggi<input name="university" maxlength="200" value="'+esc(x.university||'')+'" '+(locked?'disabled':'')+'></label>'+
 '<label>Program studi<input name="program" maxlength="200" value="'+esc(x.study_program||'')+'" '+(locked?'disabled':'')+'></label>'+
 '<label>Tahun mulai<input type="number" min="1970" max="2030" name="year" value="'+esc(x.start_year||'')+'" '+(locked?'disabled':'')+'></label>'+
 '<label>Target kelulusan<input type="date" name="target" value="'+esc(x.target_graduation||'')+'" '+(locked?'disabled':'')+'></label>'+
 '<label>Tanggal kelulusan sesuai ijazah<input type="date" name="graduation" value="'+esc(x.graduation_date||'')+'" '+(locked?'disabled':'')+'></label></div>'+
 '<label>Keterangan pembinaan<textarea name="notes" rows="3" maxlength="2000" '+(locked?'disabled':'')+'>'+esc(x.notes||'')+'</textarea></label>'+
 (locked?'<p class="jf2030-muted">Data ijazah sudah dikunci sesudah diverifikasi.</p>':'<button type="button" class="primary" data-act="save">Simpan Perkembangan Studi</button>')+'</form></div>'+
 (x.study_status==='LULUS_BELUM_VERIF'||x.study_status==='SUDAH_MEMENUHI'?'<div class="jf2030-card"><b>Bukti ijazah S-1/D-IV atau lebih tinggi</b><p class="jf2030-muted">PDF/JPG/PNG • maksimal 1,5 MB • dokumen privat.</p>'+
 (x.evidence_path?'<button data-act="file" data-path="'+esc(x.evidence_path)+'">Lihat bukti tersimpan</button>':'<p class="jf2030-muted">Dokumen belum tersedia. Data pendidikan yang telah disimpan tetap tercatat sebagai pernyataan GTK, dan ijazah dapat diunggah di lain waktu.</p>')+
 (!locked?'<label>Unggah setelah menyimpan status lulus<input id="jf2030Proof" type="file" accept=".pdf,.jpg,.jpeg,.png"></label><button data-act="upload">Unggah Bukti Ijazah</button>':'')+'</div>':'')+
 '<button type="button" data-act="reload">Muat ulang</button>';
 const f=document.getElementById('jf2030Form');
 if(!f)return;
 const refreshFields=()=>{
  const study=f.elements.status.value;
  f.elements.university.required=study==='SEDANG_KULIAH';
  f.elements.program.required=study==='SEDANG_KULIAH';
  f.elements.graduation.required=study==='LULUS_BELUM_VERIF'||study==='SUDAH_MEMENUHI';
  const completed=qualifiedEducation.includes(f.elements.education.value);
  f.elements.target.disabled=locked||completed;
  if(completed)f.elements.target.value='';
 };
 const refreshEducation=()=>{
  const education=f.elements.education.value;
  const completed=qualifiedEducation.includes(education);
  const previous=f.elements.status.value;
  const options=completed?['SUDAH_MEMENUHI']:Object.keys(status).filter(v=>v!=='SUDAH_MEMENUHI');
  f.elements.status.innerHTML=opt('','','Pilih status')+options.map(v=>opt(v,previous,v=== 'SUDAH_MEMENUHI'?'Sudah memenuhi (menunggu verifikasi ijazah)':status[v])).join('');
  f.elements.status.value=completed?'SUDAH_MEMENUHI':options.includes(previous)?previous:'';
  const note=document.getElementById('jf2030EducationGuidance');
  if(note)note.innerHTML=guidance(education);
  refreshFields();
 };
 f.elements.education.addEventListener('change',refreshEducation);
 f.elements.status.addEventListener('change',refreshFields);
 refreshEducation();
}
async function save(){
 if(!gtk())throw Error('Hanya GTK dapat mengisi perkembangan studi');
 const f=document.getElementById('jf2030Form');if(!f?.reportValidity())return;
 const v=Object.fromEntries(new FormData(f).entries());
 const x=await sb.rpc('jf2030_save_progress',{p_education:v.education,p_study_status:v.status,p_university:v.university||'',p_program:v.program||'',p_start_year:v.year?Number(v.year):null,p_target_graduation:v.target||null,p_graduation_date:v.graduation||null,p_notes:v.notes||''});
 if(x.error)throw x.error;await loadMine();renderMine();msg('Data pendidikan berhasil disimpan. '+(mine?.evidence_path?'Dokumen sudah tercatat.':'Dokumen dapat dilengkapi kemudian; verifikasi Dinas belum dilakukan.'));
}
async function upload(){
 if(!gtk()||!['LULUS_BELUM_VERIF','SUDAH_MEMENUHI'].includes(mine?.study_status)||mine.review_status==='TERVERIFIKASI')throw Error('Simpan data ijazah dan tanggal lulus terlebih dahulu.');
 const f=document.getElementById('jf2030Proof')?.files?.[0];
 if(!f)throw Error('Pilih ijazah yang akan diunggah');
 if(f.size<1||f.size>MAX||!['application/pdf','image/png','image/jpeg'].includes(f.type))throw Error('Hanya PDF/JPG/PNG maksimal 1,5 MB');
 const ext=f.type==='application/pdf'?'pdf':f.type==='image/png'?'png':'jpg';
 const path=profile().id+'/IJAZAH-'+crypto.randomUUID()+'.'+ext;
 const u=await sb.storage.from(bucket).upload(path,f,{contentType:f.type,upsert:false});if(u.error)throw u.error;
 const z=await sb.rpc('jf2030_attach_diploma',{p_path:path});if(z.error)throw z.error;
 await loadMine();renderMine();msg('Bukti tersimpan, menunggu pemeriksaan Dinas.');
}
async function loadCoverage(){
 if(!officer())throw Error('Hanya petugas Dinas dapat melihat cakupan akun GTK');
 const x=await sb.rpc('jf2030_coverage_summary');
 if(x.error)throw x.error;
 coverage=x.data;
}
async function loadUnreported(){
 if(!officer())throw Error('Hanya petugas Dinas dapat melihat akun belum melapor');
 const x=await sb.rpc('jf2030_coverage_unreported',{p_page:page,p_limit:50});
 if(x.error)throw x.error;
 unreported=x.data||[];
}
function coverageHeader(){
 if(!coverage)return '<p class="jf2030-note">Rekonsiliasi akun GTK belum tersedia. Data yang tampil hanya pendaftar modul ini.</p>';
 return '<div class="jf2030-card"><b>Cakupan Data Akun GTK SIMANTAB</b>'+
 '<div class="jf2030-grid"><p>Aktif/disetujui: <b>'+esc(coverage.active_approved_gtk_accounts)+'</b></p>'+
 '<p>NIP valid: <b>'+esc(coverage.valid_nip_accounts)+'</b></p>'+
 '<p>NIP ganda yang perlu diperiksa: <b>'+esc(coverage.ambiguous_duplicate_nip_groups)+'</b></p>'+
 '<p>NIP tunggal belum mengisi: <b>'+esc(coverage.unreported_unambiguous_accounts)+'</b></p></div>'+
 '<p class="jf2030-muted"><b>Belum mengisi ≠ belum S-1/D-IV.</b> Cakupan terbatas akun GTK aktif/disetujui di SIMANTAB, bukan populasi semua guru Kabupaten Batang. NIP duplikat tidak otomatis disatukan atau masuk daftar tindak lanjut individual.</p>'+
 '<div class="jf2030-buttons"><button data-act="tracked">Data perkembangan studi</button><button data-act="unreported">Akun belum mengisi</button></div></div>';
}
function renderUnreported(){
 const n=Number(coverage?.unreported_unambiguous_accounts||0);
 content().innerHTML=coverageHeader()+
 '<div class="jf2030-card"><h3>GTK yang belum mengisi data pendidikan</h3>'+
 '<p class="jf2030-muted">Daftar rekonsiliasi dan sosialisasi pengisian. Bukan daftar guru yang diketahui belum S-1/D-IV. Akses khusus petugas Dinas.</p>'+
 '<p>'+n+' akun dengan NIP tunggal yang belum melapor • Halaman '+(page+1)+'</p>'+
 '<div class="jf2030-scroll"><table><thead><tr><th>GTK</th><th>NIP</th><th>Unit kerja</th><th>Role akun</th><th>Status pendataan</th></tr></thead><tbody>'+
 (unreported.length?unreported.map(x=>'<tr><td>'+esc(x.full_name||'Belum diisi')+'</td><td>'+esc(x.nip)+'</td><td>'+esc(x.unit_work)+'</td><td>'+esc(x.account_role)+'</td><td>Belum mengisi</td></tr>').join(''):'<tr><td colspan="5">Tidak ada akun belum mengisi pada halaman ini.</td></tr>')+
 '</tbody></table></div><div class="jf2030-buttons"><button data-act="prev" '+(page===0?'disabled':'')+'>Sebelumnya</button>'+
 '<button data-act="next" '+((page+1)*50>=n?'disabled':'')+'>Berikutnya</button></div></div>';
}
async function loadOfficer(){
 let q=sb.from('jf2030_qualification').select('owner_id,nip,full_name,unit_work,education_initial,study_status,university,study_program,start_year,target_graduation,graduation_date,evidence_path,review_status,review_note,updated_at',{count:'exact'}).order('updated_at',{ascending:false});
 if(filter)q=q.eq('education_initial',filter);
 const x=await q.range(page*50,page*50+49);if(x.error)throw x.error;rows=x.data||[];total=x.count||0;
}
function renderOfficer(){
 const late=rows.filter(x=>['DI','DII','DIII'].includes(x.education_initial)&&x.target_graduation>'2030-05-11'&&x.review_status!=='TERVERIFIKASI').length;
 content().innerHTML=coverageHeader()+'<p class="jf2030-note">D-I/D-II/D-III: pemantauan 11 Mei 2030. SLTA/SPG: telaah khusus. S-1/D-IV atau lebih tinggi: sudah dilaporkan GTK, tetapi belum tentu ijazah diverifikasi.</p>'+'<div class="jf2030-card"><b>Monitoring Dinas</b> — '+total+' data • halaman '+(page+1)+'<p>'+late+' target di halaman ini melewati tenggat diploma.</p>'+
 '<label>Filter pendidikan<select id="jf2030Filter">'+opt('','','Semua')+educationLevels.map(v=>opt(v,filter,v)).join('')+'</select></label><button data-act="filter">Terapkan filter</button>'+
 '<div class="jf2030-scroll"><table><thead><tr><th>Guru/NIP</th><th>Sekolah</th><th>Ijazah awal</th><th>Progres</th><th>Verifikasi</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map(x=>'<tr><td>'+esc(x.full_name)+'<br>'+esc(x.nip)+'</td><td>'+esc(x.unit_work)+'</td><td>'+esc(x.education_initial)+'</td><td>'+esc(status[x.study_status])+'</td><td>'+esc(reviewStatus[x.review_status])+'<div class="jf2030-muted">'+esc(documentStatus(x))+'</div></td><td><button data-act="detail" data-id="'+esc(x.owner_id)+'">Detail</button></td></tr>').join(''):'<tr><td colspan="6">Belum ada data.</td></tr>')+
 '</tbody></table></div><div class="jf2030-buttons"><button data-act="prev" '+(page===0?'disabled':'')+'>Sebelumnya</button><button data-act="next" '+((page+1)*50>=total?'disabled':'')+'>Berikutnya</button></div></div>';
}
function renderDetail(x){
 content().innerHTML='<button data-act="back">← Daftar</button><div class="jf2030-card"><h3>'+esc(x.full_name)+'</h3><p>'+esc(x.nip)+' • '+esc(x.unit_work)+'</p><p>Pendidikan terakhir: '+esc({'DI':'D-I','DII':'D-II','DIII':'D-III','DIV':'D-IV','S1':'S-1','S2':'S-2','S3':'S-3'}[x.education_initial]||x.education_initial)+' • '+esc(status[x.study_status])+'</p>'+guidance(x.education_initial)+
 '<p>Perguruan tinggi: '+esc(x.university)+' • Program: '+esc(x.study_program)+'</p><p>Tahun mulai: '+esc(x.start_year||'-')+' • Target: '+esc(x.target_graduation||'-')+' • Lulus: '+esc(x.graduation_date||'-')+'</p>'+
 '<p>Verifikasi: '+esc(reviewStatus[x.review_status])+' • '+esc(x.review_note||'')+'</p><p><b>Status dokumen: '+esc(documentStatus(x))+'</b></p>'+
 (x.evidence_path?'<button data-act="file" data-path="'+esc(x.evidence_path)+'">Lihat bukti ijazah</button>':'<p>Bukti belum diunggah.</p>')+
 (x.review_status==='TERVERIFIKASI'?'':'<div class="jf2030-buttons"><button data-act="review" data-next="PERLU_PERBAIKAN" data-id="'+esc(x.owner_id)+'">Minta perbaikan</button><button class="primary" data-act="review" data-next="TERVERIFIKASI" data-id="'+esc(x.owner_id)+'" '+(x.evidence_path?'':'disabled')+'>Verifikasi administratif</button></div>')+'</div>';
}
async function viewFile(path){
 const popup=window.open('about:blank','_blank');
 const x=await sb.storage.from(bucket).createSignedUrl(path,60);if(x.error){popup?.close();throw x.error;}
 if(popup)popup.location.href=x.data.signedUrl;else window.location.assign(x.data.signedUrl);
}
async function review(id,next){
 if(!officer())throw Error('Hanya petugas Dinas');
 const note=window.prompt(next==='TERVERIFIKASI'?'Catat dasar pemeriksaan ijazah, bukan keputusan pengangkatan:':'Tulis kekurangan berkas atau data:','');
 if(note===null)return;if(note.trim().length<5)throw Error('Minimal lima karakter dalam catatan.');
 const r=await sb.rpc('jf2030_review',{p_owner_id:id,p_next_status:next,p_note:note});if(r.error)throw r.error;
 await loadOfficer();renderOfficer();msg('Keputusan tercatat.');
}
modal.addEventListener('click',async e=>{
 const b=e.target.closest('button[data-act]');if(!b||busy)return;
 const a=b.dataset.act;if(a==='close'){modal.style.display='none';msg();return;}
 try{busy=true;msg();
 if(a==='save')await save();if(a==='upload')await upload();if(a==='file')await viewFile(b.dataset.path);
 if(a==='reload'){await loadMine();renderMine();}
 if(a==='tracked'){mode='tracked';page=0;await loadCoverage();await loadOfficer();renderOfficer();}
 if(a==='unreported'){mode='unreported';page=0;await loadCoverage();await loadUnreported();renderUnreported();}
 if(a==='filter'){mode='tracked';filter=document.getElementById('jf2030Filter').value;page=0;await loadOfficer();renderOfficer();}
 if(a==='prev'||a==='next'){
  page=Math.max(0,page+(a==='next'?1:-1));
  if(mode==='unreported'){await loadUnreported();renderUnreported();}
  else{await loadOfficer();renderOfficer();}
 }
 if(a==='back')renderOfficer();
 if(a==='detail'){const x=rows.find(z=>z.owner_id===b.dataset.id);if(x)renderDetail(x);}
 if(a==='review')await review(b.dataset.id,b.dataset.next);
 }catch(x){msg(x.message||String(x),true);}finally{busy=false;}
});
window.__simantabJF2030={open,version:4,backendRequired:true};
})();