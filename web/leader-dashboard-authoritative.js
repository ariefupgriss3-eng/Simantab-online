/* SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V1 */
/* SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V2 */
/* SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V3 */
/* SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V4_EDU_UNITS_BATANG */
/* SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V5_COMPACT_EDU_DETAILS */
/* SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V6_VERIFIED_LIVE */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const $=id=>document.getElementById(id);
const getSb=()=>window.__simantabSb;
const SNAPSHOT={
 schools:{sd:455,tk:323,pnf:0,smp:76,staff:1709,total:854,teachers:5272},
 needs:{abk:119,asn:97,pns:37,pppk:47,rows:54,levels:{SD:{abk:119,asn:97,non_asn:14,gap_data:8,gap_riil:22},TK:{abk:0,asn:0,non_asn:0,gap_data:0,gap_riil:0},SMP:{abk:0,asn:0,non_asn:0,gap_data:0,gap_riil:0}},non_asn:14,pppk_pw:13,schools:10,gap_data:8,gap_riil:22},
 workflow:{total:4,active:4,selesai:0,perbaikan:0,menunggu_kabid:0,verifikasi_staf:0,menunggu_disposisi:3,menunggu_koordinator:0},
 activities:{total:3,upcoming:0,next_date:null},
 snapshot_at:'19 September 2026'
};
const num=v=>Number(v)||0, fmt=v=>new Intl.NumberFormat('id-ID').format(num(v));
const EDU_BATANG={
 snapshot_at:'22 September 2026',total:1194,
 formal:{total:854,negeri:509,swasta:345,types:{TK:{total:323,negeri:13,swasta:310},SD:{total:455,negeri:445,swasta:10},SMP:{total:76,negeri:51,swasta:25}}},
 nonformal:{total:340,negeri:1,swasta:339,groups:{'PAUD Nonformal':{total:266,negeri:0,swasta:266},'DIKMAS/PNF':{total:74,negeri:1,swasta:73}},types:{KB:{total:214,negeri:0,swasta:214},TPA:{total:17,negeri:0,swasta:17},SPS:{total:35,negeri:0,swasta:35},'Kursus/LKP':{total:30,negeri:0,swasta:30},TBM:{total:0,negeri:0,swasta:0},PKBM:{total:23,negeri:0,swasta:23},SKB:{total:1,negeri:1,swasta:0},Ponpes:{total:20,negeri:0,swasta:20}}},
 status:{negeri:510,swasta:684},
 source:'Formal: master aktif SIMANTAB. Nonformal: Referensi Data Kemendikdasmen.'
};
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
 #dashboardBody .lad-edu{grid-column:span 12;background:#fff;border:1px solid var(--line,#dde6ef);border-radius:16px;padding:14px}
 #dashboardBody .lad-edu-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
 #dashboardBody .lad-edu-total{font-size:29px;font-weight:950;color:#0f3f76}
 #dashboardBody .lad-edu-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
 #dashboardBody .lad-edu-box{border:1px solid #e2e8f0;border-radius:13px;padding:11px;background:#fbfdff}
 #dashboardBody .lad-edu-box h4{margin:0 0 7px;color:#173b60}
 #dashboardBody .lad-edu-row{display:grid;grid-template-columns:1fr auto auto auto;gap:7px;padding:5px 0;border-bottom:1px solid #eef2f6;font-size:10px}
 #dashboardBody .lad-edu-row:last-child{border-bottom:0}
 #dashboardBody .lad-edu-n{color:#0f5ca8;font-weight:800}.lad-edu-s{color:#8a5a00;font-weight:800}
 #dashboardBody .lad-edu-pills{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
 #dashboardBody .lad-edu-pill{padding:6px 9px;border-radius:999px;background:#edf5ff;color:#175ea7;font-size:9px;font-weight:900}
 #dashboardBody .lad-edu-pill.sw{background:#fff5df;color:#8a5a00}
 #dashboardBody .lad-edu-source{margin-top:8px;font-size:9px;color:#64748b;line-height:1.4}
 #dashboardBody .lad-edu-modal{position:fixed;inset:0;z-index:9999;background:#0b1f338f;display:none;align-items:center;justify-content:center;padding:22px}
 #dashboardBody .lad-edu-dialog{width:min(980px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 70px #0004;border:1px solid #dce6ef;padding:16px}
 #dashboardBody .lad-edu-dialog-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;position:sticky;top:-16px;background:#fff;padding:4px 0 10px;z-index:2;border-bottom:1px solid #edf2f7}
 #dashboardBody .lad-edu-close,#dashboardBody .lad-edu-btn{border:1px solid #cbd9e8;background:#f7fbff;color:#0f3f76;border-radius:9px;padding:6px 9px;font-size:10px;font-weight:900;cursor:pointer}
 #dashboardBody .lad-edu-close{background:#fff;color:#173b60}
 @media(max-width:760px){#dashboardBody .lad-card,#dashboardBody .lad-wide{grid-column:span 12}#dashboardBody .lad-edu-grid{grid-template-columns:1fr}}
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
function eduPanel(){
 const e=EDU_BATANG;
 const rows=o=>Object.entries(o.types).map(([name,x])=>`<div class="lad-edu-row"><b>${esc(name)}</b><span>${fmt(x.total)}</span><span class="lad-edu-n">N ${fmt(x.negeri)}</span><span class="lad-edu-s">S ${fmt(x.swasta)}</span></div>`).join('');
 return `<div id="eduBatangModal" class="lad-edu-modal" role="dialog" aria-modal="true" aria-label="Rincian satuan pendidikan Kabupaten Batang" onclick="if(event.target===this)__toggleEduUnitsBatang(false)"><div class="lad-edu-dialog"><div class="lad-edu-dialog-head"><div><div class="lad-label">RINCIAN SATUAN PENDIDIKAN SE-KABUPATEN BATANG</div><div class="lad-edu-total">${fmt(e.total)}</div><div class="lad-sub">Formal ${fmt(e.formal.total)} • Nonformal ${fmt(e.nonformal.total)} • Negeri ${fmt(e.status.negeri)} • Swasta ${fmt(e.status.swasta)}</div></div><button class="lad-edu-close" type="button" onclick="__toggleEduUnitsBatang(false)">✕ Tutup</button></div><div class="lad-edu-grid"><div class="lad-edu-box"><h4>🏫 Formal — ${fmt(e.formal.total)}</h4>${rows(e.formal)}<div class="lad-edu-pills"><span class="lad-edu-pill">Negeri ${fmt(e.formal.negeri)}</span><span class="lad-edu-pill sw">Swasta ${fmt(e.formal.swasta)}</span></div></div><div class="lad-edu-box"><h4>🎓 Nonformal — ${fmt(e.nonformal.total)}</h4><div class="lad-sub" style="margin-bottom:7px"><b>PAUD Nonformal ${fmt(e.nonformal.groups['PAUD Nonformal'].total)}</b> (KB, TPA, SPS) • <b>DIKMAS/PNF ${fmt(e.nonformal.groups['DIKMAS/PNF'].total)}</b></div>${rows(e.nonformal)}<div class="lad-edu-pills"><span class="lad-edu-pill">Negeri ${fmt(e.nonformal.negeri)}</span><span class="lad-edu-pill sw">Swasta ${fmt(e.nonformal.swasta)}</span></div></div></div><div class="lad-edu-source"><b>Snapshot ${esc(e.snapshot_at)}.</b> ${esc(e.source)} Tidak memasukkan SMA/SMK/MA/MTs/MI/RA.</div></div></div>`;
}
window.__toggleEduUnitsBatang=(show)=>{
 const el=$('eduBatangModal');if(!el)return;
 el.style.display=show?'flex':'none';
 document.body.style.overflow=show?'hidden':'';
};
if(!window.__simantabEduEscapeBound){
 window.__simantabEduEscapeBound=true;
 document.addEventListener('keydown',e=>{if(e.key==='Escape')window.__toggleEduUnitsBatang?.(false)});
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
  <div class="lad-note"><b>${live?'● Data live VERIFIED/APPROVED':'○ Data cadangan'}</b> • ${live?'tersinkron dengan database SIMANTAB':'snapshot cadangan '+esc(data.snapshot_at||SNAPSHOT.snapshot_at)}</div>
  ${eduPanel()}
  <div class="lad-card click" role="button" tabindex="0" onclick="__toggleEduUnitsBatang(true)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();__toggleEduUnitsBatang(true)}"><div class="lad-label">Total Satuan Pendidikan</div><div class="lad-value">${fmt(EDU_BATANG.total)}</div><div class="lad-sub">Formal ${fmt(EDU_BATANG.formal.total)} • Nonformal ${fmt(EDU_BATANG.nonformal.total)}<br>Negeri ${fmt(EDU_BATANG.status.negeri)} • Swasta ${fmt(EDU_BATANG.status.swasta)}</div><button class="lad-edu-btn" type="button" onclick="event.stopPropagation();__toggleEduUnitsBatang(true)" style="margin-top:7px">Lihat Rincian</button></div>
  <div class="lad-card"><div class="lad-label">GTK Dapodik</div><div class="lad-value">${fmt(num(sc.teachers)+num(sc.staff))}</div><div class="lad-sub">Guru ${fmt(sc.teachers)} • Tendik ${fmt(sc.staff)}</div></div>
  <div class="lad-card"><div class="lad-label">Kebutuhan GTK Riil</div><div class="lad-value">${fmt(n.schools)} sekolah</div><div class="lad-sub">VERIFIED/APPROVED • ${fmt(n.rows)} entri • Gap Riil ${fmt(n.gap_riil)} • Gap Data ${fmt(n.gap_data)} • Cakupan ${cov}%</div></div>
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
 if(syncing)return false;
 syncing=true;
 try{
  const sb=getSb();if(!sb)throw new Error('Supabase client belum siap.');
  const [sm,nr,wf,sr,ar]=await Promise.all([
   sb.from('school_master').select('npsn,bentuk_pendidikan,jenjang,teachers,staff').eq('is_active',true),
   sb.from('school_gtk_needs').select('school_npsn,school_level,abk,pns,pppk,pppk_pw,asn_total,non_asn_total'),
   sb.from('school_gtk_needs_workflow').select('school_npsn,status'),
   sb.from('submissions').select('status,workflow_state'),
   sb.from('field_activities').select('activity_date')
  ]);
  const er=sm.error||nr.error||wf.error||sr.error||ar.error;if(er)throw er;
  const schools=(sm.data||[]).filter(x=>['TK','SD','SMP'].includes(String(x.bentuk_pendidikan||x.jenjang||'').toUpperCase()));
  const verified=new Set((wf.data||[]).filter(x=>['VERIFIED','APPROVED'].includes(String(x.status||'').toUpperCase())).map(x=>String(x.school_npsn||'')));
  const rows=(nr.data||[]).filter(x=>verified.has(String(x.school_npsn||'')));
  const level=()=>({abk:0,asn:0,non_asn:0,gap_riil:0,gap_data:0});
  const levels={TK:level(),SD:level(),SMP:level()};
  const needs={abk:0,asn:0,pns:0,pppk:0,pppk_pw:0,non_asn:0,rows:rows.length,schools:new Set(rows.map(x=>x.school_npsn)).size,gap_riil:0,gap_data:0,levels};
  for(const x of rows){
   const abk=num(x.abk),asn=num(x.asn_total),non=num(x.non_asn_total),gr=Math.max(0,abk-asn),gd=Math.max(0,abk-asn-non);
   needs.abk+=abk;needs.asn+=asn;needs.pns+=num(x.pns);needs.pppk+=num(x.pppk);needs.pppk_pw+=num(x.pppk_pw);needs.non_asn+=non;needs.gap_riil+=gr;needs.gap_data+=gd;
   let l=String(x.school_level||'').toUpperCase();if(l==='PAUD')l='TK';
   if(levels[l]){levels[l].abk+=abk;levels[l].asn+=asn;levels[l].non_asn+=non;levels[l].gap_riil+=gr;levels[l].gap_data+=gd}
  }
  const subs=(sr.data||[]).filter(x=>String(x.status||'').toUpperCase()!=='DRAFT');
  const countW=s=>subs.filter(x=>String(x.workflow_state||'').toUpperCase()===s).length;
  const workflow={
   total:subs.length,
   active:subs.filter(x=>String(x.workflow_state||'').toUpperCase()!=='SELESAI'&&!['COMPLETED','REJECTED'].includes(String(x.status||'').toUpperCase())).length,
   selesai:countW('SELESAI'),
   perbaikan:countW('PERBAIKAN')+subs.filter(x=>String(x.status||'').toUpperCase()==='REVISION'&&String(x.workflow_state||'').toUpperCase()!=='PERBAIKAN').length,
   menunggu_kabid:countW('MENUNGGU_PERSETUJUAN_KABID'),
   verifikasi_staf:countW('VERIFIKASI_STAF'),
   menunggu_disposisi:countW('MENUNGGU_DISPOSISI_KOORDINATOR'),
   menunggu_koordinator:countW('MENUNGGU_APPROVAL_KOORDINATOR')
  };
  const acts=ar.data||[],today=new Date().toISOString().slice(0,10),up=acts.filter(x=>String(x.activity_date||'')>=today).sort((a,b)=>String(a.activity_date||'').localeCompare(String(b.activity_date||'')));
  const live={
   schools:{
    tk:schools.filter(x=>String(x.bentuk_pendidikan||x.jenjang||'').toUpperCase()==='TK').length,
    sd:schools.filter(x=>String(x.bentuk_pendidikan||x.jenjang||'').toUpperCase()==='SD').length,
    smp:schools.filter(x=>String(x.bentuk_pendidikan||x.jenjang||'').toUpperCase()==='SMP').length,
    pnf:0,total:schools.length,
    teachers:schools.reduce((s,x)=>s+num(x.teachers),0),
    staff:schools.reduce((s,x)=>s+num(x.staff),0)
   },
   needs,workflow,
   activities:{total:acts.length,upcoming:up.length,next_date:up[0]?.activity_date||null},
   snapshot_at:new Date().toLocaleString('id-ID')
  };
  current=live;render(live,true);return true;
 }catch(e){
  console.error('Leader dashboard live sync gagal:',e);
  return false;
 }finally{syncing=false}
}
function ensure(){return syncLive()}
for(let i=0;i<240&&(!window.__simantabProfile||!getSb());i++)await wait(50);
if(!isLeader())return;
const ok=await syncLive();
if(!ok)render(SNAPSHOT,false);
window.__simantabLeaderDashboardAuthoritative={version:6,render,syncLive,stable:true,verifiedNeedsOnly:true,eduUnitsBatang:true,compactEduDetails:true,liveVerified:true};
})();