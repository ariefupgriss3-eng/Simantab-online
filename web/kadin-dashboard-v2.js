/* SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V2 */
/* SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V3 */
/* SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V4 */
/* SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V5 */
/* SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V6 */
/* SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V7 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<600&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);
if(!sb)return;
const ROLE=()=>window.__simantabProfile?.role||'';
const DASH_ROLES=['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK'];
const isDashboardRole=()=>DASH_ROLES.includes(ROLE());
const isLeader=()=>['KEPALA_DINAS','SEKRETARIS_DINAS'].includes(ROLE());
const scopeLevel=()=>({KASI_SD:'SD',KASI_SMP:'SMP',SUBKOOR_TK:'TK'})[ROLE()]||null;
const PNF_ROLES=['KEPALA_DINAS','SEKRETARIS_DINAS','KABID','SUBKOOR_TK'];
const showPnf=()=>PNF_ROLES.includes(ROLE());
const pnfType=x=>{const raw=String(x.bentuk_pendidikan||x.jenjang||'').toUpperCase().trim();if(/(^|\b)(PKBM|SKB|LKP|KURSUS|KESETARAAN|PNF)(\b|$)/.test(raw))return raw.includes('PKBM')?'PKBM':raw.includes('SKB')?'SKB':raw.includes('LKP')||raw.includes('KURSUS')?'LKP/Kursus':raw.includes('KESETARAAN')?'Kesetaraan':'PNF';return ''};
const roleTitle=()=>({SUPER_ADMIN:'Super Admin SIMANTAB',KEPALA_DINAS:'Kepala Disdikbud',SEKRETARIS_DINAS:'Sekretaris Disdikbud',KABID:'Kabid Ketenagaan',KASI_SD:'Kasi PPTK SD',KASI_SMP:'Kasi PPTK SMP',SUBKOOR_TK:'Subkoor PPTK TK/PAUD'})[ROLE()]||ROLE();
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num=v=>Number(v)||0,fmt=v=>new Intl.NumberFormat('id-ID').format(num(v)),pct=(a,b)=>b?Math.max(0,Math.min(100,Math.round(a/b*100))):0;
const SL={SUBMITTED:'Diajukan',VERIFYING:'Diverifikasi',REVISION:'Perlu Perbaikan',APPROVED:'Disetujui',COMPLETED:'Selesai',REJECTED:'Ditolak'};
const WF={MENUNGGU_DISPOSISI_KOORDINATOR:'Menunggu Pembagian Tugas',VERIFIKASI_STAF:'Verifikasi Staf/Admin',MENUNGGU_APPROVAL_KOORDINATOR:'Menunggu Approval Kasi/Subkoor',MENUNGGU_PERSETUJUAN_KABID:'Menunggu Persetujuan Kabid',PERBAIKAN:'Perlu Perbaikan',SELESAI:'Selesai'};
const WL={PENGAJUAN:'Pengajuan',CEK_KELENGKAPAN:'Cek Berkas',VERIF_VALIDASI:'Verifikasi',PERBAIKAN:'Perbaikan',INPUT_VERVALPTK:'Verval PTK',REKOMENDASI:'Rekomendasi',DAPODIK:'Dapodik',SINKRONISASI:'Sinkronisasi',ARSIP:'Arsip'};
let cached=null,cacheAt=0;
function addStyle(){if($('kadinStyleV2'))return;const s=document.createElement('style');s.id='kadinStyleV2';s.textContent=`.kdg{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}.k3{grid-column:span 4}.k5{grid-column:span 5}.k6{grid-column:span 6}.k7{grid-column:span 7}.k12{grid-column:span 12}.kk,.kp{background:#fff;border:1px solid var(--line);border-radius:17px;padding:15px;box-shadow:0 6px 18px #19365a0d}.kh{background:linear-gradient(135deg,#0f3f76,#1767b3);color:#fff;border-radius:19px;padding:19px}.kh h2{margin:0}.kh p{margin:5px 0 0;opacity:.9}.kv{font-size:30px;font-weight:950;margin:4px 0}.ks{font-size:11px;color:var(--muted);line-height:1.5}.ki{font-size:23px;float:right}.kr{display:grid;grid-template-columns:76px 1fr 52px;gap:8px;align-items:center;margin:8px 0;font-size:11px}.kt{height:9px;border-radius:99px;background:#edf2f7;overflow:hidden}.kf{height:100%;border-radius:99px;background:#1767b3}.kg{background:#178354}.ko{background:#d97706}.kred{background:#b42318}.kdw{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.kdonut{width:142px;height:142px;border-radius:50%;position:relative;flex:none}.kdonut:after{content:'';position:absolute;inset:27px;background:#fff;border-radius:50%}.kl{font-size:11px;line-height:1.9}.kdot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}.kprio{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.ka{border:1px solid var(--line);border-radius:12px;padding:11px;background:#fafcff}.ka b{display:block;font-size:18px}.ktbl{width:100%;border-collapse:collapse;font-size:11px}.ktbl th,.ktbl td{padding:8px;border-bottom:1px solid var(--line);text-align:left}.ktbl th{font-size:9px;color:var(--muted);text-transform:uppercase}.kpill{display:inline-block;padding:4px 7px;border-radius:999px;background:#edf5ff;color:#175ea7;font-size:9px;font-weight:900}.khead{display:flex;justify-content:space-between;gap:9px;align-items:center;margin-bottom:13px}.khead h2{margin:0}.khead p{margin:4px 0 0;color:var(--muted);font-size:12px}.kact{display:flex;gap:7px}.kact button{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 10px;font-weight:800}@media(max-width:980px){.k3,.k5,.k6,.k7{grid-column:span 12}.kprio{grid-template-columns:1fr}.kr{grid-template-columns:66px 1fr 46px}}`;document.head.appendChild(s)}
function sections(){if(!isLeader())return;const main=document.querySelector('main.content');if(!main)return;for(const id of ['kadinGtk','kadinMonitoring','kadinPtk','kadinActivities']){if($(id))continue;const s=document.createElement('section');s.id=id;s.className='section';main.insertBefore(s,main.querySelector('.footer'))}}
function nav(){if(!isLeader()||!$('nav'))return;$('nav').innerHTML=`<div class="navhead">Pimpinan</div><button class="navbtn" data-tab="dashboard" onclick="showTab('dashboard')"><span class="ico">▦</span>Dashboard</button><button class="navbtn" data-tab="kadinGtk" onclick="showTab('kadinGtk')"><span class="ico">📊</span>Infografis GTK</button><button class="navbtn" data-tab="kadinMonitoring" onclick="showTab('kadinMonitoring')"><span class="ico">◫</span>Monitoring Layanan</button><button class="navbtn" data-tab="kadinPtk" onclick="showTab('kadinPtk')"><span class="ico">🧑‍🏫</span>PTK Baru Swasta</button><button class="navbtn" data-tab="kadinActivities" onclick="showTab('kadinActivities')"><span class="ico">📅</span>Kegiatan Bidang</button><div class="navhead">Akun</div><button class="navbtn" data-tab="notifications" onclick="showTab('notifications')"><span class="ico">🔔</span>Notifikasi</button><button class="navbtn" data-tab="profile" onclick="showTab('profile')"><span class="ico">♙</span>Profil</button>`}
const schoolLevel=x=>String(x.bentuk_pendidikan||x.jenjang||'').toUpperCase();
async function rawData(force=false){if(cached&&!force&&Date.now()-cacheAt<30000)return cached;const rr=await Promise.all([
sb.from('school_master').select('npsn,school_name,school_status,bentuk_pendidikan,jenjang,students,teachers,staff').eq('is_active',true),
sb.from('school_gtk_needs').select('school_npsn,school_name,school_level,abk,pns,pppk,pppk_pw,asn_total,non_asn_total,gap_riil,gap_data'),
sb.from('submissions').select('id,user_id,service_type,title,status,scope_level,workflow_state,submitted_at,assigned_role,assigned_user_id,updated_at').order('submitted_at',{ascending:false}),
sb.from('ptk_swasta_submission_details').select('school_name,jenjang,ptk_name,position_name,workflow_stage,updated_at').order('updated_at',{ascending:false}),
sb.from('field_activities').select('activity_name,activity_date,activity_time,place').order('activity_date',{ascending:false}),
sb.from('notifications').select('*',{count:'exact',head:true}).eq('is_read',false),
sb.from('school_gtk_needs_workflow').select('school_npsn,status')
]);const er=rr.find(x=>x.error)?.error;if(er)throw er;const verified=new Set((rr[6].data||[]).filter(x=>['VERIFIED','APPROVED'].includes(String(x.status||'').toUpperCase())).map(x=>x.school_npsn));const needs=(rr[1].data||[]).filter(x=>!isLeader()||verified.has(x.school_npsn));cached={schools:rr[0].data||[],needs,subs:rr[2].data||[],ptk:rr[3].data||[],acts:rr[4].data||[],unread:rr[5].count||0};cacheAt=Date.now();return cached}
function scoped(d){const lev=scopeLevel(),role=ROLE();if(!lev)return d;return{...d,schools:d.schools.filter(x=>schoolLevel(x)===lev||(role==='SUBKOOR_TK'&&pnfType(x))),needs:d.needs.filter(x=>String(x.school_level||'').toUpperCase()===lev),subs:d.subs.filter(x=>String(x.assigned_role||'')===role),ptk:d.ptk.filter(x=>String(x.jenjang||'').toUpperCase()===lev)}}
async function data(force=false){return scoped(await rawData(force))}
function agg(d){const pnfSchools=d.schools.filter(x=>pnfType(x));const pnf={total:pnfSchools.length,students:pnfSchools.reduce((s,x)=>s+num(x.students),0),teachers:pnfSchools.reduce((s,x)=>s+num(x.teachers),0),staff:pnfSchools.reduce((s,x)=>s+num(x.staff),0),types:{}};for(const x of pnfSchools){const t=pnfType(x);pnf.types[t]=(pnf.types[t]||0)+1}const a={pnf,school:{total:d.schools.length,TK:0,SD:0,SMP:0,teachers:0,staff:0,negeri:0,swasta:0},need:{rows:d.needs.length,schools:new Set(d.needs.map(x=>x.school_npsn)).size,abk:0,asn:0,non:0,gap:0,gapData:0,short:0,pns:0,pppk:0,pw:0,lev:{TK:{abk:0,asn:0,gap:0},SD:{abk:0,asn:0,gap:0},SMP:{abk:0,asn:0,gap:0}}},status:{},workflow:{},service:{},stage:{},ptkl:{TK:0,SD:0,SMP:0}};for(const k of Object.keys(SL))a.status[k]=0;for(const k of Object.keys(WF))a.workflow[k]=0;for(const k of Object.keys(WL))a.stage[k]=0;for(const x of d.schools){const l=schoolLevel(x);if(a.school[l]!=null)a.school[l]++;a.school.teachers+=num(x.teachers);a.school.staff+=num(x.staff);if(String(x.school_status).toUpperCase()==='NEGERI')a.school.negeri++;else if(String(x.school_status).toUpperCase()==='SWASTA')a.school.swasta++}for(const x of d.needs){const abk=num(x.abk),asn=num(x.asn_total),non=num(x.non_asn_total),gr=Math.max(0,abk-asn),gd=Math.max(0,abk-asn-non);a.need.abk+=abk;a.need.asn+=asn;a.need.non+=non;a.need.gap+=gr;a.need.gapData+=gd;a.need.short+=gr;a.need.pns+=num(x.pns);a.need.pppk+=num(x.pppk);a.need.pw+=num(x.pppk_pw);const l=String(x.school_level||'').toUpperCase();if(a.need.lev[l]){a.need.lev[l].abk+=abk;a.need.lev[l].asn+=asn;a.need.lev[l].gap+=gr}}for(const x of d.subs.filter(x=>x.status!=='DRAFT')){a.status[x.status]=(a.status[x.status]||0)+1;a.workflow[x.workflow_state]=(a.workflow[x.workflow_state]||0)+1;a.service[x.service_type]=(a.service[x.service_type]||0)+1}for(const x of d.ptk){a.stage[x.workflow_stage]=(a.stage[x.workflow_stage]||0)+1;const l=String(x.jenjang||'').toUpperCase();if(a.ptkl[l]!=null)a.ptkl[l]++}a.active=d.subs.filter(x=>x.status!=='DRAFT'&&x.workflow_state!=='SELESAI'&&!['COMPLETED','REJECTED'].includes(x.status)).length;const today=new Date().toISOString().slice(0,10);a.up=d.acts.filter(x=>x.activity_date>=today).sort((x,y)=>String(x.activity_date).localeCompare(String(y.activity_date)));return a}
const card=(icon,label,value,sub,action='')=>`<div class="kk k3" ${action?`role="button" tabindex="0" onclick="${action}" style="cursor:pointer"`:''}><span class="ki">${icon}</span><div class="label">${esc(label)}</div><div class="kv">${esc(value)}</div><div class="ks">${sub}${action?'<br><b>Klik untuk rincian</b>':''}</div></div>`;
const bar=(label,v,max,cls='')=>`<div class="kr"><b>${esc(label)}</b><div class="kt"><div class="kf ${cls}" style="width:${pct(v,max)}%"></div></div><b>${fmt(v)}</b></div>`;
function shownLevels(){return scopeLevel()?[scopeLevel()]:['TK','SD','SMP']}
function levelBars(a){const lv=shownLevels(),m=Math.max(1,...lv.flatMap(l=>[a.need.lev[l].abk,a.need.lev[l].asn,Math.max(0,a.need.lev[l].gap)]));return lv.map(l=>`<div style="margin-bottom:13px"><b>${l}</b>${bar('ABK',a.need.lev[l].abk,m)}${bar('ASN',a.need.lev[l].asn,m,'kg')}${bar('Gap',Math.max(0,a.need.lev[l].gap),m,'ko')}</div>`).join('')}
function donut(a){const v=[a.need.pns,a.need.pppk,a.need.pw,a.need.non],t=v.reduce((x,y)=>x+y,0)||1,p1=v[0]/t*100,p2=p1+v[1]/t*100,p3=p2+v[2]/t*100;return `<div class="kdw"><div class="kdonut" style="background:conic-gradient(#1767b3 0 ${p1}%,#178354 ${p1}% ${p2}%,#d97706 ${p2}% ${p3}%,#7b8794 ${p3}% 100%)"></div><div class="kl"><div><span class="kdot" style="background:#1767b3"></span>PNS <b>${fmt(v[0])}</b></div><div><span class="kdot" style="background:#178354"></span>PPPK <b>${fmt(v[1])}</b></div><div><span class="kdot" style="background:#d97706"></span>PPPK PW <b>${fmt(v[2])}</b></div><div><span class="kdot" style="background:#7b8794"></span>Non-ASN <b>${fmt(v[3])}</b></div></div></div>`}
function statusBars(a){const m=Math.max(1,...Object.values(a.status));return Object.keys(SL).map((k,i)=>bar(SL[k],a.status[k]||0,m,['','kg','ko','ko','kg','kred'][i]||'')).join('')}
function workflowBars(a){const m=Math.max(1,...Object.values(a.workflow));return Object.keys(WF).map((k,i)=>bar(WF[k],a.workflow[k]||0,m,['','kg','ko','ko','kred','kg'][i]||'')).join('')}
const head=(t,d)=>`<div class="khead"><div><h2>${esc(t)}</h2><p>${esc(d)}</p></div><div class="kact"><button onclick="__kadinRefresh()">↻ Segarkan</button><button onclick="window.print()">🖨 Cetak</button></div></div>`;
function schoolSub(a){const lev=scopeLevel();return lev?`${lev}${ROLE()==='SUBKOOR_TK'?' + PNF':''} • Negeri ${fmt(a.school.negeri)} • Swasta ${fmt(a.school.swasta)}`:`TK ${fmt(a.school.TK)} • SD ${fmt(a.school.SD)} • SMP ${fmt(a.school.SMP)}${showPnf()?` • PNF ${fmt(a.pnf.total)}`:''}<br>Negeri ${fmt(a.school.negeri)} • Swasta ${fmt(a.school.swasta)}`}
function pnfPanel(a){if(!showPnf())return'';const types=Object.entries(a.pnf.types).sort((x,y)=>y[1]-x[1]);return `<div class="kp k12"><h3>Informasi Pendidikan Nonformal (PNF)</h3><div class="kprio"><div class="ka"><b>${fmt(a.pnf.total)}</b>Satuan PNF aktif</div><div class="ka"><b>${fmt(a.pnf.students)}</b>Peserta didik/warga belajar</div><div class="ka"><b>${fmt(a.pnf.teachers)}</b>Pendidik PNF</div><div class="ka"><b>${fmt(a.pnf.staff)}</b>Tenaga kependidikan PNF</div></div><div class="ks" style="margin-top:11px"><b>Jenis satuan:</b> ${types.length?types.map(([k,v])=>`${esc(k)} ${fmt(v)}`).join(' • '):'Belum ada data PNF pada Master Sekolah.'}</div></div>`}
function ptkSub(a){const lev=scopeLevel();return lev?`${lev} ${fmt(a.ptkl[lev])} usulan`:`TK ${fmt(a.ptkl.TK)} • SD ${fmt(a.ptkl.SD)} • SMP ${fmt(a.ptkl.SMP)}`}
async function leaderSummaryFallback(){
 const timed=(promise,ms=9000)=>Promise.race([promise,new Promise((_,rej)=>setTimeout(()=>rej(new Error('Timeout koneksi data pimpinan.')),ms))]);
 const rr=await timed(Promise.all([
   sb.from('school_master').select('jenjang,bentuk_pendidikan,teachers,staff').eq('is_active',true),
   sb.from('school_gtk_needs').select('school_npsn,school_level,abk,pns,pppk,pppk_pw,asn_total,non_asn_total'),
   sb.from('submissions').select('status,workflow_state'),
   sb.from('field_activities').select('activity_date'),
   sb.from('school_gtk_needs_workflow').select('school_npsn,status')
 ]));
 const er=rr.find(x=>x.error)?.error;if(er)throw er;
 const verified=new Set((rr[4].data||[]).filter(x=>['VERIFIED','APPROVED'].includes(String(x.status||'').toUpperCase())).map(x=>x.school_npsn));
 const schools=rr[0].data||[],needs=(rr[1].data||[]).filter(x=>verified.has(x.school_npsn)),subs=rr[2].data||[],acts=rr[3].data||[];
 const sc={total:schools.length,tk:0,sd:0,smp:0,pnf:0,teachers:0,staff:0};
 for(const x of schools){const j=String(x.jenjang||'').toUpperCase(),b=String(x.bentuk_pendidikan||'').toUpperCase();if(j==='PAUD')sc.tk++;if(j==='SD')sc.sd++;if(j==='SMP')sc.smp++;if(['PNF','KESETARAAN'].includes(j)||['PKBM','SKB','LKP'].includes(b))sc.pnf++;sc.teachers+=num(x.teachers);sc.staff+=num(x.staff)}
 const lv={TK:{abk:0,asn:0,non_asn:0,gap_riil:0,gap_data:0},SD:{abk:0,asn:0,non_asn:0,gap_riil:0,gap_data:0},SMP:{abk:0,asn:0,non_asn:0,gap_riil:0,gap_data:0}};
 const n={rows:needs.length,schools:new Set(needs.map(x=>x.school_npsn)).size,abk:0,asn:0,non_asn:0,pns:0,pppk:0,pppk_pw:0,gap_riil:0,gap_data:0,levels:lv};
 for(const x of needs){const raw=String(x.school_level||'').toUpperCase(),l=raw==='PAUD'||raw==='TK'?'TK':raw==='SD'?'SD':raw==='SMP'?'SMP':null,abk=num(x.abk),asn=num(x.asn_total),non=num(x.non_asn_total),gr=Math.max(0,abk-asn),gd=Math.max(0,abk-asn-non);n.abk+=abk;n.asn+=asn;n.non_asn+=non;n.pns+=num(x.pns);n.pppk+=num(x.pppk);n.pppk_pw+=num(x.pppk_pw);n.gap_riil+=gr;n.gap_data+=gd;if(l){lv[l].abk+=abk;lv[l].asn+=asn;lv[l].non_asn+=non;lv[l].gap_riil+=gr;lv[l].gap_data+=gd}}
 const w={total:0,active:0,selesai:0,perbaikan:0,menunggu_kabid:0,verifikasi_staf:0,menunggu_disposisi:0,menunggu_koordinator:0};
 for(const x of subs){if(x.status==='DRAFT')continue;w.total++;const st=x.workflow_state||'';if(st!=='SELESAI')w.active++;if(st==='SELESAI')w.selesai++;if(st==='PERBAIKAN')w.perbaikan++;if(st==='MENUNGGU_PERSETUJUAN_KABID')w.menunggu_kabid++;if(st==='VERIFIKASI_STAF')w.verifikasi_staf++;if(st==='MENUNGGU_DISPOSISI_KOORDINATOR')w.menunggu_disposisi++;if(st==='MENUNGGU_APPROVAL_KOORDINATOR')w.menunggu_koordinator++}
 const today=new Date().toISOString().slice(0,10),ac={total:acts.length,upcoming:acts.filter(x=>String(x.activity_date||'')>=today).length};
 return{role:ROLE(),schools:sc,needs:n,workflow:w,activities:ac};
}
const LEADER_SAFE_SNAPSHOT={
 role:'SEKRETARIS_DINAS',
 schools:{sd:455,tk:323,pnf:0,smp:76,staff:1709,total:854,teachers:5272},
 needs:{abk:119,asn:97,pns:37,pppk:47,rows:54,levels:{SD:{abk:119,asn:97,non_asn:14,gap_data:8,gap_riil:22},TK:{abk:0,asn:0,non_asn:0,gap_data:0,gap_riil:0},SMP:{abk:0,asn:0,non_asn:0,gap_data:0,gap_riil:0}},non_asn:14,pppk_pw:13,schools:10,gap_data:8,gap_riil:22},
 workflow:{total:4,active:4,selesai:0,perbaikan:0,menunggu_kabid:0,verifikasi_staf:0,menunggu_disposisi:3,menunggu_koordinator:0},
 activities:{total:3,upcoming:0,next_date:null},
 snapshot_at:'19 September 2026'
};
function renderLeaderSummary(s,live=false){
 const b=$('dashboardBody');if(!b)return;
 const rt=roleTitle(),sc=s?.schools||{},n=s?.needs||{},lv=n.levels||{},w=s?.workflow||{},ac=s?.activities||{};
 const a={
  need:{
   pns:num(n.pns),pppk:num(n.pppk),pw:num(n.pppk_pw),non:num(n.non_asn),
   lev:{
    TK:{abk:num(lv.TK?.abk),asn:num(lv.TK?.asn),gap:num(lv.TK?.gap_riil)},
    SD:{abk:num(lv.SD?.abk),asn:num(lv.SD?.asn),gap:num(lv.SD?.gap_riil)},
    SMP:{abk:num(lv.SMP?.abk),asn:num(lv.SMP?.asn),gap:num(lv.SMP?.gap_riil)}
   }
  },
  workflow:{
   MENUNGGU_DISPOSISI_KOORDINATOR:num(w.menunggu_disposisi),
   VERIFIKASI_STAF:num(w.verifikasi_staf),
   MENUNGGU_APPROVAL_KOORDINATOR:num(w.menunggu_koordinator),
   MENUNGGU_PERSETUJUAN_KABID:num(w.menunggu_kabid),
   PERBAIKAN:num(w.perbaikan),
   SELESAI:num(w.selesai)
  }
 };
 const coverage=num(sc.total)?Math.round(num(n.schools)/num(sc.total)*100):0;
 b.innerHTML=`<div class="kdg">
  <div class="kh k12"><h2>Command Center Ketenagaan</h2><p>${esc(rt)} • agregat TK/PAUD, SD, SMP, layanan kepegawaian, dan agenda bidang.</p></div>
  <div class="kp k12" style="padding:10px 14px"><div class="ks"><b>${live?'● Data live':'○ Data ringkasan aman'}</b> • ${live?'tersinkron dengan server':'snapshot terakhir valid '+esc(s?.snapshot_at||'')}</div></div>
  ${card('🏫','Total Sekolah',fmt(sc.total),`TK/PAUD ${fmt(sc.tk)} • SD ${fmt(sc.sd)} • SMP ${fmt(sc.smp)} • PNF ${fmt(sc.pnf)}`)}
  ${card('👥','GTK Dapodik',fmt(num(sc.teachers)+num(sc.staff)),`Guru ${fmt(sc.teachers)} • Tendik ${fmt(sc.staff)}`)}
  ${card('◎','Kebutuhan GTK Riil',`${fmt(n.schools)} sekolah`,`${fmt(n.rows)} entri jabatan • Gap Riil ${fmt(n.gap_riil)} • Gap Data ${fmt(n.gap_data)} • Cakupan ${coverage}%`)}
  ${card('☑','Usulan Aktif',fmt(w.active),'Klik untuk melihat seluruh GTK yang sedang diproses',"__leaderOpenSubmissionDetails('ACTIVE')")}
  ${card('📅','Agenda Mendatang',fmt(ac.upcoming),`Total kegiatan ${fmt(ac.total)}`)}
  ${card('🔔','Perhatian',fmt(num(n.gap_riil)+num(w.perbaikan)),`Kekurangan GTK ${fmt(n.gap_riil)} • Perlu perbaikan ${fmt(w.perbaikan)}`)}
  <div class="kp k7"><h3>Kebutuhan GTK per Jenjang</h3>${levelBars(a)}</div>
  <div class="kp k5"><h3>Komposisi GTK</h3>${donut(a)}</div>
  <div class="kp k6"><h3>Workflow Layanan</h3>${workflowBars(a)}<button class="btn soft" style="margin-top:8px" onclick="__leaderOpenSubmissionDetails('ALL')">Lihat seluruh usulan</button></div>
  <div class="kp k6"><h3>Cakupan Input Kebutuhan</h3><div class="kv">${coverage}%</div><div class="ks">${fmt(n.schools)} dari ${fmt(sc.total)} sekolah sudah memiliki input kebutuhan GTK.</div><div class="kt" style="height:14px;margin-top:12px"><div class="kf kg" style="width:${coverage}%"></div></div></div>
 </div>`;
}
async function fetchLeaderLive(){
 try{
  const rpcResult=await Promise.race([
   sb.rpc('leader_dashboard_summary'),
   new Promise(resolve=>setTimeout(()=>resolve({data:null,error:{message:'RPC_TIMEOUT'}}),5000))
  ]);
  if(!rpcResult?.error&&rpcResult?.data)return rpcResult.data;
 }catch(_){}
 try{return await leaderSummaryFallback()}catch(_){return null}
}
async function leaderDash(force=false){
 addStyle();
 const b=$('dashboardBody');if(!b)return;
 const rt=roleTitle();
 $('dashTitle').textContent=`Dashboard ${rt}`;
 $('dashDesc').textContent='Ringkasan strategis ketenagaan dan layanan. Klik agregat untuk melihat rincian.';
 renderLeaderSummary(LEADER_SAFE_SNAPSHOT,false);
}
async function dash(force=false){if(!isDashboardRole())return;if(isLeader())return leaderDash(force);addStyle();const b=$('dashboardBody');if(!b)return;const lev=scopeLevel(),rt=roleTitle();$('dashTitle').textContent=`Dashboard ${rt}`;$('dashDesc').textContent=lev?`Infografis ketenagaan khusus ${ROLE()==='SUBKOOR_TK'?'PAUD/TK dan PNF':`jenjang ${lev}`}.`:`Ringkasan strategis ketenagaan TK, SD, SMP${showPnf()?', dan PNF':''} dalam satu layar.`;b.innerHTML='<div class="card">Memuat infografis...</div>';try{const d=await data(force),a=agg(d),cov=pct(a.need.schools,a.school.total),next=a.up[0],lv=shownLevels(),top=lv.map(l=>[l,a.need.lev[l]]).sort((x,y)=>y[1].gap-x[1].gap)[0],scopeText=lev?`Jenjang ${lev}`:'Semua jenjang';b.innerHTML=`<div class="kdg"><div class="kh k12"><h2>Command Center Ketenagaan</h2><p>${esc(rt)} • ${esc(scopeText)} • kondisi sekolah, GTK, layanan, dan isu prioritas.</p></div>${card('🏫','Total Sekolah',fmt(a.school.total),schoolSub(a))}${card('👥','GTK Dapodik',fmt(a.school.teachers+a.school.staff),`Guru ${fmt(a.school.teachers)} • Tendik ${fmt(a.school.staff)}`)}${card('◎','Kebutuhan GTK Riil',`${fmt(a.need.schools)} sekolah`,`${fmt(a.need.rows)} entri jabatan • Gap riil ${fmt(a.need.gap)} • cakupan ${cov}%`)}${card('☑','Usulan Aktif',fmt(a.active),`Perbaikan ${fmt(a.workflow.PERBAIKAN||0)} • Selesai ${fmt(a.workflow.SELESAI||0)}`,"__leaderOpenSubmissionDetails('ACTIVE')")}${card('🧑‍🏫','PTK Baru Swasta',fmt(d.ptk.length),ptkSub(a))}${card('🔔','Perhatian',fmt(a.need.short+a.status.REVISION),`Kekurangan ${fmt(a.need.short)} • Perbaikan ${fmt(a.status.REVISION)} • Notifikasi ${fmt(d.unread)}`)}${pnfPanel(a)}<div class="kp k7"><h3>${lev?`Kebutuhan GTK ${lev}`:'Kebutuhan GTK per Jenjang'}</h3>${levelBars(a)}</div><div class="kp k5"><h3>Komposisi GTK</h3>${donut(a)}</div><div class="kp k6"><h3>Workflow Layanan</h3>${workflowBars(a)}<button class="btn soft" style="margin-top:8px" onclick="__leaderOpenSubmissionDetails('ALL')">Lihat seluruh usulan</button></div><div class="kp k6"><h3>Cakupan Input Kebutuhan</h3><div class="kv">${cov}%</div><div class="ks">${fmt(a.need.schools)} dari ${fmt(a.school.total)} sekolah ${lev?lev:''} sudah memiliki input.</div><div class="kt" style="height:14px;margin-top:12px"><div class="kf kg" style="width:${cov}%"></div></div></div><div class="kp k12"><h3>Sorotan ${esc(rt)}</h3><div class="kprio"><div class="ka"><b>${fmt(a.need.short)}</b>Kekurangan GTK (gap positif)</div><div class="ka"><b>${esc(top?.[0]||'-')}</b>${lev?'Gap jenjang':'Jenjang gap tertinggi'}: ${fmt(top?.[1]?.gap||0)}</div><div class="ka"><b>${fmt(Math.max(0,a.school.total-a.need.schools))}</b>Sekolah ${lev?lev:''} belum input kebutuhan GTK</div><div class="ka"><b>${next?esc(next.activity_name):'-'}</b>${next?`${esc(next.activity_date)} • ${esc(next.place||'-')}`:'Belum ada agenda mendatang'}</div></div></div></div>`}catch(e){b.innerHTML=`<div class="card err">${esc(e.message)}</div>`}}
function topGap(d){const m=new Map;for(const x of d.needs){const k=x.school_npsn||x.school_name,o=m.get(k)||{name:x.school_name,npsn:x.school_npsn,g:0};o.g+=Math.max(0,num(x.abk)-num(x.asn_total));m.set(k,o)}return[...m.values()].filter(x=>x.g>0).sort((a,b)=>b.g-a.g).slice(0,10)}
async function gtk(force=false){if(!isLeader())return;const b=$('kadinGtk');b.innerHTML='<div class="card">Memuat...</div>';try{const d=await data(force),a=agg(d),cov=pct(a.need.schools,a.school.total),rows=topGap(d);b.innerHTML=`${head('Infografis GTK','Ringkasan kebutuhan dan ketersediaan GTK tanpa form input.')}<div class="kdg">${card('🎯','ABK Ideal',fmt(a.need.abk),'Akumulasi kebutuhan pada sekolah yang sudah input')}${card('👤','ASN',fmt(a.need.asn),'PNS + PPPK + PPPK Paruh Waktu')}${card('🧩','Non-ASN',fmt(a.need.non),'Ditampilkan terpisah dari Gap Riil')}${card('⚠️','Gap Riil',fmt(a.need.gap),`Kekurangan positif ${fmt(a.need.short)}`)}${card('📋','Gap Data',fmt(a.need.gapData),'ABK − (ASN + Non-ASN)')}${card('🏫','Cakupan',`${cov}%`,`${fmt(a.need.schools)} dari ${fmt(a.school.total)} sekolah`)}<div class="kp k7"><h3>ABK vs ASN vs Gap</h3>${levelBars(a)}</div><div class="kp k5"><h3>Komposisi GTK</h3>${donut(a)}</div><div class="kp k12"><h3>10 Sekolah dengan Kekurangan Terbesar</h3>${rows.length?`<table class="ktbl"><thead><tr><th>Sekolah</th><th>NPSN</th><th>Gap</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.npsn)}</td><td><span class="kpill">Kurang ${fmt(x.g)}</span></td></tr>`).join('')}</tbody></table>`:'<div class="ks">Belum ada gap positif.</div>'}</div></div>`}catch(e){b.innerHTML=`<div class="card err">${esc(e.message)}</div>`}}
async function monitoring(force=false){
 if(!isLeader())return;
 const b=$('kadinMonitoring');b.innerHTML='<div class="card">Memuat...</div>';
 try{
  const d=await data(force),rows=d.subs.filter(x=>x.status!=='DRAFT'),a=agg(d),
    types=Object.entries(a.service).sort((x,y)=>y[1]-x[1]),m=Math.max(1,...types.map(x=>x[1]));
  b.innerHTML=`${head('Monitoring Layanan','Ringkasan eksekutif. Nama GTK dan rincian usulan hanya ditampilkan setelah agregat diklik.')}<div class="kdg"><div class="kp k6"><h3>Workflow Layanan</h3>${workflowBars(a)}<button class="btn soft" style="margin-top:10px" onclick="__leaderOpenSubmissionDetails('ALL')">Lihat seluruh rincian</button></div><div class="kp k6"><h3>Jenis Layanan</h3>${types.length?types.map(x=>bar(x[0],x[1],m)).join(''):'<div class="ks">Belum ada usulan.</div>'}</div><div class="kp k12"><div class="info"><b>Mode Pimpinan:</b> halaman ini hanya menampilkan agregat ${rows.length} usulan yang sudah diajukan. Klik tombol rincian untuk melihat daftar GTK bila diperlukan.</div></div></div>`;
 }catch(e){b.innerHTML=`<div class="card err">${esc(e.message)}</div>`}
}
window.__leaderOpenSubmissionDetails=async function detailReplacement(filter){
 try{
  const d=await data(true),all=d.subs.filter(x=>x.status!=='DRAFT'),
    rows=filter==='ACTIVE'?all.filter(x=>x.workflow_state!=='SELESAI'&&!['COMPLETED','REJECTED'].includes(x.status)):filter==='ALL'?all:all.filter(x=>x.workflow_state===filter),
    pr=await sb.from('profiles').select('id,full_name,unit');
  if(pr.error)throw pr.error;
  const names=new Map((pr.data||[]).map(x=>[x.id,x]));
  let m=$('leaderSubmissionDetailModal');m?.remove();m=document.createElement('div');m.id='leaderSubmissionDetailModal';
  m.style='position:fixed;inset:0;z-index:99999;background:#0b203c99;display:flex;align-items:center;justify-content:center;padding:16px';
  m.onclick=e=>{if(e.target===m)m.remove()};
  m.innerHTML=`<div class="card" style="width:min(1050px,100%);max-height:92vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><div class="label">RINCIAN LAYANAN</div><h3 style="margin:3px 0">${filter==='ACTIVE'?'Usulan Aktif':'Seluruh Usulan'}</h3><div class="small">${rows.length} usulan</div></div><button class="btn soft" onclick="document.getElementById('leaderSubmissionDetailModal')?.remove()">✕</button></div><div style="height:10px"></div><div class="tablewrap"><table><thead><tr><th>Tanggal</th><th>GTK</th><th>Unit</th><th>Layanan</th><th>Jenjang</th><th>Tahap</th></tr></thead><tbody>${rows.map(x=>{const u=names.get(x.user_id)||{};return `<tr><td>${esc(new Date(x.submitted_at).toLocaleDateString('id-ID'))}</td><td><b>${esc(u.full_name||'-')}</b></td><td>${esc(u.unit||'-')}</td><td>${esc(x.title||x.service_type)}</td><td>${esc(x.scope_level||'-')}</td><td><span class="kpill">${esc(WF[x.workflow_state]||x.workflow_state||SL[x.status]||x.status)}</span></td></tr>`}).join('')}</tbody></table></div></div>`;
  document.body.appendChild(m);
 }catch(e){alert(e.message||String(e))}
};
async function ptk(force=false){if(!isLeader())return;const b=$('kadinPtk');b.innerHTML='<div class="card">Memuat...</div>';try{const d=await data(force),a=agg(d),m=Math.max(1,...Object.values(a.stage));b.innerHTML=`${head('Usul PTK Baru Swasta','Pantauan TK, SD, dan SMP swasta dari pengajuan sampai arsip.')}<div class="kdg">${card('🧸','TK Swasta',fmt(a.ptkl.TK),'Usulan PTK baru TK')}${card('🏫','SD Swasta',fmt(a.ptkl.SD),'Usulan PTK baru SD')}${card('🎓','SMP Swasta',fmt(a.ptkl.SMP),'Usulan PTK baru SMP')}<div class="kp k12"><h3>Progres Tahapan</h3>${Object.keys(WL).map(k=>bar(WL[k],a.stage[k]||0,m,k==='PERBAIKAN'?'ko':k==='ARSIP'?'kg':'')).join('')}</div><div class="kp k12"><h3>Usulan Terbaru</h3>${d.ptk.length?`<table class="ktbl"><thead><tr><th>Sekolah</th><th>Jenjang</th><th>PTK</th><th>Jabatan</th><th>Tahap</th></tr></thead><tbody>${d.ptk.slice(0,12).map(x=>`<tr><td><b>${esc(x.school_name)}</b></td><td>${esc(x.jenjang)}</td><td>${esc(x.ptk_name)}</td><td>${esc(x.position_name)}</td><td><span class="kpill">${esc(WL[x.workflow_stage]||x.workflow_stage)}</span></td></tr>`).join('')}</tbody></table>`:'<div class="ks">Belum ada usulan PTK baru.</div>'}</div></div>`}catch(e){b.innerHTML=`<div class="card err">${esc(e.message)}</div>`}}
async function activities(force=false){if(!isLeader())return;const b=$('kadinActivities');b.innerHTML='<div class="card">Memuat...</div>';try{const d=await data(force),a=agg(d),today=new Date().toISOString().slice(0,10),past=d.acts.filter(x=>x.activity_date<today).slice(0,8);b.innerHTML=`${head('Kegiatan Bidang','Agenda pimpinan dan kegiatan bidang dalam tampilan ringkas.')}<div class="kdg">${card('📅','Agenda Mendatang',fmt(a.up.length),'Hari ini dan sesudahnya')}${card('✅','Kegiatan Tercatat',fmt(d.acts.length),'Total kegiatan pada SIMANTAB')}${card('🕘','Kegiatan Selesai',fmt(d.acts.filter(x=>x.activity_date<today).length),'Berdasarkan tanggal kegiatan')}<div class="kp k6"><h3>Agenda Mendatang</h3>${a.up.length?a.up.slice(0,8).map(x=>`<div class="ka" style="margin-bottom:8px"><b style="font-size:14px">${esc(x.activity_name)}</b>${esc(x.activity_date)} ${x.activity_time?'• '+esc(x.activity_time):''}<br>${esc(x.place||'-')}</div>`).join(''):'<div class="ks">Belum ada agenda.</div>'}</div><div class="kp k6"><h3>Kegiatan Terakhir</h3>${past.length?past.map(x=>`<div class="ka" style="margin-bottom:8px"><b style="font-size:14px">${esc(x.activity_name)}</b>${esc(x.activity_date)} • ${esc(x.place||'-')}</div>`).join(''):'<div class="ks">Belum ada riwayat.</div>'}</div></div>`}catch(e){b.innerHTML=`<div class="card err">${esc(e.message)}</div>`}}
window.__kadinRefresh=async()=>{cached=null;cacheAt=0;const id=document.querySelector('.section.active')?.id||'dashboard';if(id==='dashboard')await dash(true);if(isLeader()&&id==='kadinGtk')await gtk(true);if(isLeader()&&id==='kadinMonitoring')await monitoring(true);if(isLeader()&&id==='kadinPtk')await ptk(true);if(isLeader()&&id==='kadinActivities')await activities(true)};
const oldShow=window.showTab;window.showTab=async id=>{await oldShow(id);if(!isDashboardRole())return;if(isLeader())nav();if(id==='dashboard')await dash();if(isLeader()&&id==='kadinGtk')await gtk();if(isLeader()&&id==='kadinMonitoring')await monitoring();if(isLeader()&&id==='kadinPtk')await ptk();if(isLeader()&&id==='kadinActivities')await activities()};
const oldRefresh=window.refreshAll;window.refreshAll=async()=>{await oldRefresh();if(isDashboardRole())await dash(true)};
for(let i=0;i<300&&!window.__simantabProfile;i++)await wait(100);
if(isDashboardRole()){addStyle();if(isLeader()){sections();nav()}await dash(true);document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.tab==='dashboard'))}
})();
