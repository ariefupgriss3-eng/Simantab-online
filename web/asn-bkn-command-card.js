/* SIMANTAB_ASN_BKN_COMMAND_CARD_V1
  Read-only ASN PTK source snapshot, NOT a Guru-vs-Tendik classification. */
(async()=>{
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<150&&(!window.__simantabSb||!document.getElementById('dashboardBody'));i++)await pause(100);
 const sb=window.__simantabSb,body=document.getElementById('dashboardBody');if(!sb||!body)return;
 const allowed=new Set(['SUPER_ADMIN','KABID']);
 const fmt=v=>new Intl.NumberFormat('id-ID').format(Number(v)||0);
 const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 let loaded=null,pending=null,recentAt=0;
 async function data(){
   if(loaded&&Date.now()-recentAt<120000)return loaded;
   if(pending)return pending;
   pending=(async()=>{
     const {data:r,error:e}=await sb.from('gtk_public_bkn_runs').select('id,completed_at,matched_schools,source_schools,matched_total_asn').eq('status','COMPLETE').order('completed_at',{ascending:false}).limit(1);
     if(e)throw e;
     if(!r?.length)return null;
     const run=r[0];
     const [a,b]=await Promise.all([
       sb.from('gtk_public_bkn_school_snapshot').select('npsn,total_asn').eq('run_id',run.id).order('npsn').range(0,999),
       sb.from('school_master').select('npsn,bentuk_pendidikan,school_status,is_active').eq('is_active',true).range(0,1499)
     ]);
     if(a.error)throw a.error;if(b.error)throw b.error;
     if(a.data.length!==run.matched_schools)throw Error('Snapshot belum lengkap; angka tidak ditampilkan.');
     const schools=new Map((b.data||[]).map(s=>[s.npsn,s]));
     const aggregate={TK:{NEGERI:0,SWASTA:0},SD:{NEGERI:0,SWASTA:0},SMP:{NEGERI:0,SWASTA:0}};
     let sum=0;
     for(const row of a.data){
       const m=schools.get(row.npsn);
       if(!m||!aggregate[m.bentuk_pendidikan]||!['NEGERI','SWASTA'].includes(m.school_status))throw Error('Ada NPSN yang tidak terpetakan ke master.');
       aggregate[m.bentuk_pendidikan][m.school_status]+=row.total_asn;
       sum+=row.total_asn;
     }
     if(sum!==run.matched_total_asn)throw Error('ASN agregat tidak sesuai snapshot.');
     loaded={run,aggregate};recentAt=Date.now();return loaded;
   })().finally(()=>{pending=null});
   return pending;
 }
 function render(el,d){
   if(!d){el.innerHTML='<div style="font-size:12px;color:#765924">Belum ada snapshot PTK–ASN yang tervalidasi.</div>';return;}
   const {run,aggregate:g}=d,stamp=new Date(run.completed_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});
   const rows=['TK','SD','SMP'].map(level=>'<tr><td style="padding:5px 10px 5px 0">'+level+'</td><td style="text-align:right;padding:5px">'+fmt(g[level].NEGERI)+'</td><td style="text-align:right;padding:5px">'+fmt(g[level].SWASTA)+'</td><td style="text-align:right;padding:5px"><b>'+fmt(g[level].NEGERI+g[level].SWASTA)+'</b></td></tr>').join('');
   el.innerHTML='<div style="color:#075985;font-size:12px;font-weight:800">ASN PTK Terpadankan BKN • <span style="font-size:10px;color:#64748b">Data publik pembanding</span></div>'+
   '<div style="font-size:30px;font-weight:900;color:#10446e;margin-top:4px">'+fmt(run.matched_total_asn)+'</div>'+
   '<div style="font-size:11px;color:#475569">'+fmt(run.matched_schools)+' dari '+fmt(run.source_schools)+' NPSN sumber tercocokkan • '+safe(stamp)+' WIB</div>'+
   '<div style="overflow:auto;margin-top:7px"><table style="width:100%;font-size:11px;border-collapse:collapse"><thead><tr><th style="text-align:left">Jenjang</th><th style="text-align:right">Negeri</th><th style="text-align:right">Swasta</th><th style="text-align:right">Total</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
   '<div style="margin-top:7px;font-size:10px;color:#64748b">ASN Guru + Tendik gabungan, <b>bukan</b> rincian ASN Guru/Tendik. Tidak mengubah master GTK 7.008.</div>';
 }
 async function update(node){
   if(!node||!allowed.has(window.__simantabProfile?.role))return;
   if(!node.id)node.id='gtkPublicAsnBknCard';
   node.style.cssText='grid-column:span 4;min-width:0;background:#fff;border:1px solid #c8dded;border-radius:15px;padding:14px;margin-top:10px;box-shadow:0 3px 12px #0f3f7612';
   if(!node.dataset.loading)node.innerHTML='<div style="font-size:12px;color:#607286">Memuat snapshot ASN PTK publik…</div>';
   node.dataset.loading='1';
   try{render(node,await data())}catch(e){node.innerHTML='<div style="font-size:11px;color:#9a3412">Data pembanding belum dapat ditampilkan: '+safe(e.message||e)+'</div>'}
   finally{delete node.dataset.loading}
 }
 let queue=false;
 function insert(){
   if(queue)return;queue=true;
   queueMicrotask(()=>{
     queue=false;
     if(!allowed.has(window.__simantabProfile?.role))return;
     if(!body.isConnected||!body.querySelector('.lad-grid,.grid,.lad-hero'))return;
     if(document.getElementById('gtkPublicAsnBknCard'))return;
     const grid=body.querySelector('.lad-grid,.grid')||body;
     const card=document.createElement('article');
     card.id='gtkPublicAsnBknCard';card.setAttribute('aria-label','ASN PTK Terpadankan BKN');
     grid.appendChild(card);update(card);
   });
 }
 new MutationObserver(insert).observe(body,{childList:true,subtree:false});
 insert();
 window.__simantabRefreshAsnBknCard=()=>{loaded=null;recentAt=0;const x=document.getElementById('gtkPublicAsnBknCard');if(x)update(x)};
})();
