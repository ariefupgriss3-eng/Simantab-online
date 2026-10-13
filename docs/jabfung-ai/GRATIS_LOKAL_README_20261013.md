# SIMANTAB — Rancangan AI Verifikator Jabfung Gratis (OCR Lokal)
Tanggal: 13 Oktober 2026. Status: **draft pengujian, belum produksi**.

## Biaya
Mode default menghapus pemanggilan Vercel AI Gateway dan Supabase AI workflow dari UI Jabfung.
- **Biaya model AI per dokumen: Rp0** dalam penggunaan mode ini.
- Tidak ada Gemini/OpenAI/Workers AI API key yang dipakai.
- Pengguna masih memakai koneksi dan sumber daya perangkat sendiri untuk OCR; akses SIMANTAB ke Supabase/Vercel tetap tunduk pada biaya/kuota hosting yang sudah ada.
- Tidak ada jaminan "semua biaya layanan nol" jika hosting/storage melewati batas paket.

## Fungsi
- Periksa dokumen sebelum dikirim: `Periksa Berkas Gratis (OCR Lokal)`.
- Baca ulang dokumen usulan yang tersedia bagi pemohon/petugas lewat RLS Storage yang berlaku (bukan membuat kebijakan akses baru).
- Periksa file PDF/JPG/PNG tidak kosong dan maksimal 1,5 MiB.
- Untuk PDF teks ambil sampai 3 halaman; untuk PDF scan jalankan OCR maksimal 2 halaman sebagai fallback.
- Untuk gambar JPG/PNG gunakan OCR browser.
- Baca kata kunci umum PAK, SK CPNS/PNS, SK Pangkat, Jabfung, UKOM, SKP 2024/2025, ijazah dan transkrip.
- Jika NIP pembanding disediakan, catat indikasi tidak cocok; keluaran hanya menyimpan 4 digit terakhir NIP.
- Status **TERBACA_AWAL** atau **PERLU_TELAAH**, tidak pernah menyimpulkan "ASLI", "PALSU", atau persetujuan resmi.

## Batasan dan risiko (penting)
- **Jangan merge ke produksi dulu**. Modul prototype masih mengambil kode PDF.js dan Tesseract.js dari URL CDN publik, walaupun bytes berkas tidak dikirim ke layanan AI. Kode pihak ketiga yang berjalan di browser merupakan risiko privasi/supply-chain; sebelum go-live, **vendor dan self-host seluruh kode/worker/WASM/langdata** di domain SIMANTAB, pin SHA/integrity.
- OCR bukan LLM vision multimodal. Dokumen buram, scan yang buruk, stempel dan TTE tetap harus ditelaah manusia; tidak dapat memastikan keaslian atau memverifikasi QR/TTE ke penerbit.
- Tes kode sintetis bukan uji browser pada perangkat Android, dan belum membuktikan CDN assets kompatibel.
- UI gratis **tidak menulis verdict ke tabel AI database**; ini disengaja agar hasil yang dibuat di klien tidak dipercaya server sebagai keputusan resmi atau bisa dipalsukan.
- UI baru tidak memanggil provider berbayar. Namun **Edge Function lama masih terpasang di server**; untuk menjamin biaya provider nol dari seluruh klien (termasuk klien lama), perlu migrasi terpisah berupa hard-disable server-side setelah persetujuan dan audit.
- Data pribadi guru/ASN harus dilarang masuk log/telemetry publik, dan penilaian final dilakukan pejabat berwenang.
- Cache/PWA lama mungkin masih menyimpan UI lama dan memanggil AI berbayar jika tidak ditangani dalam peluncuran terpisah.

## Persiapan QA yang harus lulus sebelum deployment
- [x] Implementasi sumber UI dan aturan pra-verifikasi lokal dibuat di branch terpisah.
- [x] Tidak ada panggilan AI berbayar pada script UI Jabfung yang sudah diperbarui.
- [ ] GitHub Actions suite source/regresi lulus HEAD terbaru.
- [ ] Uji Android/PWA, desktop, PDF teks dan PDF scan 1–3 halaman, foto JPG/PNG, formulir 12 dokumen.
- [ ] Self-host seluruh pustaka OCR dan data bahasa dari origin SIMANTAB.
- [ ] Pemeriksaan otorisasi Supabase JWT/RLS untuk pengajuan lama dan baru, menggunakan akun sintetis nonproduksi.
- [ ] Verifikasi penanganan file 0 byte pada dua dokumen produksi tanpa memodifikasinya.
- [ ] Patch server-side opt-out panggilan provider agar PWA lama tak membebankan biaya AI.
- [ ] Pengujian keamanan dan persetujuan Kabid terpisah sebelum prod.
- [ ] Rencana rollback UI dan pemeliharaan alur pengajuan lengkap.

## Pilihan ke depan
Jika pengguna memang menghendaki analisis generatif multimodal layaknya Gemini (pengujian stempel, halaman, reasoning dokumen), OCR lokal ini **tidak setara**. Alternatif free-tier cloud ada tetapi berbatas kuota dan perlu telaah privasi ASN.

Jalankan pemeriksaan unit tanpa biaya:
```sh
node --check web/jabfung-free-verifier-core.mjs
node --check web/jabfung-free-verifier-ui.mjs
node --test web/tests/jabfung-free-verifier.test.mjs
```
