// SIMANTAB_DIKLAT_NATIVE_READER_DISABLED_FREE_MANUAL_20261017
// Choice A. No external model integration; this staging endpoint is retired.
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
Deno.serve(req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:H});
 return new Response(JSON.stringify({
  ok:false,code:"MANUAL_REVIEW_ONLY",paidGateway:false,
  error:"Pembaca AI eksternal Diklat KS dinonaktifkan. Gunakan verifikasi lokal dan petugas Dinas."
 }),{status:req.method==="GET"?200:409,headers:H});
});