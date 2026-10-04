import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { PREMIUM_V5_META } from "./premium-v5.ts";

const CORS={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Content-Type":"application/json"
};
const J=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:CORS});
const AI_URL="https://simantab-online.vercel.app/api/bcks-thinking";
const LETTERS=["A","B","C","D","E"];

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
  if(req.method!=="POST")return J({error:"Method not allowed"},405);
  try{
    const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
    if(!token)return J({error:"Unauthorized"},401);
    const url=Deno.env.get("SUPABASE_URL")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin=createClient(url,service,{auth:{persistSession:false}});
    const {data:{user},error:ue}=await admin.auth.getUser(token);
    if(ue||!user)return J({error:"Unauthorized"},401);
    const {data:profile}=await admin.from("profiles").select("id,is_active").eq("id",user.id).maybeSingle();
    if(!profile?.is_active)return J({error:"Akun tidak aktif."},403);
    const body=await req.json().catch(()=>({}));
    const action=String(body?.action||"").trim();

    const callAi=async(payload:any)=>{
      const r=await fetch(AI_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
        body:JSON.stringify(payload)
      });
      const raw=await r.text();
      let out:any={};try{out=JSON.parse(raw)}catch{}
      if(!r.ok)throw new Error(out?.error||raw||("AI Coach HTTP "+r.status));
      return out;
    };
    const getAttempt=async(attemptId:string)=>{
      if(!attemptId)throw new Error("attempt_id wajib.");
      const {data:a,error}=await admin.from("bcks_substansi_attempts")
        .select("id,user_id,status,session_level,package_questions,mode")
        .eq("id",attemptId).maybeSingle();
      if(error||!a)throw new Error("Sesi latihan tidak ditemukan.");
      if(a.user_id!==user.id)throw new Error("Tidak berwenang.");
      const pack=(Array.isArray(a.package_questions)?a.package_questions:[]).map((n:any)=>Number(n));
      const isV5=Number(a.session_level)===2&&pack.length===70&&pack.every((n:number)=>n>=1001&&n<=1070);
      return {attempt:a,pack,isV5};
    };
    const originalAnswer=async(attemptId:string,qno:number)=>{
      const {data,error}=await admin.from("bcks_substansi_answers")
        .select("selected_option,is_doubtful,seconds_spent")
        .eq("attempt_id",attemptId).eq("question_no",qno).maybeSingle();
      if(error)throw error;
      if(!data?.selected_option)throw new Error("Jawaban awal tidak ditemukan.");
      return data;
    };
    const readLearning=async(attemptId:string,qno:number)=>{
      const {data,error}=await admin.from("bcks_premium_learning").select("*")
        .eq("attempt_id",attemptId).eq("question_no",qno).maybeSingle();
      if(error)throw error;
      return data;
    };
    const saveLearning=async(attemptId:string,qno:number,patch:any)=>{
      const old=await readLearning(attemptId,qno);
      const payload={...(old||{}),attempt_id:attemptId,question_no:qno,user_id:user.id,...patch,updated_at:new Date().toISOString()};
      const {data,error}=await admin.from("bcks_premium_learning").upsert(payload,{onConflict:"attempt_id,question_no"}).select("*").single();
      if(error)throw error;
      return data;
    };
    const requireCase=async(attemptId:string,qno:number)=>{
      const ctx=await getAttempt(attemptId);
      if(ctx.attempt.status!=="SUBMITTED")throw new Error("Thinking Culture tersedia setelah sesi diselesaikan.");
      if(!ctx.isV5||!ctx.pack.includes(qno))throw new Error("Kasus Premium One v5.0 tidak tersedia.");
      const meta:any=PREMIUM_V5_META[String(qno)];
      if(!meta)throw new Error("Metadata kasus tidak tersedia.");
      return {...ctx,meta};
    };

    if(action==="items"){
      const attemptId=String(body?.attempt_id||"").trim();
      const {attempt,pack,isV5}=await getAttempt(attemptId);
      if(attempt.status!=="SUBMITTED")return J({error:"Thinking Culture tersedia setelah sesi diselesaikan."},409);
      if(!isV5)return J({ok:true,premium_v5:false});
      const [{data:answers,error:ae},{data:learn,error:le}]=await Promise.all([
        admin.from("bcks_substansi_answers").select("question_no,selected_option,is_doubtful,seconds_spent").eq("attempt_id",attemptId),
        admin.from("bcks_premium_learning").select("question_no,highest_hint,recovery_success,transfer_status,mastery_state").eq("attempt_id",attemptId)
      ]);
      if(ae||le)throw ae||le;
      const am=new Map((answers||[]).map((x:any)=>[Number(x.question_no),x]));
      const lm=new Map((learn||[]).map((x:any)=>[Number(x.question_no),x]));
      const rows=pack.map((q:number,i:number)=>{
        const a:any=am.get(q)||{},l:any=lm.get(q)||{};
        return {question_no:q,display_no:i+1,selected_option:a.selected_option||null,is_doubtful:!!a.is_doubtful,
          seconds_spent:Number(a.seconds_spent||0),highest_hint:Number(l.highest_hint||0),
          recovery_success:!!l.recovery_success,transfer_status:l.transfer_status||null,mastery_state:l.mastery_state||null};
      });
      return J({ok:true,premium_v5:true,attempt_id:attemptId,rows});
    }

    if(action==="coach_step"){
      const attemptId=String(body?.attempt_id||"").trim();
      const qno=Number(body?.question_no||0);
      const hint=Math.max(1,Math.min(4,Number(body?.hint_level||1)));
      const {meta}=await requireCase(attemptId,qno);
      const ans:any=await originalAnswer(attemptId,qno);
      const db=Number(meta.db?.[String(ans.selected_option)]||0);
      if(!db)throw new Error("Metadata opsi tidak tersedia.");
      const existing=await readLearning(attemptId,qno);
      await saveLearning(attemptId,qno,{highest_hint:Math.max(Number(existing?.highest_hint||0),hint)});
      const out=await callAi({
        mode:"coach",
        stimulus_soal:String(body?.stimulus_soal||"").slice(0,6000),
        pertanyaan:String(body?.pertanyaan||"").slice(0,1200),
        opsi_yang_dipilih:String(body?.opsi_yang_dipilih||"").slice(0,1800),
        db_level:"DB"+db,
        misconception_code:meta.mc,
        concept_key:meta.principle,
        reasoning_key:meta.reasoning,
        hint_level:hint,
        competency:String(body?.competency||"PROFESIONAL").slice(0,50),
        transfer_question:meta.transfer
      });
      const next=db===5?"GO_TO_TRANSFER":String(out.next_action||"CONTINUE_HINT");
      return J({ok:true,coach_message:String(out.coach_message||""),reflection_question:String(out.reflection_question||""),
        next_action:next,transfer_question:next==="GO_TO_TRANSFER"?meta.transfer:null,hint_level:hint});
    }

    if(action==="record_recovery"){
      const attemptId=String(body?.attempt_id||"").trim(),qno=Number(body?.question_no||0);
      const option=String(body?.recovery_option||"").toUpperCase();
      if(!LETTERS.includes(option))return J({error:"Pilih satu opsi A–E."},400);
      const {meta}=await requireCase(attemptId,qno);
      const db=Number(meta.db?.[option]||0);
      if(!db)return J({error:"Opsi recovery tidak valid."},400);
      const original:any=await originalAnswer(attemptId,qno);
      const success=db===5;
      const row:any=await saveLearning(attemptId,qno,{recovery_option:option,recovery_db:db,recovery_success:success,
        reasoning_latest:String(body?.reasoning_latest||"").slice(0,4000)});
      if(!success)return J({ok:true,recovery_success:false,
        next_hint:Math.min(4,Math.max(1,Number(row.highest_hint||0)+1)),
        message:"Arah berpikir sudah direkam. Gunakan petunjuk berikutnya untuk menguji kembali alasan keputusan Anda."});
      const out=await callAi({
        mode:"reinforce",
        stimulus_soal:String(body?.stimulus_soal||"").slice(0,6000),
        pertanyaan:String(body?.pertanyaan||"").slice(0,1200),
        reasoning_awal:"Pilihan awal peserta: "+String(original.selected_option||""),
        reasoning_terbaru:String(body?.reasoning_latest||"").slice(0,2500),
        concept_key:meta.principle,
        reasoning_key:meta.reasoning,
        transfer_question:meta.transfer
      });
      return J({ok:true,recovery_success:true,reinforcement:String(out.reinforcement||""),transfer_question:meta.transfer});
    }

    if(action==="evaluate_transfer"){
      const attemptId=String(body?.attempt_id||"").trim(),qno=Number(body?.question_no||0);
      const response=String(body?.participant_response||"").trim().slice(0,4000);
      if(!response)return J({error:"Jawaban cek pemahaman belum diisi."},400);
      const {meta}=await requireCase(attemptId,qno);
      const original:any=await originalAnswer(attemptId,qno);
      const initialDb=Number(meta.db?.[String(original.selected_option)]||0);
      const learn:any=await readLearning(attemptId,qno);
      if(initialDb!==5&&!learn?.recovery_success)return J({error:"Selesaikan proses recovery terlebih dahulu."},409);
      const out=await callAi({
        mode:"transfer",
        transfer_question:meta.transfer,
        participant_response:response,
        target_principle:meta.principle,
        target_reasoning:meta.reasoning,
        misconception_to_avoid:meta.misconception
      });
      const status=String(out.transfer_status||"NOT_YET");
      if(!["TRANSFER_MASTERED","PARTIAL_TRANSFER","NOT_YET"].includes(status))throw new Error("Status transfer tidak valid.");
      const hint=Number(learn?.highest_hint||0);
      const mastered=status==="TRANSFER_MASTERED";
      const mastery=mastered&&initialDb===5?"INDEPENDENT_MASTERY":
        mastered&&initialDb===4&&hint<=1?"RAPID_MASTERY":
        mastered?"SCAFFOLDED_MASTERY":
        (learn?.recovery_success?"UNSTABLE_UNDERSTANDING":"CONCEPT_GAP");
      await saveLearning(attemptId,qno,{
        transfer_response:response,
        principle_score:Number(out.principle_score||0),
        context_transfer_score:Number(out.context_transfer_score||0),
        priority_score:Number(out.priority_score||0),
        reasoning_score:Number(out.reasoning_score||0),
        misconception_avoidance_score:Number(out.misconception_avoidance_score||0),
        transfer_total:Number(out.total_score||0),
        transfer_status:status,
        mastery_state:mastery
      });
      return J({ok:true,transfer_status:status,mastery_state:mastery,feedback:String(out.feedback||"")});
    }

    if(action==="summary"){
      const attemptId=String(body?.attempt_id||"").trim();
      const {attempt,isV5}=await getAttempt(attemptId);
      if(attempt.status!=="SUBMITTED"||!isV5)return J({error:"Ringkasan Premium One tidak tersedia."},409);
      const {data:rows,error}=await admin.from("bcks_premium_learning")
        .select("transfer_status,mastery_state,highest_hint,recovery_success").eq("attempt_id",attemptId);
      if(error)throw error;
      const all=rows||[],total=all.length;
      const count=(field:string,value:string)=>all.filter((x:any)=>x[field]===value).length;
      const avgHint=total?Math.round(all.reduce((s:number,x:any)=>s+Number(x.highest_hint||0),0)/total*100)/100:0;
      return J({ok:true,studied:total,
        transfer_mastered:count("transfer_status","TRANSFER_MASTERED"),
        partial_transfer:count("transfer_status","PARTIAL_TRANSFER"),
        not_yet:count("transfer_status","NOT_YET"),
        independent_mastery:count("mastery_state","INDEPENDENT_MASTERY"),
        rapid_mastery:count("mastery_state","RAPID_MASTERY"),
        scaffolded_mastery:count("mastery_state","SCAFFOLDED_MASTERY"),
        unstable_understanding:count("mastery_state","UNSTABLE_UNDERSTANDING"),
        concept_gap:count("mastery_state","CONCEPT_GAP"),
        average_hint:avgHint});
    }

    return J({error:"Action tidak dikenali."},400);
  }catch(e:any){
    console.error("BCKS_THINKING_ERROR",e?.message||String(e));
    return J({error:e?.message||String(e)},400);
  }
});