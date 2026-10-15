import fs from 'node:fs/promises';
import path from 'node:path';

const output = '.vercel/output/static';
const htmlPath = path.join(output, 'index.html');
const modulePath = path.join(output, 'pengawas-menu-scope.js');
let html = await fs.readFile(htmlPath, 'utf8');
const module = await fs.readFile(modulePath, 'utf8');
const dashboardModule = await fs.readFile(path.join(output, 'pengawas-dashboard-kadin.js'), 'utf8');
const policyModule = await fs.readFile(path.join(output, 'supervisor-scope-policy.js'), 'utf8');
const korwilModule = await fs.readFile(path.join(output, 'korwil-scope-dashboard.js'), 'utf8');
const needsModule = await fs.readFile(path.join(output, 'gtk-needs-progress.js'), 'utf8');
const disciplineModule = await fs.readFile(path.join(output, 'discipline-evidence.js'), 'utf8');
const offlineMonitoringModule = await fs.readFile(path.join(output, 'offline-consultation-monitoring.js'), 'utf8');
const korwilMonitoringModule = await fs.readFile(path.join(output, 'korwil-submission-monitoring.js'), 'utf8');
const operatorAdminModule = await fs.readFile(path.join(output,'institution-operators-admin.js'),'utf8');
const operatorPortalModule = await fs.readFile(path.join(output,'institution-operator-portal.js'),'utf8');
const legacyMenu = await fs.readFile(path.join(output, 'legacy-shell-restore.js'), 'utf8');
const rgtkMenu = await fs.readFile(path.join(output, 'rgtk-monitoring.js'), 'utf8');
const workflowMenu = await fs.readFile(path.join(output, 'team-workflow-authority.js'), 'utf8');
const redistribMenu = await fs.readFile(path.join(output, 'gtk-redistribution-analysis.js'), 'utf8');
const diklatMenu = await fs.readFile(path.join(output, 'diklat-ks-bcks-v32.js'), 'utf8');

function assert(ok, message) {
  if (!ok) throw new Error('[Cloudflare migration build] ' + message);
}
assert(html.includes('SIMANTAB Online'), 'index.html bukan hasil build SIMANTAB.');
assert(html.includes('./supervisor-scope-policy.js?v=1'), 'Modul pusat penugasan Korwil/Pengawas tidak dimuat.');
assert(html.includes('./pengawas-dashboard-kadin.js?v=4'), 'Dashboard Pengawas Dabin belum memakai versi baru.');
assert(html.includes('./korwil-scope-dashboard.js?v=5'), 'Dashboard Korwil belum memakai versi pemulihan login.');
assert(html.includes('./pengawas-menu-scope.js?v=8'), 'Menu dan label Korwil belum diperbarui.');
assert(policyModule.includes('SIMANTAB_SUPERVISOR_SCOPE_POLICY_V1') &&
       policyModule.includes("submitter_kind==='KORWIL'") &&
       policyModule.includes("schoolNpsns") &&
       policyModule.includes("scope.levels.includes(classify(s))") &&
       policyModule.includes("scope.levelByNpsn.get(String(s.npsn))===classify(s)"),
 'Pemisahan Korwil per kecamatan dan Pengawas per NPSN Dabin belum aman.');
assert(dashboardModule.includes('SIMANTEB_PENGAWAS_KADIN_DASHBOARD_V3_EXPLICIT_DABIN_ONLY') &&
       dashboardModule.includes("policy.schoolRows()") &&
       dashboardModule.includes("roleScope.kind==='KORWIL'"),
 'Dashboard Pengawas masih memperluas sekolah di luar Dabin.');
assert(korwilModule.includes('SIMANTEB_KORWIL_SCOPE_DASHBOARD_V5_POST_LOGIN_RECOVERY') &&
       korwilModule.includes('policy.schoolRows()') &&
       !korwilModule.includes("sb.rpc('korwil_dashboard_summary')"),
 'Dashboard Korwil belum memakai master TK SD PNF berdasarkan penugasan.');
assert(needsModule.includes('policy.schoolRows()'), 'Kebutuhan GTK Pengawas/Korwil masih memakai scope lama.');
assert(html.includes('./discipline-evidence.js?v=5'), 'Formulir Disiplin Korwil belum menggunakan versi 5.');
assert(disciplineModule.includes('SIMANTAB_DISCIPLINE_EVIDENCE_V5_KORWIL_GRANT') &&
       disciplineModule.includes("submitter_kind,scope_level,kecamatan") &&
       disciplineModule.includes("activePermission==='KORWIL'") &&
       disciplineModule.includes('assignedDistrict'),
 'Modul Disiplin masih membatasi Korwil berdasarkan nama jabatan lama.');
assert(korwilModule.includes('postLoginRecovery:true') &&
       korwilModule.includes("title.textContent='Dashboard Biddik Kecamatan'"),
 'Dashboard Korwil belum pulih setelah login.');
assert(module.includes("roleName=grantKind==='KORWIL'?'Korwil Kecamatan'"),
 'Label akun Korwil masih memakai teks role Pengawas.');
assert(html.includes('./offline-consultation-monitoring.js?v=4') &&
       offlineMonitoringModule.includes('SIMANTAB_OFFLINE_CONSULTATION_MONITORING_V4_EXCLUDE_SUPERVISORS') &&
       offlineMonitoringModule.includes("if(['PENGAWAS','KORWIL'].includes(role()))return"),
 'Konsultasi luring masih muncul dalam Monitoring Korwil.');
assert(html.includes('./korwil-submission-monitoring.js?v=1') &&
       korwilMonitoringModule.includes('SIMANTAB_KORWIL_SUBMISSION_MONITORING_V1_READONLY') &&
       korwilMonitoringModule.includes("sb.rpc('korwil_monitor_submissions')") &&
       korwilMonitoringModule.includes("x.kind==='KORWIL'") &&
       korwilMonitoringModule.includes('readOnly:true'),
 'Monitoring usulan GTK Korwil belum aman atau belum terpasang.');
assert(html.includes('./institution-operators-admin.js?v=2') &&
       operatorAdminModule.includes('SIMANTAB_INSTITUTION_OPERATORS_ADMIN_V2_BULK_PROVISION_LOCKED') &&
       operatorAdminModule.includes("p().role==='SUPER_ADMIN'") &&
       operatorAdminModule.includes("action:'invite'") &&
       operatorAdminModule.includes('activationDisabled:true') &&
       operatorAdminModule.includes('simantab-institution-operator-provision') &&
       operatorAdminModule.includes('operatorProvisionAll'),
 'Modul operator institusi hanya boleh berada di preview dengan aktivasi tertutup.');
assert(html.includes('./institution-operator-portal.js?v=3') &&
       operatorPortalModule.includes('SIMANTAB_INSTITUTION_OPERATOR_PORTAL_V3_CUTI_KGB_VERIFICATION') &&
       operatorPortalModule.includes("rpc('operator_institution_overview')") &&
       operatorPortalModule.includes("['dashboard','profile','operatorCuti','operatorKGB','operatorNotifications','operatorStatus']") &&
       operatorPortalModule.includes("rpc('operator_service_status')") &&
       operatorPortalModule.includes("rpc('operator_cuti_kgb_queue'") &&
       operatorPortalModule.includes("rpc('operator_cuti_kgb_decide'") &&
       operatorPortalModule.includes("rpc('operator_cuti_kgb_documents'") &&
       operatorPortalModule.includes('simantab-operator-document-view') &&
       operatorPortalModule.includes('readOnly:true') &&
       operatorPortalModule.includes("restrictedMenus:true"),
 'Portal Operator Institusi belum dibatasi pada dashboard, kebutuhan GTK, dan profil.');
assert(html.includes("if(profile && ['OPERATOR_KORWIL','OPERATOR_SMP'].includes(profile.role))") &&
       html.includes("await showTab('dashboard');") &&
       html.includes("window.__simantabOperatorPortal?.render?.();"),
 'Login operator masih menjalankan dashboard Dinas yang tidak sesuai kewenangan.');
assert(module.includes('SIMANTAB_PENGAWAS_MENU_SCOPE_V4_SERVICE_CATALOG'),
  'Kode katalog layanan Pengawas tidak cocok.');
assert(module.includes('simantab:profile-ready'), 'Menu Pengawas masih menggunakan timeout login.');
assert(module.includes("nav.id='pengawasStableNav'") &&
       module.includes("originalNav.style.setProperty('display','none','important')") &&
       module.includes('isolatedNavigation:true'),
  'Menu Pengawas belum dipisahkan dari nav lama.');
assert(!module.includes('observer.observe(nav,{childList:true'),
  'Pengamat menu lama masih dapat menulis ulang sidebar Pengawas.');
assert(module.includes('Riwayat Usulan Saya'),
  'Katalog dan riwayat usulan Pengawas belum tersedia.');
assert(module.includes('discipline_submitter_grants'),
  'Pemeriksaan izin khusus Korwil/Pengawas SMP tidak tersedia.');
assert(legacyMenu.includes("profile().role==='PENGAWAS')return;"),
  'Modul legacy masih berpotensi menambahkan ulang menu Pengawas tanpa henti.');
assert(workflowMenu.includes("if(role()==='PENGAWAS')return;"), 'Workflow masih menambahkan menu sensitif Pengawas tanpa izin.');
assert(rgtkMenu.includes("if(ROLE()==='PENGAWAS')return;"),
  'Modul RGTK masih berpotensi menambahkan ulang menu Pengawas tanpa henti.');
assert(html.includes('./legacy-shell-restore.js?v=3'), 'Cache version modul legacy belum diperbarui.');
assert(html.includes('./rgtk-monitoring.js?v=2'), 'Cache version modul RGTK belum diperbarui.');
assert(redistribMenu.includes("if(['PENGAWAS','KORWIL'].includes(role()))return;"), 'Redistribusi masih menambahkan tombol ke sidebar Pengawas.');
assert(diklatMenu.includes("if(profile().role==='PENGAWAS')return;"), 'Diklat KS/BCKS masih menambahkan tombol ke sidebar Pengawas.');
assert(html.includes('./gtk-redistribution-analysis.js?v=9'), 'Cache Redistribusi GTK Cloudflare belum diganti.');
assert(html.includes('./diklat-ks-bcks-v32.js?v=20'), 'Cache Diklat KS/BCKS Cloudflare belum diganti.');

const required = ['manifest.json', 'sw.js', 'pwa-install.js', 'gtk-redistribution-analysis.js'];
for (const file of required) {
  await fs.access(path.join(output, file));
}


// Cloudflare preview only: signal authentication completion to role modules.
// Original HTML sets window.__simantabProfile before applyProfile/buildNav.
const jabfungRevision=await fs.readFile(path.join(output,'jabfung-document-revisions.js'),'utf8');
assert(html.includes('./jabfung-document-revisions.js?v=1') &&
  jabfungRevision.includes('SIMANTAB_JABFUNG_DOCUMENT_REVISIONS_V1_CLOUDFLARE') &&
  jabfungRevision.includes("'jabfung_revision_open'") &&
  jabfungRevision.includes("'jabfung_revision_submit'") &&
  jabfungRevision.includes("'jabfung_revision_close'"),
  'Alur perbaikan dokumen Jabfung tidak tercantum pada build Cloudflare.');

const mandatoryProfile=await fs.readFile(path.join(output,'mandatory-personnel-profile.js'),'utf8');
assert(html.includes('./mandatory-personnel-profile.js?v=2') &&
  mandatoryProfile.includes('SIMANTAB_PROFILE_WAJIB_LENGKAP_V1_CLOUDFLARE') &&
  mandatoryProfile.includes("sb.from('profiles').update(payload)") &&
  mandatoryProfile.includes("state.blocked||state.loading"),
  'Profil wajib lengkap atau penjagaan akses layanan belum terpasang.');
const ksProfileGate=await fs.readFile(path.join(output,'ks-needs-onboarding.js'),'utf8');
assert(ksProfileGate.includes("!['needs','profile'].includes(id)"),
  'Profil Kepala Sekolah masih terhalang kewajiban Kebutuhan GTK Riil.');

const loginAnchor=/\bapplyProfile\(\);\s*buildNav\(\);/g;
const loginMatches=[...html.matchAll(loginAnchor)];
assert(loginMatches.length===1, 'Titik autentikasi setelah buildNav tidak unik.');
html=html.replace(loginAnchor,match=>match+" window.dispatchEvent(new Event('simantab:profile-ready'));");

// The Cloudflare preview should never cache old login bundles via the PWA worker.
// Production PWA support on Vercel/main remains untouched.
const pwaScript=/<script\s+src=["']\.\/pwa-install\.js\?v=\d+["']\s*><\/script>\s*/gi;
assert(pwaScript.test(html), 'Penginstal PWA tidak ditemukan pada preview.');
html=html.replace(pwaScript,'');
const swRegister="if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}";
assert(html.includes(swRegister), 'Pendaftaran service worker lama tidak ditemukan.');
html=html.replace(swRegister,'');
const previewNoSw=`<script>
/* SIMANTAB_CLOUDFLARE_PREVIEW_NOSW_20261013 */
if('serviceWorker' in navigator){
 navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});
 if(window.caches) caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{});
}
</script>`;
assert(html.includes('</head>'),'HTML head tidak valid.');
html=html.replace('</head>',previewNoSw+'\n</head>');
await fs.writeFile(htmlPath,html,'utf8');
assert(html.includes("simantab:profile-ready"),'Event profil belum terpasang.');
assert(!html.includes("navigator.serviceWorker.register('./sw.js')"),'Registrasi PWA preview masih aktif.');

const headers = `/*
  Cache-Control: no-store
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), payment=(), usb=()

/index.html
  Cache-Control: no-store

/sw.js
  Cache-Control: no-store
`;
await fs.writeFile(path.join(output, '_headers'), headers, 'utf8');
console.log(JSON.stringify({
  cloudflareStaticBuild: 'prepared',
  output,
  menuPengawasVersion: 4,
  menuPengawasCacheVersion: 8,
  supervisorScopeVersion: 1,
  korwilDashboardVersion: 5,
  korwilMonitoringVersion: 1,
  offlineMonitoringExcludeKorwil: true,
  korwilMonitoringServerRpcPending: false,
  institutionOperatorSlots: 66,
  institutionOperatorInvitationAdmin: true,
  institutionOperatorProvisionBatchReady: true,
  institutionOperatorLoginBlocked: true,
  institutionOperatorScopedPortal: true,
  institutionOperatorMenus: ['Dashboard','Profil','Cuti','KGB','Notifikasi','Status Usulan'],
  operatorCutiKgbVerifyAndForward:true,
  operatorCutiKgbRequiredServerDocs:true,
  institutionOperatorRlsReadOnly: true,
  dabinDashboardVersion: 3,
  supervisorNavigationGuards: ['redistribusi','diklat','workflow','rgtk','legacy'],
  securityHeaders: true,
  check: 'build-time only; not an end-to-end QA approval',
  aiApis: 'separate migration required before production cutover'
}));
