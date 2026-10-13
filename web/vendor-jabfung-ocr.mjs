/* SIMANTAB_VENDOR_FREE_JABFUNG_OCR_V1_20261013
 * Copy open-source OCR assets from pinned npm packages into the existing
 * same-origin Vercel output. No third-party runtime JS or language downloads.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const out='.vercel/output/static/ocr';
const from='node_modules';
await fs.mkdir(path.join(out,'core'),{recursive:true});
await fs.mkdir(path.join(out,'lang'),{recursive:true});

async function copy(src,dst){
 const bytes=await fs.readFile(src);
 if(bytes.length<100)throw new Error('OCR vendor file empty: '+src);
 await fs.mkdir(path.dirname(dst),{recursive:true});
 await fs.writeFile(dst,bytes);
 return bytes.length;
}
const copied={};
for(const [source,target] of [
 ['pdfjs-dist/build/pdf.mjs','pdf.mjs'],
 ['pdfjs-dist/build/pdf.worker.mjs','pdf.worker.mjs'],
 ['tesseract.js/dist/tesseract.esm.min.js','tesseract.esm.min.js'],
 ['tesseract.js/dist/worker.min.js','tesseract.worker.min.js']
]){
 copied[target]=await copy(path.join(from,source),path.join(out,target));
}
let coreRoot=path.join(from,'tesseract.js-core');
try{await fs.access(coreRoot)}catch{coreRoot=path.join(from,'tesseract.js/node_modules/tesseract.js-core')}
const cores=(await fs.readdir(coreRoot)).filter(name=>/^tesseract-core.*\.(?:js|wasm)$/.test(name));
for(const name of cores)copied['core/'+name]=await copy(path.join(coreRoot,name),path.join(out,'core',name));
for(const suffix of ['.wasm.js','.wasm']){
 if(!cores.some(name=>name.endsWith(suffix)))throw new Error('Tesseract core missing '+suffix);
}
async function findLang(dir,lang,depth=0){
 if(depth>4)return null;
 for(const ent of await fs.readdir(dir,{withFileTypes:true})){
  if(ent.isFile()&&ent.name===lang+'.traineddata.gz')return path.join(dir,ent.name);
  if(ent.isDirectory()){
   const found=await findLang(path.join(dir,ent.name),lang,depth+1);
   if(found)return found;
  }
 }
 return null;
}
for(const lang of ['eng','ind']){
 const dataDir=path.join(from,'@tesseract.js-data',lang);
 const source=await findLang(dataDir,lang);
 if(!source)throw new Error('Local OCR '+lang+'.traineddata.gz missing in npm package.');
 copied['lang/'+lang+'.traineddata.gz']=await copy(source,
   path.join(out,'lang',lang+'.traineddata.gz'));
}
console.log(JSON.stringify({ocrVendoredFromPinnedNpm:true,files:copied,thirdPartyRuntimeCalls:false}));
