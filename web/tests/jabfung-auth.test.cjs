'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Fully mocked: no login credentials, Supabase calls, storage writes, or live submissions.
const source = fs.readFileSync(path.join(__dirname, '..', 'jabfung-jenjang-enhancement.js'), 'utf8');

async function runCase(opts = {}) {
  const writes = { submissions: [], files: [], uploads: [], ai: [], profileChecks: 0 };
  const message = { textContent: '', className: '' };
  const button = { disabled: false };
  const authId = opts.authId ?? 'account-A';
  const profileId = opts.profileId ?? authId;
  const file = { name: 'SK_Pendidik.pdf', size: 1024, type: 'application/pdf' };
  const input = { dataset: { required: '1', code: 'SK_PENDIDIK' }, files: [file] };
  const sb = {
    auth: { getUser: async () =>
      opts.noAuth ? { data: { user: null }, error: { message: 'expired' } }
        : { data: { user: { id: authId } }, error: null } },
    from(table) {
      if (table === 'profiles') return {
        select: () => ({ eq: () => ({
          single: async () => {
            writes.profileChecks++;
            return { data: {
              id: authId, is_active: !opts.inactive,
              approval_status: opts.pending ? 'PENDING' : 'APPROVED'
            }, error: null };
          }
        }) })
      };
      if (table === 'submissions') return {
        insert(payload) {
          writes.submissions.push(payload);
          return { select: () => ({ single: async () =>
            opts.rlsDenied
              ? { data: null, error: { code: '42501', message: 'new row violates row-level security policy' } }
              : { data: { id: 'submission-1' }, error: null }
          }) };
        }
      };
      if (table === 'submission_files') return {
        insert: async payload => { writes.files.push(payload); return { error: null }; }
      };
      throw new Error('Unexpected table: ' + table);
    },
    storage: { from: () => ({ upload: async (key) => {
      writes.uploads.push(key);
      return { error: null };
    } }) },
    functions: { invoke: async (name, args) => {
      writes.ai.push({ name, args });
      return { data: { overall_status: 'SESUAI', counts: { sesuai: 1 } }, error: null };
    } }
  };
  const window = {
    __simantabSb: sb, __simantabProfile: { id: profileId },
    openSubmission() {}, showTab() {}
  };
  const document = {
    body: {},
    getElementById(id) {
      return { jabfungMsg: message, jabfungSendBtn: button, jabfungNotes: { value: '' } }[id] ?? null;
    },
    querySelectorAll(selector) { return selector === '.jabfungReqFile' ? [input] : []; }
  };
  class MutationObserver { observe() {} }
  const sandbox = {
    window, document, MutationObserver, crypto: { randomUUID: () => 'unique-id' },
    setTimeout() {}, console: { error() {} }
  };
  await vm.runInNewContext(source, sandbox, { timeout: 3000 });
  await window.submitJabfungJenjang();
  assert.equal(button.disabled, false);
  return { writes, message };
}

test('approved logged-in requester creates own submission without invoking AI', async () => {
  const { writes, message } = await runCase();
  assert.equal(writes.profileChecks, 1);
  assert.equal(writes.submissions.length, 1);
  assert.equal(writes.submissions[0].user_id, 'account-A');
  assert.equal(writes.files[0].user_id, 'account-A');
  assert.match(writes.uploads[0], /^account-A\/submission-1\/jabfung\//);
  assert.equal(writes.ai.length, 0);
  assert.match(message.textContent, /diperiksa manual/);
});

for (const [name, options, expected] of [
  ['stale profile', { profileId: 'different-user' }, /tidak sesuai/],
  ['expired login', { noAuth: true }, /Sesi login tidak dapat diverifikasi/],
  ['unapproved account', { pending: true }, /belum disetujui/],
  ['inactive account', { inactive: true }, /tidak aktif/]
]) {
  test(name + ' blocks all writes', async () => {
    const { writes, message } = await runCase(options);
    assert.equal(writes.submissions.length, 0);
    assert.equal(writes.files.length, 0);
    assert.equal(writes.uploads.length, 0);
    assert.equal(writes.ai.length, 0);
    assert.match(message.textContent, expected);
  });
}

test('RLS insert denial is reported without upload or AI', async () => {
  const { writes, message } = await runCase({ rlsDenied: true });
  assert.equal(writes.submissions.length, 1);
  assert.equal(writes.uploads.length, 0);
  assert.equal(writes.ai.length, 0);
  assert.match(message.textContent, /belum tersimpan/);
});
