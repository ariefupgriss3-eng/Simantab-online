/* SIMANTAB_GTK_REDISTRIBUTION_ANALYSIS_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<300&&(!window.__simantabSb||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),profile=()=>window.__simantabProfile||{};
if(!sb)return;

const ACCESS_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','PENGAWAS','KORWIL']);
const role=()=>String(profile().role||'').toUpperCase();
if(!ACCESS_ROLES.has(role()))return;

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const num=v=>Math.max(0,Number.parseInt(v,10)||0);
const pct=(a,b)=>b?Math.round(a/b*100):0;
const fmt=n=>Number(n||0).toLocaleString('id-ID');
const safe=s=>clean(s).replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'analisis_gtk';
const statusLabel=s=>({VERIFIED:'Diverifikasi',APPROVED:'Diverifikasi',SUBMITTED:'Diajukan',REVISION:'Perlu Perbaikan',DRAFT:'Draft',NOT_STARTED:'Belum Input'})[s]||s||'-';
const fixedLevel=()=>role()==='KASI_SD'?'SD':role()==='KASI_SMP'?'SMP':role()==='SUBKOOR_TK'?'PAUD':'';
let cache=null,cacheAt=0,currentModel=null,navObserver=null;

function levelOf(v){
 const x=String(v||'').toUpperCase();
 if(x.includes('SMP'))return'SMP';
 if(x==='SD'||x.includes('SEKOLAH DASAR'))return'SD';
 if(x.includes('TK')||x.includes('PAUD'))return'PAUD';
 return x||'-';
}
function canonicalCode(level,code,name){
 const l=levelOf(level),c=String(code||'').toUpperCase(),n=clean(name).toLowerCase();
 if(l==='PAUD'){
  if(c==='GURU_KELAS'||c==='GURU_TK')return'GURU_TK';
  if(['PENJAGA','PENJAGA_SEKOLAH','PENJAGA_SEKOLAJ'].includes(c))return'PENJAGA_SEKOLAH';
  if(['KEPALA_SEKOLAH','TAS'].includes(c))return c;
  return null;
 }
 if(l==='SD'){
  if(['GURU_BING','GURU_KODING_KA','GURU_MULOK'].includes(c))return null;
  if(['PENJAGA','PENJAGA_SEKOLAH','PENJAGA_SEKOLAJ','OLO','PRAMU_BAKTI_PENJAGA'].includes(c))return'PENJAGA_SEKOLAH';
 }
 if(l==='SMP'&&c==='GURU_KODING_KA')return null;
 if(c)return c;
 if(n.includes('kepala sekolah'))return'KEPALA_SEKOLAH';
 if(n.includes('tenaga administrasi')||n==='tas')return'TAS';
 if(n.includes('penjaga'))return'PENJAGA_SEKOLAH';
 return null;
}
function positionLabel(code,name,level){
 const map={
  KEPALA_SEKOLAH:'Kepala Sekolah',GURU_KELAS:'Guru Kelas',GURU_TK:'Guru Kelas TK/PAUD',
  GURU_PAI:'Guru Pendidikan Agama dan Budi Pekerti',GURU_PJOK:'Guru PJOK',
  GURU_PPKN:'Guru Pendidikan Pancasila',GURU_BI:'Guru Bahasa Indonesia',
  GURU_MTK:'Guru Matematika',GURU_IPA:'Guru IPA',GURU_IPS:'Guru IPS',
  GURU_BING:'Guru Bahasa Inggris',GURU_INFORMATIKA:'Guru Informatika',
  GURU_SENI_PRAKARYA:'Guru Seni/Budaya/Prakarya',GURU_BK:'Guru BK',
  GURU_MULOK:'Guru Muatan Lokal',TAS:'Tenaga Administrasi Sekolah',PENJAGA_SEKOLAH:'Penjaga Sekolah'
 };
 return map[code]||clean(name)||code||'-';
}
function isLocalManual(code){return['TAS','PENJAGA_SEKOLAH','GURU_MULOK'].includes(String(code||'').toUpperCase())}
function roleScopeSchool(s){
 const lvl=levelOf(s.jenjang||s.bentuk_pendidikan);
 if(role()==='KASI_SD')return lvl==='SD';
 if(role()==='KASI_SMP')return lvl==='SMP';
 if(role()==='SUBKOOR_TK')return lvl==='PAUD';
 return true;
}

function addStyle(){
 if($('gtkRedistributionStyle'))return;
 const st=document.createElement('style');st.id='gtkRedistributionStyle';
 st.textContent=
 '.gar-wrap{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}'+
 '.gar-head{grid-column:span 12;background:linear-gradient(135deg,#0f3f76,#1767b3);color:#fff;border-radius:18px;padding:18px}.gar-head h2{margin:0;font-size:22px}.gar-head p{margin:6px 0 0;opacity:.92;line-height:1.5}'+
 '.gar-card{grid-column:span 3;background:#fff;border:1px solid #dce7f0;border-radius:16px;padding:14px;box-shadow:0 6px 18px rgba(25,54,90,.055)}.gar-wide{grid-column:span 12}.gar-half{grid-column:span 6}'+
 '.gar-label{font-size:9px;font-weight:900;color:#71869a;text-transform:uppercase;letter-spacing:.05em}.gar-num{font-size:29px;font-weight:950;color:#0f3f76;margin:5px 0}.gar-small{font-size:10px;color:#647b8f;line-height:1.5}'+
 '.gar-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.gar-filters label{font-size:10px;font-weight:850;color:#53697d}.gar-filters select{width:100%;margin-top:4px;padding:9px 10px;border:1px solid #cfdae5;border-radius:10px;background:#fff}'+
 '.gar-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.gar-btn{border:0;border-radius:10px;padding:9px 12px;font-weight:850;cursor:pointer;background:#0f3f76;color:#fff}.gar-btn.soft{background:#edf5ff;color:#0f3f76;border:1px solid #c9dff3}.gar-btn.green{background:#16784d}'+
 '.gar-note{grid-column:span 12;padding:11px 13px;border-radius:12px;background:#f7fbff;border:1px solid #d8e8f6;font-size:10px;color:#496176;line-height:1.55}.gar-warn{background:#fff7e8;border-color:#f1d69a;color:#7b5200}'+
 '.gar-table-wrap{overflow:auto;max-height:520px;border:1px solid #e3ebf2;border-radius:12px}.gar-table{width:100%;border-collapse:collapse;font-size:10px}.gar-table th,.gar-table td{padding:8px;border-bottom:1px solid #e6edf3;text-align:left;vertical-align:top}.gar-table th{font-size:9px;text-transform:uppercase;color:#6f8294;white-space:nowrap;background:#fafcfe;position:sticky;top:0;z-index:1}'+
 '.gar-pill{display:inline-block;padding:4px 7px;border-radius:999px;background:#edf5ff;color:#175ea7;font-size:8px;font-weight:900}.gar-pill.green{background:#e9f8ef;color:#16804f}.gar-pill.orange{background:#fff4dd;color:#8a5b00}.gar-pill.red{background:#ffefec;color:#b42318}'+
 '.gar-bar{height:7px;background:#edf2f7;border-radius:99px;overflow:hidden;margin-top:6px}.gar-bar i{display:block;height:100%;background:#1767b3;border-radius:99px}'+
 '@media(max-width:980px){.gar-card{grid-column:span 6}.gar-half{grid-column:span 12}}@media(max-width:620px){.gar-card{grid-column:span 12}.gar-filters{grid-template-columns:1fr}.gar-head h2{font-size:19px}}';
 document.head.appendChild(st);
}
function ensureSection(){
 let sec=$('gtkRedistributionAnalysis');
 if(sec)return sec;
 const main=document.querySelector('main.content');if(!main)return null;
 sec=document.createElement('section');sec.id='gtkRedistributionAnalysis';sec.className='section';
 sec.innerHTML='<div id="gtkRedistributionBody"><div class="card empty">Memuat analisis redistribusi GTK…</div></div>';
 main.insertBefore(sec,main.querySelector('.footer'));
 return sec;
}
function ensureNav(){
 const nav=$('nav');if(!nav)return;
 let b=nav.querySelector('.navbtn[data-tab="gtkRedistributionAnalysis"]');if(b)return;
 b=document.createElement('button');b.className='navbtn';b.dataset.tab='gtkRedistributionAnalysis';
 b.innerHTML='<span class="ico">⇄</span>Analisis Redistribusi';
 b.onclick=e=>{e.preventDefault();window.openGtkRedistributionAnalysis?.()};
 const needs=nav.querySelector('.navbtn[data-tab="needs"]');
 if(needs&&needs.nextSibling)nav.insertBefore(b,needs.nextSibling);
 else if(needs)nav.appendChild(b);
 else{
  const account=[...nav.querySelectorAll('.navhead')].find(x=>/akun/i.test(x.textContent||''));
  if(account)nav.insertBefore(b,account);else nav.appendChild(b);
 }
}
function activate(){
 ensureSection();ensureNav();
 document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active',x.id==='gtkRedistributionAnalysis'));
 document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.tab==='gtkRedistributionAnalysis'));
 $('sidebar')?.classList.remove('open');
 render(true);
}
window.openGtkRedistributionAnalysis=activate;

async function fetchData(force=false){
 if(cache&&!force&&Date.now()-cacheAt<45000)return cache;
 const [schoolsQ,needsQ,wfQ]=await Promise.all([
  sb.from('school_master').select('npsn,school_name,school_status,jenjang,bentuk_pendidikan,kecamatan,rombel,is_active').eq('is_active',true).eq('school_status','NEGERI').order('school_name'),
  sb.from('school_gtk_needs').select('school_npsn,school_name,school_level,job_code,position_name,abk,pns,pppk,pppk_pw,non_asn_before_2024,non_asn_after_2024,asn_total,non_asn_total,abk_engine_version').order('school_name'),
  sb.from('school_gtk_needs_workflow').select('school_npsn,status,submitted_at,verified_at,updated_at')
 ]);
 const err=schoolsQ.error||needsQ.error||wfQ.error;if(err)throw err;
 let schools=(schoolsQ.data||[]).filter(roleScopeSchool);
 const needs=needsQ.data||[],wf=wfQ.data||[];
 if(['PENGAWAS','KORWIL'].includes(role())){
  const readable=new Set(needs.map(x=>x.school_npsn));
  schools=schools.filter(s=>readable.has(s.npsn));
 }
 cache={schools,needs,wf};cacheAt=Date.now();return cache;
}
function statusMap(data){return new Map(data.wf.map(x=>[x.school_npsn,String(x.status||'NOT_STARTED').toUpperCase()]))}
function rowModel(raw,school){
 const level=levelOf(school?.jenjang||school?.bentuk_pendidikan||raw.school_level);
 const code=canonicalCode(level,raw.job_code,raw.position_name);if(!code)return null;
 const abk=num(raw.abk),asn=raw.asn_total==null?num(raw.pns)+num(raw.pppk)+num(raw.pppk_pw):num(raw.asn_total);
 const non=raw.non_asn_total==null?num(raw.non_asn_before_2024)+num(raw.non_asn_after_2024):num(raw.non_asn_total);
 return{
  school_npsn:raw.school_npsn,school_name:school?.school_name||raw.school_name||'-',
  district:school?.kecamatan||'-',level,code,label:positionLabel(code,raw.position_name,level),
  key:level+'|'+code,abk,asn,non,gap:Math.max(0,abk-asn),gapData:Math.max(0,abk-asn-non),
  surplus:Math.max(0,asn-abk),localManual:isLocalManual(code),engine:raw.abk_engine_version||''
 };
}
function filtersBase(data){
 const fixed=fixedLevel(),level=$('garLevel')?.value||fixed||'ALL',district=$('garDistrict')?.value||'ALL',dataStatus=$('garStatus')?.value||'VERIFIED';
 return{level:fixed||level,district,dataStatus};
}
function buildRedistribution(rows){
 const donors=rows.filter(x=>x.surplus>0&&x.code!=='KEPALA_SEKOLAH').map(x=>({...x,remaining:x.surplus}));
 const deficits=rows.filter(x=>x.gap>0&&x.code!=='KEPALA_SEKOLAH').map(x=>({...x,remaining:x.gap}))
  .sort((a,b)=>String(a.district).localeCompare(String(b.district),'id')||b.gap-a.gap||String(a.school_name).localeCompare(String(b.school_name),'id'));
 const pairs=[];let sameDistrictCovered=0,crossDistrictCovered=0;
 for(const d of deficits){
  const same=donors.filter(x=>x.key===d.key&&x.remaining>0&&x.school_npsn!==d.school_npsn&&x.district===d.district).sort((a,b)=>b.remaining-a.remaining);
  const cross=donors.filter(x=>x.key===d.key&&x.remaining>0&&x.school_npsn!==d.school_npsn&&x.district!==d.district).sort((a,b)=>b.remaining-a.remaining);
  for(const donor of [...same,...cross]){
   if(d.remaining<=0)break;
   const qty=Math.min(d.remaining,donor.remaining);if(qty<=0)continue;
   const within=donor.district===d.district;
   pairs.push({level:d.level,code:d.code,label:d.label,qty,donorSchool:donor.school_name,donorNpsn:donor.school_npsn,donorDistrict:donor.district,
    targetSchool:d.school_name,targetNpsn:d.school_npsn,targetDistrict:d.district,priority:within?'Dalam kecamatan':'Lintas kecamatan'});
   donor.remaining-=qty;d.remaining-=qty;if(within)sameDistrictCovered+=qty;else crossDistrictCovered+=qty;
  }
 }
 const totalGap=rows.reduce((n,x)=>n+x.gap,0),totalSurplus=rows.reduce((n,x)=>n+x.surplus,0);
 return{pairs,sameDistrictCovered,crossDistrictCovered,covered:sameDistrictCovered+crossDistrictCovered,
  uncovered:Math.max(0,totalGap-sameDistrictCovered-crossDistrictCovered),totalGap,totalSurplus};
}
function summarizePositions(rows){
 const m=new Map;
 for(const r of rows){
  if(!m.has(r.key))m.set(r.key,{level:r.level,code:r.code,label:r.label,gap:0,gapData:0,surplus:0,shortSchools:new Set,surplusSchools:new Set,localManual:r.localManual});
  const x=m.get(r.key);x.gap+=r.gap;x.gapData+=r.gapData;x.surplus+=r.surplus;if(r.gap)x.shortSchools.add(r.school_npsn);if(r.surplus)x.surplusSchools.add(r.school_npsn);
 }
 return[...m.values()].filter(x=>x.gap||x.surplus).sort((a,b)=>b.gap-a.gap||b.surplus-a.surplus||a.label.localeCompare(b.label,'id'));
}
function summarizeDistricts(rows){
 const m=new Map;
 for(const r of rows){
  if(!m.has(r.district))m.set(r.district,{district:r.district,gap:0,gapData:0,surplus:0,schools:new Set,shortSchools:new Set,surplusSchools:new Set});
  const x=m.get(r.district);x.gap+=r.gap;x.gapData+=r.gapData;x.surplus+=r.surplus;x.schools.add(r.school_npsn);if(r.gap)x.shortSchools.add(r.school_npsn);if(r.surplus)x.surplusSchools.add(r.school_npsn);
 }
 return[...m.values()].sort((a,b)=>b.gap-a.gap||String(a.district).localeCompare(String(b.district),'id'));
}
function makeModel(data){
 const wf=statusMap(data),schoolBy=new Map(data.schools.map(s=>[s.npsn,s])),f=filtersBase(data);
 let schools=data.schools.filter(s=>(f.level==='ALL'||levelOf(s.jenjang||s.bentuk_pendidikan)===f.level)&&(f.district==='ALL'||String(s.kecamatan||'-')===f.district));
 const allowed=new Set(schools.map(s=>s.npsn));
 let raw=data.needs.filter(r=>allowed.has(r.school_npsn));
 if(f.dataStatus==='VERIFIED')raw=raw.filter(r=>['VERIFIED','APPROVED'].includes(wf.get(r.school_npsn)||''));
 const rows=raw.map(r=>rowModel(r,schoolBy.get(r.school_npsn))).filter(Boolean);
 const verifiedSchools=schools.filter(s=>['VERIFIED','APPROVED'].includes(wf.get(s.npsn)||'')).length;
 const inputSchools=new Set(raw.map(x=>x.school_npsn)).size;
 const totals=rows.reduce((o,x)=>{o.abk+=x.abk;o.asn+=x.asn;o.non+=x.non;o.gap+=x.gap;o.gapData+=x.gapData;o.surplus+=x.surplus;return o},{abk:0,asn:0,non:0,gap:0,gapData:0,surplus:0});
 const redistribution=buildRedistribution(rows),positions=summarizePositions(rows),districts=summarizeDistricts(rows);
 return{data,f,schools,rows,wf,verifiedSchools,inputSchools,totals,redistribution,positions,districts};
}
function levelOptions(data,current){
 const fixed=fixedLevel();if(fixed)return'<option value="'+fixed+'">'+(fixed==='PAUD'?'TK/PAUD':fixed)+'</option>';
 const levels=[...new Set(data.schools.map(s=>levelOf(s.jenjang||s.bentuk_pendidikan)).filter(Boolean))].sort();
 return'<option value="ALL">Semua Jenjang</option>'+levels.map(x=>'<option value="'+esc(x)+'" '+(current===x?'selected':'')+'>'+(x==='PAUD'?'TK/PAUD':esc(x))+'</option>').join('');
}
function districtOptions(data,current,level){
 let schools=data.schools;if(level&&level!=='ALL')schools=schools.filter(s=>levelOf(s.jenjang||s.bentuk_pendidikan)===level);
 const ds=[...new Set(schools.map(s=>s.kecamatan||'-'))].sort((a,b)=>String(a).localeCompare(String(b),'id'));
 return'<option value="ALL">Semua Kecamatan</option>'+ds.map(x=>'<option value="'+esc(x)+'" '+(current===x?'selected':'')+'>'+esc(x)+'</option>').join('');
}
function posRows(m){
 return m.positions.map((x,i)=>'<tr><td>'+(i+1)+'</td><td><span class="gar-pill">'+esc(x.level==='PAUD'?'TK/PAUD':x.level)+'</span></td><td><b>'+esc(x.label)+'</b><div class="gar-small">'+esc(x.code)+(x.localManual?' • parameter lokal/manual':' • regulatif')+'</div></td><td><b>'+fmt(x.gap)+'</b></td><td>'+fmt(x.gapData)+'</td><td>'+fmt(x.surplus)+'</td><td>'+x.shortSchools.size+'</td><td>'+x.surplusSchools.size+'</td></tr>').join('');
}
function districtRows(m){
 const max=Math.max(1,...m.districts.map(x=>x.gap));
 return m.districts.map((x,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+esc(x.district)+'</b><div class="gar-bar"><i style="width:'+Math.round(x.gap/max*100)+'%"></i></div></td><td>'+x.schools.size+'</td><td><b>'+fmt(x.gap)+'</b></td><td>'+fmt(x.gapData)+'</td><td>'+fmt(x.surplus)+'</td><td>'+x.shortSchools.size+'</td><td>'+x.surplusSchools.size+'</td></tr>').join('');
}
function candidateRows(m){
 return m.redistribution.pairs.map((x,i)=>'<tr><td>'+(i+1)+'</td><td><span class="gar-pill '+(x.priority==='Dalam kecamatan'?'green':'orange')+'">'+esc(x.priority)+'</span></td><td><b>'+esc(x.label)+'</b><div class="gar-small">'+esc(x.level==='PAUD'?'TK/PAUD':x.level)+'</div></td><td><b>'+esc(x.donorSchool)+'</b><div class="gar-small">'+esc(x.donorNpsn)+' • '+esc(x.donorDistrict)+'</div></td><td>→</td><td><b>'+esc(x.targetSchool)+'</b><div class="gar-small">'+esc(x.targetNpsn)+' • '+esc(x.targetDistrict)+'</div></td><td><b>'+fmt(x.qty)+'</b></td></tr>').join('');
}
function renderHtml(m){
 const official=m.f.dataStatus==='VERIFIED',coverage=pct(m.verifiedSchools,m.schools.length);
 const roleNote=['PENGAWAS','KORWIL'].includes(role())?'Cakupan Pengawas mengikuti data sekolah yang dapat dibaca oleh hak akses akun.':'Cakupan sesuai kewenangan jenjang akun.';
 return'<div class="gar-wrap">'+
  '<div class="gar-head"><h2>⇄ Analisis Kebutuhan & Redistribusi GTK</h2><p>Analisis deterministik berbasis ABK Regulatif. Surplus hanya dipasangkan dengan kekurangan pada <b>jenjang dan jabatan yang sama</b>; prioritas pertama dalam kecamatan.</p></div>'+
  '<div class="gar-note '+(official?'':'gar-warn')+'"><b>'+(official?'Basis resmi: data sekolah yang sudah diverifikasi.':'Mode simulasi: termasuk data yang belum diverifikasi.')+'</b><br>'+esc(roleNote)+' Indikasi redistribusi bukan keputusan mutasi; verifikasi individu, kompetensi, status kepegawaian, kebutuhan layanan, jarak, dan kondisi sekolah tetap diperlukan.</div>'+
  '<div class="gar-card gar-wide"><div class="gar-filters"><label>Jenjang<select id="garLevel" '+(fixedLevel()?'disabled':'')+'>'+levelOptions(m.data,m.f.level)+'</select></label><label>Kecamatan<select id="garDistrict">'+districtOptions(m.data,m.f.district,m.f.level)+'</select></label><label>Status Data<select id="garStatus"><option value="VERIFIED" '+(m.f.dataStatus==='VERIFIED'?'selected':'')+'>Hanya Diverifikasi</option><option value="ALL" '+(m.f.dataStatus==='ALL'?'selected':'')+'>Semua Data Input (Simulasi)</option></select></label></div><div class="gar-actions"><button class="gar-btn" id="garRefresh">↻ Refresh Data</button><button class="gar-btn soft" id="garCsv">Unduh CSV</button><button class="gar-btn green" id="garPdf">Unduh PDF</button></div></div>'+
  '<div class="gar-card"><div class="gar-label">Sekolah pada Cakupan</div><div class="gar-num">'+fmt(m.schools.length)+'</div><div class="gar-small">Terverifikasi '+fmt(m.verifiedSchools)+' • cakupan '+coverage+'%</div></div>'+
  '<div class="gar-card"><div class="gar-label">Gap Riil</div><div class="gar-num">'+fmt(m.totals.gap)+'</div><div class="gar-small">Σ max(ABK − ASN, 0) per jabatan</div></div>'+
  '<div class="gar-card"><div class="gar-label">Gap Data</div><div class="gar-num">'+fmt(m.totals.gapData)+'</div><div class="gar-small">Σ max(ABK − ASN − Non-ASN, 0)</div></div>'+
  '<div class="gar-card"><div class="gar-label">Surplus ASN</div><div class="gar-num">'+fmt(m.totals.surplus)+'</div><div class="gar-small">Σ max(ASN − ABK, 0) per jabatan</div></div>'+
  '<div class="gar-card"><div class="gar-label">Potensi Dalam Kecamatan</div><div class="gar-num">'+fmt(m.redistribution.sameDistrictCovered)+'</div><div class="gar-small">Kebutuhan yang berpotensi ditutup donor satu kecamatan</div></div>'+
  '<div class="gar-card"><div class="gar-label">Potensi Lintas Kecamatan</div><div class="gar-num">'+fmt(m.redistribution.crossDistrictCovered)+'</div><div class="gar-small">Perlu kajian jarak dan kelayakan lapangan</div></div>'+
  '<div class="gar-card"><div class="gar-label">Sisa Kekurangan</div><div class="gar-num">'+fmt(m.redistribution.uncovered)+'</div><div class="gar-small">Belum dapat ditutup oleh surplus ASN pada data ini</div></div>'+
  '<div class="gar-card"><div class="gar-label">Pasangan Indikatif</div><div class="gar-num">'+fmt(m.redistribution.pairs.length)+'</div><div class="gar-small">Donor → penerima, bukan keputusan mutasi</div></div>'+
  '<div class="gar-card gar-half"><div class="gar-label">Kekurangan & Surplus per Jabatan</div><h3 style="margin:5px 0 10px;color:#0f3f76">Peta Jabatan/Mapel</h3><div class="gar-table-wrap"><table class="gar-table"><thead><tr><th>No</th><th>Jenjang</th><th>Jabatan/Mapel</th><th>Gap Riil</th><th>Gap Data</th><th>Surplus ASN</th><th>Sekolah Kurang</th><th>Sekolah Surplus</th></tr></thead><tbody>'+(posRows(m)||'<tr><td colspan="8">Belum ada gap/surplus pada filter ini.</td></tr>')+'</tbody></table></div></div>'+
  '<div class="gar-card gar-half"><div class="gar-label">Sebaran Kecamatan</div><h3 style="margin:5px 0 10px;color:#0f3f76">Peta Kebutuhan Wilayah</h3><div class="gar-table-wrap"><table class="gar-table"><thead><tr><th>No</th><th>Kecamatan</th><th>Sekolah</th><th>Gap Riil</th><th>Gap Data</th><th>Surplus</th><th>Sekolah Kurang</th><th>Sekolah Surplus</th></tr></thead><tbody>'+(districtRows(m)||'<tr><td colspan="8">Belum ada data pada filter ini.</td></tr>')+'</tbody></table></div></div>'+
  '<div class="gar-card gar-wide"><div class="gar-label">Indikasi Redistribusi</div><h3 style="margin:5px 0 4px;color:#0f3f76">Kandidat Donor → Penerima</h3><div class="gar-small" style="margin-bottom:10px">Mesin hanya memasangkan surplus ASN dengan kekurangan pada kode jabatan dan jenjang yang sama. Kepala Sekolah tidak dipasangkan otomatis karena mekanisme penugasannya berbeda.</div><div class="gar-table-wrap"><table class="gar-table"><thead><tr><th>No</th><th>Prioritas</th><th>Jabatan</th><th>Sekolah Donor</th><th></th><th>Sekolah Penerima</th><th>Jumlah</th></tr></thead><tbody>'+(candidateRows(m)||'<tr><td colspan="7">Belum ada pasangan redistribusi yang dapat dibentuk dari data dan filter ini.</td></tr>')+'</tbody></table></div></div>'+
 '</div>';
}
function csvCell(v){const s=String(v??'');return'"'+s.replaceAll('"','""')+'"'}
function downloadCsv(m){
 const lines=[['ANALISIS KEBUTUHAN DAN REDISTRIBUSI GTK'],['Tanggal',new Date().toLocaleString('id-ID')],['Jenjang',m.f.level],['Kecamatan',m.f.district],['Status Data',m.f.dataStatus],[],['RINGKASAN'],['Sekolah Cakupan',m.schools.length],['Sekolah Terverifikasi',m.verifiedSchools],['Gap Riil',m.totals.gap],['Gap Data',m.totals.gapData],['Surplus ASN',m.totals.surplus],['Potensi Dalam Kecamatan',m.redistribution.sameDistrictCovered],['Potensi Lintas Kecamatan',m.redistribution.crossDistrictCovered],['Sisa Kekurangan',m.redistribution.uncovered],[],['PER JABATAN'],['Jenjang','Kode','Jabatan','Gap Riil','Gap Data','Surplus ASN','Sekolah Kurang','Sekolah Surplus']];
 m.positions.forEach(x=>lines.push([x.level,x.code,x.label,x.gap,x.gapData,x.surplus,x.shortSchools.size,x.surplusSchools.size]));
 lines.push([],['INDIKASI REDISTRIBUSI'],['Prioritas','Jenjang','Jabatan','Donor','NPSN Donor','Kecamatan Donor','Penerima','NPSN Penerima','Kecamatan Penerima','Jumlah']);
 m.redistribution.pairs.forEach(x=>lines.push([x.priority,x.level,x.label,x.donorSchool,x.donorNpsn,x.donorDistrict,x.targetSchool,x.targetNpsn,x.targetDistrict,x.qty]));
 const blob=new Blob(['\ufeff'+lines.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='analisis_redistribusi_gtk_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function downloadPdf(m){
 const JsPDF=window.jspdf?.jsPDF;if(!JsPDF){window.print();return}
 const doc=new JsPDF({orientation:'landscape',unit:'mm',format:'a4'});
 doc.setFontSize(15);doc.text('Analisis Kebutuhan & Redistribusi GTK',14,14);
 doc.setFontSize(9);doc.text('SIMANTAB Online • '+new Date().toLocaleString('id-ID'),14,20);
 doc.setFontSize(8);doc.text('Filter: '+(m.f.level==='ALL'?'Semua Jenjang':m.f.level)+' • '+(m.f.district==='ALL'?'Semua Kecamatan':m.f.district)+' • '+(m.f.dataStatus==='VERIFIED'?'Data Diverifikasi':'Semua Data Input'),14,25);
 doc.autoTable({startY:30,head:[['Sekolah','Terverifikasi','Gap Riil','Gap Data','Surplus ASN','Potensi Dalam Kec.','Potensi Lintas Kec.','Sisa']],body:[[m.schools.length,m.verifiedSchools,m.totals.gap,m.totals.gapData,m.totals.surplus,m.redistribution.sameDistrictCovered,m.redistribution.crossDistrictCovered,m.redistribution.uncovered]],styles:{fontSize:8}});
 let y=(doc.lastAutoTable?.finalY||40)+6;
 doc.setFontSize(10);doc.text('Peta Jabatan/Mapel',14,y);
 doc.autoTable({startY:y+3,head:[['Jenjang','Jabatan/Mapel','Gap Riil','Gap Data','Surplus ASN','Sekolah Kurang','Sekolah Surplus']],body:m.positions.map(x=>[x.level,x.label,x.gap,x.gapData,x.surplus,x.shortSchools.size,x.surplusSchools.size]),styles:{fontSize:7},headStyles:{fontSize:7}});
 y=(doc.lastAutoTable?.finalY||y+20)+6;
 if(y>175){doc.addPage();y=14}
 doc.setFontSize(10);doc.text('Indikasi Redistribusi Donor → Penerima',14,y);
 doc.autoTable({startY:y+3,head:[['Prioritas','Jenjang','Jabatan','Donor','Kec. Donor','Penerima','Kec. Penerima','Jumlah']],body:m.redistribution.pairs.map(x=>[x.priority,x.level,x.label,x.donorSchool,x.donorDistrict,x.targetSchool,x.targetDistrict,x.qty]),styles:{fontSize:6.5},headStyles:{fontSize:6.5}});
 doc.setFontSize(7);doc.text('Catatan: indikasi redistribusi bukan keputusan mutasi; verifikasi individu, kompetensi, status kepegawaian, jarak, dan kebutuhan layanan tetap diperlukan.',14,200);
 doc.save('analisis_redistribusi_gtk_'+new Date().toISOString().slice(0,10)+'.pdf');
}
function bind(m){
 const rerender=()=>render(false);
 $('garLevel')?.addEventListener('change',()=>{const d=$('garDistrict');if(d)d.value='ALL';rerender()});
 $('garDistrict')?.addEventListener('change',rerender);
 $('garStatus')?.addEventListener('change',rerender);
 $('garRefresh')?.addEventListener('click',()=>{cache=null;cacheAt=0;render(true)});
 $('garCsv')?.addEventListener('click',()=>currentModel&&downloadCsv(currentModel));
 $('garPdf')?.addEventListener('click',()=>currentModel&&downloadPdf(currentModel));
}
async function render(force=false){
 const body=$('gtkRedistributionBody')||ensureSection()?.querySelector('#gtkRedistributionBody');if(!body)return;
 addStyle();ensureNav();body.innerHTML='<div class="card empty">Menghitung kebutuhan, surplus, dan kandidat redistribusi…</div>';
 try{const data=await fetchData(force),m=makeModel(data);currentModel=m;body.innerHTML=renderHtml(m);bind(m)}
 catch(e){console.error('GTK redistribution analysis',e);body.innerHTML='<div class="card"><div class="gar-note gar-warn"><b>Analisis redistribusi belum dapat dimuat.</b><br>'+esc(e?.message||e)+'</div></div>'}
}
function install(){
 addStyle();ensureSection();ensureNav();
 if(navObserver)return;
 navObserver=new MutationObserver(()=>setTimeout(ensureNav,0));const nav=$('nav');if(nav)navObserver.observe(nav,{childList:true,subtree:false});
 for(const ms of [100,350,900,1600])setTimeout(ensureNav,ms);
}
install();
})();