# SIMANTAB Cloudflare — QA rilis Diklat KS/BCKS (22 Oktober 2026)

Tujuan rilis: memastikan modul diklat-ks-bcks-v32.js?v=25 tersedia pada Worker preview `simantab-cf-preview`.

- Referensi implementasi: PR #241 (tombol Kabid kenaikan level) dan PR #242 (komentar personal dan aksi Kabid agregat 120 peserta).
- Akses dibatasi ke kohort tetap 120 peserta resmi, identitas akun dan otorisasi Kabid diperiksa di Supabase.
- Tombol Kabid menetapkan kelulusan per peserta atau tepat 120 akun secara atomik **hanya setelah Kabid memasukkan dasar keputusan resmi dan konfirmasi**.
- Saat kelulusan Seleksi Substansi ditetapkan, komentar dengan nama peserta ditulis ke `substansi_note` dan pemberitahuan akunnya.
- Tidak ada peserta otomatis dinaikkan level hanya karena kode diterapkan.
- Pemeriksaan sebelum distribusi pengguna: Cloudflare Workers build sukses, v25 benar-benar terlayani pada URL JS publik, dashboard Kabid menampilkan tombol, 120 akun terkunci sesuai aturan, dan QA login aman.

Dokumen ini sekaligus menandai titik rilis build dari cabang Cloudflare yang ditetapkan sebagai production branch untuk Worker preview. Jangan mengubah DNS atau domain resmi berdasarkan dokumen audit ini.
