/* SIMANTAB_BCKS_SUBSTANSI_SIMULATOR_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<300&&(!window.__simantabSb||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),profile=()=>window.__simantabProfile||{};
if(!sb)return;

const Q=[
[1,"KEPRIBADIAN","Seorang guru senior mengkritik keputusan Anda dengan nada tinggi dalam rapat. Tindakan pertama yang paling tepat adalah:",["Menghentikan pembicaraan agar kewibawaan terjaga","Mendengarkan substansi kritik, menenangkan suasana, kemudian membahasnya secara profesional","Meminta guru meninggalkan ruangan","Melaporkannya kepada pengawas"]],
[2,"KEPRIBADIAN","Sahabat dekat Anda sebagai guru sering terlambat. Tindakan Anda:",["Memberinya toleransi","Meminta guru lain menegurnya","Memprosesnya sesuai ketentuan secara adil sekaligus melakukan pembinaan","Memindahkannya"]],
[3,"KEPRIBADIAN","Program unggulan yang Anda gagas ternyata gagal. Sikap paling tepat:",["Mencari siapa yang bertanggung jawab","Mengubah indikator keberhasilan","Menghentikannya diam-diam","Mengakui hasilnya, mengevaluasi penyebab, dan memperbaiki desain program"]],
[4,"KEPRIBADIAN","Orang tua berpengaruh meminta nilai anaknya dinaikkan. Anda:",["Menolak secara santun dan menjelaskan prinsip penilaian yang objektif","Mengabulkan sebagian","Menyerahkan kepada guru agar tidak terlibat","Mengabulkan demi hubungan baik"]],
[5,"KEPRIBADIAN","Anda mengetahui keputusan yang dibuat minggu lalu ternyata keliru. Tindakan terbaik:",["Mempertahankannya karena sudah diumumkan","Mengakui kekeliruan dan melakukan koreksi secara terbuka","Menyalahkan staf yang memberi data","Membiarkannya sampai tahun depan"]],
[6,"KEPRIBADIAN","Beredar informasi negatif tentang seorang guru melalui grup WhatsApp. Anda:",["Langsung memanggil dan menghukum guru tersebut","Membahasnya dengan semua guru","Memverifikasi fakta dan memberikan kesempatan yang bersangkutan menjelaskan","Menyebarkan klarifikasi sebelum verifikasi"]],
[7,"KEPRIBADIAN","Seorang guru mengemukakan pendapat yang bertentangan dengan Anda tetapi didukung data yang kuat. Anda:",["Menunda agar guru tidak merasa menang","Menerima bukti tersebut dan mengevaluasi keputusan","Tetap pada keputusan awal","Meminta pemungutan suara"]],
[8,"KEPRIBADIAN","Saat menghadapi tekanan dari banyak pihak, dasar utama keputusan kepala sekolah adalah:",["Kepentingan peserta didik, integritas, data, dan aturan","Pendapat mayoritas","Keinginan pimpinan","Kepentingan citra sekolah"]],
[9,"KEPRIBADIAN","Seorang guru melakukan kesalahan untuk pertama kali dan mengakuinya. Anda:",["Memberikan hukuman maksimal","Mengumumkan kesalahannya sebagai pelajaran","Membiarkannya","Melakukan pembinaan proporsional dan memastikan perbaikan"]],
[10,"KEPRIBADIAN","Rapor Pendidikan menunjukkan hasil buruk. Anda merasa program sekolah selama ini sudah bagus. Sikap paling tepat:",["Meragukan datanya","Menggunakan data sebagai bahan refleksi dan menguji kembali asumsi sebelumnya","Menunggu data berikutnya","Membandingkan dengan sekolah yang lebih rendah"]],
[11,"KEPRIBADIAN","Guru meminta Anda menandatangani laporan kegiatan yang belum dilaksanakan karena batas waktu pelaporan. Anda:",["Menandatangani agar administrasi selesai","Meminta bendahara menandatangani","Menolak dan memastikan laporan sesuai kondisi faktual","Menandatangani dengan catatan"]],
[12,"KEPRIBADIAN","Anda memperoleh penghargaan atas keberhasilan program yang sebenarnya merupakan kerja tim. Sikap paling tepat:",["Mengakui kontribusi tim dan menjadikan capaian sebagai keberhasilan bersama","Menerima penghargaan tanpa menyebut tim","Menolak penghargaan","Membagikan penghargaan secara fisik"]],
[13,"KEPRIBADIAN","Salah satu kebijakan Anda ditolak sebagian besar guru. Langkah awal terbaik:",["Membatalkan langsung","Memerintahkan pelaksanaan","Mengganti koordinator","Mendengarkan alasan penolakan dan mengevaluasi substansi kebijakan"]],
[14,"KEPRIBADIAN","Kepala sekolah yang reflektif ditunjukkan oleh perilaku:",["Selalu yakin dengan keputusannya","Secara teratur mengevaluasi tindakan dan menggunakan hasilnya untuk memperbaiki praktik kepemimpinan","Mengikuti seluruh masukan","Banyak mengikuti seminar"]],
[15,"SOSIAL","Orang tua memprotes tugas siswa yang dianggap terlalu banyak. Guru merasa sudah sesuai kebutuhan. Anda:",["Membela guru","Memfasilitasi dialog berdasarkan data beban belajar dan kebutuhan siswa","Menghapus semua tugas","Menyerahkan kepada komite"]],
[16,"SOSIAL","Komite menawarkan dana besar tetapi meminta penunjukan penyedia tertentu. Anda:",["Menerima","Menyerahkan kepada bendahara","Menolak seluruh bantuan","Mengapresiasi dukungan tetapi tetap menerapkan tata kelola yang transparan dan bebas konflik kepentingan"]],
[17,"SOSIAL","Guru muda memiliki inovasi digital tetapi guru senior menolaknya. Anda:",["Memfasilitasi uji coba terbatas dan evaluasi bersama","Mewajibkan semua menggunakannya","Membatalkan inovasi","Menyerahkan keputusan kepada guru senior"]],
[18,"SOSIAL","Banyak siswa dari keluarga kurang mampu berisiko putus sekolah. Anda:",["Menyerahkan kepada orang tua","Memberikan dispensasi tanpa batas","Membangun kolaborasi sekolah, keluarga, komite, dan mitra untuk mencari solusi","Mengurangi standar kehadiran"]],
[19,"SOSIAL","Masyarakat salah memahami program sekolah. Anda:",["Tidak perlu menanggapi","Membuka komunikasi, menjelaskan fakta, dan mendengar kekhawatiran masyarakat","Membantah di media sosial","Meminta komite menyelesaikannya"]],
[20,"SOSIAL","Kerja sama dengan perusahaan ditawarkan kepada sekolah. Pertimbangan utama:",["Besarnya dana","Popularitas perusahaan","Keinginan komite","Manfaat pendidikan, kepatuhan aturan, dan perlindungan kepentingan peserta didik"]],
[21,"SOSIAL","Dua kelompok guru berselisih cukup lama. Anda:",["Memfasilitasi dialog dan mengembalikan fokus pada tujuan bersama sekolah","Memihak kelompok mayoritas","Membiarkan","Memindahkan salah satu kelompok"]],
[22,"SOSIAL","Seorang guru jarang berbagi praktik baik karena takut dikritik. Anda:",["Mewajibkannya menjadi narasumber","Menilai kinerjanya rendah","Membangun komunitas belajar yang aman untuk berbagi dan refleksi","Membiarkan"]],
[23,"SOSIAL","Sekolah memiliki masalah sampah yang berulang. Solusi paling kuat:",["Menambah petugas","Melibatkan siswa dan warga sekolah dalam perubahan budaya serta sistem pengelolaan sampah","Memberi hukuman berat","Memasang lebih banyak tulisan larangan"]],
[24,"SOSIAL","Dalam rapat, terdapat tiga pendapat yang sangat berbeda. Kepala sekolah sebaiknya:",["Langsung memutuskan","Memilih usulan guru senior","Melakukan voting tanpa diskusi","Memastikan argumen didengar dan mengarahkan keputusan pada tujuan pembelajaran"]],
[25,"SOSIAL","Orang tua memiliki keahlian yang dapat mendukung program sekolah. Anda:",["Membuka ruang partisipasi dengan batas peran dan tujuan yang jelas","Tidak melibatkan karena bukan guru","Menyerahkan pengelolaan program kepada orang tua","Meminta sumbangan saja"]],
[26,"SOSIAL","Mitra menawarkan program yang menarik tetapi tidak sesuai kebutuhan prioritas sekolah. Anda:",["Menerima karena gratis","Menerima demi hubungan","Mendiskusikan modifikasi agar relevan atau tidak mengambilnya bila tidak bermanfaat","Mengikuti sekolah lain"]],
[27,"SOSIAL","Indikator kolaborasi sekolah yang paling bermakna adalah:",["Banyaknya MoU","Dampak kolaborasi terhadap mutu layanan dan pembelajaran","Banyaknya foto kegiatan","Banyaknya sponsor"]],
[28,"SOSIAL","Dalam membangun jejaring profesional, orientasi kepala sekolah terutama adalah:",["Mendapatkan jabatan organisasi","Memperluas popularitas","Mendapatkan bantuan","Membawa pengetahuan dan sumber daya jejaring untuk meningkatkan mutu sekolah"]],
[29,"MANAJERIAL","Anggaran terbatas sementara ada lima program. Anda:",["Membagi rata","Menentukan prioritas berdasarkan data kebutuhan dan dampak pada siswa","Mendahulukan program kepala sekolah","Mengundi"]],
[30,"MANAJERIAL","Rapor Pendidikan menunjukkan numerasi rendah. Tindakan awal:",["Menganalisis akar masalah bersama tim sebelum menentukan intervensi","Membeli aplikasi matematika","Mengadakan lomba","Menambah dua jam matematika"]],
[31,"MANAJERIAL","Sekolah menjalankan banyak kegiatan tetapi hasil belajar stagnan. Anda:",["Menambah kegiatan","Meminta tambahan anggaran","Mengevaluasi efektivitas program dan menghentikan yang tidak berdampak","Mengganti semua koordinator"]],
[32,"MANAJERIAL","Administrasi guru terlalu banyak sehingga mengurangi waktu merancang pembelajaran. Anda:",["Meminta guru bekerja lebih lama","Memetakan dan menyederhanakan administrasi yang tidak esensial","Menambah operator","Membuat format baru"]],
[33,"MANAJERIAL","Dalam menyusun program tahunan, sumber pertama yang paling berguna adalah:",["Program sekolah lain","Keinginan komite","Program tahun lalu","Data capaian, evaluasi sekolah, karakteristik siswa, serta sumber daya yang tersedia"]],
[34,"MANAJERIAL","Perpustakaan sekolah jarang digunakan. Tindakan terbaik:",["Menganalisis penyebab dan mengintegrasikan perpustakaan dengan pembelajaran","Menambah koleksi dahulu","Mengubahnya menjadi ruang rapat","Menutupnya"]],
[35,"MANAJERIAL","Data absensi siswa meningkat dalam tiga bulan. Anda:",["Memberi hukuman seluruh siswa","Memanggil seluruh orang tua","Menganalisis pola dan penyebab sebelum menentukan intervensi","Menurunkan nilai"]],
[36,"MANAJERIAL","Sebuah program telah menghabiskan banyak anggaran tetapi tidak efektif. Anda:",["Melanjutkannya karena sudah terlanjur mahal","Mengevaluasi dan menghentikan atau mendesain ulang jika bukti menunjukkan tidak efektif","Menyembunyikan hasilnya","Mengganti nama program"]],
[37,"MANAJERIAL","Laporan keuangan tidak sesuai bukti transaksi. Anda:",["Membetulkan angka agar cocok","Mengabaikan selisih kecil","Menyerahkan kepada bendahara","Melakukan verifikasi, koreksi berdasarkan bukti, dan memperkuat kontrol internal"]],
[38,"MANAJERIAL","Sekolah memiliki dua guru dengan beban sangat berat dan empat guru dengan beban relatif ringan. Anda:",["Menata kembali pembagian tugas berdasarkan kebutuhan, kompetensi, dan proporsionalitas","Membiarkan","Menambah guru baru","Memberi insentif dua guru tersebut"]],
[39,"MANAJERIAL","Program sekolah bagus tetapi tidak memiliki indikator keberhasilan. Anda:",["Tetap melaksanakan","Menentukan indikator, baseline, target, dan mekanisme evaluasi","Menggunakan jumlah kegiatan sebagai indikator","Menggunakan kepuasan kepala sekolah"]],
[40,"MANAJERIAL","Ketika mengambil keputusan penting, data menunjukkan satu arah tetapi opini mayoritas berbeda. Anda:",["Selalu mengikuti mayoritas","Selalu mengikuti data tanpa diskusi","Memeriksa validitas data, mendengar konteks lapangan, kemudian membuat keputusan berbasis bukti","Menunda keputusan"]],
[41,"MANAJERIAL","Prinsip utama penggunaan sumber daya sekolah adalah:",["Cepat terserap","Sesuai kebiasaan","Merata","Efektif, transparan, akuntabel, dan mendukung mutu pembelajaran"]],
[42,"MANAJERIAL","Kepala sekolah menerima tambahan anggaran di akhir tahun. Yang harus dilakukan pertama:",["Mengidentifikasi kebutuhan prioritas yang sah dan relevan dengan rencana sekolah","Menghabiskan anggaran secepat mungkin","Membeli peralatan baru","Membagi kepada semua kegiatan"]],
[43,"KEWIRAUSAHAAN","Sekolah memiliki lahan kosong. Pendekatan kewirausahaan pendidikan terbaik adalah:",["Menjualnya","Menyewakannya","Mengembangkan proyek pembelajaran produktif yang relevan dengan siswa","Membiarkannya"]],
[44,"KEWIRAUSAHAAN","Inovasi sekolah gagal pada uji coba pertama. Anda:",["Mengevaluasi, memperbaiki, kemudian melakukan uji coba berikutnya secara terukur","Menghentikan semua inovasi","Mengganti tim","Menyembunyikan kegagalan"]],
[45,"KEWIRAUSAHAAN","Makna kewirausahaan kepala sekolah yang paling tepat adalah:",["Memiliki bisnis","Kemampuan melihat peluang, berinovasi, mengelola risiko, dan menciptakan nilai pendidikan","Mencari pendapatan sekolah","Menjual produk siswa"]],
[46,"KEWIRAUSAHAAN","Minat baca siswa rendah. Anda:",["Membeli ribuan buku","Menghukum yang tidak membaca","Menambah jam membaca","Mendesain inovasi literasi berdasarkan perilaku dan kebutuhan siswa kemudian mengukur dampaknya"]],
[47,"KEWIRAUSAHAAN","Seorang guru memiliki kemampuan AI yang sangat baik. Anda:",["Memberdayakannya untuk mengembangkan kapasitas guru lain dan inovasi pembelajaran","Menjadikannya operator sekolah","Memberikan seluruh pekerjaan teknologi kepadanya","Membiarkannya"]],
[48,"KEWIRAUSAHAAN","Program inovatif berhasil di sekolah lain. Anda:",["Menyalinnya persis","Menolak karena bukan karya sendiri","Mengadaptasi berdasarkan masalah, karakteristik, dan sumber daya sekolah","Menerapkan tanpa uji coba"]],
[49,"KEWIRAUSAHAAN","Inovasi yang baik terutama ditandai oleh:",["Teknologi terbaru","Kemampuan menjawab masalah nyata dan menghasilkan dampak terukur","Biaya tinggi","Banyak publikasi"]],
[50,"KEWIRAUSAHAAN","Sekolah memperoleh tawaran teknologi gratis. Pertanyaan pertama seharusnya:",["Berapa harga normalnya?","Sekolah mana yang memakai?","Apakah bisa dipublikasikan?","Masalah pendidikan apa yang akan diselesaikan teknologi tersebut?"]],
[51,"KEWIRAUSAHAAN","Guru menolak perubahan karena takut gagal. Anda:",["Membangun lingkungan yang aman untuk eksperimen terukur, refleksi, dan belajar dari kegagalan","Memerintahkan mereka berubah","Mengganti guru","Membatalkan inovasi"]],
[52,"KEWIRAUSAHAAN","Program baru memerlukan sumber daya yang belum dimiliki sekolah. Anda:",["Membatalkan","Meminjam tanpa perencanaan","Memetakan sumber daya internal dan peluang kemitraan yang sah sebelum memulai","Meminta orang tua membayar"]],
[53,"KEWIRAUSAHAAN","Sekolah memiliki praktik baik yang berhasil. Langkah berikutnya:",["Menjaganya sebagai keunggulan rahasia","Mendokumentasikan, mengevaluasi, memperbaiki, dan membagikannya","Menggantinya dengan program baru","Menghentikannya setelah mendapat penghargaan"]],
[54,"KEWIRAUSAHAAN","Kepala sekolah menghadapi kebijakan baru yang mengubah proses kerja. Sikap paling tepat:",["Menunggu sekolah lain","Mempertahankan cara lama","Memerintahkan operator memahami semuanya","Memahami substansi perubahan dan memimpin adaptasi organisasi"]],
[55,"KEWIRAUSAHAAN","Risiko dalam inovasi sekolah seharusnya:",["Dihindari seluruhnya","Diambil sebesar-besarnya","Diidentifikasi, dihitung, dimitigasi, dan dipantau","Diserahkan kepada panitia"]],
[56,"KEWIRAUSAHAAN","Orientasi akhir inovasi kepala sekolah adalah:",["Peningkatan mutu pengalaman dan hasil belajar peserta didik","Penghargaan sekolah","Publikasi kepala sekolah","Banyaknya program baru"]],
[57,"SUPERVISI","Saat observasi, pembelajaran didominasi ceramah dan siswa pasif. Anda:",["Memberikan nilai rendah","Menyampaikan bukti observasi dan membantu guru merefleksikan alternatif pembelajaran","Menegur di depan siswa","Mengganti guru"]],
[58,"SUPERVISI","Tujuan utama supervisi akademik adalah:",["Mengisi dokumen","Menentukan guru terbaik","Menemukan kesalahan","Meningkatkan praktik pembelajaran dan dampaknya pada peserta didik"]],
[59,"SUPERVISI","Nilai hasil belajar suatu kelas rendah. Tindakan pertama:",["Menganalisis data bersama guru dan mencari faktor penyebab","Menegur guru","Memindahkan siswa","Menambah jam belajar"]],
[60,"SUPERVISI","Setelah supervisi, guru belum berubah. Anda:",["Memberikan hukuman","Menghentikan supervisi","Melakukan tindak lanjut untuk mengetahui hambatan dan menyepakati perbaikan","Mengumumkan hasilnya"]],
[61,"SUPERVISI","Umpan balik supervisi yang baik adalah:",["Bersifat umum","Spesifik berdasarkan bukti dan mendorong refleksi guru","Membandingkan guru satu dengan lainnya","Berfokus pada kekurangan"]],
[62,"SUPERVISI","Guru gugup setiap kali disupervisi. Anda:",["Menjelaskan bahwa supervisi merupakan proses pengembangan, bukan pencarian kesalahan","Membiarkannya","Melakukan observasi diam-diam","Menghentikan supervisi"]],
[63,"SUPERVISI","Banyak siswa pasif. Fokus observasi seharusnya terutama pada:",["Kerapian administrasi","Penampilan guru","Kebersihan kelas","Interaksi pembelajaran, strategi guru, dan keterlibatan siswa"]],
[64,"SUPERVISI","Guru senior mengatakan sudah berpengalaman sehingga tidak membutuhkan supervisi. Anda:",["Membebaskannya","Memintanya mensupervisi orang lain saja","Menjelaskan bahwa refleksi dan pengembangan profesional berlaku bagi semua","Melaporkannya"]],
[65,"SUPERVISI","Hasil supervisi menunjukkan enam guru memiliki masalah yang sama dalam asesmen. Anda:",["Menegur satu per satu","Mengembangkan kegiatan belajar bersama berbasis kebutuhan tersebut","Membuat surat peringatan","Mengganti instrumen supervisi"]],
[66,"SUPERVISI","Seorang guru sangat inovatif, tetapi hasil belajar siswa tidak menunjukkan peningkatan. Anda:",["Tetap menilai sangat baik karena inovatif","Menghentikan inovasi","Meminta guru lain menirunya","Mengevaluasi kesesuaian inovasi dengan kebutuhan dan bukti hasil belajar"]],
[67,"SUPERVISI","Kepala sekolah menemukan guru mengajar materi terlalu sulit bagi sebagian siswa. Anda:",["Mengajak guru menganalisis kebutuhan dan diferensiasi pembelajaran","Meminta menurunkan standar seluruh kelas","Memindahkan siswa","Memberi les tambahan saja"]],
[68,"SUPERVISI","Setelah supervisi, guru sendiri berhasil menemukan kelemahannya. Kepala sekolah sebaiknya:",["Langsung memberi solusi","Menilai guru rendah","Memfasilitasi guru menyusun rencana perbaikan dan indikator keberhasilannya","Mengakhiri proses"]],
[69,"SUPERVISI","Guru menunjukkan administrasi lengkap tetapi siswa hampir tidak terlibat dalam pembelajaran. Penilaian kepala sekolah sebaiknya lebih menekankan:",["Kelengkapan administrasi","Mutu proses pembelajaran dan keterlibatan peserta didik","Lama pengalaman guru","Banyaknya media"]],
[70,"SUPERVISI","Ukuran paling bermakna bahwa supervisi kepala sekolah berhasil adalah:",["Semua guru disupervisi dua kali","Dokumen lengkap","Jadwal terlaksana 100%","Terjadi perbaikan praktik guru yang berdampak pada pengalaman dan hasil belajar siswa"]]
];
const BYNO=new Map(Q.map(x=>[x[0],x])),LETTERS=["A","B","C","D"];
const LEADER=new Set(["SUPER_ADMIN","KEPALA_DINAS","SEKRETARIS_DINAS","KABID"]);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const pct=v=>Number(v||0).toLocaleString("id-ID",{maximumFractionDigits:1});
const fmtRead=s=>({SANGAT_SIAP:"Sangat Siap",SIAP:"Siap",PERLU_PENGUATAN:"Perlu Penguatan",PERLU_PENDAMPINGAN_INTENSIF:"Perlu Pendampingan Intensif"}[s]||s||"-");
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const api=async body=>{const {data,error}=await sb.functions.invoke("simantab-bcks-substansi",{body});if(error)throw new Error(data?.error||error.message||"Layanan BCKS bermasalah.");if(data?.error)throw new Error(data.error);return data};
let eligibility=null,state=null,timer=null,observer=null;

function style(){
 if($("bcksSubStyle"))return;
 const st=document.createElement("style");st.id="bcksSubStyle";st.textContent=`
 .bsub-card{margin:12px 0;padding:16px;border:1px solid #bdd9f3;border-radius:16px;background:linear-gradient(135deg,#f7fbff,#eef7ff);box-shadow:0 7px 20px #0f3f7610}
 .bsub-card h3{margin:0 0 6px;color:#0f3f76}.bsub-note{font-size:11px;line-height:1.55;color:#556d82}
 .bsub-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.bsub-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:900;cursor:pointer;background:#155fa8;color:#fff}.bsub-btn.soft{background:#fff;color:#155fa8;border:1px solid #b8d5ef}.bsub-btn.warn{background:#a65d00}.bsub-btn:disabled{opacity:.55;cursor:not-allowed}
 .bsub-overlay{position:fixed;inset:0;z-index:100000;background:#06182ee8;display:flex;align-items:stretch;justify-content:center;padding:14px}
 .bsub-modal{width:min(1120px,100%);height:100%;background:#f5f8fb;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px #0008}
 .bsub-top{background:#0f3f76;color:#fff;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}.bsub-top h2{font-size:17px;margin:0}.bsub-timer{font-size:20px;font-weight:950;font-variant-numeric:tabular-nums}
 .bsub-body{padding:14px;overflow:auto;flex:1}.bsub-grid{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:12px}
 .bsub-q{background:#fff;border:1px solid #dce6ef;border-radius:16px;padding:17px}.bsub-qnum{font-size:11px;font-weight:900;color:#5d7890}.bsub-qtext{font-size:16px;font-weight:850;line-height:1.55;margin:8px 0 14px;color:#183a5a}
 .bsub-opt{display:flex;gap:10px;padding:11px;margin:8px 0;border:1px solid #dbe4ec;border-radius:12px;cursor:pointer;background:#fff}.bsub-opt:has(input:checked){border-color:#2d78bd;background:#edf6ff}.bsub-opt input{margin-top:3px}.bsub-letter{font-weight:950;color:#0f3f76}
 .bsub-side{background:#fff;border:1px solid #dce6ef;border-radius:16px;padding:12px;align-self:start;position:sticky;top:0}.bsub-nav{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:8px}.bsub-num{border:1px solid #cfdce7;border-radius:8px;background:#fff;padding:7px 4px;font-weight:850;cursor:pointer;font-size:10px}.bsub-num.ans{background:#dff3e8;border-color:#8ac9a7}.bsub-num.doubt{box-shadow:inset 0 0 0 2px #e4a832}.bsub-num.active{background:#155fa8;color:#fff;border-color:#155fa8}
 .bsub-bottom{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.bsub-home{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px}.bsub-stat{grid-column:span 3;background:#fff;border:1px solid #dfe8f0;border-radius:14px;padding:13px}.bsub-wide{grid-column:span 12}.bsub-half{grid-column:span 6}.bsub-numstat{font-size:27px;font-weight:950;color:#0f3f76}.bsub-label{font-size:10px;text-transform:uppercase;font-weight:900;color:#6a8094}
 .bsub-table{width:100%;border-collapse:collapse;font-size:11px}.bsub-table th,.bsub-table td{padding:9px;border-bottom:1px solid #e4ebf1;text-align:left}.bsub-ok{color:#177245;font-weight:900}.bsub-bad{color:#a44528;font-weight:900}.bsub-review{padding:12px;border:1px solid #dde7ef;border-radius:12px;margin:8px 0;background:#fff}.bsub-review.bad{border-left:4px solid #c65b38}.bsub-review.good{border-left:4px solid #3d9565}
 @media(max-width:800px){.bsub-overlay{padding:0}.bsub-modal{border-radius:0}.bsub-grid{grid-template-columns:1fr}.bsub-side{position:static}.bsub-stat{grid-column:span 6}.bsub-half{grid-column:span 12}.bsub-qtext{font-size:14px}.bsub-top h2{font-size:14px}.bsub-timer{font-size:16px}}
 `;document.head.appendChild(st);
}
function closeModal(){clearInterval(timer);timer=null;$("bcksSubOverlay")?.remove();state=null}
function modal(title,html,timerText=""){
 style();$("bcksSubOverlay")?.remove();
 const el=document.createElement("div");el.id="bcksSubOverlay";el.className="bsub-overlay";el.innerHTML=`<div class="bsub-modal"><div class="bsub-top"><h2>${esc(title)}</h2><div style="display:flex;align-items:center;gap:12px"><div id="bcksSubTimer" class="bsub-timer">${esc(timerText)}</div><button class="bsub-btn soft" id="bcksSubClose">Tutup</button></div></div><div class="bsub-body" id="bcksSubModalBody">${html}</div></div>`;document.body.appendChild(el);$("bcksSubClose").onclick=()=>closeModal();return el;
}
async function eligible(){
 if(eligibility!==null)return eligibility;
 if(!["GTK","KEPALA_SEKOLAH"].includes(String(profile().role||""))){eligibility=false;return false}
 const {data,error}=await sb.from("ks_bcks_submission_details").select("workflow_stage,admin_status,is_archived").eq("user_id",profile().id).maybeSingle();
 eligibility=!error&&!!data&&!data.is_archived&&["SUBSTANSI","DIKLAT","SERTIFIKAT"].includes(data.workflow_stage)&&["TERVERIFIKASI","DISETUJUI"].includes(data.admin_status);
 return eligibility;
}
async function injectCard(){
 const body=$("diklatKsBcksBody");if(!body||$("bcksSubstansiSimulatorCard"))return;
 const role=String(profile().role||"");
 if(LEADER.has(role)&&String(profile().account_channel||"").toUpperCase()==="DINAS"){
  const d=document.createElement("div");d.id="bcksSubstansiSimulatorCard";d.className="bsub-card";d.innerHTML='<h3>🧠 Dashboard Kesiapan Seleksi Substansi</h3><div class="bsub-note">Monitoring agregat latihan CBT peserta BCKS. Nilai di modul ini merupakan indikator latihan SIMANTAB, bukan passing grade resmi Kemendikdasmen.</div><div class="bsub-actions"><button class="bsub-btn" id="bcksOpenLeader">Lihat Peta Kesiapan</button></div>';body.appendChild(d);$("bcksOpenLeader").onclick=openLeader;return;
 }
 if(!(await eligible()))return;
 const d=document.createElement("div");d.id="bcksSubstansiSimulatorCard";d.className="bsub-card";d.innerHTML='<h3>🎯 Simulasi Seleksi Substansi & AI Coach</h3><div class="bsub-note"><b>70 soal • 120 menit • berbasis kasus.</b> Setelah simulasi, sistem memetakan Kepribadian, Sosial, Manajerial, Kewirausahaan, dan Supervisi, lalu memberi latihan adaptif 10 kasus pada area terlemah.<br><b>Catatan:</b> ini latihan SIMANTAB, bukan ujian resmi dan bukan passing grade Kemendikdasmen.</div><div class="bsub-actions"><button class="bsub-btn" id="bcksOpenParticipant">Buka Modul Latihan</button></div>';body.appendChild(d);$("bcksOpenParticipant").onclick=openHome;
}
function installObserver(){
 const root=$("diklatKsBcksBody");if(!root||observer)return;
 observer=new MutationObserver(()=>setTimeout(injectCard,0));observer.observe(root,{childList:true});injectCard();
}
async function loadAttempts(){
 const {data,error}=await sb.from("bcks_substansi_attempts").select("*").eq("user_id",profile().id).order("started_at",{ascending:false}).limit(12);if(error)throw error;return data||[];
}
async function openHome(){
 try{
  const attempts=await loadAttempts(),now=Date.now();
  const active=attempts.find(a=>a.status==="IN_PROGRESS"&&new Date(a.expires_at).getTime()>now);
  const lastSim=attempts.find(a=>a.mode==="SIMULASI"&&a.status==="SUBMITTED");
  const submitted=attempts.filter(a=>a.status==="SUBMITTED").slice(0,6);
  modal("Simulasi Seleksi Substansi BCKS",`<div class="bsub-home">
   <div class="bsub-stat"><div class="bsub-label">Format</div><div class="bsub-numstat">70</div><div class="bsub-note">soal kasus</div></div>
   <div class="bsub-stat"><div class="bsub-label">Durasi</div><div class="bsub-numstat">120</div><div class="bsub-note">menit</div></div>
   <div class="bsub-stat"><div class="bsub-label">Simulasi terakhir</div><div class="bsub-numstat">${lastSim?pct(lastSim.score):"-"}</div><div class="bsub-note">${lastSim?fmtRead(lastSim.readiness_label):"Belum ada"}</div></div>
   <div class="bsub-stat"><div class="bsub-label">Prioritas</div><div class="bsub-numstat" style="font-size:17px">${esc(lastSim?.priority_competency||"-")}</div><div class="bsub-note">hasil latihan terakhir</div></div>
   <div class="bsub-card bsub-wide" style="margin:0"><h3>Mulai / Lanjutkan Latihan</h3><div class="bsub-note">Kunci jawaban tidak disimpan di browser dan baru dibuka sesudah sesi dikirim.</div><div class="bsub-actions">
   ${active?'<button class="bsub-btn" id="bcksResume">Lanjutkan Sesi Aktif</button>':'<button class="bsub-btn" id="bcksStartSim">Mulai Simulasi 70 Soal</button>'}
   ${lastSim?'<button class="bsub-btn warn" id="bcksStartCoach">AI Coach • 10 Kasus</button>':''}
   </div></div>
   <div class="bsub-card bsub-wide" style="margin:0"><h3>Riwayat</h3>${submitted.length?'<div style="overflow:auto"><table class="bsub-table"><thead><tr><th>Jenis</th><th>Nilai</th><th>Status Latihan</th><th>Prioritas</th><th></th></tr></thead><tbody>'+submitted.map(a=>`<tr><td>${a.mode}</td><td><b>${pct(a.score)}</b></td><td>${esc(fmtRead(a.readiness_label))}</td><td>${esc(a.priority_competency||"-")}</td><td><button class="bsub-btn soft" data-review="${a.id}">Bedah Hasil</button></td></tr>`).join("")+'</tbody></table></div>':'<div class="bsub-note">Belum ada simulasi selesai.</div>'}</div>
   <div class="bsub-card bsub-wide" style="margin:0;background:#fffdf2;border-color:#ead9a2"><b>Indikator latihan internal</b><div class="bsub-note">90–100 Sangat Siap • 80–89 Siap • 70–79 Perlu Penguatan • &lt;70 Perlu Pendampingan Intensif. Kategori ini bukan batas kelulusan resmi.</div></div>
  </div>`);
  if(active)$("bcksResume").onclick=()=>resumeAttempt(active);else $("bcksStartSim").onclick=()=>startAttempt("SIMULASI");
  if(lastSim)$("bcksStartCoach").onclick=()=>startAttempt("COACH",lastSim.priority_competency||"MANAJERIAL");
  document.querySelectorAll("[data-review]").forEach(b=>b.onclick=()=>openReview(b.dataset.review));
 }catch(e){alert(e.message||e)}
}
async function startAttempt(mode,target=null){
 try{
  const isSim=mode==="SIMULASI",mins=isSim?120:30,total=isSim?70:10;
  let qnos=isSim?shuffle(Q.map(x=>x[0])):shuffle(Q.filter(x=>x[1]===target).map(x=>x[0])).slice(0,10);
  const payload={user_id:profile().id,mode,target_competency:isSim?null:target,expires_at:new Date(Date.now()+mins*60000).toISOString(),total_questions:total};
  const {data:a,error}=await sb.from("bcks_substansi_attempts").insert(payload).select("*").single();if(error)throw error;
  const rows=qnos.map(n=>({attempt_id:a.id,question_no:n,user_id:profile().id,selected_option:null,is_doubtful:false,seconds_spent:0}));
  const ins=await sb.from("bcks_substansi_answers").insert(rows);if(ins.error)throw ins.error;
  localStorage.setItem("bcksAttemptOrder:"+a.id,JSON.stringify(qnos));
  await beginAttempt(a,qnos,new Map());
 }catch(e){alert(e.message||e)}
}
async function resumeAttempt(a){
 try{
  const {data:rows,error}=await sb.from("bcks_substansi_answers").select("*").eq("attempt_id",a.id);if(error)throw error;
  let order=[];try{order=JSON.parse(localStorage.getItem("bcksAttemptOrder:"+a.id)||"[]")}catch{}
  const existing=(rows||[]).map(x=>Number(x.question_no));
  if(!order.length||order.some(n=>!existing.includes(Number(n))))order=shuffle(existing);
  const map=new Map((rows||[]).map(x=>[Number(x.question_no),x]));
  await beginAttempt(a,order,map);
 }catch(e){alert(e.message||e)}
}
async function beginAttempt(attempt,order,answers){
 state={attempt,order,index:0,answers,questionStart:Date.now()};
 modal(attempt.mode==="SIMULASI"?"CBT Seleksi Substansi • 70 Soal":"AI Coach Adaptif • "+attempt.target_competency,"<div id=\"bcksAttemptRoot\"></div>");
 renderQuestion();startTimer();
}
function startTimer(){
 clearInterval(timer);
 const tick=()=>{
  if(!state)return;
  const left=Math.max(0,new Date(state.attempt.expires_at).getTime()-Date.now()),s=Math.ceil(left/1000),m=Math.floor(s/60),ss=s%60;
  if($("bcksSubTimer"))$("bcksSubTimer").textContent=String(m).padStart(2,"0")+":"+String(ss).padStart(2,"0");
  if(left<=0){clearInterval(timer);timer=null;finishAttempt(true)}
 };tick();timer=setInterval(tick,1000);
}
function renderQuestion(){
 const root=$("bcksAttemptRoot");if(!root||!state)return;
 const no=Number(state.order[state.index]),q=BYNO.get(no),ans=state.answers.get(no)||{},answered=state.order.filter(n=>state.answers.get(Number(n))?.selected_option).length;
 root.innerHTML=`<div class="bsub-grid"><div class="bsub-q"><div class="bsub-qnum">SOAL ${state.index+1} DARI ${state.order.length} • ${esc(q[1])}</div><div class="bsub-qtext">${esc(q[2])}</div>
 ${q[3].map((o,i)=>`<label class="bsub-opt"><input type="radio" name="bsubAns" value="${LETTERS[i]}" ${ans.selected_option===LETTERS[i]?"checked":""}><span class="bsub-letter">${LETTERS[i]}.</span><span>${esc(o)}</span></label>`).join("")}
 <div class="bsub-bottom"><button class="bsub-btn soft" id="bsubPrev" ${state.index===0?"disabled":""}>← Sebelumnya</button><button class="bsub-btn ${ans.is_doubtful?"warn":"soft"}" id="bsubDoubt">${ans.is_doubtful?"★ Ragu-ragu":"☆ Tandai Ragu-ragu"}</button><button class="bsub-btn" id="bsubNext">${state.index===state.order.length-1?"Ke Ringkasan":"Berikutnya →"}</button></div></div>
 <div class="bsub-side"><b>Progres</b><div class="bsub-note">${answered}/${state.order.length} terjawab</div><div class="bsub-nav">${state.order.map((n,i)=>{const a=state.answers.get(Number(n))||{};return `<button class="bsub-num ${a.selected_option?"ans":""} ${a.is_doubtful?"doubt":""} ${i===state.index?"active":""}" data-qidx="${i}">${i+1}</button>`}).join("")}</div><div class="bsub-actions"><button class="bsub-btn warn" id="bsubFinish">Selesai & Nilai</button></div><div class="bsub-note" style="margin-top:8px">Jawaban tersimpan otomatis. Kunci tetap berada di server sampai sesi dikirim.</div></div></div>`;
 document.querySelectorAll('input[name="bsubAns"]').forEach(r=>r.onchange=()=>saveAnswer(no,r.value,null));
 $("bsubDoubt").onclick=()=>saveAnswer(no,ans.selected_option??null,!ans.is_doubtful);
 $("bsubPrev").onclick=()=>goto(state.index-1);
 $("bsubNext").onclick=()=>state.index===state.order.length-1?summaryAttempt():goto(state.index+1);
 $("bsubFinish").onclick=()=>finishAttempt(false);
 document.querySelectorAll("[data-qidx]").forEach(b=>b.onclick=()=>goto(Number(b.dataset.qidx)));
 state.questionStart=Date.now();
}
async function saveAnswer(no,selected,doubt){
 if(!state)return;
 const old=state.answers.get(Number(no))||{question_no:Number(no),selected_option:null,is_doubtful:false,seconds_spent:0};
 const spent=Math.min(7200,Number(old.seconds_spent||0)+Math.max(0,Math.round((Date.now()-state.questionStart)/1000)));
 const patch={selected_option:selected===undefined?old.selected_option:selected,is_doubtful:doubt===null?!!old.is_doubtful:!!doubt,seconds_spent:spent,answered_at:new Date().toISOString()};
 const {error}=await sb.from("bcks_substansi_answers").update(patch).eq("attempt_id",state.attempt.id).eq("question_no",Number(no));
 if(error){alert("Jawaban belum tersimpan: "+error.message);return}
 state.answers.set(Number(no),{...old,...patch});state.questionStart=Date.now();renderQuestion();
}
function goto(i){if(!state)return;state.index=Math.max(0,Math.min(state.order.length-1,i));renderQuestion()}
function summaryAttempt(){
 if(!state)return;const answered=state.order.filter(n=>state.answers.get(Number(n))?.selected_option).length,doubt=state.order.filter(n=>state.answers.get(Number(n))?.is_doubtful).length;
 $("bcksAttemptRoot").innerHTML=`<div class="bsub-card"><h3>Ringkasan Jawaban</h3><div class="bsub-home"><div class="bsub-stat"><div class="bsub-label">Terjawab</div><div class="bsub-numstat">${answered}</div></div><div class="bsub-stat"><div class="bsub-label">Belum</div><div class="bsub-numstat">${state.order.length-answered}</div></div><div class="bsub-stat"><div class="bsub-label">Ragu-ragu</div><div class="bsub-numstat">${doubt}</div></div></div><div class="bsub-actions"><button class="bsub-btn soft" id="bsubBackQ">Kembali ke Soal</button><button class="bsub-btn warn" id="bsubSubmitFinal">Kirim & Nilai</button></div></div>`;
 $("bsubBackQ").onclick=()=>renderQuestion();$("bsubSubmitFinal").onclick=()=>finishAttempt(false);
}
async function finishAttempt(auto=false){
 if(!state)return;const a=state.attempt;
 if(!auto&&!confirm("Kirim jawaban dan akhiri sesi? Setelah dikirim jawaban tidak dapat diubah."))return;
 try{
  const data=await api({action:"finish",attempt_id:a.id});
  clearInterval(timer);timer=null;localStorage.removeItem("bcksAttemptOrder:"+a.id);
  const att=data.attempt,scores=data.scores||[],coach=data.coach||{};
  state=null;
  $("bcksSubTimer").textContent="";
  $("bcksSubModalBody").innerHTML=`<div class="bsub-home"><div class="bsub-stat"><div class="bsub-label">Nilai latihan</div><div class="bsub-numstat">${pct(att.score)}</div></div><div class="bsub-stat"><div class="bsub-label">Benar</div><div class="bsub-numstat">${att.correct_count}/${att.total_questions}</div></div><div class="bsub-stat"><div class="bsub-label">Status</div><div style="font-size:17px;font-weight:950;color:#0f3f76;margin-top:8px">${esc(fmtRead(att.readiness_label))}</div></div><div class="bsub-stat"><div class="bsub-label">Prioritas</div><div style="font-size:17px;font-weight:950;color:#0f3f76;margin-top:8px">${esc(coach.priority_label||att.priority_competency||"-")}</div></div>
  <div class="bsub-card bsub-half" style="margin:0"><h3>Peta Kompetensi</h3><table class="bsub-table"><tbody>${scores.map(s=>`<tr><td>${esc(s.competency)}</td><td><b>${pct(s.percentage)}%</b></td><td>${s.correct_count}/${s.total_count}</td></tr>`).join("")}</tbody></table></div>
  <div class="bsub-card bsub-half" style="margin:0"><h3>🧠 AI Coach</h3><div class="bsub-note">${esc(coach.diagnosis||"Pertahankan konsistensi pengambilan keputusan profesional.")}</div>${coach.next_target?'<div class="bsub-actions"><button class="bsub-btn warn" id="bsubCoachNow">Latihan 10 Kasus '+esc(coach.priority_label||coach.next_target)+'</button></div>':""}</div>
  <div class="bsub-card bsub-wide" style="margin:0"><b>Catatan</b><div class="bsub-note">${esc(data.note||"Indikator latihan SIMANTAB, bukan passing grade resmi.")}</div><div class="bsub-actions"><button class="bsub-btn soft" id="bsubReviewNow">Mengapa Saya Salah?</button><button class="bsub-btn" id="bsubHomeNow">Kembali ke Beranda Latihan</button></div></div></div>`;
  if(coach.next_target)$("bsubCoachNow").onclick=()=>startAttempt("COACH",coach.next_target);
  $("bsubReviewNow").onclick=()=>openReview(att.id);$("bsubHomeNow").onclick=()=>openHome();
 }catch(e){alert(e.message||e)}
}
async function openReview(id){
 try{
  const data=await api({action:"review",attempt_id:id}),rows=data.review||[];
  modal("Bedah Hasil • Mengapa Saya Salah?",`<div class="bsub-card"><h3>Analisis Keputusan</h3><div class="bsub-note">Pembahasan muncul setelah sesi dikirim. Fokusnya bukan menghafal huruf jawaban, tetapi memahami pola keputusan kepala sekolah.</div></div>${rows.map(r=>{const q=BYNO.get(Number(r.question_no)),sel=q?.[3]?.[LETTERS.indexOf(r.selected_option)],cor=q?.[3]?.[LETTERS.indexOf(r.correct_option)];return `<div class="bsub-review ${r.is_correct?"good":"bad"}"><div class="bsub-qnum">SOAL ${r.question_no} • ${esc(r.competency)}</div><div style="font-weight:850;margin:5px 0">${esc(q?.[2]||"")}</div><div class="${r.is_correct?"bsub-ok":"bsub-bad"}">${r.is_correct?"✓ Tepat":"✕ Perlu diperbaiki"}</div><div class="bsub-note">Jawaban Anda: <b>${esc(r.selected_option||"-")}</b> ${esc(sel||"")}</div>${r.is_correct?"":`<div class="bsub-note">Pilihan yang lebih tepat: <b>${esc(r.correct_option)}</b> ${esc(cor||"")}</div><div class="bsub-note" style="margin-top:6px"><b>Mengapa?</b> ${esc(r.why_wrong||"")}</div>`}</div>`}).join("")}<div class="bsub-actions"><button class="bsub-btn" id="bsubBackHome">Kembali</button></div>`);
  $("bsubBackHome").onclick=()=>openHome();
 }catch(e){alert(e.message||e)}
}
async function openLeader(){
 try{
  modal("Peta Kesiapan BCKS • Seleksi Substansi","<div class=\"bsub-card\">Memuat agregat…</div>");
  const d=await api({action:"kabid_summary"});
  $("bcksSubModalBody").innerHTML=`<div class="bsub-home">
   <div class="bsub-stat"><div class="bsub-label">Peserta aktif</div><div class="bsub-numstat">${d.participants}</div></div>
   <div class="bsub-stat"><div class="bsub-label">Sudah simulasi</div><div class="bsub-numstat">${d.attempted}</div></div>
   <div class="bsub-stat"><div class="bsub-label">Belum</div><div class="bsub-numstat">${d.not_attempted}</div></div>
   <div class="bsub-stat"><div class="bsub-label">Rata-rata</div><div class="bsub-numstat">${pct(d.average_score)}</div></div>
   <div class="bsub-card bsub-half" style="margin:0"><h3>Indeks Kesiapan</h3><table class="bsub-table"><tbody><tr><td>Sangat Siap</td><td><b>${d.readiness.SANGAT_SIAP||0}</b></td></tr><tr><td>Siap</td><td><b>${d.readiness.SIAP||0}</b></td></tr><tr><td>Perlu Penguatan</td><td><b>${d.readiness.PERLU_PENGUATAN||0}</b></td></tr><tr><td>Perlu Pendampingan Intensif</td><td><b>${d.readiness.PERLU_PENDAMPINGAN_INTENSIF||0}</b></td></tr></tbody></table></div>
   <div class="bsub-card bsub-half" style="margin:0"><h3>Peta 5 Kompetensi</h3><table class="bsub-table"><thead><tr><th>Kompetensi</th><th>Rerata</th><th>&lt;70</th></tr></thead><tbody>${(d.competencies||[]).map(x=>`<tr><td>${esc(x.label)}</td><td><b>${pct(x.average)}%</b></td><td>${x.below70}</td></tr>`).join("")}</tbody></table></div>
   <div class="bsub-card bsub-wide" style="margin:0"><b>Interpretasi</b><div class="bsub-note">Ringkasan memakai simulasi terakhir setiap peserta. Gunakan untuk menentukan materi pembekalan; jangan digunakan sebagai keputusan lulus/tidak lulus resmi.</div></div>
  </div>`;
 }catch(e){alert(e.message||e);closeModal()}
}

style();
for(const ms of [100,400,900,1800])setTimeout(()=>{installObserver();injectCard()},ms);
window.__simantabBcksSubstansiSimulator={version:1,questions:70,durationMinutes:120,coachQuestions:10,answerKey:"SERVER_ONLY",officialPassingGrade:false};
})();