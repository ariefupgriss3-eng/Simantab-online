/* SIMANTAB_BCKS_PRO_THINKING_V1 */
const LETTERS=["A","B","C","D","E"];

type ProTemplate={
  principle:string;reasoning:string;misconception:string;transfer:string;
  h1:string;h2:string;h3:string;h4:string;
};

const T:Record<string,ProTemplate>={
"refleksi":{
 principle:"Pemimpin memperbaiki keputusan dengan memeriksa dampak nyata dari gaya kerja atau kebijakan, bukan hanya niat dan keterlaksanaan.",
 reasoning:"Mulai dari dampak yang teramati, cari hubungan dengan tindakan pimpinan, lalu pilih perbaikan yang dapat diuji dan dievaluasi.",
 misconception:"Menganggap sesuatu efektif hanya karena cepat, tertib, disukai, atau biasa dilakukan tanpa memeriksa kualitas hasil.",
 transfer:"Di sekolah lain, rapat selalu singkat dan keputusan cepat, tetapi guru makin pasif mengusulkan gagasan. Bagaimana kepala sekolah menilai apakah pola kepemimpinannya perlu diubah?",
 h1:"Cari fakta tentang hasil, perilaku tim, dan gejala yang muncul setelah tindakan pimpinan; jangan hanya melihat apakah kegiatan terlaksana.",
 h2:"Bedakan tujuan proses yang efisien dengan tujuan kepemimpinan yang membangun pemahaman, inisiatif, dan tanggung jawab.",
 h3:"Bandingkan tindakan yang hanya mempertahankan kebiasaan dengan tindakan yang mengumpulkan informasi tentang dampak sebelum mengubah pola.",
 h4:"Prinsipnya: refleksi profesional memakai bukti dampak dan membuka peluang koreksi, bukan membela kebiasaan karena sudah berjalan."
},
"integritas_keadilan":{
 principle:"Integritas menuntut pemisahan kepentingan pribadi, pengakuan kontribusi yang akurat, dan proses yang dapat dipertanggungjawabkan.",
 reasoning:"Identifikasi konflik kepentingan atau ketidakakuratan atribusi, lindungi fairness proses, lalu dokumentasikan koreksi secara terbuka.",
 misconception:"Menganggap hasil yang baik membenarkan proses yang bias, atau menganggap jabatan otomatis memberi hak atas pengakuan dan keuntungan.",
 transfer:"Seorang pimpinan ditawari fasilitas pribadi oleh calon mitra yang sedang mengikuti seleksi sekolah. Apa prinsip keputusan yang harus dipakai sebelum proses dilanjutkan?",
 h1:"Cari siapa yang memperoleh manfaat pribadi, siapa yang berkontribusi nyata, dan apakah keputusan dapat dipengaruhi oleh posisi atau hubungan.",
 h2:"Masalah intinya bukan sekadar citra, tetapi keadilan proses dan kepercayaan terhadap keputusan.",
 h3:"Bandingkan opsi yang sekadar terlihat transparan dengan opsi yang benar-benar memisahkan kepentingan dan memperbaiki proses.",
 h4:"Prinsipnya: hindari konflik kepentingan, akui kontribusi sesuai fakta, dan pastikan keputusan dapat diaudit."
},
"orientasi_murid":{
 principle:"Keputusan sekolah harus menjaga martabat, keselamatan, akses, dan perkembangan murid tanpa mengabaikan tujuan pendidikan.",
 reasoning:"Tentukan dampak langsung pada murid, identifikasi kelompok yang berisiko dirugikan, lalu pilih pengaturan yang tetap mencapai tujuan dengan perlindungan memadai.",
 misconception:"Menyamakan perlakuan dengan keadilan, atau mengejar disiplin dan hasil tanpa mempertimbangkan martabat serta kebutuhan murid.",
 transfer:"Sebuah kegiatan sekolah bermanfaat tetapi membuat sebagian murid tidak dapat berpartisipasi karena kondisi yang tidak mereka pilih. Bagaimana kepala sekolah menentukan penyesuaian yang adil?",
 h1:"Perhatikan siapa yang paling terdampak dan apakah ada risiko malu, tersisih, tidak aman, atau kehilangan kesempatan belajar.",
 h2:"Bedakan tujuan kegiatan dengan cara pelaksanaannya; sering kali tujuan dapat dipertahankan sambil cara dibuat lebih adil.",
 h3:"Bandingkan pilihan yang seragam untuk semua dengan pilihan yang menjaga tujuan tetapi mengurangi kerugian pada murid tertentu.",
 h4:"Prinsipnya: equity berarti menjaga kesempatan dan martabat murid berdasarkan kebutuhan, bukan selalu memberi perlakuan identik."
},
"kematangan_emosi":{
 principle:"Kematangan pemimpin tampak dari kemampuan menahan reaksi, menerima bagian tanggung jawab, dan mengarahkan energi pada penyelesaian.",
 reasoning:"Pisahkan fakta dari dorongan menyalahkan, akui kontribusi setiap pihak terhadap masalah, lalu prioritaskan pemulihan layanan dan perbaikan proses.",
 misconception:"Bereaksi defensif, mencari kambing hitam, atau menghindari pengakuan kesalahan pimpinan demi menjaga wibawa.",
 transfer:"Saat sebuah program terlambat, data menunjukkan beberapa pihak termasuk pimpinan ikut menyumbang keterlambatan. Bagaimana kepala sekolah merespons agar masalah selesai dan kepercayaan tetap terjaga?",
 h1:"Cari fakta urutan kejadian dan bagian tanggung jawab tiap pihak sebelum menilai siapa yang paling bersalah.",
 h2:"Masalah inti adalah penyelesaian layanan dan kualitas koordinasi, bukan memenangkan perdebatan siapa yang salah.",
 h3:"Bandingkan respons defensif atau mengambil alih semuanya dengan respons yang mengakui bagian tanggung jawab dan memperbaiki alur.",
 h4:"Prinsipnya: pemimpin yang matang mengakui fakta, mengelola emosi, menyelesaikan masalah, lalu memperbaiki sistem."
},
"refleksi_berbasis_data":{
 principle:"Refleksi berbasis data menilai apa yang benar-benar diukur oleh setiap sumber sebelum menyimpulkan kondisi atau menetapkan program.",
 reasoning:"Periksa konstruk, kualitas, keterbatasan, dan kesesuaian beberapa sumber data lalu susun diagnosis yang cukup untuk keputusan saat ini.",
 misconception:"Menganggap satu sumber otomatis paling benar karena internal, eksternal, terbaru, atau paling mudah dipahami.",
 transfer:"Dua asesmen sekolah menunjukkan hasil berbeda karena mengukur aspek yang tidak sama. Bagaimana kepala sekolah menggunakan keduanya untuk menentukan program perbaikan?",
 h1:"Tanyakan: masing-masing data mengukur apa, kapan dikumpulkan, dan keterbatasan apa yang mungkin menjelaskan perbedaan.",
 h2:"Masalahnya bukan memilih sumber favorit, tetapi menyusun diagnosis dari bukti yang benar-benar sebanding.",
 h3:"Bandingkan opsi yang memilih satu data secara otomatis dengan opsi yang menelaah konstruk dan kualitas kedua sumber.",
 h4:"Prinsipnya: data harus ditafsirkan sesuai konstruk dan konteksnya sebelum dipakai untuk keputusan."
},
"terbuka_pada_bukti":{
 principle:"Pemimpin bersedia merevisi diagnosis ketika bukti baru yang kredibel muncul, tetapi tidak mengganti arah hanya karena satu temuan yang belum teruji.",
 reasoning:"Uji hubungan antarvariabel, periksa data pembanding, lalu tentukan apakah diagnosis awal perlu dipertahankan, diperdalam, atau diubah.",
 misconception:"Bertahan pada asumsi awal karena merasa paling berpengalaman atau langsung mengganti keputusan karena satu data baru.",
 transfer:"Kepala sekolah memiliki dugaan penyebab penurunan hasil belajar, lalu muncul data baru yang menunjukkan faktor lain. Apa langkah analitis sebelum prioritas intervensi diubah?",
 h1:"Cari kekuatan dan keterbatasan bukti baru serta faktor lain yang belum dikendalikan.",
 h2:"Bedakan korelasi yang terlihat dari penyebab yang benar-benar mendasari masalah.",
 h3:"Bandingkan mempertahankan diagnosis lama, mengganti total, dan menguji hubungan beberapa faktor.",
 h4:"Prinsipnya: terbuka pada bukti berarti siap mengoreksi dugaan melalui pengujian yang proporsional."
},
"verifikasi_fakta":{
 principle:"Keputusan yang berdampak pada status atau reputasi harus didasarkan pada fakta yang telah diverifikasi dan kriteria yang konsisten.",
 reasoning:"Tahan pengumuman atau tindakan final ketika data kunci belum cocok, verifikasi persyaratan, lalu komunikasikan waktu pembaruan.",
 misconception:"Mengumumkan kesimpulan sementara sebagai fakta atau memilih data yang paling menguntungkan demi kecepatan.",
 transfer:"Dua daftar resmi memberi status berbeda untuk orang yang sama dan keputusan harus diumumkan hari itu. Bagaimana pemimpin menjaga kecepatan tanpa mengorbankan akurasi?",
 h1:"Cari persyaratan yang harus sama-sama terpenuhi dan bagian data yang belum cocok.",
 h2:"Masalah inti adalah validitas status, bukan sekadar memenuhi jadwal pengumuman.",
 h3:"Bandingkan pengumuman sementara dengan verifikasi singkat yang menjaga kepastian informasi.",
 h4:"Prinsipnya: verifikasi fakta mendahului keputusan final ketika kesalahan dapat merugikan hak atau reputasi seseorang."
},
"mediasi_konflik":{
 principle:"Mediasi mencari pengaturan yang mengurangi dampak konflik sambil tetap menjaga kepentingan sah semua pihak.",
 reasoning:"Dengar keberatan, ukur sumber gangguan, tentukan batas yang dapat diuji, dan sediakan mekanisme evaluasi atau keluhan.",
 misconception:"Memihak satu pihak, meminta toleransi sepihak, atau menghentikan kegiatan tanpa menilai penyesuaian yang mungkin.",
 transfer:"Kegiatan sekolah menimbulkan gangguan bagi lingkungan tetapi juga penting bagi siswa. Bagaimana kepala sekolah merancang penyelesaian yang dapat diterima dan dievaluasi?",
 h1:"Identifikasi kepentingan kedua pihak dan data konkret tentang gangguan, waktu, serta dampaknya.",
 h2:"Masalah inti bukan memilih sekolah atau warga, tetapi mencari batas yang melindungi keduanya.",
 h3:"Bandingkan larangan total, toleransi sepihak, dan pengaturan terbatas yang dapat dipantau.",
 h4:"Prinsipnya: mediasi yang baik mengakui kepentingan sah, menetapkan batas, dan menyediakan evaluasi."
},
"kolaborasi_inovasi":{
 principle:"Kolaborasi yang sehat memberi ruang pada gagasan dan pengalaman berdasarkan kualitasnya, lalu menguji bagian penting sebelum diterapkan luas.",
 reasoning:"Atur peran yang seimbang, gunakan kriteria atau bukti, dan hindari dominasi senioritas maupun antusiasme baru semata.",
 misconception:"Menganggap senior selalu benar, memberi hak istimewa pada pendatang baru, atau menyelesaikan perbedaan hanya dengan voting.",
 transfer:"Tim sekolah memiliki guru senior berpengalaman dan guru baru dengan ide yang menjanjikan. Bagaimana kepala sekolah membangun proses kerja yang adil sekaligus produktif?",
 h1:"Cari siapa yang mendominasi, gagasan mana yang sudah memiliki dasar, dan apa yang masih perlu dibuktikan.",
 h2:"Masalah inti adalah kualitas proses kolaborasi, bukan memilih kelompok lama atau baru.",
 h3:"Bandingkan dominasi satu pihak, voting sederhana, dan proses menimbang gagasan dengan uji terbatas.",
 h4:"Prinsipnya: inovasi kolaboratif memadukan pengalaman dan gagasan melalui peran seimbang serta pembuktian."
},
"dialog_orang_tua":{
 principle:"Komunikasi dengan keluarga harus jelas, menghormati kewenangan dan privasi, serta menyelesaikan dampak komunikasi yang kurang tepat.",
 reasoning:"Verifikasi siapa yang berhak menerima informasi, jelaskan pilihan atau kebijakan pada pesan utama, dan koreksi miskomunikasi tanpa menyalahkan penerima.",
 misconception:"Menganggap informasi sudah cukup hanya karena pernah ditulis atau menyerahkan data sensitif kepada pihak yang belum terverifikasi.",
 transfer:"Orang tua salah memahami kebijakan sekolah karena informasi penting terselip dalam dokumen panjang. Bagaimana sekolah memperbaiki komunikasi dan menangani dampak yang sudah terjadi?",
 h1:"Cari informasi apa yang terlewat, siapa penerima yang sah, dan dampak nyata dari miskomunikasi.",
 h2:"Masalah inti adalah kejelasan dan hak penerima, bukan sekadar mengirim ulang pesan yang sama.",
 h3:"Bandingkan komunikasi defensif dengan koreksi yang memperjelas inti dan menyelesaikan dampaknya.",
 h4:"Prinsipnya: dialog sekolah-keluarga harus jelas, proporsional, menghormati privasi, dan responsif terhadap kesalahpahaman."
},
"kemitraan_etis":{
 principle:"Kemitraan hanya layak jika manfaat pendidikan sejalan dengan perlindungan data, transparansi kepentingan, dan batas penggunaan yang jelas.",
 reasoning:"Periksa tujuan, pemrosesan data, retensi, penggunaan lanjutan, serta manfaat pedagogis sebelum pilot atau kontrak dimulai.",
 misconception:"Menerima tawaran karena gratis atau canggih tanpa menilai risiko data dan kepentingan komersial.",
 transfer:"Vendor menawarkan layanan gratis yang membutuhkan data siswa dan menjanjikan manfaat belajar. Apa yang harus diperiksa sebelum sekolah menyetujui pilot?",
 h1:"Cari data apa yang diminta, untuk apa diproses, berapa lama disimpan, dan manfaat belajar apa yang benar-benar ditargetkan.",
 h2:"Masalah inti adalah keseimbangan manfaat pendidikan dan perlindungan hak siswa.",
 h3:"Bandingkan penerimaan cepat karena gratis dengan penilaian manfaat serta tata kelola data sebelum penggunaan.",
 h4:"Prinsipnya: kemitraan etis memerlukan tujuan jelas, minimisasi risiko, perlindungan data, dan akuntabilitas."
},
"konflik_kepentingan":{
 principle:"Konflik kepentingan dikelola dengan mengungkap hubungan, memisahkan pihak berkepentingan dari keputusan, dan memakai proses yang dapat diperiksa.",
 reasoning:"Pisahkan bantuan atau hubungan personal dari seleksi penyedia, tetapkan kriteria objektif, lalu dokumentasikan proses.",
 misconception:"Menganggap harga murah atau manfaat besar otomatis menghapus konflik kepentingan.",
 transfer:"Seorang anggota komite merekomendasikan kerabatnya sebagai penyedia dengan harga kompetitif. Bagaimana sekolah menjaga manfaat tanpa merusak independensi keputusan?",
 h1:"Cari hubungan pribadi atau manfaat yang dapat memengaruhi keputusan meskipun penawarannya tampak baik.",
 h2:"Masalah inti adalah independensi dan kredibilitas proses, bukan sekadar harga atau kualitas.",
 h3:"Bandingkan transparansi pasif dengan pemisahan peran dan penilaian objektif yang dapat diperiksa.",
 h4:"Prinsipnya: konflik kepentingan harus diungkap dan dikelola melalui pemisahan peran serta proses objektif."
},
"musyawarah":{
 principle:"Musyawarah yang berkualitas memakai kriteria yang disepakati untuk menimbang urgensi, dampak, alternatif, dan jangkauan manfaat.",
 reasoning:"Jangan mengganti analisis dengan voting; gunakan data dan kriteria agar keputusan kolektif tetap substantif.",
 misconception:"Menganggap suara terbanyak selalu menghasilkan keputusan paling adil atau paling tepat.",
 transfer:"Tiga kebutuhan sekolah sama-sama didukung kelompok yang kuat sementara sumber daya hanya cukup untuk satu. Bagaimana forum menentukan prioritas secara sah dan rasional?",
 h1:"Identifikasi kebutuhan, dampak, alternatif yang tersedia, dan siapa yang terdampak tiap pilihan.",
 h2:"Masalah inti adalah prioritas sumber daya, bukan sekadar siapa memiliki pendukung terbanyak.",
 h3:"Bandingkan voting langsung dengan penilaian menggunakan kriteria yang disepakati.",
 h4:"Prinsipnya: musyawarah efektif menggabungkan partisipasi dengan kriteria keputusan yang dapat dipertanggungjawabkan."
},
"seleksi_kemitraan":{
 principle:"Kemitraan dipilih karena kesesuaian dengan prioritas dan kapasitas sekolah, bukan karena gratis, populer, atau mendesak.",
 reasoning:"Klarifikasi beban dan manfaat, negosiasikan lingkup, lalu nilai opportunity cost terhadap prioritas sekolah.",
 misconception:"Menerima semua peluang eksternal karena takut kehilangan kesempatan atau menolak tanpa mencoba menyesuaikan lingkup.",
 transfer:"Mitra menawarkan program menarik tetapi menyita waktu guru dan tidak sepenuhnya sesuai prioritas sekolah. Bagaimana kepala sekolah memutuskan dalam waktu terbatas?",
 h1:"Cari manfaat, beban waktu, kesesuaian dengan prioritas, dan ruang negosiasi program.",
 h2:"Masalah inti adalah opportunity cost dan kapasitas, bukan sekadar kualitas tawaran.",
 h3:"Bandingkan menerima penuh, menolak langsung, dan menegosiasikan skala yang selaras.",
 h4:"Prinsipnya: kemitraan strategis harus relevan dengan prioritas dan realistis terhadap kapasitas sekolah."
},
"tata_kelola_sumber_daya":{
 principle:"Sumber daya dikelola dengan status kepemilikan, akses, tanggung jawab, keamanan, dan keberlanjutan yang jelas.",
 reasoning:"Catat status yang benar, batasi akses sesuai kebutuhan, siapkan cadangan atau pemulihan, dan tetapkan penanggung jawab.",
 misconception:"Menyederhanakan administrasi dengan mengubah status fakta, memberi akses terlalu luas, atau menyimpan cadangan tanpa rencana pemulihan.",
 transfer:"Sekolah menerima aset dengan status kepemilikan berbeda dan data penting tersimpan di beberapa tempat. Apa prinsip tata kelola agar layanan tetap aman dan akuntabel?",
 h1:"Cari status aset atau data, siapa yang boleh mengakses, dan apa risiko bila sumber utama hilang.",
 h2:"Masalah inti adalah kontrol serta keberlanjutan, bukan sekadar kemudahan penggunaan.",
 h3:"Bandingkan solusi yang seragam tetapi mengabaikan status dengan pengaturan yang membedakan tanggung jawab secara jelas.",
 h4:"Prinsipnya: tata kelola sumber daya membutuhkan pencatatan akurat, akses berbasis kebutuhan, dan rencana kontinuitas."
},
"keputusan_berbasis_bukti":{
 principle:"Keputusan menggunakan data yang cukup, valid, dan terkait langsung dengan pertanyaan keputusan, sambil mengakui keterbatasan informasi.",
 reasoning:"Tentukan apa yang harus diketahui, periksa kualitas sumber, dan gunakan data untuk memilih tindakan yang dapat dipertanggungjawabkan.",
 misconception:"Menggunakan data terbanyak, angka tunggal, popularitas, atau dugaan sebagai pengganti analisis yang relevan.",
 transfer:"Sekolah memiliki beberapa data yang tampak bertentangan dan harus mengambil keputusan segera. Bagaimana kepala sekolah menentukan bukti mana yang digunakan dan apa yang masih perlu diverifikasi?",
 h1:"Tentukan data mana yang langsung menjawab pertanyaan keputusan dan mana yang hanya memberi konteks.",
 h2:"Masalah inti adalah kecukupan dan kualitas bukti, bukan banyaknya dokumen.",
 h3:"Bandingkan keputusan yang memilih satu sumber secara otomatis dengan keputusan yang mengintegrasikan sumber sesuai fungsinya.",
 h4:"Prinsipnya: keputusan berbasis bukti memakai data yang valid, relevan pada masalah, dan transparan tentang keterbatasannya."
},
"analisis_akar_masalah":{
 principle:"Intervensi yang kuat mengikuti diagnosis akar masalah, bukan langsung memilih solusi yang populer atau cepat.",
 reasoning:"Pisahkan gejala dari penyebab, kumpulkan data yang membedakan beberapa hipotesis, lalu pilih faktor yang dapat diintervensi.",
 misconception:"Langsung menambah jam, aplikasi, pelatihan, atau sanksi sebelum memahami penyebab.",
 transfer:"Hasil belajar menurun tetapi ada beberapa kemungkinan penyebab. Apa langkah diagnosis singkat yang harus dilakukan sebelum sekolah memilih intervensi?",
 h1:"Cari gejala, kemungkinan penyebab, dan data yang dapat membedakan satu hipotesis dari hipotesis lain.",
 h2:"Masalah inti adalah menemukan penyebab yang dapat diintervensi, bukan sekadar merespons angka yang turun.",
 h3:"Bandingkan solusi cepat dengan diagnosis terfokus yang menggunakan beberapa sumber.",
 h4:"Prinsipnya: diagnosis mendahului intervensi ketika penyebab belum cukup jelas."
},
"prioritas_anggaran":{
 principle:"Anggaran mendahulukan kewajiban dan kebutuhan kritis, lalu memilih program berdasarkan dampak, biaya, kelayakan, dan risiko.",
 reasoning:"Pisahkan mandatory dari discretionary spending lalu nilai opportunity cost setiap program.",
 misconception:"Membagi dana sama rata, mengikuti popularitas, atau memilih yang termurah tanpa menilai dampak.",
 transfer:"Dana sekolah tidak cukup untuk semua program. Bagaimana kepala sekolah menentukan mana yang tetap dibiayai tanpa menurunkan kualitas semua kegiatan?",
 h1:"Pisahkan kewajiban, kebutuhan mendesak, dan program pilihan; lihat juga biaya serta dampaknya.",
 h2:"Masalah inti adalah opportunity cost dan mutu pelaksanaan, bukan pemerataan nominal.",
 h3:"Bandingkan pembagian sama rata dengan pemenuhan kewajiban lalu prioritisasi berdasarkan dampak dan kelayakan.",
 h4:"Prinsipnya: alokasi anggaran harus melindungi kewajiban dasar dan memaksimalkan nilai publik dari sisa sumber daya."
},
"evaluasi_investasi":{
 principle:"Keputusan investasi menilai manfaat dan biaya masa depan, bukan mempertahankan pilihan hanya karena biaya lama sudah besar.",
 reasoning:"Abaikan sunk cost sebagai alasan utama, cari penyebab penggunaan rendah, lalu bandingkan opsi ke depan.",
 misconception:"Menganggap investasi lama akan sia-sia jika kontrak dihentikan sehingga harus terus diperpanjang.",
 transfer:"Sekolah sudah mengeluarkan biaya besar untuk sistem yang pemakaiannya rendah. Apa dasar rasional untuk memutuskan perpanjangan atau penghentian?",
 h1:"Pisahkan biaya yang sudah tidak dapat kembali dari biaya dan manfaat yang masih akan terjadi.",
 h2:"Masalah inti adalah nilai keputusan ke depan, bukan menyelamatkan keputusan masa lalu.",
 h3:"Bandingkan perpanjangan karena sunk cost dengan evaluasi manfaat, sebab penggunaan rendah, dan opsi lain.",
 h4:"Prinsipnya: sunk cost tidak boleh menjadi alasan mempertahankan investasi yang tidak lagi bernilai."
},
"evaluasi_program":{
 principle:"Evaluasi program menilai tujuan yang dinyatakan, manfaat lain yang masuk akal, biaya, dan alternatif sebelum program diteruskan atau diubah.",
 reasoning:"Jangan menolak manfaat yang belum diukur, tetapi verifikasi klaim tersebut sebelum menjadikannya alasan keberlanjutan.",
 misconception:"Menghentikan program hanya dari satu indikator atau mempertahankannya hanya karena disukai.",
 transfer:"Program tidak mencapai target awal tetapi peserta mengklaim ada manfaat lain. Bagaimana sekolah menilai apakah program layak dilanjutkan?",
 h1:"Pisahkan target awal dari manfaat tambahan yang baru diklaim dan tanyakan bagaimana keduanya dapat dibuktikan.",
 h2:"Masalah inti adalah nilai program secara keseluruhan dibanding biaya dan pilihan lain.",
 h3:"Bandingkan keputusan berdasarkan satu indikator dengan evaluasi yang juga menguji manfaat lain.",
 h4:"Prinsipnya: evaluasi program harus terbuka pada manfaat nyata tetapi tetap memerlukan bukti dan perbandingan biaya."
},
"adaptasi_praktik_baik":{
 principle:"Praktik baik ditransfer melalui mekanisme yang relevan dengan masalah lokal, bukan menyalin bentuk luarnya.",
 reasoning:"Cari mengapa praktik berhasil, bandingkan konteks, lalu adaptasikan unsur inti terhadap penyebab lokal.",
 misconception:"Meniru program karena terkenal berhasil tanpa memeriksa perbedaan penyebab, sumber daya, dan pengguna.",
 transfer:"Sekolah lain sukses dengan satu program, tetapi kondisi murid dan penyebab masalah di sekolah Anda berbeda. Apa yang harus dipelajari sebelum mengadaptasi program itu?",
 h1:"Cari mekanisme keberhasilan praktik rujukan dan faktor konteks yang berbeda di sekolah sendiri.",
 h2:"Masalah inti adalah transfer mekanisme, bukan menyalin fitur.",
 h3:"Bandingkan peniruan utuh dengan adaptasi berdasarkan penyebab lokal dan unsur inti.",
 h4:"Prinsipnya: praktik baik harus diadaptasi setelah mekanisme dan konteksnya dipahami."
},
"belajar_dari_kegagalan":{
 principle:"Kegagalan atau pemakaian rendah adalah data untuk memahami desain, bukan alasan otomatis untuk menutup atau menambah program.",
 reasoning:"Cari penyebab, bedakan masalah kebutuhan dari akses atau pelaksanaan, lalu ubah satu atau beberapa komponen yang dapat diuji.",
 misconception:"Menilai keberhasilan hanya dari volume awal atau merespons dengan menambah kegiatan tanpa diagnosis.",
 transfer:"Program baru sepi pengguna meskipun peserta yang datang merasa terbantu. Bagaimana kepala sekolah belajar dari hasil awal sebelum memutuskan nasib program?",
 h1:"Cari siapa yang membutuhkan, siapa yang datang, hambatan akses, dan apa yang terjadi pada pengguna yang sudah mencoba.",
 h2:"Masalah inti adalah alasan adopsi rendah, bukan sekadar angka kunjungan.",
 h3:"Bandingkan menutup atau menambah volume dengan diagnosis hambatan lalu perubahan desain.",
 h4:"Prinsipnya: inovasi diperbaiki melalui siklus data → hipotesis → perubahan → evaluasi."
},
"manajemen_risiko":{
 principle:"Inovasi dilakukan dengan risiko yang diidentifikasi, dibatasi, dipantau, dan memiliki kriteria penghentian atau perluasan.",
 reasoning:"Mulai dari sumber daya pasti, uji skala terbatas, tetapkan indikator, dan hindari komitmen yang tidak dapat dibatalkan saat ketidakpastian tinggi.",
 misconception:"Mengambil komitmen besar karena optimisme atau menolak semua inovasi karena adanya risiko.",
 transfer:"Program menjanjikan manfaat tetapi biaya, beban, dan kepatuhan belum pasti. Bagaimana kepala sekolah merancang keputusan yang tetap inovatif namun terkendali?",
 h1:"Daftar risiko utama, apa yang dapat dibatasi, dan komitmen mana yang sulit dibatalkan.",
 h2:"Masalah inti adalah mengelola ketidakpastian, bukan menghilangkan semua risiko.",
 h3:"Bandingkan implementasi penuh dan penundaan total dengan pilot yang memiliki batas serta kriteria.",
 h4:"Prinsipnya: risiko diterima secara sadar jika ada mitigasi, monitoring, dan exit criteria."
},
"mindset_entrepreneurial":{
 principle:"Mindset entrepreneurial mencari nilai belajar, peluang, dan risiko secara bersamaan dengan eksperimen yang aman dan tujuan yang jelas.",
 reasoning:"Pilih pengalaman yang memperluas wawasan atau keterampilan, mulai dari kondisi aman, dan gunakan refleksi untuk menghasilkan pembelajaran.",
 misconception:"Menyamakan kewirausahaan dengan profesi terkenal, pendapatan tinggi, atau keberanian mengambil risiko tanpa pengamanan.",
 transfer:"Sekolah ingin mengenalkan dunia kerja dan usaha kepada siswa dengan waktu terbatas. Bagaimana memilih pengalaman yang paling memperluas cara berpikir siswa?",
 h1:"Cari tujuan belajar yang ingin diperluas, bukan sekadar siapa narasumber paling terkenal.",
 h2:"Masalah inti adalah nilai pengalaman bagi pembelajaran dan kesiapan siswa.",
 h3:"Bandingkan pilihan berdasarkan popularitas dengan keragaman pengalaman dan keselamatan proses.",
 h4:"Prinsipnya: entrepreneurial mindset tumbuh dari eksplorasi nilai, keterampilan, pilihan, dan pembelajaran dari pengalaman."
},
"skalabilitas_praktik_baik":{
 principle:"Praktik baik diperluas setelah mekanisme keberhasilannya dipahami dan kapasitas implementasi disiapkan.",
 reasoning:"Identifikasi elemen inti, uji pada konteks tambahan, bangun kapasitas pendamping, lalu perluas berdasarkan kualitas pelaksanaan.",
 misconception:"Menganggap hasil pilot otomatis akan sama ketika skala diperbesar.",
 transfer:"Pilot berhasil pada beberapa kelas dan sekolah ingin memperluas segera. Apa yang harus dipastikan agar kualitas tidak jatuh saat skala bertambah?",
 h1:"Cari apa yang sebenarnya menyebabkan pilot berhasil dan sumber daya apa yang akan menjadi bottleneck saat diperluas.",
 h2:"Masalah inti adalah fidelity dan kapasitas, bukan hanya momentum.",
 h3:"Bandingkan perluasan langsung dengan replikasi terkontrol dan pembangunan kapasitas.",
 h4:"Prinsipnya: scale-up yang sehat menjaga mekanisme inti sambil menambah kapasitas dan monitoring."
},
"teknologi_berbasis_masalah":{
 principle:"Teknologi dipilih setelah masalah pengguna dan tujuan belajar jelas, lalu dinilai dari akses, manfaat, risiko, dan keberlanjutan.",
 reasoning:"Mulai dari masalah, tentukan bukti keberhasilan, pilih teknologi yang sesuai kemampuan pengguna, dan hindari ketergantungan pada fitur.",
 misconception:"Memulai dari aplikasi atau fitur canggih lalu mencari masalah yang cocok.",
 transfer:"Sekolah ditawari teknologi baru yang menarik tetapi belum jelas masalah apa yang akan diselesaikan. Apa urutan keputusan yang tepat?",
 h1:"Tentukan masalah pengguna dan hasil yang ingin berubah sebelum melihat fitur teknologi.",
 h2:"Masalah inti adalah kesesuaian solusi terhadap kebutuhan dan akses.",
 h3:"Bandingkan standardisasi satu alat dengan pilihan teknologi atau jalur layanan yang mengikuti kemampuan pengguna.",
 h4:"Prinsipnya: teknologi adalah alat; masalah, akses, manfaat, risiko, dan keberlanjutan harus lebih dulu jelas."
},
"diferensiasi":{
 principle:"Diferensiasi menjaga tujuan belajar yang sama sambil menyesuaikan dukungan, tantangan, atau cara respons sesuai kebutuhan murid.",
 reasoning:"Gunakan data awal untuk menentukan siapa membutuhkan contoh, pengayaan, waktu, atau format respons yang berbeda tanpa mengubah konstruk yang dinilai.",
 misconception:"Memberi lebih banyak tugas kepada siswa cepat atau menyamakan semua perlakuan demi fairness.",
 transfer:"Dalam satu kelas, sebagian siswa membutuhkan banyak contoh sedangkan sebagian lain sudah siap tantangan lebih tinggi. Bagaimana guru menyesuaikan pembelajaran tanpa mengubah tujuan inti?",
 h1:"Cari perbedaan kebutuhan belajar dan tujuan kompetensi yang harus tetap sama.",
 h2:"Masalah inti adalah jenis dukungan, bukan jumlah pekerjaan yang sama bagi semua.",
 h3:"Bandingkan penambahan volume tugas dengan penyesuaian kedalaman, dukungan, atau bentuk respons.",
 h4:"Prinsipnya: diferensiasi menyesuaikan jalan menuju tujuan, bukan menurunkan standar tujuan."
},
"tujuan_supervisi":{
 principle:"Supervisi bertujuan memperbaiki praktik mengajar dan pengalaman belajar siswa, bukan sekadar memenuhi jadwal, formulir, atau kepuasan.",
 reasoning:"Gunakan indikator perubahan praktik dan dampak pada siswa serta sesuaikan fokus dengan kebutuhan guru tanpa kehilangan prioritas sekolah.",
 misconception:"Mengukur keberhasilan supervisi dari jumlah pertemuan, kelengkapan dokumen, atau rasa nyaman saja.",
 transfer:"Supervisi terlaksana lengkap dan guru puas, tetapi belum ada data perubahan pembelajaran. Apa ukuran yang lebih bermakna untuk menilai keberhasilannya?",
 h1:"Cari indikator yang menunjukkan perubahan perilaku mengajar dan pengalaman siswa setelah supervisi.",
 h2:"Masalah inti adalah dampak supervisi, bukan keterlaksanaan prosedur.",
 h3:"Bandingkan indikator administratif dengan indikator perubahan praktik dan pembelajaran.",
 h4:"Prinsipnya: supervisi berhasil bila terjadi perbaikan praktik yang dapat ditelusuri pada pengalaman atau hasil belajar."
},
"tindak_lanjut":{
 principle:"Tindak lanjut supervisi harus realistis, terfokus, dapat dipantau, dan menggunakan bukti secukupnya untuk melihat perubahan.",
 reasoning:"Pilih perubahan kecil yang dapat dilakukan, sederhanakan monitoring, dan adaptasikan praktik rujukan berdasarkan fungsi unsur intinya.",
 misconception:"Mewajibkan perubahan besar atau dokumentasi berat yang membuat guru berhenti mencoba.",
 transfer:"Guru telah mencoba teknik baru tetapi beban administrasi membuatnya berhenti. Bagaimana pendampingan dirancang agar perubahan tetap bergerak dan dapat dipantau?",
 h1:"Cari hambatan implementasi dan bukti minimum yang sudah tersedia untuk melihat perubahan.",
 h2:"Masalah inti adalah menjaga siklus perbaikan tetap realistis, bukan menambah kepatuhan administratif.",
 h3:"Bandingkan kewajiban besar dengan uji kecil serta monitoring sederhana.",
 h4:"Prinsipnya: tindak lanjut efektif memecah perubahan menjadi langkah realistis dengan bukti monitoring yang bermakna."
},
"keterlibatan_murid":{
 principle:"Keterlibatan murid dinilai dari kesempatan berpikir dan berkontribusi, bukan hanya jumlah respons atau ketenangan kelas.",
 reasoning:"Gunakan data respons awal untuk mengatur dukungan, kesempatan berbicara, dan tantangan agar lebih banyak murid terlibat secara kognitif.",
 misconception:"Menganggap kelas aktif karena beberapa siswa sering menjawab atau menambah pertanyaan tanpa memeriksa kualitas partisipasi.",
 transfer:"Kelas terlihat tertib dan jawaban benar cukup banyak, tetapi hanya siswa tertentu yang terlibat. Bagaimana supervisi menilai dan memperbaiki keterlibatan secara bermakna?",
 h1:"Cari siapa yang berpikir, siapa yang berbicara, dan apakah respons menunjukkan pemahaman atau sekadar meniru.",
 h2:"Masalah inti adalah distribusi kesempatan berpikir, bukan volume aktivitas.",
 h3:"Bandingkan target jumlah jawaban dengan perubahan strategi yang membuka partisipasi dan penalaran lebih luas.",
 h4:"Prinsipnya: keterlibatan bermakna berarti lebih banyak murid aktif memproses, menjelaskan, dan mengambil keputusan belajar."
},
"umpan_balik_berbasis_bukti":{
 principle:"Umpan balik supervisi dimulai dari bukti kelas yang dapat diamati dan dihubungkan dengan tujuan belajar.",
 reasoning:"Deskripsikan pola interaksi atau hasil, ajak guru menafsirkan sebab, lalu sepakati perubahan spesifik yang dapat diamati lagi.",
 misconception:"Memberi saran umum atau solusi sebelum guru dan supervisor menelaah data kelas.",
 transfer:"Observasi menunjukkan nilai tinggi tetapi penalaran siswa dangkal. Bagaimana kepala sekolah membuka percakapan supervisi agar tidak berhenti pada angka hasil?",
 h1:"Cari data konkret dari respons siswa, interaksi kelas, dan tujuan yang seharusnya dicapai.",
 h2:"Masalah inti adalah kualitas belajar yang tidak terlihat dari skor saja.",
 h3:"Bandingkan nasihat langsung dengan dialog yang berangkat dari bukti dan mengarah pada perubahan terukur.",
 h4:"Prinsipnya: evidence-based feedback menghubungkan observasi → interpretasi → tindakan → observasi ulang."
},
"analisis_hasil_belajar":{
 principle:"Analisis hasil belajar mempertimbangkan kemampuan awal, kehadiran, proses pembelajaran, dan konteks sebelum menetapkan penyebab.",
 reasoning:"Petakan beberapa faktor, pilih hipotesis yang dapat diuji, dan fokus pada faktor yang dapat diintervensi.",
 misconception:"Menganggap satu faktor sebagai penyebab utama hanya karena paling terlihat.",
 transfer:"Satu kelas memiliki hasil jauh lebih rendah dan beberapa faktor berbeda dari kelas lain. Bagaimana supervisor menentukan fokus perbaikan tanpa menyederhanakan penyebab?",
 h1:"Cari perbedaan kondisi awal, kehadiran, dan proses pembelajaran.",
 h2:"Masalah inti adalah kontribusi beberapa faktor, bukan mencari satu kambing hitam.",
 h3:"Bandingkan penjelasan tunggal dengan pemetaan faktor dan pemilihan hipotesis yang dapat diuji.",
 h4:"Prinsipnya: hasil belajar dianalisis secara multikausal sebelum intervensi dipilih."
},
"evaluasi_inovasi_pembelajaran":{
 principle:"Inovasi pembelajaran dinilai dari keselarasan aktivitas dengan tujuan dan asesmen, bukan hanya antusiasme atau kualitas produk.",
 reasoning:"Periksa tujuan konsep dan tujuan lain, lihat bukti sebelum-sesudah, lalu ubah desain agar manfaat nonakademik tidak mengorbankan tujuan inti.",
 misconception:"Menganggap kegiatan kreatif otomatis efektif atau menghentikannya hanya karena satu hasil belum naik.",
 transfer:"Proyek sangat disukai siswa tetapi konsep inti tidak berkembang. Bagaimana supervisor menilai apakah proyek perlu dihentikan atau didesain ulang?",
 h1:"Cari tujuan yang ditetapkan dan bukti mana yang menunjukkan tercapai atau belum tercapai.",
 h2:"Masalah inti adalah keselarasan desain dengan tujuan, bukan memilih kreativitas atau konsep secara mutlak.",
 h3:"Bandingkan mempertahankan, menghentikan, dan mendesain ulang berdasarkan bukti tujuan.",
 h4:"Prinsipnya: inovasi harus menjaga alignment tujuan → aktivitas → asesmen sambil mempertahankan manfaat yang bernilai."
},
"dampak_supervisi":{
 principle:"Dampak supervisi terlihat pada perubahan praktik dari waktu ke waktu dan pada pengalaman atau hasil belajar siswa.",
 reasoning:"Telusuri baseline, perubahan praktik, dan indikator siswa secara longitudinal, bukan sekadar aktivitas supervisi.",
 misconception:"Menganggap supervisi sukses karena siklus selesai, rekomendasi ditutup, atau guru merasa nyaman.",
 transfer:"Semua supervisi selesai tepat waktu tetapi pimpinan ingin tahu apakah pembelajaran berubah. Data apa yang harus diprioritaskan dan bagaimana membacanya?",
 h1:"Cari perubahan praktik dan indikator siswa sebelum serta sesudah tindak lanjut.",
 h2:"Masalah inti adalah dampak, bukan kepatuhan proses.",
 h3:"Bandingkan indikator kegiatan dengan indikator perubahan yang dapat ditelusuri lintas waktu.",
 h4:"Prinsipnya: dampak supervisi membutuhkan jejak perubahan praktik dan pengalaman belajar, bukan hanya bukti administratif."
}
};

const DEFAULT:ProTemplate={
 principle:"Keputusan kepala sekolah harus berbasis fakta, proporsional terhadap risiko, dapat dipertanggungjawabkan, dan berorientasi pada pembelajaran.",
 reasoning:"Tangkap fakta kunci, bedakan gejala dari masalah inti, bandingkan konsekuensi opsi, lalu pilih tindakan yang paling kuat secara etis dan operasional.",
 misconception:"Memilih tindakan tercepat atau paling populer tanpa memeriksa bukti, risiko, dan dampak.",
 transfer:"Pada kasus baru dengan beberapa pilihan yang sama-sama masuk akal, jelaskan bagaimana Anda menentukan prioritas keputusan kepala sekolah.",
 h1:"Identifikasi fakta yang benar-benar menentukan keputusan dan pihak yang paling terdampak.",
 h2:"Bedakan gejala, akar masalah, dan tujuan yang harus dilindungi.",
 h3:"Bandingkan dua pilihan terkuat dari bukti, risiko, dan konsekuensinya.",
 h4:"Gunakan prinsip keputusan profesional: berbasis fakta, proporsional, akuntabel, dan berorientasi pada pembelajaran."
};

export function buildProV1Meta(subcompetency:string,correctOption:string){
 const x=T[String(subcompetency||"")]||DEFAULT;
 const db:Record<string,number>={};
 for(const l of LETTERS)db[l]=l===String(correctOption||"").toUpperCase()?5:2;
 return {...x,db,mc:"PRO_"+String(subcompetency||"GENERAL").toUpperCase().slice(0,32)};
}
