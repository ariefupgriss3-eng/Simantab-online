/* SIMANTAB_GTK_BULK_APPROVAL_UI_V4
 * Only SUPER_ADMIN can preview and select verified distinct-NIP GTK accounts.
 * No implicit selection or approval, no storage of sensitive data.
 */
(async () => {
  "use strict";
  if (window.__simantabGtkBulkApproval) return;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 140 && (!window.__simantabSb || !window.showTab); i++) await sleep(50);
  const sb = window.__simantabSb;
  if (!sb || !window.showTab) return;
  const $ = id => document.getElementById(id);
  const isAdmin = () => {
    const p = window.__simantabProfile;
    return p?.role === "SUPER_ADMIN"; // Server rechecks activation and approval status.
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const fmt = n => Number(n || 0).toLocaleString("id-ID");
  const roleLabel = role => ({ GTK:"GTK", KEPALA_SEKOLAH:"Kepala Sekolah", PENGAWAS:"Pengawas" })[role] || role;
  let preview = null, selected = new Set(), acknowledged = false, busy = false, summary = "", batchResults = [];
  function panel() {
    if (!isAdmin()) return null;
    const parent = $("usersBody");
    if (!parent) return null;
    let root = parent.querySelector("#simGtkBulkApprovalPanel");
    if (!root) {
      root = document.createElement("section");
      root.id = "simGtkBulkApprovalPanel";
      root.className = "card";
      root.style.cssText = "margin-bottom:14px;border:1px solid #78b7a0";
      parent.prepend(root);
    }
    return root;
  }
  function state() {
    const root = panel();
    if (!root) return;
    const list = Array.isArray(preview?.items) ? preview.items : [];
    const idList = new Set(list.map(a => a.id));
    selected = new Set([...selected].filter(id => idList.has(id)));
    root.innerHTML =
      '<div class="label">SUPER ADMIN · PERSETUJUAN AGREGAT TERKENDALI</div>' +
      '<h3 style="margin:6px 0">✅ Persetujuan Agregat Daftar Akun</h3>' +
      '<div class="small" style="margin-bottom:12px">Akun PENDING dengan <b>NIP atau unit kerja belum diisi tetap bisa dipilih</b>. Setelah disetujui, pengguna wajib melengkapi tujuh isian profil sebelum membuka layanan. NIP terisi harus valid dan unik; NIP ganda, peran dan NPSN KS bermasalah tetap diperiksa manual.</div>' +
      (summary ? '<div class="info" role="status" style="margin-bottom:10px">'+esc(summary)+'</div>' : '') +
      (batchResults.length ? '<details style="margin-bottom:12px"><summary>Rincian hasil persetujuan ('+fmt(batchResults.length)+' akun)</summary><div style="max-height:220px;overflow:auto" class="small">'+batchResults.map(x=>'<div style="padding:5px 0;border-bottom:1px solid #e2e8f0"><b>'+esc(x.name)+'</b> — '+esc(x.outcome)+' · '+esc(x.detail)+'</div>').join('')+'</div></details>' : '') +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">' +
        '<button class="btn soft" type="button" id="simGtkBulkRefresh"'+(busy?' disabled':'')+'>🔎 '+(busy?'Sedang memeriksa...':'Periksa Semua Akun PENDING')+'</button>' +
        (preview ? '<span class="small"><b>'+fmt(preview.eligible_count)+'</b> dapat disetujui · '+fmt(preview.incomplete_count)+' profil belum lengkap · '+fmt(preview.manual_count)+' perlu pemeriksaan manual · '+fmt(preview.pending_count)+' GTK pending</span>' : '<span class="small">Klik Periksa untuk memuat data terbaru.</span>') +
      '</div>' +
      (preview ? (list.length ?
        '<div style="margin:0 0 10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
          '<button class="btn soft" type="button" id="simGtkBulkSelectAll"'+(busy?' disabled':'')+'>Pilih Maks. 50 Akun</button>'+
          '<button class="btn soft" type="button" id="simGtkBulkClear"'+(busy?' disabled':'')+'>Kosongkan pilihan</button>'+
          '<span class="small" id="simGtkBulkSelectedCount">'+fmt(selected.size)+' akun dipilih</span>'+
        '</div>'+
        '<div style="max-height:340px;overflow:auto;border:1px solid var(--line);border-radius:9px">'+
         '<table class="table" style="min-width:680px;width:100%"><thead><tr>'+
          '<th>Pilih</th><th>Nama</th><th>NIP (tersamar)</th><th>Peran</th><th>Unit Kerja</th><th>Profil</th>'+
         '</tr></thead><tbody>'+list.map(a=>
           '<tr><td><input type="checkbox" class="simGtkBulkChoice" data-id="'+esc(a.id)+'" aria-label="Pilih '+esc(a.full_name)+'"'+(selected.has(a.id)?' checked':'')+(busy?' disabled':'')+'></td>'+
           '<td>'+esc(a.full_name)+'</td><td>'+esc(a.nip_masked)+'</td><td>'+esc(roleLabel(a.role))+'</td>'+
           '<td>'+esc(a.unit || 'Belum diisi')+'</td><td>'+(a.profile_incomplete?'<span style="color:#b45309">Wajib lengkapi setelah disetujui</span><div class="small">'+esc((a.missing_fields||[]).join(', '))+'</div>':'Lengkap')+'</td></tr>'
         ).join('')+'</tbody></table></div>'+
         '<label style="display:flex;gap:8px;margin:12px 0;align-items:flex-start">'+
           '<input type="checkbox" id="simGtkBulkAck"'+(acknowledged?' checked':'')+(busy?' disabled':'')+'>'+
           '<span class="small">Saya telah memeriksa identitas pendaftar dan kewenangan perannya. Saya memahami akun dengan profil belum lengkap wajib melengkapi data sebelum menggunakan layanan.</span>'+
         '</label>'+
         '<button type="button" class="btn primary" id="simGtkBulkApprove"'+
           (busy || !selected.size || !acknowledged?' disabled':'')+'>✅ Setujui Agregat ('+fmt(selected.size)+' akun)</button>'+
         '<div class="small" style="margin-top:8px">Hanya akun yang Anda pilih diproses. Server memeriksa ulang status PENDING, keunikan NIP yang terisi, peran dan NPSN KS serta mencatat audit. Data kosong wajib dilengkapi setelah login. Maksimal 50 akun per proses.</div>'
        : '<div class="info">Belum ada akun yang aman untuk persetujuan massal. Daftar akun yang memerlukan pemeriksaan tetap tersedia di bawah.</div>') : '') +
      (preview?.manual_items?.length ?
       '<h4 style="margin:16px 0 5px">⚠ Akun PENDING Perlu Pemeriksaan Manual ('+fmt(preview.manual_items.length)+')</h4>'+
       '<div class="small" style="margin-bottom:8px">Akun ini tetap ditampilkan walaupun profilnya belum lengkap. Untuk mencegah akun ganda, kotak persetujuannya dinonaktifkan sampai identitas/peran diperbaiki.</div>'+
       '<div style="max-height:280px;overflow:auto;border:1px solid var(--line);border-radius:9px"><table class="table" style="min-width:640px;width:100%">'+
       '<thead><tr><th>Nama</th><th>NIP</th><th>Peran</th><th>Unit</th><th>Alasan perlu pemeriksaan</th></tr></thead><tbody>'+
       preview.manual_items.map(p=>'<tr><td>'+esc(p.full_name)+'</td><td>'+esc(p.nip_masked)+'</td><td>'+esc(roleLabel(p.role))+'</td><td>'+esc(p.unit||'Belum diisi')+'</td><td><strong>'+esc(p.issue)+'</strong>'+(p.incomplete?'<div class="small">Profil belum lengkap</div>':'')+'</td></tr>').join('')+
       '</tbody></table></div>' : '');
    $("simGtkBulkRefresh")?.addEventListener("click", fetchPreview);
    $("simGtkBulkSelectAll")?.addEventListener("click", () => {
      selected = new Set(list.slice(0, 50).map(a => a.id));
      acknowledged = false;
      summary = list.length > 50 ? "Dipilih 50 akun pertama. Lakukan persetujuan berikutnya untuk akun lainnya." : "";
      state();
    });
    $("simGtkBulkClear")?.addEventListener("click", () => {
      selected.clear();acknowledged=false;state();
    });
    root.querySelectorAll(".simGtkBulkChoice").forEach(box => box.addEventListener("change", event => {
      const id = event.target.dataset.id;
      if (event.target.checked && selected.size >= 50) {
        event.target.checked = false;
        summary = "Maksimal 50 akun per persetujuan. Selesaikan pilihan sekarang sebelum memilih lainnya.";
        state();
        return;
      }
      if (event.target.checked) selected.add(id); else selected.delete(id);
      acknowledged = false; // Re-acknowledge after every selection change.
      const ack = $("simGtkBulkAck");
      if (ack) ack.checked = false;
      const count = $("simGtkBulkSelectedCount");
      if (count) count.textContent = fmt(selected.size)+" akun dipilih";
      const b = $("simGtkBulkApprove");
      if (b) { b.disabled = true; b.textContent = "✅ Setujui Agregat ("+fmt(selected.size)+" akun)"; }
    }));
    $("simGtkBulkAck")?.addEventListener("change", event => {
      acknowledged = !!event.target.checked;
      const b = $("simGtkBulkApprove");
      if (b) b.disabled = !selected.size || !acknowledged;
    });
    $("simGtkBulkApprove")?.addEventListener("click", execute);
  }
  async function invoke(body) {
    const { data, error } = await sb.functions.invoke("simantab-gtk-bulk-approval", { body });
    if (error) {
      let detail = "";
      try { detail = (await error.context?.clone?.().json())?.error || ""; } catch (_) {}
      throw new Error(detail || error.message || "Koneksi persetujuan agregat gagal");
    }
    if (!data?.ok) throw new Error(data?.error || "Respons belum berhasil");
    return data;
  }
  async function fetchPreview() {
    if (!isAdmin() || busy) return;
    busy = true; summary = ""; batchResults = []; state();
    try {
      const response = await invoke({ action:"PREVIEW" });
      preview = response; selected.clear(); acknowledged = false;
    } catch (err) {
      preview = null; summary = "Tidak dapat memuat daftar: "+(err?.message || err);
    } finally { busy = false; state(); }
  }
  async function execute() {
    if (!isAdmin() || busy || !preview || !selected.size || !acknowledged) return;
    if (selected.size > 50) return alert("Maksimal 50 akun dalam satu proses persetujuan.");
    const ids = [...selected];
    const current = new Set(preview.items.map(a => a.id));
    if (ids.some(id => !current.has(id))) return;
    if (!window.confirm("Setujui "+ids.length+" akun terpilih? Pastikan NIP unik, identitas dan kewenangan perannya telah diperiksa. Tindakan ini akan mengaktifkan akun.")) return;
    busy=true;state();
    try {
      const result = await invoke({ action:"APPROVE_SELECTED", user_ids:ids,
        verified_identity_and_role:true, confirmation:"SETUJUI AKUN TERPILIH" });
      const byId = new Map(preview.items.map(a => [a.id, a.full_name]));
      batchResults = (result.results || []).map(row => ({ name: byId.get(row.id) || row.id, outcome: row.outcome, detail: row.detail }));
      summary = "Selesai: "+fmt(result.approved)+" disetujui, "+fmt(result.skipped)+" dilewati, "+fmt(result.errors)+" gagal. Kode audit: "+result.batch_id;
      if (result.errors || result.skipped) summary += ". Periksa kembali akun yang belum selesai secara individual.";
      preview = null; selected.clear(); acknowledged=false;
      await window.showTab("users");
      try { await window.__simantabDuplicateNipAudit?.render?.(true); } catch (_) {}
      busy = false;
      const completedResults = batchResults.slice();
      await fetchPreview();
      // Keep the audited per-account outcomes visible after refreshing the queue.
      batchResults = completedResults;
      summary = "Hasil agregat: "+fmt(result.approved)+" disetujui, "+fmt(result.skipped)+" dilewati, "+fmt(result.errors)+" gagal. Audit: "+result.batch_id;
    } catch (err) {
      summary = "Persetujuan belum tuntas: "+(err?.message || err)+". Periksa kembali status akun sebelum mengulang.";
    } finally { busy=false;state(); }
  }
  const oldShowTab = window.showTab;
  window.showTab = async function(tab, ...args) {
    const result = await oldShowTab.call(this, tab, ...args);
    if (tab === "users" && isAdmin()) {
      state();
      if (!preview && !busy) void fetchPreview();
    }
    return result;
  };
  window.addEventListener("simantab:profile-ready", () => {
    if ($("users")?.classList.contains("active") && isAdmin()) {
      state();
      if (!preview && !busy) void fetchPreview();
    }
  });
  if ($("users")?.classList.contains("active") && isAdmin()) {
    state();
    if (!preview && !busy) void fetchPreview();
  }
  window.__simantabGtkBulkApproval = { version:4, render:state, refresh:fetchPreview };
})();
