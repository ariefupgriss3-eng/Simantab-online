import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const C={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
  "Content-Type":"application/json"
};
const J=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:C});
const MAX_FILE=1572864;
const sha256Text=async(s:string)=>{
  const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");
};

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:C});
  if(req.method==="GET")return J({ok:true,engine:"JABFUNG_DOC_AI_V1",policy:"ADVISORY_HUMAN_FINAL"});
  try{
    const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/,"");
    if(!token)return J({error:"Unauthorized"},401);
    const url=Deno.env.get("SUPABASE_URL")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin=createClient(url,service,{auth:{persistSession:false}});
    const {data:{user},error:ue}=await admin.auth.getUser(token);
    if(ue||!user)return J({error:"Unauthorized"},401);

    const body=await req.json().catch(()=>({}));
    const id=String(body?.submission_id||"").trim();
    if(!id)return J({error:"submission_id wajib."},400);

    const [{data:caller},{data:sub},{data:reqs},{data:files}]=await Promise.all([
      admin.from("profiles").select("id,role,account_channel,is_active").eq("id",user.id).maybeSingle(),
      admin.from("submissions").select("id,user_id,service_type,status,title,workflow_state").eq("id",id).maybeSingle(),
      admin.from("service_requirements").select("id,code,label,is_required,sort_order,description").eq("service_type","E_JABFUNG").eq("is_active",true).order("sort_order"),
      admin.from("submission_files").select("id,requirement_code,storage_path,file_name,file_size,mime_type,created_at").eq("submission_id",id).order("created_at",{ascending:false})
    ]);
    if(!caller?.is_active||!sub||sub.service_type!=="E_JABFUNG")return J({error:"Usulan Jabfung tidak tersedia."},404);
    const owner=sub.user_id===user.id;
    const dinas=caller.account_channel==="DINAS" || !["GTK","KEPALA_SEKOLAH"].includes(String(caller.role||""));
    if(!owner&&!dinas)return J({error:"Tidak berwenang."},403);

    const {data:ownerProfile}=await admin.from("profiles").select("id,full_name,nip,unit,position").eq("id",sub.user_id).maybeSingle();

    const by=new Map<string,any>();
    for(const f of files||[])if(f.requirement_code&&!by.has(f.requirement_code))by.set(f.requirement_code,f);

    const requirements=(reqs||[]).map((r:any)=>({
      id:r.id,code:r.code,label:r.label,is_required:!!r.is_required,sort_order:r.sort_order,description:r.description
    }));
    const missingRequired=requirements.filter((r:any)=>r.is_required&&!by.get(r.code));

    const documents:any[]=[];
    for(const r of requirements){
      const f=by.get(r.code);
      if(!f)continue;
      if(Number(f.file_size||0)<1||Number(f.file_size||0)>MAX_FILE){
        return J({error:r.label+" harus berukuran maksimal 1,5 MB."},409);
      }
      const {data:signed,error:se}=await admin.storage.from("simantab-documents").createSignedUrl(f.storage_path,900);
      if(se)throw se;
      documents.push({
        requirement_code:r.code,
        file_id:f.id,
        file_name:f.file_name,
        mime_type:f.mime_type,
        signed_url:signed.signedUrl
      });
    }

    const fingerprintParts=(files||[])
      .filter((f:any)=>!!f.requirement_code)
      .map((f:any)=>[f.requirement_code,f.id,f.file_size,f.created_at])
      .sort((a:any,b:any)=>String(a[0]).localeCompare(String(b[0])));
    const sourceFingerprint=await sha256Text(JSON.stringify(fingerprintParts));
    const cacheCutoff=new Date(Date.now()-24*60*60*1000).toISOString();
    const {data:cached}=await admin.from("jabfung_ai_verification_runs")
      .select("id,overall_status,sesuai_count,perbaikan_count,tidak_sesuai_count,telaah_count,technical_count,result,completed_at")
      .eq("submission_id",id)
      .eq("source_fingerprint",sourceFingerprint)
      .gte("completed_at",cacheCutoff)
      .order("completed_at",{ascending:false})
      .limit(1)
      .maybeSingle();

    if(cached?.id){
      const result:any=cached.result||{};
      return J({
        ok:true,
        run_id:cached.id,
        overall_status:cached.overall_status,
        counts:result.counts||{
          sesuai:cached.sesuai_count||0,
          perbaikan:cached.perbaikan_count||0,
          tidak:cached.tidak_sesuai_count||0,
          telaah:cached.telaah_count||0,
          teknis:cached.technical_count||0
        },
        results:Array.isArray(result.results)?result.results:[],
        cache_hit:true,
        cached_at:cached.completed_at,
        advisory:true,
        human_final:true,
        disclaimer:"Hasil AI identik dengan berkas yang sama dalam 24 jam terakhir, sehingga sistem memakai cache untuk menghemat biaya. Keabsahan final tetap diverifikasi manusia."
      });
    }

    let ai:any={
      ok:true,engine:"JABFUNG_DOC_AI_V1",model:"google/gemini-2.5-flash-lite",
      overall_status:missingRequired.length?"PERLU_TELAAH":"SESUAI",
      counts:{sesuai:0,perbaikan:missingRequired.length,tidak:0,telaah:0,teknis:0},
      results:[],
      disclaimer:"AI hanya memberi indikator. Keabsahan final ditetapkan verifikator manusia."
    };

    if(documents.length){
      const resp=await fetch("https://simantab-online.vercel.app/api/jabfung-ai-read",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
        body:JSON.stringify({
          submission_id:id,
          participant:{
            full_name:ownerProfile?.full_name||"",
            nip:ownerProfile?.nip||"",
            unit:ownerProfile?.unit||"",
            position:ownerProfile?.position||""
          },
          requirements,
          documents
        })
      });
      const raw=await resp.text();
      let payload:any={};try{payload=JSON.parse(raw)}catch{}
      if(!resp.ok)throw new Error(payload?.error||raw||("HTTP "+resp.status));
      ai=payload;
    }

    const resultBy=new Map<string,any>((Array.isArray(ai.results)?ai.results:[]).map((x:any)=>[x.requirement_code,x]));
    for(const r of missingRequired){
      resultBy.set(r.code,{
        requirement_code:r.code,
        status:"PERLU_PERBAIKAN",
        detected_document_type:null,
        detected_year:null,
        detected_name:null,
        detected_nip:null,
        readability_score:0,
        readability_status:"TIDAK_TERBACA",
        stamp_present:null,
        signature_present:null,
        authenticity_indicator:"TIDAK_DAPAT_DIPASTIKAN",
        authenticity_note:"Berkas belum diunggah.",
        confidence:1,
        evidence:"",
        note:"Berkas wajib belum diunggah.",
        technical_error:false
      });
    }
    for(const r of requirements.filter((x:any)=>!x.is_required&&!by.get(x.code))){
      resultBy.set(r.code,{
        requirement_code:r.code,
        status:"TIDAK_DIUNGGAH_OPSIONAL",
        detected_document_type:null,
        detected_year:null,
        detected_name:null,
        detected_nip:null,
        readability_score:null,
        readability_status:null,
        stamp_present:null,
        signature_present:null,
        authenticity_indicator:"TIDAK_DAPAT_DIPASTIKAN",
        authenticity_note:"Dokumen opsional tidak diunggah.",
        confidence:null,
        evidence:"",
        note:"Opsional.",
        technical_error:false
      });
    }

    const ordered=requirements.map((r:any)=>resultBy.get(r.code)).filter(Boolean);
    const counts={
      sesuai:ordered.filter((x:any)=>x.status==="SESUAI").length,
      perbaikan:ordered.filter((x:any)=>x.status==="PERLU_PERBAIKAN").length,
      tidak:ordered.filter((x:any)=>x.status==="TIDAK_SESUAI").length,
      telaah:ordered.filter((x:any)=>x.status==="PERLU_TELAAH").length,
      teknis:ordered.filter((x:any)=>x.technical_error===true).length
    };
    const overall=counts.teknis?"GAGAL_TEKNIS":((counts.perbaikan||counts.tidak||counts.telaah)?"PERLU_TELAAH":"SESUAI");
    const summary=overall==="SESUAI"
      ?"AI: seluruh berkas wajib terbaca dan sesuai; keabsahan final tetap diverifikasi petugas."
      :"AI: terdapat berkas yang perlu diperbaiki atau ditelaah petugas. AI tidak menetapkan asli/palsu.";

    const {data:run,error:runErr}=await admin.from("jabfung_ai_verification_runs").insert({
      submission_id:id,
      requested_by:user.id,
      engine_version:ai.engine||"JABFUNG_DOC_AI_V1",
      model_name:ai.model||"google/gemini-2.5-flash-lite",
      overall_status:overall,
      sesuai_count:counts.sesuai,
      perbaikan_count:counts.perbaikan,
      tidak_sesuai_count:counts.tidak,
      telaah_count:counts.telaah,
      technical_count:counts.teknis,
      source_fingerprint:sourceFingerprint,
      summary,
      result:{...ai,overall_status:overall,counts,results:ordered},
      completed_at:new Date().toISOString()
    }).select("id").single();
    if(runErr)throw runErr;

    for(const r of requirements){
      const x:any=resultBy.get(r.code);
      if(!x)continue;
      const f=by.get(r.code);
      const {error:de}=await admin.from("jabfung_ai_document_verifications").insert({
        run_id:run.id,
        submission_id:id,
        file_id:f?.id||null,
        requirement_code:r.code,
        expected_label:r.label,
        status:x.status||"PERLU_TELAAH",
        detected_document_type:x.detected_document_type??null,
        detected_year:x.detected_year??null,
        detected_name:x.detected_name??null,
        detected_nip:x.detected_nip??null,
        readability_score:x.readability_score??null,
        readability_status:x.readability_status??null,
        stamp_present:x.stamp_present??null,
        signature_present:x.signature_present??null,
        authenticity_indicator:x.authenticity_indicator??"TIDAK_DAPAT_DIPASTIKAN",
        authenticity_note:x.authenticity_note??null,
        confidence:x.confidence??null,
        evidence:x.evidence??null,
        note:x.note??null,
        technical_error:x.technical_error===true
      });
      if(de)throw de;

      const reqId=r.id;
      await admin.from("submission_requirement_checks").update({
        ai_status:x.status||"PERLU_TELAAH",
        ai_note:x.note||x.authenticity_note||null,
        ai_result:x,
        ai_checked_at:new Date().toISOString()
      }).eq("submission_id",id).eq("requirement_id",reqId);
    }

    await admin.from("submission_events").insert({
      submission_id:id,
      status:"AI_VERIFIKATOR_JABFUNG",
      note:summary,
      actor_id:user.id
    });

    return J({
      ok:true,
      run_id:run.id,
      overall_status:overall,
      counts,
      results:ordered,
      advisory:true,
      human_final:true,
      disclaimer:"AI hanya memberi indikator kesesuaian, keterbacaan, dan anomali visual stempel/tanda tangan/TTE. Keabsahan final harus diverifikasi manusia atau sumber resmi."
    });
  }catch(e:any){
    console.error("JABFUNG_AI_WORKFLOW_ERROR",e?.message||String(e));
    return J({error:e?.message||String(e)},400);
  }
});