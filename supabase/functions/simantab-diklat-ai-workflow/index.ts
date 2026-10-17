import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const C={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Content-Type":"application/json"};
const J=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:C});
const REQ=[
 ["SKP_1","SKP 2024",2024],["SKP_2","SKP 2025",2025],
 ["SK_PENGALAMAN_MANAJERIAL","SK Pengalaman Manajerial",null],
 ["SK_HUDIS","SK Bebas Hudis",null],["SKCK","SKCK",null],
 ["PAKTA_INTEGRITAS","Pakta Integritas",null],
 ["SURAT_PERNYATAAN_DIKLAT","Surat Pernyataan Diklat KS",null]
];

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:C});
 if(req.method==="GET")return J({ok:true,engine:"DIKLAT_DOC_AI_V11_RULE_CLARITY",workflow:"AUTO_AI_AUTO_ASSIGN_KABID_AUTO_AGGREGATE"});
 try{
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/,"");
  if(!token)return J({error:"Unauthorized"},401);
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:{user},error:ue}=await admin.auth.getUser(token);
  if(ue||!user)return J({error:"Unauthorized"},401);

  const body=await req.json();
  const id=String(body?.submission_id||"").trim();
  const mode=String(body?.mode||"test");
  if(!id)return J({error:"submission_id wajib."},400);

  const [{data:p},{data:s},{data:d},{data:files}]=await Promise.all([
   admin.from("profiles").select("id,role,account_channel,is_active,approval_status").eq("id",user.id).maybeSingle(),
   admin.from("submissions").select("id,user_id,service_type,status,workflow_state,title,scope_level,assigned_user_id").eq("id",id).maybeSingle(),
   admin.from("ks_bcks_submission_details").select("*").eq("submission_id",id).maybeSingle(),
   admin.from("submission_files").select("id,requirement_code,storage_path,file_name,file_size,mime_type,created_at").eq("submission_id",id).order("created_at",{ascending:false})
  ]);
  if(!p?.is_active||p.approval_status!=="APPROVED"||!s||!d||s.service_type!=="DIKLAT_KS_BCKS")return J({error:"Usulan tidak tersedia."},404);
  const role=String(p.role||"");
   const owner=s.user_id===user.id;
   const leader=["SUPER_ADMIN","KABID","KEPALA_DINAS","SEKRETARIS_DINAS"].includes(role);
   const coordinator=(role==="KASI_SD"&&s.scope_level==="SD")||
     (role==="KASI_SMP"&&s.scope_level==="SMP")||
     (role==="SUBKOOR_TK"&&s.scope_level==="TK_PAUD_PNF");
   let assigned=false;
   if((role.startsWith("STAFF_")||role.startsWith("ADMIN_"))&&!owner){
     if(s.assigned_user_id===user.id)assigned=true;
     else{
       const {data:staffAssignment,error:assignmentError}=await admin.from("submission_assignees")
         .select("user_id").eq("submission_id",id).eq("user_id",user.id).maybeSingle();
       if(assignmentError)throw assignmentError;
       assigned=!!staffAssignment;
     }
   }
  if(mode==="submit"&&!owner)return J({error:"Hanya peserta pemilik usulan yang dapat mengajukan verifikasi AI."},403);
  if(mode==="aggregate"&&!["KABID","SUPER_ADMIN"].includes(String(p.role||"")))return J({error:"AI Verifikator Agregat hanya dapat dijalankan oleh Kabid/Super Admin."},403);
  if(!["submit","aggregate"].includes(mode)&&!owner&&!leader&&!coordinator&&!assigned)return J({error:"Tidak berwenang."},403);
  if(mode==="submit"&&!["DRAFT","DITOLAK"].includes(String(d.admin_status||"")))return J({error:"Seleksi Administrasi tidak berada pada status Draft/Perbaikan."},409);

  const resetToDraft=async(reason:string,eventStatus:string)=>{
   await admin.from("submission_assignees").delete().eq("submission_id",id);
   await admin.from("submissions").update({
    status:"DRAFT",workflow_state:"DRAFT",
    assigned_user_id:null,assigned_by:null,assigned_at:null,assignment_note:null,
    staff_verified_by:null,staff_verified_at:null,staff_verification_note:null,
    coordinator_approved_by:null,coordinator_approved_at:null,coordinator_approval_note:null,
    kabid_approved_by:null,kabid_approved_at:null,kabid_approval_note:null,
    workflow_completed_at:null,updated_at:new Date().toISOString()
   }).eq("id",id);
   await admin.from("ks_bcks_submission_details").update({
    workflow_stage:"ADMINISTRASI",admin_status:"DRAFT",admin_note:reason,
    admin_reviewed_by:null,admin_reviewed_at:null,updated_at:new Date().toISOString()
   }).eq("submission_id",id);
   await admin.from("submission_events").insert({submission_id:id,status:eventStatus,note:reason,actor_id:user.id});
   await admin.from("notifications").insert({
    user_id:s.user_id,title:"Seleksi Administrasi Kembali ke Draft",
    message:reason,link:"#diklatKsBcks"
   });
  };

  const enqueueAggregate=async()=>{
   try{
    const {data,error}=await admin.rpc("ks_bcks_enqueue_ai_aggregate_submission",{p_submission_id:id});
    if(error){console.error("DIKLAT_AI_AUTO_AGGREGATE_QUEUE_ERROR",error.message);return false}
    return !!data?.queued;
   }catch(e:any){
    console.error("DIKLAT_AI_AUTO_AGGREGATE_QUEUE_ERROR",e?.message||String(e));
    return false;
   }
  };

  const by=new Map<string,any>();
  for(const f of files||[])if(!by.has(f.requirement_code))by.set(f.requirement_code,f);
  const missing=REQ.filter(([c])=>!by.get(c));
  if(missing.length){
   const results=REQ.map(([c,l])=>({requirement_code:c,label:l,status:by.get(c)?"PERLU_PERBAIKAN":"TIDAK_SESUAI",note:by.get(c)?"Belum diperiksa karena 7 berkas belum lengkap.":"Berkas belum diunggah."}));
   let aggregateQueued=false;
   if(mode==="submit"){
    const reason="AI Verifikator otomatis: berkas wajib belum lengkap ("+missing.map(x=>x[1]).join(", ")+"). Status diturunkan ke Draft.";
    await resetToDraft(reason,"AI_VERIFIKATOR_OTOMATIS_DRAFT");
    aggregateQueued=await enqueueAggregate();
   }
   return J({ok:true,overall_status:"PERLU_PERBAIKAN",missing:missing.map(x=>x[0]),results,auto_draft:mode==="submit",aggregate_auto_queued:aggregateQueued});
  }

  const documents=[];
  for(const [code,label] of REQ){
   const f=by.get(code);
   if(Number(f.file_size||0)<1||Number(f.file_size||0)>512000)return J({error:label+" harus berukuran 1-500 KB."},409);
   const {data:signed,error:se}=await admin.storage.from("simantab-documents").createSignedUrl(f.storage_path,600);
   if(se)throw se;
   documents.push({requirement_code:code,file_name:f.file_name,mime_type:f.mime_type,signed_url:signed.signedUrl});
  }

  const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
  const readAi=async(onlyCodes?:string[])=>{
   let lastErr="";
   for(let attempt=1;attempt<=3;attempt++){
    try{
     const useNativeDiklatReader=Deno.env.get("SIMANTAB_DIKLAT_READER_BACKEND")==="supabase_native";
  const readerEndpoint=useNativeDiklatReader
   ? Deno.env.get("SUPABASE_URL")+"/functions/v1/simantab-diklat-ai-reader-staging"
   : "https://simantab-online.vercel.app/api/diklat-ai-read";
      const resp=await fetch(readerEndpoint,{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token,...(useNativeDiklatReader?{"apikey":Deno.env.get("SUPABASE_ANON_KEY")||""}:{})},
      body:JSON.stringify({
       submission_id:id,
        participant:{full_name:d.full_name,nip:d.nip,unit_kerja:d.unit_kerja},
       documents,
       only_codes:onlyCodes?.length?onlyCodes:undefined
      })
     });
     const raw=await resp.text();
     let payload:any={};try{payload=JSON.parse(raw)}catch{}
     if(resp.ok)return payload;
     lastErr=payload?.error||raw||("HTTP "+resp.status);
    }catch(e:any){lastErr=e?.message||String(e)}
    if(attempt<3)await sleep(700*attempt);
   }
   throw new Error(lastErr||"AI Verifikator mengalami kendala teknis.");
  };

  let ai:any=await readAi();
  let results:any[]=Array.isArray(ai.results)?ai.results:[];

  // Jika hanya sebagian dokumen gagal teknis, baca ulang hanya dokumen tersebut.
  // Maksimal 2 gelombang retry agar peserta tidak perlu menekan Ajukan berulang.
  for(let retry=0;retry<2;retry++){
   const techCodes=results
    .filter((x:any)=>x?.technical_error===true)
    .map((x:any)=>String(x.requirement_code||""))
    .filter(Boolean);
   if(!techCodes.length)break;
   await sleep(500*(retry+1));
   const part:any=await readAi(techCodes);
   const partResults:any[]=Array.isArray(part?.results)?part.results:[];
   const partBy=new Map(partResults.map((x:any)=>[x.requirement_code,x]));
   results=results.map((x:any)=>partBy.get(x.requirement_code)||x);
   const sesuaiTmp=results.filter((x:any)=>x.status==="SESUAI").length;
   const teknisTmp=results.filter((x:any)=>x.technical_error===true).length;
   const tidakTmp=results.filter((x:any)=>x.status==="TIDAK_SESUAI").length;
   const perbaikanTmp=results.filter((x:any)=>x.status==="PERLU_PERBAIKAN"&&x.technical_error!==true).length;
   ai={
    ...ai,
    engine:part?.engine||ai?.engine,
    model:part?.model||ai?.model,
    results,
    retry_partial:true,
    retry_attempts:retry+1,
    counts:{sesuai:sesuaiTmp,teknis:teknisTmp,tidak:tidakTmp,perbaikan:perbaikanTmp},
    overall_status:teknisTmp?"GAGAL_TEKNIS":(sesuaiTmp===7?"SESUAI":"PERLU_PERBAIKAN")
   };
  }

  const sesuai=results.filter((x:any)=>x.status==="SESUAI").length;
  const teknis=results.filter((x:any)=>x.technical_error===true).length;
  const overall=teknis>0?"GAGAL_TEKNIS":(sesuai===7?"SESUAI":"PERLU_PERBAIKAN");

  const verificationSource=mode==="submit"?"OTOMATIS":(mode==="aggregate"?"AGREGAT_KABID":"UJI_DINAS");
  const {data:run}=await admin.from("ks_bcks_ai_verification_runs").insert({
   submission_id:id,requested_by:user.id,engine_version:ai.engine||"DIKLAT_DOC_AI_V11_RULE_CLARITY",
   verification_source:verificationSource,
   model_name:ai.model||"google/gemini-2.5-flash-lite",overall_status:overall,
   sesuai_count:sesuai,perbaikan_count:results.filter((x:any)=>x.status==="PERLU_PERBAIKAN").length,
   tidak_sesuai_count:results.filter((x:any)=>x.status==="TIDAK_SESUAI").length,
   summary:overall==="SESUAI"?"AI: 7/7 dokumen sesuai.":"AI: dokumen perlu perbaikan.",
   result:ai,completed_at:new Date().toISOString()
  }).select("id").single();

  if(run?.id)for(const [code,label,year] of REQ){
   const x=results.find((z:any)=>z.requirement_code===code)||{},f=by.get(code);
   await admin.from("ks_bcks_ai_document_verifications").insert({
    run_id:run.id,submission_id:id,file_id:f?.id||null,requirement_code:code,expected_label:label,expected_year:year,
    status:x.status||"PERLU_PERBAIKAN",detected_document_type:x.detected_document_type??null,detected_year:x.detected_year??null,
    detected_name:x.detected_name??null,detected_nip:x.detected_nip??null,readability_score:x.readability_score??null,
    confidence:x.confidence??null,note:x.note??null,evidence:x.evidence??null
   });
  }

  let finalState:any=null;
  let aggregateQueued=false;
  if(mode==="submit"){
   if(overall==="SESUAI"){
    const note="AI Verifikator otomatis: 7/7 dokumen SESUAI. Sistem melanjutkan ke bagi tugas verifikator otomatis, lalu Persetujuan Kabid.";
    await admin.from("submission_assignees").delete().eq("submission_id",id);
    await admin.from("submissions").update({
      status:"SUBMITTED",workflow_state:"MENUNGGU_DISPOSISI_KOORDINATOR",
      assigned_user_id:null,assigned_by:null,assigned_at:null,assignment_note:null,
      staff_verified_by:null,staff_verified_at:null,staff_verification_note:note,
      submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()
    }).eq("id",id);
    await admin.from("ks_bcks_submission_details").update({
      admin_status:"DIAJUKAN",admin_note:note,admin_reviewed_by:null,admin_reviewed_at:null,
      workflow_stage:"ADMINISTRASI",updated_at:new Date().toISOString()
    }).eq("submission_id",id);
    await admin.from("submission_events").insert({
      submission_id:id,status:"AI_VERIFIKATOR_OTOMATIS_LOLOS",
      note:"7/7 dokumen lolos AI. Dilanjutkan ke AI Bagi Tugas otomatis.",actor_id:user.id
    });
    const fs=await admin.from("submissions").select("workflow_state,status,assigned_user_id,assigned_by,assignment_note,staff_verification_note").eq("id",id).maybeSingle();
    finalState=fs.data||null;
   }else if(overall==="GAGAL_TEKNIS"){
    await admin.from("submission_events").insert({
      submission_id:id,status:"AI_VERIFIKATOR_GAGAL_TEKNIS",
      note:"Pemeriksaan AI masih mengalami kendala teknis setelah retry otomatis. Status usulan tidak diubah; sistem tidak menilai berkas sebagai gagal.",actor_id:user.id
    });
   }else{
    const bad=results.filter((x:any)=>x.status!=="SESUAI").map((x:any)=>{const m=REQ.find(r=>r[0]===x.requirement_code);return (m?.[1]||x.requirement_code)+": "+(x.note||x.status)}).join(" | ").slice(0,1800);
    const reason="AI Verifikator otomatis: dokumen belum lolos. "+bad;
    await resetToDraft(reason,"AI_VERIFIKATOR_OTOMATIS_DRAFT");
    finalState={workflow_state:"DRAFT",status:"DRAFT"};
   }
   aggregateQueued=await enqueueAggregate();
  }
  return J({ok:true,run_id:run?.id||null,verification_source:verificationSource,overall_status:overall,counts:ai.counts||null,duplicate_skp:!!ai.duplicate_skp,results,auto_draft:mode==="submit"&&overall==="PERLU_PERBAIKAN",aggregate_auto_queued:aggregateQueued,final_state:finalState,forwarded_to_kabid:mode==="submit"&&overall==="SESUAI"&&finalState?.workflow_state==="MENUNGGU_PERSETUJUAN_KABID"});
 }catch(e:any){console.error("DIKLAT_AI_WORKFLOW_ERROR",e?.message||String(e));return J({error:e?.message||String(e)},400)}
});