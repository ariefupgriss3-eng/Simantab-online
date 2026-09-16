import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath='.vercel/output/static/index.html';
const staticDir='.vercel/output/static';
let html=await fs.readFile(outputPath,'utf8');
const originalLength=html.length;

const bodyClose=html.indexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');

let headAndBody=html.slice(0,bodyClose);
// Hapus seluruh tag script module eksternal yang sudah tersusun/terduplikasi,
// tetapi pertahankan script inline utama aplikasi.
headAndBody=headAndBody.replace(/<script\s+type="module"\s+src="\.\/[^\"]+"\s*><\/script>\s*/g,'');

const modules=[
 ['kp-enhancement.js',4],
 ['ptk-swasta-enhancement.js',1],
 ['super-admin-enhancement.js',3],
 ['kadin-dashboard-v2.js',3],
 ['dinas-login-enhancement.js',1],
 ['private-school-access.js',1],
 ['staff-service-roles.js',1],
 ['team-workflow-authority.js',1],
 ['legacy-shell-restore.js',2],
 ['school-master-restore-fix.js',2],
 ['team-display-fix.js',1],
 ['admin-data-summary-fix.js',1],
 ['team-multi-capability.js',1],
 ['activity-input-access.js',1],
 ['tpg-consultation.js',1],
 ['sk-plt-enhancement.js',1],
 ['activity-schedule-committee.js',1],
 ['activity-responsible-signatory-fix.js',1],
 ['activity-report-signatory-fix.js',1],
 ['discipline-evidence.js',4],
 ['pengawas-nip-tcs-link.js',1],
 ['simanteb-branding.js',1],
 ['pengawas-menu-scope.js',2],
 ['pengawas-login-channel.js',1],
 ['pengawas-dashboard-kadin.js',2],
 ['korwil-scope-dashboard.js',3],
 ['korwil-dashboard-title.js',1],
 ['cuti-requirements.js',1],
 ['super-admin-merge-pengawas.js',1],
 ['diklat-ks-bcks.js',6],
 ['ui-branding-icons.js',2],
 ['kasim-role-label.js',1],
 ['login-developer-branding.js',1],
 ['premium-dashboard-theme.js',2],
 ['dashboard-order-fix.js',1],
 ['login-password-toggle.js',1],
 ['gtk-needs-progress.js',1],
 ['activity-participant-import.js',1],
 ['activity-participant-import-save.js',1],
 ['activity-digital-invite.js',1],
 ['activity-attendance-success-ux.js',3],
 ['activity-attendance-recap.js',1],
 ['login-channel-hardening.js',2],
 ['login-click-rescue.js',1]
];

for(const [file] of modules){
 try{await fs.access(path.join(staticDir,file));}
 catch{throw new Error(`File modul wajib tidak ditemukan pada output build: ${file}`)}
}

const moduleTags=modules.map(([file,v])=>`<script type="module" src="./${file}?v=${v}"></script>`).join('\n');
html=`${headAndBody.trimEnd()}\n${moduleTags}\n</body>\n</html>\n`;

const bodyMatches=html.match(/<\/body>/g)||[];
const htmlMatches=html.match(/<\/html>/g)||[];
const openScripts=(html.match(/<script\b/g)||[]).length;
const closeScripts=(html.match(/<\/script>/g)||[]).length;
if(bodyMatches.length!==1)throw new Error(`Struktur HTML tidak valid: </body> = ${bodyMatches.length}`);
if(htmlMatches.length!==1)throw new Error(`Struktur HTML tidak valid: </html> = ${htmlMatches.length}`);
if(openScripts!==closeScripts)throw new Error(`Tag script tidak seimbang: buka=${openScripts}, tutup=${closeScripts}`);
for(const [file,v] of modules){
 const ref=`./${file}?v=${v}`;
 const count=html.split(ref).length-1;
 if(count!==1)throw new Error(`Referensi ${ref} harus tepat 1, ditemukan ${count}`);
}

await fs.writeFile(outputPath,html);
console.log(JSON.stringify({
 htmlFinalized:true,
 canonicalModuleCount:modules.length,
 removedInheritedTrailingBytes:Math.max(0,originalLength-html.length),
 scriptTags:openScripts,
 attendanceRecap:true,
 loginRescue:true,
 validClosingTags:true
}));
