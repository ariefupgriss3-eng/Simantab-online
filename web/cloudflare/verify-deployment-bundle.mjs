import fs from 'node:fs/promises';
import path from 'node:path';

/* SIMANTAB_CLOUDFLARE_FINAL_PWA_CUTOVER_QA_V1
 * Runs AFTER postbuild, enable-pwa and social preview.
 * Fail closed on missing login, stale service worker or potentially unsafe caches.
 * Build-time assurance only, not browser / production functional QA.
 */
const root='.vercel/output/static';
const read=f=>fs.readFile(path.join(root,f),'utf8');
const fail=msg=>{throw new Error('[SIMANTAB Cloudflare cutover QA] '+msg);};
const ok=(condition,msg)=>{if(!condition)fail(msg);};
const [html,sw,installer,manifestText,install,guide,offline,headers]=await Promise.all(
 ['index.html','sw.js','pwa-install.js','manifest.json','install.html','panduan-instal.html','offline.html','_headers'].map(read)
);
const manifest=JSON.parse(manifestText);
ok(html.includes('simantab:profile-ready'),'Hook login/role profile-ready hilang');
ok(html.includes('SIMANTAB')&&html.includes('./pwa-install.js?v=9'),'Login atau installer PWA v9 tidak terpasang');
ok(html.split('./pwa-install.js?v=9').length===2,'Script instalasi PWA harus tepat satu');
ok(!html.includes('SIMANTAB_CLOUDFLARE_PREVIEW_NOSW_20261013'),'PWA masih diblokir oleh preview opt-out');
ok(!html.includes("navigator.serviceWorker.register('./sw.js')"),'Service worker lama masih terpasang');
ok(sw.includes('SIMANTAB_CLOUDFLARE_SAFE_SW_V8'),'Service worker aman v8 tidak tersedia');
ok(sw.includes("event.request.method !== 'GET' || event.request.mode !== 'navigate'"),'Service worker harus mengabaikan mutasi/API/non-navigation');
ok(sw.includes('target.origin !== self.location.origin'),'Service worker tidak membatasi origin');
ok(sw.includes("fetch(event.request, {cache: 'no-store'})"),'Navigasi harus network only');
ok(sw.includes('caches.match(OFFLINE)')&&sw.includes("const OFFLINE = '/offline.html'"),'Hanya fallback offline publik yang boleh dibaca dari cache');
ok(sw.includes('cache.add(new Request(OFFLINE,'),'Hanya halaman offline publik yang boleh di-cache');
ok(!/cache\.put\s*\(|caches\.match\(event\.request\)|cache\.addAll\s*\(/.test(sw),'Dilarang cache response berkas / data GTK');
ok(installer.includes('SIMANTAB_CLOUDFLARE_PWA_INSTALL_V9_LOGIN'),'Installer aman login v9 tidak tersedia');
ok(installer.includes("register('./sw.js?v=9'"),'Installer tidak mengaktifkan service worker aman');
ok(manifest.id==='/'&&manifest.scope==='/'&&manifest.start_url==='/'&&manifest.display==='standalone','Manifest tidak mengarah ke halaman login aplikasi');
ok(install.includes('./?source=pwa')&&install.includes('SIMANTAB'),'Tautan QR/install harus menuju halaman login SIMANTAB');
ok(guide.includes('pwa-install.js?v=9'),'Panduan instalasi versi lama');
ok(offline.includes('SIMANTAB perlu koneksi internet')&&!offline.includes('user_id'),'Halaman offline tidak valid');
ok(headers.includes('Cache-Control: no-store')&&headers.includes('/sw.js'),'Header anti-cache tidak lengkap');
const og=await fs.readFile(path.join(root,'og-simantab-login.png'));
ok(og.length>1000&&og.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'OG login PNG tidak tersedia');
ok(html.includes('og-simantab-login.png'),'Pratinjau tautan login belum dipasang');
const PREVIEW_ORIGIN = 'https://simantab-cf-preview.m-arief-rohman.workers.dev';
const SHORT_ORIGIN = 'https://simantab.m-arief-rohman.workers.dev';
const OFFICIAL_ORIGIN = 'https://simantab.disdikbud.batangkab.go.id';
const requestedOrigin = (process.env.SIMANTAB_PUBLIC_ORIGIN || PREVIEW_ORIGIN).replace(/[/]$/, '');
ok([PREVIEW_ORIGIN, SHORT_ORIGIN, OFFICIAL_ORIGIN].includes(requestedOrigin),'Alamat publik harus preview, Worker pendek, atau domain resmi yang disetujui');
ok(html.includes('<link rel="canonical" href="'+requestedOrigin+'/">'),'Canonical site origin tidak cocok dengan konfigurasi domain');
ok(html.includes('property="og:url" content="'+requestedOrigin+'/">'),'Pratinjau URL sosial tidak cocok dengan canonical');
ok(html.includes('property="og:image" content="'+requestedOrigin+'/og-simantab-login.png'),'Pratinjau gambar sosial masih memakai origin berbeda');
/* SIMANTAB_LOGIN_FETCH_DIAGNOSTIC_BUILD_QA_V1: check login transport errors are distinct from invalid passwords. */
const loginClickRescue=await read('login-click-rescue.js');
const loginChannelHardening=await read('login-channel-hardening.js');
ok(html.includes('./login-click-rescue.js?v=4') &&
   html.includes('./login-channel-hardening.js?v=5'),
   'Browser masih dapat menggunakan JS login lama dari cache.');
ok(loginClickRescue.includes('SIMANTAB_LOGIN_NETWORK_DIAGNOSTIC_V1') &&
   loginClickRescue.includes("'/auth/v1/health'") &&
   loginClickRescue.includes('simantabLoginConnectivityCheck') &&
   loginClickRescue.includes('networkDiagnostic:true'),
   'Pemeriksa koneksi browser ke Supabase belum aktif.');
ok(loginChannelHardening.includes('SIMANTAB_LOGIN_CHANNEL_NETWORK_MESSAGES_V1') &&
   loginChannelHardening.includes('failed to fetch') &&
   loginChannelHardening.includes('invalid_credentials'),
   'Galat jaringan login masih disamakan dengan kredensial salah.');
const module=await read('diklat-ks-bcks-v32.js');
ok(html.includes('./diklat-ks-bcks-v32.js?v=29'),'Cache versi Diklat KS manual bukan v29');
ok(module.includes('KSB_SUBSTANSI_OUTCOME_SCOREBOARD_V1') &&
   module.includes('KSB_HIDE_AGGREGATE_AFTER_CENTRAL_RESULTS_V1') &&
   module.includes('Administrasi Selesai') &&
   module.includes('kabidNoStaleBulkButton:true') &&
   module.includes('version:63'),
   'Ringkasan kelulusan 118/2 dan penanganan tombol agregat 120 belum lengkap.');
ok(module.includes('kabidShowsFailedCentralResults:true') &&
   module.includes('❌ TIDAK LULUS · Seleksi Substansi') &&
   module.includes('ready===120&&failed===0') &&
   module.includes('version:63'),
   'Pelabelan peserta tidak lulus dan pembatasan aksi agregat belum lengkap.');
ok(module.includes('KSB_KABID_PER_PESERTA_CENTRAL_DECISION_V1') &&
   module.includes('kabidKsbSinglePanel(rows,names)') &&
   module.includes('data-ksb-single-submit') &&
   module.includes('bindKabidKsbSinglePanel();') &&
   module.includes('version:63'),
   'Panel penetapan kelulusan per peserta belum lengkap.');
ok(module.includes('KSB_KABID_CENTRAL_DECISION_NO_INPUT_V1') &&
  module.includes("kabidNoManualBasisInput:true") &&
  !module.includes("prompt('Cantumkan nomor dan tanggal berita acara"),
  'Alur penetapan Kabid masih meminta isian manual keputusan.');
ok(module.includes('KSB_KABID_120_PERSONAL_GREETING_V1') && module.includes('ks_bcks_kabid_promote_all_120'),
  'Tombol Kabid untuk 120 ucapan personal belum ditemukan pada bundle.');
ok(module.includes('KSB_KABID_LEVEL_UP_OFFICIAL_120_V1')&&module.includes('ks_bcks_kabid_promote_level'),'Kenaikan level Kabid belum disertakan dalam build');
ok(module.includes('ks_bcks_submit_local')&&module.includes('ksbCoordManualApprove'),'Alur Diklat KS lokal/manual belum lengkap');
ok(module.includes('SIMANTAB_KS_INACTIVE_DIKLAT_NAV_VISIBLE_LOCKED_V1')&&module.includes('syncKsDiklatNavState')&&module.includes('b.disabled=locked'),'Kepala Sekolah harus melihat menu Diklat terkunci saat modul nonaktif');
const jf2026=await read('jf-guru-2026.js');
ok(html.includes('./jf-guru-2026.js?v=2') && html.split('./jf-guru-2026.js?v=2').length===2,'Modul JF Guru 2026 harus muncul tepat satu kali');
ok(jf2026.includes('SIMANTAB_JF_GURU_SURAT_0294_2026_V1') && jf2026.includes('jf2026_submit_case') && jf2026.includes('jf2026_transition'),'Modul JF Guru tidak lengkap');
const qualification2030=await read('jf-qualification-2030.js');
ok(html.includes('./jf-qualification-2030.js?v=5') && html.split('./jf-qualification-2030.js?v=5').length===2,'Modul S1-DIV 2030 harus tepat sekali');
ok(qualification2030.includes('SIMANTAB_JF2030_QUALIFICATION_V1')&&qualification2030.includes('jf2030_save_progress')&&qualification2030.includes('jf2030_review'),'Pemantauan S1-DIV 2030 belum dibundel');
const bulkApproval=await read('gtk-bulk-approval.js');
ok(html.includes('./gtk-bulk-approval.js?v=4') &&
   html.split('./gtk-bulk-approval.js?v=4').length===2,
   'Panel persetujuan agregat harus terpasang tepat sekali');
ok(bulkApproval.includes('SIMANTAB_GTK_BULK_APPROVAL_UI_V4') &&
   bulkApproval.includes('selected.size >= 50') &&
   bulkApproval.includes('verified_identity_and_role:true') &&
   bulkApproval.includes('APPROVE_SELECTED') &&
   bulkApproval.includes('Rincian hasil persetujuan') &&
   bulkApproval.includes('Wajib lengkapi setelah disetujui') &&
   bulkApproval.includes('Akun PENDING Perlu Pemeriksaan Manual'),
   'Perlindungan tombol agregat dan audit harus tersedia');
const smart=await read('smartgtk-unified.js');
 ok(smart.includes('SIMANTAB_SMARTGTK_KABID_BULK_ASSIGN_V1') && smart.includes('smartgtk_workflow_bulk_assign') && smart.includes('workflowBulkAssign') && smart.includes('Bagikan Merata ke Staf') && smart.includes('bulkAssignment:true'), 'Kabid bulk task assignment not bundled');
ok(html.includes('./smartgtk-unified.js?v=24')&&html.split('./smartgtk-unified.js?v=24').length===2,'SMART-GTK unified script must load once');
ok(smart.includes('SIMANTAB_SMARTGTK_UNIFIED_INTAKE_V1')&&smart.includes("sb.rpc('smartgtk_mass_save'")&&smart.includes("sb.rpc('smartgtk_mass_officer_list'")&&smart.includes("sb.rpc('smartgtk_mass_complete'"),'SMART-GTK mass routes missing');
ok(smart.includes('smartgtkDashboardPriority')&&smart.includes('smartgtkPrimaryNav')&&smart.includes('root.insertBefore(card,body)'), 'GTK dashboard priority link or main menu missing');
ok(smart.includes('Deadline input data paling lambat 26 Oktober 2026, pukul 23.59 WIB.')&&!smart.includes('SIMANTAB hanya menganalisis usulan JF Guru bagi guru dan KS PNS.'),'SMART-GTK deadline and concise copy missing');
ok(smart.includes('smartgtk_cabinet_candidates')&&smart.includes('smartgtk_import_cabinet')&&smart.includes('Ambil dari Lemari Dokumenku'), 'SMART-GTK cabinet reuse control missing');
ok(smart.includes('SIMANTAB_SMARTGTK_ROLE_WORKFLOW_V1') &&
   smart.includes('smartgtk_workflow_list') &&
   smart.includes('smartgtk_workflow_act') &&
   smart.includes('workflowActions(item)') &&
   smart.includes('roleWorkflow:true'),
   'Workflow SMART GTK 4 peran tidak terpasang pada paket Cloudflare.');
ok(smart.includes('SIMANTAB_SMARTGTK_OWNER_FEEDBACK_V1') && smart.includes('smartgtk_workflow_my_status') && smart.includes('ownerWorkflowFeedback:true') && smart.includes('version:24'),
 'SMART-GTK tidak menampilkan status perbaikan untuk pemilik data.');
ok(smart.includes('SIMANTAB_SMARTGTK_DINAS_NAV_V1') && smart.includes('ensureDinasWorkflowNav()') && smart.includes('dinasWorkflowNav:true') && smart.includes('version:24'),
 'Menu khusus Workflow SMART GTK pada sidebar Dinas belum dimuat.');
ok(smart.includes('SIMANTAB_SMARTGTK_KS_NEEDS_PRIORITY_V1') && smart.includes('ksNeedsPriority:true') &&
   smart.includes("window.showTab?.('needs')"),
  'SMART-GTK KS dapat melewati kewajiban Kebutuhan GTK Riil.');
ok(smart.includes('SIMANTAB_SMARTGTK_DEADLINE_REMINDER_V1') &&
   smart.includes('smartGtkReminderHTML') &&
   smart.includes('smartGtkTimeLeft') &&
   smart.includes('2026,9,26,16,59') &&
   smart.includes('deadlineReminder:true') &&
   smart.includes('version:24') &&
   smart.includes('data-smartgtk-reminder') &&
   smart.includes("sb.rpc('smartgtk_mass_status')"),
   'Pengingat deadline SMART GTK belum dibundel dengan status kelengkapan aktual.');
ok(smart.includes('SIMANTAB_SMARTGTK_KABID_DRAFT_MONITOR_V1') &&
   smart.includes('smartgtk_workflow_drafts') &&
   smart.includes('workflowDraftsPanel()') &&
   smart.includes('draftMonitoring:true') &&
   smart.includes('version:24'),
   'Pemantauan read-only draf SMART GTK Kabid belum lengkap.');
ok(smart.includes('SIMANTAB_SMARTGTK_PNS_THREE_GOAL_UI_V1') &&
   smart.includes('SIMANTAB_SMARTGTK_SEPARATE_CONTRACT_BUCKETS_UI_V1') &&
   smart.includes('smartgtk_contract_buffer_list') &&
   smart.includes("workflowContractPanel('PPPK')+workflowContractPanel('PPPK_PW')") &&
   smart.includes('pnsThreeGoals:true,contractBuffers:true') &&
   smart.includes('version:24'),
   'Tiga tujuan PNS dan tampungan PPPK/PPPK PW belum dipisahkan pada bundle Cloudflare.');
const ksNeedsOnboarding=await read('ks-needs-onboarding.js');
ok(ksNeedsOnboarding.includes('SIMANTAB_KS_NEEDS_SMARTGTK_NAV_GUARD_V2') &&
   html.includes('./ks-needs-onboarding.js?v=2'),
  'Navigasi KS wajib Kebutuhan GTK Riil belum menggunakan penjaga SMART-GTK.');
const onboarding=await read('smartgtk-onboarding.js');
ok(html.includes('./smartgtk-onboarding.js?v=1')&&html.split('./smartgtk-onboarding.js?v=1').length===2,'GTK onboarding helper must load once');
ok(onboarding.includes('SMARTGTK_MASS_ONBOARDING_V1')&&onboarding.includes('resetPasswordForEmail'),'Safe GTK signup and account recovery missing');
ok(jf2026.includes('window.__simantabSmartGtkReady')&&qualification2030.includes('window.__simantabSmartGtkReady'),'Old GTK duplicate cards must be disabled when SMART-GTK is loaded');
ok(smart.includes("smartgtk_locker_register")&&smart.includes("storage.from('simantab-documents')")&&
 !smart.includes("storage.from('simantab-smartgtk-private').upload"),'Single cabinet source upload missing');
ok(smart.includes('Berkas Lengkap — Menunggu Verifikasi Dinas')&&
 smart.includes('Menunggu verifikasi administratif oleh Dinas'),'PNS status pending-Dinas guidance missing');
ok(smart.includes("['PB','Pendamping Belajar (PB)']")&&
 smart.includes("['PLS','Pendamping Layanan Satpen (PLS)']")&&
 smart.includes("Pendamping (data lama: belum dipilah PB/PLS)")&&
 !smart.includes('Non-ASN')&&!smart.includes('non-ASN'),
 'PB / PLS must be separate choices while old records remain labeled');
ok(!smart.includes('Saat ini masih uji coba terbatas')&&
 !smart.includes('SMART-GTK masih tahap pilot terbatas')&&
 smart.includes('Untuk KS negeri, ajukan Kebutuhan GTK Riil terlebih dahulu')&&
 smart.includes('Akun belum memenuhi ketentuan akses SMART-GTK.'),
 'UI OPEN masih menampilkan petunjuk pilot lama');
console.log(JSON.stringify({cloudflareFinalBundleQA:'PASS',scope:'build-only',login:true,roleEvent:true,securePwa:true,offlinePublicOnly:true,manualDiklat:true,socialLogin:true,productionBrowserQA:'PENDING'}));
