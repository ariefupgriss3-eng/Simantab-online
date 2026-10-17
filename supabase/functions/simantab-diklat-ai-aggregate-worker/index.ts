// SIMANTAB_KS_BCKS_MANUAL_ONLY_FREE_20261017
// Decision A: all legacy Vercel/paid AI requests fail closed; use manual workflow.
const cors={
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"content-type,x-simantab-worker-secret",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
 "Content-Type":"application/json",
 "Cache-Control":"no-store"
};
Deno.serve(req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method==="GET")return new Response(JSON.stringify({
  ok:true,mode:"FREE_LOCAL_MANUAL",legacyAi:false,
  message:"Verifikasi Diklat KS dilakukan petugas Dinas. Riwayat AI lama tetap tersimpan."
 }),{status:200,headers:cors});
 if(req.method==="POST")return new Response(JSON.stringify({
  ok:false,code:"MANUAL_REVIEW_ONLY",paidGateway:false,
  error:"AI eksternal Diklat KS dinonaktifkan. Segarkan SIMANTAB dan gunakan Ajukan ke Dinas (verifikasi manual)."
 }),{status:409,headers:cors});
 return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:cors});
});