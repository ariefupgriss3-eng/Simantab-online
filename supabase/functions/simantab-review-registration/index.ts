import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const allowedOrigins = new Set([
  "https://simantab-online.vercel.app",
  "https://simantab-cf-preview.m-arief-rohman.workers.dev",
  "https://feature-cloudflare-jf-guru-2026-0294-simantab-cf-preview.m-arief-rohman.workers.dev"
]);
function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin",
    "Content-Type": "application/json"
  };
  if (origin && allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
Deno.serve(async(req)=>{
 const cors = corsHeaders(req.headers.get("Origin"));
 const reply = (body: unknown, status=200) =>
   new Response(JSON.stringify(body),{status,headers:cors});
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/,"");if(!token)return reply({error:"Unauthorized"},401);
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:{user},error:ue}=await admin.auth.getUser(token);if(ue||!user)return reply({error:"Unauthorized"},401);
  const {data:actor,error:ae}=await admin.from("profiles").select("role,is_active").eq("id",user.id).single();if(ae||!actor?.is_active||actor.role!=="SUPER_ADMIN")return reply({error:"Hanya Super Admin."},403);
  const b=await req.json(),userId=String(b.user_id||""),decision=String(b.decision||"").trim().toUpperCase();
  if(!/^[0-9a-f-]{36}$/i.test(userId)||!["APPROVE","REJECT"].includes(decision))return reply({error:"Permintaan tidak valid."},400);
  const {data:profile,error:pe}=await admin.from("profiles").select("id,requested_role,approval_status").eq("id",userId).single();if(pe||!profile)return reply({error:"Profil tidak ditemukan."},404);
  if(decision==="APPROVE"){
   if(!["KEPALA_SEKOLAH","PENGAWAS","GTK"].includes(String(profile.requested_role)))return reply({error:"Jenis akun tidak valid."},400);
   const {error:ue2}=await admin.auth.admin.updateUserById(userId,{email_confirm:true});if(ue2)throw ue2;
   const {data:updated,error:up}=await admin.from("profiles").update({role:profile.requested_role,approval_status:"APPROVED",is_active:true,account_channel:"GTK",updated_at:new Date().toISOString()}).eq("id",userId).select("id,full_name,role,requested_role,approval_status,is_active,school_npsn,nip").single();if(up)throw up;return reply({ok:true,profile:updated});
  }
  const {data:updated,error:up}=await admin.from("profiles").update({approval_status:"REJECTED",is_active:false,updated_at:new Date().toISOString()}).eq("id",userId).select("id,full_name,role,requested_role,approval_status,is_active,school_npsn,nip").single();if(up)throw up;return reply({ok:true,profile:updated});
 }catch(e){return reply({error:(e as Error)?.message||String(e)},400)}
});