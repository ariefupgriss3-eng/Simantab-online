import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const C={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"content-type,x-simantab-worker-secret",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Content-Type":"application/json"
};
const J=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:C});
const REQ=[
 ["SKP_1","SKP 2024",2024],["SKP_2","SKP 2025",2025],
 ["SK_PENGALAMAN_MANAJERIAL","SK Pengalaman Manajerial",null],
 ["SK_HUDIS","SK Bebas Hudis",null],["SKCK","SKCK",null],
 ["PAKTA_INTEGRITAS","Pakta Integritas",null],
 ["SURAT_PERNYATAAN_DIKLAT","Surat Pernyataan Diklat KS",null]
] as const;

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:C});
 if(req.method!=="POST")return J({error:"Method not allowed"},405);

 const secret=req.headers.get("x-simantab-worker-secret")||"";
 const url=Deno.env.get("SUPABASE_URL")!;
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const admin=createClient(url,service,{auth:{persistSession:false}});
 let currentItemId:string|null=null,currentRunId:string|null=null,currentAttempt=0;
 try{
  const {data:valid,error:ve}=await admin.rpc("ks_bcks_validate_aggregate_worker_secret",{p_secret:secret});
  if(ve||valid!==true)return J({error:"Unauthorized worker"},401);

  const {data:claims,error:ce}=await admin.rpc("ks_bcks_claim_active_ai_item");
  if(ce)throw ce;
  const claim=Array.isArray(claims)?claims[0]:claims;
  if(!claim)return J({ok:true,idle:true,message:"Tidak ada antrean AI Agregat Aktif."});

  const itemId=claim.item_id,runId=claim.aggregate_run_id,submissionId=claim.submission_id;
  const attempt=Number(claim.attempt_count||1);
  currentItemId=itemId;currentRunId=runId;currentAttempt=attempt;

  const [{data:aggRun},{data:d},{data:files,error:fe}]=await Promise.all([
   admin.from("ks_bcks_ai_aggregate_runs").select("id,requested_by,requested_by_role").eq("id",runId).maybeSingle(),
   admin.from("ks_bcks_submission_details").select("submission_id,user_id,full_name,nip,unit_kerja").eq("submission_id",submissionId).maybeSingle(),
   admin.from("submission_files").select("id,requirement_code,storage_path,file_name,file_size,mime_type,created_at").eq("submission_id",submissionId).order("created_at",{ascending:false})
  ]);
  if(fe)throw fe;
  if(!d)throw new Error("Detail peserta tidak ditemukan.");

  let previousResults:any[]=[];
  let retryCodes:string[]=[];
  const {data:itemState}=await admin.from("ks_bcks_ai_aggregate_items")
    .select("latest_ai_run_id,aggregate_status,retry_requirement_codes")
    .eq("id",itemId).maybeSingle();
  if(itemState?.latest_ai_run_id){
    const {data:prevRun}=await admin.from("ks_bcks_ai_verification_runs")
      .select("result").eq("id",itemState.latest_ai_run_id).maybeSingle();
    previousResults=Array.isArray(prevRun?.result?.results)?prevRun.result.results:[];
    if(Array.isArray(itemState?.retry_requirement_codes)&&itemState.retry_requirement_codes.length){
      retryCodes=itemState.retry_requirement_codes
        .map((x:any)=>String(x||""))
        .filter((x:string)=>REQ.some(([c])=>c===x));
    }else if(previousResults.length===7){
      retryCodes=previousResults
        .filter((x:any)=>x?.technical_error===true)
        .map((x:any)=>String(x.requirement_code||""))
        .filter((x:string)=>REQ.some(([c])=>c===x));
    }
  }

  const by=new Map<string,any>();
  for(const f of files||[])if(!by.has(f.requirement_code))by.set(f.requirement_code,f);
  const missing=REQ.filter(([c])=>!by.get(c));
  if(missing.length){
   const note="Berkas berubah saat antrean berjalan; "+missing.map(x=>x[1]).join(", ")+" belum tersedia.";
   await admin.from("ks_bcks_ai_aggregate_items").update({
    processing_status:"DONE",aggregate_status:"BERKAS_BELUM_LENGKAP",
    current_file_count:7-missing.length,ai_matched_file_count:0,note,processed_at:new Date().toISOString()
   }).eq("id",itemId);
   await admin.rpc("ks_bcks_refresh_active_ai_run",{p_run:runId});
   return J({ok:true,submission_id:submissionId,status:"BERKAS_BELUM_LENGKAP"});
  }

  const documents:any[]=[];
  for(const [code,label] of REQ){
   const f=by.get(code);
   if(Number(f.file_size||0)<1||Number(f.file_size||0)>512000)throw new Error(label+" harus berukuran 1-500 KB.");
   const {data:signed,error:se}=await admin.storage.from("simantab-documents").createSignedUrl(f.storage_path,600);
   if(se)throw se;
   documents.push({requirement_code:code,file_name:f.file_name,mime_type:f.mime_type,signed_url:signed.signedUrl});
  }

  const useNativeDiklatReader=Deno.env.get("SIMANTAB_DIKLAT_READER_BACKEND")==="supabase_native";
  const readerEndpoint=useNativeDiklatReader
   ? Deno.env.get("SUPABASE_URL")+"/functions/v1/simantab-diklat-ai-reader-staging"
   : "https://simantab-online.vercel.app/api/diklat-ai-read";
  const aiResp=await fetch(readerEndpoint,{
   method:"POST",
   headers:{"Content-Type":"application/json","x-simantab-worker-secret":secret,...(useNativeDiklatReader?{"apikey":Deno.env.get("SUPABASE_ANON_KEY")||""}:{})},
   body:JSON.stringify({
    submission_id:submissionId,
     participant:{full_name:d.full_name,nip:d.nip,unit_kerja:d.unit_kerja},
    documents,
    only_codes:retryCodes.length?retryCodes:undefined
   })
  });
  const aiText=await aiResp.text();
  let ai:any={};try{ai=JSON.parse(aiText)}catch{}
  if(!aiResp.ok)throw new Error(("AI reader HTTP "+aiResp.status+": "+(ai.error||aiText||"tanpa detail")).slice(0,1000));

  if(retryCodes.length&&previousResults.length===7){
    const partial=Array.isArray(ai.results)?ai.results:[];
    const partialBy=new Map(partial.map((x:any)=>[x.requirement_code,x]));
    const merged=previousResults.map((x:any)=>partialBy.get(x.requirement_code)||x);
    const mc={
      sesuai:merged.filter((x:any)=>x.status==="SESUAI").length,
      perbaikan:merged.filter((x:any)=>x.status==="PERLU_PERBAIKAN").length,
      tidak:merged.filter((x:any)=>x.status==="TIDAK_SESUAI").length,
      teknis:merged.filter((x:any)=>x.technical_error===true).length
    };
    ai={...ai,partial:true,only_codes:retryCodes,results:merged,counts:mc,
      overall_status:mc.teknis?"GAGAL_TEKNIS":((mc.perbaikan||mc.tidak)?"PERLU_PERBAIKAN":"SESUAI")};
  }

  const results=Array.isArray(ai.results)?ai.results:[];
  const sesuai=results.filter((x:any)=>x.status==="SESUAI").length;
  const perbaikan=results.filter((x:any)=>x.status==="PERLU_PERBAIKAN").length;
  const tidak=results.filter((x:any)=>x.status==="TIDAK_SESUAI").length;
  const overall=ai.overall_status==="SESUAI"&&sesuai===7?"SESUAI":
    (ai.overall_status==="GAGAL_TEKNIS"?"GAGAL_TEKNIS":"PERLU_PERBAIKAN");

  const {data:vr,error:vre}=await admin.from("ks_bcks_ai_verification_runs").insert({
   submission_id:submissionId,
   requested_by:aggRun?.requested_by||null,
   engine_version:ai.engine||"DIKLAT_DOC_AI_V4_GROUPED",
   model_name:ai.model||"google/gemini-2.5-flash-lite",
   verification_source:"AGREGAT_KABID",
   aggregate_batch_id:runId,
   overall_status:overall,
   sesuai_count:sesuai,
   perbaikan_count:perbaikan,
   tidak_sesuai_count:tidak,
   summary:overall==="SESUAI"?"AI Agregat Aktif: 7/7 dokumen sesuai.":overall==="GAGAL_TEKNIS"?"AI Agregat Aktif mengalami kendala teknis.":"AI Agregat Aktif menemukan dokumen yang perlu perbaikan.",
   result:ai,
   completed_at:new Date().toISOString()
  }).select("id").single();
  if(vre)throw vre;

  for(const [code,label,year] of REQ){
   const x=results.find((z:any)=>z.requirement_code===code)||{},f=by.get(code);
   await admin.from("ks_bcks_ai_document_verifications").insert({
    run_id:vr.id,submission_id:submissionId,file_id:f?.id||null,requirement_code:code,
    expected_label:label,expected_year:year,status:x.status||"PERLU_PERBAIKAN",
    detected_document_type:x.detected_document_type??null,detected_year:x.detected_year??null,
    detected_name:x.detected_name??null,detected_nip:x.detected_nip??null,
    readability_score:x.readability_score??null,confidence:x.confidence??null,
    note:x.note??null,evidence:x.evidence??null
   });
  }

  if(overall==="GAGAL_TEKNIS"&&attempt<3){
   await admin.from("ks_bcks_ai_aggregate_items").update({
    processing_status:"QUEUED",aggregate_status:"GAGAL_TEKNIS",
    latest_ai_run_id:vr.id,latest_ai_source:"AGREGAT_KABID",latest_ai_completed_at:new Date().toISOString(),
    current_file_count:7,ai_matched_file_count:sesuai,
    note:"Kendala teknis pada percobaan "+attempt+". Dijadwalkan ulang otomatis setelah antrean putaran pertama.",
    last_error:"GAGAL_TEKNIS",processing_started_at:null
   }).eq("id",itemId);
  }else{
   await admin.from("ks_bcks_ai_aggregate_items").update({
    processing_status:overall==="GAGAL_TEKNIS"?"ERROR":"DONE",
    aggregate_status:overall,
    latest_ai_run_id:vr.id,latest_ai_source:"AGREGAT_KABID",latest_ai_completed_at:new Date().toISOString(),
    current_file_count:7,ai_matched_file_count:sesuai,
    note:overall==="SESUAI"?"AI Agregat Aktif: 7/7 berkas sesuai.":
      overall==="GAGAL_TEKNIS"?"AI Agregat Aktif masih mengalami kendala teknis setelah retry parsial.":
      "AI Agregat Aktif menemukan "+(perbaikan+tidak)+" dokumen yang perlu perhatian.",
    processed_at:new Date().toISOString(),
    last_error:overall==="GAGAL_TEKNIS"?"GAGAL_TEKNIS":null,
    retry_requirement_codes:null
   }).eq("id",itemId);
  }

  // Jika pengajuan peserta sempat gagal teknis pada AI Otomatis, tetapi retry agregat
  // pada 7 berkas aktif menghasilkan 7/7 SESUAI, lanjutkan workflow otomatis.
  if(overall==="SESUAI"&&sesuai===7){
   const [{data:lastAuto},{data:subNow}]=await Promise.all([
    admin.from("ks_bcks_ai_verification_runs")
      .select("id,overall_status,completed_at")
      .eq("submission_id",submissionId)
      .eq("verification_source","OTOMATIS")
      .order("completed_at",{ascending:false})
      .limit(1).maybeSingle(),
    admin.from("submissions")
      .select("id,status,workflow_state,user_id")
      .eq("id",submissionId).maybeSingle()
   ]);
   if(lastAuto?.overall_status==="GAGAL_TEKNIS"&&subNow?.status==="DRAFT"&&subNow?.workflow_state==="DRAFT"){
    const note="AI Verifikator retry otomatis: 7/7 dokumen SESUAI setelah kendala teknis. Sistem melanjutkan ke bagi tugas verifikator otomatis dan Persetujuan Kabid.";
    await admin.from("submission_assignees").delete().eq("submission_id",submissionId);
    await admin.from("submissions").update({
      status:"SUBMITTED",workflow_state:"MENUNGGU_DISPOSISI_KOORDINATOR",
      assigned_user_id:null,assigned_by:null,assigned_at:null,assignment_note:null,
      staff_verified_by:null,staff_verified_at:null,staff_verification_note:note,
      submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()
    }).eq("id",submissionId);
    await admin.from("ks_bcks_submission_details").update({
      admin_status:"DIAJUKAN",admin_note:note,admin_reviewed_by:null,admin_reviewed_at:null,
      workflow_stage:"ADMINISTRASI",updated_at:new Date().toISOString()
    }).eq("submission_id",submissionId);
    await admin.from("submission_events").insert({
      submission_id:submissionId,status:"AI_VERIFIKATOR_RETRY_AGREGAT_LOLOS",
      note:"Retry agregat menyelesaikan kendala teknis AI Otomatis; 7/7 dokumen sesuai dan workflow dilanjutkan otomatis.",
      actor_id:d.user_id
    });
    await admin.from("notifications").insert({
      user_id:d.user_id,
      title:"AI Verifikator Berhasil",
      message:"Pemeriksaan ulang otomatis selesai: 7/7 dokumen sesuai. Usulan dilanjutkan ke proses berikutnya.",
      link:"#diklatKsBcks"
    });
   }
  }

  await admin.rpc("ks_bcks_refresh_active_ai_run",{p_run:runId});
  return J({ok:true,submission_id:submissionId,participant:d.full_name,overall_status:overall,attempt});
 }catch(e:any){
  const msg=e?.message||String(e);
  console.error("AGGREGATE_WORKER_ERROR",msg);
  try{
   if(currentItemId&&currentRunId){
    if(currentAttempt<3){
     await admin.from("ks_bcks_ai_aggregate_items").update({
      processing_status:"QUEUED",aggregate_status:"GAGAL_TEKNIS",
      note:"Kendala teknis worker pada percobaan "+currentAttempt+". Akan dicoba ulang otomatis.",
      last_error:msg.slice(0,1000),processing_started_at:null
     }).eq("id",currentItemId);
    }else{
     await admin.from("ks_bcks_ai_aggregate_items").update({
      processing_status:"ERROR",aggregate_status:"GAGAL_TEKNIS",
      note:"Kendala teknis setelah retry parsial.",
      last_error:msg.slice(0,1000),processed_at:new Date().toISOString()
     }).eq("id",currentItemId);
    }
    await admin.rpc("ks_bcks_refresh_active_ai_run",{p_run:currentRunId});
   }
  }catch(inner){console.error("AGGREGATE_WORKER_RECOVERY_ERROR",inner)}
  return J({error:msg},400);
 }
});