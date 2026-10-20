/* SIMANTAB_SMARTGTK_UNIFIED_INTAKE_V1: user reports data once; backend classifies 3 potential routes */
(async()=>{
if(window.__simantabSmartGtkLoaded)return;
window.__simantabSmartGtkLoaded=true;
await new Promise(resolve=>{
 const ready=()=>window.__simantabSb&&window.__simantabProfile?.role&&typeof window.showTab==='function';
 if(ready())return resolve();
 const next=()=>{if(ready()){window.removeEventListener('simantab:profile-ready',next);resolve()}};
 window.addEventListener('simantab:profile-ready',next);
});
const sb=window.__simantabSb,p=()=>window.__simantabProfile||{};
const gtk=()=>p().account_channel==='GTK'&&p().approval_status==='APPROVED'&&p().is_active!==false;
const dinas=()=>p().account_channel==='DINAS'&&['SUPER_ADMIN','KABID','STAFF_USUL_SK'].includes(p().role)&&p().approval_status==='APPROVED'&&p().is_active!==false;
const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const qualified=['S1','DIV','S2','S3'];
const options={
 employment:[['','Pilih status kepegawaian'],['PNS','PNS'],['PPPK','PPPK'],['PPPK_PW','PPPK paruh waktu'],['NON_ASN','Non-ASN'],['LAINNYA','Lainnya']],
 jf_sk:[['','Pilih'],['YA','Sudah ada SK JF Guru'],['TIDAK','Belum ada SK JF Guru'],['BELUM_TAHU','Belum tahu']],
 old_position:[['','Pilih jabatan sesuai SK'],...['Guru Pertama','Guru Muda','Guru Madya','Guru Ahli Pertama','Guru Ahli Muda','Guru Ahli Madya','Jabatan lain pada SK'].map(x=>[x,x])],
 nomenclature_updated:[['','Pilih'],['YA','Sudah disesuaikan'],['TIDAK','Belum disesuaikan'],['BELUM_TAHU','Belum tahu'],['TIDAK_BERLAKU','Tidak berlaku']],
 pns_jf_formation:[['','Pilih'],['YA','Formasi awal PNS JF Guru'],['TIDAK','Bukan formasi PNS JF Guru'],['BELUM_TAHU','Belum tahu']],
 education:[['','Pilih ijazah terakhir'],...['SLTA','SPG','DI','DII','DIII','S1','DIV','S2','S3'].map(x=>[x,({'DI':'D-I','DII':'D-II','DIII':'D-III','DIV':'D-IV','S1':'S-1','S2':'S-2','S3':'S-3'}[x]||x)])],
 study_status:[['','Pilih perkembangan studi'],['BELUM_KULIAH','Belum melanjutkan kuliah'],['SEDANG_KULIAH','Sedang kuliah'],['LULUS_BELUM_VERIF','Lulus, belum diverifikasi'],['SUDAH_MEMENUHI','Sudah S-1/D-IV atau lebih tinggi']]
};
const meanings={
 POTENSI_USUL:'Potensi usulan — perlu verifikasi Dinas',
 TERTAHAN_KUALIFIKASI:'Potensi usul setelah pemenuhan kualifikasi',
 PERLU_DATA:'Perlu konfirmasi data',
 TIDAK_TERINDIKASI:'Tidak terindikasi',
 PERLU_PEMENUHAN_2030:'Perlu pemenuhan S-1/D-IV (D-I–D-III)',
 TELAAH_KHUSUS:'SLTA/SPG: pemeriksaan khusus',
 DINYATAKAN_MEMENUHI_BELUM_VERIFIKASI:'Sudah memenuhi menurut pernyataan, ijazah belum diverifikasi'
};
let old=null,education=null,items=[],pg=0,busy=false;
const modal=document.createElement('div');modal.id='smartgtkModal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
modal.innerHTML='<div class="sg-container"><div class="sg-head"><b>SMART-GTK • Satu Data, Tiga Analisis</b><button type="button" data-action="close">✕ Tutup</button></div><p id="sgMessage" role="status"></p><div id="sgBody"></div></div>';document.body.append(modal);
const style=document.createElement('style');
style.textContent='#smartgtkModal{display:none;position:fixed;inset:0;z-index:1000010;background:#10223fcb;padding:12px;overflow:auto;align-items:flex-start;justify-content:center}#smartgtkModal .sg-container{background:#fff;color:#1b3451;border-radius:14px;padding:17px;width:min(940px,100%);max-height:calc(100vh - 24px);overflow:auto;font:14px system-ui,sans-serif}#smartgtkModal .sg-head,#smartgtkModal .sg-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}#smartgtkModal .sg-box{border:1px solid #d5e0ed;border-radius:11px;margin:12px 0;padding:12px}#smartgtkModal .sg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#smartgtkModal label{display:flex;flex-direction:column;gap:6px;margin:7px 0}#smartgtkModal select,#smartgtkModal input{box-sizing:border-box;width:100%;padding:10px;border-radius:8px;border:1px solid #aebed1;color:#1d3652;background:white}#smartgtkModal button{cursor:pointer;padding:9px;border-radius:8px;border:1px solid #9dbed7;background:#eaf4fc;color:#185782;font-weight:700}#smartgtkModal button.primary{background:#ee7d17;border:0;color:white}#smartgtkModal .sg-note{background:#edf6ff;border-radius:9px;padding:10px;line-height:1.5}#smartgtkModal .sg-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}#smartgtkModal .sg-result{border:1px solid #b9cadc;border-radius:9px;padding:11px}#smartgtkModal .sg-result b{display:block;margin-bottom:8px}#smartgtkModal .sg-scroll{overflow:auto}#smartgtkModal table{min-width:610px;border-collapse:collapse;width:100%}#smartgtkModal td,#smartgtkModal th{border-bottom:1px solid #dbe5ef;padding:9px;text-align:left;vertical-align:top}@media(max-width:650px){#smartgtkModal .sg-grid,#smartgtkModal .sg-results{grid-template-columns:1fr}}';document.head.append(style);
const body=()=>document.getElementById('sgBody');
const info=(s='',error=false)=>{const el=document.getElementById('sgMessage');el.textContent=s;el.style.color=error?'#ae2d25':'#156595'};
const option=(v,l,selected)=>'<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(l)+'</option>';
const select=(name,label,value,required=true)=>'<label>'+esc(label)+'<select name="'+name+'" '+(required?'required':'')+'>'+options[name].map(([v,l])=>option(v,l,value)).join('')+'</select></label>';
const input=(name,label,value,type='text')=>'<label>'+esc(label)+'<input name="'+name+'" type="'+type+'" value="'+esc(value||'')+'"></label>';
function tile(){
 const root=document.getElementById('servicesBody');if(!root)return;
 if(!(gtk()||dinas())){document.getElementById('smartgtkTile')?.remove();return}
 if(gtk()){document.getElementById('jf2026ServiceTile')?.remove();document.getElementById('jf2030ServiceTile')?.remove()}
 if(document.getElementById('smartgtkTile'))return;
 const item=document.createElement('div');item.id='smartgtkTile';item.className=gtk()?'service':'card';
 item.style.cssText='padding:14px;margin:12px 0;background:#eef8ff;border:1px solid #b8d9ed;border-radius:12px';
 item.innerHTML='<div class="emoji">🧭</div><h3>SMART-GTK • Satu Formulir, Tiga Analisis</h3><p class="small">Satu kali isi untuk skrining penyesuaian nomenklatur JF Guru, pengangkatan JF Guru, dan pendidikan S-1/D-IV. Bukan pengajuan resmi otomatis.</p><button type="button" class="btn primary">Buka SMART-GTK</button>';
 item.querySelector('button').addEventListener('click',open);
 (gtk()?(root.querySelector('.servicegrid')||root):root).prepend(item);
}
window.__simantabSmartGtkReady=true;
const originalShow=window.showTab;window.showTab=async function(...args){const r=await originalShow.apply(this,args);if(args[0]==='services')setTimeout(tile,60);return r};
const service=document.getElementById('servicesBody');if(service)new MutationObserver(()=>{if(!document.getElementById('smartgtkTile'))tile()}).observe(service,{childList:true});
window.addEventListener('simantab:profile-ready',()=>setTimeout(tile,0));tile();
async function loadGTK(){
 const [a,b]=await Promise.all([
  sb.from('smartgtk_intake').select('*').eq('owner_id',p().id).maybeSingle(),
  sb.from('jf2030_qualification').select('education_initial,study_status,university,study_program,start_year,target_graduation,graduation_date,review_status').eq('owner_id',p().id).maybeSingle()
 ]);
 if(a.error)throw a.error;if(b.error)throw b.error;old=a.data||null;education=b.data||null;
}
function form(){
 const x=old||{},q=education||{},edu=x.education||q.education_initial||'',study=x.study_status||q.study_status||(qualified.includes(edu)?'SUDAH_MEMENUHI':'');
 body().innerHTML='<p class="sg-note">Semua GTK mengisi data yang sama. Identitas berasal dari Profil GTK dan data pendidikan sebelumnya dipakai kembali. SIMANTAB menganalisis secara otomatis; petugas tetap memverifikasi persyaratan sebelum usulan resmi.</p>'+
 '<div class="sg-box"><b>'+esc(p().full_name||'GTK')+'</b><p>NIP '+esc(p().nip||'-')+' • '+esc(p().unit_gtk||p().unit||'')+'</p></div>'+
 '<form id="smartgtkForm"><div class="sg-box"><b>A. Data Kepegawaian</b><div class="sg-grid">'+
 select('employment','Status kepegawaian *',x.employment)+
 select('jf_sk','Kepemilikan SK JF Guru *',x.jf_sk)+
 select('old_position','Jabatan sesuai SK JF (jika ada)',x.old_position,false)+
 select('nomenclature_updated','Penyesuaian nomenklatur SK JF *',x.nomenclature_updated)+
 select('pns_jf_formation','Formasi pengangkatan PNS sebagai JF Guru? *',x.pns_jf_formation)+
 '</div></div><div class="sg-box"><b>B. Pendidikan</b><div class="sg-grid">'+
 select('education','Pendidikan tertinggi yang sudah selesai *',edu)+
 select('study_status','Status studi *',study)+
 input('university','Perguruan tinggi',x.university||q.university)+
 input('program','Program studi',x.study_program||q.study_program)+
 input('start_year','Tahun mulai kuliah',x.start_year||q.start_year,'number')+
 input('target_graduation','Target kelulusan',x.target_graduation||q.target_graduation,'date')+
 input('graduation_date','Tanggal kelulusan sesuai ijazah',x.graduation_date||q.graduation_date,'date')+
 '</div>'+input('notes','Keterangan tambahan (opsional)',x.notes)+'</div>'+
 '<div class="sg-actions"><button type="submit" class="primary">Simpan & Analisis Otomatis</button></div></form>'+
 '<p class="sg-note">Tidak wajib unggah dokumen sekarang. Bukti ijazah dapat menyusul. Hasil klasifikasi bukan keputusan atau SK.</p>'+
 (old?'<div class="sg-actions"><button type="button" data-action="prior">Lihat Analisis Tersimpan</button></div>':'');
 const f=document.getElementById('smartgtkForm');
 function sync(){
  const isDeg=qualified.includes(f.elements.education.value);
  if(isDeg)f.elements.study_status.value='SUDAH_MEMENUHI';
  else if(f.elements.study_status.value==='SUDAH_MEMENUHI')f.elements.study_status.value='';
  for(const o of f.elements.study_status.options)o.disabled=(isDeg&&o.value&&o.value!=='SUDAH_MEMENUHI')||(!isDeg&&o.value==='SUDAH_MEMENUHI');
  const val=f.elements.study_status.value;
  f.elements.graduation_date.required=['SUDAH_MEMENUHI','LULUS_BELUM_VERIF'].includes(val);
  f.elements.university.required=val==='SEDANG_KULIAH';
  f.elements.program.required=val==='SEDANG_KULIAH';
  f.elements.target_graduation.disabled=isDeg;
  if(isDeg)f.elements.target_graduation.value='';
  if(f.elements.employment.value&&f.elements.employment.value!=='PNS'){
   f.elements.pns_jf_formation.value='TIDAK';
   f.elements.nomenclature_updated.value='TIDAK_BERLAKU';
  }
 }
 f.elements.education.addEventListener('change',sync);
 f.elements.study_status.addEventListener('change',sync);
 f.elements.employment.addEventListener('change',sync);
 f.addEventListener('submit',e=>{e.preventDefault();save()});sync();
}
function results(data){
 const branches=[['Penyesuaian Nomenklatur JF',data.nomenklatur],['Pengangkatan JF Guru',data.pengangkatan],['Pemenuhan Pendidikan S-1/D-IV',data.kualifikasi]];
 body().innerHTML='<div class="sg-box"><h3>Hasil Skrining Awal SMART-GTK</h3><p>Seorang GTK bisa masuk lebih dari satu kelompok. Semua tindak lanjut perlu verifikasi petugas.</p><div class="sg-results">'+
 branches.map(([title,val])=>'<div class="sg-result"><b>'+esc(title)+'</b>'+esc(meanings[val]||val)+'</div>').join('')+
 '</div><p class="sg-note">SLTA/SPG memerlukan telaah khusus; tenggat diploma tidak otomatis berlaku. Hasil tidak menerbitkan SK atau menyampaikan usulan resmi.</p>'+
 '<div class="sg-actions"><button data-action="edit">Perbarui Data</button><button data-action="education">Lihat Dokumen Pendidikan</button></div></div>';
}
async function save(){
 if(!gtk())throw Error('Hanya GTK aktif yang dapat menyimpan');
 const f=document.getElementById('smartgtkForm');if(!f||!f.reportValidity())return;
 const v=Object.fromEntries(new FormData(f).entries());
 if(v.jf_sk==='YA'&&!v.old_position){info('Silakan pilih jabatan sesuai SK Jabfung.',true);return}
 const args={p_employment:v.employment,p_jf_sk:v.jf_sk,p_old_position:v.old_position||'',p_nomenclature_updated:v.nomenclature_updated,p_pns_jf_formation:v.pns_jf_formation,
 p_education:v.education,p_study_status:v.study_status,p_university:v.university||'',p_program:v.program||'',p_start_year:v.start_year?Number(v.start_year):null,p_target_graduation:v.target_graduation||null,p_graduation_date:v.graduation_date||null,p_notes:v.notes||''};
 const r=await sb.rpc('smartgtk_save',args);if(r.error)throw r.error;
 await loadGTK();results(r.data);info('Data tersimpan dan berhasil diklasifikasikan.');
}
async function listDinas(){const r=await sb.rpc('smartgtk_officer_list',{p_page:pg});if(r.error)throw r.error;items=r.data||[]}
function dashboard(){
 const counts={n:0,a:0,q:0};for(const x of items){if(x.screening?.nomenklatur==='POTENSI_USUL')counts.n++;if(['POTENSI_USUL','TERTAHAN_KUALIFIKASI'].includes(x.screening?.pengangkatan))counts.a++;if(['PERLU_PEMENUHAN_2030','TELAAH_KHUSUS'].includes(x.screening?.kualifikasi))counts.q++}
 body().innerHTML='<p class="sg-note">Rekap pada halaman ini saja, bukan seluruh GTK Batang. Data berupa laporan GTK dan bukan keputusan kepegawaian.</p><div class="sg-box"><b>Monitoring Hasil Skrining • Halaman '+(pg+1)+'</b><p>Nomenklatur: '+counts.n+' • Pengangkatan: '+counts.a+' • Kualifikasi: '+counts.q+'</p>'+
 '<div class="sg-scroll"><table><thead><tr><th>GTK</th><th>Status ASN</th><th>Nomenklatur</th><th>Pengangkatan</th><th>Kualifikasi</th></tr></thead><tbody>'+
 (items.length?items.map(x=>'<tr><td>'+esc(x.full_name)+'<div>'+esc(x.unit_work)+'</div></td><td>'+esc(x.employment)+'</td><td>'+esc(meanings[x.screening?.nomenklatur]||x.screening?.nomenklatur)+'</td><td>'+esc(meanings[x.screening?.pengangkatan]||x.screening?.pengangkatan)+'</td><td>'+esc(x.education)+' — '+esc(meanings[x.screening?.kualifikasi]||x.screening?.kualifikasi)+'</td></tr>').join(''):'<tr><td colspan="5">Belum ada GTK mengisi SMART-GTK.</td></tr>')+
 '</tbody></table></div><div class="sg-actions"><button data-action="prev" '+(pg===0?'disabled':'')+'>Sebelumnya</button><button data-action="next" '+(items.length<50?'disabled':'')+'>Berikutnya</button></div></div>';
}
async function open(){
 if(!gtk()&&!dinas())return;modal.style.display='flex';info('Memuat data...');
 try{if(dinas()){pg=0;await listDinas();dashboard()}else{await loadGTK();form()}info('')}
 catch(e){body().innerHTML='<p class="sg-note">Modul belum diaktifkan pada database ini. Hubungi admin.</p>';info(e.message||String(e),true)}
}
modal.addEventListener('click',async e=>{
 const b=e.target.closest('button[data-action]');if(!b||busy)return;
 const act=b.dataset.action;if(act==='close'){modal.style.display='none';return}
 try{
  busy=true;info('');
  if(act==='edit'){await loadGTK();form()}
  if(act==='education'){modal.style.display='none';window.__simantabJF2030?.open()}
  if(act==='prior'){const x=old;const r=await sb.rpc('smartgtk_classify',{e:x.employment,sk:x.jf_sk,nomen:x.nomenclature_updated,formasi:x.pns_jf_formation,edu:x.education,old_jf:x.old_position});if(r.error)throw r.error;results(r.data)}
  if(act==='next'||act==='prev'){pg=Math.max(0,pg+(act==='next'?1:-1));await listDinas();dashboard()}
 }catch(error){info(error.message||String(error),true)}finally{busy=false}
});
window.__smartGtkUnified={open,version:1,backendRequired:true};
})();