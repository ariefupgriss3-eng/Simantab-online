/* SIMANTAB_JABFUNG_FREE_UI_V1_20261013
 * Optional local OCR precheck; never sends document bytes to any AI provider.
 * PDF.js/Tesseract libraries are loaded only when explicitly requested by user.
 * Runtime assets are copied from pinned npm dependencies and served from SIMANTAB origin.
 */
import {fileEligibility,verifyExtractedText,aggregateChecks,REQUIRED_LABELS} from './jabfung-free-verifier-core.mjs?v=1';

(async()=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<120 && (!window.__simantabSb||!window.__simantabProfile);i++)await sleep(50);
 const sb=window.__simantabSb;
 if(!sb)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let pdfLibPromise=null,ocrPromise=null,worker=null;
 // Pinned npm packages are copied to same-origin /ocr/ by vendor-jabfung-ocr.mjs.
 // No runtime loading of executable third-party scripts from a CDN.
 const libs={
   pdf:'./ocr/pdf.mjs',
   pdfWorker:new URL('./ocr/pdf.worker.mjs',import.meta.url).href,
   tesseract:'./ocr/tesseract.esm.min.js',
   worker:new URL('./ocr/tesseract.worker.min.js',import.meta.url).href,
   core:new URL('./ocr/core',import.meta.url).href,
   language:new URL('./ocr/lang',import.meta.url).href
 };
 const pdfjs=async()=>{
   if(!pdfLibPromise)pdfLibPromise=import(libs.pdf).then(m=>{
     m.GlobalWorkerOptions.workerSrc=libs.pdfWorker;return m
   });
   return pdfLibPromise;
 };
 const ocr=async()=>{
   if(!ocrPromise)ocrPromise=import(libs.tesseract).then(async mod=>{
     const create=mod.createWorker||mod.default?.createWorker;
     if(typeof create!=='function')throw new Error('OCR_LIBRARY_UNAVAILABLE');
     worker=await create('eng',1,{
       workerPath:libs.worker,corePath:libs.core,langPath:libs.language,
       gzip:true,workerBlobURL:false
     });
     return worker;
   });
   return ocrPromise;
 };
 const readTextFromPdf=async file=>{
   const lib=await pdfjs();
   const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
   const parts=[];let text='';
   try{
     for(let pageNo=1;pageNo<=Math.min(doc.numPages,3);pageNo++){
       const page=await doc.getPage(pageNo);
       const textContent=await page.getTextContent();
       text+=' '+textContent.items.map(i=>i.str||'').join(' ');
       if(text.trim().length>=2400)break;
       if(text.trim().length<100){
         // OCR on first two pages only to cap CPU work on mobile.
         if(pageNo>2)continue;
         const view=page.getViewport({scale:1.25});
         const canvas=document.createElement('canvas');
         canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
         const context=canvas.getContext('2d',{alpha:false});
         if(!context)throw new Error('CANVAS_UNAVAILABLE');
         await page.render({canvasContext:context,viewport:view}).promise;
         const engine=await ocr();
         const recognized=await engine.recognize(canvas);
         parts.push(recognized.data?.text||'');
         canvas.width=0;canvas.height=0;
       }
     }
   }finally{await doc.destroy()}
   return {text:text+' '+parts.join(' '),ocrConfidence:null};
 };
 const readTextFromImage=async file=>{
   const engine=await ocr();
   const r=await engine.recognize(file);
   return {text:r.data?.text||'',ocrConfidence:r.data?.confidence??null};
 };
 const scanFile=async({file,requirementCode,label})=>{
   const check=fileEligibility(file);
   if(!check.ok)return {
     requirementCode, label:label||REQUIRED_LABELS[requirementCode]||requirementCode,
     reviewStatus:'PERLU_TELAAH',reasons:[check.reason],advisoryOnly:true
   };
   try{
     const result=file.type==='application/pdf'?await readTextFromPdf(file):await readTextFromImage(file);
     return verifyExtractedText({requirementCode,text:result.text,ocrConfidence:result.ocrConfidence});
   }catch(error){
     // No content, filenames, NIP, signed URL or OCR text logged.
     return {requirementCode,label:label||REQUIRED_LABELS[requirementCode]||requirementCode,
       reviewStatus:'PERLU_TELAAH',reasons:['OCR_BELUM_BERHASIL'],
       advisoryOnly:true};
   }
 };
 let modal=null;
 function ensureModal(){
   if(modal)return modal;
   modal=document.createElement('div');
   modal.id='jabfungFreeVerifierModal';
   modal.style.cssText='position:fixed;inset:0;z-index:10010;background:rgba(15,35,60,.72);overflow:auto;padding:14px;display:none';
   modal.innerHTML='<div style="max-width:940px;margin:12px auto;padding:18px;background:#fff;border-radius:16px;color:#14253c"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px"><h2 style="margin:0">🔍 Verifikator Jabfung Gratis</h2><button id="jabfungFreeClose" class="btn soft">Tutup</button></div><p class="small">OCR berjalan di perangkat Anda. Hasil ini bukan keputusan administrasi, bukan pemeriksaan keaslian SK/TTE, dan tidak otomatis disimpan ke database.</p><div id="jabfungFreeProgress" class="small"></div><div id="jabfungFreeResults" class="tablewrap"></div></div>';
   document.body.appendChild(modal);
   modal.querySelector('#jabfungFreeClose').addEventListener('click',()=>{modal.style.display='none'});
   return modal;
 }
 async function run(items){
   const m=ensureModal(),progress=m.querySelector('#jabfungFreeProgress'),results=m.querySelector('#jabfungFreeResults');
   m.style.display='block';results.replaceChildren();
   if(!items.length){
     progress.textContent='Belum ada berkas. Pilih dokumen Jabfung sebelum menjalankan pemeriksaan.';return;
   }
   const result=[];
   for(let index=0;index<items.length;index++){
     progress.textContent='Memeriksa '+(index+1)+' dari '+items.length+' berkas secara lokal. Mohon tunggu...';
     result.push(await scanFile(items[index]));
   }
   const summary=aggregateChecks(result);
   progress.textContent='Selesai: '+summary.terbacaAwal+' indikasi terbaca; '+summary.perluTelaah+' perlu pemeriksaan petugas.';
   results.innerHTML='<table><thead><tr><th>Berkas</th><th>Rekomendasi</th><th>Catatan</th></tr></thead><tbody>'+
     result.map(x=>'<tr><td>'+esc(x.label||REQUIRED_LABELS[x.requirementCode]||x.requirementCode)+'</td>'+
       '<td>'+esc(x.reviewStatus==='TERBACA_AWAL'?'Terbaca awal':'Perlu telaah')+'</td>'+
       '<td>'+esc(x.reasons?.length?x.reasons.map(r=>({
         FILE_EMPTY:'Berkas kosong',FILE_TOO_LARGE:'Melebihi 1,5 MB',
         FILE_UNSUPPORTED:'Jenis berkas tidak didukung',TEKS_TIDAK_CUKUP:'Isi tidak terbaca cukup',
         JENIS_PERLU_DICEK:'Jenis dokumen perlu dicek',
         TAHUN_SKP_BELUM_TERBACA:'Tahun SKP tidak terbaca',
         NIP_PERLU_DICEK_MANUAL:'NIP perlu pemeriksaan manual',
         OCR_KURANG_JELAS:'OCR kurang jelas',
         OCR_BELUM_BERHASIL:'Pembacaan lokal belum berhasil'
       })[r]||'Perlu telaah').join('; '):'Periksa identitas, stempel, tanda tangan dan sumber resmi secara manual.')+'</td></tr>').join('')+'</tbody></table>';
 }
 window.__verifyJabfungFreeFromForm=async()=>{
   const selected=[...document.querySelectorAll('.jabfungReqFile')].filter(el=>!!el.files?.[0]);
   return run(selected.map(el=>({file:el.files[0],requirementCode:el.dataset.code,label:REQUIRED_LABELS[el.dataset.code]})));
 };
 window.__verifyJabfungFreeBySubmission=async submissionId=>{
   const id=String(submissionId||'');
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
     throw new Error('ID usulan tidak valid.');
   const m=ensureModal(),progress=m.querySelector('#jabfungFreeProgress');
   m.style.display='block';progress.textContent='Memeriksa izin berkas...';
   const {data:records,error}=await sb.from('submission_files')
     .select('requirement_code,storage_path,file_name,file_size,mime_type')
     .eq('submission_id',id).order('created_at',{ascending:false});
   if(error){progress.textContent='Akses berkas ditolak atau tidak tersedia.';return}
   const seen=new Set(),files=[];
   for(const rec of records||[]){
     if(!rec.requirement_code||seen.has(rec.requirement_code))continue;
     seen.add(rec.requirement_code);
     if(!rec.file_size||rec.file_size<1){
       files.push({file:null,requirementCode:rec.requirement_code,
         label:REQUIRED_LABELS[rec.requirement_code]||rec.requirement_code});continue;
     }
     const {data:signed,error:signedError}=await sb.storage.from('simantab-documents')
       .createSignedUrl(rec.storage_path,60);
     if(signedError||!signed?.signedUrl)continue;
     try{
       const response=await fetch(signed.signedUrl,{cache:'no-store'});
       if(!response.ok)continue;
       const bytes=await response.blob();
       files.push({file:new File([bytes],'dokumen-jabfung',{type:rec.mime_type||bytes.type}),
         requirementCode:rec.requirement_code,label:REQUIRED_LABELS[rec.requirement_code]||rec.requirement_code});
     }catch{ /* No raw URL, document content, or personal data in logs. */ }
   }
   return run(files);
 };
 window.addEventListener('pagehide',()=>{worker?.terminate?.()},{once:true});
 window.__simantabFreeJabfung={mode:'OCR_BROWSER_LOCAL',paidModelCalls:0,advisoryOnly:true,version:1};
})();
