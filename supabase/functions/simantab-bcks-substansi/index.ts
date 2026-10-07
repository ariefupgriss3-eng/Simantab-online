import { ITEM_LEARNING } from "./learning.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const CORS={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Content-Type":"application/json"
};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:CORS});
const THINKING_SESSIONS=[{"level":1,"date":"2026-10-03","start_time":"09:00","end_time":"15:00","label":"Basic","questions":[101,102,103,104,105,106,107,2,4,5,6,8,9,202,115,116,117,118,119,120,121,15,17,18,19,21,22,216,129,130,131,132,133,134,135,31,32,33,34,35,37,229,143,144,145,146,147,148,149,43,44,45,46,47,243,244,157,158,159,160,161,162,163,58,60,61,62,63,257,258],"difficulty_composition":{"mudah":35,"sedang":28,"sulit":7}},{"level":2,"date":"2026-10-05","start_time":"13:00","end_time":"16:00","label":"Premium One","questions":[1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070],"difficulty_composition":{"mudah":21,"sedang":28,"sulit":21}},{"level":3,"date":"2026-10-08","start_time":"13:00","end_time":"16:00","label":"Premium Two","questions":[2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070],"difficulty_composition":{"mudah":0,"sedang":28,"sulit":42}},{"level":4,"date":"2026-10-10","start_time":"09:00","end_time":"12:00","label":"Pro","questions":[112,113,114,210,213,208,209,211,212,214,1,3,7,10,126,127,128,218,220,222,225,226,227,228,16,20,24,26,140,141,142,233,238,242,237,239,240,241,29,30,36,40,154,155,156,248,252,256,251,253,254,255,48,50,53,55,169,170,264,267,269,263,265,266,268,270,57,59,66,70],"difficulty_composition":{"mudah":14,"sedang":14,"sulit":42}},{"level":30,"date":"2099-01-01","start_time":"00:00","end_time":"23:59","label":"Premium Two • Uji","questions":[2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070],"difficulty_composition":{"mudah":0,"sedang":28,"sulit":42},"test_only":true}];
const sessionStart=(s:any)=>Date.parse(s.date+"T"+(s.start_time||"09:00")+":00+07:00");
const sessionEnd=(s:any)=>Date.parse(s.date+"T"+(s.end_time||"15:00")+":00+07:00");
const activeSession=(now=Date.now())=>THINKING_SESSIONS.find((s:any)=>!s.test_only&&now>=sessionStart(s)&&now<sessionEnd(s));
const sessionOpen=(gate:any,session:any)=>!!session&&(Date.parse(gate?.updated_at||"")>=sessionStart(session)?!!gate?.is_open:true);
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
  const role=String(profile.role||"");
  const leaderRoles=new Set(["SUPER_ADMIN","KEPALA_DINAS","SEKRETARIS_DINAS","KABID"]);
  const readinessRoles=new Set(["SUPER_ADMIN","KEPALA_DINAS","SEKRETARIS_DINAS","KABID","KASI_SD","KASI_SMP","SUBKOOR_TK"]);
  const isLeader=isDinas&&leaderRoles.has(role);
  const canViewReadiness=isDinas&&readinessRoles.has(role);
  const isKabid=isDinas&&role==="KABID";
  const scopeLevels:string[]|null=
    role==="KASI_SD"?["SD"]:
    role==="KASI_SMP"?["SMP"]:
    role==="SUBKOOR_TK"?["PAUD","TK"]:
    null;
  const scopeLabel=
    role==="KASI_SD"?"Jenjang SD":
    role==="KASI_SMP"?"Jenjang SMP":
    role==="SUBKOOR_TK"?"Jenjang TK/PAUD":
    "Semua Jenjang";

  const loadScopedParticipants=async()=>{
    const {data:rows,error:e1}=await admin.from("ks_bcks_submission_details")
      .select("user_id,full_name,unit_kerja,workflow_stage,admin_status,is_archived")
      .eq("is_archived",false)
      .in("workflow_stage",["SUBSTANSI","DIKLAT","SERTIFIKAT"])
      .in("admin_status",["TERVERIFIKASI","DISETUJUI"]);
    if(e1) throw e1;
    const base=rows||[];
    const ids=[...new Set(base.map((x:any)=>x.user_id).filter(Boolean))];
    if(!ids.length) return [];

    const {data:profiles,error:e2}=await admin.from("profiles")
      .select("id,school_npsn").in("id",ids);
    if(e2) throw e2;
    const npsns=[...new Set((profiles||[]).map((x:any)=>x.school_npsn).filter(Boolean))];
    let schools:any[]=[];
    if(npsns.length){
      const {data,error}=await admin.from("school_master")
        .select("npsn,school_name,jenjang").in("npsn",npsns);
      if(error) throw error;
      schools=data||[];
    }
    const profMap=new Map((profiles||[]).map((x:any)=>[x.id,x]));
    const schoolMap=new Map(schools.map((x:any)=>[x.npsn,x]));
    const enriched=base.map((x:any)=>{
      const p:any=profMap.get(x.user_id);
      const s:any=p?.school_npsn?schoolMap.get(p.school_npsn):null;
      return {
        user_id:x.user_id,
        full_name:x.full_name||"",
        unit_kerja:x.unit_kerja||s?.school_name||"",
        school_npsn:p?.school_npsn||null,
        school_name:s?.school_name||x.unit_kerja||"",
        jenjang:String(s?.jenjang||"").toUpperCase()||"TIDAK_TERPETAKAN"
      };
    });
    return scopeLevels
      ? enriched.filter((x:any)=>scopeLevels.includes(x.jenjang))
      : enriched;
  };

  const canViewTarget=async(targetUserId:string)=>{
    if(targetUserId===user.id) return true;
    if(!canViewReadiness) return false;
    if(!scopeLevels) return true;
    const {data:p}=await admin.from("profiles").select("school_npsn").eq("id",targetUserId).maybeSingle();
    if(!p?.school_npsn) return false;
    const {data:s}=await admin.from("school_master").select("jenjang").eq("npsn",p.school_npsn).maybeSingle();
    return !!s?.jenjang&&scopeLevels.includes(String(s.jenjang).toUpperCase());
  };

  if(action==="access_status"){
    const {data:eligRow}=await admin.from("ks_bcks_submission_details")
      .select("workflow_stage,admin_status,is_archived,full_name,unit_kerja").eq("user_id",user.id).maybeSingle();
    const participantEligible=!!eligRow&&!eligRow.is_archived
      &&["SUBSTANSI","DIKLAT","SERTIFIKAT"].includes(String(eligRow.workflow_stage||""))
      &&["TERVERIFIKASI","DISETUJUI"].includes(String(eligRow.admin_status||""));
    const {data:gate,error:ge}=await admin.from("bcks_substansi_access_control")
      .select("is_open,opened_at,opened_by,updated_at,note")
      .eq("singleton_key","GLOBAL").maybeSingle();
    if(ge) throw ge;
    const {data:test}=await admin.from("bcks_substansi_test_access").select("session_level,starts_at,expires_at").eq("user_id",user.id).maybeSingle();
    const testActive=!!test&&Date.now()>=Date.parse(test.starts_at)&&Date.now()<Date.parse(test.expires_at);
    return json({
      ok:true,
      server_now:new Date().toISOString(),
      participant_eligible:participantEligible,
      participant_identity:{
        full_name:String(eligRow?.full_name||profile?.full_name||"").trim(),
        unit_kerja:String(eligRow?.unit_kerja||"").trim()
      },
      is_open:testActive||sessionOpen(gate,activeSession()),
      session:testActive?THINKING_SESSIONS.find(s=>s.level===test.session_level):activeSession()||null,
      is_test:testActive,test_expires_at:testActive?test.expires_at:null,
      sessions:THINKING_SESSIONS.filter((s:any)=>!s.test_only),
      opened_at:gate?.opened_at||null,
      updated_at:gate?.updated_at||null,
      can_manage:isKabid,
      can_view_readiness:canViewReadiness,
      scope_label:scopeLabel,
      scope_levels:scopeLevels,
      note:gate?.note||null
    });
  }

  if(action==="set_access"){
    if(!activeSession())return json({error:"Kontrol manual Kabid hanya tersedia selama jendela sesi terjadwal yang sedang aktif."},409);
    if(!isKabid) return json({error:"Hanya Kabid yang dapat membuka atau menutup akses simulasi Seleksi Substansi."},403);
    const open=body?.open===true;
    const nowIso=new Date().toISOString();
    const payload:any={
      is_open:open,
      updated_by:user.id,
      updated_at:nowIso,
      note:open
        ?"Akses simulasi Seleksi Substansi BCKS dibuka oleh Kabid."
        :"Akses simulasi Seleksi Substansi BCKS ditutup oleh Kabid."
    };
    if(open){
      payload.opened_by=user.id;
      payload.opened_at=nowIso;
    }else{
      payload.opened_by=null;
      payload.opened_at=null;
    }
    const {data:gate,error:ge}=await admin.from("bcks_substansi_access_control")
      .update(payload).eq("singleton_key","GLOBAL")
      .select("is_open,opened_at,updated_at,note").single();
    if(ge) throw ge;
    return json({ok:true,is_open:!!gate.is_open,opened_at:gate.opened_at,updated_at:gate.updated_at,note:gate.note,can_manage:true});
  }

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
      const legacyStart=attempt.session_level===1?101:attempt.session_level===2?1001:(attempt.session_level===3||attempt.session_level===30)?2001:attempt.session_level===4?201:1;
      const pack={questions:attempt.package_questions||Array.from({length:70},(_,i)=>legacyStart+i)};
      evaluated=(keys||[]).filter((k:any)=>!pack||pack.questions.includes(Number(k.question_no))).map((k:any)=>{
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
    if(!(await canViewTarget(String(attempt.user_id)))) return json({error:"Tidak berwenang melihat hasil peserta ini."},403);
    const [{data:keys},{data:answers}]=await Promise.all([
      admin.from("bcks_substansi_answer_keys").select("question_no,competency,subcompetency,correct_option"),
      admin.from("bcks_substansi_answers").select("question_no,selected_option,is_doubtful,seconds_spent").eq("attempt_id",attemptId)
    ]);
    const keyMap=new Map((keys||[]).map((x:any)=>[Number(x.question_no),x]));
    const fallbackPack=attempt.mode==="SIMULASI"
      ? THINKING_SESSIONS.find((s:any)=>Number(s.level)===Number(attempt.session_level))?.questions||[]
      : [];
    const packageOrder=(Array.isArray(attempt.package_questions)&&attempt.package_questions.length
      ? attempt.package_questions
      : fallbackPack).map((n:any)=>Number(n));
    const orderMap=new Map(packageOrder.map((n:number,i:number)=>[n,i]));
    const rows=(answers||[]).map((a:any)=>{
      const qno=Number(a.question_no);
      const k:any=keyMap.get(qno);
      if(!k) return null;
      const learning=ITEM_LEARNING[String(qno)]||null;
      const orderIndex=orderMap.has(qno)?Number(orderMap.get(qno)):-1;
      return {
        question_no:qno,display_no:orderIndex>=0?orderIndex+1:null,
        selected_option:a.selected_option||null,correct_option:k.correct_option,
        is_correct:a.selected_option===k.correct_option,competency:k.competency,subcompetency:k.subcompetency,
        is_doubtful:!!a.is_doubtful,seconds_spent:Number(a.seconds_spent||0),
        learning,
        why_wrong:a.selected_option===k.correct_option?null:(learning?.comparison||mistakeMessage(k.subcompetency))
      };
    }).filter(Boolean).sort((a:any,b:any)=>{
      const ai=a.display_no==null?9999:Number(a.display_no);
      const bi=b.display_no==null?9999:Number(b.display_no);
      return ai-bi||a.question_no-b.question_no;
    });
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
    if(!canViewReadiness) return json({error:"Dashboard kesiapan hanya tersedia untuk pimpinan/Kasi/Subkoor yang berwenang."},403);

    const scopedParticipants=await loadScopedParticipants();
    const ids=[...new Set(scopedParticipants.map((x:any)=>x.user_id))];
    const nowMs=Date.now();
    const scheduled=THINKING_SESSIONS.filter((s:any)=>!s.test_only).sort((a:any,b:any)=>sessionStart(a)-sessionStart(b));
    const liveSession=activeSession(nowMs)||null;
    const nowIsoForMonitor=new Date(nowMs).toISOString();

    // Bila tidak ada sesi resmi yang sedang aktif tetapi terdapat akses khusus aktif,
    // monitor level akses khusus tersebut agar Premium Two/Pro langsung muncul di dashboard.
    let specialMonitorLevel:number|null=null;
    if(!liveSession&&ids.length){
      const {data:activeSpecialMonitor,error:activeSpecialMonitorErr}=await admin.from("bcks_substansi_test_access")
        .select("session_level,starts_at,expires_at")
        .lte("starts_at",nowIsoForMonitor).gt("expires_at",nowIsoForMonitor)
        .in("user_id",ids)
        .order("starts_at",{ascending:false})
        .limit(1);
      if(activeSpecialMonitorErr) throw activeSpecialMonitorErr;
      specialMonitorLevel=activeSpecialMonitor?.length?Number(activeSpecialMonitor[0].session_level):null;
    }

    const latestStarted=[...scheduled].reverse().find((s:any)=>sessionStart(s)<=nowMs)||null;
    const specialMonitorSession=specialMonitorLevel!=null
      ? THINKING_SESSIONS.find((s:any)=>Number(s.level)===specialMonitorLevel)||null
      : null;
    const monitorSession=liveSession||specialMonitorSession||latestStarted;
    const previousSession=monitorSession
      ? [...scheduled].filter((s:any)=>sessionStart(s)<sessionStart(monitorSession)).sort((a:any,b:any)=>sessionStart(b)-sessionStart(a))[0]||null
      : null;

    const emptyReadiness={SANGAT_SIAP:0,SIAP:0,PERLU_PENGUATAN:0,PERLU_PENDAMPINGAN_INTENSIF:0};
    const telemetryIndicator=(m:any)=>{
      if(!m||Number(m.event_count||0)===0) return "BELUM_ADA_DATA";
      const immediate=Number(m.immediate_answer_after_pause_count||0);
      const pauses=Number(m.unusual_pause_count||0);
      const switches=Number(m.tab_switch_count||0);
      const ratio=pauses>0?immediate/pauses:0;
      if(immediate>=5||(immediate>=3&&pauses>=5&&ratio>=0.60)) return "PRIORITAS_TELAAH";
      if(immediate>=2||(pauses>=10&&switches>=20)) return "PERLU_TELAAH";
      return "NORMAL";
    };

    if(!ids.length) return json({
      ok:true,scope_label:scopeLabel,scope_levels:scopeLevels,participants:0,attempted:0,not_attempted:0,
      readiness:emptyReadiness,average_score:0,competencies:[],individuals:[],
      session_monitoring:{
        session:monitorSession?{level:monitorSession.level,label:monitorSession.label,date:monitorSession.date,start_time:monitorSession.start_time,end_time:monitorSession.end_time}:null,
        is_active:!!liveSession,participants:0,not_started:0,in_progress:0,submitted:0,expired:0,individuals:[],
        telemetry:{tracked:0,normal:0,perlu_telaah:0,prioritas_telaah:0,note:"Telemetry adalah indikator perilaku untuk telaah manusia, bukan bukti otomatis kecurangan."}
      },
      previous_session:previousSession?{level:previousSession.level,label:previousSession.label}:null,
      telemetry:{tracked:0,normal:0,perlu_telaah:0,prioritas_telaah:0,note:"Telemetry adalah indikator perilaku untuk telaah manusia, bukan bukti otomatis kecurangan."},
      note:"Monitoring sesi aktif dipisahkan dari hasil sesi sebelumnya agar angka tidak tercampur."
    });

    // Monitoring sesi resmi + akses khusus yang sedang aktif pada level yang sama.
    // Attempt akses khusus ditampilkan pada daftar individu, tetapi dipisahkan dari statistik resmi.
    let currentRows:any[]=[];
    const activeSpecialAccessByUser=new Map<string,any>();
    if(monitorSession){
      const nowIso=new Date(nowMs).toISOString();
      const {data:specialRows,error:specialErr}=await admin.from("bcks_substansi_test_access")
        .select("user_id,session_level,starts_at,expires_at")
        .eq("session_level",Number(monitorSession.level))
        .lte("starts_at",nowIso).gt("expires_at",nowIso)
        .in("user_id",ids);
      if(specialErr) throw specialErr;
      for(const x of specialRows||[]) activeSpecialAccessByUser.set(String(x.user_id),x);

      const {data,error}=await admin.from("bcks_substansi_attempts")
        .select("id,user_id,status,session_level,started_at,expires_at,submitted_at,score,correct_count,total_questions,readiness_label,priority_competency,is_test,is_official_result")
        .eq("mode","SIMULASI").eq("session_level",Number(monitorSession.level))
        .in("user_id",ids).order("started_at",{ascending:false});
      if(error) throw error;
      currentRows=(data||[]).filter((a:any)=>a.is_test===false||(a.is_test===true&&activeSpecialAccessByUser.has(String(a.user_id))));
    }
    const currentByUser=new Map<string,any>();
    for(const a of currentRows){
      const key=String(a.user_id);
      const existing=currentByUser.get(key);
      const isActiveSpecial=a.is_test===true&&activeSpecialAccessByUser.has(key);
      const existingIsActiveSpecial=existing?.is_test===true&&activeSpecialAccessByUser.has(key);
      // Akses khusus aktif selalu diprioritaskan untuk tampilan individu.
      if(!existing||(!existingIsActiveSpecial&&isActiveSpecial)) currentByUser.set(key,a);
    }
    const currentAttempts=[...currentByUser.values()];
    const currentAttemptIds=currentAttempts.map((a:any)=>a.id);
    const officialCurrentAttempts=currentAttempts.filter((a:any)=>a.is_test===false);
    const specialCurrentAttempts=currentAttempts.filter((a:any)=>a.is_test===true&&activeSpecialAccessByUser.has(String(a.user_id)));

    let currentScoreRows:any[]=[];
    if(currentAttemptIds.length){
      const {data,error}=await admin.from("bcks_substansi_competency_scores")
        .select("attempt_id,competency,correct_count,total_count,percentage").in("attempt_id",currentAttemptIds);
      if(error) throw error;
      currentScoreRows=data||[];
    }
    const currentScoresByAttempt=new Map<string,any>();
    for(const row of currentScoreRows){
      if(!currentScoresByAttempt.has(row.attempt_id)) currentScoresByAttempt.set(row.attempt_id,{});
      currentScoresByAttempt.get(row.attempt_id)[row.competency]={
        percentage:Number(row.percentage||0),
        correct_count:Number(row.correct_count||0),
        total_count:Number(row.total_count||0)
      };
    }

    let telemetryRows:any[]=[];
    if(currentAttemptIds.length&&[2,3,4,30].includes(Number(monitorSession?.level))){
      const {data,error}=await admin.rpc("bcks_substansi_telemetry_summary",{p_attempt_ids:currentAttemptIds});
      if(error) throw error;
      telemetryRows=data||[];
    }
    const telemetryByAttempt=new Map<string,any>((telemetryRows||[]).map((x:any)=>[x.attempt_id,x]));
    const telemetryTracked=currentAttempts.filter((a:any)=>Number(telemetryByAttempt.get(a.id)?.event_count||0)>0).length;
    const telemetryReview=currentAttempts.filter((a:any)=>telemetryIndicator(telemetryByAttempt.get(a.id))==="PERLU_TELAAH").length;
    const telemetryPriority=currentAttempts.filter((a:any)=>telemetryIndicator(telemetryByAttempt.get(a.id))==="PRIORITAS_TELAAH").length;
    const telemetryNormal=currentAttempts.filter((a:any)=>telemetryIndicator(telemetryByAttempt.get(a.id))==="NORMAL").length;

    const sessionIndividuals=scopedParticipants.map((p:any)=>{
      const a:any=currentByUser.get(p.user_id);
      const tm:any=a?telemetryByAttempt.get(a.id):null;
      return {
        user_id:p.user_id,
        full_name:p.full_name,
        unit_kerja:p.unit_kerja,
        school_name:p.school_name,
        jenjang:p.jenjang,
        attempt_id:a?.id||null,
        attempt_status:a?.status||"NOT_STARTED",
        access_type:a?.is_test===true&&activeSpecialAccessByUser.has(String(p.user_id))?"KHUSUS":"RESMI",
        special_access:a?.is_test===true&&activeSpecialAccessByUser.has(String(p.user_id))
          ? activeSpecialAccessByUser.get(String(p.user_id))
          : null,
        started_at:a?.started_at||null,
        expires_at:a?.expires_at||null,
        submitted_at:a?.submitted_at||null,
        score:a?.status==="SUBMITTED"?Number(a.score||0):null,
        correct_count:a?.status==="SUBMITTED"?Number(a.correct_count||0):null,
        total_questions:a?.total_questions??null,
        readiness_label:a?.status==="SUBMITTED"?(a.readiness_label||null):null,
        priority_competency:a?.status==="SUBMITTED"?(a.priority_competency||null):null,
        competency_scores:a?.status==="SUBMITTED"?(currentScoresByAttempt.get(a.id)||{}):{},
        telemetry:{
          indicator:telemetryIndicator(tm),
          event_count:Number(tm?.event_count||0),
          tab_switch_count:Number(tm?.tab_switch_count||0),
          blur_count:Number(tm?.blur_count||0),
          revision_count:Number(tm?.revision_count||0),
          unusual_pause_count:Number(tm?.unusual_pause_count||0),
          immediate_answer_after_pause_count:Number(tm?.immediate_answer_after_pause_count||0),
          total_away_seconds:Number(tm?.total_away_seconds||0),
          max_away_seconds:Number(tm?.max_away_seconds||0),
          total_question_dwell_seconds:Number(tm?.total_question_dwell_seconds||0)
        }
      };
    }).sort((a:any,b:any)=>{
      const rank:any={IN_PROGRESS:0,SUBMITTED:1,EXPIRED:2,NOT_STARTED:3};
      const ra=rank[a.attempt_status]??4,rb=rank[b.attempt_status]??4;
      return ra-rb||String(a.full_name||"").localeCompare(String(b.full_name||""),"id");
    });

    const sessionMonitoring={
      session:monitorSession?{
        level:Number(monitorSession.level),label:monitorSession.label,date:monitorSession.date,
        start_time:monitorSession.start_time,end_time:monitorSession.end_time
      }:null,
      is_active:!!liveSession||activeSpecialAccessByUser.size>0,
      participants:ids.length,
      not_started:Math.max(0,ids.length-officialCurrentAttempts.length),
      in_progress:officialCurrentAttempts.filter((a:any)=>a.status==="IN_PROGRESS").length,
      submitted:officialCurrentAttempts.filter((a:any)=>a.status==="SUBMITTED").length,
      expired:officialCurrentAttempts.filter((a:any)=>a.status==="EXPIRED").length,
      average_score:officialCurrentAttempts.filter((a:any)=>a.status==="SUBMITTED").length
        ? Math.round(officialCurrentAttempts.filter((a:any)=>a.status==="SUBMITTED").reduce((sum:number,a:any)=>sum+Number(a.score||0),0)/officialCurrentAttempts.filter((a:any)=>a.status==="SUBMITTED").length*100)/100
        : 0,
      special_access:{
        active_windows:activeSpecialAccessByUser.size,
        attempts:specialCurrentAttempts.length,
        in_progress:specialCurrentAttempts.filter((a:any)=>a.status==="IN_PROGRESS").length,
        submitted:specialCurrentAttempts.filter((a:any)=>a.status==="SUBMITTED").length,
        expired:specialCurrentAttempts.filter((a:any)=>a.status==="EXPIRED").length
      },
      individuals:sessionIndividuals,
      telemetry:{
        tracked:telemetryTracked,
        normal:telemetryNormal,
        perlu_telaah:telemetryReview,
        prioritas_telaah:telemetryPriority,
        thresholds:{
          away_seconds_min:30,
          away_seconds_max:180,
          answer_after_return_seconds_max:15,
          perlu_telaah_immediate_min:2,
          prioritas_immediate_min:5,
          prioritas_ratio_min:0.60
        },
        note:"Telemetry memiliki tiga tingkat: NORMAL, PERLU_TELAAH, dan PRIORITAS_TELAAH. Bobot terkuat diberikan pada pola jeda 30–180 detik lalu jawaban dalam ≤15 detik. Semua status hanya indikator untuk telaah manusia dan tidak mengubah nilai peserta."
      }
    };

    // Hasil sesi sebelumnya dihitung terpisah agar tidak terlihat sebagai capaian sesi aktif.
    let previousAttempts:any[]=[];
    if(previousSession){
      const {data,error}=await admin.from("bcks_substansi_attempts")
        .select("id,user_id,score,correct_count,total_questions,readiness_label,priority_competency,submitted_at,session_level,is_test,is_official_result")
        .eq("mode","SIMULASI").eq("status","SUBMITTED").eq("is_test",false)
        .eq("session_level",Number(previousSession.level)).in("user_id",ids).order("submitted_at",{ascending:false});
      if(error) throw error;
      const prevByUser=new Map<string,any>();
      for(const a of data||[]){
        if(Number(previousSession.level)!==1&&a.is_official_result!==true) continue;
        if(!prevByUser.has(a.user_id)) prevByUser.set(a.user_id,a);
      }
      previousAttempts=[...prevByUser.values()];
    }
    const previousByUser=new Map<string,any>(previousAttempts.map((a:any)=>[a.user_id,a]));
    const previousAttemptIds=previousAttempts.map((a:any)=>a.id);

    let scoreRows:any[]=[];
    if(previousAttemptIds.length){
      const {data,error}=await admin.from("bcks_substansi_competency_scores")
        .select("attempt_id,competency,correct_count,total_count,percentage").in("attempt_id",previousAttemptIds);
      if(error) throw error;
      scoreRows=data||[];
    }
    const scoresByAttempt=new Map<string,any>();
    for(const row of scoreRows){
      if(!scoresByAttempt.has(row.attempt_id)) scoresByAttempt.set(row.attempt_id,{});
      scoresByAttempt.get(row.attempt_id)[row.competency]={
        percentage:Number(row.percentage||0),
        correct_count:Number(row.correct_count||0),
        total_count:Number(row.total_count||0)
      };
    }

    const readiness:any={...emptyReadiness};
    for(const a of previousAttempts) if(a.readiness_label in readiness) readiness[a.readiness_label]++;
    const avg=previousAttempts.length
      ? Math.round(previousAttempts.reduce((sum:number,a:any)=>sum+Number(a.score||0),0)/previousAttempts.length*100)/100
      : 0;
    const competencies=COMP_ORDER.map(comp=>{
      const xs=scoreRows.filter((x:any)=>x.competency===comp).map((x:any)=>Number(x.percentage||0));
      return {
        competency:comp,label:LABEL[comp],
        average:xs.length?Math.round(xs.reduce((a:number,b:number)=>a+b,0)/xs.length*100)/100:0,
        count:xs.length,
        below70:xs.filter((x:number)=>x<70).length
      };
    });
    const individuals=scopedParticipants.map((p:any)=>{
      const a:any=previousByUser.get(p.user_id);
      return {
        user_id:p.user_id,full_name:p.full_name,unit_kerja:p.unit_kerja,school_name:p.school_name,jenjang:p.jenjang,
        attempted:!!a,attempt_id:a?.id||null,score:a?Number(a.score||0):null,
        correct_count:a?.correct_count??null,total_questions:a?.total_questions??null,
        readiness_label:a?.readiness_label||null,priority_competency:a?.priority_competency||null,
        submitted_at:a?.submitted_at||null,competency_scores:a?(scoresByAttempt.get(a.id)||{}):{}
      };
    });

    return json({
      ok:true,
      scope_label:scopeLabel,
      scope_levels:scopeLevels,
      participants:ids.length,
      attempted:previousAttempts.length,
      not_attempted:Math.max(0,ids.length-previousAttempts.length),
      readiness,average_score:avg,competencies,individuals,
      previous_session:previousSession?{
        level:Number(previousSession.level),label:previousSession.label,date:previousSession.date,
        start_time:previousSession.start_time,end_time:previousSession.end_time,
        attempted:previousAttempts.length,not_attempted:Math.max(0,ids.length-previousAttempts.length),
        average_score:avg,readiness,competencies
      }:null,
      session_monitoring:sessionMonitoring,
      telemetry:sessionMonitoring.telemetry,
      note:"Monitoring sesi aktif dipisahkan dari hasil sesi sebelumnya. Telemetry hanya indikator untuk telaah manusia dan tidak mengubah nilai peserta."
    });
  }

  return json({error:"Action tidak dikenali."},400);
 }catch(e:any){
  console.error("BCKS_SUBSTANSI_ERROR",e?.message||String(e));
  return json({error:e?.message||String(e)},400);
 }
});
