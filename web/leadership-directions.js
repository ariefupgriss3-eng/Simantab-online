/* SIMANTAB_LEADERSHIP_DIRECTIONS_V1 */
/* SIMANTAB_LEADERSHIP_DIRECTIONS_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const p=()=>window.__simantabProfile||{},role=()=>String(p().role||'');
const LEADERS=new Set(['KEPALA_DINAS','SEKRETARIS_DINAS']);
const COORDS=new Set(['KASI_SD','KASI_SMP','SUBKOOR_TK']);
const CAN_WRITE=()=>LEADERS.has(role())||role()==='SUPER_ADMIN';
const CAN_FOLLOW=()=>['KABID','SUPER_ADMIN'].includes(role());
const CAN_COORD=()=>COORDS.has(role());
const CAN_VIEW=()=>CAN_WRITE()||CAN_FOLLOW()||CAN_COORD();
const ROLE_LABEL={
 KEPALA_DINAS:'Kepala Disdikbud',SEKRETARIS_DINAS:'Sekretaris Disdikbud',
 KABID:'Kabid Pembinaan Ketenagaan',KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP',
 SUBKOOR_TK:'Subkoor TK/PAUD/PNF',SUPER_ADMIN:'Super Admin SIMANTAB'
};
const STATUS_LABEL={PERLU_DITINDAKLANJUTI:'Perlu Ditindaklanjuti',DIPROSES:'Diproses',SELESAI:'Selesai'};
const TYPE_LABEL={KOMENTAR:'Komentar',PETUNJUK:'Petunjuk',ARAHAN:'Arahan'};
const fmt=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
function style(){
 if($('leadershipDirectionStyle'))return;
 const s=document.createElement('style');s.id='leadershipDirectionStyle';s.textContent=`
 .ld-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
 .ld-card{background:#fff;border:1px solid var(--line);border-radius:15px;padding:14px}
 .ld-metric{font-size:28px;font-weight:950;color:var(--navy)}
 .ld-pill{display:inline-block;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:900}
 .ld-open{background:#fff3dd;color:#955a00}.ld-work{background:#e7f1ff;color:#175ea7}.ld-done{background:#e9f7ef;color:#178354}.ld-type{background:#edf5ff;color:#175ea7}
 .ld-row-actions{display:flex;gap:6px;flex-wrap:wrap}
 .ld-history{border-left:4px solid #1767b3;margin:8px 0;padding:10px 12px;background:#f8fbff;border-radius:10px}
 .ld-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
 .ld-flow>div{padding:10px;border:1px solid var(--line);border-radius:12px;background:#fafcff;text-align:center}
 .ld-flow b{display:block;color:var(--navy)}
 .ld-forward{margin-top:7px;padding:8px 10px;border-radius:10px;background:#eef7ff;border:1px solid #c8def2;font-size:10px}
 @media(max-width:760px){.ld-grid,.ld-flow{grid-template-columns:1fr}.ld-row-actions{display:block}.ld-row-actions button{margin:3px 0}}
 `;document.head.appendChild(s)
}
function ensureSection(){
 if(!CAN_VIEW())return null;
 let sec=$('leadershipDirections');if(sec)return sec;
 const main=document.querySelector('main.content');if(!main)return null;
 sec=document.createElement('section');sec.id='leadershipDirections';sec.className='section';
 sec.innerHTML='<div class="head"><div><h2>Arahan Pimpinan</h2><p id="leadershipDirectionsDesc">Monitoring dan tindak lanjut arahan pimpinan.</p></div><button class="btn soft" onclick="loadLeadershipDirections(true)">↻ Segarkan</button></div><div id="leadershipDirectionsBody"><div class="card empty">Memuat...</div></div>';
 main.insertBefore(sec,main.querySelector('.footer'));return sec
}
function ensureNav(){
 if(!CAN_VIEW())return;
 const nav=$('nav');if(!nav||nav.querySelector('[data-tab="leadershipDirections"]'))return;
 const btn=document.createElement('button');btn.className='navbtn';btn.dataset.tab='leadershipDirections';
 btn.innerHTML='<span class="ico">💬</span>Arahan Pimpinan';
 btn.onclick=()=>window.showTab?.('leadershipDirections');
 nav.appendChild(btn)
}
function roleUi(){
 if(role()==='SEKRETARIS_DINAS'){
  if($('roleChip'))$('roleChip').textContent='Sekretaris Disdikbud';
  if($('dashTitle')&&$('dashboard')?.classList.contains('active'))$('dashTitle').textContent='Dashboard Sekretaris Disdikbud'
 }
 ensureNav();ensureSection()
}
async function patchSekdinRoleSelects(){
 if(role()!=='SUPER_ADMIN'||!$('usersBody'))return;
 const {data,error}=await sb.from('profiles').select('id,role');if(error)return;
 const roles=new Map((data||[]).map(x=>[x.id,x.role]));
 document.querySelectorAll('#usersBody select[id^="role-"]').forEach(sel=>{
  if(![...sel.options].some(o=>o.value==='SEKRETARIS_DINAS')){
   const o=document.createElement('option');o.value='SEKRETARIS_DINAS';o.textContent='Sekretaris Disdikbud';sel.appendChild(o)
  }
  const id=sel.id.slice(5);if(roles.get(id)==='SEKRETARIS_DINAS')sel.value='SEKRETARIS_DINAS'
 })
}
function decorateTeamMap(){
 if(CAN_COORD())return;
 const body=$('teamBody');if(!body||$('leadershipAuthorityCard'))return;
 const c=document.createElement('div');c.id='leadershipAuthorityCard';c.className='card';c.style.marginBottom='12px';
 c.innerHTML='<div class="label">LEVEL PIMPINAN DINAS</div><h3 style="margin:5px 0">Kepala Disdikbud & Sekretaris Disdikbud</h3><div class="info"><b>Kewenangan:</b> monitoring seluruh kegiatan dan layanan ketenagaan semua jenjang; memberikan komentar, petunjuk, dan arahan. <b>Kabid</b> mengendalikan dan meneruskan arahan kepada Kasi/Subkoor sesuai jenjang.</div>';
 body.prepend(c)
}
async function fetchData(){
 const [s,d,u]=await Promise.all([
  sb.from('submissions').select('id,user_id,service_type,title,status,scope_level,coordinator_role,assigned_role,submitted_at,updated_at').order('submitted_at',{ascending:false}).limit(500),
  sb.from('leadership_directions').select('*').order('created_at',{ascending:false}).limit(600),
  sb.from('profiles').select('id,full_name,role,unit').order('full_name')
 ]);
 const e=s.error||d.error||u.error;if(e)throw e;
 return{subs:s.data||[],dirs:d.data||[],profiles:u.data||[]}
}
function statusClass(s){return s==='SELESAI'?'ld-done':s==='DIPROSES'?'ld-work':'ld-open'}
function coordinatorStatus(d){return d.coordinator_follow_up_status||'PERLU_DITINDAKLANJUTI'}
function leaderHistory(d,names,s){
 const target=d.forwarded_to_role;
 const forwarded=target?`<div class="ld-forward"><b>Diteruskan Kabid → ${esc(ROLE_LABEL[target]||target)}</b>${d.forwarded_note?`<div style="margin-top:4px">${esc(d.forwarded_note)}</div>`:''}${d.forwarded_at?`<div class="small" style="margin-top:3px">${fmt(d.forwarded_at)}</div>`:''}${d.coordinator_follow_up_note?`<div style="margin-top:5px"><b>Tindak lanjut Kasi/Subkoor:</b> ${esc(d.coordinator_follow_up_note)}</div>`:''}</div>`:'';
 let actions='';
 if(CAN_FOLLOW()&&d.follow_up_status!=='SELESAI'){
   if(target){
     actions='<span class="small">Menunggu/monitor tindak lanjut '+esc(ROLE_LABEL[target]||target)+'.</span>';
   }else if(['KASI_SD','KASI_SMP','SUBKOOR_TK'].includes(s.coordinator_role)){
     actions=`<button class="btn primary" onclick="leadershipForward('${d.id}','${s.coordinator_role}')">↪ Teruskan ke ${esc(ROLE_LABEL[s.coordinator_role]||s.coordinator_role)}</button>`;
   }else{
     actions=`<button class="btn soft" onclick="leadershipFollowUp('${d.id}','DIPROSES')">Proses</button><button class="btn success" onclick="leadershipFollowUp('${d.id}','SELESAI')">Tandai Selesai</button>`;
   }
 }
 return `<div class="ld-history"><div><span class="ld-pill ld-type">${esc(TYPE_LABEL[d.direction_type]||d.direction_type)}</span> <span class="ld-pill ${statusClass(d.follow_up_status)}">${esc(STATUS_LABEL[d.follow_up_status]||d.follow_up_status)}</span></div><b>${esc(names.get(d.author_id)||ROLE_LABEL[d.author_role]||d.author_role)}</b> <span class="small">• ${fmt(d.created_at)}</span><div style="margin-top:5px">${esc(d.body)}</div>${d.follow_up_note&&!target?`<div class="small" style="margin-top:5px"><b>Tindak lanjut Kabid:</b> ${esc(d.follow_up_note)}</div>`:''}${forwarded}${actions?`<div class="ld-row-actions" style="margin-top:7px">${actions}</div>`:''}</div>`
}
function renderCoordinatorDirections(x,names){
 const dirs=x.dirs.filter(d=>d.forwarded_to_role===role());
 const subMap=new Map(x.subs.map(s=>[s.id,s]));
 const open=dirs.filter(d=>coordinatorStatus(d)==='PERLU_DITINDAKLANJUTI').length;
 const work=dirs.filter(d=>coordinatorStatus(d)==='DIPROSES').length;
 const done=dirs.filter(d=>coordinatorStatus(d)==='SELESAI').length;
 if($('leadershipDirectionsDesc'))$('leadershipDirectionsDesc').textContent='Arahan pimpinan yang diteruskan Kabid kepada '+(ROLE_LABEL[role()]||role())+'.';
 const rows=dirs.map(d=>{
   const s=subMap.get(d.submission_id)||{};
   const st=coordinatorStatus(d);
   return `<tr><td><b>${esc(s.title||s.service_type||'-')}</b><div class="small">${esc(s.service_type||'-')} • ${esc(names.get(s.user_id)||'Pemohon')} • ${fmt(s.submitted_at)}</div></td><td><span class="ld-pill ld-type">${esc(TYPE_LABEL[d.direction_type]||d.direction_type)}</span><div style="margin-top:5px"><b>${esc(names.get(d.author_id)||ROLE_LABEL[d.author_role]||d.author_role)}</b> • ${fmt(d.created_at)}</div><div style="margin-top:5px">${esc(d.body)}</div></td><td>${d.forwarded_note?esc(d.forwarded_note):'<span class="small">Tanpa catatan tambahan.</span>'}<div class="small" style="margin-top:4px">${fmt(d.forwarded_at)}</div></td><td><span class="ld-pill ${statusClass(st)}">${esc(STATUS_LABEL[st]||st)}</span>${d.coordinator_follow_up_note?`<div class="small" style="margin-top:5px">${esc(d.coordinator_follow_up_note)}</div>`:''}</td><td>${st!=='SELESAI'?`<div class="ld-row-actions"><button class="btn soft" onclick="leadershipCoordinatorFollowUp('${d.id}','DIPROSES')">Proses</button><button class="btn success" onclick="leadershipCoordinatorFollowUp('${d.id}','SELESAI')">✓ Selesai</button></div>`:'<span class="small">Tindak lanjut selesai.</span>'}</td></tr>`
 }).join('');
 return `<div class="card" style="margin-bottom:12px"><div class="ld-flow"><div><b>Kadis / Sekdin</b><span>Memberi arahan</span></div><div><b>Kabid</b><span>Meneruskan sesuai jenjang</span></div><div><b>Kasi/Subkoor</b><span>Koordinasi & tindak lanjut</span></div><div><b>Staf</b><span>Pelaksanaan teknis</span></div></div><div class="info" style="margin-top:10px"><b>Khusus jenjang Anda.</b> Hanya arahan yang sudah diteruskan Kabid kepada ${esc(ROLE_LABEL[role()]||role())} yang ditampilkan.</div></div><div class="ld-grid" style="margin-bottom:12px"><div class="ld-card"><div class="label">Perlu Ditindaklanjuti</div><div class="ld-metric">${open}</div></div><div class="ld-card"><div class="label">Diproses</div><div class="ld-metric">${work}</div></div><div class="ld-card"><div class="label">Selesai</div><div class="ld-metric">${done}</div></div></div><div class="card"><h3 style="margin-top:0">Arahan yang Diteruskan Kabid</h3>${rows?`<div class="tablewrap"><table><thead><tr><th>Layanan</th><th>Arahan Pimpinan</th><th>Catatan Kabid</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty">Belum ada arahan pimpinan yang diteruskan Kabid kepada Anda.</div>'}</div>`
}
window.loadLeadershipDirections=async(force=false)=>{
 if(!CAN_VIEW())return;roleUi();
 const body=$('leadershipDirectionsBody');if(!body)return;
 body.innerHTML='<div class="card empty">Memuat arahan pimpinan...</div>';
 try{
   const x=await fetchData(),names=new Map(x.profiles.map(v=>[v.id,v.full_name||'-']));
   if(CAN_COORD()){body.innerHTML=renderCoordinatorDirections(x,names);return}
   if($('leadershipDirectionsDesc'))$('leadershipDirectionsDesc').textContent='Monitoring, komentar, petunjuk, arahan, penerusan, dan tindak lanjut layanan ketenagaan.';
   const bySub=new Map();
   for(const d of x.dirs){if(!bySub.has(d.submission_id))bySub.set(d.submission_id,[]);bySub.get(d.submission_id).push(d)}
   const open=x.dirs.filter(d=>d.follow_up_status==='PERLU_DITINDAKLANJUTI').length;
   const work=x.dirs.filter(d=>d.follow_up_status==='DIPROSES').length;
   const done=x.dirs.filter(d=>d.follow_up_status==='SELESAI').length;
   body.innerHTML=`<div class="card" style="margin-bottom:12px"><div class="ld-flow"><div><b>Kadis / Sekdin</b><span>Monitoring & memberi arahan</span></div><div><b>Kabid</b><span>Menerima & meneruskan</span></div><div><b>Kasi/Subkoor</b><span>Koordinasi sesuai jenjang</span></div><div><b>Staf</b><span>Pelaksanaan teknis</span></div></div></div><div class="ld-grid" style="margin-bottom:12px"><div class="ld-card"><div class="label">Perlu Ditindaklanjuti</div><div class="ld-metric">${open}</div></div><div class="ld-card"><div class="label">Diproses</div><div class="ld-metric">${work}</div></div><div class="ld-card"><div class="label">Selesai</div><div class="ld-metric">${done}</div></div></div><div class="card"><h3 style="margin-top:0">Monitoring Usulan & Arahan</h3><input id="leadershipSearch" class="sim-needs-filter" placeholder="Cari layanan, judul, pemohon, status..."><div class="tablewrap"><table id="leadershipTable"><thead><tr><th>Usulan</th><th>Status</th><th>Arahan Pimpinan</th><th>Aksi</th></tr></thead><tbody>${x.subs.map(s=>{const ds=bySub.get(s.id)||[],hist=ds.length?ds.map(d=>leaderHistory(d,names,s)).join(''):'<span class="small">Belum ada arahan.</span>';return`<tr><td><b>${esc(s.title||s.service_type)}</b><div class="small">${esc(s.service_type)} • ${esc(names.get(s.user_id)||'Pemohon')} • ${fmt(s.submitted_at)}</div></td><td><span class="status st-${esc(s.status)}">${esc(s.status||'-')}</span></td><td>${hist}</td><td>${CAN_WRITE()?`<button class="btn primary" onclick="openLeadershipDirection('${s.id}','${esc((s.title||s.service_type).replace(/'/g,'&#39;'))}')">💬 Beri Arahan</button>`:'<span class="small">Monitoring</span>'}</td></tr>`}).join('')}</tbody></table></div></div>`;
   const q=$('leadershipSearch');if(q)q.oninput=e=>{const v=String(e.target.value||'').toLowerCase();document.querySelectorAll('#leadershipTable tbody>tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(v)?'':'none')};
   decorateTeamMap()
 }catch(e){body.innerHTML=`<div class="card err">${esc(e?.message||e)}</div>`}
};
window.openLeadershipDirection=(submissionId,title)=>{
 if(!CAN_WRITE())return;
 let m=$('leadershipDirectionModal');m?.remove();m=document.createElement('div');m.id='leadershipDirectionModal';
 m.style='position:fixed;inset:0;z-index:9999;background:#0b203c99;display:flex;align-items:center;justify-content:center;padding:16px';
 m.onclick=e=>{if(e.target===m)m.remove()};
 m.innerHTML=`<div class="card" style="width:min(620px,100%);max-height:88vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:10px"><div><div class="label">USULAN</div><h3 style="margin:3px 0">${esc(title)}</h3></div><button class="btn soft" onclick="document.getElementById('leadershipDirectionModal')?.remove()">✕</button></div><div class="field"><label>Jenis</label><select id="leadershipType"><option value="KOMENTAR">Komentar</option><option value="PETUNJUK">Petunjuk</option><option value="ARAHAN">Arahan</option></select></div><div class="field"><label>Isi</label><textarea id="leadershipBody" placeholder="Tuliskan komentar, petunjuk, atau arahan pimpinan..."></textarea></div><button class="btn primary" onclick="saveLeadershipDirection('${submissionId}')">Simpan Arahan</button><div id="leadershipMsg" class="small" style="margin-top:8px"></div></div>`;
 document.body.appendChild(m)
};
window.saveLeadershipDirection=async submissionId=>{
 if(!CAN_WRITE())return;
 const type=$('leadershipType')?.value,body=String($('leadershipBody')?.value||'').trim(),msg=$('leadershipMsg');
 if(body.length<2){msg.textContent='Isi arahan wajib diisi.';return}
 msg.textContent='Menyimpan...';
 const {error}=await sb.from('leadership_directions').insert({submission_id:submissionId,author_id:p().id,author_role:role(),direction_type:type,body,target_role:'KABID'});
 if(error){msg.textContent=error.message;return}
 document.getElementById('leadershipDirectionModal')?.remove();await window.loadLeadershipDirections(true)
};
window.leadershipForward=async(id,targetRole)=>{
 if(!CAN_FOLLOW())return;
 const note=prompt('Catatan Kabid saat meneruskan ke '+(ROLE_LABEL[targetRole]||targetRole)+':')||'';
 if(!note.trim())return;
 const {error}=await sb.rpc('leadership_forward_to_coordinator',{p_direction_id:id,p_note:note.trim()});
 if(error){alert(error.message);return}
 await window.loadLeadershipDirections(true)
};
window.leadershipCoordinatorFollowUp=async(id,status)=>{
 if(!CAN_COORD()&&role()!=='SUPER_ADMIN')return;
 const note=prompt(status==='SELESAI'?'Catatan hasil tindak lanjut arahan:':'Catatan proses tindak lanjut arahan:')||'';
 if(!note.trim())return;
 const {error}=await sb.rpc('leadership_coordinator_followup',{p_direction_id:id,p_status:status,p_note:note.trim()});
 if(error){alert(error.message);return}
 await window.loadLeadershipDirections(true)
};
window.leadershipFollowUp=async(id,status)=>{
 if(!CAN_FOLLOW())return;
 const note=prompt(status==='SELESAI'?'Catatan hasil tindak lanjut:':'Catatan proses tindak lanjut:')||'';
 if(!note.trim())return;
 const patch={follow_up_status:status,follow_up_note:note.trim(),follow_up_by:p().id,updated_at:new Date().toISOString(),completed_at:status==='SELESAI'?new Date().toISOString():null};
 const {error}=await sb.from('leadership_directions').update(patch).eq('id',id);
 if(error){alert(error.message);return}
 await window.loadLeadershipDirections(true)
};
function hook(){
 roleUi();decorateTeamMap();
 if(window.__leadershipDirectionsHookedV2)return;
 const old=window.showTab;if(typeof old!=='function'){setTimeout(hook,250);return}
 window.__leadershipDirectionsHookedV2=true;
 window.showTab=async function(id){
   roleUi();
   const r=await old.apply(this,arguments);
   if(id==='leadershipDirections')await window.loadLeadershipDirections();
   if(id==='users')setTimeout(patchSekdinRoleSelects,60);
   if(!CAN_COORD())setTimeout(decorateTeamMap,50);
   return r
 };
}
style();hook();setTimeout(roleUi,200);
window.__simantabLeadershipDirections={version:2,coordinatorForwarding:true};
})();