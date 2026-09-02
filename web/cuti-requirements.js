/* SIMANTEB_CUTI_REQUIREMENTS_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.openSubmission||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};if(!sb)return;
const MAX=512000,ACCEPT='.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',MIME=['application/pdf','image/jpeg','image/png'];
const TYPES={
 TAHUNAN:{label:'Cuti Tahunan',docs:[['CUTI_FORMULIR','Formulir Cuti'],['CUTI_SK_TERAKHIR','SK Terakhir']]},
 SAKIT:{label:'Cuti Sakit',docs:[['CUTI_FORMULIR','Formulir Cuti'],['CUTI_SK_TERAKHIR','SK Terakhir'],['CUTI_SURAT_SAKIT_DOKTER','Surat Keterangan Sakit dari Dokter Keluarga / Puskesmas / Rumah Sakit']]},
 MELAHIRKAN:{label:'Cuti Melahirkan',docs:[['CUTI_FORMULIR','Formulir Cuti'],['CUTI_SK_TERAKHIR','SK Terakhir'],['CUTI_SURAT_HPL','Surat Keterangan Dokter yang menunjukkan HPL'],['CUTI_KK','KK'],['CUTI_AKTA_NIKAH','Akta Nikah']]},
 ALASAN_PENTING:{label:'Cuti Alasan Penting',note:'Contoh: menunggui anak atau suami yang berada di rumah sakit.',docs:[['CUTI_FORMULIR','Formulir Cuti'],['CUTI_SK_TERAKHIR','SK Terakhir'],['CUTI_DOKUMEN_PENDUKUNG_RS','Dokumen Pendukung (Surat Keterangan dari RS)']]},
 BESAR_UMROH:{label:'Cuti Besar (Umroh)',docs:[['CUTI_FORMULIR','Formulir Cuti'],['CUTI_SK_TERAKHIR','SK Terakhir'],['CUTI_SURAT_BIRO','Surat Keterangan dari Biro'],['CUTI_PELUNASAN','Pelunasan']]},
 BESAR_HAJI:{label:'Cuti Besar (Haji)',docs:[['CUTI_FORMULIR','Formulir Cuti'],['CUTI_SK_TERAKHIR','SK Terakhir'],['CUTI_SURAT_KEMENAG','Surat Keterangan dari Kemenag'],['CUTI_PELUNASAN','Pelunasan'],['CUTI_JADWAL_KEBERANGKATAN','Jadwal Keberangkatan']]}
};
const ALL_LABEL=Object.fromEntries(Object.values(TYPES).flatMap(x=>x.docs));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const safe=n=>String(n||'file').normalize('NFKD').replace(/[^\w.\-]+/g,'_').slice(-100);
let cutiActive=false;
function fileBad(f){if(!f)return 'Berkas wajib dipilih.';if(f.size>MAX)return 'Ukuran maksimal 500 KB.';if(!MIME.includes(f.type))return 'Format harus PDF/JPG/PNG.';return ''}
function renderDocs(){const type=$('cutiType')?.value||'',box=$('cutiDocs');if(!box)return;const cfg=TYPES[type];if(!cfg){box.innerHTML='<div class="notice">Pilih jenis cuti untuk menampilkan persyaratan berkas.</div>';return}box.innerHTML=`${cfg.note?`<div class="info" style="margin-bottom:10px">${esc(cfg.note)}</div>`:''}<div class="grid">${cfg.docs.map(([code,label],i)=>`<div class="field s6"><label>${i+1}. ${esc(label)} <span style="color:#b42318">*</span></label><input id="cutiFile_${code}" type="file" accept="${ACCEPT}"><div class="small">PDF/JPG/PNG • maksimal 500 KB.</div></div>`).join('')}</div><div class="info"><b>${cfg.docs.length} berkas wajib.</b> Usulan tidak dapat dinyatakan selesai sebelum seluruh dokumen lengkap.</div>`}
window.renderCutiRequirements=renderDocs;
function renderForm(){
 cutiActive=true;const title=$('newSubTitle');if(title)title.textContent='Pengajuan Cuti';
 const card=$('newSubmission')?.querySelector('.card');if(!card)return;
 card.innerHTML=`<div class="field"><label>Jenis Cuti</label><select id="cutiType" onchange="renderCutiRequirements()"><option value="">Pilih jenis cuti...</option>${Object.entries(TYPES).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select></div><div class="field"><label>Judul/Keperluan</label><input id="cutiTitle" value="Permohonan Cuti"></div><div class="field"><label>Keterangan</label><textarea id="cutiDesc" placeholder="Tuliskan keterangan tambahan bila diperlukan."></textarea></div><div id="cutiDocs"><div class="notice">Pilih jenis cuti untuk menampilkan persyaratan berkas.</div></div><button id="sendCutiBtn" class="btn primary" style="margin-top:12px" onclick="sendCutiSubmission()">Kirim Usulan Cuti</button><div id="subMsg"></div>`;
}
const prevOpen=window.openSubmission;
window.openSubmission=(type,title)=>{const r=prevOpen(type,title);cutiActive=type==='CUTI';if(cutiActive)setTimeout(renderForm,30);return r};
window.sendCutiSubmission=async()=>{
 const type=$('cutiType')?.value||'',cfg=TYPES[type],msg=$('subMsg'),btn=$('sendCutiBtn');if(!cfg){msg.className='err';msg.textContent='Pilih jenis cuti terlebih dahulu.';return}
 const files=[];for(const [code,label] of cfg.docs){const f=$(`cutiFile_${code}`)?.files?.[0],bad=fileBad(f);if(bad){msg.className='err';msg.textContent=`${label}: ${bad}`;return}files.push({code,label,file:f})}
 btn.disabled=true;msg.className='small';msg.textContent='Mengirim usulan dan berkas cuti...';let sub=null;const uploaded=[];
 try{
  const {data,error}=await sb.from('submissions').insert({user_id:p().id,service_type:'CUTI',leave_type:type,title:$('cutiTitle')?.value.trim()||cfg.label,description:$('cutiDesc')?.value.trim()||''}).select('*').single();if(error)throw error;sub=data;
  for(const x of files){const path=`${p().id}/${sub.id}/${x.code}_${crypto.randomUUID()}_${safe(x.file.name)}`;const {error:ue}=await sb.storage.from('simantab-documents').upload(path,x.file,{contentType:x.file.type,upsert:false});if(ue)throw ue;uploaded.push(path);const {error:me}=await sb.from('submission_files').insert({submission_id:sub.id,user_id:p().id,storage_path:path,file_name:x.file.name,file_size:x.file.size,mime_type:x.file.type,requirement_code:x.code});if(me)throw me}
  msg.className='okmsg';msg.textContent=`Usulan ${cfg.label} berhasil dikirim dengan ${files.length}/${files.length} berkas lengkap.`;setTimeout(()=>window.showTab('status'),700);if(window.refreshAll)await window.refreshAll();
 }catch(e){if(uploaded.length)await sb.storage.from('simantab-documents').remove(uploaded);if(sub?.id)await sb.from('submissions').delete().eq('id',sub.id);msg.className='err';msg.textContent=e?.message||String(e)}finally{btn.disabled=false}
};
const prevSend=window.sendSubmission;window.sendSubmission=async()=>cutiActive?window.sendCutiSubmission():prevSend();
async function checklist(){
 const body=$('monitoringBody');if(!body)return;const {data:rows,error}=await sb.from('submissions').select('id,title,leave_type,status,submitted_at').eq('service_type','CUTI').order('submitted_at',{ascending:false}).limit(100);if(error)return;const ids=(rows||[]).map(x=>x.id);let files=[];if(ids.length){const r=await sb.from('submission_files').select('submission_id,requirement_code,file_name').in('submission_id',ids);if(!r.error)files=r.data||[]}
 const existing=$('cutiChecklistCard');if(existing)existing.remove();const card=document.createElement('div');card.id='cutiChecklistCard';card.className='card';card.style.marginBottom='12px';card.innerHTML=`<h3 style="margin-top:0">🗓️ Checklist Persyaratan Cuti</h3>${rows?.length?rows.map(r=>{const cfg=TYPES[r.leave_type],req=cfg?.docs||[],have=new Set(files.filter(f=>f.submission_id===r.id).map(f=>f.requirement_code)),done=req.filter(([c])=>have.has(c)).length,missing=req.filter(([c])=>!have.has(c)).map(([,l])=>l);return `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><b>${esc(cfg?.label||r.leave_type||'Cuti')}</b> — ${esc(r.title||'')}<div class="small">Kelengkapan <b>${done}/${req.length}</b> ${done===req.length?'✅ Lengkap':'• Belum lengkap'}${missing.length?`<br>Belum ada: ${esc(missing.join(', '))}`:''}</div></div>`}).join(''):'<div class="empty">Belum ada usulan Cuti.</div>'}`;body.prepend(card)
}
const prevShow=window.showTab;window.showTab=async id=>{const r=await prevShow(id);if(id==='monitoring'){await wait(80);await checklist()}return r};
window.__simantebCutiRequirements={version:1,types:Object.keys(TYPES),maxBytes:MAX,structuredUploads:true};
})();