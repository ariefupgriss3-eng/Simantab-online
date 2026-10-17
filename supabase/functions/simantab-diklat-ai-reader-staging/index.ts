// SIMANTAB_DIKLAT_AI_READER_STAGING_RETIRED_LOCAL_ONLY_V2
// Option A: no external AI providers and no document forwarding.
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Content-Type":"application/json"};
Deno.serve(req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:H});
 return new Response(JSON.stringify({ok:false,code:"LOCAL_HUMAN_REVIEW_ONLY",error:"Pembaca dokumen berbasis AI eksternal tidak digunakan. Pemeriksaan dilakukan petugas Dinas.",externalAI:false,paidGateway:false}),{status:503,headers:H});
});