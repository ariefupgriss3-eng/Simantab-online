/* SIMANTAB_GTK_INFOGRAPHIC_DETAILS_V1 */
/* SIMANTAB_GTK_INFOGRAPHIC_DETAILS_V2 */
(()=>{
const sb=window.__simantabSb;
if(!sb)return;
const $=id=>document.getElementById(id);
const num=v=>Number(v)||0;
const fmt=v=>new Intl.NumberFormat('id-ID').format(num(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const allowed=new Map([['ABK IDEAL','ABK'],['ASN','ASN'],['NON-ASN','NON_ASN'],['GAP RIIL','GAP_RIIL'],['GAP DATA','GAP_DATA'],['CAKUPAN','CAKUPAN']]);

async function loadVerified(){
 const [n,w,s]=await Promise.all([
  sb.from('school_gtk_needs').select('school_npsn,school_name,school_level,position_name,abk,pns,pppk,pppk_pw,asn_total,non_asn_before_2024,non_asn_after_2024,non_asn_total'),
  sb.from('school_gtk_needs_workflow').select('school_npsn,status'),
  sb.from('school_master').select('npsn,school_name,jenjang,bentuk_pendidikan').eq('is_active',true)
 ]);
 const er=n.error||w.error||s.error;if(er)throw er;
 const verified=new Set((w.data||[]).filter(x=>['VERIFIED','APPROVED'].includes(String(x.status||'').toUpperCase())).map(x=>x.school_npsn));
 const rows=(n.data||[]).filter(x=>verified.has(x.school_npsn)).map(x=>{
  const abk=num(x.abk),pns=num(x.pns),pppk=num(x.pppk),pw=num(x.pppk_pw),asn=num(x.asn_total),nb=num(x.non_asn_before_2024),na=num(x.non_asn_after_2024),non=num(x.non_asn_total);
  return {...x,abk,pns,pppk,pw,asn,nb,na,non,gr:Math.max(0,abk-asn),gd:Math.max(0,abk-asn-non)};
 });
 return {rows,schools:s.data||[],verified};
}

function modal(title,desc,summary,table){
 let m=$('leaderGtkDetailModal');if(m)m.remove();
 m=document.createElement('div');m.id='leaderGtkDetailModal';
 m.style='position:fixed;inset:0;z-index:99999;background:#0b203c99;display:flex;align-items:center;justify-content:center;padding:16px';
 m.onclick=e=>{if(e.target===m)m.remove()};
 m.innerHTML='<div class="card" style="width:min(1180px,100%);max-height:92vh;overflow:auto"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;position:sticky;top:-15px;background:#fff;padding:4px 0 10px;z-index:2"><div><div class="label">INFOGRAFIS GTK • RINCIAN</div><h3 style="margin:3px 0">'+esc(title)+'</h3><div class="small">'+esc(desc)+'</div></div><button class="btn soft" onclick="document.getElementById(\'leaderGtkDetailModal\')?.remove()">✕</button></div>'+summary+table+'</div>';
 document.body.appendChild(m);
}

window.__leaderOpenGtkDetail=async function(type){
 try{
  const d=await loadVerified(),rows=d.rows;
  const meta={
   ABK:['ABK Ideal','Rincian kebutuhan ideal per sekolah dan jabatan'],
   ASN:['ASN','Rincian PNS, PPPK, PPPK Paruh Waktu, dan total ASN'],
   NON_ASN:['Non-ASN','Rincian tenaga Non-ASN pada sekolah VERIFIED'],
   GAP_RIIL:['Gap Riil','Kekurangan per jabatan: max(0, ABK − ASN)'],
   GAP_DATA:['Gap Data','Kekurangan setelah ASN dan Non-ASN diperhitungkan'],
   CAKUPAN:['Cakupan Input','Sekolah VERIFIED/APPROVED yang masuk perhitungan kebutuhan GTK']
  };
  const md=meta[type]||['Rincian GTK','Rincian data'];let list=rows,summary='',table='';
  if(type==='CAKUPAN'){
   const by=new Map;
   for(const x of rows){const k=x.school_npsn||x.school_name,o=by.get(k)||{npsn:x.school_npsn,name:x.school_name,level:x.school_level,entries:0,abk:0,asn:0,non:0,gr:0,gd:0};o.entries++;o.abk+=x.abk;o.asn+=x.asn;o.non+=x.non;o.gr+=x.gr;o.gd+=x.gd;by.set(k,o)}
   list=[...by.values()].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'id'));
   const total=d.schools.length,cov=total?Math.round(list.length/total*100):0,not=Math.max(0,total-list.length);
   summary='<div class="grid" style="margin-bottom:12px"><div class="card s4"><div class="label">Terverifikasi</div><div class="metric">'+fmt(list.length)+'</div><div class="small">sekolah masuk perhitungan</div></div><div class="card s4"><div class="label">Cakupan</div><div class="metric">'+cov+'%</div><div class="small">dari '+fmt(total)+' sekolah aktif</div></div><div class="card s4"><div class="label">Belum Tercakup</div><div class="metric">'+fmt(not)+'</div><div class="small">belum VERIFIED/APPROVED</div></div></div>';
   table=list.length?'<div class="tablewrap"><table><thead><tr><th>Sekolah</th><th>NPSN</th><th>Jenjang</th><th>Entri</th><th>ABK</th><th>ASN</th><th>Non-ASN</th><th>Gap Riil</th><th>Gap Data</th></tr></thead><tbody>'+list.map(x=>'<tr><td><b>'+esc(x.name||'-')+'</b></td><td>'+esc(x.npsn||'-')+'</td><td>'+esc(x.level||'-')+'</td><td>'+fmt(x.entries)+'</td><td>'+fmt(x.abk)+'</td><td>'+fmt(x.asn)+'</td><td>'+fmt(x.non)+'</td><td>'+fmt(x.gr)+'</td><td>'+fmt(x.gd)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">Belum ada sekolah VERIFIED.</div>';
  }else{
   if(type==='ABK')list=rows.filter(x=>x.abk>0).sort((a,b)=>b.abk-a.abk);
   if(type==='ASN')list=rows.filter(x=>x.asn>0).sort((a,b)=>b.asn-a.asn);
   if(type==='NON_ASN')list=rows.filter(x=>x.non>0).sort((a,b)=>b.non-a.non);
   if(type==='GAP_RIIL')list=rows.filter(x=>x.gr>0).sort((a,b)=>b.gr-a.gr);
   if(type==='GAP_DATA')list=rows.filter(x=>x.gd>0).sort((a,b)=>b.gd-a.gd);
   const total=type==='ABK'?rows.reduce((s,x)=>s+x.abk,0):type==='ASN'?rows.reduce((s,x)=>s+x.asn,0):type==='NON_ASN'?rows.reduce((s,x)=>s+x.non,0):type==='GAP_RIIL'?rows.reduce((s,x)=>s+x.gr,0):rows.reduce((s,x)=>s+x.gd,0);
   summary='<div class="info" style="margin-bottom:12px"><b>Total: '+fmt(total)+'</b> • '+fmt(list.length)+' entri jabatan ditampilkan • sumber hanya sekolah VERIFIED/APPROVED.</div>';
   const common=x=>'<td><b>'+esc(x.school_name||'-')+'</b><div class="small">'+esc(x.school_npsn||'')+'</div></td><td>'+esc(x.school_level||'-')+'</td><td>'+esc(x.position_name||'-')+'</td>';
   if(type==='ABK')table='<div class="tablewrap"><table><thead><tr><th>Sekolah</th><th>Jenjang</th><th>Jabatan</th><th>ABK Ideal</th></tr></thead><tbody>'+list.map(x=>'<tr>'+common(x)+'<td><b>'+fmt(x.abk)+'</b></td></tr>').join('')+'</tbody></table></div>';
   if(type==='ASN')table='<div class="tablewrap"><table><thead><tr><th>Sekolah</th><th>Jenjang</th><th>Jabatan</th><th>PNS</th><th>PPPK</th><th>PPPK PW</th><th>Total ASN</th></tr></thead><tbody>'+list.map(x=>'<tr>'+common(x)+'<td>'+fmt(x.pns)+'</td><td>'+fmt(x.pppk)+'</td><td>'+fmt(x.pw)+'</td><td><b>'+fmt(x.asn)+'</b></td></tr>').join('')+'</tbody></table></div>';
   if(type==='NON_ASN')table='<div class="tablewrap"><table><thead><tr><th>Sekolah</th><th>Jenjang</th><th>Jabatan</th><th>Sebelum 2024</th><th>Setelah 2024</th><th>Total Non-ASN</th></tr></thead><tbody>'+list.map(x=>'<tr>'+common(x)+'<td>'+fmt(x.nb)+'</td><td>'+fmt(x.na)+'</td><td><b>'+fmt(x.non)+'</b></td></tr>').join('')+'</tbody></table></div>';
   if(type==='GAP_RIIL')table='<div class="tablewrap"><table><thead><tr><th>Sekolah</th><th>Jenjang</th><th>Jabatan</th><th>ABK</th><th>ASN</th><th>Gap Riil</th></tr></thead><tbody>'+list.map(x=>'<tr>'+common(x)+'<td>'+fmt(x.abk)+'</td><td>'+fmt(x.asn)+'</td><td><b>'+fmt(x.gr)+'</b></td></tr>').join('')+'</tbody></table></div>';
   if(type==='GAP_DATA')table='<div class="tablewrap"><table><thead><tr><th>Sekolah</th><th>Jenjang</th><th>Jabatan</th><th>ABK</th><th>ASN</th><th>Non-ASN</th><th>Gap Data</th></tr></thead><tbody>'+list.map(x=>'<tr>'+common(x)+'<td>'+fmt(x.abk)+'</td><td>'+fmt(x.asn)+'</td><td>'+fmt(x.non)+'</td><td><b>'+fmt(x.gd)+'</b></td></tr>').join('')+'</tbody></table></div>';
   if(!list.length)table='<div class="empty">Tidak ada data pada kategori ini.</div>';
  }
  modal(md[0],md[1],summary,table);
 }catch(e){alert(e.message||String(e))}
};


window.__leaderOpenSchoolGapDetail=async function(npsn,schoolName){
 try{
  const d=await loadVerified();
  const rows=d.rows.filter(x=>String(x.school_npsn||'')===String(npsn||''));
  if(!rows.length){alert('Rincian kebutuhan sekolah tidak ditemukan atau belum VERIFIED.');return}
  const all=rows.map(x=>({...x,gr:Math.max(0,num(x.abk)-num(x.asn)),gd:Math.max(0,num(x.abk)-num(x.asn)-num(x.non))}));
  const shortages=all.filter(x=>x.gr>0).sort((a,b)=>b.gr-a.gr||String(a.position_name||'').localeCompare(String(b.position_name||''),'id'));
  const totalAbk=all.reduce((s,x)=>s+x.abk,0),totalAsn=all.reduce((s,x)=>s+x.asn,0),totalNon=all.reduce((s,x)=>s+x.non,0),totalGr=all.reduce((s,x)=>s+x.gr,0),totalGd=all.reduce((s,x)=>s+x.gd,0);
  const summary='<div class="grid" style="margin-bottom:12px">'
   +'<div class="card s3"><div class="label">ABK</div><div class="metric">'+fmt(totalAbk)+'</div></div>'
   +'<div class="card s3"><div class="label">ASN</div><div class="metric">'+fmt(totalAsn)+'</div></div>'
   +'<div class="card s3"><div class="label">Gap Riil</div><div class="metric">'+fmt(totalGr)+'</div></div>'
   +'<div class="card s3"><div class="label">Gap Data</div><div class="metric">'+fmt(totalGd)+'</div><div class="small">Non-ASN '+fmt(totalNon)+'</div></div>'
   +'</div>';
  const table=shortages.length
   ?'<div class="tablewrap"><table><thead><tr><th>Jabatan</th><th>ABK</th><th>PNS</th><th>PPPK</th><th>PPPK PW</th><th>ASN</th><th>Non-ASN</th><th>Gap Riil</th><th>Gap Data</th></tr></thead><tbody>'
    +shortages.map(x=>'<tr><td><b>'+esc(x.position_name||'-')+'</b></td><td>'+fmt(x.abk)+'</td><td>'+fmt(x.pns)+'</td><td>'+fmt(x.pppk)+'</td><td>'+fmt(x.pw)+'</td><td>'+fmt(x.asn)+'</td><td>'+fmt(x.non)+'</td><td><b>'+fmt(x.gr)+'</b></td><td>'+fmt(x.gd)+'</td></tr>').join('')
    +'</tbody></table></div>'
   :'<div class="empty">Tidak ada jabatan dengan Gap Riil positif pada sekolah ini.</div>';
  modal(schoolName||rows[0].school_name||'Rincian Kekurangan Sekolah','Rincian jabatan yang masih kekurangan pada sekolah VERIFIED/APPROVED.',summary,table);
 }catch(e){alert(e.message||String(e))}
};

document.addEventListener('click',e=>{
 const kurang=e.target.closest('#kadinGtk .kpill');
 if(kurang&&/^Kurang\s+/i.test(String(kurang.textContent||'').trim())){
  const tr=kurang.closest('tr'),cells=tr?.querySelectorAll('td')||[];
  const schoolName=String(cells[0]?.textContent||'').trim(),npsn=String(cells[1]?.textContent||'').trim();
  if(npsn){e.preventDefault();window.__leaderOpenSchoolGapDetail(npsn,schoolName);return}
 }
 const card=e.target.closest('#kadinGtk .kk');if(!card)return;
 const label=String(card.querySelector('.label')?.textContent||'').trim().toUpperCase();
 const type=allowed.get(label);if(!type)return;
 e.preventDefault();window.__leaderOpenGtkDetail(type);
});

const s=document.createElement('style');s.id='gtkInfographicDetailStyle';s.textContent='#kadinGtk .kk{cursor:pointer}#kadinGtk .kk:hover{transform:translateY(-1px);box-shadow:0 9px 24px rgba(19,49,85,.12)}#kadinGtk .kk .ks:after{content:" • Klik untuk rincian";font-weight:800;color:#1767b3}#kadinGtk .kpill{cursor:pointer}#kadinGtk .kpill:hover{text-decoration:underline}';document.head.appendChild(s);
window.__simantabGtkInfographicDetails={version:2,clickable:true,verifiedOnly:true,schoolGapDetail:true};
})();