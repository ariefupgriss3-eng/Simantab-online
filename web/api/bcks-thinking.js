const {AI_COACH_PROMPT,RECOVERY_PROMPT,TRANSFER_EVALUATOR_PROMPT}=require("../lib/bcks-thinking-prompts");

const SUPABASE_URL="https://tizxfzvgglkokzvsiwkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB";
const MODEL="openai/gpt-5.6-sol";
const allowedNext=new Set(["CONTINUE_HINT","RETRY_REASONING","GO_TO_TRANSFER"]);
const allowedTransfer=new Set(["TRANSFER_MASTERED","PARTIAL_TRANSFER","NOT_YET"]);

function send(res,status,body){
  res.statusCode=status;
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify(body));
}
function safeText(v,max=6000){return String(v??"").trim().slice(0,max)}
async function getUser(auth){
  if(!/^Bearer\s+\S+/i.test(auth||""))return null;
  const r=await fetch(SUPABASE_URL+"/auth/v1/user",{
    headers:{Authorization:auth,apikey:SUPABASE_PUBLISHABLE_KEY}
  });
  if(!r.ok)return null;
  return await r.json();
}
async function gateway(system,input,schemaName,schema){
  const apiKey=process.env.AI_GATEWAY_API_KEY;
  if(!apiKey)throw new Error("AI Gateway belum dikonfigurasi.");
  const r=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+apiKey},
    body:JSON.stringify({
      model:MODEL,
      stream:false,
      messages:[
        {role:"system",content:system},
        {role:"user",content:JSON.stringify(input)}
      ],
      response_format:{
        type:"json_schema",
        json_schema:{
          name:schemaName,
          strict:true,
          schema
        }
      }
    })
  });
  const raw=await r.text();
  let outer={};try{outer=JSON.parse(raw)}catch{}
  if(!r.ok)throw new Error(outer?.error?.message||outer?.error||raw||("AI Gateway HTTP "+r.status));
  const txt=outer?.choices?.[0]?.message?.content;
  if(!txt)throw new Error("AI Gateway tidak mengembalikan respons.");
  let parsed;try{parsed=JSON.parse(txt)}catch{throw new Error("Respons AI tidak berupa JSON valid.");}
  return parsed;
}
const coachSchema={
  type:"object",additionalProperties:false,
  properties:{
    coach_message:{type:"string"},
    reflection_question:{type:"string"},
    next_action:{type:"string",enum:["CONTINUE_HINT","RETRY_REASONING","GO_TO_TRANSFER"]}
  },
  required:["coach_message","reflection_question","next_action"]
};
const recoverySchema={
  type:"object",additionalProperties:false,
  properties:{reinforcement:{type:"string"},transfer_question:{type:"string"}},
  required:["reinforcement","transfer_question"]
};
const transferSchema={
  type:"object",additionalProperties:false,
  properties:{
    principle_score:{type:"integer",minimum:0,maximum:30},
    context_transfer_score:{type:"integer",minimum:0,maximum:25},
    priority_score:{type:"integer",minimum:0,maximum:20},
    reasoning_score:{type:"integer",minimum:0,maximum:15},
    misconception_avoidance_score:{type:"integer",minimum:0,maximum:10},
    total_score:{type:"integer",minimum:0,maximum:100},
    transfer_status:{type:"string",enum:["TRANSFER_MASTERED","PARTIAL_TRANSFER","NOT_YET"]},
    feedback:{type:"string"}
  },
  required:["principle_score","context_transfer_score","priority_score","reasoning_score","misconception_avoidance_score","total_score","transfer_status","feedback"]
};

module.exports=async function handler(req,res){
  if(req.method!=="POST")return send(res,405,{error:"Method not allowed"});
  try{
    const auth=String(req.headers.authorization||"");
    const user=await getUser(auth);
    if(!user?.id)return send(res,401,{error:"Unauthorized"});
    const b=typeof req.body==="object"&&req.body?req.body:{};
    const mode=safeText(b.mode,30);

    if(mode==="coach"){
      const hint=Number(b.hint_level||1);
      if(![1,2,3,4].includes(hint))return send(res,400,{error:"hint_level tidak valid."});
      const input={
        stimulus_soal:safeText(b.stimulus_soal),
        pertanyaan:safeText(b.pertanyaan),
        opsi_yang_dipilih:safeText(b.opsi_yang_dipilih),
        db_level:safeText(b.db_level,3),
        misconception_code:safeText(b.misconception_code,12),
        concept_key:safeText(b.concept_key,1200),
        reasoning_key:safeText(b.reasoning_key,1600),
        hint_level:"H"+hint,
        competency:safeText(b.competency,50),
        transfer_question:safeText(b.transfer_question,1800)
      };
      const out=await gateway(AI_COACH_PROMPT,input,"simantab_coach",coachSchema);
      if(!allowedNext.has(out.next_action))throw new Error("next_action AI tidak valid.");
      return send(res,200,{ok:true,...out,model:MODEL});
    }

    if(mode==="reinforce"){
      const input={
        stimulus_soal:safeText(b.stimulus_soal),
        pertanyaan:safeText(b.pertanyaan),
        reasoning_awal:safeText(b.reasoning_awal,2500),
        reasoning_terbaru:safeText(b.reasoning_terbaru,2500),
        concept_key:safeText(b.concept_key,1200),
        reasoning_key:safeText(b.reasoning_key,1600),
        transfer_question:safeText(b.transfer_question,1800)
      };
      const out=await gateway(RECOVERY_PROMPT,input,"simantab_reinforcement",recoverySchema);
      // Transfer question is canonical server input; never allow the model to mutate it.
      out.transfer_question=input.transfer_question;
      return send(res,200,{ok:true,...out,model:MODEL});
    }

    if(mode==="transfer"){
      const input={
        transfer_question:safeText(b.transfer_question,1800),
        participant_response:safeText(b.participant_response,4000),
        target_principle:safeText(b.target_principle,1600),
        target_reasoning:safeText(b.target_reasoning,1800),
        misconception_to_avoid:safeText(b.misconception_to_avoid,1200)
      };
      const out=await gateway(TRANSFER_EVALUATOR_PROMPT,input,"simantab_transfer_evaluation",transferSchema);
      const sum=Number(out.principle_score)+Number(out.context_transfer_score)+Number(out.priority_score)+Number(out.reasoning_score)+Number(out.misconception_avoidance_score);
      out.total_score=sum;
      if(!allowedTransfer.has(out.transfer_status))throw new Error("transfer_status AI tidak valid.");
      // Enforce numeric class; hard-rule downgrade from AI remains allowed.
      const numeric=sum>=80?"TRANSFER_MASTERED":sum>=55?"PARTIAL_TRANSFER":"NOT_YET";
      const rank={NOT_YET:0,PARTIAL_TRANSFER:1,TRANSFER_MASTERED:2};
      if(rank[out.transfer_status]>rank[numeric])out.transfer_status=numeric;
      return send(res,200,{ok:true,...out,model:MODEL});
    }

    return send(res,400,{error:"Mode tidak dikenali."});
  }catch(e){
    console.error("BCKS_THINKING_AI_ERROR",e?.message||String(e));
    return send(res,500,{error:"AI Coach sedang mengalami kendala. Silakan coba kembali."});
  }
};