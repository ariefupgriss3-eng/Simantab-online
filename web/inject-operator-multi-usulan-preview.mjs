/* SIMANTAB_OPERATOR_QA_BUILD_GATE_V1
 * Appends the inert QA preview only if an explicit build-time flag is set.
 * The feature cannot submit, upload or call Supabase regardless of this flag.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
const enabled=process.env.SIMANTAB_OPERATOR_QA_PREVIEW === '1';
if(!enabled){
 console.log(JSON.stringify({operatorQaPreview:'DISABLED',reason:'build flag not set'}));
} else {
 const src=new URL('./operator-multi-usulan-preview.js',import.meta.url);
 const js=await fs.readFile(src,'utf8');
 if(!js.includes('SIMANTAB_OPERATOR_MULTI_USULAN_PREVIEW_V1') ||
    !js.includes('NO_BACKEND') && !js.includes('no fetch/storage/Supabase writes')) {
  throw new Error('Unsafe/unknown operator preview module.');
 }
 const file='.vercel/output/static/index.html';
 let html=await fs.readFile(file,'utf8');
 if(!html.includes('</body>'))throw new Error('Missing closing body.');
 if(html.includes('SIMANTAB_OPERATOR_QA_PREVIEW_ENABLED'))throw new Error('Preview already injected.');
 const script='<script>/* SIMANTAB_OPERATOR_QA_PREVIEW_ENABLED */window.__SIMANTAB_OPERATOR_QA_PREVIEW__=true;</script>\n'+
   '<script src="./operator-multi-usulan-preview.js?v=1" defer></script>\n';
 html=html.replace('</body>',script+'</body>');
 await fs.writeFile(path.join('.vercel/output/static','operator-multi-usulan-preview.js'),js);
 await fs.writeFile(file,html);
 console.log(JSON.stringify({operatorQaPreview:'ENABLED',mode:'INERT_NO_BACKEND',productionDeployAllowed:false}));
}
