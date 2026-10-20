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
const module=await read('diklat-ks-bcks-v32.js');
ok(html.includes('./diklat-ks-bcks-v32.js?v=23'),'Cache versi Diklat KS manual bukan v23');
ok(module.includes('ks_bcks_submit_local')&&module.includes('ksbCoordManualApprove'),'Alur Diklat KS lokal/manual belum lengkap');
ok(module.includes('SIMANTAB_KS_INACTIVE_DIKLAT_NAV_VISIBLE_LOCKED_V1')&&module.includes('syncKsDiklatNavState')&&module.includes('b.disabled=locked'),'Kepala Sekolah harus melihat menu Diklat terkunci saat modul nonaktif');
const jf2026=await read('jf-guru-2026.js');
ok(html.includes('./jf-guru-2026.js?v=2') && html.split('./jf-guru-2026.js?v=2').length===2,'Modul JF Guru 2026 harus muncul tepat satu kali');
ok(jf2026.includes('SIMANTAB_JF_GURU_SURAT_0294_2026_V1') && jf2026.includes('jf2026_submit_case') && jf2026.includes('jf2026_transition'),'Modul JF Guru tidak lengkap');
const qualification2030=await read('jf-qualification-2030.js');
ok(html.includes('./jf-qualification-2030.js?v=4') && html.split('./jf-qualification-2030.js?v=4').length===2,'Modul S1-DIV 2030 harus tepat sekali');
ok(qualification2030.includes('SIMANTAB_JF2030_QUALIFICATION_V1')&&qualification2030.includes('jf2030_save_progress')&&qualification2030.includes('jf2030_review'),'Pemantauan S1-DIV 2030 belum dibundel');
console.log(JSON.stringify({cloudflareFinalBundleQA:'PASS',scope:'build-only',login:true,roleEvent:true,securePwa:true,offlinePublicOnly:true,manualDiklat:true,socialLogin:true,productionBrowserQA:'PENDING'}));
