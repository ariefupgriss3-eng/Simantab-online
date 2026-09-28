/* SIMANTAB_PREMIUM_DASHBOARD_THEME_V2 */
/* SIMANTAB_PREMIUM_DASHBOARD_THEME_V6 */
/* SIMANTAB_PREMIUM_DASHBOARD_THEME_V7_LOGIN_ELEGANT */
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const css=`
:root{--navy:#0a3568;--navy2:#06284f;--navy3:#0e477e;--blue:#1769b0;--orange:#ff7a00;--orange2:#ff9f2f;--soft:#f4f8fc;--ink:#15304d;--muted:#6d7f92;--line:#dce8f2;--card:#fff;--shadow:0 10px 28px rgba(8,42,84,.10)}
body{background:linear-gradient(180deg,#edf4fb 0,#f8fbfe 36%,#f2f6fa 100%)}
.login{min-height:100vh;display:grid!important;grid-template-columns:minmax(0,1.08fr) minmax(420px,.92fr)!important;background:radial-gradient(circle at 31% 10%,rgba(52,171,255,.34),transparent 27%),radial-gradient(circle at 72% 42%,rgba(21,121,224,.22),transparent 32%),linear-gradient(135deg,#061a3a 0%,#0a4386 43%,#0868c4 100%)!important;position:relative;overflow:hidden}
.login:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 15% 80%,rgba(255,255,255,.10),transparent 24%),linear-gradient(145deg,transparent 0 74%,rgba(4,44,104,.42) 74% 82%,transparent 82%);pointer-events:none}
.login:after{content:'';position:absolute;left:-85px;bottom:66px;width:430px;height:14px;border-radius:999px;background:linear-gradient(90deg,#ff9f2f,#ffc35a);transform:rotate(19deg);box-shadow:0 0 28px rgba(255,159,47,.22);pointer-events:none}
.hero{position:relative;padding:clamp(28px,4.2vh,48px) 54px 24px!important;justify-content:flex-start!important;align-items:center!important;text-align:center;min-height:100vh;z-index:1}
.sim-institution{margin:0 0 13px!important;font-size:clamp(13px,1.25vw,18px)!important;font-weight:800!important;line-height:1.5!important;letter-spacing:.06em!important;text-transform:uppercase;color:#edf6ff!important;text-align:center}
.sim-institution b{display:block;color:#fff!important;font-size:1.08em;letter-spacing:.07em}
.hero-badge{width:92px!important;height:92px!important;margin:0 auto 16px!important;background:linear-gradient(145deg,#fff,#eaf2f8)!important;border:4px solid rgba(255,255,255,.82)!important;border-radius:24px!important;box-shadow:0 15px 38px rgba(0,19,50,.38)!important;color:var(--navy)!important;overflow:hidden}
.hero-badge img{width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit}
.hero h1{font-size:clamp(42px,4.5vw,64px)!important;line-height:1!important;letter-spacing:-1.8px!important;margin:0 0 12px!important;white-space:nowrap;text-align:center}
.hero h1:after{content:'-ONLINE';color:#ffad3b;margin-left:5px;text-shadow:0 5px 18px rgba(255,153,0,.18)}
.hero p{font-size:clamp(16px,1.65vw,22px)!important;max-width:720px!important;margin:0!important;line-height:1.42!important;opacity:1!important;text-align:center}
.hero p b{font-weight:850}
.sim-hero-values{display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:nowrap;margin-top:26px;padding:10px 18px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(6,48,103,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.08);max-width:100%}
.sim-hero-values span{position:relative;font-size:11px;font-weight:850;padding:0 18px;color:#f7fbff;white-space:nowrap}
.sim-hero-values span+span:before{content:'';position:absolute;left:0;top:50%;width:1px;height:18px;background:rgba(255,255,255,.32);transform:translateY(-50%)}
.sim-login-division-footer{margin-top:auto;padding:28px 0 4px;width:100%;display:flex;align-items:center;justify-content:center;gap:18px;color:#fff;font-size:clamp(20px,2.2vw,30px);font-weight:950;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 2px 8px rgba(0,22,55,.35)}
.sim-login-division-footer:before,.sim-login-division-footer:after{content:'';width:78px;max-width:14%;height:3px;border-radius:999px;background:#ffad3b;box-shadow:0 0 14px rgba(255,173,59,.28)}
@media(max-height:760px) and (min-width:981px){.hero{padding-top:22px!important;padding-bottom:18px!important}.sim-institution{font-size:12px!important;margin-bottom:8px!important}.hero-badge{width:76px!important;height:76px!important;margin-bottom:10px!important;border-radius:20px!important}.hero h1{font-size:44px!important;margin-bottom:8px!important}.hero p{font-size:16px!important}.sim-hero-values{margin-top:18px;padding:8px 14px}.sim-login-division-footer{padding-top:18px;font-size:20px!important}}
.loginpane{position:relative;z-index:1}.loginbox{border:0!important;border-radius:24px!important;box-shadow:0 22px 60px rgba(8,42,84,.20)!important;padding:30px!important}.loginbox h2{color:var(--navy)!important;font-size:25px!important}.loginbox>.small{font-size:11px!important}.tabs button{transition:.18s}.tabs button.active{background:linear-gradient(135deg,var(--orange),#f28a1c)!important;border-color:transparent!important}.btn.primary{background:linear-gradient(135deg,var(--orange),#ef6d00)!important;box-shadow:0 8px 18px rgba(255,122,0,.18)}.sim-login-seal{margin-top:16px;padding-top:14px;border-top:1px solid #e8eef4;display:flex;gap:9px;align-items:center;color:#647b90;font-size:10px;font-weight:750}.sim-login-seal strong{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#e9f2fa;color:var(--navy)}
.top{height:76px!important;background:linear-gradient(90deg,var(--navy2),var(--navy))!important;border:0!important;color:#fff!important;box-shadow:0 3px 16px rgba(5,31,61,.18)}.top .btitle{font-size:17px;color:#fff}.top .bsub,.top .small{color:#d9e7f4!important}.top .mark{width:46px!important;background:linear-gradient(145deg,#fff,#e5eef7)!important;color:var(--navy)!important;border:2px solid rgba(255,255,255,.55);font-size:9px!important;letter-spacing:.05em}.top .chip{background:rgba(255,255,255,.14)!important;color:#fff!important}.top .avatar{background:#fff!important;color:var(--navy)!important}.top .btn.soft{background:rgba(255,255,255,.12)!important;color:#fff!important}.sim-top-accent{color:#ff922f}
.layout{grid-template-columns:255px 1fr!important}.side{top:76px!important;height:calc(100vh - 76px)!important;background:linear-gradient(180deg,#0a3568 0%,#08284e 100%)!important;padding:18px 12px!important;box-shadow:8px 0 28px rgba(8,42,84,.08)}.side:after{content:'PROFESIONAL  •  KOLABORATIF  •  BERDAMPAK';display:block;margin:20px 9px 5px;padding-top:15px;border-top:1px solid rgba(255,255,255,.09);font-size:8px;line-height:1.6;letter-spacing:.08em;color:#81a7c8}
.navhead{color:#8fb5d8!important;opacity:1!important;margin-top:7px}.navbtn{color:#dbe9f6!important;border-radius:11px!important;padding:11px 12px!important;transition:.18s}.navbtn:hover{background:rgba(255,255,255,.08)!important}.navbtn.active{background:linear-gradient(135deg,var(--orange),#ff8c18)!important;color:#fff!important;box-shadow:0 7px 18px rgba(255,122,0,.22)}
.content{padding:22px!important}.head h2{color:var(--navy);font-size:25px!important}.head p{color:var(--muted)!important}.card{border:1px solid #e1ebf4!important;box-shadow:var(--shadow)!important;border-radius:16px!important}.metric{color:var(--navy)!important}.label{color:#70859b!important}.service{border:1px solid #e0eaf3!important;box-shadow:0 6px 18px rgba(11,48,85,.055);transition:.18s}.service:hover{transform:translateY(-2px);box-shadow:0 12px 25px rgba(11,48,85,.10)}
#dashboardBody>.grid>.card.s3{position:relative;overflow:hidden;min-height:112px}#dashboardBody>.grid>.card.s3:before{content:'';position:absolute;width:56px;height:56px;border-radius:18px;right:12px;top:16px;background:linear-gradient(145deg,#e9f5ff,#d7ebfb)}#dashboardBody>.grid>.card.s3:nth-child(2):before{background:linear-gradient(145deg,#e9faef,#d8f4e2)}#dashboardBody>.grid>.card.s3:nth-child(3):before{background:linear-gradient(145deg,#fff3e5,#ffe0ba)}#dashboardBody>.grid>.card.s3:nth-child(4):before{background:linear-gradient(145deg,#f2eaff,#e2d2ff)}
.sim-premium-welcome{background:linear-gradient(105deg,#f8fbff 0%,#eef6fd 68%,#e6f0fa 100%);border:1px solid #d7e7f4;border-radius:18px;padding:20px 21px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:18px;overflow:hidden;position:relative}.sim-premium-welcome:after{content:'SIMANTAB';position:absolute;right:19px;top:18px;font-size:42px;font-weight:950;letter-spacing:-2px;color:#dceaf5;opacity:.7}.sim-premium-welcome h3{margin:0 0 5px;font-size:22px;color:var(--navy);position:relative;z-index:1}.sim-premium-welcome p{margin:0;color:#60768d;font-size:12px;max-width:68%;position:relative;z-index:1}.sim-premium-kicker{font-size:10px;font-weight:900;color:var(--orange);text-transform:uppercase;letter-spacing:.09em;margin-bottom:6px;position:relative;z-index:1}.sim-welcome-badges{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap;position:relative;z-index:1}.sim-welcome-badges span{background:#fff;border:1px solid #dce8f2;border-radius:999px;padding:5px 9px;font-size:9px;font-weight:800;color:#537088}
.sim-premium-section{margin-top:15px}.sim-premium-section-title{display:flex;justify-content:space-between;align-items:end;margin-bottom:9px}.sim-premium-section-title h3{margin:0;color:var(--navy);font-size:17px}.sim-premium-section-title span{font-size:10px;color:#7890a5}.sim-premium-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.sim-premium-tile{border:0;border-radius:15px;padding:16px;text-align:left;background:#fff;box-shadow:0 7px 20px rgba(10,53,104,.08);min-height:128px;position:relative;overflow:hidden;color:var(--ink);transition:.18s}.sim-premium-tile:hover{transform:translateY(-3px)}.sim-premium-tile .ico2{font-size:28px;margin-bottom:13px}.sim-premium-tile b{display:block;font-size:13px;margin-bottom:5px}.sim-premium-tile small{display:block;color:#6c7f91;line-height:1.35;padding-right:20px}.sim-premium-tile .arrow{position:absolute;right:12px;bottom:12px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#fff;background:var(--blue)}.sim-premium-tile:nth-child(2){background:#fff5e9}.sim-premium-tile:nth-child(2) .arrow{background:#ff8a18}.sim-premium-tile:nth-child(3){background:#eaf9f1}.sim-premium-tile:nth-child(3) .arrow{background:#20a76e}.sim-premium-tile:nth-child(4){background:#f2ebff}.sim-premium-tile:nth-child(4) .arrow{background:#8054d5}.sim-premium-tile:nth-child(5){background:#fff0f2}.sim-premium-tile:nth-child(5) .arrow{background:#e74355}.sim-premium-tile:nth-child(6){background:#eaf9fd}.sim-premium-tile:nth-child(6) .arrow{background:#13a5bf}.sim-premium-tile:nth-child(7){background:#fff7d8}.sim-premium-tile:nth-child(7) .arrow{background:#e3a600}.sim-premium-tile:nth-child(8){background:#eef2f6}.sim-premium-tile:nth-child(8) .arrow{background:#607184}
.sim-premium-bottom{display:grid;grid-template-columns:1.35fr 1fr;gap:12px;margin-top:12px}.sim-premium-panel{background:#fff;border:1px solid #e0eaf3;border-radius:15px;padding:14px;box-shadow:0 6px 18px rgba(10,53,104,.055)}.sim-premium-panel h4{margin:0 0 10px;color:var(--navy)}.sim-premium-row{padding:9px 0;border-bottom:1px solid #edf2f6;font-size:11px;color:#516a80}.sim-premium-row:last-child{border-bottom:0}.sim-premium-date{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:11px;background:#edf5fc;color:var(--navy);font-weight:900;margin-right:9px;vertical-align:middle}.sim-gtk-agenda-wrap{display:grid;gap:10px}.sim-gtk-agenda-group{border:1px solid #e4edf5;border-radius:13px;padding:10px;background:#fbfdff}.sim-gtk-agenda-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}.sim-gtk-agenda-head b{font-size:11px;color:var(--navy)}.sim-gtk-agenda-count{display:inline-flex;min-width:22px;height:22px;padding:0 7px;border-radius:999px;align-items:center;justify-content:center;background:#edf5fc;color:#0a4f8d;font-size:10px;font-weight:900}.sim-gtk-agenda-item{padding:8px 0;border-top:1px solid #edf2f6}.sim-gtk-agenda-item:first-of-type{border-top:0}.sim-gtk-agenda-item strong{display:block;font-size:11px;color:#294965;line-height:1.35}.sim-gtk-agenda-meta{margin-top:3px;color:#6f8294;font-size:9px;line-height:1.45}.sim-gtk-agenda-status{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:3px 7px;font-size:8px;font-weight:900}.sim-gtk-agenda-status.past{background:#eef2f6;color:#607184}.sim-gtk-agenda-status.now{background:#e8f8ef;color:#178357}.sim-gtk-agenda-status.next{background:#fff3e5;color:#bc6400}.sim-gtk-agenda-empty{font-size:9px;color:#7f91a2;padding:4px 0}.sim-premium-motto{text-align:center;margin:20px 0 4px;font-size:10px;font-weight:900;letter-spacing:.08em;color:#54718a}.sim-premium-motto b{color:var(--orange)}
.footer{color:#75889b!important;font-weight:700!important}
@media(max-width:980px){.layout{grid-template-columns:1fr!important}.side{top:76px!important}.sim-premium-tiles{grid-template-columns:repeat(2,1fr)}.sim-premium-bottom{grid-template-columns:1fr}.content{padding:14px!important}.sim-premium-welcome p{max-width:80%}}
@media(max-width:580px){.sim-premium-welcome{padding:15px}.sim-premium-welcome p{max-width:100%}.sim-premium-welcome:after{display:none}.sim-premium-tiles{grid-template-columns:1fr 1fr;gap:8px}.sim-premium-tile{min-height:116px;padding:13px}.sim-premium-tile .ico2{font-size:23px;margin-bottom:9px}.sim-premium-tile b{font-size:11px}.sim-premium-tile small{font-size:9px}.top{height:68px!important;padding:0 10px!important}.top .btitle{font-size:13px}.top .mark{width:38px!important;height:38px!important}.top .user{gap:5px}.top .user .chip:first-child{display:none}.top .user>div:not(.avatar){display:none}.top .btn.soft{padding:8px!important;font-size:10px}.side{top:68px!important;height:calc(100vh - 68px)!important}.hero{display:none!important}.login{grid-template-columns:1fr!important;background:linear-gradient(180deg,#0b3d73 0 25%,#eef5fb 25% 100%)!important}.loginpane{padding:14px!important;align-items:flex-start!important;padding-top:10vh!important}.loginbox{padding:21px!important;border-radius:20px!important}.loginbox:before{content:'SIMANTAB-ONLINE';display:block;text-align:center;color:var(--navy);font-weight:950;font-size:18px;margin-bottom:13px}.sim-login-seal{font-size:9px}.content{padding:11px!important}.head h2{font-size:20px!important}}
`;
const st=document.createElement('style');st.id='simantabPremiumTheme';st.textContent=css;document.head.appendChild(st);
const defs=[
 ['services','📄','Layanan Kepegawaian','Pengajuan dan proses layanan GTK'],
 ['activities','📅','Kegiatan Bidang','Agenda, undangan dan laporan'],
 ['needs','👥','Kebutuhan GTK Riil','Analisis kebutuhan dan pemetaan'],
 ['tpg','💰','Aneka Tunjangan','TPG, Tamsil dan layanan terkait'],
 ['diklatKsBcks','🎓','Diklat KS/BCKS','Seleksi dan pencatatan Diklat'],
 ['archives','📁','Arsip & Persuratan','Dokumen dan surat bidang'],
 ['promotion','🏅','Promosi Karir','Pengembangan karir KSPSTK'],
 ['monitoring','📊','Monitoring & Laporan','Pantau progres dan verifikasi']
];
function available(tab){return !!document.querySelector(`.navbtn[data-tab="${tab}"]`)}
const isAgendaViewer=()=>!!window.__simantabProfile;
function jakartaNowKey(){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
const agendaKey=(d,t,fallback)=>`${String(d||'').slice(0,10)}T${String(t||fallback||'00:00').slice(0,5)}`;
function agendaKind(a,nowKey){
 const start=agendaKey(a.activity_date,a.activity_time,'00:00');
 const end=agendaKey(a.activity_end_date||a.activity_date,a.activity_end_time,'23:59');
 if(nowKey<start)return'next';
 if(nowKey>end)return'past';
 return'now';
}
function fmtAgendaDate(a){
 const fmt=d=>{if(!d)return'';const [y,m,day]=String(d).slice(0,10).split('-');return `${day}/${m}/${y}`};
 const d1=fmt(a.activity_date),d2=fmt(a.activity_end_date);
 const dates=d2&&d2!==d1?`${d1}–${d2}`:d1;
 const t1=String(a.activity_time||'').slice(0,5),t2=String(a.activity_end_time||'').slice(0,5);
 return [dates,t1&&t2?`${t1}–${t2}`:t1].filter(Boolean).join(' • ');
}
function agendaItem(a,kind){
 const labels={past:'Sudah',now:'Sedang',next:'Akan'};
 const scope=String(a.scope_level||'ALL').replace('TK_PAUD_PNF','TK/PAUD/PNF');
 return `<div class="sim-gtk-agenda-item"><span class="sim-gtk-agenda-status ${kind}">${kind==='past'?'✓':kind==='now'?'●':'→'} ${labels[kind]}</span><strong>${esc(a.activity_name||'Kegiatan Bidang')}</strong><div class="sim-gtk-agenda-meta">${esc(fmtAgendaDate(a))}${a.place?` • ${esc(a.place)}`:''}${scope?` • ${esc(scope)}`:''}</div></div>`;
}
async function loadDashboardAgenda(){
 if(!isAgendaViewer())return;
 const host=$('simGtkAgendaBody');if(!host)return;
 const sb=window.__simantabSb;if(!sb){host.innerHTML='<div class="sim-gtk-agenda-empty">Agenda belum dapat dimuat.</div>';return}
 host.innerHTML='<div class="sim-gtk-agenda-empty">Memuat agenda bidang…</div>';
 try{
  const {data,error}=await sb.from('field_activities')
   .select('id,scope_level,activity_name,activity_date,activity_end_date,activity_time,activity_end_time,place')
   .order('activity_date',{ascending:true})
   .limit(200);
  if(error)throw error;
  const nowKey=jakartaNowKey(),groups={past:[],now:[],next:[]};
  (data||[]).forEach(a=>groups[agendaKind(a,nowKey)].push(a));
  groups.past.sort((a,b)=>agendaKey(b.activity_end_date||b.activity_date,b.activity_end_time,'23:59').localeCompare(agendaKey(a.activity_end_date||a.activity_date,a.activity_end_time,'23:59')));
  groups.now.sort((a,b)=>agendaKey(a.activity_date,a.activity_time,'00:00').localeCompare(agendaKey(b.activity_date,b.activity_time,'00:00')));
  groups.next.sort((a,b)=>agendaKey(a.activity_date,a.activity_time,'00:00').localeCompare(agendaKey(b.activity_date,b.activity_time,'00:00')));
  const cfg=[
   ['past','✓ Sudah Dilaksanakan'],
   ['now','● Sedang Berlangsung'],
   ['next','→ Akan Dilaksanakan']
  ];
  host.innerHTML=cfg.map(([k,title])=>{
   const rows=groups[k].slice(0,5);
   return `<div class="sim-gtk-agenda-group"><div class="sim-gtk-agenda-head"><b>${title}</b><span class="sim-gtk-agenda-count">${groups[k].length}</span></div>${rows.length?rows.map(a=>agendaItem(a,k)).join(''):'<div class="sim-gtk-agenda-empty">Belum ada agenda.</div>'}</div>`;
  }).join('');
 }catch(e){
  console.error('Agenda dashboard gagal dimuat',e);
  host.innerHTML='<div class="sim-gtk-agenda-empty">Agenda bidang belum dapat dimuat. Silakan segarkan halaman.</div>';
 }
}
function decorateStatic(){
 const hero=document.querySelector('.hero');
 if(hero&&hero.dataset.loginHeroV7!=='1'){
  hero.dataset.loginHeroV7='1';
  hero.innerHTML=`<div class="sim-institution"><b>PEMERINTAH KABUPATEN BATANG</b><span>DINAS PENDIDIKAN DAN KEBUDAYAAN</span></div><div class="hero-badge"><img src="./simantab-icon-192.png?v=5" alt="SIMANTAB"></div><h1>SIMANTAB</h1><p><b>Sistem Informasi Manajemen Ketenagaan Batang</b></p><div class="sim-hero-values"><span>▥&nbsp; Data Akurat</span><span>👥&nbsp; Layanan Terpadu</span><span>⚙&nbsp; Kinerja Lebih Baik</span></div><div class="sim-login-division-footer">Bidang Ketenagaan</div>`;
 }
 const box=document.querySelector('.loginbox');
 if(box&&!box.querySelector('.sim-login-seal')){
  const h=box.querySelector('h2');if(h)h.textContent='Masuk ke Akun Anda';
  const small=box.querySelector(':scope > .small');if(small)small.textContent='Silakan login untuk mengakses layanan SIMANTAB-ONLINE.';
  const seal=document.createElement('div');seal.className='sim-login-seal';seal.innerHTML='<strong>BTG</strong><span>Dinas Pendidikan dan Kebudayaan Kabupaten Batang<br>Melayani dengan integritas, membangun pendidikan untuk masa depan.</span>';box.appendChild(seal);
 }
 const title=document.querySelector('.top .btitle');if(title)title.innerHTML='SIMANTAB<span class="sim-top-accent">-ONLINE</span>';
 const sub=document.querySelector('.top .bsub');if(sub)sub.textContent='Dinas Pendidikan dan Kebudayaan Kab. Batang';
 const mark=document.querySelector('.top .mark');if(mark)mark.innerHTML='<img src="./simantab-icon-192.png?v=4" alt="SIMANTAB" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block">';
}
function enhance(){
 decorateStatic();
 const body=$('dashboardBody');if(!body||!window.__simantabProfile)return;
 if(body.querySelector('.sim-premium-welcome'))return;
 const p=window.__simantabProfile||{};
 const welcome=document.createElement('div');welcome.className='sim-premium-welcome';welcome.innerHTML=`<div><div class="sim-premium-kicker">SIMANTAB-ONLINE • Kabupaten Batang</div><h3>Halo, ${esc(p.full_name||'Pengguna')} 👋</h3><p>Selamat datang di SIMANTAB-ONLINE. Bersama kita wujudkan tata kelola ketenagaan pendidikan yang transparan, profesional, dan terintegrasi.</p><div class="sim-welcome-badges"><span>Data Akurat</span><span>Layanan Terpadu</span><span>Terintegrasi</span></div></div>`;
 body.prepend(welcome);
 const items=defs.filter(d=>available(d[0])).slice(0,8);
 if(items.length){
  const sec=document.createElement('div');sec.className='sim-premium-section';
  const agendaPanel='<div class="sim-premium-panel"><h4>🗓️ Agenda Bidang</h4><div class="small" style="margin-bottom:8px">Agenda kegiatan Bidang Ketenagaan: sudah, sedang, dan akan dilaksanakan.</div><div id="simGtkAgendaBody" class="sim-gtk-agenda-wrap"><div class="sim-gtk-agenda-empty">Memuat agenda bidang…</div></div></div>';
  sec.innerHTML=`<div class="sim-premium-section-title"><h3>Menu Layanan Utama</h3><span>Pilih menu untuk membuka layanan</span></div><div class="sim-premium-tiles">${items.map(d=>`<button class="sim-premium-tile" data-premium-tab="${d[0]}"><div class="ico2">${d[1]}</div><b>${d[2]}</b><small>${d[3]}</small><span class="arrow">→</span></button>`).join('')}</div><div class="sim-premium-bottom"><div class="sim-premium-panel"><h4>📣 Pengumuman</h4><div class="sim-premium-row"><b>SIMANTAB aktif</b><br>Gunakan modul sesuai kewenangan dan alur verifikasi yang berlaku.</div><div class="sim-premium-row"><b>Data & dokumen</b><br>Pastikan data dan berkas yang diunggah benar sebelum dikirim.</div></div>${agendaPanel}</div><div class="sim-premium-motto">SDM PENDIDIKAN UNGGUL, <b>BATANG SEMAKIN MAJU</b></div>`;
  body.appendChild(sec);sec.querySelectorAll('[data-premium-tab]').forEach(b=>b.addEventListener('click',()=>window.showTab?.(b.dataset.premiumTab)));if(isAgendaViewer())setTimeout(loadDashboardAgenda,0);
 }
}
decorateStatic();
(async()=>{
  for(let i=0;i<240&&!window.__simantabProfile;i++)await new Promise(r=>setTimeout(r,50));
  const role=String(window.__simantabProfile?.role||'');
  const leader=['KEPALA_DINAS','SEKRETARIS_DINAS'].includes(role);
  if(leader){
    window.__simantabPremiumDashboard={version:7,reference:'navy-orange-executive',productionDataUntouched:true,leaderSafe:true,dashboardAgenda:true,loginHero:'elegant-v7'};
    return;
  }
  let t;
  const ob=new MutationObserver(()=>{clearTimeout(t);t=setTimeout(enhance,80)});
  const target=$('dashboardBody');if(target)ob.observe(target,{childList:true,subtree:false});
  const prior=window.showTab;if(prior)window.showTab=async id=>{const r=await prior(id);if(id==='dashboard')setTimeout(enhance,50);return r};
  setTimeout(enhance,500);
  window.__simantabPremiumDashboard={version:7,reference:'navy-orange-executive',productionDataUntouched:true,leaderSafe:false,dashboardAgenda:true,loginHero:'elegant-v7'};
})();
})();
