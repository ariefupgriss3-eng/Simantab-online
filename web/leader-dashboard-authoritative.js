/* SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const $=id=>document.getElementById(id);
const SNAPSHOT={
 schools:{sd:455,tk:323,pnf:0,smp:76,staff:1709,total:854,teachers:5272},
 needs:{abk:153,asn:152,pns:55,pppk:75,rows:88,levels:{SD:{abk:153,asn:152,non_asn:18,gap_data:14,gap_riil:30},TK:{abk:0,asn:0,non_asn:0,gap_data:0,gap_riil:0},SMP:{abk:0,asn:0,non_asn:0,gap_data:0,gap_riil:0}},non_asn:18,pppk_pw:22,schools:17,gap_data:14,gap_riil:30},
 workflow:{total:4,active:4,selesai:0,perbaikan:0,menunggu_kabid:0,verifikasi_staf:0,menunggu_disposisi:3,menunggu_koordinator:0},
 activities:{total:3,upcoming:0,next_date:null},
 snapshot_at:'19 September 2026'
};
const num=v=>Number(v)||0, fmt=v=>new Intl.NumberFormat('id-ID').format(num(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const role=()=>String(window.__simantabProfile?.role||'');
const isLeader=()=>['KEPALA_DINAS','SEKRETARIS_DINAS'].includes(role());
const roleTitle=()=>role()==='KEPALA_DINAS'?'Kepala Disdikbud':'Sekretaris Disdikbud';
let current=SNAPSHOT,syncing=false,lastRender=0,guard=false;

function style(){
 if($('leaderAuthoritativeStyle'))return;
 const s=document.createElement('style');s.id='leaderAuthoritativeStyle';s.textContent=`
 #dashboardBody .lad-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}
 #dashboardBody .lad-hero{grid-column:span 12;background:linear-gradient(135deg,#0f3f76,#1767b3);color:white;border-radius:18px;padding:18px}
 #dashboardBody .lad-hero h2{margin:0 0 5px;font-size:22px}
 #dashboardBody .lad-hero p{margin:0;opacity:.9;font-size:12px;line-height:1.5}
 #dashboardBody .lad-card{grid-column:span 4;background:#fff;border:1px solid var(--line,#dde6ef);border-radius:16px;padding:14px;box-shadow:0 5px 18px #19365a0d}
 #dashboardBody .lad-card.click{cursor:pointer}
 #dashboardBody .lad-card.click:active{transform:scale(.99)}
 #dashboardBody .lad-label{font-size:10px;font-weight:900;color:#607286;text-transform:uppercase;letter-spacing:.04em}
 #dashboardBody .lad-value{font-size:29px;font-weight:950;color:#0f3f76;margin:4px 0}
 #dashboardBody .lad-sub{font-size:11px;color:#64748b;line-height:1.45}
 #dashboardBody .lad-wide{grid-column:span 6;background:#fff;border:1px solid var(--line,#dde6ef);border-radius:16px;padding:14px}
 #dashboardBody .lad-wide h3{margin:0 0 10px;color:#173b60}
 #dashboardBody .lad-level{margin:11px 0}
 #dashboardBody .lad-row{display:grid;grid-template-columns:52px 1fr 42px;gap:8px;align-items:center;margin:6px 0;font-size:11px}
 #dashboardBody .lad-track{height:9px;background:#edf2f7;border-radius:99px;overflow:hidden}
 #dashboardBody .lad-fill{height:100%;background:#1767b3;border-radius:99px}
 #dashboardBody .lad-fill.asn{background:#178354}.lad-fill.gap{background:#d97706}
 #dashboardBody .lad-state{display:grid;grid-template-columns:1fr auto;gap:6px;padding:8px 0;border-bottom:1px solid #eef2f6;font-size:11px}
 #dashboardBody .lad-state:last-child{border-bottom:0}
 #dashboardBody .lad-note{grid-column:span 12;background:#f8fbff;border:1px solid #dce8f5;border-radius:12px;padding:10px 12px;font-size:10px;color:#58708a}
 @media(max-width:760px){#dashboardBody .lad-card,#dashboardBody .lad-wide{grid-column:span 12}}
 `;document.head.appendChild(s);
}
function levelRows(levelObj){
 const lv=['TK','SD','SMP']; const max=Math.max(1,...lv.flatMap(k=>[num(levelObj?.[k]?.abk),num(levelObj?.[k]?.asn),num(levelObj?.[k]?.gap_riil)]));
 return lv.map(k=>{const x=levelObj?.[k]||{};const row=(lab,v,cl='')=>`<div class="lad-row"><b>${lab}</b><div class="lad-track"><div class="lad-fill ${cl}" style="width:${Math.round(num(v)/max*100)}%"></div></div><b>${fmt(v)}</b></div>`;return `<div class="lad-level"><b>${k}</b>${row('ABK',x.abk)}${row('ASN',x.asn,'asn')}${row('Gap',x.gap_riil,'gap')}</div>`}).join('');
}
function workflowRows(w){
 const rows=[
  ['Menunggu Pembagian Tugas',w.menunggu_disposisi],
  ['Verifikasi Staf/Admin',w.verifikasi_staf],
  ['Menunggu Approval Kasi/Subkoor',w.menunggu_koordinator],
  ['Menunggu Persetujuan Kabid',w.menunggu_kabid],
  ['Perlu Perbaikan',w.perbaikan],
  ['Selesai',w.selesai]
 ];
 return rows.map(([l,v])=>`<div class="lad-state"><span>${esc(l)}</span><b>${fmt(v)}</b></div>`).join('');
}
function render(data=SNAPSHOT,live=false){
 if(!isLeader())return;
 const body=$('dashboardBody'); if(!body)return;
 style();
 const sc=data.schools||{},n=data.needs||{},w=data.workflow||{},ac=data.activities||{};
 const cov=num(sc.total)?Math.round(num(n.schools)/num(sc.total)*100):0;
 const title=$('dashTitle'),desc=$('dashDesc');
 if(title)title.textContent='Dashboard '+roleTitle();
 if(desc)desc.textContent='Ringkasan strategis ketenagaan dan layanan. Klik agregat untuk melihat rincian.';
 body.innerHTML=`<div class="lad-grid">
  <div class="lad-hero"><h2>Command Center Ketenagaan</h2><p>${esc(roleTitle())} • agregat TK/PAUD, SD, SMP, layanan kepegawaian, dan agenda bidang.</p></div>
  <div class="lad-note"><b>${live?'● Data live':'○ Data ringkasan aman'}</b> • ${live?'tersinkron dengan server':'snapshot terakhir valid '+esc(data.snapshot_at||SNAPSHOT.snapshot_at)}</div>
  <div class="lad-card"><div class="lad-label">Total Sekolah</div><div class="lad-value">${fmt(sc.total)}</div><div class="lad-sub">TK/PAUD ${fmt(sc.tk)} • SD ${fmt(sc.sd)} • SMP ${fmt(sc.smp)} • PNF ${fmt(sc.pnf)}</div></div>
  <div class="lad-card"><div class="lad-label">GTK Dapodik</div><div class="lad-value">${fmt(num(sc.teachers)+num(sc.staff))}</div><div class="lad-sub">Guru ${fmt(sc.teachers)} • Tendik ${fmt(sc.staff)}</div></div>
  <div class="lad-card"><div class="lad-label">Kebutuhan GTK Riil</div><div class="lad-value">${fmt(n.schools)} sekolah</div><div class="lad-sub">${fmt(n.rows)} entri • Gap Riil ${fmt(n.gap_riil)} • Gap Data ${fmt(n.gap_data)} • Cakupan ${cov}%</div></div>
  <div class="lad-card click" onclick="window.showTab&&window.showTab('kadinMonitoring')"><div class="lad-label">Usulan Aktif</div><div class="lad-value">${fmt(w.active)}</div><div class="lad-sub">Klik untuk melihat agregat dan rincian layanan</div></div>
  <div class="lad-card click" onclick="window.showTab&&window.showTab('kadinActivities')"><div class="lad-label">Agenda Mendatang</div><div class="lad-value">${fmt(ac.upcoming)}</div><div class="lad-sub">Total kegiatan ${fmt(ac.total)} • klik untuk melihat agenda</div></div>
  <div class="lad-card"><div class="lad-label">Perhatian</div><div class="lad-value">${fmt(num(n.gap_riil)+num(w.perbaikan))}</div><div class="lad-sub">Kekurangan GTK ${fmt(n.gap_riil)} • Perlu perbaikan ${fmt(w.perbaikan)}</div></div>
  <div class="lad-wide"><h3>Kebutuhan GTK per Jenjang</h3>${levelRows(n.levels||{})}</div>
  <div class="lad-wide"><h3>Workflow Layanan</h3>${workflowRows(w)}<button class="btn soft" style="margin-top:10px" onclick="window.showTab&&window.showTab('kadinMonitoring')">Lihat rincian layanan</button></div>
  <div class="lad-wide"><h3>Komposisi GTK</h3><div class="lad-state"><span>PNS</span><b>${fmt(n.pns)}</b></div><div class="lad-state"><span>PPPK</span><b>${fmt(n.pppk)}</b></div><div class="lad-state"><span>PPPK Paruh Waktu</span><b>${fmt(n.pppk_pw)}</b></div><div class="lad-state"><span>Non-ASN</span><b>${fmt(n.non_asn)}</b></div></div>
  <div class="lad-wide"><h3>Cakupan Input Kebutuhan</h3><div class="lad-value">${cov}%</div><div class="lad-sub">${fmt(n.schools)} dari ${fmt(sc.total)} sekolah sudah memiliki input Kebutuhan GTK Riil.</div></div>
 </div>`;
 body.dataset.authoritativeLeader='1'; lastRender=Date.now();
}
async function syncLive(){
 if(syncing||!isLeader())return; const sb=window.__simantabSb;if(!sb)return;
 syncing=true;
 try{
  const res=await Promise.race([sb.rpc('leader_dashboard_summary'),new Promise(r=>setTimeout(()=>r({data:null,error:{message:'timeout'}}),5000))]);
  if(res?.data&&!res.error){current={...res.data,snapshot_at:SNAPSHOT.snapshot_at};render(current,true)}
 }catch(_){}
 finally{syncing=false}
}
function ensure(){
 if(guard||!isLeader())return;const body=$('dashboardBody');if(!body)return;
 const active=$('dashboard')?.classList.contains('active') || body.offsetParent!==null;
 if(!active)return;
 const txt=(body.textContent||'').trim();
 if(body.dataset.authoritativeLeader!=='1'||/Memuat data|Memuat ringkasan pimpinan/i.test(txt)){guard=true;try{render(current,false)}finally{guard=false}}
}
for(let i=0;i<900&&!window.__simantabProfile;i++)await wait(50);
if(!isLeader())return;
render(SNAPSHOT,false);
setTimeout(syncLive,0);
const oldShow=window.showTab;
if(typeof oldShow==='function')window.showTab=async function(id){const r=await oldShow.apply(this,arguments);if(id==='dashboard'&&isLeader()){render(current,false);setTimeout(syncLive,0)}return r};
const oldRefresh=window.refreshAll;
if(typeof oldRefresh==='function')window.refreshAll=async function(){const r=await oldRefresh.apply(this,arguments);if(isLeader()){render(current,false);setTimeout(syncLive,0)}return r};
new MutationObserver(()=>queueMicrotask(ensure)).observe(document.body,{childList:true,subtree:true,characterData:true});
setInterval(ensure,800);
window.__simantabLeaderDashboardAuthoritative={version:1,render,syncLive};
})();