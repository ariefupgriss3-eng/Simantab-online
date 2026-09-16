/* SIMANTAB_GTK_NEEDS_PROGRESS_V1 */
(()=>{
const STATUS_LABEL={NOT_STARTED:'Belum Input',DRAFT:'Draft',SUBMITTED:'Diajukan',VERIFIED:'Diverifikasi',REVISION:'Perlu Perbaikan'};
const STATUS_CLASS={NOT_STARTED:'not',DRAFT:'draft',SUBMITTED:'submitted',VERIFIED:'verified',REVISION:'revision'};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtPct=(a,b)=>b?Math.round((a/b)*100):0;
let lastRender=0;

function style(){
 if(document.getElementById('simGtkNeedsProgressStyle'))return;
 const st=document.createElement('style');st.id='simGtkNeedsProgressStyle';st.textContent=`
 .sim-needs-progress{margin:0 0 14px}.sim-needs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}.sim-needs-metric{background:#fff;border:1px solid #deebf5;border-radius:15px;padding:14px;box-shadow:0 6px 18px rgba(10,53,104,.06)}.sim-needs-metric b{display:block;font-size:26px;color:#0a3568}.sim-needs-metric span{font-size:10px;color:#71869a;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.sim-needs-bar{height:8px;background:#e8eef5;border-radius:99px;overflow:hidden;margin-top:8px}.sim-needs-bar>i{display:block;height:100%;background:linear-gradient(90deg,#0d65ad,#23a474);border-radius:99px}.sim-needs-panel{background:#fff;border:1px solid #deebf5;border-radius:15px;padding:14px;margin-top:10px;box-shadow:0 6px 18px rgba(10,53,104,.055)}.sim-needs-panel h3{margin:0 0 10px;color:#0a3568;font-size:15px}.sim-needs-levels{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.sim-needs-level{background:#f7fafc;border:1px solid #e5edf4;border-radius:12px;padding:11px}.sim-needs-level b{display:block;color:#0a3568}.sim-needs-level small{color:#71869a}.sim-needs-status{display:inline-block;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:900}.sim-needs-status.not{background:#eef2f6;color:#667789}.sim-needs-status.draft{background:#fff2dc;color:#9a5d00}.sim-needs-status.submitted{background:#e7f1ff;color:#175ea7}.sim-needs-status.verified{background:#e9f8ef;color:#16804f}.sim-needs-status.revision{background:#ffefec;color:#b42318}.sim-needs-table{overflow:auto;border:1px solid #e5edf4;border-radius:12px}.sim-needs-table table{width:100%;border-collapse:collapse;font-size:10px}.sim-needs-table th,.sim-needs-table td{padding:8px 9px;border-bottom:1px solid #edf2f6;text-align:left}.sim-needs-table th{background:#f8fafc;color:#71869a}.sim-needs-action{border:0;border-radius:9px;padding:7px 10px;font-weight:850;font-size:10px;cursor:pointer;background:#0a3568;color:#fff}.sim-needs-action.orange{background:#f47a0b}.sim-needs-action.soft{background:#eaf3fb;color:#0a3568}.sim-needs-note{font-size:10px;color:#71869a;line-height:1.45}.sim-needs-tile-badge{display:inline-block;margin-top:7px;padding:4px 7px;border-radius:999px;background:#fff;border:1px solid #dbe7f1;color:#0a3568;font-size:8px;font-weight:900}.sim-needs-school-card{display:flex;justify-content:space-between;gap:12px;align-items:center}.sim-needs-school-card h3{margin:0;color:#0a3568}.sim-needs-school-card p{margin:4px 0 0;color:#657c90;font-size:11px}.sim-needs-filter{width:100%;border:1px solid #dfe8f1;border-radius:9px;padding:8px 10px;margin-bottom:8px}
 @media(max-width:760px){.sim-needs-grid{grid-template-columns:1fr 1fr}.sim-needs-levels{grid-template-columns:1fr}.sim-needs-school-card{align-items:flex-start;flex-direction:column}}
 `;document.head.appendChild(st);
}

function ensureContainer(){
 const sec=document.getElementById('needs');if(!sec)return null;
 let box=document.getElementById('simGtkNeedsProgress');
 if(!box){box=document.createElement('div');box.id='simGtkNeedsProgress';box.className='sim-needs-progress';const body=document.getElementById('needsBody');if(body)sec.insertBefore(box,body);else sec.appendChild(box)}
 return box;
}

function statusFor(npsn,needsSet,workflow){
 const w=workflow.get(npsn);if(w?.status)return w.status;
 return needsSet.has(npsn)?'DRAFT':'NOT_STARTED';
}

function updateTile(text){
 document.querySelectorAll('.sim-premium-tile').forEach(tile=>{
  const oc=tile.getAttribute('onclick')||'';if(!oc.includes("'needs'"))return;
  let b=tile.querySelector('.sim-needs-tile-badge');if(!b){b=document.createElement('span');b.className='sim-needs-tile-badge';tile.appendChild(b)}b.textContent=text;
 });
}

async function render(){
 const now=Date.now();if(now-lastRender<250)return;lastRender=now;
 const sb=window.__simantabSb,profile=window.__simantabProfile,box=ensureContainer();if(!sb||!profile||!box)return;
 style();box.innerHTML='<div class="sim-needs-panel"><div class="sim-needs-note">Memuat progres pengisian Kebutuhan GTK Riil...</div></div>';
 try{
  const isKs=profile.role==='KEPALA_SEKOLAH';
  const [schoolsRes,needsRes,wfRes]=await Promise.all([
   sb.from('school_master').select('npsn,school_name,jenjang,kecamatan,is_active').eq('is_active',true).order('school_name'),
   sb.from('school_gtk_needs').select('school_npsn,updated_at'),
   sb.from('school_gtk_needs_workflow').select('school_npsn,status,note,submitted_at,verified_at,updated_at')
  ]);
  if(needsRes.error)throw needsRes.error;if(wfRes.error)throw wfRes.error;
  const needs=needsRes.data||[],needsSet=new Set(needs.map(x=>x.school_npsn));
  const workflow=new Map((wfRes.data||[]).map(x=>[x.school_npsn,x]));

  if(isKs){
   const npsn=profile.school_npsn||'';const has=needsSet.has(npsn);const status=statusFor(npsn,needsSet,workflow);const wf=workflow.get(npsn);
   updateTile(`Status sekolah: ${STATUS_LABEL[status]}`);
   let action='';
   if(has&&(status==='DRAFT'||status==='REVISION'))action='<button class="sim-needs-action orange" onclick="simGtkNeedsSubmit()">Ajukan ke Dinas</button>';
   box.innerHTML=`<div class="sim-needs-panel sim-needs-school-card"><div><div class="sim-needs-note">STATUS PENGISIAN SEKOLAH</div><h3>${esc(profile.unit||'Sekolah')}</h3><p>NPSN ${esc(npsn||'-')} • ${has?'Data kebutuhan sudah tersedia':'Belum ada data kebutuhan'}</p>${wf?.note?`<p><b>Catatan Dinas:</b> ${esc(wf.note)}</p>`:''}</div><div><span class="sim-needs-status ${STATUS_CLASS[status]}">${STATUS_LABEL[status]}</span> ${action}</div></div>`;
   return;
  }

  if(schoolsRes.error)throw schoolsRes.error;
  const schools=schoolsRes.data||[],total=schools.length,input=schools.filter(s=>needsSet.has(s.npsn)).length,belum=Math.max(total-input,0);
  const submitted=schools.filter(s=>statusFor(s.npsn,needsSet,workflow)==='SUBMITTED').length;
  const verified=schools.filter(s=>statusFor(s.npsn,needsSet,workflow)==='VERIFIED').length;
  updateTile(`${input}/${total} sekolah sudah input`);

  const levelMap=new Map();schools.forEach(s=>{const k=s.jenjang||'-';if(!levelMap.has(k))levelMap.set(k,{total:0,input:0});const x=levelMap.get(k);x.total++;if(needsSet.has(s.npsn))x.input++});
  const kecMap=new Map();schools.forEach(s=>{const k=s.kecamatan||'Tanpa Kecamatan';if(!kecMap.has(k))kecMap.set(k,{total:0,input:0,submitted:0,verified:0});const x=kecMap.get(k);x.total++;if(needsSet.has(s.npsn))x.input++;const st=statusFor(s.npsn,needsSet,workflow);if(st==='SUBMITTED')x.submitted++;if(st==='VERIFIED')x.verified++});
  const activeSchools=schools.filter(s=>needsSet.has(s.npsn)||workflow.has(s.npsn));
  const levelHtml=[...levelMap.entries()].map(([k,v])=>`<div class="sim-needs-level"><b>${esc(k)}: ${v.input}/${v.total}</b><small>${fmtPct(v.input,v.total)}% sudah input</small><div class="sim-needs-bar"><i style="width:${fmtPct(v.input,v.total)}%"></i></div></div>`).join('');
  const kecHtml=[...kecMap.entries()].sort((a,b)=>a[0].localeCompare(b[0],'id')).map(([k,v])=>`<tr><td><b>${esc(k)}</b></td><td>${v.input}/${v.total}</td><td>${fmtPct(v.input,v.total)}%</td><td>${v.submitted}</td><td>${v.verified}</td></tr>`).join('');
  const schoolHtml=activeSchools.length?activeSchools.map(s=>{const st=statusFor(s.npsn,needsSet,workflow),wf=workflow.get(s.npsn);let act='';if(st==='SUBMITTED'&&['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(profile.role))act=`<button class="sim-needs-action" onclick="simGtkNeedsReview('${esc(s.npsn)}','VERIFIED')">Verifikasi</button> <button class="sim-needs-action soft" onclick="simGtkNeedsReview('${esc(s.npsn)}','REVISION')">Perbaikan</button>`;return `<tr><td><b>${esc(s.school_name)}</b><div class="sim-needs-note">${esc(s.npsn)} • ${esc(s.jenjang||'-')} • ${esc(s.kecamatan||'-')}</div></td><td><span class="sim-needs-status ${STATUS_CLASS[st]}">${STATUS_LABEL[st]}</span>${wf?.note?`<div class="sim-needs-note">${esc(wf.note)}</div>`:''}</td><td>${act||'-'}</td></tr>`}).join(''):'<tr><td colspan="3">Belum ada sekolah yang menginput.</td></tr>';
  box.innerHTML=`
   <div class="sim-needs-grid">
    <div class="sim-needs-metric"><span>Total Sekolah Aktif</span><b>${total}</b><div class="sim-needs-note">Master sekolah SIMANTAB</div></div>
    <div class="sim-needs-metric"><span>Sudah Input</span><b>${input}</b><div class="sim-needs-bar"><i style="width:${fmtPct(input,total)}%"></i></div><div class="sim-needs-note">${fmtPct(input,total)}% dari sekolah aktif</div></div>
    <div class="sim-needs-metric"><span>Belum Input</span><b>${belum}</b><div class="sim-needs-note">Perlu pengisian bertahap</div></div>
    <div class="sim-needs-metric"><span>Diajukan / Diverifikasi</span><b>${submitted} / ${verified}</b><div class="sim-needs-note">Workflow verifikasi Dinas</div></div>
   </div>
   <div class="sim-needs-panel"><h3>Progres per Jenjang</h3><div class="sim-needs-levels">${levelHtml}</div></div>
   <div class="sim-needs-panel"><h3>Progres per Kecamatan</h3><input class="sim-needs-filter" id="simNeedsKecFilter" placeholder="Cari kecamatan..." oninput="simGtkNeedsFilterKec(this.value)"><div class="sim-needs-table"><table id="simNeedsKecTable"><thead><tr><th>Kecamatan</th><th>Sudah/Total</th><th>Progres</th><th>Diajukan</th><th>Diverifikasi</th></tr></thead><tbody>${kecHtml}</tbody></table></div></div>
   <div class="sim-needs-panel"><h3>Status Sekolah yang Sudah Mulai Input</h3><div class="sim-needs-table"><table><thead><tr><th>Sekolah</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${schoolHtml}</tbody></table></div></div>`;
 }catch(e){console.error('GTK needs progress',e);box.innerHTML=`<div class="sim-needs-panel"><div class="sim-needs-note">Progres pengisian belum dapat dimuat: ${esc(e.message||e)}</div></div>`}
}

window.simGtkNeedsSubmit=async()=>{const sb=window.__simantabSb;if(!sb)return;const {error}=await sb.rpc('gtk_needs_submit');if(error){alert(error.message);return}alert('Data Kebutuhan GTK Riil berhasil diajukan ke Dinas.');await render()};
window.simGtkNeedsReview=async(npsn,action)=>{const sb=window.__simantabSb;if(!sb)return;let note=null;if(action==='REVISION'){note=prompt('Catatan perbaikan untuk sekolah:')||'';if(!note.trim())return}if(action==='VERIFIED'&&!confirm('Verifikasi data kebutuhan sekolah ini?'))return;const {error}=await sb.rpc('gtk_needs_review',{p_school_npsn:npsn,p_action:action,p_note:note});if(error){alert(error.message);return}await render()};
window.simGtkNeedsFilterKec=q=>{const s=String(q||'').toLowerCase();document.querySelectorAll('#simNeedsKecTable tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(s)?'':'none')};

function hook(){
 if(window.__simGtkNeedsHooked)return;const original=window.showTab;if(typeof original!=='function'){setTimeout(hook,300);return}window.__simGtkNeedsHooked=true;window.showTab=async function(id){const r=await original.apply(this,arguments);if(id==='needs')setTimeout(render,180);return r};
 const sec=document.getElementById('needs');if(sec?.classList.contains('active'))setTimeout(render,200);
}
style();hook();
})();