import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath='.vercel/output/static/index.html';
const staticDir='.vercel/output/static';
let html=await fs.readFile(outputPath,'utf8');
const originalLength=html.length;
const simantabIconBase64='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';
const simantabIconFile='simantab-icon-192.png';
await fs.writeFile(path.join(staticDir,simantabIconFile),Buffer.from(simantabIconBase64,'base64'));

const simantabIconHref='./'+simantabIconFile+'?v=1';
// Bootstrap builds start from current production, so remove every prior icon-style injection first.
html=html.replace(/\\n\s*(?=<style id="simantabAppIconStyle">)/g,'');
html=html.replace(/<style id="simantabAppIconStyle">[\s\S]*?<\/style>\s*/g,'');
html=html.replace(/<link rel="icon"[^>]*>\s*/g,'').replace(/<link rel="apple-touch-icon"[^>]*>\s*/g,'');
html=html.replace('</head>',`<link rel="icon" type="image/png" href="${simantabIconHref}">
<link rel="apple-touch-icon" href="${simantabIconHref}">
<style id="simantabAppIconStyle">
.hero-badge,.mark{overflow:hidden;padding:0}
.hero-badge img,.mark img{width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit}
</style>
</head>`);
html=html.replace('<div class="hero-badge">S</div>',`<div class="hero-badge"><img src="${simantabIconHref}" alt="SIMANTAB"></div>`);
html=html.replace('<div class="mark">S</div>',`<div class="mark"><img src="${simantabIconHref}" alt="SIMANTAB"></div>`);

try{
 const manifestPath=path.join(staticDir,'manifest.json');
 const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 manifest.name='SIMANTAB Online';
 manifest.short_name='SIMANTAB';
 manifest.icons=[{src:'./'+simantabIconFile+'?v=1',sizes:'192x192',type:'image/png',purpose:'any maskable'}];
 await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
}catch(e){console.warn('Manifest SIMANTAB icon tidak diperbarui:',e?.message||e)}

// Remove obsolete maintenance announcement from login, including builds bootstrapped from older production.
html=html.replace(/<style id="simMaintenanceStyle">[\s\S]*?<\/style>\s*/g,'');
const maintenanceBannerStart=html.indexOf('<div id="simMaintenanceBanner"');
if(maintenanceBannerStart>=0){
 const maintenanceTabsStart=html.indexOf('<div class="tabs">',maintenanceBannerStart);
 if(maintenanceTabsStart>maintenanceBannerStart){
  html=html.slice(0,maintenanceBannerStart)+html.slice(maintenanceTabsStart);
 }
}
// Normalize an already-patched leader core carried from a previous production bootstrap.
html=html.replace(
 "const n={schools:17,rows:88,abk:153,asn:152,pns:55,pppk:75,pppk_pw:22,non_asn:18,gap_riil:30,gap_data:14};",
 "const n={schools:10,rows:54,abk:119,asn:97,pns:37,pppk:47,pppk_pw:13,non_asn:14,gap_riil:22,gap_data:8};"
);
html=html.replace(
 "<b>SD:</b> ABK 153 • ASN 152 • Gap Riil 30 • Gap Data 14",
 "<b>SD:</b> ABK 119 • ASN 97 • Gap Riil 22 • Gap Data 8"
);
html=html.replace(
 '<div class="card s4"><div class="label">Total Sekolah</div><div class="metric">${sc.total}</div><div class="small">TK/PAUD ${sc.tk} • SD ${sc.sd} • SMP ${sc.smp}</div></div>',
 '<div class="card s4"><div class="label">Total Satuan Pendidikan</div><div class="metric">1.194</div><div class="small">Formal 854 • Nonformal 340 • Negeri 510 • Swasta 684</div></div>'
);

// STAFF_ADMIN_CORE_FAST_PATH_V1
// STAFF/ADMIN internal do not need Dashboard Dinas. Remove dashboard/network work from the auth critical path.
const staffAdminRoleExpr="profile && (String(profile.role||'').startsWith('STAFF_') || String(profile.role||'').startsWith('ADMIN_'))";

// Normalize afterAuth whether production already contains the base form or a previous build copy.
html=html.replace(
 "applyProfile(); buildNav(); await refreshAll(); showTab('dashboard');",
 "applyProfile(); buildNav();\n const __staffAdmin=profile && (String(profile.role||'').startsWith('STAFF_') || String(profile.role||'').startsWith('ADMIN_'));\n if(__staffAdmin){\n  try{await refreshNotifCount()}catch(e){console.error(e)}\n  try{await showTab('activities')}catch(e){console.error(e);setTimeout(()=>window.showTab?.('activities'),0)}\n  return;\n }\n await refreshAll(); showTab('dashboard');"
);

// Make every later refreshAll call safe for STAFF/ADMIN too.
const refreshAllBase="async function refreshAll(){\n try{await Promise.all([refreshDashboard(),refreshNotifCount()]); if(isGtkSide()){await loadStatus()} }catch(e){console.error(e)}\n}";
const refreshAllSafe="async function refreshAll(){\n try{\n  if(profile && (String(profile.role||'').startsWith('STAFF_') || String(profile.role||'').startsWith('ADMIN_'))){await refreshNotifCount();return}\n  await Promise.all([refreshDashboard(),refreshNotifCount()]); if(isGtkSide()){await loadStatus()}\n }catch(e){console.error(e)}\n}";
if(html.includes(refreshAllBase))html=html.replace(refreshAllBase,refreshAllSafe);

// Direct refreshDashboard calls are also made harmless for STAFF/ADMIN.
const refreshDashboardBase="async function refreshDashboard(){";
const refreshDashboardSafe="async function refreshDashboard(){\n if(profile && (String(profile.role||'').startsWith('STAFF_') || String(profile.role||'').startsWith('ADMIN_'))){\n  if($('dashDesc'))$('dashDesc').textContent='Akun staf/admin menggunakan Kegiatan Bidang sebagai halaman utama.';\n  if($('dashboardBody'))$('dashboardBody').innerHTML='<div class=\"card info\"><b>Halaman utama staf/admin:</b> Kegiatan Bidang.</div>';\n  return;\n }";
if(!html.includes("Akun staf/admin menggunakan Kegiatan Bidang sebagai halaman utama.")){
  html=html.replace(refreshDashboardBase,refreshDashboardSafe);
}

const leaderCoreNeedle="async function refreshDashboard(){\n if(isGtkSide()){";
const leaderCoreAlreadyPatched=html.includes('window.__simantabLeaderCoreRendered=true');
const leaderCoreCanPatch=html.includes(leaderCoreNeedle);
const leaderCoreBranch="async function refreshDashboard(){\n if(profile && ['KEPALA_DINAS','SEKRETARIS_DINAS'].includes(profile.role)){\n  const rt=profile.role==='KEPALA_DINAS'?'Kepala Disdikbud':'Sekretaris Disdikbud';\n  const sc={total:854,tk:323,sd:455,smp:76,pnf:0,teachers:5272,staff:1709};\n  const n={schools:10,rows:54,abk:119,asn:97,pns:37,pppk:47,pppk_pw:13,non_asn:14,gap_riil:22,gap_data:8};\n  const w={active:4,menunggu_disposisi:3,verifikasi_staf:0,menunggu_koordinator:0,menunggu_kabid:0,perbaikan:0,selesai:0};\n  const cov=Math.round(n.schools/sc.total*100);\n  $('dashTitle').textContent='Dashboard '+rt;\n  $('dashDesc').textContent='Ringkasan strategis ketenagaan dan layanan. Klik agregat untuk melihat rincian.';\n  $('dashboardBody').innerHTML=`<div class=\"grid\">\n   <div class=\"card s12\" style=\"background:linear-gradient(135deg,#0f3f76,#1767b3);color:#fff\"><h2 style=\"margin:0 0 5px\">Command Center Ketenagaan</h2><div style=\"font-size:12px;opacity:.9\">${rt} • agregat TK/PAUD, SD, SMP, layanan kepegawaian, dan agenda bidang.</div></div>\n   <div class=\"card s12\"><div class=\"small\"><b>○ Data ringkasan aman</b> • snapshot terakhir valid 19 September 2026</div></div>\n   <div class=\"card s4\"><div class=\"label\">Total Satuan Pendidikan</div><div class=\"metric\">1.194</div><div class=\"small\">Formal 854 • Nonformal 340 • Negeri 510 • Swasta 684</div></div>\n   <div class=\"card s4\"><div class=\"label\">GTK Dapodik</div><div class=\"metric\">${sc.teachers+sc.staff}</div><div class=\"small\">Guru ${sc.teachers} • Tendik ${sc.staff}</div></div>\n   <div class=\"card s4\"><div class=\"label\">Kebutuhan GTK Riil</div><div class=\"metric\">${n.schools} sekolah</div><div class=\"small\">${n.rows} entri • Gap Riil ${n.gap_riil} • Gap Data ${n.gap_data}</div></div>\n   <div class=\"card s4\"><div class=\"label\">Usulan Aktif</div><div class=\"metric\">${w.active}</div><div class=\"small\">Menunggu pembagian tugas ${w.menunggu_disposisi}</div></div>\n   <div class=\"card s4\"><div class=\"label\">Komposisi ASN</div><div class=\"metric\">${n.asn}</div><div class=\"small\">PNS ${n.pns} • PPPK ${n.pppk} • PPPK PW ${n.pppk_pw}</div></div>\n   <div class=\"card s4\"><div class=\"label\">Cakupan Input</div><div class=\"metric\">${cov}%</div><div class=\"small\">${n.schools} dari ${sc.total} sekolah</div></div>\n   <div class=\"card s6\"><h3 style=\"margin-top:0\">Kebutuhan GTK per Jenjang</h3><div class=\"small\"><b>TK/PAUD:</b> ABK 0 • ASN 0 • Gap 0</div><div class=\"small\" style=\"margin-top:8px\"><b>SD:</b> ABK 119 • ASN 97 • Gap Riil 22 • Gap Data 8</div><div class=\"small\" style=\"margin-top:8px\"><b>SMP:</b> belum ada input kebutuhan pada basis data saat ini</div></div>\n   <div class=\"card s6\"><h3 style=\"margin-top:0\">Workflow Layanan</h3><div class=\"small\">Menunggu Pembagian Tugas: <b>${w.menunggu_disposisi}</b></div><div class=\"small\">Verifikasi Staf/Admin: <b>${w.verifikasi_staf}</b></div><div class=\"small\">Menunggu Approval Kasi/Subkoor: <b>${w.menunggu_koordinator}</b></div><div class=\"small\">Menunggu Persetujuan Kabid: <b>${w.menunggu_kabid}</b></div><div class=\"small\">Perlu Perbaikan: <b>${w.perbaikan}</b></div><div class=\"small\">Selesai: <b>${w.selesai}</b></div></div>\n  </div>`;\n  window.__simantabLeaderCoreRendered=true;\n  return;\n }\n if(isGtkSide()){";
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
if(!/SIMANTAB_KEPALA_DINAS_INFOGRAPHIC_V14_LEADER_RETURN_LIVE/.test(kadinCode))throw new Error('Dashboard Dinas V14 leader return live tidak valid.');
await fs.writeFile(path.join(staticDir,kadinFile),kadinCode);

const gtkInfographicDetailFile='gtk-infographic-details.js';
const gtkInfographicDetailCode=await fs.readFile(new URL(`./${gtkInfographicDetailFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_GTK_INFOGRAPHIC_DETAILS_V1/.test(gtkInfographicDetailCode))throw new Error('GTK infographic details v1 tidak valid.');
await fs.writeFile(path.join(staticDir,gtkInfographicDetailFile),gtkInfographicDetailCode);

const layeredWorkflowFile='submission-layered-workflow.js';
const layeredWorkflowCode=await fs.readFile(new URL(`./${layeredWorkflowFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_LAYERED_SERVICE_WORKFLOW_V1/.test(layeredWorkflowCode))throw new Error('Layered service workflow v1 tidak valid.');
await fs.writeFile(path.join(staticDir,layeredWorkflowFile),layeredWorkflowCode);

const staffAssignedServicesFile='staff-assigned-services.js';
const staffAssignedServicesCode=await fs.readFile(new URL(`./${staffAssignedServicesFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_STAFF_ASSIGNED_SERVICES_V1/.test(staffAssignedServicesCode))throw new Error('Staff assigned services v1 tidak valid.');
await fs.writeFile(path.join(staticDir,staffAssignedServicesFile),staffAssignedServicesCode);

const gtkServiceResponseFile='gtk-service-response-cycle.js';
const gtkServiceResponseCode=await fs.readFile(new URL(`./${gtkServiceResponseFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_GTK_SERVICE_RESPONSE_CYCLE_V1/.test(gtkServiceResponseCode))throw new Error('GTK service response cycle v1 tidak valid.');
await fs.writeFile(path.join(staticDir,gtkServiceResponseFile),gtkServiceResponseCode);

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
if(!/SIMANTAB_LEADER_DASHBOARD_AUTHORITATIVE_V6_VERIFIED_LIVE/.test(leaderDashboardCode))throw new Error('Leader dashboard authoritative v6 live VERIFIED tidak valid.');
await fs.writeFile(path.join(staticDir,leaderDashboardFile),leaderDashboardCode);

const sessionBoundaryFile='session-boundary-hardening.js';
const sessionBoundaryCode=await fs.readFile(new URL(`./${sessionBoundaryFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_SESSION_BOUNDARY_HARDENING_V1/.test(sessionBoundaryCode))throw new Error('Session boundary hardening v1 tidak valid.');
await fs.writeFile(path.join(staticDir,sessionBoundaryFile),sessionBoundaryCode);


const tpgServicePlacementFile='tpg-service-placement.js';
const tpgServicePlacementCode=await fs.readFile(new URL(`./${tpgServicePlacementFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_TPG_SERVICE_PLACEMENT_V1/.test(tpgServicePlacementCode))throw new Error('TPG service placement v1 tidak valid.');
await fs.writeFile(path.join(staticDir,tpgServicePlacementFile),tpgServicePlacementCode);

const staffMinimalNavFile='staff-minimal-navigation.js';
const staffMinimalNavCode=await fs.readFile(new URL(`./${staffMinimalNavFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_STAFF_MINIMAL_NAV_V1/.test(staffMinimalNavCode))throw new Error('Staff minimal navigation v1 tidak valid.');
await fs.writeFile(path.join(staticDir,staffMinimalNavFile),staffMinimalNavCode);

const gtkRedistributionFile='gtk-redistribution-analysis.js';
const gtkRedistributionCode=await fs.readFile(new URL(`./${gtkRedistributionFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_GTK_REDISTRIBUTION_ANALYSIS_V8/.test(gtkRedistributionCode))throw new Error('GTK redistribution analysis v4 tidak valid.');
await fs.writeFile(path.join(staticDir,gtkRedistributionFile),gtkRedistributionCode);

const performanceAchievementFile='performance-achievement.js';
const performanceAchievementCode=await fs.readFile(new URL(`./${performanceAchievementFile}`,import.meta.url),'utf8');
if(!/SIMANTAB_PERFORMANCE_ACHIEVEMENT_V1/.test(performanceAchievementCode))throw new Error('Performance achievement module v1 tidak valid.');
await fs.writeFile(path.join(staticDir,performanceAchievementFile),performanceAchievementCode);

const modules=[
 ['kp-enhancement.js',4],
 ['ptk-swasta-enhancement.js',1],
 ['super-admin-enhancement.js',8],
 ['registration-approval.js',2],
 ['kadin-dashboard-v2.js',14],
 ['gtk-infographic-details.js',2],
 ['dinas-login-enhancement.js',2],
 ['private-school-access.js',1],
 ['staff-service-roles.js',1],
 ['team-workflow-authority.js',2],
 ['leadership-directions.js',2],
 ['submission-layered-workflow.js',10],
 ['staff-assigned-services.js',8],
 ['gtk-service-response-cycle.js',1],
 ['sekdin-role-option-fix.js',1],
 ['legacy-shell-restore.js',3],
 ['school-master-restore-fix.js',2],
 ['team-display-fix.js',2],
 ['admin-data-summary-fix.js',1],
 ['team-multi-capability.js',1],
 ['activity-input-access.js',2],
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
 ['diklat-ks-bcks-v32.js',1],
 ['ui-branding-icons.js',3],
 ['kasim-role-label.js',1],
 ['login-developer-branding.js',1],
 ['premium-dashboard-theme.js',3],
 ['dashboard-order-fix.js',2],
 ['login-password-toggle.js',2],
 ['gtk-needs-progress.js',36],
 ['gtk-redistribution-analysis.js',8],
 ['school-status-access-v1.js',6],
 ['activity-participant-import.js',1],
 ['activity-participant-import-save.js',1],
 ['activity-digital-invite.js',1],
 ['activity-attendance-success-ux.js',3],
 ['activity-attendance-recap.js',2],
 ['login-channel-hardening.js',3],
 ['login-click-rescue.js',3],
 ['registration-ui-final.js',5],
 ['leader-menu-cleanup.js',2],
 ['leader-dashboard-authoritative.js',6],
 ['session-boundary-hardening.js',1],
 ['tpg-service-placement.js',1],
 ['staff-minimal-navigation.js',3],
 ['performance-achievement.js',3]
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
console.log(JSON.stringify({htmlFinalized:true,canonicalModuleCount:modules.length,removedInheritedTrailingBytes:Math.max(0,originalLength-html.length),scriptTags:openScripts,attendanceRecap:true,directPdfDownload:true,localPdfLibraries:true,gtkNeedsScopeV12:true,gtkNeedsCanonicalVersion:36,gtkNeedsAuthoritativeRenderer:true,gtkNeedsCoreGapData:true,gtkNeedsCoreVerification:true,gtkNeedsClickableGapBreakdowns:true,positiveShortageAggregation:true,verifiedOnlyDinasMetrics:true,legacyNeedsOverrideDisabled:true,negeriNeedsOnly:true,leadershipDirectionsV1:true,layeredServiceWorkflowV1:true,leaderAggregateDrilldown:true,leaderMenuCleanup:true,leaderDashboardAuthoritativeV6:true,leaderCoreImmediateDashboard:true,sessionBoundaryHardening:true,sekdinMonitoring:true,sekdinRoleDropdown:true,leadershipAuditTrail:true,teamDisplayVersion:2,privateSchoolServices:['TPG_KONSULTASI','PTK_BARU_SWASTA'],ptkBaruNegeriHidden:true,loginRescue:true,classicLoginRescueV5:true,loginObserverLoopFixed:true,selfRegistrationRoles:['KEPALA_SEKOLAH','GTK','PENGAWAS'],ksNpsnValidation:true,registrationApprovalV2:true,registrationUiFinalV5:true,allGtkServerRegistration:true,emailConfirmOnApproval:true,dinasRegistrationTabDisabled:true,roleFirstLoginChannelGuard:true,superAdminPasswordResetEmail:true,missingDinasAccountsButton:true,newDinasAccountsButton:true,newWartonoAccountButton:true,ksAdminDirectKabid:true,superAdminKsResetDraft:true,diklatParticipantSearch:true,paktaUploadFallback:true,fixedKabidComment:true,persistKabidApproval:true,personalKabidApprovalNote:true,hideInactiveParticipants:true,multiRoleResetDraft:true,resetAfterLevelUp:true,performanceAchievementV1:true,workflowHideInactiveRequesters:true,suciptoActivityAdmin:true,diklatAiVerifier:true,diklatAiDirectKabid:true,diklatAiKeepsAssignedVerifier:true,performanceDownloads:['PDF','CSV'],gtkRedistributionAnalysisV8:true,redistributionDownloads:['PDF','CSV'],verifyActionLabel:true,staffVerifyActionInDetail:true,globalRequesterSearch:true,eduUnitsBatang:true,gtkAiVerifierPilot:false,gtkAiVerifierDisabled:true,validClosingTags:true}));