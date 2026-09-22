/* SIMANTAB_PERFORMANCE_ACHIEVEMENT_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<300&&(!window.__simantabSb||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),profile=()=>window.__simantabProfile||{};
if(!sb)return;

const ROLE=()=>String(profile().role||'');
const ACCESS_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
const hasAccess=()=>ACCESS_ROLES.has(ROLE())||ROLE().startsWith('STAFF_')||ROLE().startsWith('ADMIN_');
if(!hasAccess())return;

const ROLE_LABEL={
 SUPER_ADMIN:'Super Admin',KEPALA_DINAS:'Kepala Disdikbud',SEKRETARIS_DINAS:'Sekretaris Disdikbud',
 KABID:'Kabid Ketenagaan',KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP',SUBKOOR_TK:'Subkoor PPTK TK/PAUD',
 STAFF_DINAS:'Staf Dinas',STAFF_TPG:'Staf TPG/Tamsil',STAFF_KGB:'Staf KGB',STAFF_KP_EKIN:'Staf KP & E-Kin',
 STAFF_PROMOSI:'Staf Promosi Karir',STAFF_ARSIP:'Staf Arsip/Persuratan',STAFF_SKP:'Staf SKP',
 STAFF_PENSIUN:'Staf Pensiun',STAFF_CUTI:'Staf Izin Cuti',STAFF_SPJ_SIMTENDIK:'Staf SPJ & Simtendik',
 STAFF_USUL_SK:'Staf Usul SK'
};
const SERVICE_LABEL={
 KP:'Kenaikan Pangkat',KGB:'Kenaikan Gaji Berkala',CUTI:'Izin/Cuti',PENSIUN:'Pensiun/Pemberhentian',
 PENSIUN_HUDIS_PIDANA:'Hudis/Pidana',PENSIUN_SKMD:'SKMD',TPG_TAMSIL:'TPG/Tamsil',TPG_KONSULTASI:'Konsultasi TPG/Tamsil',
 USUL_SK:'Usul Penerbitan SK',PTK_BARU_SWASTA:'PTK Baru Swasta',DIKLAT_KS_BCKS:'Diklat KS/BCKS',
 TUGAS_BELAJAR:'Tugas Belajar',PENGEMBANGAN_KOMPETENSI:'Pengembangan Kompetensi',KLARIFIKASI_PAK:'Klarifikasi PAK',
 E_JABFUNG:'Usul/Konsultasi Jabfung',SKP_KS_PENGAWAS:'SKP KS/Pengawas',PAK_KS_PENGAWAS:'PAK KS/Pengawas',
 MUTASI:'Mutasi',USUL_PERCERAIAN:'Usul Perceraian',PEMBINAAN_DISIPLIN:'Pembinaan Disiplin',
 SPK_PPPK:'SPK PPPK',SPK_PPPK_PW:'SPK PPPK Paruh Waktu',LAINNYA:'Layanan Lainnya'
};
const SCOPE_LABEL={TK:'TK',PAUD:'PAUD',PNF:'PNF',TK_PAUD_PNF:'TK/PAUD/PNF',SD:'SD',SMP:'SMP'};
const PERSONAL_ROLES=new Set(['KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
const isStaffRole=r=>String(r||'').startsWith('STAFF_')||String(r||'').startsWith('ADMIN_');
const isPersonalRole=r=>PERSONAL_ROLES.has(String(r||''))||isStaffRole(r);
const canSeeAllPersonal=()=>['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(ROLE());
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clean=s=>String(s??'').replace(/[\u{1F300}-\u{1FAFF}]/gu,'').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
const serviceLabel=s=>SERVICE_LABEL[s]||String(s||'-').replaceAll('_',' ');
const roleLabel=r=>ROLE_LABEL[r]||String(r||'-').replaceAll('_',' ');
const scopeLabel=s=>SCOPE_LABEL[s]||String(s||'-').replaceAll('_',' ');
const dt=v=>v?new Date(v):null;
const fmtDate=v=>v?new Date(v).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'-';
const fmtDateTime=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
const hours=(a,b)=>{const x=dt(a),y=dt(b);return x&&y&&y>=x?(y-x)/36e5:null};
const fmtDuration=h=>h==null?'-':h<24?Math.round(h*10)/10+' jam':Math.round(h/24*10)/10+' hari';
const fileSafe=s=>clean(s).replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'laporan';
const completed=s=>String(s.workflow_state||'')==='SELESAI'||String(s.status||'')==='COMPLETED';

let cache=null,cacheAt=0,currentModel=null,navObserver=null;

function addStyle(){
 if($('performanceAchievementStyle'))return;
 const st=document.createElement('style');st.id='performanceAchievementStyle';st.textContent=`
 .pa-wrap{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}
 .pa-card{grid-column:span 3;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:0 6px 18px #19365a0d}
 .pa-wide{grid-column:span 12}.pa-half{grid-column:span 6}
 .pa-head{grid-column:span 12;background:linear-gradient(135deg,#0f3f76,#1767b3);color:#fff;border-radius:18px;padding:18px}
 .pa-head h2{margin:0;font-size:22px}.pa-head p{margin:6px 0 0;opacity:.9;line-height:1.5}
 .pa-label{font-size:10px;font-weight:900;color:#75889a;text-transform:uppercase;letter-spacing:.04em}
 .pa-num{font-size:30px;font-weight:950;color:#0f3f76;margin:5px 0}.pa-small{font-size:10px;color:#6b7f91;line-height:1.5}
 .pa-filter{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.pa-filter label{font-size:10px;font-weight:850;color:#53697d}
 .pa-filter input,.pa-filter select{width:100%;margin-top:4px;padding:9px 10px;border:1px solid #cfdae5;border-radius:10px;background:#fff}
 .pa-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.pa-btn{border:0;border-radius:10px;padding:9px 12px;font-weight:850;cursor:pointer;background:#0f3f76;color:#fff}
 .pa-btn.soft{background:#edf5ff;color:#0f3f76;border:1px solid #c9dff3}.pa-btn.green{background:#16784d}
 .pa-table{width:100%;border-collapse:collapse;font-size:10px}.pa-table th,.pa-table td{padding:8px;border-bottom:1px solid #e6edf3;text-align:left;vertical-align:top}
 .pa-table th{font-size:9px;text-transform:uppercase;color:#6f8294;white-space:nowrap;background:#fafcfe;position:sticky;top:0}
 .pa-scroll{overflow:auto;max-height:520px;border:1px solid #e3ebf2;border-radius:12px}
 .pa-pill{display:inline-block;padding:4px 7px;border-radius:999px;background:#edf5ff;color:#175ea7;font-size:9px;font-weight:900}
 .pa-note{padding:10px 12px;border-radius:11px;background:#f7fbff;border:1px solid #d8e8f6;font-size:10px;color:#496176;line-height:1.55}
 .pa-empty{padding:18px;border:1px dashed #d5dfe8;border-radius:12px;text-align:center;color:#71869a}
 .pa-servicebar{display:grid;grid-template-columns:minmax(130px,1fr) 2fr 48px;gap:8px;align-items:center;margin:7px 0}.pa-track{height:8px;background:#edf2f7;border-radius:99px;overflow:hidden}.pa-fill{height:100%;background:#1767b3;border-radius:99px}
 @media(max-width:980px){.pa-card{grid-column:span 6}.pa-half{grid-column:span 12}.pa-filter{grid-template-columns:1fr 1fr}}
 @media(max-width:620px){.pa-card{grid-column:span 12}.pa-filter{grid-template-columns:1fr}.pa-head h2{font-size:19px}}
 `;document.head.appendChild(st);
}

function ensureSection(){
 let sec=$('performanceAchievement');
 if(sec)return sec;
 const main=document.querySelector('main.content');if(!main)return null;
 sec=document.createElement('section');sec.id='performanceAchievement';sec.className='section';
 sec.innerHTML='<div id="performanceAchievementBody"><div class="card empty">Memuat modul capaian kinerja…</div></div>';
 main.insertBefore(sec,main.querySelector('.footer'));
 return sec;
}

function makeNavButton(){
 const b=document.createElement('button');b.className='navbtn';b.dataset.tab='performanceAchievement';
 b.innerHTML='<span class="ico">📈</span>Capaian Kinerja';
 b.onclick=e=>{e.preventDefault();window.openPerformanceAchievement?.()};
 return b;
}
function ensureNav(){
 const nav=$('nav');if(!nav||!hasAccess())return;
 let b=nav.querySelector('.navbtn[data-tab="performanceAchievement"]');
 if(b)return;
 b=makeNavButton();
 const accountHead=[...nav.querySelectorAll('.navhead')].find(x=>/akun/i.test(x.textContent||''));
 if(accountHead)nav.insertBefore(b,accountHead);else nav.appendChild(b);
}
function installNavObserver(){
 if(navObserver)return;
 navObserver=new MutationObserver(()=>setTimeout(ensureNav,0));
 const nav=$('nav');if(nav)navObserver.observe(nav,{childList:true,subtree:false});
 for(const ms of [80,250,700,1400])setTimeout(ensureNav,ms);
}

function activate(){
 ensureSection();ensureNav();
 document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active',x.id==='performanceAchievement'));
 document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.tab==='performanceAchievement'));
 $('sidebar')?.classList.remove('open');
 render(true);
}
window.openPerformanceAchievement=activate;

async function fetchData(force=false){
 if(cache&&!force&&Date.now()-cacheAt<45000)return cache;
 const [subs,profiles,assignees]=await Promise.all([
  sb.from('submissions').select('id,user_id,service_type,title,status,scope_level,workflow_state,submitted_at,updated_at,assigned_user_id,assigned_by,assigned_at,staff_verified_by,staff_verified_at,coordinator_approved_by,coordinator_approved_at,kabid_approved_by,kabid_approved_at,workflow_completed_at,staff_response_by,staff_response_at').order('updated_at',{ascending:false}).limit(5000),
  sb.from('profiles').select('id,full_name,nip,unit,position,role,is_active').order('full_name').limit(1000),
  sb.from('submission_assignees').select('submission_id,user_id,assigned_at,verified_at,verification_result').limit(5000)
 ]);
 const err=subs.error||profiles.error||assignees.error;if(err)throw err;
 cache={subs:subs.data||[],profiles:profiles.data||[],assignees:assignees.data||[]};cacheAt=Date.now();return cache;
}

function roleScopeAllowed(s){
 if(ROLE()==='KASI_SD')return String(s.scope_level||'')==='SD';
 if(ROLE()==='KASI_SMP')return String(s.scope_level||'')==='SMP';
 if(ROLE()==='SUBKOOR_TK')return ['TK_PAUD_PNF','TK','PAUD','PNF'].includes(String(s.scope_level||''));
 return true;
}

function contributionMap(rows,assignees){
 const map=new Map;
 const bySub=new Map;
 for(const a of assignees){if(!bySub.has(a.submission_id))bySub.set(a.submission_id,[]);bySub.get(a.submission_id).push(a)}
 const ensure=id=>{if(!id)return null;if(!map.has(id))map.set(id,{handled:new Set,assign:new Set,verify:new Set,coord:new Set,kabid:new Set,response:new Set,last:null});return map.get(id)};
 const touch=(id,kind,sid,when)=>{if(!id)return;const x=ensure(id);x.handled.add(sid);x[kind]?.add(sid);const d=dt(when);if(d&&(!x.last||d>x.last))x.last=d};
 for(const s of rows){
  touch(s.assigned_by,'assign',s.id,s.assigned_at||s.updated_at);
  touch(s.staff_verified_by,'verify',s.id,s.staff_verified_at||s.updated_at);
  touch(s.coordinator_approved_by,'coord',s.id,s.coordinator_approved_at||s.updated_at);
  touch(s.kabid_approved_by,'kabid',s.id,s.kabid_approved_at||s.updated_at);
  touch(s.staff_response_by,'response',s.id,s.staff_response_at||s.updated_at);
  for(const a of bySub.get(s.id)||[])if(a.verified_at)touch(a.user_id,'verify',s.id,a.verified_at);
 }
 return map;
}

function contributorIdsForSubmission(s,contrib){
 const ids=[];
 for(const [uid,x] of contrib)if(x.handled.has(s.id))ids.push(uid);
 return ids;
}

function model(data){
 const allCompleted=data.subs.filter(completed).filter(roleScopeAllowed);
 const profiles=new Map(data.profiles.map(x=>[x.id,x]));
 const eligibleProfiles=data.profiles.filter(x=>x.is_active!==false&&isPersonalRole(x.role));
 const baseContrib=contributionMap(allCompleted,data.assignees);
 const today=new Date(),year=today.getFullYear();
 const startInput=$('paStart')?.value||`${year}-01-01`,endInput=$('paEnd')?.value||today.toISOString().slice(0,10);
 const service=$('paService')?.value||'ALL',scope=$('paScope')?.value||'ALL',person=canSeeAllPersonal()?($('paPerson')?.value||'ALL'):'ALL';
 const start=new Date(startInput+'T00:00:00'),end=new Date(endInput+'T23:59:59.999');
 let rows=allCompleted.filter(s=>{const done=dt(s.workflow_completed_at||s.updated_at);return done&&done>=start&&done<=end});
 if(service!=='ALL')rows=rows.filter(s=>String(s.service_type||'')===service);
 if(scope!=='ALL')rows=rows.filter(s=>String(s.scope_level||'')===scope);
 let contrib=contributionMap(rows,data.assignees);
 if(person!=='ALL')rows=rows.filter(s=>contrib.get(person)?.handled.has(s.id));
 contrib=contributionMap(rows,data.assignees);
 const durations=rows.map(s=>hours(s.submitted_at,s.workflow_completed_at||s.updated_at)).filter(x=>x!=null);
 const avgDuration=durations.length?durations.reduce((a,b)=>a+b,0)/durations.length:null;
 const serviceMap=new Map;
 for(const s of rows){const k=s.service_type||'LAINNYA';if(!serviceMap.has(k))serviceMap.set(k,{service:k,count:0,durations:[]});const x=serviceMap.get(k);x.count++;const h=hours(s.submitted_at,s.workflow_completed_at||s.updated_at);if(h!=null)x.durations.push(h)}
 const services=[...serviceMap.values()].map(x=>({...x,avg:x.durations.length?x.durations.reduce((a,b)=>a+b,0)/x.durations.length:null})).sort((a,b)=>String(serviceLabel(a.service)).localeCompare(serviceLabel(b.service),'id'));
 const personalAll=eligibleProfiles.map(p=>{const x=contrib.get(p.id)||{handled:new Set,assign:new Set,verify:new Set,coord:new Set,kabid:new Set,response:new Set,last:null};return{
   id:p.id,name:p.full_name||'-',role:p.role,position:p.position||roleLabel(p.role),unit:p.unit||'-',
   handled:x.handled.size,assign:x.assign.size,verify:x.verify.size,coord:x.coord.size,kabid:x.kabid.size,response:x.response.size,
   actions:x.assign.size+x.verify.size+x.coord.size+x.kabid.size+x.response.size,last:x.last
 }});
 const contributors=personalAll.filter(x=>x.handled>0).length;
 let personal=canSeeAllPersonal()
   ?personalAll.filter(x=>x.handled||x.actions||['KABID','KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(x.role))
   :personalAll.filter(x=>x.id===profile().id);
 const roleOrder={KABID:1,KASI_SD:2,KASI_SMP:3,SUBKOOR_TK:4};
 personal.sort((a,b)=>(roleOrder[a.role]||10)-(roleOrder[b.role]||10)||a.name.localeCompare(b.name,'id'));
 return {rows,profiles,contrib,services,personal,avgDuration,contributors,startInput,endInput,service,scope,person,allCompleted,baseContrib};
}

function optionHtml(value,label,selected){return `<option value="${esc(value)}"${String(value)===String(selected)?' selected':''}>${esc(label)}</option>`}

function filtersHtml(data){
 const now=new Date(),year=now.getFullYear();
 const current={start:$('paStart')?.value||`${year}-01-01`,end:$('paEnd')?.value||now.toISOString().slice(0,10),service:$('paService')?.value||'ALL',scope:$('paScope')?.value||'ALL',person:$('paPerson')?.value||'ALL'};
 const scopedCompleted=data.subs.filter(completed).filter(roleScopeAllowed);
 const services=[...new Set(scopedCompleted.map(x=>x.service_type).filter(Boolean))].sort((a,b)=>serviceLabel(a).localeCompare(serviceLabel(b),'id'));
 const scopes=[...new Set(scopedCompleted.map(x=>x.scope_level).filter(Boolean))].sort();
 const people=data.profiles.filter(x=>x.is_active!==false&&isPersonalRole(x.role));
 const personOptions=canSeeAllPersonal()?people:'';
 return `<div class="pa-card pa-wide"><div class="pa-label">FILTER LAPORAN</div><div class="pa-filter">
 <label>Mulai<input id="paStart" type="date" value="${esc(current.start)}"></label>
 <label>Sampai<input id="paEnd" type="date" value="${esc(current.end)}"></label>
 <label>Jenis Layanan<select id="paService">${optionHtml('ALL','Semua layanan',current.service)}${services.map(x=>optionHtml(x,serviceLabel(x),current.service)).join('')}</select></label>
 <label>Jenjang<select id="paScope">${optionHtml('ALL','Semua jenjang',current.scope)}${scopes.map(x=>optionHtml(x,scopeLabel(x),current.scope)).join('')}</select></label>
 <label>Personal<select id="paPerson" ${canSeeAllPersonal()?'':'disabled'}>${canSeeAllPersonal()?optionHtml('ALL','Semua personal',current.person)+people.map(x=>optionHtml(x.id,x.full_name+' - '+roleLabel(x.role),current.person)).join(''):optionHtml(profile().id,profile().full_name||'Saya',profile().id)}</select></label>
 </div><div class="pa-actions"><button class="pa-btn" id="paApply">Terapkan</button><button class="pa-btn soft" id="paRefresh">↻ Segarkan Data</button><button class="pa-btn green" id="paPdf">⬇ Unduh PDF</button><button class="pa-btn soft" id="paCsv">⬇ Unduh Excel/CSV</button></div></div>`;
}

function serviceBarsHtml(services,total){
 if(!services.length)return'<div class="pa-empty">Belum ada layanan selesai pada filter ini.</div>';
 const max=Math.max(1,...services.map(x=>x.count));
 return services.map(x=>`<div class="pa-servicebar"><div><b>${esc(serviceLabel(x.service))}</b><div class="pa-small">Rata-rata ${esc(fmtDuration(x.avg))}</div></div><div class="pa-track"><div class="pa-fill" style="width:${Math.round(x.count/max*100)}%"></div></div><b>${x.count}</b></div>`).join('');
}

function personalTableHtml(rows){
 if(!rows.length)return'<div class="pa-empty">Belum ada capaian personal pada filter ini.</div>';
 return `<div class="pa-scroll"><table class="pa-table"><thead><tr><th>Nama</th><th>Jabatan</th><th>Layanan Selesai Ditangani</th><th>Bagi Tugas</th><th>Verifikasi</th><th>Approve Kasi/Subkoor</th><th>Persetujuan Kabid</th><th>Respon Staf</th><th>Total Aksi</th><th>Aksi Terakhir</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b><div class="pa-small">${esc(x.unit)}</div></td><td>${esc(x.position)}</td><td><b>${x.handled}</b></td><td>${x.assign}</td><td>${x.verify}</td><td>${x.coord}</td><td>${x.kabid}</td><td>${x.response}</td><td><b>${x.actions}</b></td><td>${esc(x.last?fmtDateTime(x.last):'-')}</td></tr>`).join('')}</tbody></table></div>`;
}

function detailRows(m){
 return m.rows.map(s=>{
   const contribIds=contributorIdsForSubmission(s,m.contrib);
   const people=contribIds.map(id=>m.profiles.get(id)?.full_name).filter(Boolean).join(', ');
   const applicant=m.profiles.get(s.user_id)||{};
   return {s,applicant:applicant.full_name||'-',unit:applicant.unit||'-',people,duration:hours(s.submitted_at,s.workflow_completed_at||s.updated_at)};
 });
}
function detailTableHtml(m){
 const rows=detailRows(m);
 if(!rows.length)return'<div class="pa-empty">Belum ada layanan selesai pada filter ini.</div>';
 return `<div class="pa-scroll"><table class="pa-table"><thead><tr><th>Pengusul</th><th>Unit</th><th>Layanan</th><th>Jenjang</th><th>Masuk</th><th>Selesai</th><th>Durasi</th><th>Kontributor Internal</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.applicant)}</b></td><td>${esc(x.unit)}</td><td>${esc(serviceLabel(x.s.service_type))}</td><td>${esc(scopeLabel(x.s.scope_level))}</td><td>${esc(fmtDateTime(x.s.submitted_at))}</td><td>${esc(fmtDateTime(x.s.workflow_completed_at||x.s.updated_at))}</td><td>${esc(fmtDuration(x.duration))}</td><td>${esc(x.people||'-')}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderModel(m,data){
 const body=$('performanceAchievementBody');if(!body)return;
 const scopeNote=ROLE()==='KASI_SD'?'Cakupan akun: SD':ROLE()==='KASI_SMP'?'Cakupan akun: SMP':ROLE()==='SUBKOOR_TK'?'Cakupan akun: TK/PAUD/PNF':'Cakupan: seluruh layanan Bidang Ketenagaan';
 body.innerHTML=`<div class="pa-wrap">
 <div class="pa-head"><h2>📈 Capaian Kinerja Bidang Ketenagaan</h2><p>Rekap berbasis layanan yang benar-benar sudah berstatus <b>Selesai</b> pada workflow SIMANTAB. ${esc(scopeNote)}.</p></div>
 ${filtersHtml(data)}
 <div class="pa-card"><div class="pa-label">Layanan Selesai</div><div class="pa-num">${m.rows.length}</div><div class="pa-small">Periode ${esc(fmtDate(m.startInput))} - ${esc(fmtDate(m.endInput))}</div></div>
 <div class="pa-card"><div class="pa-label">Jenis Layanan Selesai</div><div class="pa-num">${m.services.length}</div><div class="pa-small">Jenis layanan dengan hasil selesai pada periode terpilih</div></div>
 <div class="pa-card"><div class="pa-label">Rata-rata Penyelesaian</div><div class="pa-num" style="font-size:23px">${esc(fmtDuration(m.avgDuration))}</div><div class="pa-small">Dari waktu pengajuan sampai status selesai</div></div>
 <div class="pa-card"><div class="pa-label">Personel Berkontribusi</div><div class="pa-num">${m.contributors}</div><div class="pa-small">Kabid, Kasi/Subkoor, dan Staf/Admin dengan jejak pada layanan selesai</div></div>
 <div class="pa-card pa-half"><div class="pa-label">CAPAIAN PER JENIS LAYANAN</div><div style="margin-top:8px">${serviceBarsHtml(m.services,m.rows.length)}</div></div>
 <div class="pa-card pa-half"><div class="pa-label">CATATAN PENGUKURAN</div><div class="pa-note" style="margin-top:8px"><b>Total bidang tidak dihitung ganda.</b> Satu layanan selesai dihitung satu kali untuk capaian bidang. Pada capaian personal, satu layanan dapat tercatat pada beberapa orang sesuai perannya dalam workflow: Bagi Tugas, Verifikasi, Approval Kasi/Subkoor, Persetujuan Kabid, atau Respon Staf/Admin.<br><br>Data ini mengukur pekerjaan yang tercatat di SIMANTAB dan tidak otomatis mewakili pekerjaan manual di luar aplikasi.</div></div>
 <div class="pa-card pa-wide"><div class="pa-label">CAPAIAN PERSONAL</div><div style="height:8px"></div>${personalTableHtml(m.personal)}</div>
 <div class="pa-card pa-wide"><div class="pa-label">RINCIAN LAYANAN SELESAI</div><div style="height:8px"></div>${detailTableHtml(m)}</div>
 </div>`;
 bind(data);
}

function bind(data){
 $('paApply')?.addEventListener('click',()=>render(false));
 $('paRefresh')?.addEventListener('click',async()=>{cache=null;await render(true)});
 for(const id of ['paStart','paEnd','paService','paScope','paPerson'])$(id)?.addEventListener('change',()=>render(false));
 $('paPdf')?.addEventListener('click',downloadPdf);
 $('paCsv')?.addEventListener('click',downloadCsv);
}

async function render(force=false){
 const body=$('performanceAchievementBody');if(!body)return;
 body.innerHTML='<div class="card empty">Menghitung capaian kinerja dari seluruh layanan selesai…</div>';
 try{const data=await fetchData(force);currentModel=model(data);renderModel(currentModel,data)}
 catch(e){body.innerHTML=`<div class="card err"><b>Modul capaian kinerja gagal dimuat.</b><br>${esc(e?.message||e)}</div>`}
}

function csvCell(v){const s=String(v??'').replace(/"/g,'""');return '"'+s+'"'}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}
function downloadCsv(){
 const m=currentModel;if(!m)return;
 const lines=[],sep=';';
 lines.push(['LAPORAN CAPAIAN KINERJA BIDANG KETENAGAAN'].map(csvCell).join(sep));
 lines.push(['Periode',fmtDate(m.startInput)+' - '+fmtDate(m.endInput)].map(csvCell).join(sep));
 lines.push(['Layanan selesai',m.rows.length].map(csvCell).join(sep));
 lines.push(['Jenis layanan selesai',m.services.length].map(csvCell).join(sep));
 lines.push(['Rata-rata penyelesaian',fmtDuration(m.avgDuration)].map(csvCell).join(sep));
 lines.push(['Personel berkontribusi',m.contributors].map(csvCell).join(sep));
 lines.push('');
 lines.push(['CAPAIAN PER JENIS LAYANAN'].map(csvCell).join(sep));
 lines.push(['Jenis Layanan','Jumlah Selesai','Rata-rata Durasi'].map(csvCell).join(sep));
 for(const x of m.services)lines.push([serviceLabel(x.service),x.count,fmtDuration(x.avg)].map(csvCell).join(sep));
 lines.push('');
 lines.push(['CAPAIAN PERSONAL'].map(csvCell).join(sep));
 lines.push(['Nama','Jabatan','Unit','Layanan Selesai Ditangani','Bagi Tugas','Verifikasi','Approve Kasi/Subkoor','Persetujuan Kabid','Respon Staf','Total Aksi','Aksi Terakhir'].map(csvCell).join(sep));
 for(const x of m.personal)lines.push([x.name,x.position,x.unit,x.handled,x.assign,x.verify,x.coord,x.kabid,x.response,x.actions,x.last?fmtDateTime(x.last):'-'].map(csvCell).join(sep));
 lines.push('');
 lines.push(['RINCIAN LAYANAN SELESAI'].map(csvCell).join(sep));
 lines.push(['Pengusul','Unit','Layanan','Jenjang','Masuk','Selesai','Durasi','Kontributor Internal'].map(csvCell).join(sep));
 for(const x of detailRows(m))lines.push([x.applicant,x.unit,serviceLabel(x.s.service_type),scopeLabel(x.s.scope_level),fmtDateTime(x.s.submitted_at),fmtDateTime(x.s.workflow_completed_at||x.s.updated_at),fmtDuration(x.duration),x.people||'-'].map(csvCell).join(sep));
 const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
 downloadBlob(blob,`Capaian_Kinerja_Bidang_Ketenagaan_${m.startInput}_sd_${m.endInput}.csv`);
}

function pdfLib(){const ctor=window.jspdf?.jsPDF;if(!ctor)throw new Error('Komponen PDF belum termuat. Muat ulang SIMANTAB lalu coba lagi.');return ctor}
function downloadPdf(){
 try{
  const m=currentModel;if(!m)return;
  const jsPDF=pdfLib(),doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true}),w=doc.internal.pageSize.getWidth();
  if(typeof doc.autoTable!=='function')throw new Error('Komponen tabel PDF belum termuat. Muat ulang halaman lalu coba lagi.');
  doc.setTextColor(20);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('PEMERINTAH KABUPATEN BATANG',w/2,9,{align:'center'});
  doc.setFontSize(13);doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN',w/2,15,{align:'center'});
  doc.setFontSize(9);doc.text('BIDANG PEMBINAAN KETENAGAAN',w/2,20,{align:'center'});doc.setLineWidth(.4);doc.line(10,23,w-10,23);
  doc.setFontSize(12);doc.text('CAPAIAN KINERJA BIDANG KETENAGAAN',w/2,29,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text(`Periode: ${clean(fmtDate(m.startInput))} - ${clean(fmtDate(m.endInput))}`,10,35);
  doc.text(`Layanan selesai: ${m.rows.length} | Jenis layanan: ${m.services.length} | Rata-rata penyelesaian: ${clean(fmtDuration(m.avgDuration))} | Personel berkontribusi: ${m.contributors}`,10,39);
  const svcBody=m.services.map((x,i)=>[String(i+1),clean(serviceLabel(x.service)),String(x.count),clean(fmtDuration(x.avg))]);
  doc.autoTable({startY:43,head:[['No','Jenis Layanan','Selesai','Rata-rata Durasi']],body:svcBody,theme:'grid',styles:{font:'helvetica',fontSize:7,cellPadding:1.5},headStyles:{fillColor:[230,235,240],textColor:[20,20,20],fontStyle:'bold'},columnStyles:{0:{cellWidth:10,halign:'center'},1:{cellWidth:105},2:{cellWidth:25,halign:'center'},3:{cellWidth:38}}});
  let y=(doc.lastAutoTable?.finalY||43)+6;
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('Capaian Personal',10,y);y+=3;
  const pBody=m.personal.map((x,i)=>[String(i+1),clean(x.name),clean(x.position),String(x.handled),String(x.assign),String(x.verify),String(x.coord),String(x.kabid),String(x.response),String(x.actions)]);
  doc.autoTable({startY:y,head:[['No','Nama','Jabatan','Tuntas','Bagi Tugas','Verifikasi','Approve Koord.','Perset. Kabid','Respon','Total Aksi']],body:pBody,theme:'grid',styles:{font:'helvetica',fontSize:6.2,cellPadding:1.2},headStyles:{fillColor:[230,235,240],textColor:[20,20,20],fontStyle:'bold'},columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:42},2:{cellWidth:45},3:{cellWidth:17,halign:'center'},4:{cellWidth:20,halign:'center'},5:{cellWidth:18,halign:'center'},6:{cellWidth:22,halign:'center'},7:{cellWidth:22,halign:'center'},8:{cellWidth:18,halign:'center'},9:{cellWidth:18,halign:'center'}}});
  y=(doc.lastAutoTable?.finalY||y)+6;
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('Rincian Layanan Selesai',10,y);y+=3;
  const dBody=detailRows(m).map((x,i)=>[String(i+1),clean(x.applicant),clean(serviceLabel(x.s.service_type)),clean(scopeLabel(x.s.scope_level)),clean(fmtDateTime(x.s.submitted_at)),clean(fmtDateTime(x.s.workflow_completed_at||x.s.updated_at)),clean(fmtDuration(x.duration)),clean(x.people||'-')]);
  doc.autoTable({startY:y,head:[['No','Pengusul','Layanan','Jenjang','Masuk','Selesai','Durasi','Kontributor Internal']],body:dBody,theme:'grid',styles:{font:'helvetica',fontSize:5.8,cellPadding:1.1,valign:'top'},headStyles:{fillColor:[230,235,240],textColor:[20,20,20],fontStyle:'bold'},columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:39},2:{cellWidth:40},3:{cellWidth:20},4:{cellWidth:31},5:{cellWidth:31},6:{cellWidth:22},7:{cellWidth:70}}});
  const pages=doc.internal.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(90);doc.text(`SIMANTAB-ONLINE | Dicetak ${clean(new Date().toLocaleString('id-ID'))} | Halaman ${p}/${pages}`,10,202)}
  downloadBlob(doc.output('blob'),`Capaian_Kinerja_Bidang_Ketenagaan_${m.startInput}_sd_${m.endInput}.pdf`);
 }catch(e){alert(e?.message||'PDF gagal dibuat.')}
}

addStyle();ensureSection();ensureNav();installNavObserver();
window.__simantabPerformanceAchievement={version:1,open:activate,refresh:()=>render(true),completionRule:'workflow_state=SELESAI OR status=COMPLETED',downloads:['PDF','CSV']};
})();