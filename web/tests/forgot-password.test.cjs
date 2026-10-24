'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'login-forgot-password.js'), 'utf8');

class FakeURL {
  constructor(pathname, origin) {
    this.pathname = pathname;
    this.origin = origin;
    this.params = {};
    this.searchParams = { set: (k, v) => { this.params[k] = v; } };
  }
  toString() {
    return this.origin + this.pathname + '?' + new URLSearchParams(this.params).toString();
  }
}
class Element {
  constructor(id, document) {
    this.id = id;
    this.doc = document;
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.disabled = false;
    this.handlers = {};
    this.classes = new Set();
    this.classList = { contains: name => this.classes.has(name) };
  }
  set innerHTML(html) {
    this.html = html;
    for (const match of html.matchAll(/id="([^"]+)"/g)) {
      this.doc.elements.set(match[1], new Element(match[1], this.doc));
    }
  }
  setAttribute() {}
  appendChild(node) { this.doc.elements.set(node.id, node); }
  insertAdjacentElement(where, node) { this.doc.elements.set(node.id, node); }
  addEventListener(type, cb) { (this.handlers[type] ||= []).push(cb); }
  focus() {}
  remove() { this.doc.elements.delete(this.id); }
  async fire(type) {
    for (const cb of this.handlers[type] || []) {
      await cb({ preventDefault() {}, target: this });
    }
  }
}

function fixture({ channel = 'login', entered = '', error = null } = {}) {
  const document = {
    elements: new Map(),
    readyState: 'complete',
    createElement() { return new Element('', this); },
    getElementById(id) { return this.elements.get(id) || null; },
    addEventListener() {},
    removeEventListener() {}
  };
  for (const id of ['authBtn', 'email', 'nameWrap', 'switchLink', 'tabDinas', 'tabGtk']) {
    document.elements.set(id, new Element(id, document));
  }
  document.elements.get('email').value = entered;
  if (channel === 'login') document.elements.get('nameWrap').classes.add('hidden');
  document.body = new Element('body', document);
  document.activeElement = document.getElementById('authBtn');
  const calls = [];
  const window = { __simantabSb: { auth: {
    async resetPasswordForEmail(email, options) {
      calls.push({ email, options });
      return { error };
    }
  } } };
  const location = {
    origin: 'https://simantab-cf-preview.example.workers.dev',
    protocol: 'https:'
  };
  vm.runInNewContext(source, {
    window, document, location, URL: FakeURL,
    setTimeout(fn, delay) { if (delay === 0) fn(); }
  });
  return { calls, document, window };
}

test('link appears only on login page and mounts once', () => {
  const { document } = fixture();
  assert.equal(document.getElementById('simForgotLink').textContent, 'Lupa Password?');
  assert.equal(document.getElementById('simForgotWrap').style.display, 'block');
  assert.equal(document.getElementById('simForgotLink').type, 'button');
  const registration = fixture({ channel: 'signup' });
  assert.equal(registration.document.getElementById('simForgotWrap').style.display, 'none');
});

test('registered email request sends reset only to current HTTPS origin', async () => {
  const { document, calls } = fixture({ entered: 'PEGAWAI@EXAMPLE.ID' });
  await document.getElementById('simForgotLink').fire('click');
  assert.equal(document.getElementById('simForgotEmail').value, 'PEGAWAI@EXAMPLE.ID');
  await document.getElementById('simForgotForm').fire('submit');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].email, 'pegawai@example.id');
  assert.equal(calls[0].options.redirectTo, 'https://simantab-cf-preview.example.workers.dev/?simantab_recovery=1');
  assert.match(document.getElementById('simForgotFeedback').textContent, /belum memastikan email terkirim/);
});

test('username cannot be used to request reset and invalid email does not call server', async () => {
  const { document, calls } = fixture({ entered: 'gtk_username' });
  await document.getElementById('simForgotLink').fire('click');
  assert.equal(document.getElementById('simForgotEmail').value, '');
  document.getElementById('simForgotEmail').value = 'wrong';
  await document.getElementById('simForgotForm').fire('submit');
  assert.equal(calls.length, 0);
  assert.match(document.getElementById('simForgotFeedback').textContent, /email yang valid/);
});

test('rate limits are handled without bypass or password disclosure', async () => {
  const { document, calls } = fixture({ error: { message: 'Too many requests: rate limit' } });
  await document.getElementById('simForgotLink').fire('click');
  document.getElementById('simForgotEmail').value = 'gtk@example.id';
  await document.getElementById('simForgotForm').fire('submit');
  assert.equal(calls.length, 1);
  assert.equal(document.getElementById('simForgotSend').disabled, false);
  assert.match(document.getElementById('simForgotFeedback').textContent, /kuota pengiriman email/);
  assert.match(document.getElementById('simForgotFeedback').textContent, /Tautan belum dikirim/);
});

test('Supabase project email-send quota is distinguished from a user's invalid password', async () => {
  const { document } = fixture({ error: { code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' } });
  await document.getElementById('simForgotLink').fire('click');
  document.getElementById('simForgotEmail').value = 'gtk@example.id';
  await document.getElementById('simForgotForm').fire('submit');
  const msg = document.getElementById('simForgotFeedback').textContent;
  assert.match(msg, /kuota pengiriman email/);
  assert.match(msg, /Super Admin/);
  assert.doesNotMatch(msg, /password salah/i);
});
test('pre-authorized email restriction requests SMTP setup and does not claim success', async () => {
  const { document } = fixture({ error: { message: 'Email address not authorized' } });
  await document.getElementById('simForgotLink').fire('click');
  document.getElementById('simForgotEmail').value = 'gtk@example.id';
  await document.getElementById('simForgotForm').fire('submit');
  const msg = document.getElementById('simForgotFeedback').textContent;
  assert.match(msg, /SMTP resmi/);
  assert.match(msg, /Tautan belum dikirim/);
});
test('v2 messages do not make delivery guarantees or reveal account existence', () => {
  assert.match(source, /SIMANTAB_LOGIN_FORGOT_PASSWORD_V2_EMAIL_QUOTA_FEEDBACK/);
  assert.match(source, /konfirmasi permintaan tidak berarti pesan sudah diterima/);
  assert.match(source, /Jika email terdaftar/);
  assert.doesNotMatch(source, /service_role/);
});
