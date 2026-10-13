# Panduan Uji OCR Jabfung Gratis di Android

Versi **PREVIEW TERISOLASI**: tidak memakai database SIMANTAB, akun ASN, atau provider AI berbayar.

## Persiapan
1. Download berkas ZIP artifact `SIMANTAB-Jabfung-OCR-Local-Preview` dari GitHub Actions (PR #170).
2. Ekstrak ZIP seluruhnya di komputer Windows. **Jangan hanya membuka index.html**, karena modul JavaScript OCR memerlukan server HTTP lokal.
3. Pastikan Android dan komputer memakai **Wi-Fi yang sama dan tepercaya**. Jangan gunakan Wi-Fi publik untuk menjalankan server pengujian.
4. Klik dua kali `MULAI_UJI_WINDOWS.bat`. Jika Windows menanyakan izin jaringan, izinkan hanya **Private networks**.
5. Pada jendela hitam terlihat `Alamat IPv4`, misalnya `192.168.1.8`. Di Chrome Android buka `http://192.168.1.8:8765` (ganti sesuai IP komputer).
6. Pilih **PDF Teks** → **Jalankan OCR Gratis**, lihat hasil.
7. Ulangi untuk **PNG**, **PDF Scan**, dan **Berkas Kosong**. Pada berkas kosong seharusnya ada indikator `Perlu telaah`.
8. Setelah selesai, tekan **Ctrl+C** di komputer untuk menutup server.

## Jika tidak bisa dibuka
- Pastikan komputer/Android di Wi-Fi sama, alamat IPv4 benar, dan firewall Windows memberi izin Private.
- Jika Windows belum mempunyai Python, install Python gratis terlebih dahulu.
- Bila PDF atau OCR gagal, kirim tangkapan layar *pesan error saja* (tanpa dokumen ASN) untuk telaah.

## Privasi dan biaya
- Jangan gunakan data guru asli dalam QA ini. Semua contoh dibuat secara sintetis.
- Source OCR, WebAssembly, dan data bahasa Indonesia/Inggris di-host dari komputer uji sendiri.
- Situs hanya menyajikan aset statis. Tidak ada login, Supabase, API Gemini maupun token berbayar.
- Pemrosesan menggunakan CPU/RAM perangkat; PDF scan bisa lebih lambat dari PDF teks.
- Ini bukan sistem untuk menetapkan keaslian dokumen atau persetujuan Jabfung.
- Paket GitHub Actions bersifat sementara; tidak sama dengan URL publik atau pemasangan SIMANTAB.
