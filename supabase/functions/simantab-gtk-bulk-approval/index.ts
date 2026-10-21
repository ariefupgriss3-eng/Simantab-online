import { createClient } from "npm:@supabase/supabase-js@2.57.4";

/* SIMANTAB_GTK_BULK_APPROVAL_V1
 * Preview + Super Admin-selected approval. Never auto-approve on page load.
 * Every target is rechecked atomically by simantab_gtk_bulk_approve_one.
 */
const ALLOWED_ORIGINS = new Set([
  "https://simantab-online.vercel.app",
  "https://simantab-cf-preview.m-arief-rohman.workers.dev",
  "https://feature-cloudflare-jf-guru-2026-0294-simantab-cf-preview.m-arief-rohman.workers.dev",
  "https://simantab.m-arief-rohman.workers.dev",
]);
const VALID_ROLES = new Set(["GTK", "KEPALA_SEKOLAH", "PENGAWAS"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nipKey = (v: unknown) => String(v ?? "").replace(/\D/g, "");
const workUnit = (p: Record<string, unknown>) =>
  String(p.unit_gtk ?? "").trim() || String(p.unit ?? "").trim();
const maskNip = (v: unknown) => {
  const n = nipKey(v);
  return n.length === 18 ? "••••••••••••••" + n.slice(-4) : "Tidak tersedia";
};
function corsFor(origin: string | null): HeadersInit {
  const cors: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) cors["Access-Control-Allow-Origin"] = origin;
  return cors;
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = corsFor(origin);
  const reply = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers });
  if (req.method === "OPTIONS")
    return new Response(null, { status: origin && !ALLOWED_ORIGINS.has(origin) ? 403 : 204, headers });
  if (req.method !== "POST") return reply({ error: "Metode tidak diizinkan" }, 405);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply({ error: "Origin tidak diizinkan" }, 403);

  try {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return reply({ error: "Login ulang sebagai Super Admin diperlukan" }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return reply({ error: "Konfigurasi layanan tidak lengkap" }, 503);
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { data: auth, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !auth?.user) return reply({ error: "Sesi tidak valid" }, 401);
    const { data: actor, error: actorError } = await admin.from("profiles")
      .select("role,is_active,approval_status").eq("id", auth.user.id).single();
    if (actorError || !actor || actor.role !== "SUPER_ADMIN" ||
        actor.is_active !== true || actor.approval_status !== "APPROVED")
      return reply({ error: "Hanya Super Admin aktif dan disetujui" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toUpperCase();
    if (!["PREVIEW", "APPROVE_SELECTED"].includes(action))
      return reply({ error: "Aksi tidak dikenal" }, 400);

    // Paginate: never approve from a silently truncated Supabase default 1000-row read.
    const profiles: Record<string, any>[] = [];
    const PAGE_SIZE = 500;
    for (let start = 0; start < 10000; start += PAGE_SIZE) {
      const { data, error } = await admin.from("profiles")
        .select("id,full_name,nip,role,requested_role,approval_status,is_active,account_channel,unit,unit_gtk,school_npsn")
        .order("id", { ascending: true }).range(start, start + PAGE_SIZE - 1);
      if (error) throw error;
      profiles.push(...(data || []));
      if ((data || []).length < PAGE_SIZE) break;
      if (start + PAGE_SIZE >= 10000)
        return reply({ error: "Batas keamanan audit tercapai; hubungi admin database" }, 503);
    }

    const multiplicity = new Map<string, number>();
    for (const p of profiles) {
      const key = nipKey(p.nip);
      if (key.length === 18) multiplicity.set(key, (multiplicity.get(key) || 0) + 1);
    }
    const pending = profiles.filter(p =>
      p.account_channel === "GTK" && p.approval_status === "PENDING");

    const npsns = [...new Set(pending.filter(p=>p.requested_role==="KEPALA_SEKOLAH")
      .map(p => String(p.school_npsn || "")).filter(Boolean))];
    const schools = new Set<string>();
    if (npsns.length) {
      const { data, error } = await admin.from("school_master")
        .select("npsn,is_active,school_status").in("npsn", npsns);
      if (error) throw error;
      for (const s of data || []) {
        if (s.is_active === true && String(s.school_status || "").toUpperCase() === "NEGERI")
          schools.add(s.npsn);
      }
    }
    const eligible = pending.filter(p => {
      const key = nipKey(p.nip);
      return p.is_active === false &&
        VALID_ROLES.has(String(p.role || "")) &&
        VALID_ROLES.has(String(p.requested_role || "")) &&
        String(p.full_name || "").trim().length >= 3 &&
        workUnit(p).length > 0 &&
        /^[0-9]{18}$/.test(String(p.nip || "")) &&
        multiplicity.get(key) === 1 &&
        (p.requested_role !== "KEPALA_SEKOLAH" ||
         schools.has(String(p.school_npsn || "")));
    });
    if (action === "PREVIEW") {
      const items = eligible.map(p => ({
        id: p.id, full_name: p.full_name, role: p.requested_role,
        unit: workUnit(p), nip_masked: maskNip(p.nip),
        school_npsn: p.requested_role === "KEPALA_SEKOLAH" ? p.school_npsn : null,
      }));
      return reply({ ok: true, eligible_count: items.length, pending_count: pending.length,
        manual_count: pending.length - items.length, items });
    }

    // Frontend cannot override this server-side confirmation and candidate validation.
    const selected = body.user_ids;
    if (!Array.isArray(selected) || selected.length < 1 || selected.length > 50 ||
        selected.some((v: unknown) => typeof v !== "string" || !UUID.test(v)) ||
        new Set(selected).size !== selected.length ||
        body.verified_identity_and_role !== true ||
        body.confirmation !== "SETUJUI AKUN TERPILIH")
      return reply({ error: "Pilih maksimal 50 akun dan konfirmasi verifikasi identitas/peran" }, 400);
    const allowed = new Map(eligible.map(p => [p.id, p]));
    if (selected.some((id: string) => !allowed.has(id)))
      return reply({ error: "Daftar berubah atau masih ada akun bermasalah. Perbarui pemeriksaan sebelum melanjutkan." }, 409);

    const batchId = crypto.randomUUID();
    const results: { id: string; outcome: string; detail: string }[] = [];
    for (const target of selected) {
      try {
        const { data: authTarget, error: userError } = await admin.auth.admin.getUserById(target);
        if (userError || !authTarget?.user) {
          results.push({ id: target, outcome: "ERROR", detail: "Akun autentikasi tidak ditemukan" });
          continue;
        }
        if (!authTarget.user.email_confirmed_at) {
          const { error: confirmError } = await admin.auth.admin.updateUserById(target, { email_confirm: true });
          if (confirmError) throw confirmError;
        }
        // DB transaction locks row/NIP; rechecks every condition and writes durable audit.
        const { data, error } = await admin.rpc("simantab_gtk_bulk_approve_one",
          { _target: target, _actor: auth.user.id, _batch: batchId });
        if (error) throw error;
        const outcome = data?.[0]?.outcome;
        const detail = String(data?.[0]?.detail || "");
        results.push({ id: target, outcome: outcome === "APPROVED" ? "APPROVED" : "SKIPPED", detail });
      } catch (error) {
        console.error("SIMANTAB_GTK_BULK_PER_TARGET", target, String((error as Error)?.message || error));
        results.push({ id: target, outcome: "ERROR", detail: "Gagal memproses; periksa log server" });
      }
    }
    const approved = results.filter(r=>r.outcome==="APPROVED").length;
    console.info("SIMANTAB_GTK_BULK_SUMMARY", JSON.stringify({
      batch_id: batchId, actor_id: auth.user.id,
      selected: selected.length, approved,
      skipped: results.filter(r=>r.outcome==="SKIPPED").length,
      errors: results.filter(r=>r.outcome==="ERROR").length,
    }));
    return reply({ ok:true, batch_id:batchId, selected: selected.length, approved,
      skipped: results.filter(r=>r.outcome==="SKIPPED").length,
      errors: results.filter(r=>r.outcome==="ERROR").length, results });
  } catch (error) {
    console.error("SIMANTAB_GTK_BULK_FATAL", String((error as Error)?.message || error));
    return reply({ error: "Gagal memeriksa akun. Coba lagi atau hubungi admin teknis." }, 500);
  }
});
