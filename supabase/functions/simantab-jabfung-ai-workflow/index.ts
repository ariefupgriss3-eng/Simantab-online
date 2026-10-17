// SIMANTAB_JABFUNG_AI_WORKFLOW_FREE_ONLY_V5
// Remove unreachable Vercel reader code. Preserve v4 FREE_LOCAL_ONLY outputs.
const H={
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
 "Content-Type":"application/json"
};
const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:H});
Deno.serve(req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:H});
 if(req.method==="GET")return respond({ok:true,engine:"JABFUNG_LOCAL_OCR_V1",mode:"FREE_LOCAL_ONLY",paidGateway:false});
 if(req.method==="POST")return respond({
   error:"Verifikator Jabfung kini memakai OCR gratis di perangkat. Muat ulang halaman lalu gunakan Periksa Berkas Gratis.",
   code:"FREE_LOCAL_ONLY",paidGateway:false
 },503);
 return respond({error:"Method not allowed"},405);
});