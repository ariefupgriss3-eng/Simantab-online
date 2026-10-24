/* SIMANTAB_LOGIN_FORGOT_PASSWORD_V2_EMAIL_QUOTA_FEEDBACK */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const isSignup = () => {
    const field = $('nameWrap');
    return !!field && !field.classList.contains('hidden');
  };
  const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const notice = 'Permintaan pemulihan diterima oleh server. Jika email terdaftar dan layanan email tersedia, tautan akan dikirim. Ini belum memastikan email terkirim atau diterima. Periksa Inbox/Spam; bila tidak ada, hubungi Super Admin. Jangan meminta tautan berulang kali.';

  function openDialog() {
    if ($('simForgotModal')) return;
    const before = document.activeElement;
    const modal = document.createElement('div');
    modal.id = 'simForgotModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'simForgotTitle');
    modal.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(12,31,53,.68);display:grid;place-items:center;padding:16px';
    modal.innerHTML = '<div style="width:min(440px,100%);max-height:95vh;overflow:auto;background:#fff;color:#142a40;border-radius:16px;padding:22px;box-shadow:0 16px 45px #07152755">'
      + '<h2 id="simForgotTitle" style="margin:0 0 8px;font-size:21px">Lupa Password SIMANTAB</h2>'
      + '<p style="font-size:13px;line-height:1.5;margin:0 0 12px">Masukkan <b>email yang terdaftar</b>, bukan username atau NIP. Berlaku untuk akun Dinas dan Sekolah/GTK/Pengawas. Pengiriman membutuhkan layanan email yang tersedia; <b>konfirmasi permintaan tidak berarti pesan sudah diterima</b>.</p>'
      + '<form id="simForgotForm" novalidate><label for="simForgotEmail" style="display:block;margin-bottom:6px;font-weight:600">Email terdaftar</label>'
      + '<input id="simForgotEmail" type="email" autocomplete="email" inputmode="email" required placeholder="nama@contoh.id" style="display:block;width:100%;box-sizing:border-box;padding:11px;border:1px solid #a9bbcc;border-radius:9px;margin-bottom:13px">'
      + '<button id="simForgotSend" class="btn primary" type="submit" style="width:100%">Kirim Tautan Reset Password</button></form>'
      + '<div id="simForgotFeedback" role="status" aria-live="polite" style="font-size:13px;margin-top:12px;line-height:1.5"></div>'
      + '<button id="simForgotClose" type="button" style="margin-top:14px;border:0;background:transparent;color:#1767b3;text-decoration:underline;cursor:pointer;padding:5px">Kembali ke Login</button></div>';
    document.body.appendChild(modal);
    const emailField = $('simForgotEmail');
    const existing = String($('email')?.value || '').trim();
    if (validEmail(existing)) emailField.value = existing;

    const onEscape = event => { if (event.key === 'Escape') close(); };
    function close() {
      document.removeEventListener('keydown', onEscape);
      modal.remove();
      if (before?.focus) before.focus();
    }
    $('simForgotClose').addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    document.addEventListener('keydown', onEscape);
    $('simForgotForm').addEventListener('submit', async event => {
      event.preventDefault();
      const email = emailField.value.trim().toLowerCase();
      const feedback = $('simForgotFeedback'), send = $('simForgotSend');
      if (!validEmail(email)) {
        feedback.textContent = 'Masukkan alamat email yang valid dan terdaftar di SIMANTAB.';
        feedback.style.color = '#b42318';
        emailField.focus();
        return;
      }
      if (!window.__simantabSb?.auth?.resetPasswordForEmail) {
        feedback.textContent = 'Koneksi pemulihan akun belum tersedia. Muat ulang SIMANTAB lalu coba kembali.';
        feedback.style.color = '#b42318';
        return;
      }
      send.disabled = true;
      feedback.textContent = 'Meminta tautan pemulihan melalui Supabase Auth…';
      feedback.style.color = '#35536f';
      try {
        // Derive the callback solely from this application's HTTPS origin.
        // No user-supplied redirect is accepted.
        if (location.protocol !== 'https:') throw new Error('Pemulihan akun memerlukan HTTPS.');
        const callback = new URL('/', location.origin);
        callback.searchParams.set('simantab_recovery', '1');
        const { error } = await window.__simantabSb.auth.resetPasswordForEmail(email, {
          redirectTo: callback.toString()
        });
        if (error) throw error;
        feedback.textContent = notice;
        feedback.style.color = '#126349';
        send.textContent = 'Permintaan Terkirim';
      } catch (error) {
        const msg = String(error?.message || '');
        const code = String(error?.code || '');
        const detail = code + ' ' + msg;
        const emailQuota = /over_email_send_rate_limit|over_request_rate_limit|email rate limit exceeded|too many|rate.limit|429/i.test(detail);
        const senderRestricted = /email_address_not_authorized|email address not authorized|smtp.*not configured/i.test(detail);
        const redirectDenied = /redirect|redirect_to|uri not allowed/i.test(detail);
        feedback.textContent = emailQuota
          ? 'Permintaan ditolak server (HTTP 429): kuota pengiriman email pemulihan SIMANTAB sedang terlampaui. Tautan belum dikirim. Jangan menekan berulang kali. Hubungi Super Admin.'
          : senderRestricted
            ? 'Layanan pengiriman belum mengizinkan alamat email ini. Tautan belum dikirim. Hubungi Super Admin untuk pengaturan SMTP resmi.'
            : redirectDenied
              ? 'Alamat tautan pemulihan SIMANTAB belum diizinkan di Supabase. Tautan belum dikirim; hubungi Super Admin.'
              : 'Permintaan pemulihan gagal diproses. Periksa koneksi atau hubungi Super Admin. Jangan mendaftar ulang.';
        feedback.style.color = '#b42318';
        send.disabled = false;
      }
    });
    emailField.focus();
  }

  function mount() {
    const submit = $('authBtn');
    if (!submit || $('simForgotWrap')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'simForgotWrap';
    wrapper.style.cssText = 'margin:6px 0 13px;text-align:right';
    const link = document.createElement('button');
    link.type = 'button';
    link.id = 'simForgotLink';
    link.textContent = 'Lupa Password?';
    link.style.cssText = 'border:0;background:transparent;padding:8px 0;color:#1767b3;text-decoration:underline;font-weight:700;cursor:pointer;font-size:13px';
    wrapper.appendChild(link);
    submit.insertAdjacentElement('afterend', wrapper);
    link.addEventListener('click', openDialog);
    const sync = () => { wrapper.style.display = isSignup() ? 'none' : 'block'; };
    sync();
    $('switchLink')?.addEventListener('click', () => setTimeout(sync, 0));
    $('tabDinas')?.addEventListener('click', sync);
    $('tabGtk')?.addEventListener('click', sync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  setTimeout(mount, 300);
  setTimeout(mount, 1500);
  window.__simantabForgotPassword = { version: 2, enabled: true, quotaFeedback: true, neutralAcceptance: true };
})();
