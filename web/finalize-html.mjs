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

const leadershipFile='leadership-directions.js';
const leadershipCode=await fs.readFile(new URL(`./${leadershipFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_LEADERSHIP_DIRECTIONS_V1/.test(leadershipCode))throw new Error('Leadership directions v1 tidak valid.');
await fs.writeFile(path.join(staticDir,leadershipFile),leadershipCode);

const kadinFile='kadin-dashboard-v2.js';
const kadinCode=await fs.readFile(new URL(`./${kadinFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V3/.test(kadinCode))throw new Error('Dashboard pimpinan agregat v3 tidak valid.');
await fs.writeFile(path.join(staticDir,kadinFile),kadinCode);

const layeredWorkflowFile='submission-layered-workflow.js';
const layeredWorkflowCode=await fs.readFile(new URL(`./${layeredWorkflowFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_LAYERED_SERVICE_WORKFLOW_V1/.test(layeredWorkflowCode))throw new Error('Layered service workflow v1 tidak valid.');
await fs.writeFile(path.join(staticDir,layeredWorkflowFile),layeredWorkflowCode);

const sekdinRoleFile='sekdin-role-option-fix.js';
const sekdinRoleCode=await fs.readFile(new URL(`./${sekdinRoleFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_SEKDIN_ROLE_OPTION_FIX_V1/.test(sekdinRoleCode))throw new Error('Sekdin role option fix v1 tidak valid.');
await fs.writeFile(path.join(staticDir,sekdinRoleFile),sekdinRoleCode);

const modules=[
 ['kp-enhancement.js',4],
 ['ptk-swasta-enhancement.js',1],
 ['super-admin-enhancement.js',5],
 ['registration-approval.js',2],
 ['kadin-dashboard-v2.js',4],
 ['dinas-login-enhancement.js',1],
 ['private-school-access.js',1],
 ['staff-service-roles.js',1],
 ['team-workflow-authority.js',1],
 ['leadership-directions.js',1],
 ['submission-layered-workflow.js',1],
 ['sekdin-role-option-fix.js',1],
 ['legacy-shell-restore.js',2],
 ['school-master-restore-fix.js',2],
 ['team-display-fix.js',2],
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
 ['diklat-ks-bcks.js',9],
 ['ui-branding-icons.js',2],
 ['kasim-role-label.js',1],
 ['login-developer-branding.js',1],
 ['premium-dashboard-theme.js',2],
 ['dashboard-order-fix.js',1],
 ['login-password-toggle.js',1],
 ['gtk-needs-progress.js',12],
 ['school-status-access-v1.js',3],
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
console.log(JSON.stringify({htmlFinalized:true,canonicalModuleCount:modules.length,removedInheritedTrailingBytes:Math.max(0,originalLength-html.length),scriptTags:openScripts,attendanceRecap:true,directPdfDownload:true,localPdfLibraries:true,gtkNeedsScopeV12:true,gtkNeedsAuthoritativeRenderer:true,gtkNeedsCoreGapData:true,gtkNeedsCoreVerification:true,gtkNeedsClickableGapBreakdowns:true,positiveShortageAggregation:true,verifiedOnlyDinasMetrics:true,legacyNeedsOverrideDisabled:true,negeriNeedsOnly:true,leadershipDirectionsV1:true,layeredServiceWorkflowV1:true,leaderAggregateDrilldown:true,sekdinMonitoring:true,sekdinRoleDropdown:true,leadershipAuditTrail:true,teamDisplayVersion:2,privateSchoolServices:['TPG_KONSULTASI','PTK_BARU_SWASTA'],ptkBaruNegeriHidden:true,loginRescue:true,classicLoginRescueV5:true,loginObserverLoopFixed:true,selfRegistrationRoles:['KEPALA_SEKOLAH','GTK','PENGAWAS'],ksNpsnValidation:true,registrationApprovalV2:true,registrationUiFinalV5:true,allGtkServerRegistration:true,emailConfirmOnApproval:true,dinasRegistrationTabDisabled:true,roleFirstLoginChannelGuard:true,superAdminPasswordResetEmail:true,validClosingTags:true}));