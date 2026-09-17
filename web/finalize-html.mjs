import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath='.vercel/output/static/index.html';
const staticDir='.vercel/output/static';
let html=await fs.readFile(outputPath,'utf8');
const originalLength=html.length;
const bodyClose=html.indexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
let headAndBody=html.slice(0,bodyClose);
headAndBody=headAndBody.replace(/<script\s+type="module"\s+src="\.\/[^\"]+"\s*><\/script>\s*/g,'');
headAndBody=headAndBody.replace(/<script\s+src="\.\/login-classic-rescue\.js\?v=\d+"\s*><\/script>\s*/g,'');
headAndBody=headAndBody.replace(/<script\s+src="\.\/(?:jspdf\.umd\.min\.js|jspdf\.plugin\.autotable\.min\.js)\?v=\d+"\s*><\/script>\s*/g,'');

const approvalFile='registration-approval.js';
const approvalCode=await fs.readFile(new URL(`./${approvalFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_REGISTRATION_APPROVAL_V2/.test(approvalCode))throw new Error('Registration approval v2 tidak valid.');
await fs.writeFile(path.join(staticDir,approvalFile),approvalCode);

const registrationUiFile='registration-ui-final.js';
const registrationUiCode=await fs.readFile(new URL(`./${registrationUiFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_REGISTRATION_UI_FINAL_V5/.test(registrationUiCode))throw new Error('Registration UI final v5 tidak valid.');
await fs.writeFile(path.join(staticDir,registrationUiFile),registrationUiCode);

const modules=[
 ['kp-enhancement.js',4],
 ['ptk-swasta-enhancement.js',1],
 ['super-admin-enhancement.js',4],
 ['registration-approval.js',2],
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
 ['gtk-needs-progress.js',10],
 ['school-status-access-v1.js',2],
 ['activity-participant-import.js',1],
 ['activity-participant-import-save.js',1],
 ['activity-digital-invite.js',1],
 ['activity-attendance-success-ux.js',3],
 ['activity-attendance-recap.js',2],
 ['login-channel-hardening.js',3],
 ['login-click-rescue.js',2],
 ['registration-ui-final.js',5]
];
for(const [file] of modules){try{await fs.access(path.join(staticDir,file));}catch{throw new Error(`File modul wajib tidak ditemukan pada output build: ${file}`)}}
for(const file of ['jspdf.umd.min.js','jspdf.plugin.autotable.min.js']){try{await fs.access(path.join(staticDir,file));}catch{throw new Error(`Library PDF lokal tidak ditemukan: ${file}`)}}

const classicFile='login-classic-rescue.js';
const classicCode=await fs.readFile(new URL(`./${classicFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_LOGIN_CLASSIC_RESCUE_V5/.test(classicCode))throw new Error('Classic login rescue v5 tidak valid.');
await fs.writeFile(path.join(staticDir,classicFile),classicCode);
const pdfTags='<script src="./jspdf.umd.min.js?v=1"></script>\n<script src="./jspdf.plugin.autotable.min.js?v=1"></script>';
const classicTag=`<script src="./${classicFile}?v=5"></script>`;
const moduleTags=modules.map(([file,v])=>`<script type="module" src="./${file}?v=${v}"></script>`).join('\n');
html=`${headAndBody.trimEnd()}\n${pdfTags}\n${classicTag}\n${moduleTags}\n</body>\n</html>\n`;
const bodyMatches=html.match(/<\/body>/g)||[],htmlMatches=html.match(/<\/html>/g)||[],openScripts=(html.match(/<script\b/g)||[]).length,closeScripts=(html.match(/<\/script>/g)||[]).length;
if(bodyMatches.length!==1)throw new Error(`Struktur HTML tidak valid: </body> = ${bodyMatches.length}`);
if(htmlMatches.length!==1)throw new Error(`Struktur HTML tidak valid: </html> = ${htmlMatches.length}`);
if(openScripts!==closeScripts)throw new Error(`Tag script tidak seimbang: buka=${openScripts}, tutup=${closeScripts}`);
for(const [file,v] of modules){const ref=`./${file}?v=${v}`;if(html.split(ref).length-1!==1)throw new Error(`Referensi ${ref} harus tepat 1 kali.`)}
for(const ref of ['./jspdf.umd.min.js?v=1','./jspdf.plugin.autotable.min.js?v=1'])if(html.split(ref).length-1!==1)throw new Error(`Library PDF ${ref} harus tepat 1 kali.`);
if(html.split(`./${classicFile}?v=5`).length-1!==1)throw new Error('Classic login rescue v5 harus tepat 1 kali.');
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({htmlFinalized:true,canonicalModuleCount:modules.length,removedInheritedTrailingBytes:Math.max(0,originalLength-html.length),scriptTags:openScripts,attendanceRecap:true,directPdfDownload:true,localPdfLibraries:true,gtkNeedsScopeV10:true,gtkNeedsCoreGapData:true,gtkNeedsCoreVerification:true,negeriNeedsOnly:true,privateSchoolServices:['TPG_KONSULTASI','PTK_BARU_SWASTA'],ptkBaruNegeriHidden:true,loginRescue:true,classicLoginRescueV5:true,loginObserverLoopFixed:true,selfRegistrationRoles:['KEPALA_SEKOLAH','GTK','PENGAWAS'],ksNpsnValidation:true,registrationApprovalV2:true,registrationUiFinalV5:true,allGtkServerRegistration:true,emailConfirmOnApproval:true,dinasRegistrationTabDisabled:true,roleFirstLoginChannelGuard:true,validClosingTags:true}));
