// SIMANTAB_PUBLIC_PTK_BKN_SNAPSHOT_V2
// Source is a PUBLIC HTML REPORT, not a documented machine-readable API.
// Aggregate by NPSN only; never ingest NIK, NIP, names of persons or individual PTK.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const BASE="https://referensi.data.kemendikdasmen.go.id";
const COUNTY="/ptk-bkn/data_ptk?level=2&wilayah=032500";
const SOURCE_TYPE="PUBLIC_WEBPAGE_NOT_API";
const CORS={
 "access-control-allow-origin":"*",
 "access-control-allow-headers":"authorization, x-client-info, apikey, content-type",
 "access-control-allow-methods":"POST,OPTIONS",
 "cache-control":"no-store",
};
const send=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...CORS,"content-type":"application/json; charset=utf-8"}});
const trim=v=>String(v??"").replace(/\s+/g," ").trim();
const decoded=s=>String(s||"").replace(/&nbsp;|&#160;/gi," ")
 .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&apos;|&#39;/gi,"'")
 .replace(/&lt;/gi,"<").replace(/&gt;/gi,">")
 .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n));
const clean=s=>trim(decoded(String(s??"").replace(/<[^>]+>/g," ")));
const int=s=>{const v=clean(s).replace(/[.,\s]/g,"");return /^\d+$/.test(v)?Number(v):NaN};
const cells=tr=>[...tr.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>clean(m[1]));
const trs=html=>[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>({html:m[1],cells:cells(m[1])}));
const codeOK=id=>/^0325\d{2}$/.test(String(id));

async function officialFetch(path){
 const url=new URL(path,BASE);
 if(url.origin!==BASE || url.pathname!=="/ptk-bkn/data_ptk")throw Error("Alamat sumber tidak diizinkan");
 const ctrl=new AbortController();
 const timeout=setTimeout(()=>ctrl.abort(),11000);
 try{
   const resp=await fetch(url.toString(),{
     signal:ctrl.signal,redirect:"manual",
     headers:{"accept":"text/html","user-agent":"SIMANTAB-public-PTK-reconciliation/1.0 (aggregate metadata only)"}
   });
   if(resp.status!==200)throw Error("Sumber resmi memberi HTTP "+resp.status);
   const typ=resp.headers.get("content-type")||"";
   if(!typ.toLowerCase().includes("text/html"))throw Error("Sumber resmi tidak menyajikan HTML");
   const html=await resp.text();
   if(html.length<1500 || html.length>5000000)throw Error("Respons sumber kosong atau melampaui batas");
   if(!/pemadanan|pendidik\s*dan\s*tenaga\s*kependidikan|PTK ASN/i.test(html))throw Error("Identitas halaman sumber tidak cocok");
   return html;
 } finally {clearTimeout(timeout)}
}
function parseDistrictIndex(html){
 if(!/Kab(?:upaten|\.)\s*Batang/i.test(clean(html)))throw Error("Wilayah sumber bukan Kabupaten Batang");
 const list=[];
 for(const tr of trs(html)){
  const match=[...tr.html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)]
   .map(m=>decoded(m[1])).map(h=>{try{return new URL(h,BASE)}catch{return null}})
   .filter(u=>u&&u.origin===BASE&&u.pathname==="/ptk-bkn/data_ptk"&&u.searchParams.get("level")==="3")
   .find(u=>codeOK(u.searchParams.get("wilayah")));
  if(!match)continue;
  const id=match.searchParams.get("wilayah");
  const c=tr.cells;
  const name=c.find(t=>/^Kec\.?\s/i.test(t))||"";
  // Kabupaten summary: No, Wilayah, Total PTK, Total PTK ASN, Negeri, Swasta, ...
  const nameIndex=c.findIndex(v=>/^Kec\.?\s/i.test(v));
  const expectedPtk=int(c[nameIndex+1]),expectedAsn=int(c[nameIndex+2]);
  if(nameIndex<0 || !Number.isFinite(expectedPtk) || !Number.isFinite(expectedAsn)
    || expectedAsn>expectedPtk)throw Error("Kolom rekap kecamatan berubah: "+id);
  if(!list.some(r=>r.id===id))list.push({id,name,expectedPtk,expectedAsn});
 }
 if(list.length!==15)throw Error("Daftar kecamatan tidak lengkap: ditemukan "+list.length+", diharapkan 15");
 return list;
}
function parseSchools(html,district){
 if(!/Kab(?:upaten|\.)\s*Batang/i.test(clean(html)))throw Error("Data sekolah bukan wilayah Kabupaten Batang");
 if(!/NPSN/i.test(html)||!/Total ASN/i.test(html))throw Error("Kolom PTK/ASN sekolah tidak sesuai");
 const rows=[];
 for(const tr of trs(html)){
  const c=tr.cells;
  const i=c.findIndex((t,k)=>k<4&&/^\d{8}$/.test(t));
  if(i<0)continue;
  const npsn=c[i],name=c[i+1],status=c[i+2],total=int(c[i+3]),asn=int(c[i+4]);
  if(!name||!['NEGERI','SWASTA'].includes(trim(status).toUpperCase())
   ||!Number.isSafeInteger(total)||!Number.isSafeInteger(asn)||total<0||asn<0||asn>total){
    throw Error("Nilai sekolah tidak valid pada NPSN "+npsn);
  }
  rows.push({npsn,school_name_source:name,school_status_source:trim(status).toUpperCase(),
    total_ptk:total,total_asn:asn,district_code:district.id,source_url:BASE+"/ptk-bkn/data_ptk?level=3&wilayah="+district.id});
 }
 if(rows.length<5)throw Error("Rincian kecamatan "+district.name+" tidak lengkap");
 if(new Set(rows.map(r=>r.npsn)).size!==rows.length)throw Error("NPSN ganda di kecamatan "+district.id);
 // Rekap kecamatan menghitung semua PTK, sedangkan rincian NPSN
 // berasal dari kohort pemadanan ASN. Samakan hanya denominator ASN.
 const n=rows.reduce((a,r)=>a+r.total_ptk,0),a=rows.reduce((x,r)=>x+r.total_asn,0);
 if(a!==district.expectedAsn)
  throw Error("Jumlah ASN "+district.name+" tidak cocok: rekap "+district.expectedAsn+", rincian NPSN "+a+"; hentikan sinkronisasi");
 if(n>district.expectedPtk)
  throw Error("PTK rincian "+district.name+" melebihi total kecamatan: "+n+" > "+district.expectedPtk);
 return rows;
}
async function loggedIn(req){
 const jwt=(req.headers.get("authorization")||"").match(/^Bearer\s+(\S+)$/i)?.[1];
 if(!jwt)throw Error("Sesi tidak tersedia. Login kembali.");
 const u=Deno.env.get("SUPABASE_URL"),pub=Deno.env.get("SUPABASE_ANON_KEY"),
       secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!u||!pub||!secret)throw Error("Konfigurasi server belum lengkap");
 const auth=createClient(u,pub,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await auth.auth.getUser(jwt);
 if(error||!user)throw Error("Sesi tidak valid. Login kembali.");
 const admin=createClient(u,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:profile,error:pe}=await admin.from("profiles")
  .select("id,role,is_active,approval_status").eq("id",user.id).single();
 if(pe||!profile||!profile.is_active||profile.approval_status!=="APPROVED"
   ||!["SUPER_ADMIN","KABID"].includes(profile.role))throw Error("Hanya Super Admin dan Kabid yang berwenang.");
 return {user,admin};
}
async function preview(){
 const html=await officialFetch(COUNTY);
 const ds=parseDistrictIndex(html);
 const first=ds.find(d=>d.id==="032506")||ds[0];
 const schools=parseSchools(await officialFetch("/ptk-bkn/data_ptk?level=3&wilayah="+first.id),first);
 return {ok:true,source_type:SOURCE_TYPE,source_url:BASE+COUNTY,districts:ds.length,
  example_district:first.name,example_code:first.id,example_schools:schools.length,
  example_ptk:schools.reduce((s,r)=>s+r.total_ptk,0),
  example_asn:schools.reduce((s,r)=>s+r.total_asn,0),
  warning:"Uji baca berhasil. Belum ada data database yang diubah."};
}
async function sync(admin,user){
 const {data:recent,error:re}=await admin.from("gtk_public_bkn_runs").select("id,completed_at,matched_schools,matched_total_asn")
  .eq("status","COMPLETE").order("completed_at",{ascending:false}).limit(1);
 if(re)throw re;
 if(recent?.[0]&&Date.now()-Date.parse(recent[0].completed_at)<24*3600*1000)
  return {ok:true,reused:true,run:recent[0],note:"Snapshot masih baru; sinkronisasi paling sering satu kali dalam 24 jam."};
 const ds=parseDistrictIndex(await officialFetch(COUNTY));
 const rows=[];
 // Deliberately sequential and throttled: no high-frequency scraping of public site.
 for(let i=0;i<ds.length;i++){
  const d=ds[i];
  if(i>0)await new Promise(resolve=>setTimeout(resolve,220));
  rows.push(...parseSchools(await officialFetch("/ptk-bkn/data_ptk?level=3&wilayah="+d.id),d));
 }
 if(new Set(rows.map(r=>r.npsn)).size!==rows.length)throw Error("NPSN ganda antarkecamatan");
 const {data:master,error:me}=await admin.from("school_master").select("npsn,school_name,school_status,bentuk_pendidikan")
   .eq("is_active",true).range(0,1999);
 if(me)throw me;
 if(!master||master.length<800)throw Error("Master SIMANTAB tidak lengkap");
 const mapped=new Map(master.filter(s=>["TK","SD","SMP"].includes(trim(s.bentuk_pendidikan).toUpperCase())).map(r=>[r.npsn,r]));
 const matched=rows.filter(r=>mapped.has(r.npsn));
 // Data sumber includes SMA/SMK and other levels. Only display matches to SIMANTAB scope.
 if(matched.length<250)throw Error("Kecocokan NPSN terlalu rendah: "+matched.length);
 const {data:run,error:ie}=await admin.from("gtk_public_bkn_runs")
  .insert({status:"PREPARING",initiated_by:user.id,source_districts:ds.length,
   source_schools:rows.length,matched_schools:matched.length,
   unmatched_schools:rows.length-matched.length,
   matched_total_ptk:matched.reduce((a,r)=>a+r.total_ptk,0),
   matched_total_asn:matched.reduce((a,r)=>a+r.total_asn,0),
   note:"Sumber laman publik, bukan API terdokumentasi; angka ASN gabungan Guru/Tendik; tidak mengubah master."})
  .select("id").single();
 if(ie||!run)throw Error("Gagal menyiapkan snapshot: "+(ie?.message||"unknown"));
 try{
   for(let i=0;i<matched.length;i+=200){
      const batch=matched.slice(i,i+200).map(row=>({run_id:run.id,...row}));
      const {error}=await admin.from("gtk_public_bkn_school_snapshot").insert(batch);
      if(error)throw error;
   }
   const {error:done}=await admin.from("gtk_public_bkn_runs")
     .update({status:"COMPLETE",completed_at:new Date().toISOString()}).eq("id",run.id);
   if(done)throw done;
 }catch(e){
   await admin.from("gtk_public_bkn_runs").update({status:"FAILED",note:String(e.message||e).slice(0,400)}).eq("id",run.id);
   throw Error("Snapshot baru gagal: data lama tetap dipertahankan.");
 }
 return {ok:true,reused:false,run_id:run.id,source_schools:rows.length,
  matched_schools:matched.length,unmatched_schools:rows.length-matched.length,
  total_ptk_matched:matched.reduce((a,r)=>a+r.total_ptk,0),
  total_asn_matched:matched.reduce((a,r)=>a+r.total_asn,0),
  source_type:SOURCE_TYPE,warning:"Rekap publik PTK bukan rincian Guru/Tendik. Master 7.008 dan data Kebutuhan GTK tidak diubah."};
}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
 if(req.method!=="POST")return send({error:"Gunakan POST"},405);
 try{
   const {user,admin}=await loggedIn(req);
   const body=await req.json().catch(()=>({}));
   if(body.action==="preview")return send(await preview());
   if(body.action==="sync")return send(await sync(admin,user));
   return send({error:"Aksi tidak tersedia"},400);
 }catch(e){
   const msg=String(e?.message||e);
   const isAccess=/sesi|Login|Super Admin|Kabid|berwenang/.test(msg);
   return send({ok:false,error:msg.slice(0,350),source_type:SOURCE_TYPE},isAccess?403:422);
 }
});
