/* SIMANTAB_REGISTRATION_APPROVAL_V5 */
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
      .select('id,full_name,nip,username,role,requested_role,unit,position,school_npsn,approval_status,is_active,created_at')
      .eq('approval_status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(1000);

    if (error) {
      card.innerHTML = '<h3>Persetujuan Akun KS / Pengawas / GTK</h3><div class="err">' +
        esc(error.message || 'Gagal memuat pendaftaran.') + '</div>';
      box.prepend(card);
      return;
    }

    const all = data || [];
    const rows = all.filter(row => allowedRoles.includes(String(row.requested_role || '')));
    const institutionals = all.filter(row => ['OPERATOR_SMP', 'OPERATOR_KORWIL'].includes(String(row.requested_role || '')));
    const needsReview = all.filter(row => !allowedRoles.includes(String(row.requested_role || '')) &&
      !['OPERATOR_SMP', 'OPERATOR_KORWIL'].includes(String(row.requested_role || '')));
    const normalizedName = name => String(name || '').toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ').trim().split(/ +/).filter(Boolean).sort().join(' ');
    pendingById = new Map(rows.map(row => [row.id, row]));
    const nipCount = new Map();
    for (const row of rows) {
      const nip = String(row.nip || '').trim();
      if (nip) nipCount.set(nip, (nipCount.get(nip) || 0) + 1);
    }
    card.innerHTML = `<h3 style="margin-top:0">Persetujuan Akun KS / Pengawas / GTK</h3>
      <div class="small"><b>Total PENDING: ${all.length}</b> • GTK/KS/Pengawas: ${rows.length} • Operator institusi: ${institutionals.length} • Perlu koreksi peran: ${needsReview.length}</div>
      <div class="small">Status <b>AKTIF</b> berbeda dari <b>DISETUJUI</b>.
      Persetujuan hanya dianggap berhasil setelah database menunjukkan <b>APPROVED</b>.
      Periksa NIP dan unit kerja sebelum menyetujui akun ganda.</div>
      ${rows.length ? `<div class="tablewrap"><table>
      <thead><tr><th>Nama / Username</th><th>Peran</th><th>NIP</th><th>Unit kerja</th><th>Status akun</th><th>Aksi</th></tr></thead>
      <tbody>${rows.map(row => {
        const nip = String(row.nip || '').trim();
        const sameNip = nip ? rows.filter(other => String(other.nip || '').trim() === nip) : [];
        const dup = sameNip.length > 1;
        const nameConflict = dup && (new Set(sameNip.map(other => normalizedName(other.full_name)))).size > 1;
        const secondary = dup && !row.is_active && sameNip.some(other =>
          other.id !== row.id && other.is_active);
        return `<tr>
          <td><b>${esc(row.full_name || '-')}</b><div class="small">${esc(row.username || '-')}</div></td>
          <td>${esc(labelRole(row.requested_role))}</td>
          <td>${esc(row.nip || '-')} ${dup ? '<div class="small" style="color:#b45309">NIP memiliki lebih dari satu akun PENDING</div>' : ''} ${nameConflict ? '<div class="small" style="color:#b91c1c">Nama berbeda untuk NIP yang sama: PERIKSA IDENTITAS</div>' : ''}</td>
          <td>${esc(row.unit || '-')}</td>
          <td><b>PENDING</b><div class="small">${row.is_active ? 'Aktif' : 'Nonaktif'}</div></td>
          <td><button type="button" class="btn success" ${nameConflict || secondary ? 'disabled title="Periksa identitas atau gunakan akun utama"' : ''} data-regapproval-action="APPROVE" data-regapproval-id="${esc(row.id)}">✓ Setujui</button>
          <button type="button" class="btn danger" data-regapproval-action="REJECT" data-regapproval-id="${esc(row.id)}">Tolak</button></td>
        </tr>`;
      }).join('')}</tbody></table></div>`
      : '<div class="info">Tidak ada pendaftaran GTK, Kepala Sekolah, atau Pengawas yang menunggu persetujuan.</div>'}`;

    // Use a real DOM listener. Inline onclick strings are malformed in v4 and may be blocked by CSP.
    card.addEventListener('click', async event => {
      const button = event.target?.closest?.('button[data-regapproval-action]');
      if (!button || !card.contains(button) || button.disabled) return;
      event.preventDefault();
      const id = button.dataset.regapprovalId;
      const decision = button.dataset.regapprovalAction;
      if (!pendingById.has(id) || !['APPROVE', 'REJECT'].includes(decision)) {
        alert('Data akun tidak sesuai. Segarkan daftar persetujuan.');
        return;
      }
      if (busy) {
        alert('Persetujuan akun lain sedang diproses. Mohon tunggu.');
        return;
      }
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = '⏳ Memeriksa...';
      try {
        if (typeof window.__reviewRegistration !== 'function') {
          throw new Error('Fungsi persetujuan belum siap. Muat ulang halaman.');
        }
        await window.__reviewRegistration(id, decision);
      } catch (error) {
        alert(error?.message || 'Gagal menjalankan fungsi persetujuan.');
      } finally {
        if (button.isConnected) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    });

    const operatorBlock = document.createElement('details');
    operatorBlock.style.marginTop = '12px';
    const operatorHeading = document.createElement('summary');
    operatorHeading.textContent = 'Operator institusi PENDING (' + institutionals.length + ') — aktivasi terpisah, bukan persetujuan GTK';
    const operatorRows = document.createElement('div');
    operatorRows.className = 'small';
    operatorRows.style.maxHeight = '220px';
    operatorRows.style.overflow = 'auto';
    operatorRows.style.padding = '8px 12px';
    operatorRows.innerHTML = institutionals.map(row => '<div style="padding:4px 0">' +
      esc(row.full_name || '-') + ' — ' + esc(labelRole(row.requested_role)) + '</div>').join('') ||
      '<div>Tidak ada akun operator yang menunggu.</div>';
    operatorBlock.append(operatorHeading, operatorRows);
    card.append(operatorBlock);

    if (needsReview.length) {
      const reviewBox = document.createElement('div');
      reviewBox.className = 'info';
      reviewBox.style.marginTop = '12px';
      reviewBox.innerHTML = '<b>Perlu pemeriksaan peran (' + needsReview.length + '):</b><div class="small">' +
        needsReview.map(row => '<div style="margin-top:5px">' + esc(row.full_name || '-') +
          ' — role: ' + esc(row.role || '-') +
          '; requested_role: ' + esc(row.requested_role || '-') +
          '; unit: ' + esc(row.unit || '-') +
          '. Tidak dapat disetujui dari antrean GTK.</div>').join('') + '</div>';
      card.append(reviewBox);
    }
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
        const norm = value => String(value || '').toLowerCase()
          .replace(/[^a-z0-9 ]/g, ' ').trim().split(/ +/).filter(Boolean).sort().join(' ');
        if ((sameNip || []).some(account => account.id !== id &&
          norm(account.full_name) !== norm(target.full_name))) {
          throw new Error('Ada nama berbeda dengan NIP yang sama. Verifikasi identitas dan perbaiki NIP terlebih dahulu.');
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
  window.__simantabRegistrationApproval = { version: 5, emailConfirmOnApproval: true };
})();
