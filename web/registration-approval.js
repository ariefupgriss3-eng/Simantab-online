/* SIMANTAB_REGISTRATION_APPROVAL_V3 */
(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 100 && (!window.__simantabSb || !window.showTab); i++) await wait(50);
  const sb = window.__simantabSb;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const isSA = () => window.__simantabProfile?.role === 'SUPER_ADMIN';
  if (!sb) return;

  let pendingById = new Map();
  let busy = false;
  const allowedRoles = ['KEPALA_SEKOLAH', 'PENGAWAS', 'GTK'];
  const labelRole = role => ({
    KEPALA_SEKOLAH: 'Kepala Sekolah',
    PENGAWAS: 'Pengawas',
    GTK: 'GTK'
  }[role] || role);

  async function render() {
    if (!isSA()) return;
    const box = $('usersBody');
    if (!box) return;
    box.querySelector('[data-regapproval]')?.remove();
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.regapproval = '1';
    card.style.marginBottom = '12px';

    const { data, error } = await sb.from('profiles')
      .select('id,full_name,nip,username,requested_role,unit,position,school_npsn,approval_status,is_active,created_at')
      .eq('approval_status', 'PENDING')
      .in('requested_role', allowedRoles)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) {
      card.innerHTML = '<h3>Persetujuan Akun KS / Pengawas / GTK</h3><div class="err">' +
        esc(error.message || 'Gagal memuat pendaftaran.') + '</div>';
      box.prepend(card);
      return;
    }

    const rows = data || [];
    pendingById = new Map(rows.map(row => [row.id, row]));
    const nipCount = new Map();
    for (const row of rows) {
      const nip = String(row.nip || '').trim();
      if (nip) nipCount.set(nip, (nipCount.get(nip) || 0) + 1);
    }
    card.innerHTML = `<h3 style="margin-top:0">Persetujuan Akun KS / Pengawas / GTK</h3>
      <div class="small">Status <b>AKTIF</b> berbeda dari <b>DISETUJUI</b>.
      Persetujuan hanya dianggap berhasil setelah database menunjukkan <b>APPROVED</b>.
      Periksa NIP dan unit kerja sebelum menyetujui akun ganda.</div>
      ${rows.length ? `<div class="tablewrap"><table>
      <thead><tr><th>Nama / Username</th><th>Peran</th><th>NIP</th><th>Unit kerja</th><th>Status akun</th><th>Aksi</th></tr></thead>
      <tbody>${rows.map(row => {
        const dup = (nipCount.get(String(row.nip || '').trim()) || 0) > 1;
        return `<tr>
          <td><b>${esc(row.full_name || '-')}</b><div class="small">${esc(row.username || '-')}</div></td>
          <td>${esc(labelRole(row.requested_role))}</td>
          <td>${esc(row.nip || '-')} ${dup ? '<div class="small" style="color:#b45309">NIP memiliki lebih dari satu akun PENDING</div>' : ''}</td>
          <td>${esc(row.unit || '-')}</td>
          <td><b>PENDING</b><div class="small">${row.is_active ? 'Aktif' : 'Nonaktif'}</div></td>
          <td><button class="btn success" onclick="__reviewRegistration('${esc(row.id)}','APPROVE')">✓ Setujui</button>
          <button class="btn danger" onclick="__reviewRegistration('${esc(row.id)}','REJECT')">Tolak</button></td>
        </tr>`;
      }).join('')}</tbody></table></div>`
      : '<div class="info">Tidak ada pendaftaran GTK, Kepala Sekolah, atau Pengawas yang menunggu persetujuan.</div>'}`;
    box.prepend(card);
  }

  async function errorDetails(error) {
    try {
      const value = await error?.context?.clone?.().json();
      if (value?.error) return String(value.error);
    } catch (_) { /* non-JSON response */ }
    return error?.message || 'Permintaan gagal diproses.';
  }

  window.__reviewRegistration = async (id, decision) => {
    if (!isSA()) return alert('Hanya Super Admin.');
    if (busy) return;
    const target = pendingById.get(id);
    if (!target) return alert('Akun tidak ditemukan di daftar PENDING. Segarkan halaman.');
    if (!['APPROVE', 'REJECT'].includes(decision)) return;
    const nip = String(target.nip || '').trim();

    try {
      busy = true;
      const { data: sessionResult, error: sessionError } = await sb.auth.getSession();
      if (sessionError || !sessionResult?.session?.access_token)
        throw new Error('Sesi Super Admin berakhir. Silakan login kembali.');

      if (decision === 'APPROVE' && nip) {
        const { data: sameNip, error: duplicateError } = await sb.from('profiles')
          .select('id,full_name,approval_status,is_active,unit')
          .eq('nip', nip);
        if (duplicateError) throw duplicateError;
        if ((sameNip || []).some(account => account.id !== id &&
          account.approval_status === 'APPROVED' && account.is_active)) {
          throw new Error('NIP ini sudah memiliki akun aktif yang disetujui. Jangan setujui akun ganda.');
        }
      }

      const actionLabel = decision === 'APPROVE' ? 'Setujui' : 'Tolak';
      if (!confirm(`${actionLabel} pendaftaran akun ini?\n\n${target.full_name || '-'}\n${labelRole(target.requested_role)}\nNIP: ${nip || '-'}\nUnit: ${target.unit || '-'}\n\nGunakan akun utama apabila terdapat pendaftaran ganda.`)) return;

      const { data, error } = await sb.functions.invoke('simantab-review-registration', {
        body: { user_id: id, decision }
      });
      if (error) {
        const detail = await errorDetails(error);
        throw new Error(detail + '\n\nJika menggunakan Cloudflare, periksa apakah origin ' +
          window.location.origin + ' diizinkan oleh CORS Edge Function.');
      }
      if (data?.error) throw new Error(data.error);
      const intended = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      if (!data?.ok || data?.profile?.approval_status !== intended) {
        throw new Error('Server belum mengonfirmasi status ' + intended + '.');
      }

      const { data: latest, error: reloadError } = await sb.from('profiles')
        .select('id,approval_status,is_active')
        .eq('id', id)
        .single();
      if (reloadError) throw reloadError;
      if (latest.approval_status !== intended ||
          latest.is_active !== (decision === 'APPROVE')) {
        throw new Error('Status pada database tidak cocok. Silakan periksa kembali.');
      }

      alert(decision === 'APPROVE'
        ? 'Akun benar-benar DISETUJUI (APPROVED), email dikonfirmasi, dan akses diaktifkan.'
        : 'Pendaftaran tercatat DITOLAK (REJECTED) dan akun dinonaktifkan.');
      await render();
    } catch (error) {
      alert(error?.message || 'Persetujuan gagal.');
    } finally {
      busy = false;
    }
  };

  const oldShowTab = window.showTab;
  window.showTab = async tab => {
    const result = await oldShowTab(tab);
    if (tab === 'users') {
      await wait(120);
      await render();
    }
    return result;
  };
  for (let i = 0; i < 60 && !window.__simantabProfile; i++) await wait(100);
  if (isSA() && document.querySelector('.section.active')?.id === 'users')
    await render();
  window.__simantabRegistrationApproval = { version: 3, emailConfirmOnApproval: true };
})();
