import fs from 'node:fs/promises';
import path from 'node:path';

const staticDir='.vercel/output/static';
const copies=[
  ['node_modules/jspdf/dist/jspdf.umd.min.js','jspdf.umd.min.js'],
  ['node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js','jspdf.plugin.autotable.min.js']
];
for(const [source,target] of copies){
  const bytes=await fs.readFile(source);
  if(bytes.length<1000)throw new Error(`Library PDF tidak valid: ${source}`);
  await fs.writeFile(path.join(staticDir,target),bytes);
}
console.log(JSON.stringify({pdfLibrariesLocal:true,jspdf:true,autoTable:true}));
