import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const allowedOrigin="https://simantab-online.vercel.app";
const cloudflareOrigin="https://simantab-cf-preview.m-arief-rohman.workers.dev";
const cors={"Access-Control-Allow-Origin":allowedOrigin,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const corsFor=(origin:string)=>({...cors,"Access-Control-Allow-Origin":origin===cloudflareOrigin?cloudflareOrigin:allowedOrigin,"Vary":"Origin"});
const emailOk=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin")||"";
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsFor(origin)});
 if(req.method==="OPTIONS")return new Response("ok",{status:(!origin||origin===allowedOrigin||origin===cloudflareOrigin)?200:403,headers:corsFor(origin)});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 if(origin&&origin!==allowedOrigin&&origin!==cloudflareOrigin)return reply({error:"Origin tidak diizinkan."},403);
 try{
  const b=await req.json();
  const role=String(b.role||"").trim().toUpperCase(),email=String(b.email||"").trim().toLowerCase(),password=String(b.password||""),fullName=String(b.full_name||"").trim(),rawNip=String(b.nip||"").trim(),nip=rawNip.replace(/\D/g,""),npsn=String(b.school_npsn||"").trim(),unit=String(b.unit||"").trim(),employment=String(b.employment_status||"").trim().toUpperCase();
  const requireIdentity=origin===cloudflareOrigin||Object.prototype.hasOwnProperty.call(b,"employment_status")||Object.prototype.hasOwnProperty.call(b,"unit");
  if(!["KEPALA_SEKOLAH","PENGAWAS","GTK"].includes(role))return reply({error:"Jenis akun tidak valid."},400);
  if(!fullName||!emailOk(email)||password.length<8)return reply({error:"Nama, email, dan password minimal 8 karakter wajib diisi dengan benar."},400);
  if(requireIdentity){
   if(unit.length<3||unit.length>160)return reply({error:"Unit Kerja wajib diisi (3–160 karakter)."},400);
   if(!["PNS","PPPK","PPPK_PARUH_WAKTU","NON_ASN"].includes(employment))return reply({error:"Status kepegawaian wajib dipilih."},400);
   if(rawNip&&!/^\d{18}$/.test(rawNip))return reply({error:"NIP harus tepat 18 angka."},400);
   if(employment!=="NON_ASN"&&!/^\d{18}$/.test(rawNip))return reply({error:"NIP 18 digit wajib untuk seluruh ASN."},400);
  }
  if(nip&&nip.length!==18)return reply({error:"Jika NIP diisi, gunakan 18 digit."},400);
  if(role==="PENGAWAS"&&nip.length!==18)return reply({error:"NIP Pengawas wajib 18 digit."},400);
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  if(role==="KEPALA_SEKOLAH"){
   if(!/^\d{8}$/.test(npsn))return reply({error:"NPSN Kepala Sekolah wajib 8 digit."},400);
   const {data:school,error:se}=await admin.from("school_master").select("npsn,school_name,is_active").eq("npsn",npsn).eq("is_active",true).maybeSingle();
   if(se)throw se;if(!school)return reply({error:"NPSN tidak ditemukan pada Master Sekolah aktif."},400);
  }
  // A server-side preflight gives a helpful response before Auth attempts to create
  // an account; the atomic DB trigger is authoritative against concurrent requests.
  if(nip){
   const {data:matches,error:existingNipError}=await admin.from("profiles")
     .select("id").eq("nip",nip).limit(1);
   if(existingNipError)throw existingNipError;
   if(matches?.length)return reply({
     code:"NIP_ALREADY_REGISTERED",
     error:"NIP sudah terdaftar di SIMANTAB. Jangan mendaftar ulang. Gunakan Masuk, Lupa Password, atau hubungi Super Admin untuk memulihkan akun."
   },409);
  }
  const meta={full_name:fullName,account_channel:"GTK",requested_role:role,nip:nip||"",school_npsn:role==="KEPALA_SEKOLAH"?npsn:"",unit:requireIdentity?unit:"",employment_status:requireIdentity?employment:"",registration_note:`Pendaftaran mandiri ${role} melalui SIMANTAB (server)`};
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:meta});
  if(error){
   const m=String(error.message||error);
   if(nip&&/database error creating new user|NIP sudah terdaftar|simantab_one_nip_one_account|unique constraint/i.test(m)){
     const {data:matches}=await admin.from("profiles").select("id").eq("nip",nip).limit(1);
     if(matches?.length)return reply({
       code:"NIP_ALREADY_REGISTERED",
       error:"NIP sudah terdaftar di SIMANTAB. Gunakan Masuk, Lupa Password, atau hubungi Super Admin. Jangan membuat akun baru."
     },409);
   }
   if(/already|registered|exists/i.test(m))return reply({code:"EMAIL_ALREADY_REGISTERED",error:"Email sudah terdaftar. Jika sebelumnya sudah mendaftar, gunakan Masuk atau tunggu persetujuan Super Admin sesuai jenis akun."},409);
   throw error;
  }
  if(!data.user)return reply({error:"Akun gagal dibuat."},400);
  const {data:profile,error:pe}=await admin.from("profiles").select("id,full_name,requested_role,approval_status,is_active,school_npsn").eq("id",data.user.id).single();
  if(pe){await admin.auth.admin.deleteUser(data.user.id);throw pe}
  if(requireIdentity&&role!=="KEPALA_SEKOLAH"){
   const {data:saved,error:saveError}=await admin.from("profiles").update({unit}).eq("id",data.user.id).select("unit").single();
   if(saveError||saved?.unit!==unit){await admin.auth.admin.deleteUser(data.user.id);throw new Error("Gagal menyimpan Unit Kerja; pendaftaran dibatalkan.");}
  }
  return reply({ok:true,user_id:data.user.id,profile});
 }catch(e){return reply({error:(e as Error)?.message||String(e)},400)}
});