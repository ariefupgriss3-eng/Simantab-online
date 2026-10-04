/* PREMIUM TWO v1.0 DRAFT — server-only metadata. Belum production. */
export const PREMIUM_TWO_MC={
  "MC01": "Mengambil tindakan sebelum diagnosis masalah cukup kuat.",
  "MC02": "Keliru menentukan urutan atau prioritas tindakan.",
  "MC03": "Kurang menjaga hak, kebutuhan, atau keberpihakan pada murid.",
  "MC04": "Integritas atau pertimbangan etika dikalahkan kepentingan lain.",
  "MC05": "Terlalu direktif dan kurang memberdayakan orang lain.",
  "MC06": "Komunikasi satu arah atau dialog tidak berbasis bukti dan kepemilikan.",
  "MC07": "Program atau keputusan tidak cukup terhubung dengan visi/tujuan.",
  "MC08": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
  "MC09": "Keselamatan, inklusi, akses, atau keamanan psikologis kurang diprioritaskan.",
  "MC10": "Supervisi berubah menjadi inspeksi/pemberian solusi, bukan refleksi profesional.",
  "MC11": "Pengembangan kompetensi dipilih sebelum kebutuhan dipastikan atau tanpa transfer ke praktik.",
  "MC12": "Sumber daya dialokasikan tanpa kriteria kebutuhan, dampak, risiko, dan keberlanjutan.",
  "MC13": "Akuntabilitas direduksi menjadi administrasi/keuangan, bukan tujuan belajar dan hasil.",
  "MC14": "Kolaborasi/kemitraan berhenti pada kegiatan, bukan penerapan dan hasil.",
  "MC15": "Aktivitas atau keterlaksanaan dianggap cukup tanpa menilai dampak.",
  "MC16": "Solusi kurang adaptif, tidak belajar dari bukti/kegagalan, atau tidak berkelanjutan."
} as const;
export const PREMIUM_TWO_V1_META={
  "2001": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "D",
      "B"
    ],
    "db": {
      "B": 3,
      "D": 1,
      "E": 5,
      "C": 2,
      "A": 4
    },
    "mc": "MC04",
    "misconception": "Integritas atau pertimbangan etika dikalahkan kepentingan lain.",
    "principle": "Konsistensi aturan harus berbasis verifikasi fakta; kontribusi individu tidak menghapus akuntabilitas.",
    "reasoning": "Bedakan kejadian yang memiliki dasar tugas resmi dan yang tidak, lalu terapkan konsekuensi serta dukungan secara konsisten.",
    "h1": "Tidak semua delapan keterlambatan memiliki status yang sama.",
    "h2": "Masalahnya bukan sekadar jumlah keterlambatan, tetapi apakah setiap kejadian memiliki dasar yang sah dan diperlakukan konsisten.",
    "h3": "Bandingkan sanksi seragam dengan verifikasi tiap kejadian. Mana yang lebih adil sekaligus dapat dipertanggungjawabkan?",
    "h4": "Equity dan integritas menuntut fakta yang relevan diperiksa sebelum aturan diterapkan secara konsisten.",
    "transfer": "Seorang guru berprestasi beberapa kali tidak memenuhi tenggat karena menjalankan tugas eksternal yang sebagian memiliki surat tugas dan sebagian tidak. Data apa yang harus dibedakan sebelum kepala sekolah menetapkan konsekuensi?"
  },
  "2002": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "E",
      "B",
      "A",
      "D"
    ],
    "db": {
      "E": 2,
      "C": 3,
      "D": 5,
      "A": 1,
      "B": 4
    },
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Keputusan asesmen harus sahih, transparan, dan didasarkan pada kriteria yang diketahui peserta sebelum penilaian.",
    "reasoning": "Periksa bukti, kriteria, dan transparansi proses sebelum mengubah atau mempertahankan hasil asesmen.",
    "h1": "Rubrik diberikan setelah tugas selesai.",
    "h2": "Persoalannya bukan hanya nilai akhir, tetapi validitas proses penilaian.",
    "h3": "Bandingkan mempertahankan nilai demi kewenangan guru dengan langsung menaikkan nilai demi murid. Apa risiko masing-masing?",
    "h4": "Keputusan yang adil lahir dari aturan penilaian yang diketahui sejak awal, alasan yang dapat diuji, dan mekanisme peninjauan yang sah.",
    "transfer": "Seorang murid memprotes hasil seleksi karena kriteria tertentu baru dijelaskan setelah penilaian dilakukan. Bagaimana kepala sekolah menilai keadilan keputusan tanpa otomatis membatalkan hasil?"
  },
  "2003": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "B",
      "D"
    ],
    "db": {
      "E": 3,
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 4
    },
    "mc": "MC15",
    "misconception": "Aktivitas atau keterlaksanaan dianggap cukup tanpa menilai dampak.",
    "principle": "Program dievaluasi berdasarkan manfaat dan bukti, bukan keterikatan pribadi atau citra pimpinan.",
    "reasoning": "Pisahkan kepentingan pribadi dari tujuan sekolah, telaah bukti bersama, lalu nilai apakah program layak diperbaiki, diteruskan, atau dihentikan.",
    "h1": "Program memiliki citra baik tetapi dampak pada murid rendah.",
    "h2": "Risiko utamanya adalah bias kepemilikan karena program digagas kepala sekolah sendiri.",
    "h3": "Bandingkan mempertahankan program demi identitas dengan menghentikannya hanya karena dampak saat ini rendah.",
    "h4": "Evaluasi profesional menuntut konflik kepentingan dikenali dan keputusan kembali pada tujuan, bukti, serta peluang perbaikan.",
    "transfer": "Program yang digagas langsung oleh kepala sekolah mendapat citra publik sangat baik, tetapi bukti dampaknya lemah. Bagaimana pimpinan mencegah kepentingan pribadi memengaruhi evaluasi?"
  },
  "2004": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "E",
      "D",
      "A",
      "B"
    ],
    "db": {
      "B": 2,
      "D": 1,
      "C": 5,
      "A": 3,
      "E": 4
    },
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Redistribusi kerja harus didasarkan pada beban yang terverifikasi, termasuk pekerjaan formal dan informal yang relevan.",
    "reasoning": "Lengkapi data beban dengan kriteria terbuka sebelum menetapkan pembagian baru.",
    "h1": "Sebagian pekerjaan kedua guru tidak tercatat dalam dokumen formal.",
    "h2": "Data yang tidak lengkap dapat membuat keputusan yang tampak adil justru tidak adil.",
    "h3": "Bandingkan pembagian sama rata dengan mempertahankan sementara. Mana yang menyelesaikan masalah data?",
    "h4": "Keputusan berbasis bukti mensyaratkan data cukup lengkap dan kriteria pembanding yang disepakati.",
    "transfer": "Dua pegawai mengklaim beban kerjanya paling berat, tetapi sebagian pekerjaan mereka tidak tercatat dalam pembagian formal. Apa dasar keputusan sebelum redistribusi dilakukan?"
  },
  "2005": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "B",
      "D"
    ],
    "mc": "MC04",
    "misconception": "Integritas atau pertimbangan etika dikalahkan kepentingan lain.",
    "principle": "Integritas menuntut pemulihan fakta, akuntabilitas proporsional, dan perbaikan sistem yang mendorong pelanggaran.",
    "reasoning": "Koreksi dokumen, tangani pelanggaran sesuai tingkatnya, lalu perbaiki alur kerja penyebab keterlambatan.",
    "h1": "Isi laporan benar, tetapi tanggal sengaja diubah.",
    "h2": "Ada dua masalah: tindakan individu dan sistem kerja yang menyebabkan keterlambatan.",
    "h3": "Bandingkan hukuman saja dengan koreksi dokumen saja. Apa yang tidak terselesaikan pada masing-masing?",
    "h4": "Akuntabilitas yang sehat memulihkan integritas sekaligus mengurangi kemungkinan pelanggaran berulang.",
    "transfer": "Operator mengubah data agar target terlihat tercapai, tetapi tidak memperoleh keuntungan pribadi. Mengapa memperbaiki angka saja belum cukup?",
    "db": {
      "C": 3,
      "D": 2,
      "B": 5,
      "E": 1,
      "A": 4
    }
  },
  "2006": {
    "target_key": "A",
    "semantic_rank": [
      "C",
      "D",
      "E",
      "B",
      "A"
    ],
    "db": {
      "B": 1,
      "E": 2,
      "A": 5,
      "C": 4,
      "D": 3
    },
    "mc": "MC15",
    "misconception": "Aktivitas atau keterlaksanaan dianggap cukup tanpa menilai dampak.",
    "principle": "Keberhasilan pengembangan profesional dibuktikan oleh transfer ke praktik dan dampaknya, bukan sertifikat atau kepuasan.",
    "reasoning": "Telaah perubahan perilaku kepemimpinan, hambatan penerapan, dan pengaruhnya terhadap proses sekolah.",
    "h1": "Dokumentasi pelatihan lengkap tetapi praktik hampir tidak berubah.",
    "h2": "Masalahnya adalah transfer kompetensi, bukan partisipasi pelatihan.",
    "h3": "Bandingkan menambah pelatihan baru dengan mengevaluasi penerapan pelatihan lama.",
    "h4": "Aktivitas belajar baru bernilai ketika menjadi perubahan praktik yang dapat diamati dan dievaluasi.",
    "transfer": "Peserta pelatihan memberi nilai kepuasan sangat tinggi, tetapi perilaku kerja enam bulan kemudian hampir sama. Bukti apa yang paling penting untuk menentukan keberhasilan pelatihan?"
  },
  "2007": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "A",
      "E",
      "D",
      "B"
    ],
    "mc": "MC04",
    "misconception": "Integritas atau pertimbangan etika dikalahkan kepentingan lain.",
    "principle": "Pelanggaran individu dan kelemahan sistem harus ditangani bersamaan secara proporsional.",
    "reasoning": "Terapkan konsekuensi sesuai aturan kepada murid tanpa mengabaikan perbaikan sistem pengawasan yang memungkinkan pelanggaran.",
    "h1": "Pelanggaran terbukti, tetapi sistem ujian juga memiliki kelemahan.",
    "h2": "Menghukum murid saja tidak memperbaiki kondisi yang memungkinkan kasus serupa berulang.",
    "h3": "Bandingkan sanksi maksimal dengan pengulangan ujian tanpa catatan pelanggaran.",
    "h4": "Integritas akademik membutuhkan akuntabilitas individual dan kontrol sistem yang efektif.",
    "transfer": "Murid berprestasi melakukan pelanggaran akademik pada sistem ujian yang ternyata memiliki kelemahan pengawasan. Bagaimana menyeimbangkan akuntabilitas individu dan perbaikan sistem?",
    "db": {
      "D": 4,
      "B": 1,
      "C": 5,
      "A": 2,
      "E": 3
    }
  },
  "2008": {
    "target_key": "A",
    "semantic_rank": [
      "C",
      "D",
      "A",
      "B",
      "E"
    ],
    "mc": "MC06",
    "misconception": "Komunikasi satu arah atau dialog tidak berbasis bukti dan kepemilikan.",
    "principle": "Cara menyampaikan kritik dan validitas substansi harus dievaluasi sebagai dua persoalan yang berbeda.",
    "reasoning": "Tangani komunikasi yang merusak secara proporsional sambil tetap menelaah bukti yang dibawa kritik.",
    "h1": "Cara kritik bermasalah, tetapi sebagian isinya didukung data.",
    "h2": "Menolak substansi karena nada kritik buruk adalah kekeliruan penalaran.",
    "h3": "Bandingkan menegur cara komunikasi saja dengan membuka seluruh perdebatan di grup.",
    "h4": "Dialog profesional menjaga norma komunikasi tanpa menjadikan norma itu alasan mengabaikan bukti.",
    "transfer": "Seorang pegawai menyampaikan kritik dengan cara tidak tepat tetapi membawa informasi yang ternyata benar. Mengapa cara komunikasi dan substansi kritik perlu dinilai secara terpisah?",
    "db": {
      "B": 3,
      "C": 2,
      "A": 5,
      "E": 4,
      "D": 1
    }
  },
  "2009": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "E",
      "D",
      "A",
      "B"
    ],
    "mc": "MC03",
    "misconception": "Kurang menjaga hak, kebutuhan, atau keberpihakan pada murid.",
    "principle": "Keadilan tidak selalu berarti perlakuan identik; dukungan dapat disesuaikan tetapi harus jelas, terbatas, dan ditinjau.",
    "reasoning": "Buat penyesuaian sementara dengan batas waktu, pemantauan, dan upaya penyelesaian bersama keluarga.",
    "h1": "Keterlambatan berasal dari tanggung jawab keluarga yang belum dapat segera diubah.",
    "h2": "Dilema utamanya adalah menjaga hak belajar tanpa membuat pengecualian tanpa batas.",
    "h3": "Bandingkan dispensasi permanen dengan sanksi identik untuk semua murid.",
    "h4": "Equity memberi dukungan sesuai kebutuhan sambil menjaga standar, tujuan, dan review yang jelas.",
    "transfer": "Murid sering terlambat karena harus merawat anggota keluarga. Bagaimana sekolah menerapkan keadilan tanpa menyamakan perlakuan semua murid?",
    "db": {
      "C": 2,
      "E": 1,
      "D": 5,
      "B": 3,
      "A": 4
    }
  },
  "2010": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "B",
      "E",
      "D",
      "A"
    ],
    "mc": "MC02",
    "misconception": "Keliru menentukan urutan atau prioritas tindakan.",
    "principle": "Risiko keselamatan diprioritaskan berdasarkan tingkat bahaya dan kemungkinan terjadi, lalu dimitigasi bertahap.",
    "reasoning": "Petakan risiko, tangani kerentanan paling kritis terlebih dahulu, dan jadwalkan perbaikan lain secara terukur.",
    "h1": "Belum ada kecelakaan serius bukan berarti risikonya rendah.",
    "h2": "Keterbatasan anggaran memerlukan prioritisasi, bukan penundaan semua atau perbaikan semua sekaligus.",
    "h3": "Bandingkan memperbaiki seluruh prosedur segera dengan menunda sampai ada insiden.",
    "h4": "Risk-based decision making mendahulukan risiko paling kritis dan membangun mitigasi berjenjang.",
    "transfer": "Sekolah menemukan beberapa risiko keselamatan, sementara anggaran tidak cukup memperbaiki semuanya sekaligus. Bagaimana menentukan risiko mana yang harus ditangani terlebih dahulu?",
    "db": {
      "A": 1,
      "B": 4,
      "C": 5,
      "E": 2,
      "D": 3
    }
  },
  "2011": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "D",
      "A",
      "E",
      "B"
    ],
    "mc": "MC04",
    "misconception": "Integritas atau pertimbangan etika dikalahkan kepentingan lain.",
    "principle": "Penggunaan data murid harus memiliki dasar yang sah, tujuan jelas, dan perlindungan yang memadai sebelum data dipakai.",
    "reasoning": "Periksa kebutuhan persetujuan, tujuan penggunaan, minimisasi data, dan perlindungan sebelum mengizinkan publikasi.",
    "h1": "Identitas nama tidak ditampilkan, tetapi data pribadi tetap akan digunakan.",
    "h2": "Anonimisasi tidak otomatis menghapus kebutuhan dasar hukum atau persetujuan.",
    "h3": "Bandingkan menghapus nama dengan memperoleh dasar penggunaan yang benar.",
    "h4": "Privasi dinilai dari keseluruhan penggunaan data, bukan hanya apakah nama terlihat.",
    "transfer": "Guru ingin menggunakan foto dan data karya murid untuk publikasi ilmiah tanpa identitas nama. Apa yang harus diperiksa sebelum penggunaan data diizinkan?",
    "db": {
      "E": 3,
      "B": 1,
      "D": 5,
      "C": 4,
      "A": 2
    }
  },
  "2012": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "D",
      "E",
      "B",
      "A"
    ],
    "mc": "MC09",
    "misconception": "Keselamatan, inklusi, akses, atau keamanan psikologis kurang diprioritaskan.",
    "principle": "Inklusi yang aman membutuhkan asesmen risiko individual dan reasonable adjustment, bukan pelarangan otomatis.",
    "reasoning": "Nilai risiko spesifik, susun dukungan dan mitigasi, lalu putuskan partisipasi berdasarkan kemampuan mengendalikan risiko.",
    "h1": "Sekolah belum berpengalaman, tetapi orang tua bersedia memberi informasi kebutuhan dukungan.",
    "h2": "Belum berpengalaman bukan bukti bahwa partisipasi tidak mungkin aman.",
    "h3": "Bandingkan melarang demi keselamatan dengan mengikutsertakan sambil menyerahkan seluruh tanggung jawab pada orang tua.",
    "h4": "Prinsip inklusi menuntut risiko dikelola secara individual sejauh wajar tanpa mengurangi hak partisipasi secara otomatis.",
    "transfer": "Murid dengan kebutuhan akses tertentu ingin mengikuti kegiatan luar sekolah yang berisiko sedang. Bagaimana sekolah menentukan apakah partisipasi dapat dilakukan?",
    "db": {
      "C": 1,
      "B": 2,
      "E": 5,
      "D": 4,
      "A": 3
    }
  },
  "2013": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "B",
      "A",
      "D",
      "E"
    ],
    "mc": "MC09",
    "misconception": "Keselamatan, inklusi, akses, atau keamanan psikologis kurang diprioritaskan.",
    "principle": "Perlindungan awal dan pengamanan bukti dapat dilakukan tanpa menetapkan kesalahan sebelum investigasi selesai.",
    "reasoning": "Kurangi risiko lanjutan, lindungi pelapor, amankan bukti, lalu lakukan pemeriksaan prosedural.",
    "h1": "Bukti belum lengkap tetapi ada indikasi ancaman.",
    "h2": "Menunggu kepastian penuh dapat membiarkan risiko berlanjut.",
    "h3": "Bandingkan sanksi sementara dengan tidak melakukan tindakan apa pun.",
    "h4": "Safety first tidak sama dengan premature judgment; perlindungan dan penetapan kesalahan adalah dua keputusan berbeda.",
    "transfer": "Murid melaporkan ancaman digital tetapi bukti belum lengkap. Tindakan apa yang dapat dilakukan sebelum kesalahan pihak lain terbukti?",
    "db": {
      "C": 3,
      "A": 4,
      "B": 5,
      "D": 2,
      "E": 1
    }
  },
  "2014": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "B",
      "D",
      "A",
      "E"
    ],
    "mc": "MC04",
    "misconception": "Integritas atau pertimbangan etika dikalahkan kepentingan lain.",
    "principle": "Akuntabilitas pimpinan berarti mengakui kontribusi keputusan terhadap kegagalan dan mengubah mekanisme agar organisasi belajar.",
    "reasoning": "Buka evaluasi berbasis bukti yang juga menilai keputusan kepala sekolah, lalu perbaiki proses keputusan.",
    "h1": "Tidak ada pelanggaran aturan, tetapi keputusan kepala sekolah berkontribusi pada kegagalan.",
    "h2": "Menjaga citra dengan menyembunyikan kesalahan menghambat pembelajaran organisasi.",
    "h3": "Bandingkan menyalahkan banyak faktor dengan mengganti ketua panitia.",
    "h4": "Akuntabilitas bukan mencari kambing hitam; ia menghubungkan tanggung jawab, bukti, dan perbaikan sistem.",
    "transfer": "Sebuah keputusan kepala sekolah ternyata menyebabkan kegagalan program. Bagaimana akuntabilitas pimpinan dapat menghasilkan pembelajaran organisasi, bukan sekadar pengakuan kesalahan?",
    "db": {
      "E": 2,
      "B": 4,
      "D": 5,
      "C": 3,
      "A": 1
    }
  },
  "2015": {
    "target_key": "A",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "B",
      "D"
    ],
    "mc": "MC05",
    "misconception": "Terlalu direktif dan kurang memberdayakan orang lain.",
    "principle": "Tim yang kuat menggunakan peran komplementer sehingga keahlian teknis dan kemampuan memberdayakan orang lain sama-sama terpakai.",
    "reasoning": "Pisahkan fungsi teknis, fasilitasi, dan pengembangan kapasitas dengan tanggung jawab yang eksplisit.",
    "h1": "Guru paling ahli teknologi bukan otomatis fasilitator terbaik.",
    "h2": "Tujuan tim mencakup produk digital dan peningkatan kemampuan warga sekolah.",
    "h3": "Bandingkan memilih ahli teknis sebagai ketua tunggal dengan memilih fasilitator tanpa peran teknis yang jelas.",
    "h4": "Leadership design mengikuti kebutuhan fungsi, bukan status atau satu kompetensi dominan.",
    "transfer": "Satu guru sangat ahli secara teknis tetapi kurang mampu mendampingi orang lain, sementara guru lain memiliki kemampuan fasilitasi kuat. Bagaimana menyusun peran agar organisasi memperoleh kedua kekuatan tersebut?",
    "db": {
      "E": 3,
      "B": 2,
      "A": 5,
      "C": 1,
      "D": 4
    }
  },
  "2016": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "A",
      "E",
      "B",
      "D"
    ],
    "mc": "MC06",
    "misconception": "Komunikasi satu arah atau dialog tidak berbasis bukti dan kepemilikan.",
    "principle": "Penerimaan kebijakan dibangun melalui dialog yang menggabungkan bukti, pengalaman stakeholder, tujuan, dan indikator evaluasi.",
    "reasoning": "Akui pengalaman orang tua, hadirkan bukti sekolah, jelaskan tujuan, dan sepakati bagaimana perubahan akan dinilai.",
    "h1": "Nilai tinggi pada sistem lama tidak otomatis membuktikan beban tugas optimal.",
    "h2": "Konflik muncul antara pengalaman orang tua dan bukti kebutuhan belajar.",
    "h3": "Bandingkan menerapkan kebijakan sepihak dengan menundanya sampai semua orang setuju.",
    "h4": "Dialog berbasis bukti tidak berarti menyerahkan keputusan pada popularitas; ia membuat alasan dan evaluasi terbuka.",
    "transfer": "Orang tua menolak perubahan asesmen karena sistem lama menghasilkan nilai tinggi. Bukti dan pengalaman siapa saja yang perlu masuk dalam dialog sebelum perubahan dievaluasi?",
    "db": {
      "E": 4,
      "B": 2,
      "C": 5,
      "D": 1,
      "A": 3
    }
  },
  "2017": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "B",
      "E",
      "A",
      "D"
    ],
    "mc": "MC01",
    "misconception": "Mengambil tindakan sebelum diagnosis masalah cukup kuat.",
    "principle": "Hambatan partisipasi yang berbeda memerlukan segmentasi kebutuhan sebelum memilih kanal atau intervensi.",
    "reasoning": "Kelompokkan penyebab rendahnya partisipasi dan siapkan beberapa jalur keterlibatan sesuai hambatan.",
    "h1": "Orang tua tidak hadir karena alasan yang tidak sama.",
    "h2": "Satu solusi teknis tidak akan mengatasi hambatan waktu, pemahaman, dan keyakinan sekaligus.",
    "h3": "Bandingkan aplikasi baru dengan pertemuan akhir pekan.",
    "h4": "Diagnosis yang baik memetakan variasi hambatan sebelum menentukan portofolio solusi.",
    "transfer": "Partisipasi keluarga rendah karena alasan yang berbeda-beda. Mengapa satu kanal komunikasi baru belum tentu menjadi solusi terbaik?",
    "db": {
      "C": 2,
      "A": 4,
      "D": 5,
      "E": 1,
      "B": 3
    }
  },
  "2018": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "D",
      "B"
    ],
    "mc": "MC06",
    "misconception": "Komunikasi satu arah atau dialog tidak berbasis bukti dan kepemilikan.",
    "principle": "Partisipasi tetap bermakna ketika batas keputusan dijelaskan dan stakeholder diberi pengaruh nyata pada ruang yang masih terbuka.",
    "reasoning": "Pisahkan aspek non-negotiable dari aspek implementasi yang dapat dirancang bersama guru.",
    "h1": "Kebijakan dasar tidak dapat diubah.",
    "h2": "Pelibatan bukan berarti semua hal harus bisa dinegosiasikan.",
    "h3": "Bandingkan membuka seluruh kebijakan kembali dengan hanya memberi sosialisasi.",
    "h4": "Meaningful participation membutuhkan kejelasan batas dan pengaruh nyata pada keputusan yang memang masih dapat diubah.",
    "transfer": "Sebuah kebijakan pusat tidak dapat diubah, tetapi guru meminta dilibatkan. Pada bagian mana partisipasi guru masih dapat dibuat bermakna?",
    "db": {
      "D": 3,
      "A": 1,
      "B": 5,
      "E": 2,
      "C": 4
    }
  },
  "2019": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "E",
      "D",
      "B",
      "A"
    ],
    "mc": "MC01",
    "misconception": "Mengambil tindakan sebelum diagnosis masalah cukup kuat.",
    "principle": "Konflik berulang perlu ditangani pada perilaku relasional dan struktur kerja yang memicunya.",
    "reasoning": "Perbaiki peran, koordinasi, dan sumber konflik sambil menangani perilaku yang merusak.",
    "h1": "Keluhan kedua kelompok sebagian valid dan sumber awalnya terkait pembagian peran.",
    "h2": "Perdamaian personal tanpa perubahan struktur membuat konflik mudah muncul kembali.",
    "h3": "Bandingkan memisahkan kelompok dengan kegiatan kebersamaan.",
    "h4": "Resolusi konflik yang berkelanjutan menyentuh hubungan dan sistem yang memproduksi konflik.",
    "transfer": "Konflik dua kelompok pegawai berulang meski mereka sudah berdamai. Apa yang perlu diperiksa pada struktur kerja selain hubungan personal?",
    "db": {
      "B": 1,
      "A": 2,
      "D": 5,
      "E": 3,
      "C": 4
    }
  },
  "2020": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "E",
      "B",
      "D",
      "A"
    ],
    "mc": "MC04",
    "misconception": "Integritas atau pertimbangan etika dikalahkan kepentingan lain.",
    "principle": "Transparansi harus proporsional: proses dapat dijelaskan tanpa membuka informasi yang belum terverifikasi atau melanggar kerahasiaan.",
    "reasoning": "Komunikasikan apa yang dapat dibuka tentang proses, perlindungan, dan tahapan pemeriksaan tanpa mengadili pihak di ruang publik.",
    "h1": "Informasi sudah bocor sebelum pemeriksaan selesai.",
    "h2": "Diam total dan membuka semua fakta sama-sama memiliki risiko kepercayaan dan keadilan.",
    "h3": "Bandingkan membuka semua informasi dengan menolak seluruh komunikasi.",
    "h4": "Transparansi yang etis menjelaskan proses dan akuntabilitas tanpa mengorbankan due process serta privasi.",
    "transfer": "Informasi dugaan pelanggaran sudah tersebar di masyarakat sebelum pemeriksaan selesai. Bagaimana sekolah tetap transparan tanpa merusak asas kerahasiaan dan keadilan?",
    "db": {
      "D": 1,
      "A": 3,
      "C": 5,
      "B": 2,
      "E": 4
    }
  },
  "2021": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "E",
      "D",
      "A",
      "B"
    ],
    "mc": "MC12",
    "misconception": "Sumber daya dialokasikan tanpa kriteria kebutuhan, dampak, risiko, dan keberlanjutan.",
    "principle": "Efisiensi jangka pendek tidak boleh menciptakan overload dan ketergantungan; kapasitas harus didistribusikan dan dikembangkan.",
    "reasoning": "Atur ulang beban berdasarkan kompetensi dan kapasitas sambil menyiapkan transfer kemampuan kepada guru lain.",
    "h1": "Tugas cepat selesai tetapi organisasi mulai bergantung pada beberapa orang.",
    "h2": "Masalahnya bukan hanya pemerataan, tetapi resilience dan sustainability.",
    "h3": "Bandingkan mempertahankan pola sekarang dengan membagi tugas sama rata.",
    "h4": "Manajemen kapasitas menyeimbangkan kualitas saat ini dengan pengembangan kemampuan organisasi untuk masa depan.",
    "transfer": "Pegawai terbaik terus diberi tanggung jawab lebih banyak karena hasilnya cepat. Mengapa strategi ini dapat merusak kapasitas organisasi dalam jangka panjang?",
    "db": {
      "C": 2,
      "D": 1,
      "E": 5,
      "B": 3,
      "A": 4
    }
  },
  "2022": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "B",
      "D"
    ],
    "mc": "MC05",
    "misconception": "Terlalu direktif dan kurang memberdayakan orang lain.",
    "principle": "Eksekusi tim memerlukan keputusan yang memiliki owner, kewenangan, tenggat, indikator selesai, dan mekanisme tindak lanjut.",
    "reasoning": "Perjelas siapa melakukan apa, sampai kapan, dengan kewenangan apa, dan bukti apa yang menandai pekerjaan selesai.",
    "h1": "Rapat dan notulen sudah banyak, tetapi eksekusi tidak konsisten.",
    "h2": "Masalahnya lebih dekat pada accountability design daripada jumlah koordinasi.",
    "h3": "Bandingkan menambah rapat dengan mengganti anggota yang terlambat.",
    "h4": "Koordinasi efektif menghasilkan ownership dan closure, bukan hanya komunikasi.",
    "transfer": "Tim memiliki banyak rapat dan notulen lengkap tetapi pekerjaan sering tidak selesai. Elemen struktur kerja apa yang harus diperiksa?",
    "db": {
      "C": 3,
      "E": 2,
      "D": 5,
      "A": 1,
      "B": 4
    }
  },
  "2023": {
    "target_key": "A",
    "semantic_rank": [
      "C",
      "E",
      "B",
      "A",
      "D"
    ],
    "mc": "MC15",
    "misconception": "Aktivitas atau keterlaksanaan dianggap cukup tanpa menilai dampak.",
    "principle": "Komunitas belajar berdampak ketika pengetahuan masuk ke siklus uji praktik, bukti hasil, dan refleksi.",
    "reasoning": "Geser dari berbagi materi ke masalah kelas, percobaan praktik, observasi hasil, dan perbaikan.",
    "h1": "Guru memperoleh banyak ide tetapi praktik tidak berubah.",
    "h2": "Ada gap antara consumption of knowledge dan application.",
    "h3": "Bandingkan menambah narasumber dengan mengurangi frekuensi pertemuan.",
    "h4": "Professional learning dinilai dari transfer ke praktik dan pembelajaran, bukan volume materi.",
    "transfer": "Komunitas belajar menghasilkan banyak materi dan ide, tetapi praktik guru tidak berubah. Apa yang harus terjadi setelah proses berbagi pengetahuan?",
    "db": {
      "B": 2,
      "E": 3,
      "A": 5,
      "C": 1,
      "D": 4
    }
  },
  "2024": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "E",
      "B",
      "A",
      "D"
    ],
    "mc": "MC07",
    "misconception": "Program atau keputusan tidak cukup terhubung dengan visi/tujuan.",
    "principle": "Kinerja unit harus ditelusuri kontribusinya terhadap sasaran strategis, bukan hanya indikator lokal.",
    "reasoning": "Uji hubungan logis antara aktivitas, indikator antara, kontribusi lintas program, dan outcome sekolah.",
    "h1": "Setiap bidang mencapai indikatornya tetapi sasaran utama tidak bergerak.",
    "h2": "Indikator lokal mungkin tidak mewakili kontribusi terhadap outcome.",
    "h3": "Bandingkan mempertahankan semua program sukses dengan mengurangi program terendah.",
    "h4": "Strategic alignment menilai kontribusi terhadap tujuan bersama, bukan sekadar performa silo.",
    "transfer": "Setiap unit mencapai indikatornya, tetapi tujuan strategis organisasi tidak bergerak. Apa yang perlu diuji pada hubungan indikator dan hasil?",
    "db": {
      "B": 2,
      "A": 3,
      "D": 5,
      "C": 1,
      "E": 4
    }
  },
  "2025": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "E",
      "D",
      "B",
      "A"
    ],
    "mc": "MC14",
    "misconception": "Kolaborasi/kemitraan berhenti pada kegiatan, bukan penerapan dan hasil.",
    "principle": "Praktik baik perlu dipahami mekanisme keberhasilannya, diuji kesesuaiannya dengan konteks, lalu diadaptasi dan dievaluasi.",
    "reasoning": "Identifikasi komponen inti dan kondisi pendukung sebelum replikasi.",
    "h1": "Sekolah rujukan memiliki karakteristik dan dukungan yang berbeda.",
    "h2": "Keberhasilan di satu konteks tidak otomatis membuktikan efektivitas di konteks lain.",
    "h3": "Bandingkan menyalin program dengan mengambil bagian yang mudah saja.",
    "h4": "Transfer praktik memerlukan fidelity pada mekanisme inti dan adaptation pada konteks.",
    "transfer": "Sebuah sekolah ingin mengadopsi program sekolah unggul dengan karakteristik murid berbeda. Apa yang harus dipahami sebelum program diadaptasi?",
    "db": {
      "E": 1,
      "D": 2,
      "B": 5,
      "C": 3,
      "A": 4
    }
  },
  "2026": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "B",
      "D"
    ],
    "mc": "MC14",
    "misconception": "Kolaborasi/kemitraan berhenti pada kegiatan, bukan penerapan dan hasil.",
    "principle": "Jejaring belajar kuat ketika setiap anggota membawa data, masalah, hipotesis, dan kontribusi pada pembelajaran bersama.",
    "reasoning": "Gunakan masalah nyata masing-masing sekolah sebagai objek analisis dan pengujian kolektif.",
    "h1": "Sekolah capaian rendah hanya menjadi penerima informasi.",
    "h2": "Asimetri peran menghambat agency dan learning reciprocity.",
    "h3": "Bandingkan mentoring satu arah dengan kompetisi antarsekolah.",
    "h4": "Networked learning bersifat reciprocal: semua anggota menjadi sumber data, pembelajar, dan penguji praktik.",
    "transfer": "Dalam jejaring sekolah, sekolah unggul selalu menjadi narasumber dan sekolah lain hanya mendengar. Mengapa pola ini belum mencerminkan jejaring belajar yang kuat?",
    "db": {
      "D": 3,
      "E": 2,
      "C": 5,
      "A": 1,
      "B": 4
    }
  },
  "2027": {
    "target_key": "A",
    "semantic_rank": [
      "C",
      "A",
      "D",
      "E",
      "B"
    ],
    "mc": "MC14",
    "misconception": "Kolaborasi/kemitraan berhenti pada kegiatan, bukan penerapan dan hasil.",
    "principle": "Efektivitas praktik harus dibedakan dari fidelity implementasi dan variasi konteks.",
    "reasoning": "Bandingkan bagaimana strategi diterapkan, pada siapa, dalam kondisi apa, dan hasil apa yang muncul.",
    "h1": "Strategi berhasil pada pencetus tetapi hasil berbeda pada tiga guru lain.",
    "h2": "Perbedaan hasil dapat berasal dari konteks atau implementasi, bukan semata kualitas strategi.",
    "h3": "Bandingkan prosedur lebih ketat dengan menghentikan perluasan.",
    "h4": "Evaluasi transfer praktik membutuhkan analisis implementation fidelity dan heterogeneous effects.",
    "transfer": "Strategi seorang guru berhasil tetapi hasilnya tidak konsisten ketika digunakan guru lain. Apa yang perlu dibandingkan sebelum menyimpulkan strateginya efektif atau gagal?",
    "db": {
      "D": 4,
      "C": 1,
      "A": 5,
      "E": 3,
      "B": 2
    }
  },
  "2028": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "E",
      "B",
      "A",
      "D"
    ],
    "mc": "MC14",
    "misconception": "Kolaborasi/kemitraan berhenti pada kegiatan, bukan penerapan dan hasil.",
    "principle": "Diseminasi yang bertanggung jawab menyajikan hasil, proses, keterbatasan, risiko, dan syarat adaptasi secara proporsional.",
    "reasoning": "Berikan informasi yang membantu pihak lain menilai apakah dan bagaimana inovasi dapat digunakan di konteksnya.",
    "h1": "Tim komunikasi ingin hanya menampilkan keberhasilan.",
    "h2": "Citra positif tanpa keterbatasan dapat menghasilkan adopsi yang keliru.",
    "h3": "Bandingkan hanya menonjolkan hasil dengan membuka seluruh detail internal tanpa seleksi.",
    "h4": "Knowledge sharing yang baik cukup transparan untuk mendukung keputusan adaptasi, bukan sekadar promosi.",
    "transfer": "Sekolah ingin menyebarluaskan inovasi. Mengapa keterbatasan dan kondisi keberhasilan perlu dipublikasikan bersama hasil positifnya?",
    "db": {
      "B": 2,
      "A": 3,
      "E": 5,
      "C": 1,
      "D": 4
    }
  },
  "2029": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "D",
      "A",
      "B",
      "E"
    ],
    "mc": "MC07",
    "misconception": "Program atau keputusan tidak cukup terhubung dengan visi/tujuan.",
    "principle": "Visi hidup bila memengaruhi distribusi agency, desain kegiatan, keputusan, dan indikator perilaku nyata.",
    "reasoning": "Nilai apakah praktik memberi murid kesempatan mengambil keputusan dan tanggung jawab sesuai visi.",
    "h1": "Program sukses secara administratif tetapi sebagian besar dikendalikan guru.",
    "h2": "Kegiatan bertema kemandirian belum tentu menghasilkan kemandirian.",
    "h3": "Bandingkan menambah satu program kepemimpinan murid dengan mengukur kepuasan orang tua.",
    "h4": "Alignment dinilai dari mekanisme praktik yang mewujudkan visi, bukan label kegiatan.",
    "transfer": "Visi organisasi menekankan kemandirian, tetapi hampir seluruh kegiatan dirancang dan dikendalikan pimpinan. Bukti apa yang menunjukkan bahwa visi benar-benar hadir dalam praktik?",
    "db": {
      "C": 3,
      "D": 2,
      "B": 5,
      "A": 4,
      "E": 1
    }
  },
  "2030": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "E",
      "B",
      "A",
      "D"
    ],
    "mc": "MC16",
    "misconception": "Solusi kurang adaptif, tidak belajar dari bukti/kegagalan, atau tidak berkelanjutan.",
    "principle": "Budaya inovasi membutuhkan eksperimen terdisiplin: hipotesis, uji kecil, bukti, refleksi, dan keputusan lanjut/henti/perbaiki.",
    "reasoning": "Bangun siklus yang membuat kegagalan menghasilkan informasi dan keberhasilan dapat diuji.",
    "h1": "Banyak inovasi dicoba tetapi dampaknya tidak terdokumentasi.",
    "h2": "Tanpa evidence loop, banyak eksperimen belum tentu berarti organisasi belajar.",
    "h3": "Bandingkan membatasi inovasi pada praktik terbukti dengan mewajibkan satu inovasi per guru.",
    "h4": "Innovation culture bukan jumlah ide, tetapi kemampuan belajar cepat dan bertanggung jawab dari eksperimen.",
    "transfer": "Banyak inovasi dicoba tetapi tidak ada catatan mengenai dampaknya. Bagaimana membedakan budaya inovasi dari budaya sekadar mencoba hal baru?",
    "db": {
      "E": 2,
      "C": 3,
      "D": 5,
      "A": 1,
      "B": 4
    }
  },
  "2031": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "B",
      "D"
    ],
    "mc": "MC07",
    "misconception": "Program atau keputusan tidak cukup terhubung dengan visi/tujuan.",
    "principle": "Perubahan konteks perlu diuji apakah mengubah arah fundamental atau hanya strategi untuk mencapai arah tersebut.",
    "reasoning": "Tinjau relevansi tujuan inti sebelum memutuskan revisi visi.",
    "h1": "Kebutuhan baru muncul setelah perubahan murid dan teknologi.",
    "h2": "Tidak setiap perubahan konteks memerlukan visi baru.",
    "h3": "Bandingkan mempertahankan visi apa adanya dengan mengganti visi mengikuti tren.",
    "h4": "Strategic continuity membedakan purpose yang relatif stabil dari strategy yang adaptif.",
    "transfer": "Kondisi sekolah berubah cepat setelah visi ditetapkan. Bagaimana menentukan apakah yang perlu diubah adalah visi atau strategi pencapaiannya?",
    "db": {
      "D": 3,
      "A": 2,
      "E": 5,
      "B": 1,
      "C": 4
    }
  },
  "2032": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "D",
      "B"
    ],
    "mc": "MC16",
    "misconception": "Solusi kurang adaptif, tidak belajar dari bukti/kegagalan, atau tidak berkelanjutan.",
    "principle": "Literasi modern menilai kualitas sumber dan pemaknaan lintas format, bukan memilih digital atau cetak secara biner.",
    "reasoning": "Integrasikan media sambil mengajarkan evaluasi kredibilitas dan kedalaman pemahaman.",
    "h1": "Aktivitas membaca digital naik tetapi evaluasi kualitas sumber rendah.",
    "h2": "Menambah durasi membaca belum menyelesaikan kemampuan menilai sumber.",
    "h3": "Bandingkan memperbanyak digital dengan kembali dominan ke cetak.",
    "h4": "Media adalah sarana; kompetensi literasi mencakup evaluasi sumber, pemahaman, dan transfer.",
    "transfer": "Aktivitas membaca digital meningkat tetapi kemampuan menilai kredibilitas sumber rendah. Apa yang harus menjadi sasaran intervensi selain jumlah membaca?",
    "db": {
      "A": 3,
      "D": 1,
      "C": 5,
      "B": 2,
      "E": 4
    }
  },
  "2033": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "E",
      "D",
      "A",
      "B"
    ],
    "mc": "MC07",
    "misconception": "Program atau keputusan tidak cukup terhubung dengan visi/tujuan.",
    "principle": "Portofolio kegiatan dinilai berdasarkan kontribusi strategis, biaya, manfaat, risiko, dan nilai budaya.",
    "reasoning": "Evaluasi tiap kegiatan lalu susun ulang portofolio secara bertahap agar sumber daya mengikuti prioritas.",
    "h1": "Kegiatan populer belum tentu berkontribusi pada sasaran prioritas.",
    "h2": "Menghapus tradisi otomatis maupun mempertahankannya otomatis sama-sama mengabaikan trade-off.",
    "h3": "Bandingkan menghentikan kegiatan nonakademik dengan menambah program baru tanpa mengurangi yang lama.",
    "h4": "Portfolio management menilai value relatif dan opportunity cost setiap program.",
    "transfer": "Program tradisional sangat populer tetapi tidak jelas kontribusinya pada tujuan sekolah. Bagaimana mengevaluasinya tanpa otomatis menghapus tradisi?",
    "db": {
      "C": 2,
      "E": 1,
      "D": 5,
      "B": 3,
      "A": 4
    }
  },
  "2034": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "B",
      "A",
      "E",
      "D"
    ],
    "mc": "MC12",
    "misconception": "Sumber daya dialokasikan tanpa kriteria kebutuhan, dampak, risiko, dan keberlanjutan.",
    "principle": "Investasi dipilih dengan menimbang kebutuhan, kualitas bukti, potensi dampak, risiko, kelayakan, dan opsi eksperimen.",
    "reasoning": "Jangan mereduksi keputusan pada potensi tertinggi atau risiko terendah; gunakan keputusan berjenjang bila ketidakpastian tinggi.",
    "h1": "Program A berpotensi besar tetapi bukti minim; B lebih pasti tetapi dampak sedang.",
    "h2": "Dilema utamanya adalah risk-return under uncertainty.",
    "h3": "Bandingkan memilih A karena potensi dengan B karena aman.",
    "h4": "Strategic investment mempertimbangkan expected value, uncertainty, reversibility, dan learning value.",
    "transfer": "Pilihan A berisiko tinggi tetapi berpotensi berdampak besar, sedangkan B memiliki bukti sedang dan risiko kecil. Faktor apa yang harus dibandingkan sebelum memilih investasi?",
    "db": {
      "D": 3,
      "C": 4,
      "B": 5,
      "A": 1,
      "E": 2
    }
  },
  "2035": {
    "target_key": "A",
    "semantic_rank": [
      "C",
      "D",
      "E",
      "A",
      "B"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Analisis data harus memisahkan fakta, interpretasi, hipotesis alternatif, dan bukti yang dibutuhkan untuk menguji hipotesis.",
    "reasoning": "Gunakan protokol yang memaksa tim mencari bukti yang dapat mendukung maupun membantah interpretasi awal.",
    "h1": "Guru cenderung memilih data yang mendukung pendapat mereka.",
    "h2": "Masalahnya adalah confirmation bias, bukan kekurangan data semata.",
    "h3": "Bandingkan satu indikator standar dengan menyerahkan interpretasi pada kepala sekolah.",
    "h4": "Evidence reasoning yang kuat mencari disconfirming evidence dan alternative explanations.",
    "transfer": "Guru hanya memilih data yang mendukung pendapatnya dalam rapat evaluasi. Bagaimana proses analisis dapat mengurangi confirmation bias?",
    "db": {
      "B": 2,
      "C": 1,
      "A": 5,
      "D": 4,
      "E": 3
    }
  },
  "2036": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "E",
      "D",
      "A",
      "B"
    ],
    "mc": "MC16",
    "misconception": "Solusi kurang adaptif, tidak belajar dari bukti/kegagalan, atau tidak berkelanjutan.",
    "principle": "Kegagalan program dapat diurai pada komponen sehingga bagian yang bekerja dipertahankan dan bagian yang gagal didesain ulang.",
    "reasoning": "Identifikasi mekanisme, bukti per komponen, lalu lakukan iterasi terukur.",
    "h1": "Hasil keseluruhan gagal tetapi beberapa komponen bekerja.",
    "h2": "Keputusan biner lanjut/henti membuang informasi yang berguna.",
    "h3": "Bandingkan mengulang tanpa perubahan dengan menghentikan seluruh program.",
    "h4": "Adaptive management menggunakan failure decomposition untuk menentukan apa yang dipertahankan, diubah, atau dihentikan.",
    "transfer": "Sebuah inovasi gagal secara keseluruhan tetapi beberapa komponennya menunjukkan hasil positif. Mengapa keputusan tidak harus hanya “lanjut” atau “hentikan”?",
    "db": {
      "B": 2,
      "D": 1,
      "C": 5,
      "A": 3,
      "E": 4
    }
  },
  "2037": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "E",
      "A",
      "B",
      "D"
    ],
    "mc": "MC15",
    "misconception": "Aktivitas atau keterlaksanaan dianggap cukup tanpa menilai dampak.",
    "principle": "Program overload perlu dianalisis melalui masalah sasaran, theory of change, tumpang tindih, beban implementasi, dan hasil.",
    "reasoning": "Petakan program sebagai portofolio untuk menentukan redundansi dan kontribusi marginal.",
    "h1": "Beberapa program menargetkan masalah hampir sama dan guru mulai lelah.",
    "h2": "Banyak program dapat saling menduplikasi atau mengganggu implementasi.",
    "h3": "Bandingkan menghentikan dua program terendah dengan mengurangi frekuensi semua program.",
    "h4": "Program portfolio optimization menilai contribution, overlap, implementation burden, dan outcome.",
    "transfer": "Beberapa program ternyata menargetkan masalah yang sama dan membebani guru. Apa yang harus dipetakan sebelum program digabung atau dihentikan?",
    "db": {
      "B": 3,
      "C": 2,
      "E": 5,
      "D": 1,
      "A": 4
    }
  },
  "2038": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "E",
      "B",
      "A",
      "D"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Data agregat pemanfaatan fasilitas harus dilengkapi pola waktu, peak demand, fungsi, dan alternatif pengelolaan.",
    "reasoning": "Analisis distribusi penggunaan sebelum menyimpulkan kapasitas cukup atau kurang.",
    "h1": "Utilisasi hanya 35%, tetapi keluhan benturan jadwal sering terjadi.",
    "h2": "Rata-rata rendah dapat menyembunyikan peak congestion.",
    "h3": "Bandingkan kesimpulan 'tidak butuh ruang' dengan langsung membangun ruang baru.",
    "h4": "Capacity planning memerlukan temporal distribution dan demand pattern, bukan angka agregat semata.",
    "transfer": "Tingkat penggunaan sebuah ruang hanya 35%, tetapi guru sering mengalami benturan jadwal. Mengapa angka penggunaan rata-rata belum cukup menentukan kebutuhan ruang baru?",
    "db": {
      "E": 2,
      "D": 3,
      "B": 5,
      "A": 1,
      "C": 4
    }
  },
  "2039": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "B",
      "D",
      "A",
      "E"
    ],
    "mc": "MC09",
    "misconception": "Keselamatan, inklusi, akses, atau keamanan psikologis kurang diprioritaskan.",
    "principle": "Psychological safety membutuhkan struktur dan perilaku pimpinan yang memungkinkan ketidaksetujuan tanpa takut dinilai.",
    "reasoning": "Ubah peran pimpinan menjadi fasilitatif dan desain ruang diskusi yang aman.",
    "h1": "Guru hadir tetapi takut berbeda pendapat ketika pimpinan hadir.",
    "h2": "Masalah bukan sekadar partisipasi, tetapi perceived interpersonal risk.",
    "h3": "Bandingkan mewajibkan semua bicara dengan membuat kepala sekolah tidak pernah hadir.",
    "h4": "Psychological safety lahir dari norma, struktur, dan respons pimpinan terhadap perbedaan pendapat.",
    "transfer": "Kehadiran guru dalam komunitas tinggi, tetapi mereka takut berbeda pendapat ketika pimpinan hadir. Apa perubahan kepemimpinan yang diperlukan untuk meningkatkan psychological safety?",
    "db": {
      "A": 2,
      "C": 4,
      "E": 5,
      "D": 3,
      "B": 1
    }
  },
  "2040": {
    "target_key": "A",
    "semantic_rank": [
      "C",
      "A",
      "B",
      "D",
      "E"
    ],
    "mc": "MC11",
    "misconception": "Pengembangan kompetensi dipilih sebelum kebutuhan dipastikan atau tanpa transfer ke praktik.",
    "principle": "Teknologi dipelajari sebagai alat untuk kebutuhan pedagogis prioritas, bukan sebagai topik terpisah dari kualitas pembelajaran.",
    "reasoning": "Hubungkan AI dengan asesmen atau masalah pembelajaran nyata dan ukur perubahan praktik.",
    "h1": "Permintaan guru adalah AI, tetapi masalah terbesar ada pada asesmen.",
    "h2": "Pelatihan populer dapat mempercepat praktik yang belum baik.",
    "h3": "Bandingkan menunda AI sepenuhnya dengan mengikuti permintaan guru sepenuhnya.",
    "h4": "Technology integration harus problem-driven dan pedagogically grounded.",
    "transfer": "Guru meminta pelatihan AI sementara masalah utama berada pada asesmen. Bagaimana AI tetap dapat dipelajari tanpa mengabaikan kebutuhan pedagogis utama?",
    "db": {
      "E": 4,
      "B": 3,
      "A": 5,
      "C": 2,
      "D": 1
    }
  },
  "2041": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "D",
      "B",
      "A",
      "E"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Outcome agregat harus dibaca bersama distribusi dampak untuk menilai equity dan siapa yang memperoleh manfaat.",
    "reasoning": "Analisis perubahan per kelompok sebelum menyimpulkan efektivitas program.",
    "h1": "Rata-rata naik tetapi kesenjangan melebar.",
    "h2": "Program dapat meningkatkan average outcome sekaligus gagal pada equity.",
    "h3": "Bandingkan 'berhasil karena rata-rata naik' dengan 'gagal karena gap melebar'.",
    "h4": "Program evaluation perlu menilai magnitude dan distribution of effects.",
    "transfer": "Rata-rata capaian sekolah meningkat tetapi kesenjangan antar kelompok murid melebar. Mengapa rata-rata tidak cukup untuk menyatakan program berhasil?",
    "db": {
      "D": 2,
      "B": 3,
      "C": 5,
      "A": 4,
      "E": 1
    }
  },
  "2042": {
    "target_key": "A",
    "semantic_rank": [
      "C",
      "B",
      "E",
      "A",
      "D"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Perubahan satu indikator perantara tidak membuktikan atau menyangkal hubungan kausal dengan outcome akhir.",
    "reasoning": "Periksa kualitas keterlibatan, proses pembelajaran, durasi, dan faktor penghubung antara kehadiran dan hasil.",
    "h1": "Kehadiran meningkat tetapi hasil belajar belum berubah.",
    "h2": "Kehadiran adalah kondisi perantara, bukan outcome pembelajaran itu sendiri.",
    "h3": "Bandingkan menghapus insentif dengan mempertahankannya hanya karena kehadiran naik.",
    "h4": "Causal reasoning menuntut mekanisme dan temporal sequence, bukan korelasi dua angka.",
    "transfer": "Kehadiran murid meningkat setelah intervensi tetapi hasil belajar tidak berubah. Bukti apa yang dibutuhkan sebelum menyimpulkan kehadiran tidak berpengaruh pada pembelajaran?",
    "db": {
      "E": 2,
      "C": 4,
      "A": 5,
      "B": 1,
      "D": 3
    }
  },
  "2043": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "D",
      "B",
      "A",
      "E"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Perbaikan agregat perlu diverifikasi dengan triangulasi dan subgroup analysis agar kelompok yang tertinggal tidak tersembunyi.",
    "reasoning": "Gabungkan survei, observasi, suara murid, dan distribusi partisipasi.",
    "h1": "Survei membaik tetapi sebagian kelas masih pasif.",
    "h2": "Average improvement dapat menutupi local persistence of problems.",
    "h3": "Bandingkan menutup program karena survei naik dengan fokus hanya pada kelas terendah.",
    "h4": "Triangulation dan disaggregation diperlukan untuk menilai apakah perubahan benar-benar meluas.",
    "transfer": "Survei iklim sekolah membaik tetapi partisipasi beberapa kelompok murid tetap rendah. Bagaimana menilai apakah peningkatan agregat benar-benar dialami semua murid?",
    "db": {
      "A": 2,
      "D": 3,
      "E": 5,
      "C": 4,
      "B": 1
    }
  },
  "2044": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "D",
      "A",
      "B",
      "E"
    ],
    "mc": "MC09",
    "misconception": "Keselamatan, inklusi, akses, atau keamanan psikologis kurang diprioritaskan.",
    "principle": "Variasi penyebab membutuhkan tiered support dan jalur rujukan, bukan satu intervensi universal.",
    "reasoning": "Kelompokkan kebutuhan berdasarkan pola dan tingkat risiko lalu pasangkan dengan dukungan yang sesuai.",
    "h1": "Kecemasan memiliki beberapa penyebab yang berbeda.",
    "h2": "Satu program umum mungkin hanya relevan bagi sebagian murid.",
    "h3": "Bandingkan memilih penyebab paling umum dengan membuat satu program untuk semua.",
    "h4": "Multi-tiered support menyesuaikan intensitas dan jenis intervensi dengan kebutuhan.",
    "transfer": "Kecemasan murid berasal dari penyebab yang sangat berbeda. Mengapa satu program kesejahteraan universal mungkin tidak cukup?",
    "db": {
      "A": 3,
      "B": 2,
      "D": 5,
      "E": 4,
      "C": 1
    }
  },
  "2045": {
    "target_key": "E",
    "semantic_rank": [
      "C",
      "B",
      "E",
      "A",
      "D"
    ],
    "mc": "MC09",
    "misconception": "Keselamatan, inklusi, akses, atau keamanan psikologis kurang diprioritaskan.",
    "principle": "Reasonable adjustment harus efektif bagi murid sekaligus dirancang agar feasible dan berkelanjutan bagi sistem.",
    "reasoning": "Pertahankan kebutuhan esensial sambil menyederhanakan proses, berbagi sumber, dan mengevaluasi beban implementasi.",
    "h1": "Penyesuaian berhasil tetapi menambah beban guru.",
    "h2": "Efektivitas tanpa sustainability dapat membuat akses tidak bertahan.",
    "h3": "Bandingkan mengurangi akses murid dengan mempertahankan prosedur yang membebani tanpa perbaikan.",
    "h4": "Inclusive design mencari solusi yang efektif dan sustainable, bukan memilih salah satu.",
    "transfer": "Penyesuaian pembelajaran berhasil membantu murid tetapi meningkatkan beban guru. Bagaimana menjaga akses murid sekaligus memastikan intervensi dapat dipertahankan?",
    "db": {
      "C": 2,
      "A": 4,
      "E": 5,
      "D": 1,
      "B": 3
    }
  },
  "2046": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "E",
      "B",
      "A",
      "D"
    ],
    "mc": "MC03",
    "misconception": "Kurang menjaga hak, kebutuhan, atau keberpihakan pada murid.",
    "principle": "Diferensiasi harus responsif terhadap kebutuhan yang berubah dan tidak mengubah dukungan sementara menjadi label permanen.",
    "reasoning": "Gunakan data kebutuhan berkala untuk memindahkan murid antar strategi secara fleksibel.",
    "h1": "Kelompok yang awalnya fleksibel mulai menjadi permanen.",
    "h2": "Efisiensi dapat berubah menjadi fixed expectation dan stigma.",
    "h3": "Bandingkan melarang semua grouping dengan sekadar mengganti nama kelompok.",
    "h4": "Flexible grouping dipandu kebutuhan terkini dan review berkala, bukan identitas kemampuan.",
    "transfer": "Pengelompokan awalnya fleksibel tetapi perlahan menjadi kelompok kemampuan permanen. Apa indikator bahwa diferensiasi telah berubah menjadi labeling?",
    "db": {
      "E": 2,
      "D": 3,
      "C": 5,
      "A": 1,
      "B": 4
    }
  },
  "2047": {
    "target_key": "A",
    "semantic_rank": [
      "A",
      "E",
      "D",
      "B",
      "C"
    ],
    "mc": "MC16",
    "misconception": "Solusi kurang adaptif, tidak belajar dari bukti/kegagalan, atau tidak berkelanjutan.",
    "principle": "Peluang inovasi sebaiknya diuji dengan pilot yang memiliki tujuan belajar, peran, indikator, dan keputusan scale-up.",
    "reasoning": "Gunakan aset dan dukungan mitra sebagai eksperimen terkendali sebelum investasi besar.",
    "h1": "Mitra siap membantu, tetapi kapasitas guru dan integrasi pembelajaran belum diketahui.",
    "h2": "Peluang yang menarik masih memiliki uncertainty implementation.",
    "h3": "Bandingkan membangun penuh sekarang dengan menunggu anggaran sendiri.",
    "h4": "Entrepreneurial leadership menguji peluang secara terukur sebelum scaling.",
    "transfer": "Sekolah memperoleh peluang menggunakan aset kosong bersama mitra masyarakat. Mengapa pilot kecil dengan indikator hasil dapat lebih kuat daripada langsung membangun program besar?",
    "db": {
      "A": 5,
      "B": 2,
      "C": 1,
      "E": 3,
      "D": 4
    }
  },
  "2048": {
    "target_key": "B",
    "semantic_rank": [
      "D",
      "E",
      "B",
      "A",
      "C"
    ],
    "mc": "MC04",
    "misconception": "Integritas atau pertimbangan etika dikalahkan kepentingan lain.",
    "principle": "Kemitraan komersial harus dinilai manfaat, konflik kepentingan, branding, lock-in, biaya lanjutan, dan exit mechanism.",
    "reasoning": "Lakukan due diligence sebelum menerima keuntungan jangka pendek.",
    "h1": "Perangkat gratis disertai ekspektasi menjadi pemasok utama.",
    "h2": "Gratis dapat menciptakan switching cost dan konflik kepentingan di masa depan.",
    "h3": "Bandingkan menerima langsung dengan menolak semua kerja sama komersial.",
    "h4": "Partnership governance menilai total obligation dan independence, bukan harga awal.",
    "transfer": "Perusahaan memberikan perangkat gratis tetapi berharap menjadi pemasok utama pada masa mendatang. Aspek apa yang perlu dinilai selain manfaat langsung dari perangkat?",
    "db": {
      "C": 2,
      "A": 3,
      "D": 1,
      "B": 5,
      "E": 4
    }
  },
  "2049": {
    "target_key": "C",
    "semantic_rank": [
      "B",
      "E",
      "A",
      "D",
      "C"
    ],
    "mc": "MC12",
    "misconception": "Sumber daya dialokasikan tanpa kriteria kebutuhan, dampak, risiko, dan keberlanjutan.",
    "principle": "Optimalisasi aset membutuhkan bukti demand, pengguna, value, biaya, dan eksperimen pemanfaatan sebelum investasi permanen.",
    "reasoning": "Uji penggunaan sementara dan kebutuhan nyata sebelum renovasi.",
    "h1": "Ruang jarang dipakai, tetapi studio belum memiliki pengguna dan tujuan yang terpetakan.",
    "h2": "Mengubah fungsi aset belum tentu meningkatkan utilisasi.",
    "h3": "Bandingkan renovasi segera dengan membiarkan ruang tetap kosong.",
    "h4": "Asset optimization dimulai dari demand dan value proposition, bukan sekadar availability.",
    "transfer": "Ruang jarang digunakan akan direnovasi menjadi studio kreatif. Bukti apa yang diperlukan agar renovasi bukan sekadar mengubah aset menganggur menjadi aset lain yang kurang digunakan?",
    "db": {
      "B": 3,
      "C": 5,
      "E": 1,
      "D": 2,
      "A": 4
    }
  },
  "2050": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "D",
      "B",
      "A",
      "E"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Scale-up inovasi memerlukan validasi dampak, keamanan data, maintainability, dan compatibility.",
    "reasoning": "Pisahkan korelasi hasil awal dari causal contribution aplikasi dan nilai risiko operasional.",
    "h1": "Kehadiran membaik, tetapi belum diketahui apakah aplikasi penyebabnya.",
    "h2": "Aplikasi juga menyimpan data pada akun pribadi guru.",
    "h3": "Bandingkan mewajibkan aplikasi dengan menghentikannya karena risiko data.",
    "h4": "Scaling membutuhkan evidence of value dan operational readiness.",
    "transfer": "Aplikasi buatan guru tampak meningkatkan kehadiran murid. Apa yang harus diuji sebelum sekolah memperluas aplikasi ke seluruh kelas?",
    "db": {
      "E": 2,
      "D": 3,
      "B": 5,
      "C": 4,
      "A": 1
    }
  },
  "2051": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "A",
      "D",
      "B",
      "E"
    ],
    "mc": "MC13",
    "misconception": "Akuntabilitas direduksi menjadi administrasi/keuangan, bukan tujuan belajar dan hasil.",
    "principle": "Projek kewirausahaan murid harus berakar pada tujuan belajar, etika, agency murid, dan akuntabilitas keuangan.",
    "reasoning": "Desain transaksi sebagai bagian dari pembelajaran, bukan tujuan penggalangan dana.",
    "h1": "Belum ada tujuan belajar maupun sistem pengelolaan uang.",
    "h2": "Penjualan dapat mendominasi dan menggeser tujuan pendidikan.",
    "h3": "Bandingkan fokus pada keuntungan dengan menghapus unsur penjualan seluruhnya.",
    "h4": "Authentic entrepreneurship education menilai proses belajar, keputusan, etika, dan refleksi, bukan profit saja.",
    "transfer": "Murid menjual produk hasil projek sekolah. Bagaimana memastikan kegiatan tersebut tetap menjadi pembelajaran kewirausahaan dan tidak berubah menjadi kegiatan pengumpulan dana semata?",
    "db": {
      "D": 4,
      "A": 2,
      "C": 5,
      "E": 3,
      "B": 1
    }
  },
  "2052": {
    "target_key": "E",
    "semantic_rank": [
      "D",
      "E",
      "B",
      "A",
      "C"
    ],
    "mc": "MC12",
    "misconception": "Sumber daya dialokasikan tanpa kriteria kebutuhan, dampak, risiko, dan keberlanjutan.",
    "principle": "Hibah dinilai menggunakan total cost of ownership, educational fit, capacity to use, dan sustainability.",
    "reasoning": "Hitung kewajiban sepanjang siklus hidup sebelum menerima aset gratis.",
    "h1": "Biaya pembelian nol tetapi lisensi, perawatan, dan pelatihan berlanjut.",
    "h2": "Nilai hibah tidak sama dengan net benefit.",
    "h3": "Bandingkan menerima karena nilai besar dengan menolak karena ada biaya masa depan.",
    "h4": "Resource stewardship menilai lifecycle cost dan strategic fit.",
    "transfer": "Sekolah mendapat hibah alat yang gratis pada tahun pertama tetapi membutuhkan biaya lisensi dan pemeliharaan berikutnya. Mengapa nilai hibah bukan satu-satunya dasar keputusan?",
    "db": {
      "B": 2,
      "A": 3,
      "C": 1,
      "E": 5,
      "D": 4
    }
  },
  "2053": {
    "target_key": "A",
    "semantic_rank": [
      "B",
      "A",
      "E",
      "D",
      "C"
    ],
    "mc": "MC14",
    "misconception": "Kolaborasi/kemitraan berhenti pada kegiatan, bukan penerapan dan hasil.",
    "principle": "Kemitraan pendidikan dimulai dari kebutuhan belajar, keselamatan, peran, aktivitas, dan bukti hasil yang disepakati.",
    "reasoning": "Co-design kerja sama agar kontribusi mitra terhubung pada kompetensi murid.",
    "h1": "Mitra menyediakan kegiatan gratis tetapi kaitan dengan kompetensi belum jelas.",
    "h2": "Akses dunia nyata belum otomatis menjadi pengalaman belajar berkualitas.",
    "h3": "Bandingkan menerima langsung dengan meminta mitra mendesain seluruh program.",
    "h4": "Partnership value muncul ketika external resource diintegrasikan ke learning design dan accountability.",
    "transfer": "Industri menawarkan kegiatan belajar gratis. Apa yang membedakan kemitraan pendidikan dari sekadar menerima program pihak luar?",
    "db": {
      "B": 4,
      "A": 5,
      "E": 1,
      "D": 2,
      "C": 3
    }
  },
  "2054": {
    "target_key": "E",
    "semantic_rank": [
      "E",
      "C",
      "B",
      "D",
      "A"
    ],
    "mc": "MC16",
    "misconception": "Solusi kurang adaptif, tidak belajar dari bukti/kegagalan, atau tidak berkelanjutan.",
    "principle": "Scale-out mempertahankan mekanisme inti sambil mengadaptasi bentuk pada konteks baru dan menguji hasil.",
    "reasoning": "Identifikasi core components, adaptasi terkontrol, pilot, lalu perluas berdasarkan bukti.",
    "h1": "Jenjang lain memiliki karakteristik murid dan struktur pembelajaran berbeda.",
    "h2": "Fidelity pada seluruh prosedur dapat menghambat contextual fit.",
    "h3": "Bandingkan mewajibkan model identik dengan membiarkan adaptasi bebas sepenuhnya.",
    "h4": "Scaling balances fidelity to mechanism dan adaptation to context.",
    "transfer": "Inovasi berhasil pada satu jenjang tetapi akan diterapkan pada konteks yang berbeda. Apa yang harus dipertahankan dan apa yang boleh diadaptasi?",
    "db": {
      "A": 1,
      "C": 3,
      "B": 4,
      "D": 2,
      "E": 5
    }
  },
  "2055": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "D",
      "E",
      "A",
      "B"
    ],
    "mc": "MC10",
    "misconception": "Supervisi berubah menjadi inspeksi/pemberian solusi, bukan refleksi profesional.",
    "principle": "Supervisi menggunakan bukti yang berbeda secara komplementer untuk menguji kualitas dan distribusi pembelajaran.",
    "reasoning": "Letakkan nilai dan observasi berdampingan, lalu tanyakan apa yang dapat dan tidak dapat dijelaskan masing-masing.",
    "h1": "Nilai tinggi dan partisipasi rendah adalah dua bukti yang berbeda, bukan salah satu otomatis salah.",
    "h2": "Outcome tinggi belum menjelaskan kualitas proses atau siapa yang terlibat.",
    "h3": "Bandingkan mempercayai observasi saja dengan nilai saja.",
    "h4": "Supervision triangulates evidence before interpretation and action.",
    "transfer": "Data observasi menunjukkan keterlibatan murid rendah tetapi nilai kelas tinggi. Bagaimana supervisor menggunakan dua bukti yang tampak bertentangan tersebut?",
    "db": {
      "A": 2,
      "B": 1,
      "D": 5,
      "C": 4,
      "E": 3
    }
  },
  "2056": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "A",
      "E",
      "B",
      "D"
    ],
    "mc": "MC10",
    "misconception": "Supervisi berubah menjadi inspeksi/pemberian solusi, bukan refleksi profesional.",
    "principle": "Feedback kuat menghubungkan bukti spesifik, distribusi partisipasi, kualitas respons, dan hipotesis tindakan berikutnya.",
    "reasoning": "Gunakan pertanyaan yang membantu guru menilai kualitas dan pemerataan keterlibatan.",
    "h1": "Lima murid memberi jawaban sangat baik, tetapi sebagian besar tidak terlibat.",
    "h2": "Kualitas respons beberapa murid tidak mewakili distribusi belajar.",
    "h3": "Bandingkan pertanyaan menyalahkan dengan instruksi mengganti kelompok.",
    "h4": "Evidence-based feedback menanyakan makna bukti dan apa yang perlu diuji berikutnya.",
    "transfer": "Hanya sedikit murid aktif tetapi jawaban mereka sangat berkualitas. Pertanyaan reflektif seperti apa yang membantu guru melihat kualitas sekaligus distribusi partisipasi?",
    "db": {
      "E": 4,
      "C": 2,
      "B": 5,
      "D": 1,
      "A": 3
    }
  },
  "2057": {
    "target_key": "D",
    "semantic_rank": [
      "C",
      "E",
      "D",
      "A",
      "B"
    ],
    "mc": "MC11",
    "misconception": "Pengembangan kompetensi dipilih sebelum kebutuhan dipastikan atau tanpa transfer ke praktik.",
    "principle": "Pengembangan asesmen formatif harus sampai pada interpretasi bukti dan keputusan instruksional.",
    "reasoning": "Pindahkan pendampingan dari pembuatan instrumen ke penggunaan hasil untuk menyesuaikan pembelajaran.",
    "h1": "Instrumen membaik tetapi tindak lanjut pembelajaran belum berubah.",
    "h2": "Bottleneck berada setelah pengumpulan data.",
    "h3": "Bandingkan mengulang pelatihan instrumen dengan menambah frekuensi asesmen.",
    "h4": "Formative assessment is a decision cycle, bukan sekadar alat ukur.",
    "transfer": "Guru mampu membuat instrumen asesmen formatif tetapi belum menggunakan hasilnya untuk mengubah pembelajaran. Di titik mana pendampingan perlu difokuskan?",
    "db": {
      "C": 2,
      "E": 1,
      "D": 5,
      "B": 3,
      "A": 4
    }
  },
  "2058": {
    "target_key": "B",
    "semantic_rank": [
      "C",
      "B",
      "A",
      "D",
      "E"
    ],
    "mc": "MC15",
    "misconception": "Aktivitas atau keterlaksanaan dianggap cukup tanpa menilai dampak.",
    "principle": "Perubahan praktik adalah outcome antara; dampak pada murid memerlukan waktu, mekanisme, dan bukti yang sesuai.",
    "reasoning": "Nilai praktik yang berubah sambil terus menguji apakah perubahan tersebut diterjemahkan menjadi pengalaman dan hasil murid.",
    "h1": "Praktik membaik tetapi hasil murid belum berubah dalam satu semester.",
    "h2": "Tidak ada hasil akhir belum otomatis berarti tidak ada efek, dan perbaikan praktik belum otomatis berarti program sukses penuh.",
    "h3": "Bandingkan menyatakan gagal karena nilai belum naik dengan menyatakan berhasil karena praktik membaik.",
    "h4": "Evaluation distinguishes proximal outcomes from distal outcomes dan menilai hubungan di antaranya.",
    "transfer": "Praktik guru meningkat setelah coaching tetapi capaian murid belum berubah. Mengapa belum tepat menyimpulkan coaching berhasil atau gagal sepenuhnya?",
    "db": {
      "D": 3,
      "C": 4,
      "B": 5,
      "E": 2,
      "A": 1
    }
  },
  "2059": {
    "target_key": "A",
    "semantic_rank": [
      "E",
      "C",
      "A",
      "D",
      "B"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Reliabilitas supervisi membutuhkan kalibrasi interpretasi indikator berdasarkan bukti observasi.",
    "reasoning": "Bandingkan bukti yang digunakan kedua supervisor dan selaraskan standar sebelum skor dipakai untuk pembinaan.",
    "h1": "Instrumen sama tetapi penilaian berbeda jauh.",
    "h2": "Masalah dapat berada pada interpretasi indikator, bukan performa guru.",
    "h3": "Bandingkan merata-ratakan skor dengan memilih supervisor senior.",
    "h4": "Inter-rater reliability dibangun melalui calibration on evidence, bukan averaging disagreement.",
    "transfer": "Dua supervisor memberikan penilaian berbeda terhadap guru yang sama. Apa yang harus dilakukan sebelum skor dipakai untuk pembinaan?",
    "db": {
      "E": 3,
      "C": 1,
      "D": 4,
      "B": 2,
      "A": 5
    }
  },
  "2060": {
    "target_key": "E",
    "semantic_rank": [
      "B",
      "E",
      "A",
      "D",
      "C"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Konsistensi praktik dinilai dengan multiple evidence points dan konteks berbeda untuk mengurangi observer effect.",
    "reasoning": "Gunakan bukti terjadwal dan naturalistic evidence tanpa mengubah supervisi menjadi pengawasan tersembunyi.",
    "h1": "Guru selalu baik saat observasi terjadwal tetapi bukti lain menunjukkan ketidakkonsistenan.",
    "h2": "Kinerja saat diamati mungkin tidak mewakili routine practice.",
    "h3": "Bandingkan menambah observasi terjadwal dengan observasi diam-diam terus-menerus.",
    "h4": "Validity meningkat ketika evidence sampling mencakup variasi waktu dan konteks.",
    "transfer": "Guru selalu menunjukkan praktik terbaik ketika observasi dijadwalkan. Bagaimana supervisor menilai apakah perubahan tersebut sudah konsisten?",
    "db": {
      "A": 3,
      "E": 5,
      "C": 1,
      "B": 2,
      "D": 4
    }
  },
  "2061": {
    "target_key": "A",
    "semantic_rank": [
      "D",
      "A",
      "B",
      "C",
      "E"
    ],
    "mc": "MC02",
    "misconception": "Keliru menentukan urutan atau prioritas tindakan.",
    "principle": "Fokus coaching dipilih dengan menimbang impact, readiness, keterkaitan masalah, dan peluang leverage.",
    "reasoning": "Negosiasikan fokus yang cukup penting dan cukup feasible untuk menghasilkan kemajuan bermakna.",
    "h1": "Masalah terbesar dan masalah yang paling siap diperbaiki tidak sama.",
    "h2": "Memilih hanya impact atau hanya readiness dapat sama-sama tidak efektif.",
    "h3": "Bandingkan mewajibkan fokus asesmen dengan membiarkan guru memilih sepenuhnya.",
    "h4": "Prioritization in coaching optimizes impact × readiness × leverage.",
    "transfer": "Masalah dengan dampak terbesar bukan bidang yang paling siap diperbaiki guru. Bagaimana menentukan fokus coaching pertama?",
    "db": {
      "B": 4,
      "C": 3,
      "D": 2,
      "A": 5,
      "E": 1
    }
  },
  "2062": {
    "target_key": "C",
    "semantic_rank": [
      "C",
      "A",
      "E",
      "D",
      "B"
    ],
    "mc": "MC10",
    "misconception": "Supervisi berubah menjadi inspeksi/pemberian solusi, bukan refleksi profesional.",
    "principle": "Timing feedback mempertimbangkan kedekatan dengan bukti dan kesiapan psikologis untuk refleksi produktif.",
    "reasoning": "Tunda secukupnya bila perlu tanpa membuat bukti kehilangan konteks.",
    "h1": "Guru sedang sangat emosional karena masalah pribadi.",
    "h2": "Feedback segera dapat akurat tetapi tidak selalu dapat diproses secara reflektif.",
    "h3": "Bandingkan memberi feedback lengkap segera dengan menunda sampai guru sendiri meminta.",
    "h4": "Effective feedback requires both evidence proximity and receiver readiness.",
    "transfer": "Guru sedang emosional ketika observasi berakhir buruk. Bagaimana menentukan waktu feedback tanpa kehilangan relevansi bukti?",
    "db": {
      "B": 4,
      "A": 1,
      "C": 5,
      "E": 2,
      "D": 3
    }
  },
  "2063": {
    "target_key": "A",
    "semantic_rank": [
      "A",
      "B",
      "E",
      "C",
      "D"
    ],
    "mc": "MC01",
    "misconception": "Mengambil tindakan sebelum diagnosis masalah cukup kuat.",
    "principle": "Perilaku kelas perlu ditelusuri ke desain pembelajaran sebelum diasumsikan sebagai masalah disiplin.",
    "reasoning": "Hubungkan waktu kehilangan fokus dengan tingkat tantangan dan durasi tugas.",
    "h1": "Ketidaktertiban terutama muncul saat tugas terlalu mudah dan terlalu lama.",
    "h2": "Gejala pengelolaan kelas dapat memiliki akar instruksional.",
    "h3": "Bandingkan pelatihan disiplin dengan aturan yang lebih ketat.",
    "h4": "Diagnosis supervisi mencari functional cause sebelum memilih intervention category.",
    "transfer": "Kelas tampak tidak terkendali tetapi masalah muncul terutama saat tugas terlalu mudah. Mengapa pelatihan disiplin belum tentu menjadi tindak lanjut yang tepat?",
    "db": {
      "A": 5,
      "D": 4,
      "B": 2,
      "C": 1,
      "E": 3
    }
  },
  "2064": {
    "target_key": "B",
    "semantic_rank": [
      "E",
      "C",
      "D",
      "B",
      "A"
    ],
    "mc": "MC11",
    "misconception": "Pengembangan kompetensi dipilih sebelum kebutuhan dipastikan atau tanpa transfer ke praktik.",
    "principle": "Kompetensi yang terlihat dalam pelatihan harus ditelusuri transfernya ke praktik melalui hambatan, dukungan, dan bukti penerapan.",
    "reasoning": "Amati praktik, cari titik putus transfer, beri dukungan, dan ukur perubahan.",
    "h1": "Nilai pelatihan tinggi tetapi praktik dua bulan kemudian hampir sama.",
    "h2": "Performance in training context belum sama dengan transfer.",
    "h3": "Bandingkan mengulang pelatihan dengan menunggu satu semester.",
    "h4": "Professional development is complete only when learning transfers into sustained practice.",
    "transfer": "Guru mendapat nilai tinggi dalam pelatihan diferensiasi tetapi praktik kelas tidak berubah. Di bagian mana transfer kompetensi perlu diperiksa?",
    "db": {
      "D": 1,
      "C": 2,
      "E": 4,
      "A": 3,
      "B": 5
    }
  },
  "2065": {
    "target_key": "C",
    "semantic_rank": [
      "B",
      "C",
      "E",
      "D",
      "A"
    ],
    "mc": "MC16",
    "misconception": "Solusi kurang adaptif, tidak belajar dari bukti/kegagalan, atau tidak berkelanjutan.",
    "principle": "Perubahan yang tidak bertahan membutuhkan analisis kondisi pendukung, barrier, cue, reinforcement, dan follow-up.",
    "reasoning": "Cari mengapa perilaku baru kembali ke baseline lalu desain dukungan yang makin mandiri.",
    "h1": "Perubahan muncul sementara setelah coaching lalu menghilang.",
    "h2": "Mengulang coaching tanpa diagnosis dapat mengulang pola yang sama.",
    "h3": "Bandingkan mengulang coaching dari awal dengan menambah supervisi permanen.",
    "h4": "Sustained change memerlukan maintenance conditions, bukan hanya acquisition.",
    "transfer": "Perubahan praktik muncul setelah coaching tetapi kemudian menghilang. Apa yang harus dianalisis selain mengulang coaching?",
    "db": {
      "E": 1,
      "C": 5,
      "A": 4,
      "D": 2,
      "B": 3
    }
  },
  "2066": {
    "target_key": "E",
    "semantic_rank": [
      "D",
      "C",
      "A",
      "E",
      "B"
    ],
    "mc": "MC10",
    "misconception": "Supervisi berubah menjadi inspeksi/pemberian solusi, bukan refleksi profesional.",
    "principle": "Supervisi penggunaan AI menilai keputusan pedagogis dan dampaknya, bukan kelengkapan dokumen atau penggunaan alat.",
    "reasoning": "Hubungkan kebutuhan murid, cara AI memengaruhi keputusan guru, praktik aktual, dan bukti belajar.",
    "h1": "Dokumen lebih lengkap tetapi aktivitas kurang sesuai kebutuhan murid.",
    "h2": "Output yang rapi dapat menyembunyikan poor pedagogical judgment.",
    "h3": "Bandingkan melarang AI dengan menilai kemampuan teknis menggunakan AI.",
    "h4": "AI-assisted teaching tetap harus diaudit pada instructional reasoning dan learner fit.",
    "transfer": "AI membuat dokumen pembelajaran guru jauh lebih lengkap tetapi praktik kelas kurang sesuai kebutuhan murid. Apa fokus supervisinya?",
    "db": {
      "C": 3,
      "A": 1,
      "B": 4,
      "E": 5,
      "D": 2
    }
  },
  "2067": {
    "target_key": "A",
    "semantic_rank": [
      "A",
      "C",
      "D",
      "B",
      "E"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Perbedaan antara observasi supervisor dan suara murid adalah sinyal untuk triangulasi, bukan alasan memilih satu sumber.",
    "reasoning": "Cari situasi, waktu, atau pengalaman yang mungkin tidak teramati selama observasi.",
    "h1": "Supervisor melihat kelas aman tetapi murid anonim melaporkan takut salah.",
    "h2": "Observasi singkat dan pengalaman murid mengukur aspek yang berbeda.",
    "h3": "Bandingkan mempercayai profesional dengan mempercayai survei sepenuhnya.",
    "h4": "Conflicting evidence should trigger inquiry into scope, validity, and hidden conditions.",
    "transfer": "Supervisor melihat kelas aman, tetapi survei anonim murid menunjukkan rasa takut membuat kesalahan. Bagaimana memperlakukan dua sumber bukti tersebut?",
    "db": {
      "A": 5,
      "B": 2,
      "D": 4,
      "E": 3,
      "C": 1
    }
  },
  "2068": {
    "target_key": "B",
    "semantic_rank": [
      "B",
      "E",
      "C",
      "A",
      "D"
    ],
    "mc": "MC11",
    "misconception": "Pengembangan kompetensi dipilih sebelum kebutuhan dipastikan atau tanpa transfer ke praktik.",
    "principle": "Evaluasi pengembangan kompetensi menelusuri seluruh rantai kebutuhan → belajar → praktik → feedback → dampak.",
    "reasoning": "Temukan titik putus sebelum memilih pelatihan tambahan atau mengganti penyedia.",
    "h1": "Sertifikat dan skor tinggi tidak diikuti perubahan praktik.",
    "h2": "Masalah dapat terjadi pada relevansi kebutuhan, transfer, dukungan, atau reinforcement.",
    "h3": "Bandingkan menambah pelatihan level tinggi dengan mengganti penyedia.",
    "h4": "PD effectiveness dinilai sebagai transfer system, bukan attendance history.",
    "transfer": "Guru sudah mengikuti beberapa pelatihan dan memperoleh sertifikat, tetapi praktiknya tetap sama. Bagaimana menemukan titik putus dalam proses pengembangan kompetensi?",
    "db": {
      "C": 2,
      "B": 5,
      "A": 3,
      "D": 1,
      "E": 4
    }
  },
  "2069": {
    "target_key": "D",
    "semantic_rank": [
      "D",
      "B",
      "E",
      "A",
      "C"
    ],
    "mc": "MC08",
    "misconception": "Keputusan menggunakan bukti terlalu sempit, agregat, atau tidak ditriangulasi.",
    "principle": "Dampak coaching harus didisagregasi agar peningkatan rata-rata tidak menyembunyikan kelompok yang tidak mendapat manfaat.",
    "reasoning": "Analisis perubahan praktik dan respons berbagai kelompok murid lalu sesuaikan coaching.",
    "h1": "Rata-rata naik terutama karena murid berkemampuan awal tinggi.",
    "h2": "Average gain tidak membuktikan broad benefit.",
    "h3": "Bandingkan menyatakan coaching berhasil dengan hanya memfokuskan pembinaan pada murid rendah.",
    "h4": "Equity-sensitive supervision examines heterogeneous learner effects.",
    "transfer": "Nilai rata-rata kelas meningkat setelah coaching, tetapi hanya murid dengan kemampuan awal tinggi yang mengalami kemajuan. Bagaimana supervisor menilai dampaknya?",
    "db": {
      "C": 2,
      "A": 4,
      "E": 1,
      "D": 5,
      "B": 3
    }
  },
  "2070": {
    "target_key": "E",
    "semantic_rank": [
      "E",
      "B",
      "A",
      "C",
      "D"
    ],
    "mc": "MC15",
    "misconception": "Aktivitas atau keterlaksanaan dianggap cukup tanpa menilai dampak.",
    "principle": "Sistem supervisi dievaluasi sebagai rantai diagnosis, observasi, feedback, tindak lanjut, perubahan praktik, dan dampak murid.",
    "reasoning": "Cari titik putus pada causal chain, bukan menambah aktivitas supervisi secara otomatis.",
    "h1": "Semua dokumen dan jadwal terpenuhi tetapi mutu stagnan dua tahun.",
    "h2": "Compliance supervisi tidak sama dengan effectiveness.",
    "h3": "Bandingkan menambah frekuensi supervisi dengan mengganti instrumen.",
    "h4": "A supervision system succeeds only when its feedback loop produces sustained practice and learner change.",
    "transfer": "Semua tahapan supervisi terdokumentasi lengkap tetapi mutu pembelajaran sekolah stagnan. Rantai proses apa yang harus dievaluasi untuk menemukan kegagalannya?",
    "db": {
      "C": 3,
      "B": 4,
      "D": 2,
      "A": 1,
      "E": 5
    }
  }
} as const;
