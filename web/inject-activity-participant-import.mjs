import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const modules=['activity-participant-import.js','activity-participant-import-save.js'];
let html=await fs.readFile(outputPath,'utf8');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
let tags='';
for(const name of modules){
 const path=new URL(`./${name}`,import.meta.url);
 const code=await fs.readFile(path,'utf8');
 const marker=name==='activity-participant-import.js'?'SIMANTAB_ACTIVITY_PARTICIPANT_IMPORT_V1':'SIMANTAB_ACTIVITY_PARTICIPANT_IMPORT_SAVE_V1';
 if(!code.includes(marker))throw new Error(`Modul ${name} tidak valid.`);
 const re=new RegExp(`<script type="module" src="\\./${name.replace('.','\\.')}\\?v=\\d+"><\\/script>\\s*`,'g');
 html=html.replace(re,'');
 tags+=`<script type="module" src="./${name}?v=1"></script>\n`;
 await fs.writeFile(`.vercel/output/static/${name}`,code);
}
html=html.slice(0,bodyClose)+tags+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({activityParticipantImport:true,formats:['csv','tsv','txt','xlsx','xls','ods','pdf-text','docx','json'],mapping:['name','nip','unit','position','email','phone'],previewBeforeApply:true,structuredMetadata:true,productionUntouched:true}));
