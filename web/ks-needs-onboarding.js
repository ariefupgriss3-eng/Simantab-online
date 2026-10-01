/* SIMANTAB_KS_NEEDS_ONBOARDING_V1 */
(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 200 && (!window.__simantabSb || !window.showTab || !window.__simantabProfile); i++) await wait(50);
  const client = window.__simantabSb;
  if (!client || !window.showTab) return;

  const getProfile = () => window.__simantabProfile || {};
  const params = new URLSearchParams(window.location.search);
  const testMode = window.location.hostname.includes('git-feat-ks-needs-first-login') && params.get('ks_needs_test') === 'draft';
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
    if (!testMode) {
      banner.textContent = message;
      return;
    }
    banner.innerHTML = '';
    const text = document.createElement('div');
    text.textContent = 'MODE UJI PREVIEW — akun ini diperlakukan seolah-olah belum mengajukan Kebutuhan GTK Riil. Tidak ada data Supabase yang diubah.';
    text.style.fontWeight = '700';
    banner.appendChild(text);
    const detail = document.createElement('div');
    detail.textContent = message;
    detail.style.marginTop = '6px';
    banner.appendChild(detail);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Simulasikan pengajuan berhasil';
    button.style.cssText = 'margin-top:10px;padding:8px 12px;border:0;border-radius:8px;background:#92400e;color:white;font-weight:700;cursor:pointer';
    button.onclick = async () => {
      required = false;
      setNavigation();
      showBanner();
      await window.showTab('dashboard');
    };
    banner.appendChild(button);
  }

  function setNavigation() {
    document.querySelectorAll('#nav .navbtn[data-tab]').forEach(button => {
      const shouldBlock = required && button.dataset.tab !== 'needs';
      if (shouldBlock) {
        if (!button.dataset.ksNeedsBlocked) {
          button.dataset.ksNeedsBlocked = '1';
          button.dataset.ksNeedsPrevDisabled = button.disabled ? '1' : '0';
          button.dataset.ksNeedsPrevTitle = button.title || '';
        }
        button.disabled = true;
        button.title = 'Lengkapi Kebutuhan GTK Riil terlebih dahulu';
        return;
      }

      if (button.dataset.ksNeedsBlocked === '1') {
        button.disabled = button.dataset.ksNeedsPrevDisabled === '1';
        button.title = button.dataset.ksNeedsPrevTitle || '';
        delete button.dataset.ksNeedsBlocked;
        delete button.dataset.ksNeedsPrevDisabled;
        delete button.dataset.ksNeedsPrevTitle;
      }
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
        required = testMode || !['SUBMITTED', 'VERIFIED', 'APPROVED'].includes(String(workflow?.status || '').toUpperCase());
        message = testMode
          ? 'Uji: menu lain harus terkunci dan halaman diarahkan ke Kebutuhan GTK Riil. Gunakan tombol simulasi pada banner untuk menguji pembukaan menu kembali.'
          : 'Selamat datang. Isi Kebutuhan GTK Riil sekolah, simpan perubahan, lalu klik “Ajukan ke Dinas”. Menu lainnya terbuka setelah pengajuan berhasil.';
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
