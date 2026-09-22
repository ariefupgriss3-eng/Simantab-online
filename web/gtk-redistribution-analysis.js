/* SIMANTAB_GTK_REDISTRIBUTION_ANALYSIS_V5 */
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
const SCORE_WEIGHT={need:40,service:20,donor:20,proximity:20};
const CLASS_CAPACITY={PAUD:15,SD:28,SMP:32};
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number(v)||0));
const round1=v=>Math.round((Number(v)||0)*10)/10;
const LOCATION_EDIT_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
const canEditLocation=()=>LOCATION_EDIT_ROLES.has(role());
const SD_STUDY={
 title:'Kajian Kebijakan Penataan dan Potensi Penggabungan SD Negeri Kabupaten Batang',
 version:'V2',date:'13 September 2026',studentCutoff:'11–13 September 2026',
 baselineSchools:445,baselineStudents:58670,low90:137,
 buckets:[['≤60',44],['61–90',93],['91–120',87],['>120',221]],
 rsdm:{abk:5801,asn:4280,displayGap:-1522,cutoff:'30 Juni 2025'},
 legalGate:[
  ['L1','Evaluasi satuan pendidikan menunjukkan ketidakmampuan menyelenggarakan pembelajaran','Belum — perlu dokumen evaluasi'],
  ['L2','SD berada pada satu lokasi yang sama','Sebagian/indikatif — perlu survei lapangan'],
  ['L3','Persetujuan dan rekomendasi Pemerintah Desa','Belum'],
  ['L4','Audiensi masyarakat','Belum'],
  ['L5','Studi kelayakan Dinas menyatakan layak','Belum'],
  ['L6','Bukan satu-satunya SD dalam desa','Perlu validasi seluruh SD aktif negeri/swasta']
 ],
 clusters:[
  {district:'Subah',label:'SDN Gondang 03 + SDN Gondang 04',schools:[{name:'GONDANG 03',students:48},{name:'GONDANG 04',students:83}],studyDistanceKm:0.26,access:'Keduanya berada di Dukuh Temanggal; ukur rute aktual dan sebaran rumah murid.'},
  {district:'Reban',label:'SDN Tambakboyo 01 + SDN Tambakboyo 02',schools:[{name:'TAMBAKBOYO 01',students:42},{name:'TAMBAKBOYO 02',students:54}],studyDistanceKm:0.31,access:'Alamat sama-sama Tambakboyo; verifikasi rute, keselamatan, dan kapasitas sekolah penerima.'},
  {district:'Limpung',label:'SDN Dlisen 01 + SDN Dlisen 02',schools:[{name:'DLISEN 01',students:45},{name:'DLISEN 02',students:65}],studyDistanceKm:0.51,access:'Keduanya di kawasan Gunung Tumpeng; koordinat publik perlu direkonsiliasi.'},
  {district:'Reban',label:'SDN Padomasan 01 + SDN Padomasan 02',schools:[{name:'PADOMASAN 01',students:44},{name:'PADOMASAN 02',students:61}],studyDistanceKm:0.52,access:'Satu desa tetapi koridor jalan berbeda; makna “satu lokasi yang sama” wajib diverifikasi.'}
 ]
};
const toRad=v=>Number(v)*Math.PI/180;
function hasCoord(s){return Number.isFinite(Number(s?.latitude))&&Number.isFinite(Number(s?.longitude))}
function haversineKm(a,b){
 if(!hasCoord(a)||!hasCoord(b))return null;
 const lat1=Number(a.latitude),lon1=Number(a.longitude),lat2=Number(b.latitude),lon2=Number(b.longitude);
 const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
 const q=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
}
function parseCoordinates(input){
 const raw=String(input||'').trim();if(!raw)return null;
 let m=raw.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
 if(!m)m=raw.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
 if(!m)m=raw.match(/[?&](?:q|query|ll)=(-?\d{1,2}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i);
 if(!m){
  const a=raw.match(/!3d(-?\d{1,2}(?:\.\d+)?)/),b=raw.match(/!4d(-?\d{1,3}(?:\.\d+)?)/);
  if(a&&b)m=[null,a[1],b[1]];
 }
 if(!m)return null;
 const latitude=Number(m[1]),longitude=Number(m[2]);
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<-90||latitude>90||longitude<-180||longitude>180)return null;
 return{latitude,longitude};
}
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
function normalizeSchoolName(v){
 return clean(v).toUpperCase().replace(/\bSD\s*NEGERI\b/g,'').replace(/\bSDN\b/g,'').replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function findStudySchool(data,spec,district){
 const key=normalizeSchoolName(spec.name),d=clean(district).toLowerCase();
 const pool=(data.schools||[]).filter(s=>levelOf(s.jenjang||s.bentuk_pendidikan)==='SD'&&clean(s.kecamatan).toLowerCase()===d);
 return pool.find(s=>normalizeSchoolName(s.school_name)===key)||pool.find(s=>normalizeSchoolName(s.school_name).includes(key))||null;
}
function buildStudyModel(data){
 const visible=!['KASI_SMP','SUBKOOR_TK'].includes(role());
 if(!visible)return{visible:false};
 const sdSchools=(data.schools||[]).filter(s=>levelOf(s.jenjang||s.bentuk_pendidikan)==='SD');
 const districtWide=['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD'].includes(role());
 const buckets={le60:0,b61_90:0,b91_120:0,gt120:0,le90:0};
 for(const s of sdSchools){const n=num(s.students);if(n<=60)buckets.le60++;else if(n<=90)buckets.b61_90++;else if(n<=120)buckets.b91_120++;else buckets.gt120++;if(n<=90)buckets.le90++}
 const wf=statusMap(data),schoolBy=new Map(sdSchools.map(s=>[s.npsn,s]));
 const allRows=(data.needs||[]).map(r=>rowModel(r,schoolBy.get(r.school_npsn))).filter(r=>r&&r.level==='SD');
 const clusters=SD_STUDY.clusters.map(base=>{
  const matches=base.schools.map(spec=>({spec,school:findStudySchool(data,spec,base.district)}));
  const found=matches.map(x=>x.school).filter(Boolean);
  const foundNpsn=new Set(found.map(x=>x.npsn));
  const bothFound=found.length===2;
  const bothVerified=bothFound&&found.every(s=>['VERIFIED','APPROVED'].includes(wf.get(s.npsn)||''));
  const rows=bothVerified?allRows.filter(r=>foundNpsn.has(r.school_npsn)):[];
  const metrics=bothVerified?rows.reduce((o,r)=>{o.abk+=r.abk;o.asn+=r.asn;o.gap+=r.gap;o.surplus+=r.surplus;return o},{abk:0,asn:0,gap:0,surplus:0}):null;
  const liveDistance=bothFound?haversineKm(found[0],found[1]):null;
  return{...base,matches,found,bothFound,bothVerified,metrics,liveDistance:liveDistance==null?null:round1(liveDistance)};
 });
 return{visible,sdSchools,districtWide,buckets,clusters,scopeLabel:districtWide?'Kabupaten':'Cakupan akun'};
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
 '.gar-study-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:10px 0}.gar-study-kpi{padding:10px;border:1px solid #dce7f0;border-radius:12px;background:#fbfdff}.gar-study-kpi b{display:block;font-size:18px;color:#0f3f76}.gar-study-kpi span{font-size:9px;color:#647b8f}.gar-study-title{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.gar-study-flag{display:inline-block;padding:5px 8px;border-radius:999px;background:#fff4dd;color:#805500;font-size:9px;font-weight:900}.gar-study-ok{background:#e9f8ef;color:#176f49}.gar-study-nd{color:#8a5b00;font-weight:800}.gar-study-source{font-size:9px;color:#71869a;line-height:1.45}'+
 '@media(max-width:980px){.gar-card{grid-column:span 6}.gar-half{grid-column:span 12}.gar-study-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.gar-card{grid-column:span 12}.gar-filters{grid-template-columns:1fr}.gar-head h2{font-size:19px}.gar-study-kpis{grid-template-columns:1fr}}';
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
  sb.from('school_master').select('npsn,school_name,school_status,jenjang,bentuk_pendidikan,kecamatan,students,rombel,is_active,latitude,longitude,maps_url,location_source,location_verified,location_verified_at').eq('is_active',true).eq('school_status','NEGERI').order('school_name'),
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
  students:num(school?.students),rombel:num(school?.rombel),studentsPerRombel:num(school?.rombel)>0?Number(school?.students||0)/Number(school?.rombel||1):0,latitude:school?.latitude==null?null:Number(school.latitude),longitude:school?.longitude==null?null:Number(school.longitude),mapsUrl:school?.maps_url||'',locationVerified:!!school?.location_verified,
  key:level+'|'+code,abk,asn,non,gap:Math.max(0,abk-asn),gapData:Math.max(0,abk-asn-non),
  surplus:Math.max(0,asn-abk),localManual:isLocalManual(code),engine:raw.abk_engine_version||''
 };
}
function filtersBase(data){
 const fixed=fixedLevel(),level=$('garLevel')?.value||fixed||'ALL',district=$('garDistrict')?.value||'ALL',dataStatus=$('garStatus')?.value||'VERIFIED';
 return{level:fixed||level,district,dataStatus};
}
function recipientNeedScore(r){
 const ratio=r.abk>0?r.gap/r.abk:(r.gap>0?1:0);
 return clamp(ratio*100);
}
function servicePressureScore(r){
 const cap=CLASS_CAPACITY[r.level]||32;
 return clamp((r.studentsPerRombel/cap)*100);
}
function donorSafetyScore(d,qty){
 const afterAsn=Math.max(0,d.asn-qty),remainingSurplus=Math.max(0,afterAsn-d.abk);
 if(afterAsn<d.abk)return 0;
 return clamp(70+Math.min(30,(remainingSurplus/Math.max(1,d.abk))*100));
}
function proximityMetric(donor,target){
 const km=haversineKm(donor,target);
 if(km!=null){
  const score=km<=5?100:km<=10?85:km<=20?65:km<=30?45:km<=40?30:15;
  return{score,km:round1(km),mode:'DISTANCE',label:'Jarak '+round1(km)+' km'};
 }
 const same=donor.district===target.district;
 return{score:same?75:35,km:null,mode:'DISTRICT_PROXY',label:same?'Proksi kecamatan sama':'Proksi beda kecamatan'};
}
function scorePair(donor,target,qty){
 const proximity=proximityMetric(donor,target);
 const components={
  need:recipientNeedScore(target),
  service:servicePressureScore(target),
  donor:donorSafetyScore(donor,qty),
  proximity:proximity.score
 };
 const score=round1(
  components.need*SCORE_WEIGHT.need/100+
  components.service*SCORE_WEIGHT.service/100+
  components.donor*SCORE_WEIGHT.donor/100+
  components.proximity*SCORE_WEIGHT.proximity/100
 );
 const tier=score>=80?'Sangat Prioritas':score>=65?'Prioritas':score>=50?'Pertimbangkan':'Verifikasi Lanjut';
 return{score,tier,components,distanceKm:proximity.km,distanceMode:proximity.mode,distanceBasis:proximity.label};
}
function recipientBasePriority(r){
 return recipientNeedScore(r)*0.67+servicePressureScore(r)*0.33;
}
function buildRedistribution(rows){
 const donors=rows.filter(x=>x.surplus>0&&x.code!=='KEPALA_SEKOLAH').map(x=>({...x,remaining:x.surplus}));
 const deficits=rows.filter(x=>x.gap>0&&x.code!=='KEPALA_SEKOLAH').map(x=>({...x,remaining:x.gap}))
   .sort((a,b)=>recipientBasePriority(b)-recipientBasePriority(a)||b.gap-a.gap||String(a.school_name).localeCompare(String(b.school_name),'id'));
 const pairs=[];let sameDistrictCovered=0,crossDistrictCovered=0;
 const allocate=(within)=>{
  for(const d of deficits){
   if(d.remaining<=0)continue;
   const candidates=donors.filter(x=>x.key===d.key&&x.remaining>0&&x.school_npsn!==d.school_npsn&&((x.district===d.district)===within))
     .sort((a,b)=>{
       const sa=scorePair(a,d,Math.min(d.remaining,a.remaining)).score,sb=scorePair(b,d,Math.min(d.remaining,b.remaining)).score;
       return sb-sa||b.remaining-a.remaining||String(a.school_name).localeCompare(String(b.school_name),'id');
     });
   for(const donor of candidates){
    if(d.remaining<=0)break;
    const qty=Math.min(d.remaining,donor.remaining);if(qty<=0)continue;
    const scored=scorePair(donor,d,qty);
    pairs.push({
      level:d.level,code:d.code,label:d.label,qty,
      donorSchool:donor.school_name,donorNpsn:donor.school_npsn,donorDistrict:donor.district,donorAbk:donor.abk,donorAsn:donor.asn,donorSurplusBefore:donor.remaining,
      targetSchool:d.school_name,targetNpsn:d.school_npsn,targetDistrict:d.district,targetAbk:d.abk,targetAsn:d.asn,targetGapBefore:d.remaining,
      targetStudents:d.students,targetRombel:d.rombel,targetStudentsPerRombel:d.studentsPerRombel,
      priority:within?'Dalam kecamatan':'Lintas kecamatan',
      score:scored.score,tier:scored.tier,components:scored.components,
      distanceKm:scored.distanceKm,distanceMode:scored.distanceMode,distanceBasis:scored.distanceBasis
    });
    donor.remaining-=qty;d.remaining-=qty;if(within)sameDistrictCovered+=qty;else crossDistrictCovered+=qty;
   }
  }
 };
 allocate(true);
 allocate(false);
 pairs.sort((a,b)=>b.score-a.score||(a.priority===b.priority?0:(a.priority==='Dalam kecamatan'?-1:1))||b.qty-a.qty||String(a.targetSchool).localeCompare(String(b.targetSchool),'id'));
 const totalGap=rows.reduce((n,x)=>n+x.gap,0),totalSurplus=rows.reduce((n,x)=>n+x.surplus,0);
 const highPriority=pairs.filter(x=>x.score>=65).length;
 const veryHighPriority=pairs.filter(x=>x.score>=80).length;
 const averageScore=pairs.length?round1(pairs.reduce((n,x)=>n+x.score,0)/pairs.length):0;
 return{pairs,sameDistrictCovered,crossDistrictCovered,covered:sameDistrictCovered+crossDistrictCovered,
  uncovered:Math.max(0,totalGap-sameDistrictCovered-crossDistrictCovered),totalGap,totalSurplus,highPriority,veryHighPriority,averageScore};
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
 const coordinateSchools=schools.filter(hasCoord).length,verifiedCoordinateSchools=schools.filter(s=>hasCoord(s)&&s.location_verified).length;
 const study=buildStudyModel(data);
 return{data,f,schools,rows,wf,verifiedSchools,inputSchools,totals,redistribution,positions,districts,coordinateSchools,verifiedCoordinateSchools,study};
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
 return m.redistribution.pairs.map((x,i)=>{
 const tierClass=x.score>=80?'green':x.score>=65?'green':x.score>=50?'orange':'red';
 const comp='Kekurangan '+round1(x.components.need)+' • Layanan '+round1(x.components.service)+' • Donor '+round1(x.components.donor)+' • Kedekatan '+round1(x.components.proximity);
 const pressure=round1(x.targetStudentsPerRombel);
 return '<tr><td>'+(i+1)+'</td><td><span class="gar-pill '+tierClass+'">'+esc(x.tier)+'</span><div class="gar-small"><b>Skor '+x.score+'</b>/100</div></td><td><span class="gar-pill '+(x.priority==='Dalam kecamatan'?'green':'orange')+'">'+esc(x.priority)+'</span><div class="gar-small">'+esc(x.distanceBasis)+'</div></td><td><b>'+esc(x.label)+'</b><div class="gar-small">'+esc(x.level==='PAUD'?'TK/PAUD':x.level)+'</div></td><td><b>'+esc(x.donorSchool)+'</b><div class="gar-small">'+esc(x.donorNpsn)+' • '+esc(x.donorDistrict)+'<br>ABK '+x.donorAbk+' • ASN '+x.donorAsn+'</div></td><td>→</td><td><b>'+esc(x.targetSchool)+'</b><div class="gar-small">'+esc(x.targetNpsn)+' • '+esc(x.targetDistrict)+'<br>'+fmt(x.targetStudents)+' siswa • '+fmt(x.targetRombel)+' rombel • '+pressure+' siswa/rombel</div></td><td><b>'+fmt(x.qty)+'</b><div class="gar-small">'+esc(comp)+'</div></td></tr>';
 }).join('');
}

function studyLegalRows(){
 return SD_STUDY.legalGate.map(x=>'<tr><td><b>'+esc(x[0])+'</b></td><td>'+esc(x[1])+'</td><td>'+esc(x[2])+'</td></tr>').join('');
}
function studyClusterRows(study){
 return study.clusters.map((x,i)=>{
  const baseline=x.schools.map(s=>fmt(s.students)).join(' + ')+' = '+fmt(x.schools.reduce((n,s)=>n+s.students,0));
  const current=x.bothFound?x.found.map(s=>fmt(num(s.students))).join(' + ')+' = '+fmt(x.found.reduce((n,s)=>n+num(s.students),0)):'Belum lengkap di master';
  const live=x.liveDistance==null?'Koordinat belum lengkap':x.liveDistance+' km (garis lurus)';
  const gtk=x.bothVerified?'2/2 sekolah terverifikasi':'Belum resmi ('+x.found.filter(s=>['VERIFIED','APPROVED'].includes((study.wf?.get?.(s.npsn)||''))).length+'/2 terverifikasi)';
  const abk=x.metrics?'ABK '+fmt(x.metrics.abk)+' • ASN '+fmt(x.metrics.asn):'<span class="gar-study-nd">ND</span>';
  const gap=x.metrics?'Gap '+fmt(x.metrics.gap)+' • Surplus berjalan '+fmt(x.metrics.surplus):'<span class="gar-study-nd">ND</span>';
  return'<tr><td>'+(i+1)+'</td><td><b>'+esc(x.label)+'</b><div class="gar-small">'+esc(x.access)+'</div></td><td>'+esc(x.district)+'</td><td>'+baseline+'</td><td>'+current+'</td><td>±'+String(x.studyDistanceKm).replace('.',',')+' km<div class="gar-small">indikatif kajian</div></td><td>'+esc(live)+'</td><td>'+gtk+'</td><td>'+abk+'</td><td>'+gap+'</td><td><span class="gar-study-nd">ND</span><div class="gar-small">Butuh murid per kelas I–VI, kapasitas ruang, dan linearitas.</div></td><td><span class="gar-pill orange">Studi kelayakan</span><div class="gar-small">Belum keputusan merger.</div></td></tr>';
 }).join('');
}
function studySection(m){
 const s=m.study;if(!s?.visible)return'';
 s.wf=m.wf;
 const currentCount=s.sdSchools.length,currentLow=s.buckets.le90;
 const mismatch=s.districtWide&&currentCount!==SD_STUDY.baselineSchools;
 return'<div id="garStudyPanel" class="gar-card gar-wide"><div class="gar-study-title"><div><div class="gar-label">INTEGRASI KAJIAN PENATAAN SD</div><h3 style="margin:5px 0 4px;color:#0f3f76">Penataan SD ↔ Redistribusi GTK</h3><div class="gar-small">Kajian V2 dipakai sebagai <b>decision-support</b>. Empat klaster Tahap I tetap objek studi kelayakan, bukan keputusan penggabungan. SIMANTAB <b>tidak menambah surplus guru dari skenario merger</b> sebelum legal gate terpenuhi dan ABK sesudah skenario dapat dihitung.</div></div><span class="gar-study-flag">'+esc(SD_STUDY.version)+' • '+esc(SD_STUDY.date)+'</span></div>'+
 '<div class="gar-study-kpis"><div class="gar-study-kpi"><span>Baseline kajian SD Negeri</span><b>'+fmt(SD_STUDY.baselineSchools)+'</b></div><div class="gar-study-kpi"><span>'+esc(s.scopeLabel)+' aktif di SIMANTAB</span><b>'+fmt(currentCount)+'</b></div><div class="gar-study-kpi"><span>Baseline ≤90 peserta didik</span><b>'+fmt(SD_STUDY.low90)+'</b></div><div class="gar-study-kpi"><span>'+esc(s.scopeLabel)+' ≤90 peserta didik</span><b>'+fmt(currentLow)+'</b></div><div class="gar-study-kpi"><span>Klaster Tahap I kajian</span><b>'+fmt(SD_STUDY.clusters.length)+'</b></div></div>'+
 (mismatch?'<div class="gar-note gar-warn"><b>Rekonsiliasi master data diperlukan.</b> Kajian memakai baseline 445 SD Negeri, sedangkan SIMANTAB saat ini membaca '+fmt(currentCount)+' pada cakupan kabupaten. Selisih harus ditelusuri berbasis NPSN/status aktif sebelum keputusan formal.</div>':'')+
 '<div class="gar-note"><b>Interlock redistribusi:</b> redistribusi reguler tetap memakai ABK dan ASN berjalan. Untuk skenario penggabungan, urutannya: legal/access/psikososial → kapasitas per kelas → ABK sesudah → surplus potensial → surplus redistributable → penempatan ke sekolah yang memiliki gap terverifikasi. Nilai pasca-merger ditampilkan <b>ND</b> sampai data prasyarat lengkap.</div>'+
 '<div class="gar-note"><b>Baseline R-SDM dalam dokumen kajian:</b> kebutuhan/ABK 5.801 guru • ASN 4.280 • selisih dashboard -1.522 • cut-off 30 Juni 2025. Angka ini ditampilkan sebagai baseline dokumen dan tidak menggantikan data SIMANTAB yang lebih mutakhir.</div>'+
 '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px"><div><div class="gar-label">LEGAL GATE PASAL 24</div><div class="gar-table-wrap" style="max-height:360px"><table class="gar-table"><thead><tr><th>Kode</th><th>Syarat</th><th>Status Kajian V2</th></tr></thead><tbody>'+studyLegalRows()+'</tbody></table></div></div><div><div class="gar-label">SCREENING KUANTITATIF</div><div class="gar-table-wrap" style="max-height:360px"><table class="gar-table"><thead><tr><th>Kategori</th><th>Baseline Kajian</th><th>'+esc(s.scopeLabel)+' SIMANTAB</th></tr></thead><tbody><tr><td>≤60</td><td>'+fmt(44)+'</td><td>'+fmt(s.buckets.le60)+'</td></tr><tr><td>61–90</td><td>'+fmt(93)+'</td><td>'+fmt(s.buckets.b61_90)+'</td></tr><tr><td>91–120</td><td>'+fmt(87)+'</td><td>'+fmt(s.buckets.b91_120)+'</td></tr><tr><td>&gt;120</td><td>'+fmt(221)+'</td><td>'+fmt(s.buckets.gt120)+'</td></tr></tbody></table></div><div class="gar-small" style="margin-top:7px">Kategori adalah alat screening, bukan syarat hukum penggabungan.</div></div></div>'+
 '<div style="margin-top:12px"><div class="gar-label">EMPAT KLASTER TAHAP I — TANPA PERINGKAT</div><div class="gar-table-wrap"><table class="gar-table"><thead><tr><th>No</th><th>Klaster</th><th>Kec.</th><th>PD Kajian</th><th>PD SIMANTAB</th><th>Jarak Kajian</th><th>Jarak SIMANTAB</th><th>Status GTK</th><th>ABK/ASN berjalan</th><th>Gap/Surplus berjalan</th><th>ABK sesudah skenario</th><th>Status</th></tr></thead><tbody>'+studyClusterRows(s)+'</tbody></table></div></div>'+
 '<div class="gar-study-source" style="margin-top:10px">Sumber internal: '+esc(SD_STUDY.title)+' — '+esc(SD_STUDY.version)+', '+esc(SD_STUDY.date)+'; cut-off peserta didik '+esc(SD_STUDY.studentCutoff)+'. Jarak kajian bersifat indikatif dan tidak sama dengan rute murid.</div></div>';
}
function renderHtml(m){
 const official=m.f.dataStatus==='VERIFIED',coverage=pct(m.verifiedSchools,m.schools.length);
 const roleNote=['PENGAWAS','KORWIL'].includes(role())?'Cakupan Pengawas mengikuti data sekolah yang dapat dibaca oleh hak akses akun.':'Cakupan sesuai kewenangan jenjang akun.';
 return'<div class="gar-wrap">'+
  '<div class="gar-head"><h2>⇄ Analisis Kebutuhan & Redistribusi GTK</h2><p>Analisis deterministik berbasis ABK Regulatif. Surplus hanya dipasangkan dengan kekurangan pada <b>jenjang dan jabatan yang sama</b>; prioritas pertama dalam kecamatan.</p></div>'+
  '<div class="gar-note '+(official?'':'gar-warn')+'"><b>'+(official?'Basis resmi: data sekolah yang sudah diverifikasi.':'Mode simulasi: termasuk data yang belum diverifikasi.')+'</b><br>'+esc(roleNote)+' Indikasi redistribusi bukan keputusan mutasi; verifikasi individu, kompetensi, status kepegawaian, kebutuhan layanan, jarak, dan kondisi sekolah tetap diperlukan.</div>'+
  '<div class="gar-card gar-wide"><div class="gar-filters"><label>Jenjang<select id="garLevel" '+(fixedLevel()?'disabled':'')+'>'+levelOptions(m.data,m.f.level)+'</select></label><label>Kecamatan<select id="garDistrict">'+districtOptions(m.data,m.f.district,m.f.level)+'</select></label><label>Status Data<select id="garStatus"><option value="VERIFIED" '+(m.f.dataStatus==='VERIFIED'?'selected':'')+'>Hanya Diverifikasi</option><option value="ALL" '+(m.f.dataStatus==='ALL'?'selected':'')+'>Semua Data Input (Simulasi)</option></select></label></div><div class="gar-actions"><button class="gar-btn" id="garRefresh">↻ Refresh Data</button><button class="gar-btn soft" id="garCsv">Unduh CSV</button><button class="gar-btn green" id="garPdf">Unduh PDF</button>'+(m.study?.visible?'<button class="gar-btn soft" id="garStudyFocus">📘 Buka Kajian Penataan SD</button>':'')+(canEditLocation()?'<button class="gar-btn soft" id="garLocations">📍 Kelola Lokasi Sekolah</button>':'')+'</div></div>'+
  studySection(m)+
  '<div class="gar-card"><div class="gar-label">Sekolah pada Cakupan</div><div class="gar-num">'+fmt(m.schools.length)+'</div><div class="gar-small">Terverifikasi '+fmt(m.verifiedSchools)+' • cakupan '+coverage+'%</div></div>'+
  '<div class="gar-card"><div class="gar-label">Gap Riil</div><div class="gar-num">'+fmt(m.totals.gap)+'</div><div class="gar-small">Σ max(ABK − ASN, 0) per jabatan</div></div>'+
  '<div class="gar-card"><div class="gar-label">Gap Data</div><div class="gar-num">'+fmt(m.totals.gapData)+'</div><div class="gar-small">Σ max(ABK − ASN − Non-ASN, 0)</div></div>'+
  '<div class="gar-card"><div class="gar-label">Surplus ASN</div><div class="gar-num">'+fmt(m.totals.surplus)+'</div><div class="gar-small">Σ max(ASN − ABK, 0) per jabatan</div></div>'+
  '<div class="gar-card"><div class="gar-label">Potensi Dalam Kecamatan</div><div class="gar-num">'+fmt(m.redistribution.sameDistrictCovered)+'</div><div class="gar-small">Kebutuhan yang berpotensi ditutup donor satu kecamatan</div></div>'+
  '<div class="gar-card"><div class="gar-label">Potensi Lintas Kecamatan</div><div class="gar-num">'+fmt(m.redistribution.crossDistrictCovered)+'</div><div class="gar-small">Perlu kajian jarak dan kelayakan lapangan</div></div>'+
  '<div class="gar-card"><div class="gar-label">Sisa Kekurangan</div><div class="gar-num">'+fmt(m.redistribution.uncovered)+'</div><div class="gar-small">Belum dapat ditutup oleh surplus ASN pada data ini</div></div>'+
  '<div class="gar-card"><div class="gar-label">Pasangan Indikatif</div><div class="gar-num">'+fmt(m.redistribution.pairs.length)+'</div><div class="gar-small">Donor → penerima, bukan keputusan mutasi</div></div>'+
  '<div class="gar-card"><div class="gar-label">Skor ≥65</div><div class="gar-num">'+fmt(m.redistribution.highPriority)+'</div><div class="gar-small">Prioritas/Sangat Prioritas • skor rata-rata '+m.redistribution.averageScore+'</div></div>'+
  '<div class="gar-card"><div class="gar-label">Koordinat Sekolah</div><div class="gar-num">'+fmt(m.coordinateSchools)+'/'+fmt(m.schools.length)+'</div><div class="gar-small">Terverifikasi '+fmt(m.verifiedCoordinateSchools)+' • '+pct(m.coordinateSchools,m.schools.length)+'% cakupan lokasi</div></div>'+
  '<div class="gar-card gar-wide"><div class="gar-note"><b>Formula Skor Prioritas 0–100:</b> Kekurangan penerima 40% + tekanan layanan siswa/rombel 20% + keamanan donor 20% + kedekatan 20%. Bila koordinat donor dan penerima tersedia, kedekatan memakai jarak Haversine: ≤5 km=100; ≤10 km=85; ≤20 km=65; ≤30 km=45; ≤40 km=30; >40 km=15. Jika koordinat belum lengkap, digunakan proksi kecamatan (sama=75; berbeda=35) dan diberi label sebagai proksi. Skor bukan keputusan mutasi.</div></div>'+
  '<div class="gar-card gar-half"><div class="gar-label">Kekurangan & Surplus per Jabatan</div><h3 style="margin:5px 0 10px;color:#0f3f76">Peta Jabatan/Mapel</h3><div class="gar-table-wrap"><table class="gar-table"><thead><tr><th>No</th><th>Jenjang</th><th>Jabatan/Mapel</th><th>Gap Riil</th><th>Gap Data</th><th>Surplus ASN</th><th>Sekolah Kurang</th><th>Sekolah Surplus</th></tr></thead><tbody>'+(posRows(m)||'<tr><td colspan="8">Belum ada gap/surplus pada filter ini.</td></tr>')+'</tbody></table></div></div>'+
  '<div class="gar-card gar-half"><div class="gar-label">Sebaran Kecamatan</div><h3 style="margin:5px 0 10px;color:#0f3f76">Peta Kebutuhan Wilayah</h3><div class="gar-table-wrap"><table class="gar-table"><thead><tr><th>No</th><th>Kecamatan</th><th>Sekolah</th><th>Gap Riil</th><th>Gap Data</th><th>Surplus</th><th>Sekolah Kurang</th><th>Sekolah Surplus</th></tr></thead><tbody>'+(districtRows(m)||'<tr><td colspan="8">Belum ada data pada filter ini.</td></tr>')+'</tbody></table></div></div>'+
  '<div class="gar-card gar-wide"><div class="gar-label">Indikasi Redistribusi</div><h3 style="margin:5px 0 4px;color:#0f3f76">Kandidat Donor → Penerima berdasarkan Skor Prioritas</h3><div class="gar-small" style="margin-bottom:10px">Mesin hanya memasangkan surplus ASN dengan kekurangan pada kode jabatan dan jenjang yang sama. Kepala Sekolah tidak dipasangkan otomatis. Urutan tabel berdasarkan skor tertinggi.</div><div class="gar-table-wrap"><table class="gar-table"><thead><tr><th>No</th><th>Skor</th><th>Wilayah</th><th>Jabatan</th><th>Sekolah Donor</th><th></th><th>Sekolah Penerima</th><th>Jumlah & Komponen</th></tr></thead><tbody>'+(candidateRows(m)||'<tr><td colspan="8">Belum ada pasangan redistribusi yang dapat dibentuk dari data dan filter ini.</td></tr>')+'</tbody></table></div></div>'+
 '</div>';
}
function csvCell(v){const s=String(v??'');return'"'+s.replaceAll('"','""')+'"'}
function downloadCsv(m){
 const lines=[['ANALISIS KEBUTUHAN DAN REDISTRIBUSI GTK'],['Tanggal',new Date().toLocaleString('id-ID')],['Jenjang',m.f.level],['Kecamatan',m.f.district],['Status Data',m.f.dataStatus],[],['RINGKASAN'],['Sekolah Cakupan',m.schools.length],['Sekolah Terverifikasi',m.verifiedSchools],['Gap Riil',m.totals.gap],['Gap Data',m.totals.gapData],['Surplus ASN',m.totals.surplus],['Potensi Dalam Kecamatan',m.redistribution.sameDistrictCovered],['Potensi Lintas Kecamatan',m.redistribution.crossDistrictCovered],['Sisa Kekurangan',m.redistribution.uncovered],[],['PER JABATAN'],['Jenjang','Kode','Jabatan','Gap Riil','Gap Data','Surplus ASN','Sekolah Kurang','Sekolah Surplus']];
 if(m.study?.visible){
  lines.push([],['KAJIAN PENATAAN SD V2'],['Dokumen',SD_STUDY.title],['Tanggal Kajian',SD_STUDY.date],['Baseline SD Negeri',SD_STUDY.baselineSchools],['Baseline ≤90 peserta didik',SD_STUDY.low90],['SD pada cakupan SIMANTAB',m.study.sdSchools.length],['SD ≤90 pada cakupan SIMANTAB',m.study.buckets.le90],['R-SDM baseline ABK',SD_STUDY.rsdm.abk],['R-SDM baseline ASN',SD_STUDY.rsdm.asn],['Selisih dashboard R-SDM',SD_STUDY.rsdm.displayGap],['Cut-off R-SDM',SD_STUDY.rsdm.cutoff],[],['KLASTER TAHAP I — STUDI KELAYAKAN, BUKAN KEPUTUSAN MERGER'],['Klaster','Kecamatan','PD Baseline Kajian','PD SIMANTAB','Jarak Kajian km','Jarak SIMANTAB km','Status GTK','ABK Berjalan','ASN Berjalan','Gap Berjalan','Surplus Berjalan','ABK Sesudah Skenario','Status']);
  m.study.clusters.forEach(x=>lines.push([x.label,x.district,x.schools.reduce((n,s)=>n+s.students,0),x.bothFound?x.found.reduce((n,s)=>n+num(s.students),0):'Belum lengkap',x.studyDistanceKm,x.liveDistance??'Belum ada',x.bothVerified?'2/2 terverifikasi':'Belum resmi',x.metrics?.abk??'ND',x.metrics?.asn??'ND',x.metrics?.gap??'ND',x.metrics?.surplus??'ND','ND — butuh data kelas I–VI/kapasitas/linearitas','Studi kelayakan; belum keputusan merger']));
 }
  m.positions.forEach(x=>lines.push([x.level,x.code,x.label,x.gap,x.gapData,x.surplus,x.shortSchools.size,x.surplusSchools.size]));
 lines.push([],['INDIKASI REDISTRIBUSI BERDASARKAN SKOR'],['Skor','Tier','Prioritas Wilayah','Jenjang','Jabatan','Donor','NPSN Donor','Kecamatan Donor','Penerima','NPSN Penerima','Kecamatan Penerima','Jumlah','Jarak KM','Basis Jarak','Skor Kekurangan','Skor Layanan','Skor Donor','Skor Kedekatan']);
 m.redistribution.pairs.forEach(x=>lines.push([x.score,x.tier,x.priority,x.level,x.label,x.donorSchool,x.donorNpsn,x.donorDistrict,x.targetSchool,x.targetNpsn,x.targetDistrict,x.qty,x.distanceKm??'',x.distanceBasis,round1(x.components.need),round1(x.components.service),round1(x.components.donor),round1(x.components.proximity)]));
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
 if(m.study?.visible){
  doc.setFontSize(10);doc.text('Kajian Penataan SD V2 — integrasi redistribusi',14,y);
  doc.setFontSize(7);doc.text('Klaster Tahap I adalah objek studi kelayakan; ABK/surplus pasca-merger tidak dihitung sebelum legal gate dan data kelas I–VI lengkap.',14,y+4);
  doc.autoTable({startY:y+7,head:[['Klaster','Kec.','PD Kajian','PD SIMANTAB','Jarak Kajian','Jarak SIMANTAB','GTK','ABK/ASN berjalan','ABK sesudah']],body:m.study.clusters.map(x=>[x.label,x.district,x.schools.reduce((n,s)=>n+s.students,0),x.bothFound?x.found.reduce((n,s)=>n+num(s.students),0):'Belum lengkap','±'+x.studyDistanceKm+' km',x.liveDistance==null?'Belum ada':x.liveDistance+' km',x.bothVerified?'2/2 terverifikasi':'Belum resmi',x.metrics?(x.metrics.abk+'/'+x.metrics.asn):'ND','ND']),styles:{fontSize:6},headStyles:{fontSize:6}});
  y=(doc.lastAutoTable?.finalY||y+25)+6;if(y>175){doc.addPage();y=14}
 }
 doc.setFontSize(10);doc.text('Peta Jabatan/Mapel',14,y);
 doc.autoTable({startY:y+3,head:[['Jenjang','Jabatan/Mapel','Gap Riil','Gap Data','Surplus ASN','Sekolah Kurang','Sekolah Surplus']],body:m.positions.map(x=>[x.level,x.label,x.gap,x.gapData,x.surplus,x.shortSchools.size,x.surplusSchools.size]),styles:{fontSize:7},headStyles:{fontSize:7}});
 y=(doc.lastAutoTable?.finalY||y+20)+6;
 if(y>175){doc.addPage();y=14}
 doc.setFontSize(10);doc.text('Indikasi Redistribusi Donor → Penerima',14,y);
 doc.autoTable({startY:y+3,head:[['Skor','Tier','Wilayah/Jarak','Jenjang','Jabatan','Donor','Penerima','Jumlah']],body:m.redistribution.pairs.map(x=>[x.score,x.tier,x.distanceBasis,x.level,x.label,x.donorSchool,x.targetSchool,x.qty]),styles:{fontSize:6.2},headStyles:{fontSize:6.2}});
 doc.setFontSize(7);doc.text('Catatan: indikasi redistribusi bukan keputusan mutasi; verifikasi individu, kompetensi, status kepegawaian, jarak, dan kebutuhan layanan tetap diperlukan.',14,200);
 doc.save('analisis_redistribusi_gtk_'+new Date().toISOString().slice(0,10)+'.pdf');
}
function schoolSearchUrl(s){
 return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((s.school_name||'')+' '+(s.kecamatan||'')+' Kabupaten Batang Jawa Tengah');
}
function locationOption(s){
 const ok=hasCoord(s),v=s.location_verified?' ✓':'';
 return '<option value="'+esc(s.npsn)+'">'+esc(s.school_name)+' — '+esc(s.kecamatan||'-')+(ok?' • '+round1(s.latitude)+','+round1(s.longitude)+v:' • belum ada koordinat')+'</option>';
}
function fillLocationForm(){
 const npsn=$('garLocSchool')?.value,s=currentModel?.data?.schools?.find(x=>x.npsn===npsn);if(!s)return;
 $('garLocLat').value=s.latitude??'';
 $('garLocLng').value=s.longitude??'';
 $('garLocUrl').value=s.maps_url||'';
 $('garLocVerified').checked=!!s.location_verified;
 const info=$('garLocInfo');if(info)info.innerHTML='<b>'+esc(s.school_name)+'</b><br>NPSN '+esc(s.npsn)+' • '+esc(s.kecamatan||'-')+(hasCoord(s)?'<br>Koordinat: '+esc(s.latitude)+', '+esc(s.longitude):'<br>Koordinat belum tersedia');
}
function parseLocationForm(){
 const raw=$('garLocPaste')?.value||'',parsed=parseCoordinates(raw);
 if(!parsed){alert('Koordinat belum terbaca. Gunakan format latitude,longitude atau link Google Maps panjang yang memuat koordinat. Link pendek maps.app.goo.gl perlu dibuka dulu lalu salin koordinat/link panjangnya.');return}
 $('garLocLat').value=parsed.latitude;$('garLocLng').value=parsed.longitude;
 if(/^https?:\/\//i.test(raw))$('garLocUrl').value=raw;
}
async function saveLocation(){
 const npsn=$('garLocSchool')?.value;if(!npsn)return;
 const latRaw=$('garLocLat')?.value,lngRaw=$('garLocLng')?.value;
 const hasLat=String(latRaw||'').trim()!=='',hasLng=String(lngRaw||'').trim()!=='';
 if(hasLat!==hasLng){alert('Latitude dan longitude harus diisi berpasangan.');return}
 const lat=hasLat?Number(latRaw):null,lng=hasLng?Number(lngRaw):null;
 if(hasLat&&(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)){alert('Koordinat tidak valid.');return}
 const mapsUrl=String($('garLocUrl')?.value||'').trim()||null,verified=!!$('garLocVerified')?.checked,now=new Date().toISOString();
 const source=mapsUrl?'GOOGLE_MAPS':'MANUAL';
 const payload={latitude:lat,longitude:lng,maps_url:mapsUrl,location_source:(lat!=null||mapsUrl)?source:null,location_verified:verified&&lat!=null,location_verified_by:verified&&lat!=null?(profile().id||null):null,location_verified_at:verified&&lat!=null?now:null,location_updated_at:now,updated_at:now};
 const {error}=await sb.from('school_master').update(payload).eq('npsn',npsn);if(error){alert('Gagal menyimpan lokasi: '+error.message);return}
 cache=null;cacheAt=0;await render(true);setTimeout(()=>openLocationManager(npsn),120);
}
function exportMissingLocations(){
 const rows=(currentModel?.data?.schools||[]).filter(s=>!hasCoord(s));
 const lines=[['NPSN','Latitude','Longitude','Google Maps URL','Nama Sekolah','Kecamatan'],...rows.map(s=>[s.npsn,'','', '',s.school_name,s.kecamatan||''])];
 const blob=new Blob(['\ufeff'+lines.map(r=>r.map(v=>String(v??'').replaceAll(';',',')).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='template_lokasi_sekolah_belum_lengkap.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function importLocationBulk(){
 const raw=$('garLocBulk')?.value||'';const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length){alert('Belum ada data impor.');return}
 const parsed=[];const errors=[];
 for(let i=0;i<lines.length;i++){
  const sep=lines[i].includes(';')?';':',',p=lines[i].split(sep).map(x=>x.trim());
  if(i===0&&/npsn/i.test(p[0]))continue;
  const [npsn,latS,lngS,url='']=p,lat=Number(latS),lng=Number(lngS);
  if(!/^\d{8}$/.test(npsn||'')||!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180){errors.push('Baris '+(i+1));continue}
  parsed.push({npsn,lat,lng,url});
 }
 if(errors.length){alert('Ada data tidak valid: '+errors.slice(0,10).join(', ')+(errors.length>10?'…':''));return}
 for(let i=0;i<parsed.length;i+=20){
  const chunk=parsed.slice(i,i+20);
  const results=await Promise.all(chunk.map(x=>sb.from('school_master').update({latitude:x.lat,longitude:x.lng,maps_url:x.url||null,location_source:'IMPORT',location_verified:false,location_verified_by:null,location_verified_at:null,location_updated_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('npsn',x.npsn)));
  const err=results.find(x=>x.error)?.error;if(err){alert('Impor berhenti: '+err.message);return}
 }
 alert('Impor lokasi selesai: '+parsed.length+' sekolah. Koordinat impor belum otomatis ditandai terverifikasi.');
 cache=null;cacheAt=0;await render(true);
}
function openLocationManager(selectedNpsn){
 if(!canEditLocation()||!currentModel)return;
 document.getElementById('garLocationModal')?.remove();
 const schools=[...(currentModel.data.schools||[])].sort((a,b)=>String(a.school_name).localeCompare(String(b.school_name),'id'));
 const modal=document.createElement('div');modal.id='garLocationModal';modal.setAttribute('style','position:fixed;inset:0;z-index:10002;background:rgba(8,26,48,.62);display:flex;align-items:center;justify-content:center;padding:14px');
 modal.onclick=e=>{if(e.target===modal)modal.remove()};
 modal.innerHTML='<div style="width:min(980px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:18px;box-shadow:0 24px 60px rgba(0,0,0,.3)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div class="gar-label">MASTER LOKASI SEKOLAH</div><h3 style="margin:4px 0;color:#0f3f76">Koordinat untuk Jarak Redistribusi</h3><div class="gar-small">Tidak ada koordinat yang dibuat otomatis. Masukkan titik dari sumber yang Anda verifikasi.</div></div><button class="gar-btn soft" onclick="document.getElementById(\'garLocationModal\')?.remove()">✕ Tutup</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px"><div><label class="gar-small"><b>Sekolah</b></label><select id="garLocSchool" style="width:100%;padding:9px;border:1px solid #cfdae5;border-radius:10px">'+schools.map(locationOption).join('')+'</select><div id="garLocInfo" class="gar-note" style="margin-top:8px"></div><div class="gar-actions"><button id="garLocSearchMaps" class="gar-btn soft">Buka Pencarian Google Maps</button><button id="garLocMissing" class="gar-btn soft">Unduh Template Belum Ada Lokasi</button></div></div><div><label class="gar-small"><b>Paste koordinat / link Google Maps panjang</b></label><textarea id="garLocPaste" rows="3" style="width:100%;padding:9px;border:1px solid #cfdae5;border-radius:10px" placeholder="-6.912345, 109.765432 atau URL yang mengandung @lat,lng"></textarea><div class="gar-actions"><button id="garLocParse" class="gar-btn soft">Ambil Koordinat</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><label class="gar-small">Latitude<input id="garLocLat" type="number" step="0.000001" style="width:100%;padding:8px;border:1px solid #cfdae5;border-radius:9px"></label><label class="gar-small">Longitude<input id="garLocLng" type="number" step="0.000001" style="width:100%;padding:8px;border:1px solid #cfdae5;border-radius:9px"></label></div><label class="gar-small" style="display:block;margin-top:8px">Google Maps URL<input id="garLocUrl" style="width:100%;padding:8px;border:1px solid #cfdae5;border-radius:9px"></label><label class="gar-small" style="display:block;margin-top:8px"><input id="garLocVerified" type="checkbox"> Lokasi sudah diverifikasi</label><div class="gar-actions"><button id="garLocSave" class="gar-btn green">Simpan Lokasi</button></div></div></div><hr style="border:0;border-top:1px solid #e3ebf2;margin:16px 0"><div class="gar-label">IMPOR MASSAL</div><div class="gar-small">Format per baris: <b>NPSN;Latitude;Longitude;Google Maps URL</b>. Baris header boleh disertakan. Hasil impor belum otomatis berstatus terverifikasi.</div><textarea id="garLocBulk" rows="6" style="width:100%;margin-top:8px;padding:9px;border:1px solid #cfdae5;border-radius:10px" placeholder="203xxxxx;-6.90;109.75;https://..."></textarea><div class="gar-actions"><button id="garLocImport" class="gar-btn">Impor Koordinat</button></div></div>';
 document.body.appendChild(modal);
 const sel=$('garLocSchool');if(selectedNpsn&&schools.some(s=>s.npsn===selectedNpsn))sel.value=selectedNpsn;fillLocationForm();
 sel.onchange=fillLocationForm;$('garLocParse').onclick=parseLocationForm;$('garLocSave').onclick=saveLocation;$('garLocMissing').onclick=exportMissingLocations;$('garLocImport').onclick=importLocationBulk;
 $('garLocSearchMaps').onclick=()=>{const s=currentModel.data.schools.find(x=>x.npsn===sel.value);if(s)window.open(schoolSearchUrl(s),'_blank','noopener')};
}
function bind(m){
 const rerender=()=>render(false);
 $('garLevel')?.addEventListener('change',()=>{const d=$('garDistrict');if(d)d.value='ALL';rerender()});
 $('garDistrict')?.addEventListener('change',rerender);
 $('garStatus')?.addEventListener('change',rerender);
 $('garRefresh')?.addEventListener('click',()=>{cache=null;cacheAt=0;render(true)});
 $('garCsv')?.addEventListener('click',()=>currentModel&&downloadCsv(currentModel));
 $('garPdf')?.addEventListener('click',()=>currentModel&&downloadPdf(currentModel));
 $('garStudyFocus')?.addEventListener('click',async()=>{
  const level=$('garLevel');
  if(level&&!fixedLevel()){level.value='SD';const d=$('garDistrict');if(d)d.value='ALL';await render(false);}
  setTimeout(()=>{
   const panel=$('garStudyPanel');if(!panel)return;
   panel.scrollIntoView({behavior:'smooth',block:'start'});
   panel.style.outline='3px solid #1767b3';panel.style.outlineOffset='3px';
   setTimeout(()=>{panel.style.outline='';panel.style.outlineOffset=''},1600);
  },80);
 });
 $('garLocations')?.addEventListener('click',()=>openLocationManager());
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