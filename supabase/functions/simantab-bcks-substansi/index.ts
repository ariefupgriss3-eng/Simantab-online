import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const CORS={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Content-Type":"application/json"
};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:CORS});
const COMP_ORDER=["KEPRIBADIAN","SOSIAL","MANAJERIAL","KEWIRAUSAHAAN","SUPERVISI"];
const LABEL:any={
  KEPRIBADIAN:"Kepribadian",SOSIAL:"Sosial",MANAJERIAL:"Manajerial",
  KEWIRAUSAHAAN:"Kewirausahaan",SUPERVISI:"Supervisi"
};
const READINESS=(score:number)=>score>=90?"SANGAT_SIAP":score>=80?"SIAP":score>=70?"PERLU_PENGUATAN":"PERLU_PENDAMPINGAN_INTENSIF";
const mistakeMessage=(sub:string)=>{
 const map:any={
  kematangan_emosi:"Perkuat kemampuan menahan reaksi awal dan memisahkan substansi masalah dari emosi atau gengsi jabatan.",
  integritas_keadilan:"Pastikan kedekatan, tekanan, atau status pihak tertentu tidak mengubah standar keputusan.",
  refleksi:"Biasakan mengakui hasil yang belum berhasil, mencari penyebab, lalu memperbaiki tindakan.",
  verifikasi_fakta:"Hindari tindakan korektif sebelum fakta dan konteks diverifikasi.",
  orientasi_murid:"Kembalikan keputusan pada kepentingan peserta didik, integritas, data, dan aturan.",
  dialog_orang_tua:"Gunakan dialog berbasis data untuk menyelaraskan kepentingan sekolah, guru, orang tua, dan siswa.",
  konflik_kepentingan:"Pisahkan dukungan kemitraan dari kepentingan penyedia atau kelompok tertentu.",
  kolaborasi_inovasi:"Uji gagasan secara terbatas, bangun kepemilikan bersama, lalu evaluasi dampaknya.",
  mediasi_konflik:"Fasilitasi kepentingan bersama dan kembalikan konflik pada tujuan pendidikan.",
  prioritas_anggaran:"Prioritaskan kebutuhan berdasarkan data, urgensi, legalitas, dan dampak pada pembelajaran.",
  analisis_akar_masalah:"Jangan melompat ke solusi. Gunakan pola Data → Diagnosis → Intervensi → Evaluasi.",
  evaluasi_program:"Nilai program dari dampaknya, bukan dari banyaknya kegiatan atau biaya yang sudah dikeluarkan.",
  keputusan_berbasis_bukti:"Periksa validitas data sekaligus konteks lapangan sebelum mengambil keputusan.",
  tata_kelola_sumber_daya:"Utamakan efektivitas, transparansi, akuntabilitas, dan dampak pada mutu layanan.",
  belajar_dari_kegagalan:"Perlakukan kegagalan terukur sebagai informasi untuk memperbaiki desain inovasi.",
  mindset_entrepreneurial:"Kewirausahaan pendidikan berarti melihat peluang, menciptakan nilai pendidikan, dan mengelola risiko.",
  teknologi_berbasis_masalah:"Mulai dari masalah pendidikan yang ingin diselesaikan, bukan dari daya tarik teknologinya.",
  manajemen_risiko:"Risiko inovasi perlu diidentifikasi, dimitigasi, dan dipantau—bukan dihindari atau diambil tanpa batas.",
  umpan_balik_berbasis_bukti:"Gunakan bukti observasi yang spesifik untuk mendorong refleksi dan perbaikan praktik guru.",
  tujuan_supervisi:"Supervisi berorientasi pada perbaikan pembelajaran dan dampaknya pada peserta didik, bukan kelengkapan administrasi.",
  tindak_lanjut:"Supervisi belum selesai pada observasi; identifikasi hambatan dan sepakati langkah perbaikan.",
  keterlibatan_murid:"Nilai mutu pembelajaran dari interaksi, strategi, keterlibatan, dan pengalaman belajar siswa.",
  diferensiasi:"Sesuaikan strategi dengan kebutuhan belajar tanpa menurunkan standar untuk seluruh kelas."
 };
 return map[sub]||"Perkuat pola keputusan yang berbasis bukti, etis, kolaboratif, akuntabel, dan berpihak pada peserta didik.";
};

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:CORS});
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 try{
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
  if(!token) return json({error:"Unauthorized"},401);
  const url=Deno.env.get("SUPABASE_URL")!;
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:{user},error:ue}=await admin.auth.getUser(token);
  if(ue||!user) return json({error:"Unauthorized"},401);

  const {data:profile,error:pe}=await admin.from("profiles")
    .select("id,role,account_channel,is_active,full_name")
    .eq("id",user.id).maybeSingle();
  if(pe||!profile?.is_active) return json({error:"Akun tidak aktif atau profil tidak tersedia."},403);

  const body=await req.json().catch(()=>({}));
  const action=String(body?.action||"").trim();

  const isDinas=String(profile.account_channel||"").toUpperCase()==="DINAS";
  const leaderRoles=new Set(["SUPER_ADMIN","KEPALA_DINAS","SEKRETARIS_DINAS","KABID"]);
  const isLeader=isDinas&&leaderRoles.has(String(profile.role||""));

  if(action==="finish"){
    const attemptId=String(body?.attempt_id||"").trim();
    if(!attemptId) return json({error:"attempt_id wajib."},400);
    const {data:attempt,error:ae}=await admin.from("bcks_substansi_attempts")
      .select("*").eq("id",attemptId).maybeSingle();
    if(ae||!attempt) return json({error:"Sesi latihan tidak ditemukan."},404);
    if(attempt.user_id!==user.id) return json({error:"Tidak berwenang."},403);
    if(attempt.status==="SUBMITTED"){
      const {data:scores}=await admin.from("bcks_substansi_competency_scores")
        .select("competency,correct_count,total_count,percentage").eq("attempt_id",attemptId);
      return json({ok:true,already_submitted:true,attempt,scores:scores||[]});
    }
    if(attempt.status!=="IN_PROGRESS") return json({error:"Sesi sudah tidak aktif."},409);

    const now=Date.now(), expiry=new Date(attempt.expires_at).getTime();
    if(now>expiry+5*60*1000){
      await admin.from("bcks_substansi_attempts").update({status:"EXPIRED"}).eq("id",attemptId);
      return json({error:"Waktu sesi telah berakhir terlalu lama. Mulai sesi baru."},409);
    }

    const [{data:keys,error:ke},{data:answers,error:ansE}]=await Promise.all([
      admin.from("bcks_substansi_answer_keys").select("question_no,competency,subcompetency,correct_option").order("question_no"),
      admin.from("bcks_substansi_answers").select("question_no,selected_option,is_doubtful,seconds_spent").eq("attempt_id",attemptId)
    ]);
    if(ke||ansE) throw ke||ansE;
    const answerMap=new Map((answers||[]).map((a:any)=>[Number(a.question_no),a]));
    let evaluated:any[]=[];
    if(attempt.mode==="SIMULASI"){
      evaluated=(keys||[]).map((k:any)=>{
        const a:any=answerMap.get(Number(k.question_no));
        return {...k,selected_option:a?.selected_option||null,is_doubtful:!!a?.is_doubtful,seconds_spent:Number(a?.seconds_spent||0)};
      });
    }else{
      const target=String(attempt.target_competency||"");
      const allowed=new Map((keys||[]).filter((k:any)=>k.competency===target).map((k:any)=>[Number(k.question_no),k]));
      evaluated=(answers||[]).slice(0,Number(attempt.total_questions||10)).map((a:any)=>{
        const k:any=allowed.get(Number(a.question_no));
        return k?{...k,selected_option:a.selected_option||null,is_doubtful:!!a.is_doubtful,seconds_spent:Number(a.seconds_spent||0)}:null;
      }).filter(Boolean);
      if(evaluated.length>Number(attempt.total_questions||10)) evaluated=evaluated.slice(0,Number(attempt.total_questions||10));
    }

    const total=Number(attempt.total_questions||evaluated.length||1);
    const correct=evaluated.filter((x:any)=>x.selected_option===x.correct_option).length;
    const score=Math.round((correct/total)*10000)/100;
    const scoreRows=COMP_ORDER.map(comp=>{
      const rows=evaluated.filter((x:any)=>x.competency===comp);
      if(!rows.length) return null;
      const c=rows.filter((x:any)=>x.selected_option===x.correct_option).length;
      return {attempt_id:attemptId,user_id:user.id,competency:comp,correct_count:c,total_count:rows.length,percentage:Math.round(c/rows.length*10000)/100};
    }).filter(Boolean);

    const wrong=evaluated.filter((x:any)=>x.selected_option!==x.correct_option);
    const subCounts=new Map<string,number>();
    for(const x of wrong) subCounts.set(x.subcompetency,(subCounts.get(x.subcompetency)||0)+1);
    const dominantSub=[...subCounts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||null;
    const priority=scoreRows.length?[...scoreRows].sort((a:any,b:any)=>Number(a.percentage)-Number(b.percentage)||COMP_ORDER.indexOf(a.competency)-COMP_ORDER.indexOf(b.competency))[0].competency:null;
    const readiness=READINESS(score);

    if(scoreRows.length){
      const {error:se}=await admin.from("bcks_substansi_competency_scores").upsert(scoreRows,{onConflict:"attempt_id,competency"});
      if(se) throw se;
    }
    const {data:updated,error:upE}=await admin.from("bcks_substansi_attempts").update({
      submitted_at:new Date().toISOString(),status:"SUBMITTED",correct_count:correct,score,
      readiness_label:readiness,priority_competency:priority,dominant_subcompetency:dominantSub
    }).eq("id",attemptId).select("*").single();
    if(upE) throw upE;

    return json({
      ok:true,attempt:updated,scores:scoreRows,
      coach:{
        priority_competency:priority,
        priority_label:priority?LABEL[priority]:null,
        dominant_subcompetency:dominantSub,
        diagnosis:dominantSub?mistakeMessage(dominantSub):"Pertahankan konsistensi pengambilan keputusan yang berbasis bukti dan berpihak pada peserta didik.",
        next_target:priority
      },
      note:"Indeks kesiapan ini adalah indikator latihan SIMANTAB, bukan passing grade resmi Kemendikdasmen."
    });
  }

  if(action==="review"){
    const attemptId=String(body?.attempt_id||"").trim();
    const {data:attempt}=await admin.from("bcks_substansi_attempts").select("*").eq("id",attemptId).maybeSingle();
    if(!attempt||attempt.status!=="SUBMITTED") return json({error:"Hasil belum tersedia."},409);
    if(attempt.user_id!==user.id&&!isDinas) return json({error:"Tidak berwenang."},403);
    const [{data:keys},{data:answers}]=await Promise.all([
      admin.from("bcks_substansi_answer_keys").select("question_no,competency,subcompetency,correct_option"),
      admin.from("bcks_substansi_answers").select("question_no,selected_option,is_doubtful,seconds_spent").eq("attempt_id",attemptId)
    ]);
    const keyMap=new Map((keys||[]).map((x:any)=>[Number(x.question_no),x]));
    const rows=(answers||[]).map((a:any)=>{
      const k:any=keyMap.get(Number(a.question_no));
      if(!k) return null;
      return {
        question_no:Number(a.question_no),selected_option:a.selected_option||null,correct_option:k.correct_option,
        is_correct:a.selected_option===k.correct_option,competency:k.competency,subcompetency:k.subcompetency,
        is_doubtful:!!a.is_doubtful,seconds_spent:Number(a.seconds_spent||0),
        why_wrong:a.selected_option===k.correct_option?null:mistakeMessage(k.subcompetency)
      };
    }).filter(Boolean).sort((a:any,b:any)=>a.question_no-b.question_no);
    return json({ok:true,attempt,review:rows});
  }

  if(action==="coach"){
    const attemptId=String(body?.attempt_id||"").trim();
    const {data:attempt}=await admin.from("bcks_substansi_attempts").select("*").eq("id",attemptId).maybeSingle();
    if(!attempt||attempt.user_id!==user.id||attempt.status!=="SUBMITTED") return json({error:"Hasil latihan tidak tersedia."},404);
    const {data:scores}=await admin.from("bcks_substansi_competency_scores")
      .select("competency,correct_count,total_count,percentage").eq("attempt_id",attemptId);
    const priority=attempt.priority_competency||([...scores||[]].sort((a:any,b:any)=>Number(a.percentage)-Number(b.percentage))[0]?.competency)||null;
    return json({
      ok:true,
      engine:"SIMANTAB_AI_COACH_RULE_ADAPTIVE_V1",
      priority_competency:priority,
      priority_label:priority?LABEL[priority]:null,
      dominant_subcompetency:attempt.dominant_subcompetency,
      diagnosis:attempt.dominant_subcompetency?mistakeMessage(attempt.dominant_subcompetency):"Pertahankan pola keputusan profesional dan berbasis bukti.",
      recommendation:priority?"Lanjutkan 10 kasus adaptif pada kompetensi "+LABEL[priority]+". Fokuskan alasan pilihan sebelum melihat pembahasan.":"Lanjutkan latihan campuran untuk menjaga konsistensi.",
      note:"AI Coach menganalisis pola jawaban latihan; bukan penilaian resmi Kemendikdasmen."
    });
  }

  if(action==="kabid_summary"){
    if(!isLeader) return json({error:"Ringkasan agregat hanya tersedia untuk pimpinan Dinas yang berwenang."},403);
    const {data:participants,error:ppE}=await admin.from("ks_bcks_submission_details")
      .select("user_id,workflow_stage,admin_status,is_archived")
      .eq("is_archived",false)
      .in("workflow_stage",["SUBSTANSI","DIKLAT","SERTIFIKAT"])
      .in("admin_status",["TERVERIFIKASI","DISETUJUI"]);
    if(ppE) throw ppE;
    const ids=[...new Set((participants||[]).map((x:any)=>x.user_id))];
    if(!ids.length) return json({ok:true,participants:0,attempted:0,readiness:{},average_score:0,competencies:[]});

    const {data:attempts,error:atE}=await admin.from("bcks_substansi_attempts")
      .select("id,user_id,score,readiness_label,submitted_at")
      .eq("mode","SIMULASI").eq("status","SUBMITTED").in("user_id",ids).order("submitted_at",{ascending:false});
    if(atE) throw atE;
    const latest=new Map<string,any>();
    for(const a of attempts||[]) if(!latest.has(a.user_id)) latest.set(a.user_id,a);
    const latestAttempts=[...latest.values()];
    const attemptIds=latestAttempts.map((a:any)=>a.id);
    let scoreRows:any[]=[];
    if(attemptIds.length){
      const {data,error}=await admin.from("bcks_substansi_competency_scores")
        .select("attempt_id,competency,percentage").in("attempt_id",attemptIds);
      if(error) throw error; scoreRows=data||[];
    }
    const readiness:any={SANGAT_SIAP:0,SIAP:0,PERLU_PENGUATAN:0,PERLU_PENDAMPINGAN_INTENSIF:0};
    for(const a of latestAttempts) if(a.readiness_label in readiness) readiness[a.readiness_label]++;
    const avg=latestAttempts.length?Math.round(latestAttempts.reduce((s:number,a:any)=>s+Number(a.score||0),0)/latestAttempts.length*100)/100:0;
    const competencies=COMP_ORDER.map(comp=>{
      const xs=scoreRows.filter((x:any)=>x.competency===comp).map((x:any)=>Number(x.percentage||0));
      return {competency:comp,label:LABEL[comp],average:xs.length?Math.round(xs.reduce((a:number,b:number)=>a+b,0)/xs.length*100)/100:0,count:xs.length,below70:xs.filter((x:number)=>x<70).length};
    });
    return json({
      ok:true,participants:ids.length,attempted:latestAttempts.length,not_attempted:Math.max(0,ids.length-latestAttempts.length),
      readiness,average_score:avg,competencies,
      note:"Ringkasan menggunakan simulasi terakhir tiap peserta. Kategori adalah indikator latihan SIMANTAB, bukan passing grade resmi."
    });
  }

  return json({error:"Action tidak dikenali."},400);
 }catch(e:any){
  console.error("BCKS_SUBSTANSI_ERROR",e?.message||String(e));
  return json({error:e?.message||String(e)},400);
 }
});
