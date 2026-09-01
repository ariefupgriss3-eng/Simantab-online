/* SIMANTAB_ACTIVITY_REPORT_SIGNATORY_FIX_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.printActivity);i++)await wait(50);
const sb=window.__simantabSb;if(!sb||!window.printActivity)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const originalPrint=window.printActivity;
window.printActivity=async(id,type)=>{
 const nativeOpen=window.open.bind(window);
 const popup=nativeOpen('','_blank');
 if(!popup){alert('Izinkan pop-up untuk mencetak dokumen.');return}
 let a=null;
 try{
  const {data,error}=await sb.from('field_activities').select('signatory_rank').eq('id',id).maybeSingle();
  if(error)throw error;a=data||{};
 }catch(e){try{popup.close()}catch(_){};alert(e?.message||String(e));return}
 const rank=String(a?.signatory_rank||'').trim();
 const originalWrite=popup.document.write.bind(popup.document);
 popup.document.write=html=>{
  let out=String(html||'');
  // Template lama: Jabatan <br> Unit Kerja <br> tanda tangan/nama.
  // Hapus baris Unit Kerja hanya pada blok tanda tangan .tte.
  out=out.replace(/(<div class="tte">)([^<]*)(<br>)([^<]*)(<br>)/,(_m,start,title,br)=>`${start}${title}${br}`);
  // Pangkat harus berada tepat di atas NIP.
  if(rank){
   out=out.replace(/(<b><u>[\s\S]*?<\/u><\/b>)<br>NIP\s*/g,`$1<br>${esc(rank)}<br>NIP `);
  }
  return originalWrite(out);
 };
 const savedOpen=window.open;
 window.open=()=>popup;
 try{originalPrint(id,type)}finally{window.open=savedOpen}
};
})();
