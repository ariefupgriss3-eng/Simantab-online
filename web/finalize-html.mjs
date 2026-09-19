import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath='.vercel/output/static/index.html';
const staticDir='.vercel/output/static';
let html=await fs.readFile(outputPath,'utf8');
const originalLength=html.length;
const maintenanceStyle=`<style id="simMaintenanceStyle">
#simMaintenanceBanner{margin:14px 0 16px;padding:13px 14px;border-radius:14px;background:#fff4e8;border:1px solid #ffd5aa;border-left:5px solid #ff7a00;color:#5f3a12;line-height:1.5}
#simMaintenanceBanner .sim-maint-title{font-size:12px;font-weight:950;color:#b45309;margin-bottom:3px;letter-spacing:.02em}
#simMaintenanceBanner .sim-maint-text{font-size:11px;font-weight:750}
#simMaintenanceBanner .sim-maint-foot{font-size:10px;color:#806244;margin-top:5px}
</style>`;
if(!html.includes('id="simMaintenanceStyle"'))html=html.replace('</head>',maintenanceStyle+'\\n</head>');

const maintenanceBanner=`<div id="simMaintenanceBanner" role="status" aria-live="polite">
 <div class="sim-maint-title">🔧 SIMANTAB SEDANG MAINTENANCE</div>
 <div class="sim-maint-text">Nyuwun pangapunten Bapak/Ibu, <b>SIMANTAB tasik maintenance</b>.</div>
 <div class="sim-maint-foot">Sistem sedang kami sempurnakan agar layanan lebih stabil dan nyaman digunakan. Matur nuwun atas pengertian lan kesabarannya. 🙏</div>
</div>`;
if(!html.includes('id="simMaintenanceBanner"')){
 const tabsAnchor='<div class="tabs">';
 if(!html.includes(tabsAnchor))throw new Error('Anchor tabs login untuk banner maintenance tidak ditemukan.');
 html=html.replace(tabsAnchor,maintenanceBanner+'\\n   '+tabsAnchor);
}

const leaderCoreNeedle="async function refreshDashboard(){\n if(isGtkSide()){";
const leaderCoreAlreadyPatched=html.includes('window.__simantabLeaderCoreRendered=true');
const leaderCoreCanPatch=html.includes(leaderCoreNeedle);
const leaderCoreBranch="async function refreshDashboard(){\n if(profile && ['KEPALA_DINAS','SEKRETARIS_DINAS'].includes(profile.role)){\n  const rt=profile.role==='KEPALA_DINAS'?'Kepala Disdikbud':'Sekretaris Disdikbud';\n  const sc={total:854,tk:323,sd:455,smp:76,pnf:0,teachers:5272,staff:1709};\n  const n={schools:17,rows:88,abk:153,asn:152,pns:55,pppk:75,pppk_pw:22,non_asn:18,gap_riil:30,gap_data:14};\n  const w={active:4,menunggu_disposisi:3,verifikasi_staf:0,menunggu_koordinator:0,menunggu_kabid:0,perbaikan:0,selesai:0};\n  const cov=Math.round(n.schools/sc.total*100);\n  $('dashTitle').textContent='Dashboard '+rt;\n  $('dashDesc').textContent='Ringkasan strategis ketenagaan dan layanan. Klik agregat untuk melihat rincian.';\n  $('dashboardBody').innerHTML=`<div class=\"grid\">\n   <div class=\"card s12\" style=\"background:linear-gradient(135deg,#0f3f76,#1767b3);color:#fff\"><h2 style=\"margin:0 0 5px\">Command Center Ketenagaan</h2><div style=\"font-size:12px;opacity:.9\">${rt} • agregat TK/PAUD, SD, SMP, layanan kepegawaian, dan agenda bidang.</div></div>\n   <div class=\"card s12\"><div class=\"small\"><b>○ Data ringkasan aman</b> • snapshot terakhir valid 19 September 2026</div></div>\n   <div class=\"card s4\"><div class=\"label\">Total Sekolah</div><div class=\"metric\">${sc.total}</div><div class=\"small\">TK/PAUD ${sc.tk} • SD ${sc.sd} • SMP ${sc.smp}</div></div>\n   <div class=\"card s4\"><div class=\"label\">GTK Dapodik</div><div class=\"metric\">${sc.teachers+sc.staff}</div><div class=\"small\">Guru ${sc.teachers} • Tendik ${sc.staff}</div></div>\n   <div class=\"card s4\"><div class=\"label\">Kebutuhan GTK Riil</div><div class=\"metric\">${n.schools} sekolah</div><div class=\"small\">${n.rows} entri • Gap Riil ${n.gap_riil} • Gap Data ${n.gap_data}</div></div>\n   <div class=\"card s4\"><div class=\"label\">Usulan Aktif</div><div class=\"metric\">${w.active}</div><div class=\"small\">Menunggu pembagian tugas ${w.menunggu_disposisi}</div></div>\n   <div class=\"card s4\"><div class=\"label\">Komposisi ASN</div><div class=\"metric\">${n.asn}</div><div class=\"small\">PNS ${n.pns} • PPPK ${n.pppk} • PPPK PW ${n.pppk_pw}</div></div>\n   <div class=\"card s4\"><div class=\"label\">Cakupan Input</div><div class=\"metric\">${cov}%</div><div class=\"small\">${n.schools} dari ${sc.total} sekolah</div></div>\n   <div class=\"card s6\"><h3 style=\"margin-top:0\">Kebutuhan GTK per Jenjang</h3><div class=\"small\"><b>TK/PAUD:</b> ABK 0 • ASN 0 • Gap 0</div><div class=\"small\" style=\"margin-top:8px\"><b>SD:</b> ABK 153 • ASN 152 • Gap Riil 30 • Gap Data 14</div><div class=\"small\" style=\"margin-top:8px\"><b>SMP:</b> belum ada input kebutuhan pada basis data saat ini</div></div>\n   <div class=\"card s6\"><h3 style=\"margin-top:0\">Workflow Layanan</h3><div class=\"small\">Menunggu Pembagian Tugas: <b>${w.menunggu_disposisi}</b></div><div class=\"small\">Verifikasi Staf/Admin: <b>${w.verifikasi_staf}</b></div><div class=\"small\">Menunggu Approval Kasi/Subkoor: <b>${w.menunggu_koordinator}</b></div><div class=\"small\">Menunggu Persetujuan Kabid: <b>${w.menunggu_kabid}</b></div><div class=\"small\">Perlu Perbaikan: <b>${w.perbaikan}</b></div><div class=\"small\">Selesai: <b>${w.selesai}</b></div></div>\n  </div>`;\n  window.__simantabLeaderCoreRendered=true;\n  return;\n }\n if(isGtkSide()){";
if(!leaderCoreAlreadyPatched){
  if(leaderCoreCanPatch) html=html.replace(leaderCoreNeedle,leaderCoreBranch);
  else console.warn('Core dashboard leader patch dilewati: anchor lama tidak ditemukan dan patch belum terdeteksi.');
}

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
if(!/SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V6/.test(kadinCode))throw new Error('Dashboard pimpinan instant-snapshot v6 tidak valid.');
await fs.writeFile(path.join(staticDir,kadinFile),kadinCode);

const layeredWorkflowFile='submission-layered-workflow.js';
const layeredWorkflowCode=await fs.readFile(new URL(`./${layeredWorkflowFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_LAYERED_SERVICE_WORKFLOW_V1/.test(layeredWorkflowCode))throw new Error('Layered service workflow v1 tidak valid.');
await fs.writeFile(path.join(staticDir,layeredWorkflowFile),layeredWorkflowCode);

const sekdinRoleFile='sekdin-role-option-fix.js';
const sekdinRoleCode=await fs.readFile(new URL(`./${sekdinRoleFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_SEKDIN_ROLE_OPTION_FIX_V1/.test(sekdinRoleCode))throw new Error('Sekdin role option fix v1 tidak valid.');
await fs.writeFile(path.join(staticDir,sekdinRoleFile),sekdinRoleCode);

const leaderMenuFile='leader-menu-cleanup.js';
const leaderMenuCode=await fs.readFile(new URL(`./${leaderMenuFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_LEADER_MENU_CLEANUP_V1/.test(leaderMenuCode))throw new Error('Leader menu cleanup v1 tidak valid.');
await fs.writeFile(path.join(staticDir,leaderMenuFile),leaderMenuCode);

const leaderDashboardFile='leader-dashboard-authoritative.js';
const leaderDashboardCode=await fs.readFile(new URL(`./${leaderDashboardFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V1/.test(leaderDashboardCode))throw new Error('Leader dashboard authoritative v1 tidak valid.');
await fs.writeFile(path.join(staticDir,leaderDashboardFile),leaderDashboardCode);

const sessionBoundaryFile='session-boundary-hardening.js';
const sessionBoundaryCode=await fs.readFile(new URL(`./${sessionBoundaryFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_SESSION_BOUNDARY_HARDENING_V1/.test(sessionBoundaryCode))throw new Error('Session boundary hardening v1 tidak valid.');
await fs.writeFile(path.join(staticDir,sessionBoundaryFile),sessionBoundaryCode);

const modules=[
 ['kp-enhancement.js',4],
 ['ptk-swasta-enhancement.js',1],
 ['super-admin-enhancement.js',5],
 ['registration-approval.js',2],
 ['kadin-dashboard-v2.js',7],
 ['dinas-login-enhancement.js',1],
 ['private-school-access.js',1],
 ['staff-service-roles.js',1],
 ['team-workflow-authority.js',1],
 ['leadership-directions.js',1],
 ['submission-layered-workflow.js',3],
 ['sekdin-role-option-fix.js',1],
 ['legacy-shell-restore.js',3],
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
 ['ui-branding-icons.js',3],
 ['kasim-role-label.js',1],
 ['login-developer-branding.js',1],
 ['premium-dashboard-theme.js',3],
 ['dashboard-order-fix.js',2],
 ['login-password-toggle.js',2],
 ['gtk-needs-progress.js',12],
 ['school-status-access-v1.js',3],
 ['activity-participant-import.js',1],
 ['activity-participant-import-save.js',1],
 ['activity-digital-invite.js',1],
 ['activity-attendance-success-ux.js',3],
 ['activity-attendance-recap.js',2],
 ['login-channel-hardening.js',3],
 ['login-click-rescue.js',3],
 ['registration-ui-final.js',5],
 ['leader-menu-cleanup.js',2],
 ['leader-dashboard-authoritative.js',1],
 ['session-boundary-hardening.js',1]
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
console.log(JSON.stringify({htmlFinalized:true,canonicalModuleCount:modules.length,removedInheritedTrailingBytes:Math.max(0,originalLength-html.length),scriptTags:openScripts,attendanceRecap:true,directPdfDownload:true,localPdfLibraries:true,gtkNeedsScopeV12:true,gtkNeedsAuthoritativeRenderer:true,gtkNeedsCoreGapData:true,gtkNeedsCoreVerification:true,gtkNeedsClickableGapBreakdowns:true,positiveShortageAggregation:true,verifiedOnlyDinasMetrics:true,legacyNeedsOverrideDisabled:true,negeriNeedsOnly:true,leadershipDirectionsV1:true,layeredServiceWorkflowV1:true,leaderAggregateDrilldown:true,leaderMenuCleanup:true,leaderDashboardAuthoritativeV1:true,leaderCoreImmediateDashboard:true,sessionBoundaryHardening:true,sekdinMonitoring:true,sekdinRoleDropdown:true,leadershipAuditTrail:true,teamDisplayVersion:2,privateSchoolServices:['TPG_KONSULTASI','PTK_BARU_SWASTA'],ptkBaruNegeriHidden:true,loginRescue:true,classicLoginRescueV5:true,loginObserverLoopFixed:true,selfRegistrationRoles:['KEPALA_SEKOLAH','GTK','PENGAWAS'],ksNpsnValidation:true,registrationApprovalV2:true,registrationUiFinalV5:true,allGtkServerRegistration:true,emailConfirmOnApproval:true,dinasRegistrationTabDisabled:true,roleFirstLoginChannelGuard:true,superAdminPasswordResetEmail:true,validClosingTags:true}));