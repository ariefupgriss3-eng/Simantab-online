/* SIMANTAB_KS_NEEDS_ONBOARDING_V1 */
(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 200 && (!window.__simantabSb || !window.showTab || !window.__simantabProfile); i++) await wait(50);
  const client = window.__simantabSb;
  if (!client || !window.showTab) return;

  const getProfile = () => window.__simantabProfile || {};
  if (getProfile().role !== 'KEPALA_SEKOLAH') return;

  let required = true;
  let checking = null;
  let message = 'Kepala Sekolah wajib mengisi dan mengajukan Kebutuhan GTK Riil sebelum memakai menu lain.';
  const banner = document.createElement('div');
  banner.id = 'simKsNeedsOnboarding';
  banner.setAttribute('role', 'status');
  banner.style.cssText = 'margin:0 0 14px;padding:15px 17px;border:1px solid #f0c980;border-left:5px solid #d97706;border-radius:12px;background:#fff8e8;color:#713f12;font-size:13px;line-height:1.5';

  function showBanner() {
    const section = document.getElementById('needs');
    if (!required || !section) { banner.remove(); return; }
    if (banner.parentElement !== section) section.prepend(banner);
    banner.textContent = message;
  }
  function setNavigation() {
    document.querySelectorAll('#nav .navbtn[data-tab]').forEach(button => {
      const blocked = required && button.dataset.tab !== 'needs';
      button.disabled = blocked;
      button.title = blocked ? 'Lengkapi Kebutuhan GTK Riil terlebih dahulu' : '';
    });
  }
  async function checkNeeds() {
    if (checking) return checking;
    checking = (async () => {
      const profile = getProfile();
      if (profile.role !== 'KEPALA_SEKOLAH') { required = false; return; }
      const npsn = String(profile.school_npsn || '').trim();
      if (!npsn) {
        required = true;
        message = 'NPSN akun Kepala Sekolah belum terhubung. Hubungi Super Admin untuk memperbaiki profil agar pengisian Kebutuhan GTK Riil dapat dilakukan.';
        return;
      }
      try {
        const { data: school, error: schoolError } = await client.from('school_master')
          .select('school_status').eq('npsn', npsn).maybeSingle();
        if (schoolError) throw schoolError;
        if (!school) throw new Error('Sekolah tidak ditemukan pada master sekolah. Hubungi Super Admin untuk memeriksa NPSN akun.');
        // Modul kebutuhan riil hanya berlaku untuk sekolah negeri, termasuk SKB negeri.
        if (String(school.school_status || '').toUpperCase() !== 'NEGERI') { required = false; return; }
        const { data: workflow, error } = await client.from('school_gtk_needs_workflow')
          .select('status').eq('school_npsn', npsn).maybeSingle();
        if (error) throw error;
        required = !['SUBMITTED', 'VERIFIED', 'APPROVED'].includes(String(workflow?.status || '').toUpperCase());
        message = 'Selamat datang. Isi Kebutuhan GTK Riil sekolah, simpan perubahan, lalu klik “Ajukan ke Dinas”. Menu lainnya terbuka setelah pengajuan berhasil.';
      } catch (error) {
        required = true;
        message = `Status Kebutuhan GTK Riil belum dapat diperiksa: ${error?.message || error}. Coba muat ulang halaman atau hubungi Super Admin.`;
      }
    })().finally(() => { checking = null; setNavigation(); showBanner(); });
    return checking;
  }

  const originalShowTab = window.showTab;
  window.showTab = async function (id) {
    if (required && id !== 'needs') id = 'needs';
    const result = await originalShowTab.call(this, id);
    if (required) showBanner();
    return result;
  };
  window.addEventListener('simantab:gtk-needs-submitted', async () => {
    await checkNeeds();
    if (!required) await window.showTab('dashboard');
  });
  const nav = document.getElementById('nav');
  if (nav) new MutationObserver(setNavigation).observe(nav, { childList: true });
  await checkNeeds();
  if (required) await window.showTab('needs');
})();
