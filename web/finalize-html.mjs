import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
let html=await fs.readFile(outputPath,'utf8');
const originalLength=html.length;
const htmlClose=html.indexOf('</html>');
if(htmlClose<0)throw new Error('Tag </html> tidak ditemukan.');
html=html.slice(0,htmlClose+7);
const bodyMatches=html.match(/<\/body>/g)||[];
const htmlMatches=html.match(/<\/html>/g)||[];
const openScripts=(html.match(/<script\b/g)||[]).length;
const closeScripts=(html.match(/<\/script>/g)||[]).length;
if(bodyMatches.length!==1)throw new Error(`Struktur HTML tidak valid: </body> = ${bodyMatches.length}`);
if(htmlMatches.length!==1)throw new Error(`Struktur HTML tidak valid: </html> = ${htmlMatches.length}`);
if(openScripts!==closeScripts)throw new Error(`Tag script tidak seimbang: buka=${openScripts}, tutup=${closeScripts}`);
for(const ref of [
 './login-channel-hardening.js?v=2',
 './activity-digital-invite.js?v=1',
 './activity-attendance-success-ux.js?v=2',
 './activity-participant-import.js?v=1',
 './diklat-ks-bcks.js?v=6'
]){
 const count=html.split(ref).length-1;
 if(count!==1)throw new Error(`Referensi ${ref} harus tepat 1, ditemukan ${count}`);
}
await fs.writeFile(outputPath,html+'\n');
console.log(JSON.stringify({htmlFinalized:true,trimmedTrailingBytes:Math.max(0,originalLength-html.length),scriptTags:openScripts,validClosingTags:true}));
