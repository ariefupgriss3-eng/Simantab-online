/* Standalone synthetic test file generator. Never transmits or persists user files. */
(function(){
 'use strict';
 const input=document.getElementById('file');
 const fileName=document.getElementById('fileName');
 const run=document.getElementById('run');
 const status=document.getElementById('status');
 const buttons=[...document.querySelectorAll('[data-test]')];
 function select(file,code,selected){
  const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;
  input.dataset.code=code;
  fileName.textContent=file.name+' · '+file.size.toLocaleString('id-ID')+' byte';
  buttons.forEach(x=>x.classList.toggle('selected',x.dataset.test===selected));
  status.textContent='Berkas siap diperiksa.';
 }
 function makeImage(title){
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=500;
  const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,1600,500);
  c.fillStyle='#071b33';c.font='bold 68px Arial';c.fillText(title,45,115);
  c.font='48px Arial';c.fillText('Dokumen contoh sintetis untuk pengujian',45,216);
  c.fillText('Petugas tetap memeriksa keputusan resmi',45,303);
  c.fillText('Tanpa identitas pegawai dan tanda tangan',45,391);
  return canvas;
 }
 async function loadTest(kind){
  if(kind==='empty'){select(new File([],'KOSONG.pdf',{type:'application/pdf'}),'SKP_2025',kind);return}
  if(kind==='png'){
   const img=makeImage('IJAZAH GURU PENDIDIKAN 2025');
   const blob=await new Promise((yes,no)=>img.toBlob(x=>x?yes(x):no(Error('PNG gagal')),'image/png'));
   select(new File([blob],'IJAZAH_UJI_SINTETIS.png',{type:'image/png'}),'IJAZAH',kind);return;
  }
  if(!window.jspdf?.jsPDF)throw Error('Pustaka PDF tidak tersedia');
  const pdf=new window.jspdf.jsPDF({unit:'pt'});
  if(kind==='pdf-scan'){
   const img=makeImage('SASARAN KINERJA PEGAWAI 2025');
   pdf.addImage(img.toDataURL('image/png'),'PNG',35,80,540,169);
  }else{
   pdf.setFont('helvetica','bold');pdf.setFontSize(17);
   pdf.text('SASARAN KINERJA PEGAWAI TAHUN 2025',40,90);
   pdf.setFont('helvetica','normal');pdf.setFontSize(12);
   pdf.text('Dokumen sintetis untuk uji lokal SIMANTAB.',40,135);
   pdf.text('Indikator sasaran pekerjaan guru untuk tahun 2025.',40,166);
   pdf.text('Semua informasi hanya untuk pemeriksaan OCR.',40,197);
  }
  select(new File([pdf.output('arraybuffer')],kind==='pdf-scan'?'SKP_2025_SCAN_UJI.pdf':'SKP_2025_TEKS_UJI.pdf',{type:'application/pdf'}),'SKP_2025',kind);
 }
 for(const b of buttons){b.addEventListener('click',async()=>{
  try{b.disabled=true;await loadTest(b.dataset.test)}catch{status.textContent='Gagal menyiapkan berkas sintetis.'}
  finally{b.disabled=false}
 })}
 input.addEventListener('change',()=>{
  const f=input.files?.[0];fileName.textContent=f?f.name+' · '+f.size+' byte':'Belum ada berkas';
  input.dataset.code='SKP_2025';buttons.forEach(x=>x.classList.remove('selected'))
 });
 run.addEventListener('click',async()=>{
  if(!input.files?.length){status.textContent='Pilih berkas lebih dahulu.';return}
  run.disabled=true;status.textContent='Memeriksa secara lokal tanpa server AI...';
  try{
   for(let i=0;i<50;i++){
    if(typeof window.__verifyJabfungFreeFromForm==='function'){
     await window.__verifyJabfungFreeFromForm();
     status.textContent='Selesai. Lihat panel hasil OCR.';return;
    }
    await new Promise(yes=>setTimeout(yes,100));
   }
   throw Error('OCR belum siap');
  }catch{status.textContent='OCR belum berhasil. Muat ulang atau periksa pustaka lokal.'}
  finally{run.disabled=false}
 });
})();
