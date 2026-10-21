import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const ui=read('../gtk-daily-report.js');
const post=read('../cloudflare/postbuild.mjs');
const guard=read('../cloudflare/verify-deployment-bundle.mjs');
const sql=read('../../supabase/migrations/20261021220000_gtk_daily_snapshot_cron.sql');

test('Cloudflare loads the same read-only Dinas report exactly once',()=>{
 assert.match(ui,/SIMANTAB_GTK_DAILY_REPORT_V1/);
 assert.match(ui,/window\.__simantabSb\.rpc\('simantab_gtk_daily_report'\)/);
 assert.match(ui,/roleOk\(window\.__simantabProfile\)/);
 assert.match(post,/gtk-daily-report\.js\?v=1/);
 assert.match(guard,/gtk-daily-report\.js\?v=1/);
 assert.doesNotMatch(ui,/service_role|SUPABASE_SERVICE_ROLE_KEY|api_key|auth\.admin/i);
});
test('Daily snapshot only collects aggregates for 22–26 Oct at 08 WIB',()=>{
 assert.match(sql,/0 1 22-26 10 \*/);
 assert.match(sql,/Asia\/Jakarta/);
 assert.match(sql,/simantab_ops\.capture_gtk_daily_report/);
 assert.match(sql,/report_date BETWEEN DATE '2026-10-21' AND DATE '2026-10-26'/);
 assert.match(sql,/total_sasaran_resmi',NULL/);
 assert.match(sql,/NIP_BENTUR_AKTIF/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.profiles|DELETE\s+FROM\s+public\.profiles/i);
});
test('RPC enforces active approved Dinas roles, no anonymous reporting',()=>{
 assert.match(sql,/SECURITY DEFINER SET search_path = ''/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/account_channel='DINAS'/);
 assert.match(sql,/approval_status='APPROVED' AND is_active IS TRUE/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.simantab_gtk_daily_report\(date\) FROM PUBLIC, anon/);
 assert.match(sql,/REVOKE ALL ON simantab_ops\.gtk_daily_reports FROM PUBLIC, anon, authenticated/);
});
