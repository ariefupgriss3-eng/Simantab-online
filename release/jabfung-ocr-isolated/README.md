# SIMANTAB Jabfung — rilis OCR gratis terisolasi (13 Oktober 2026)

Status: **siap ditelaah sebagai source-only delta; BELUM ADA rilis frontend produksi**.

## Ruang lingkup pasti

Cabang ini dimulai dari \`main\` dan hanya mengubah implementasi formulir
\`web/jabfung-jenjang-enhancement.js\` serta menambahkan dua modul OCR lokal.
Tidak menyentuh source layanan KP/KGB/TPG/BCKS, RLS, data pengajuan,
akun pengguna, domain produksi, atau server fungsi yang sudah aktif.

- Usulan Jabfung tetap dibuat ke layanan Supabase yang sudah ada.
- \`Kirim Usul\` tidak otomatis memanggil Gemini/AI Gateway.
- OCR PDF/JPG/PNG oleh PDF.js + Tesseract.js melalui browser, sebagai indikator awal
  \`TERBACA_AWAL\` atau \`PERLU_TELAAH\`, bukan putusan keaslian SK/TTE/QR.
- Dua pengaman server produksi yang sudah dipasang **tidak boleh dilepas**:
  - Supabase \`simantab-jabfung-ai-workflow\` v3: POST \`FREE_LOCAL_ONLY\`.
  - Vercel routing rule \`aaa7b42a-c2a2-459e-befb-0daa84d2d5d4\`: HTTP 410 untuk \`/api/jabfung-ai-read\`.

## Mengapa bukan \`npm run build\`?

Build lama \`web/secure-build.mjs\` dan \`web/package.json\` merakit ulang banyak
modul lintas layanan berdasarkan HTML produksi terkini. Men-deploy ulang proyek
dengan build tersebut **tidak memenuhi** syarat perubahan hanya untuk Jabfung.
Oleh sebab itu, cabang ini **sengaja tidak mengubah** perintah build Vercel global.
PR ini TIDAK BOLEH digabung lalu dideploy secara otomatis ke produksi.

## Artefak rilis terisolasi yang dibutuhkan

1. **Vercel Build Output API v3** asli dari deployment produksi baseline yang
   sudah diketahui: \`dpl_8LpSihFq89LDHmbFJbjHQJjqyT9Q\`, commit
   \`78aa006b9fae8b99b03c5c95aacf56b67a5457aa\`.
   Semua aset frontend, fungsi, dan \`config.json\` harus lengkap dan sesuai
   dengan deployment tersebut.
2. **SHA-256 tepat dari \`static/index.html\` baseline**. Ini wajib disediakan
   dari artefak immutabel, bukan ditebak.
3. Aset OCR dari [GitHub Actions Android preview bundle]
   (https://github.com/ariefupgriss3-eng/Simantab-online/actions/runs/38338787750),
   berkas \`SIMANTAB-Jabfung-OCR-Local-Preview\`. ZIP tersebut diverifikasi
   dengan digest SHA-256
   \`aa2cde78b0acd84f497e0475c9577fabe6719e018d8f27a052ba9e667d00075f\`.
   Ekstrak direktori \`ocr/\` ke folder terpisah; jangan menggunakan dokumen ASN.

Dari lingkungan yang sudah memiliki ketiga input di atas, jalankan dengan Node.js 22+:

\`\`\`sh
node release/jabfung-ocr-isolated/apply-overlay.mjs \
  /path/to/immutable-vercel-build-output \
  /path/to/extracted-verified-preview-assets \
  /path/to/new-vercel-output \
  SHA256_64_KARAKTER_DARI_INDEX_BASELINE
\`\`\`

**Program hanya membuat output baru dan audit berdampingan. Tidak deploy.**
Jika indeks bukan yang diharapkan, file OCR berbeda hash, atau output sudah ada,
program berhenti sebelum merusak artefak baseline. Tidak perlu npm install,
Edge Function tambahan, provider berbayar, atau Supabase baru.

Delta file yang diizinkan di artefak hasil hanya:
\`static/index.html\` (menyisipkan tag UI OCR, versi script Jabfung naik ke v5),
\`static/jabfung-jenjang-enhancement.js\`, dua modul \`.mjs\` Jabfung,
dan direktori \`static/ocr/**\`. Semua file aplikasi di luar Jabfung
dibandingkan SHA-256 dan harus identik dengan baseline.

## Pembuktian referensi produksi (baca-saja, 13 Oktober 2026)

Tautan artefak deployment spesifik yang dibaca:
`https://simantab-online-9ntew97go-mariefrohman-6773.vercel.app/`
— mengembalikan HTTP 200 dan HTML publik. **Script Jabfung pada HTML tersebut
adalah `./jabfung-jenjang-enhancement.js?v=2`, bukan `?v=4`.**
Karena itu, penerapan overlay telah diperbaiki agar cocok **hanya** dengan
anchor `?v=2` yang benar-benar diamati; bila baseline berbeda, proses
berhenti, tidak melakukan penggantian spekulatif.

Pada deployment spesifik tersebut:
- `/jabfung-jenjang-enhancement.js?v=2` => HTTP 200 (versi lama).
- `/jabfung-free-verifier-ui.mjs` => HTTP 404 (belum tersedia).
- `/ocr/pdf.mjs` => HTTP 404 (belum tersedia).
- `/api/jabfung-ai-read` => HTTP 410 (pengaman Vercel sudah aktif).

Akses HTML dan aset melalui HTTPS **belum cukup** untuk menyusun ulang
seluruh Vercel Build Output API v3: manifest, fungsi edge/server, serta
file deployment lain tidak dapat disimpulkan hanya dari sumber HTML.
Jika file-tree API tidak tersedia, tetap **NO-GO** untuk rilis frontend
tanpa menyalin semua artefak baseline dengan integritas yang diverifikasi.

## Status pemblokir saat ini

- Pemeriksaan API Vercel \`list_deployment_files\` untuk deployment baseline
  mengembalikan **404 "File tree not found"** pada 13 Oktober 2026.
  Belum tersedia salinan Build Output baseline yang dapat diverifikasi;
  **tidak boleh menggunakan fresh rebuild sebagai substitusi diam-diam**.
- Android fisik, autentikasi/RLS nyata, kirim usulan, dan PWA belum diuji,
  sesuai pilihan pengguna untuk melanjutkan tanpa pengujian tambahan.
  Risiko itu tetap terbuka, bukan dianggap lulus.
- Belum ada deployment frontend baru atau URL OCR pada produksi. Perubahan branch
  saja tidak cukup mengaktifkan fitur.

## Ketentuan go/no-go

**NO-GO** bila file tree baseline tidak tersedia, sha tidak cocok, atau
proses patch menyentuh berkas bukan Jabfung. **NO-GO** bila endpoint
AI Jabfung berbayar terbuka kembali. Jangan mengubah/menghapus data pengajuan
untuk menguji fitur. Setelah artefak sah tersedia, review delta sebelum
penempatan apa pun ke produksi; gunakan peninjauan dan keputusan eksplisit
karena pengujian integrasi telah dilewati.

**Rollback:** kembalikan frontend ke deployment baseline, **pertahankan**
kedua pengaman server biaya AI Jabfung yang aktif.
