/* SIMANTAB_UI_BRANDING_ICONS_V1 */
(()=>{
  const DEV_NAME='M. Arief Rohman, S.Pd.SD., M.Si., M.Pd., M.Pd';
  const DEV_UNIT='Dinas Pendidikan dan Kebudayaan';
  const DEV_YEAR='2026';

  const baseSvg=(body)=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ICON={
    dashboard:baseSvg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    calendar:baseSvg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="m8 15 2 2 5-5"/>'),
    user:baseSvg('<circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4.3 3.3-7 8-7s7.3 2.7 8 7"/>'),
    briefcase:baseSvg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>'),
    wallet:baseSvg('<path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h11"/><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/><circle cx="16.5" cy="13.5" r=".5" fill="currentColor" stroke="none"/>'),
    chart:baseSvg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="m4 8 5-4 6 6 5-4"/>'),
    bell:baseSvg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>'),
    school:baseSvg('<path d="m3 10 9-6 9 6-9 6-9-6Z"/><path d="M5 13v6h14v-6M9 19v-4h6v4M12 4v12"/>'),
    shuffle:baseSvg('<path d="M3 6h4c5 0 5 12 10 12h4"/><path d="m18 15 3 3-3 3M3 18h4c2.4 0 3.6-2.7 5-5.5M15 6h6M18 3l3 3-3 3"/>'),
    target:baseSvg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>'),
    archive:baseSvg('<path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3zM9 11h6"/>'),
    filecheck:baseSvg('<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 14l2 2 4-4"/>'),
    users:baseSvg('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.5-4 2.6-6 6-6s5.5 2 6 6M14 15c3.4-.8 6 .8 7 4"/>'),
    usergear:baseSvg('<circle cx="9" cy="8" r="3"/><path d="M3 20c.5-4 2.6-6 6-6 1.4 0 2.6.3 3.5.9"/><circle cx="17.5" cy="16.5" r="2.5"/><path d="M17.5 12.5v1.2M17.5 19.3v1.2M13.5 16.5h1.2M20.3 16.5h1.2M14.7 13.7l.9.9M19.4 18.4l.9.9M20.3 13.7l-.9.9M15.6 18.4l-.9.9"/>'),
    database:baseSvg('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'),
    flag:baseSvg('<path d="M5 21V3M5 4h11l-2 4 2 4H5"/>'),
    scales:baseSvg('<path d="M12 3v18M5 6h14M7 6 3 14h8L7 6ZM17 6l-4 8h8l-4-8ZM8 21h8"/>'),
    star:baseSvg('<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>'),
    graduation:baseSvg('<path d="m2.5 9 9.5-5 9.5 5-9.5 5-9.5-5Z"/><path d="M6 11.5V16c2.9 2.7 9.1 2.7 12 0v-4.5M21.5 9v6"/>'),
    home:baseSvg('<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/>'),
    generic:baseSvg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>')
  };

  function iconName(label){
    const t=String(label||'').toLowerCase().replace(/\s+/g,' ').trim();
    if(t.includes('dashboard'))return'dashboard';
    if(t.includes('kegiatan'))return'calendar';
    if(t==='profil'||t.includes(' profil'))return'user';
    if(t.includes('layanan kepegawaian'))return'briefcase';
    if(t.includes('tpg')||t.includes('tamsil'))return'wallet';
    if(t.includes('monitoring'))return'chart';
    if(t.includes('notifikasi'))return'bell';
    if(t.includes('master sekolah')||t.includes('dapodik'))return'school';
    if(t.includes('distribusi'))return'shuffle';
    if(t.includes('kebutuhan gtk'))return'target';
    if(t.includes('arsip'))return'archive';
    if(t.includes('penerbitan sk'))return'filecheck';
    if(t.includes('tim ketenagaan'))return'users';
    if(t.includes('kelola pengguna'))return'usergear';
    if(t.includes('kelola seluruh data'))return'database';
    if(t.includes('pensiun'))return'flag';
    if(t.includes('disiplin')||t.includes('perceraian'))return'scales';
    if(t.includes('promosi'))return'star';
    if(t.includes('diklat')||t.includes('bcks'))return'graduation';
    if(t.includes('sekolah'))return'school';
    return'generic';
  }

  function ensureStyle(){
    if(document.getElementById('simantabBrandingIconStyle'))return;
    const s=document.createElement('style');
    s.id='simantabBrandingIconStyle';
    s.textContent=`
      .sim-icon{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 22px;color:currentColor}
      .sim-icon svg{width:100%;height:100%;display:block}
      .navbtn .ico{display:inline-flex!important;align-items:center;justify-content:center;width:24px;min-width:24px;height:24px;margin-right:10px;color:#dbeafe}
      .navbtn.active .ico{color:#fff}
      .sim-title-icon{width:30px;height:30px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;margin-right:10px;vertical-align:-6px;background:#eaf4ff;color:#0f5f9f}
      .sim-title-icon svg{width:20px;height:20px}
      .simantab-dev-footer{margin:24px auto 10px;padding:18px 14px;max-width:760px;text-align:center;border-top:1px solid #dbe3ec;color:#64748b;font-size:13px;line-height:1.55}
      .simantab-dev-footer .dev-row{display:flex;gap:8px;align-items:center;justify-content:center;font-weight:700;color:#334155;flex-wrap:wrap}
      .simantab-dev-footer .dev-mark{width:28px;height:28px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;background:#eaf4ff;color:#0f5f9f}
      .simantab-dev-footer .dev-mark svg{width:17px;height:17px}
      .simantab-dev-footer .dev-unit{margin-top:3px;font-weight:600}
      .simantab-dev-footer .dev-year{margin-top:1px;font-size:12px;letter-spacing:.08em;font-weight:800;color:#0f5f9f}
      @media(max-width:640px){.simantab-dev-footer{font-size:12px;padding:16px 10px;margin-top:18px}.sim-title-icon{width:28px;height:28px;margin-right:8px}}
    `;
    document.head.appendChild(s);
  }

  function footerMarkup(){
    return `<div class="dev-row"><span class="dev-mark">${ICON.generic}</span><span>Pengembang: ${DEV_NAME}</span></div><div class="dev-unit">${DEV_UNIT}</div><div class="dev-year">${DEV_YEAR}</div>`;
  }

  function decorateNav(){
    document.querySelectorAll('.navbtn').forEach(btn=>{
      const label=btn.textContent.replace(/\s+/g,' ').trim();
      let ico=btn.querySelector('.ico');
      if(!ico){ico=document.createElement('span');ico.className='ico';btn.prepend(ico)}
      const name=iconName(label);
      if(ico.dataset.simIcon===name)return;
      ico.dataset.simIcon=name;
      ico.innerHTML=`<span class="sim-icon">${ICON[name]||ICON.generic}</span>`;
    });
  }

  function decorateHeadings(){
    document.querySelectorAll('section.section .head h2').forEach(h=>{
      if(h.querySelector('.sim-title-icon'))return;
      const name=iconName(h.textContent);
      const span=document.createElement('span');
      span.className='sim-title-icon';
      span.innerHTML=ICON[name]||ICON.generic;
      h.prepend(span);
    });
  }

  function decorateFooters(){
    const footers=[...document.querySelectorAll('.footer')];
    const fallback=document.getElementById('simantabGlobalDevFooter');
    if(footers.length){
      fallback?.remove();
      footers.forEach(f=>{
        if(f.dataset.devBranding==='v1')return;
        f.dataset.devBranding='v1';
        f.classList.add('simantab-dev-footer');
        f.innerHTML=footerMarkup();
      });
      return;
    }
    if(!fallback){
      const f=document.createElement('div');
      f.id='simantabGlobalDevFooter';
      f.className='simantab-dev-footer';
      f.innerHTML=footerMarkup();
      document.body.appendChild(f);
    }
  }

  let pending=false;
  function refresh(){
    pending=false;
    ensureStyle();
    decorateNav();
    decorateHeadings();
    decorateFooters();
  }
  function schedule(){
    if(pending)return;
    pending=true;
    setTimeout(refresh,90);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
