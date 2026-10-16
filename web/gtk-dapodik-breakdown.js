/* SIMANTAB_GTK_DAPODIK_BREAKDOWN_V1 */
(async()=>{
const pause=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabSb||!document.getElementById('dashboardBody'));i++)await pause(50);
const sb=window.__simantabSb,main=document.getElementById('dashboardBody');
if(!sb||!main)return;
const ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']);
const authorized=()=>ROLES.has(window.__simantabProfile?.role);
const fmt=v=>new Intl.NumberFormat('id-ID').format(Number(v)||0);
const kind=v=>String(v||'').trim().toUpperCase();
const LEVELS=['TK','SD','SMP'],STATUSES=['NEGERI','SWASTA'];
let cache=null,updated=0,pending=null;
async function load(force=false){
 if(!force&&cache&&Date.now()-updated<90000)return cache;
 if(pending&&!force)return pending;
 pending=(async()=>{
  const rows=[];
  for(let start=0;start<10000;start+=500){
   const {data,error}=await sb.from('school_master').select('npsn,school_status,bentuk_pendidikan,jenjang,teachers,staff').eq('is_active',true).order('npsn',{ascending:true}).range(start,start+499);
   if(error)throw error;
   rows.push(...(data||[]));
   if((data||[]).length<500){cache=rows;updated=Date.now();return rows;}
  }
  throw Error('Master sekolah melebihi batas muat. Hubungi admin.');
 })();
 try{return await pending}finally{pending=null}
}
function aggregate(rows){
 const cells={};for(const l of LEVELS)for(const status of STATUSES)cells[l+'_'+status]={l,status,schools:0,guru:0,tendik:0};
 const skipped={schools:0,guru:0,tendik:0};
 for(const r of rows){
  const l=kind(r.bentuk_pendidikan||r.jenjang),status=kind(r.school_status),v=cells[l+'_'+status],guru=Number(r.teachers)||0,tendik=Number(r.staff)||0;
  if(!v){skipped.schools++;skipped.guru+=guru;skipped.tendik+=tendik;continue;}
  v.schools++;v.guru+=guru;v.tendik+=tendik;
 }
 const all=Object.values(cells),total=key=>all.reduce((sum,r)=>sum+r[key],0);
 const byStatus=status=>({guru:all.filter(r=>r.status===status).reduce((x,r)=>x+r.guru,0),tendik:all.filter(r=>r.status===status).reduce((x,r)=>x+r.tendik,0)});
 return {cells,skipped,schools:total('schools'),guru:total('guru'),tendik:total('tendik'),negeri:byStatus('NEGERI'),swasta:byStatus('SWASTA')};
}
function css(){
 if(document.getElementById('gtkDapodikStyle'))return;
 const el=document.createElement('style');el.id='gtkDapodikStyle';
 el.textContent='#dashboardBody .gtk-dapodik-link{cursor:pointer!important;outline-offset:3px}#dashboardBody .gtk-dapodik-link:hover{box-shadow:0 8px 27px #16548a33!important}#dashboardBody .gtk-dapodik-hint{font-size:11px;color:#1763aa;font-weight:800;margin-top:8px}#gtkDapodikOverlay{position:fixed;inset:0;z-index:100005;background:#112c4caa;display:flex;align-items:center;justify-content:center;padding:12px}#gtkDapodikOverlay[hidden]{display:none!important}#gtkDapodikOverlay .gtk-modal{width:min(1020px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:18px;padding:20px;color:#153957;box-shadow:0 22px 70px #001a4066}#gtkDapodikOverlay .gtk-head{display:flex;justify-content:space-between;gap:12px;align-items:start}#gtkDapodikOverlay h2{margin:0;color:#0d4274;font-size:22px}#gtkDapodikOverlay h3{font-size:15px;color:#124675;margin:18px 0 8px}#gtkDapodikOverlay .gtk-muted{font-size:12px;color:#62788a}#gtkDapodikOverlay .gtk-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:15px 0}#gtkDapodikOverlay .gtk-kpi{background:#eff6ff;border:1px solid #d6e8f9;border-radius:12px;padding:13px}#gtkDapodikOverlay .gtk-kpi b{display:block;font-size:24px;color:#164977;margin:4px 0}#gtkDapodikOverlay .gtk-scroll{max-width:100%;overflow:auto;border:1px solid #dce7ef;border-radius:12px}#gtkDapodikOverlay table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:12px}#gtkDapodikOverlay th,#gtkDapodikOverlay td{padding:10px 12px;text-align:right;border-bottom:1px solid #e4edf4}#gtkDapodikOverlay th:first-child,#gtkDapodikOverlay td:first-child{text-align:left}#gtkDapodikOverlay th{background:#eaf3fe;color:#234e77}#gtkDapodikOverlay tbody tr:nth-child(even){background:#fafcff}#gtkDapodikOverlay .gtk-total{font-weight:900;background:#eaf3fe}#gtkDapodikOverlay .gtk-note{margin:10px 0;background:#fff9e9;border:1px solid #f0dcab;padding:12px;border-radius:11px;font-size:12px;color:#785418;line-height:1.55}#gtkDapodikOverlay button{background:#eef6ff;border:1px solid #b9d8ec;border-radius:10px;padding:9px 13px;color:#164f7c;font-weight:bold;cursor:pointer}#gtkDapodikOverlay .gtk-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}#gtkDapodikOverlay .gtk-none{color:#8292a3}@media(max-width:600px){#gtkDapodikOverlay .gtk-modal{padding:12px;max-height:98vh}#gtkDapodikOverlay .gtk-kpi{padding:8px}#gtkDapodikOverlay .gtk-kpi b{font-size:19px}#gtkDapodikOverlay h2{font-size:17px}}';
 document.head.appendChild(el);
}
function statusTable(a,label,key){
 const rows=LEVELS.map(l=>{
  const n=a.cells[l+'_NEGERI'],s=a.cells[l+'_SWASTA'];
  return '<tr><td>'+l+'</td><td class="gtk-none">—</td><td class="gtk-none">—</td><td class="gtk-none">—</td><td class="gtk-none">—</td><td><b>'+fmt(n[key]+s[key])+'</b></td></tr>';
 }).join('');
 return '<h3>'+label+' ASN / Non-ASN per Jenjang</h3><div class="gtk-scroll"><table><thead><tr><th>Jenjang</th><th>ASN Negeri</th><th>Non-ASN Negeri</th><th>ASN Swasta</th><th>Non-ASN Swasta</th><th>Total '+label+'</th></tr></thead><tbody>'+rows+'<tr class="gtk-total"><td>Total</td><td>—</td><td>—</td><td>—</td><td>—</td><td>'+fmt(a[key])+'</td></tr></tbody></table></div>';
}
function summaryTable(a){
 const rows=LEVELS.flatMap(l=>STATUSES.map(status=>a.cells[l+'_'+status]));
 return '<div class="gtk-scroll"><table><thead><tr><th>Jenjang</th><th>Satpen</th><th>Sekolah</th><th>Guru</th><th>Tendik</th><th>Total GTK</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+x.l+'</td><td>'+(x.status==='NEGERI'?'Negeri':'Swasta')+'</td><td>'+fmt(x.schools)+'</td><td>'+fmt(x.guru)+'</td><td>'+fmt(x.tendik)+'</td><td><b>'+fmt(x.guru+x.tendik)+'</b></td></tr>').join('')+
 '<tr class="gtk-total"><td colspan="2">TOTAL</td><td>'+fmt(a.schools)+'</td><td>'+fmt(a.guru)+'</td><td>'+fmt(a.tendik)+'</td><td>'+fmt(a.guru+a.tendik)+'</td></tr></tbody></table></div>';
}
function copyText(a){
 return ['RINCIAN GTK DAPODIK KAB. BATANG','Jumlah '+fmt(a.guru+a.tendik)+' | Guru '+fmt(a.guru)+' | Tendik '+fmt(a.tendik),...LEVELS.flatMap(l=>STATUSES.map(status=>{const x=a.cells[l+'_'+status];return l+' '+status+': Guru '+fmt(x.guru)+', Tendik '+fmt(x.tendik)})),'Status ASN dan Non-ASN per jenjang masih menunggu data individu Dapodik.'].join('\n');
}
function show(a){
 css();let root=document.getElementById('gtkDapodikOverlay');
 if(!root){root=document.createElement('div');root.id='gtkDapodikOverlay';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Rincian GTK Dapodik');document.body.appendChild(root);}
 root.hidden=false;
 const k=(name,value)=>'<div class="gtk-kpi"><span class="gtk-muted">'+name+'</span><b>'+fmt(value)+'</b></div>';
 root.innerHTML='<div class="gtk-modal"><div class="gtk-head"><div><h2>👥 Rincian GTK Dapodik Batang</h2><div class="gtk-muted">TK, SD, SMP • Negeri dan Swasta • Data sekolah aktif</div></div><button type="button" id="gtkClose" aria-label="Tutup">✕</button></div>'+
 '<div class="gtk-kpis">'+k('TOTAL GTK',a.guru+a.tendik)+k('GURU',a.guru)+k('TENDIK',a.tendik)+'</div>'+
 '<h3>Rincian Menurut Jenjang dan Status Sekolah</h3>'+summaryTable(a)+
 '<div class="gtk-kpis">'+k('GURU NEGERI',a.negeri.guru)+k('GURU SWASTA',a.swasta.guru)+k('TENDIK SWASTA',a.swasta.tendik)+'</div>'+
 '<div class="gtk-note"><b>Status kepegawaian belum lengkap:</b> Jumlah guru dan tendik berasal dari master sekolah. Status ASN/non-ASN tidak tersedia dalam sumber data 7.008 tersebut. Simbol <b>—</b> berarti belum terverifikasi, <b>bukan 0</b>. Data Kebutuhan GTK Riil yang belum mencakup semua sekolah tidak dipakai untuk menyimpulkan total kepegawaian.</div>'+
 statusTable(a,'Guru','guru')+statusTable(a,'Tendik','tendik')+
 (a.skipped.schools?'<div class="gtk-note">Terdapat '+fmt(a.skipped.schools)+' sekolah di luar klasifikasi yang ditampilkan. Periksa cakupan data.</div>':'')+
 '<div class="gtk-actions"><button type="button" id="gtkCopy">📋 Salin Ringkasan</button><button type="button" id="gtkRefresh">↻ Segarkan</button></div></div>';
 const close=()=>{root.hidden=true;root.innerHTML='';document.body.style.overflow='';};
 root.querySelector('#gtkClose').onclick=close;
 root.onclick=e=>{if(e.target===root)close()};
 root.querySelector('#gtkCopy').onclick=async()=>{try{await navigator.clipboard.writeText(copyText(a));alert('Ringkasan berhasil disalin.')}catch(_){window.prompt('Salin ringkasan:',copyText(a));}};
 root.querySelector('#gtkRefresh').onclick=()=>open(true);
 document.body.style.overflow='hidden';
 root.querySelector('#gtkClose').focus();
}
async function open(force=false){
 if(!authorized())return;
 try{const rows=await load(force);show(aggregate(rows));}catch(e){alert('Rincian GTK gagal dimuat: '+String(e?.message||e));}
}
window.__simantabGtkDapodikOpen=open;
function decorate(){
 if(!authorized())return;
 for(const label of main.querySelectorAll('.label,.lad-label')){
  if(kind(label.textContent)!=='GTK DAPODIK')continue;
  const card=label.closest('.kk,.lad-card,.card,.kd-kpi');
  if(!card||card.dataset.gtkDapodikBound)return;
  card.dataset.gtkDapodikBound='1';card.classList.add('gtk-dapodik-link');
  card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','Lihat rincian GTK Dapodik');
  card.addEventListener('click',()=>open());
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
  const hint=document.createElement('div');hint.className='gtk-dapodik-hint';hint.textContent='📊 Lihat rincian per jenjang';card.appendChild(hint);
 }
}
let queued=false;function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate()})}
new MutationObserver(schedule).observe(main,{childList:true,subtree:false});
schedule();
window.__simantabGtkDapodikBreakdown={version:1,source:'school_master',statusASN:'BELUM_TERSEDIA',clickable:true};
})();
