/* SIMANTAB_ACTIVITY_RESPONSIBLE_SIGNATORY_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};if(!sb)return;
const ROLE_LABEL={SUBKOOR_TK:'Subkoor PPTK TK/PAUD/PNF',KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP'};
const SCOPE={SUBKOOR_TK:'TK_PAUD_PNF',KASI_SD:'SD',KASI_SMP:'SMP'};
const RANKS=['Pembina','Pembina Tk. I','Pembina Utama Muda','Pembina Utama Madya','Pembina Utama'];
let profilesByRole={},editingId=null,editingRow=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function loadResponsibleProfiles(){
 const {data}=await sb.from('profiles').select('id,full_name,role,position').in('role',['SUBKOOR_TK','KASI_SD','KASI_SMP']).eq('is_active',true).order('full_name');
 profilesByRole={};for(const x of (data||[]))if(!profilesByRole[x.role])profilesByRole[x.role]=x;
}
function responsibleRoleFromRow(row){if(row?.responsible_role)return row.responsible_role;for(const [role,x] of Object.entries(profilesByRole))if(x.id===row?.responsible_user_id)return role;return ''}
function decorateResponsible(row=null){
 const sel=$('actResponsible');if(!sel)return;
 const current=responsibleRoleFromRow(row||editingRow);
 sel.innerHTML='<option value="" data-role="">Kabid langsung</option>'+Object.entries(ROLE_LABEL).map(([role,label])=>{const u=profilesByRole[role];const suffix=u?` — ${esc(u.full_name)}`:' — akun pejabat belum aktif';return `<option value="${role}" data-role="${role}" data-user-id="${u?.id||''}">${label}${suffix}</option>`}).join('');
 sel.value=current||'';
 const help=sel.parentElement?.querySelector('.small');if(help)help.textContent='Penanggung jawab ditetapkan berdasarkan jabatan. Akun personal akan tertaut otomatis bila sudah aktif.';
}
function decorateSignatory(row=null){
 const nip=$('actSignNip'),unit=$('actSignUnit');
 if(unit?.closest('.field'))unit.closest('.field').remove();
 if(nip&&!$('actSignRank')){
  const f=document.createElement('div');f.className=nip.closest('.field')?.className||'field s4';
  f.innerHTML=`<label>Pangkat Penandatangan</label><select id="actSignRank"><option value="">Pilih pangkat...</option>${RANKS.map(x=>`<option value="${x}">${x}</option>`).join('')}</select>`;
  nip.closest('.field')?.parentElement?.insertBefore(f,nip.closest('.field'));
 }
 if($('actSignRank'))$('actSignRank').value=row?.signatory_rank||editingRow?.signatory_rank||'';
 const title=$('actSignTitle');if(title){const l=title.closest('.field')?.querySelector('label');if(l)l.textContent='Jabatan Penandatangan';}
}
async function decorate(row=null){await loadResponsibleProfiles();decorateResponsible(row);decorateSignatory(row)}
const originalEdit=window.editActivity;
window.editActivity=async id=>{
 editingId=id;const {data}=await sb.from('field_activities').select('*').eq('id',id).maybeSingle();editingRow=data||null;
 await originalEdit?.(id);await wait(160);await decorate(editingRow);
};
const originalCancel=window.cancelActivityEdit;
window.cancelActivityEdit=async()=>{editingId=null;editingRow=null;return originalCancel?originalCancel():window.showTab('activities')};
const originalSave=window.saveActivityWorkflow||window.saveAuthorizedActivityInput||window.saveActivity;
async function saveFixed(){
 const sel=$('actResponsible'),opt=sel?.selectedOptions?.[0],role=opt?.dataset?.role||'',userId=opt?.dataset?.userId||null,rank=$('actSignRank')?.value||'',name=$('actName')?.value.trim()||'',date=$('actDate')?.value||'',msg=$('actMsg');
 const scope=$('actScope')?.value||$('activityInputScope')?.value||SCOPE[p().role]||editingRow?.scope_level||'ALL';
 if(role&&SCOPE[role]&&SCOPE[role]!==scope){if(msg){msg.className='err';msg.textContent='Lingkup kegiatan harus sesuai dengan jenjang penanggung jawab yang dipilih.';}return}
 let oldValue=null;if(sel&&opt&&role){oldValue=opt.value;opt.value=userId||'';sel.value=userId||'';}
 const targetId=editingId;
 try{await originalSave?.();}finally{if(opt&&role){opt.value=oldValue||role;}}
 let id=targetId;
 if(!id&&name&&date){const {data}=await sb.from('field_activities').select('id').eq('created_by',p().id).eq('activity_name',name).eq('activity_date',date).order('created_at',{ascending:false}).limit(1).maybeSingle();id=data?.id||null;}
 if(id){
  const {error}=await sb.from('field_activities').update({responsible_role:role||null,responsible_user_id:role?(userId||null):null,signatory_rank:rank,signatory_unit:'',updated_at:new Date().toISOString()}).eq('id',id);
  if(error&&msg){msg.className='err';msg.textContent=error.message;return}
 }
 editingId=null;editingRow=null;
}
window.saveActivity=saveFixed;window.saveActivityWorkflow=saveFixed;window.saveAuthorizedActivityInput=saveFixed;
function signatureBlock(a){return `<div style="width:310px;margin:32px 0 0 auto;text-align:center;min-height:145px">${esc(a.signatory_title||'')}${a.signatory_signature?`<img src="${a.signatory_signature}" style="width:150px;height:70px;object-fit:contain;display:block;margin:auto">`:'<br><br><br>'}<b><u>${esc(a.signatory_name||'')}</u></b>${a.signatory_rank?`<br>${esc(a.signatory_rank)}`:''}<br>NIP ${esc(a.signatory_nip||'-')}</div>`}
const dateLabel=v=>v?new Date(`${v}T00:00:00`).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'-';
const timeLabel=v=>v?String(v).slice(0,5):'-';
window.printCommitteeAssignment=async id=>{const {data:a,error}=await sb.from('field_activities').select('*').eq('id',id).maybeSingle();if(error||!a){alert(error?.message||'Kegiatan tidak ditemukan.');return}const members=Array.isArray(a.committee_members)?a.committee_members:[];if(!members.length){alert('Daftar panitia belum diisi. Ubah kegiatan dan isi bagian Panitia Kegiatan terlebih dahulu.');return}const w=window.open('','_blank');if(!w){alert('Izinkan pop-up untuk mencetak Surat Tugas Panitia.');return}const rows=members.map((x,i)=>`<tr><td>${i+1}</td><td><b>${esc(x.name||'')}</b><br>NIP ${esc(x.nip||'-')}</td><td>${esc(x.unit||'-')}</td><td>${esc(x.role||'-')}</td></tr>`).join('');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Surat Tugas Panitia - ${esc(a.activity_name)}</title><style>@page{size:A4;margin:20mm}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.45;color:#111}.kop{text-align:center;border-bottom:3px double #111;padding-bottom:8px;margin-bottom:22px}.kop h3,.kop p{margin:2px}h2{text-align:center;text-decoration:underline;margin:18px 0 4px}.num{text-align:center;margin-bottom:20px}.detail,.members{border-collapse:collapse;width:100%;margin:14px 0}.detail td{padding:4px;vertical-align:top}.detail td:first-child{width:145px}.members th,.members td{border:1px solid #111;padding:7px;vertical-align:top}.members th:first-child,.members td:first-child{width:42px;text-align:center}</style></head><body><div class="kop"><h3>PEMERINTAH KABUPATEN BATANG</h3><h3>DINAS PENDIDIKAN DAN KEBUDAYAAN</h3><p>BIDANG PEMBINAAN KETENAGAAN</p></div><h2>SURAT TUGAS</h2><div class="num">Nomor: ${esc(a.assignment_letter_number||a.document_number||'-')}</div><p>Dalam rangka pelaksanaan kegiatan <b>${esc(a.activity_name)}</b>, dengan ini menugaskan kepada:</p><table class="members"><thead><tr><th>No.</th><th>Nama / NIP</th><th>Unit Kerja</th><th>Jabatan/Peran Panitia</th></tr></thead><tbody>${rows}</tbody></table><p>Untuk melaksanakan tugas sebagai panitia kegiatan dengan ketentuan pelaksanaan sebagai berikut:</p><table class="detail"><tr><td>Mulai</td><td>: ${esc(dateLabel(a.activity_date))}${a.activity_time?' pukul '+esc(timeLabel(a.activity_time)):''}</td></tr><tr><td>Selesai</td><td>: ${esc(dateLabel(a.activity_end_date||a.activity_date))}${a.activity_end_time?' pukul '+esc(timeLabel(a.activity_end_time)):''}</td></tr><tr><td>Tempat</td><td>: ${esc(a.place||'-')}</td></tr><tr><td>Kegiatan</td><td>: ${esc(a.activity_name)}</td></tr></table><p>Surat tugas ini agar dilaksanakan dengan penuh tanggung jawab dan dipergunakan sebagaimana mestinya.</p>${signatureBlock(a)}<script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()};
const previousShow=window.showTab;window.showTab=async id=>{await previousShow(id);if(id==='activities'){await wait(160);editingId=null;editingRow=null;await decorate()}};
if(document.querySelector('.section.active')?.id==='activities'){await wait(160);await decorate()}
})();