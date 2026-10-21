import fs from 'node:fs/promises';
import path from 'node:path';

/* SIMANTAB_GTK_BULK_APPROVAL_INJECTOR_V1 */
const output = '.vercel/output/static';
const filename=path.join(output,'index.html');
let html=await fs.readFile(filename,'utf8');
const source=await fs.readFile(new URL('./gtk-bulk-approval.js',import.meta.url),'utf8');
if(!source.includes('SIMANTAB_GTK_BULK_APPROVAL_UI_V1') ||
   !source.includes('verified_identity_and_role:true') ||
   !source.includes('simantab-gtk-bulk-approval'))
  throw new Error('Modul persetujuan agregat tidak sah');
if(!html.includes('./duplicate-nip-audit.js?v=1'))
  throw new Error('Panel audit NIP Super Admin belum tersedia');
const tag='<script type="module" src="./gtk-bulk-approval.js?v=1"></script>';
html=html.replace(/<script type="module" src="\.\/gtk-bulk-approval\.js\?v=\d+"><\/script>\s*/g,'');
const pos=html.lastIndexOf('</body>');
if(pos<0) throw new Error('HTML body belum lengkap');
html=html.slice(0,pos)+tag+'\n'+html.slice(pos);
await fs.writeFile(path.join(output,'gtk-bulk-approval.js'),source,'utf8');
await fs.writeFile(filename,html,'utf8');
console.log(JSON.stringify({gtkBulkApproval:true,superAdminOnly:true,
  explicitSelection:true,duplicateBlocked:true,serverApproval:true}));
