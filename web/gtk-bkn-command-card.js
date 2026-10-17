/* SIMANTAB_BKN_ASN_COMMAND_CARD_V1
 * Verified public PTK–BKN aggregate snapshot. Read-only.
 * Does not write or infer ASN Guru/Tendik, does not alter 7,008 GTK master. */
(async()=>{
 const wait=ms=>new Promise(done=>setTimeout(done,ms));
 for(let i=0;i<120&&!window.__simantabSb;i++)await wait(100);
 const sb=window.__simantabSb;
 if(!sb)return;
 const auth=()=>['SUPER_ADMIN','KABID'].includes(window.__simantabProfile?.role);
 const fmt=n=>new Intl.NumberFormat('id-ID').format(Number(n)||0);
 const clean=v=>String(v||'').trim().toUpperCase();
 const escapeText=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const levels=['TK','SD','SMP'];
 const statuses=['NEGERI','SWASTA'];
 const sourceLink='https://referensi.data.kemendikdasmen.go.id/ptk-bkn/data_ptk?level=2&wilayah=032500';
 let snapshot=null, loadedAt=0, inflight=null, failed=null;
 const dateLabel=date=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(date))+' WIB';
 function styles(){
  if(document.getElementById('bknCommandCardStyles'))return;
  const el=document.createElement('style');el.id='bknCommandCardStyles';
  el.textContent='#dashboardBody .bkn-command-card{cursor:pointer;outline-offset:3px;border-color:#bcdacf;background:linear-gradient(130deg,#fff,#f2faf6)}#dashboardBody .bkn-command-card:hover{box-shadow:0 8px 28px #0c6d5430}#dashboardBody .bkn-command-card .lad-value,#dashboardBody .bkn-command-card .kv{color:#0c7156}#dashboardBody .bkn-command-card .bkn-meta{font-size:11px;color:#426674;line-height:1.45;margin-top:7px}#dashboardBody .bkn-command-card .bkn-status{font-size:10px;color:#376e57;font-weight:700;margin-top:6px}#bknCommandDialog{position:fixed;inset:0;z-index:100007;display:flex;justify-content:center;align-items:center;background:#081e3da8;padding:14px}#bknCommandDialog[hidden]{display:none!important}#bknCommandDialog .bkn-panel{background:white;border-radius:16px;padding:20px;color:#173e5e;max-height:92vh;overflow:auto;width:min(720px,100%);box-shadow:0 18px 60px #021b3f60;box-sizing:border-box}#bknCommandDialog h2{font-size:19px;color:#155947;margin:0 0 8px}#bknCommandDialog .bkn-sub{font-size:12px;color:#54707c;line-height:1.6}#bknCommandDialog table{border-collapse:collapse;width:100%;min-width:460px}#bknCommandDialog th,#bknCommandDialog td{text-align:right;border-bottom:1px solid #e1eaf0;padding:11px;font-size:12px}#bknCommandDialog th:first-child,#bknCommandDialog td:first-child{text-align:left}#bknCommandDialog th{background:#eef6f7}#bknCommandDialog .bkn-overflow{max-width:100%;overflow:auto;border:1px solid #d7e5eb;border-radius:10px;margin:13px 0}#bknCommandDialog button{background:#edf7f5;color:#175646;border:1px solid #b2d9c9;border-radius:9px;padding:9px 13px;cursor:pointer;font-weight:700}#bknCommandDialog .bkn-note{font-size:12px;background:#fff8e8;color:#795b22;border:1px solid #eddcb6;border-radius:10px;padding:11px;margin-top:14px;line-height:1.65}#bknCommandDialog .bkn-head{display:flex;justify-content:space-between;gap:12px;align-items:start}#bknCommandDialog .bkn-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}@media(max-width:600px){#bknCommandDialog .bkn-panel{padding:12px}#bknCommandDialog h2{font-size:16px}}';
  document.head.appendChild(el);
 }
 async function paged(table,select,config){
  const result=[];
  for(let start=0;start<2000;start+=500){
    let q=sb.from(table).select(select).order('npsn',{ascending:true}).range(start,start+499);
    if(config?.run)q=q.eq('run_id',config.run);
    if(config?.active)q=q.eq('is_active',true);
    const {data,error}=await q;
    if(error)throw error;
    result.push(...(data||[]));
    if((data||[]).length<500)return result;
  }
  throw Error('Data sekolah melebihi batas pembacaan yang ditetapkan.');
 }
 async function load(force=false){
  if(!auth())return null;
  if(!force&&snapshot&&Date.now()-loadedAt<120000)return snapshot;
  if(inflight)return inflight;
  inflight=(async()=>{
   const {data:runs,error}=await sb.from('gtk_public_bkn_runs')
     .select('id,status,completed_at,source_type,source_schools,matched_schools,matched_total_asn')
     .eq('status','COMPLETE').order('completed_at',{ascending:false}).limit(1);
   if(error)throw error;
   const run=runs?.[0];if(!run)return null;
   if(run.source_type!=='PUBLIC_WEBPAGE_NOT_API')throw Error('Jenis sumber tidak sesuai.');
   const [schoolRows,masterRows]=await Promise.all([
    paged('gtk_public_bkn_school_snapshot','npsn,total_asn,school_name_source',{run:run.id}),
    paged('school_master','npsn,bentuk_pendidikan,school_status',{active:true})
   ]);
   const master=new Map(masterRows.map(row=>[clean(row.npsn),row]));
   const cells={};for(const l of levels)for(const s of statuses)cells[l+'_'+s]={schools:0,asn:0};
   let schools=0,asn=0;
   const seen=new Set();
   for(const row of schoolRows){
     const npsn=clean(row.npsn);if(seen.has(npsn))throw Error('NPSN ganda di snapshot.');
     seen.add(npsn);
     const sm=master.get(npsn);if(!sm)throw Error('NPSN snapshot tidak cocok dengan master sekolah aktif.');
     const l=clean(sm.bentuk_pendidikan),status=clean(sm.school_status),cell=cells[l+'_'+status];
     if(!cell)throw Error('Jenjang atau status sekolah di luar cakupan.');
     const value=Number(row.total_asn);if(!Number.isSafeInteger(value)||value<0)throw Error('Jumlah ASN tidak valid.');
     cell.schools++;cell.asn+=value;schools++;asn+=value;
   }
   if(schools!==Number(run.matched_schools)||asn!==Number(run.matched_total_asn))
     throw Error('Rincian ASN tidak konsisten dengan total snapshot COMPLETE.');
   return {run,cells,total:asn,matched:schools,source:run.source_schools,completed:run.completed_at};
  })();
  try{const data=await inflight;snapshot=data;loadedAt=Date.now();failed=null;return data;}
  catch(e){failed=String(e.message||e);throw e}
  finally{inflight=null}
 }
 function cardMarkup(data,isKd){
  const tk=data.cells.TK_NEGERI.asn+data.cells.TK_SWASTA.asn,
    sd=data.cells.SD_NEGERI.asn+data.cells.SD_SWASTA.asn,
    smp=data.cells.SMP_NEGERI.asn+data.cells.SMP_SWASTA.asn;
  const title=isKd?'<span class="ki">🛡️</span><div class="label">ASN PTK Terpadankan BKN</div>':'<div class="lad-label">ASN PTK Terpadankan BKN</div>';
  return title+
    '<div class="'+(isKd?'kv':'lad-value')+'">'+fmt(data.total)+'</div>'+ 
    '<div class="'+(isKd?'ks':'lad-sub')+'">TK '+fmt(tk)+' • SD '+fmt(sd)+' • SMP '+fmt(smp)+'</div>'+ 
    '<div class="bkn-meta">'+fmt(data.matched)+' NPSN cocok dari '+fmt(data.source)+' sekolah sumber<br>'+
    escapeText(dateLabel(data.completed))+' • Sumber PTK–BKN publik</div>'+
    '<div class="bkn-status">Lihat rincian negeri/swasta ↗</div>';
 }
 function findGrid(){
  const area=document.getElementById('dashboardBody');
  const grid=area?.querySelector('.lad-grid,.kdg');
  if(!grid||!auth())return null;
  const isKd=grid.classList.contains('kdg');
  const gtk=[...grid.querySelectorAll(isKd?'.kk':'.lad-card')].find(card=>clean(card.querySelector(isKd?'.label':'.lad-label')?.textContent)==='GTK DAPODIK');
  return gtk?{grid,gtk,isKd}:null;
 }
 function mount(data){
  if(!auth()||!data)return;
  const position=findGrid();if(!position)return;
  styles();
  let card=position.grid.querySelector('#bknAsnCommandCard');
  if(!card){
    card=document.createElement('div');card.id='bknAsnCommandCard';
    card.className=(position.isKd?'kk k3':'lad-card')+' bkn-command-card';
    card.setAttribute('role','button');card.setAttribute('tabindex','0');
    card.setAttribute('aria-label','Lihat rincian ASN PTK terpadankan BKN');
    card.addEventListener('click',()=>openDetail());
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail()}});
    position.gtk.insertAdjacentElement('afterend',card);
  }
  card.innerHTML=cardMarkup(data,position.isKd);
 }
 function tableMarkup(data){
  const levelName={TK:'TK/PAUD',SD:'SD',SMP:'SMP'};
  const tr=levels.map(level=>{
    const negeri=data.cells[level+'_NEGERI'],swasta=data.cells[level+'_SWASTA'];
    return '<tr><td>'+levelName[level]+'</td><td>'+fmt(negeri.schools)+'</td><td>'+fmt(negeri.asn)+'</td>'+
      '<td>'+fmt(swasta.schools)+'</td><td>'+fmt(swasta.asn)+'</td><td><b>'+fmt(negeri.asn+swasta.asn)+'</b></td></tr>';
  }).join('');
  const sum=(key,field)=>levels.reduce((a,l)=>a+data.cells[l+'_'+key][field],0);
  return '<div class="bkn-overflow"><table><thead><tr><th>Jenjang</th><th>NPSN negeri</th><th>ASN negeri</th><th>NPSN swasta</th><th>ASN swasta</th><th>Total ASN</th></tr></thead><tbody>'+
  tr+'<tr><td><b>Total</b></td><td>'+fmt(sum('NEGERI','schools'))+'</td><td>'+fmt(sum('NEGERI','asn'))+
  '</td><td>'+fmt(sum('SWASTA','schools'))+'</td><td>'+fmt(sum('SWASTA','asn'))+'</td><td><b>'+fmt(data.total)+'</b></td></tr></tbody></table></div>';
 }
 function closeDetail(){
  const d=document.getElementById('bknCommandDialog');if(!d)return;
  d.hidden=true;d.remove();
 }
 function openDetail(){
  if(!auth()||!snapshot)return;
  const data=snapshot;
  styles();let dialog=document.getElementById('bknCommandDialog');
  if(!dialog){dialog=document.createElement('div');dialog.id='bknCommandDialog';dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Rincian ASN PTK BKN');document.body.appendChild(dialog);}
  dialog.hidden=false;
  dialog.innerHTML='<div class="bkn-panel"><div class="bkn-head"><div>'+
   '<h2>ASN PTK Terpadankan BKN: '+fmt(data.total)+'</h2>'+
   '<div class="bkn-sub">Snapshot '+escapeText(dateLabel(data.completed))+' • '+fmt(data.matched)+' NPSN cocok dari '+fmt(data.source)+' sekolah sumber.</div>'+
   '</div><button type="button" id="bknCardClose">✕ Tutup</button></div>'+
   tableMarkup(data)+
   '<div class="bkn-note"><b>Pembanding, bukan angka kepegawaian yang otomatis menggantikan Dapodik.</b> '+fmt(data.total)+' adalah ASN PTK gabungan Guru dan Tendik pada NPSN terpadankan, bukan jumlah seluruh GTK dan tidak dibagi menjadi ASN Guru atau ASN Tendik. Simbol — pada matriks status Guru/Tendik tetap berarti data belum tersedia. SKB dengan NPSN berawalan P diikutkan untuk memeriksa rekap kecamatan, tetapi tidak otomatis menjadi sekolah TK/SD/SMP dalam master SIMANTAB.</div>'+
   '<div class="bkn-actions"><button type="button" id="bknCardRefresh">↻ Segarkan snapshot</button><a target="_blank" rel="noopener noreferrer" href="'+sourceLink+'">Lihat laporan publik PTK–BKN ↗</a></div></div>';
  dialog.querySelector('#bknCardClose').onclick=closeDetail;
  dialog.onclick=e=>{if(e.target===dialog)closeDetail();};
  dialog.querySelector('#bknCardRefresh').onclick=async()=>{
   const btn=dialog.querySelector('#bknCardRefresh');btn.disabled=true;btn.textContent='Memeriksa…';
   try{const data=await load(true);if(data){mount(data);openDetail();}else btn.textContent='Belum ada snapshot.';}
   catch(e){btn.disabled=false;btn.textContent='↻ Segarkan snapshot';alert('Gagal membaca snapshot: '+String(e.message||e));}
  };
  dialog.querySelector('#bknCardClose').focus();
 }
 let lastTry=0;
 function ensure(){
   if(!auth()){document.getElementById('bknAsnCommandCard')?.remove();closeDetail();snapshot=null;loadedAt=0;return;}
   if(!document.getElementById('dashboardBody'))return;
   if(snapshot){mount(snapshot);if(Date.now()-loadedAt<120000)return;}
   if(inflight||Date.now()-lastTry<2500)return;
   lastTry=Date.now();
   load().then(data=>{if(data)mount(data)}).catch(err=>{console.warn('[BKN Command Center] Snapshot read failed:',String(err.message||err))});
 }
 let queued=false;
 const schedule=()=>{
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;ensure()});
 };
 function ready(){
  const body=document.getElementById('dashboardBody');
  if(!body)return;
  new MutationObserver(schedule).observe(body,{childList:true,subtree:false});
  schedule();
 }
 window.addEventListener('simantab:profile-ready',schedule);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail()});
 for(let i=0;i<100&&!document.getElementById('dashboardBody');i++)await wait(100);
 ready();
 window.__simantabBknCommandCard={version:1,source:'PUBLIC_WEBPAGE_NOT_API',writeMaster:false,roles:['SUPER_ADMIN','KABID']};
})();
