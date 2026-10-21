import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import * as XLSX from "npm:xlsx@0.18.5";

/* SIMANTAB_SMARTGTK_OFFICER_XLS_EXPORT_V1
 * Real BIFF8 .xls file, not a mislabeled CSV/HTML/XML file.
 * Officer access, school scope, and audit enforced in the database function.
 */
const ALLOWED_ORIGINS = new Set([
  "https://simantab-cf-preview.m-arief-rohman.workers.dev",
  "https://feature-cloudflare-jf-guru-2026-0294-simantab-cf-preview.m-arief-rohman.workers.dev",
  "https://simantab-online.vercel.app",
]);
const ALLOWED_ROLES = new Set(["SUPER_ADMIN","KABID","KASI_SD","KASI_SMP","SUBKOOR_TK"]);
const FIELDS = [
  ["nama","Nama lengkap"],
  ["nip","NIP (teks)"],
  ["unit_kerja","Unit kerja"],
  ["jenjang","Jenjang sekolah"],
  ["npsn","NPSN (teks)"],
  ["kecamatan","Kecamatan"],
  ["peran_akun","Role akun"],
  ["status_akun","Status akun"],
  ["akun_aktif","Akun aktif"],
  ["profesi_dilaporkan","Profesi dilaporkan"],
  ["status_kepegawaian","Status kepegawaian"],
  ["pendidikan_terakhir","Pendidikan terakhir (pernyataan)"],
  ["status_pendidikan","Status studi (pernyataan)"],
  ["kepemilikan_sk_jf","Ada SK JF Guru"],
  ["nomenklatur_disampaikan","Nomenklatur telah disesuaikan"],
  ["formasi_pns_jf","Formasi PNS JF Guru"],
  ["skrining_penyesuaian","Skrining penyesuaian nomenklatur"],
  ["skrining_pengangkatan","Skrining pengangkatan JF"],
  ["skrining_kualifikasi","Skrining kualifikasi"],
  ["status_pengisian","Tahap pendataan SMART-GTK"],
  ["dokumen_tercatat","Jumlah berkas tercatat"],
  ["indikasi_nip_ganda","Indikasi NIP ganda"],
  ["nip_18_digit","NIP 18 digit"],
  ["unit_kerja_terisi","Unit kerja terisi"],
  ["diperbarui_pada","Data diperbarui (WIB)"],
];
const corsHeaders = (origin: string | null): Record<string,string> => {
  const headers: Record<string,string> = {
    "Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Access-Control-Max-Age":"1800",
    "Vary":"Origin",
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
  };
  if(origin && ALLOWED_ORIGINS.has(origin))headers["Access-Control-Allow-Origin"]=origin;
  return headers;
};
const cell = (value: unknown): string | number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? "YA" : "TIDAK";
  if (value == null) return "";
  const str = String(value).slice(0,32000).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g," ");
  // User-controlled unit/name fields must never be interpreted as Excel formulae.
  return /^[\s\u0000-\u001f]*[=+@-]/.test(str) ? "'"+str : str;
};
const fmtTime = (value: unknown): string => {
  if(!value)return "";
  const d=new Date(String(value));
  if(Number.isNaN(d.getTime()))return "";
  return new Intl.DateTimeFormat("id-ID",{
    timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23",
  }).format(d)+" WIB";
};
function makeWorkbook(data: Record<string,any>): Uint8Array {
  if(!Array.isArray(data.rows))throw Error("Format rekap tidak dikenal");
  if(data.rows.length > 60000 || data.rows.length !== data.row_count)throw Error("Jumlah baris tidak konsisten");
  const submitted = Number(data.submitted||0);
  const pending = Number(data.pending||0);
  const registered = Number(data.row_count||0);
  const approved = registered - pending;
  const cover = [
    ["REKAP PENDATAAN SMART-GTK — DISDIKBUD KABUPATEN BATANG",""],
    ["Diekspor pada",fmtTime(data.generated_at)],
    ["Role pengunduh",data.role||""],
    ["Cakupan",data.scope==="SEMUA_JENJANG"?"Seluruh jenjang akun SIMANTAB":data.scope],
    ["Akun Guru / Kepala Sekolah tercakup",registered],
    ["Akun disetujui dan aktif",approved],
    ["Sudah mengisi SMART-GTK (akun disetujui)",submitted],
    ["Belum mengisi SMART-GTK (akun disetujui)",Math.max(0,approved-submitted)],
    ["Akun menunggu persetujuan",pending],
    ["Tenggat", "26 Oktober 2026 pukul 23.59 WIB"],
    ["Catatan 1","Hanya akun yang terdaftar dalam SIMANTAB; bukan sensus guru Kabupaten Batang."],
    ["Catatan 2","Rekap Kasi/Subkoor hanya berdasarkan NPSN yang dikenali dalam school_master."],
    ["Catatan 3","NIP ganda berarti indikasi, bukan alasan menyatukan atau menghapus akun otomatis."],
    ["Catatan 4","Pendidikan adalah pernyataan GTK sampai ijazah diverifikasi secara administratif."],
    ["Catatan 5","Skrining JF hanya untuk identifikasi awal; bukan verifikasi, persetujuan, atau SK."],
  ].map(r=>r.map(cell));
  const heading = ["No.",...FIELDS.map(f=>f[1])];
  const body = data.rows.map((row:Record<string,unknown>,i:number)=>[
    i+1,...FIELDS.map(([field])=>cell(field==="diperbarui_pada"?fmtTime(row[field]):row[field]))
  ]);
  const wb=XLSX.utils.book_new();
  const summarySheet=XLSX.utils.aoa_to_sheet(cover);
  summarySheet["!cols"]=[{wch:52},{wch:100}];
  XLSX.utils.book_append_sheet(wb,summarySheet,"Ringkasan");
  const rosterSheet=XLSX.utils.aoa_to_sheet([heading,...body]);
  rosterSheet["!cols"]=heading.map((_,i)=>({wch:i===1?35:i===3?35:i===2?24:i>=17&&i<=19?30:20}));
  XLSX.utils.book_append_sheet(wb,rosterSheet,"Rekap GTK");
  const output=XLSX.write(wb,{type:"array",bookType:"biff8"});
  return new Uint8Array(output);
}
Deno.serve(async req=>{
  const headers=corsHeaders(req.headers.get("Origin"));
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
    status,headers:{...headers,"Content-Type":"application/json; charset=utf-8"},
  });
  if(req.method==="OPTIONS"){
    const origin=req.headers.get("Origin");
    return new Response(null,{status:origin&& !ALLOWED_ORIGINS.has(origin)?403:204,headers});
  }
  if(req.method!=="POST")return reply({error:"Hanya POST diizinkan"},405);
  try{
    const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();
    if(!token)return reply({error:"Login diperlukan"},401);
    const input=await req.json().catch(()=>({}));
    if(input.action!=="EXPORT_XLS")return reply({error:"Aksi tidak valid"},400);
    const url=Deno.env.get("SUPABASE_URL");
    const key=Deno.env.get("SUPABASE_ANON_KEY");
    if(!url || !key)throw Error("Konfigurasi Supabase belum siap");
    const client=createClient(url,key,{
      auth:{persistSession:false,autoRefreshToken:false},
      global:{headers:{Authorization:"Bearer "+token}},
    });
    const {data:{user},error:authError}=await client.auth.getUser(token);
    if(authError||!user)return reply({error:"Sesi tidak sah"},401);
    // Both the edge function and the privileged RPC independently enforce officer roles.
    const {data:profile,error:profileError}=await client.from("profiles")
      .select("role,account_channel,approval_status,is_active").eq("id",user.id).maybeSingle();
    if(profileError||!profile||!ALLOWED_ROLES.has(profile.role)
      ||profile.account_channel!=="DINAS"||profile.approval_status!=="APPROVED"
      ||profile.is_active!==true)return reply({error:"Akun tidak berwenang"},403);
    const {data,error}=await client.rpc("smartgtk_officer_export_data");
    if(error){
      if(error.code==="42501")return reply({error:"Akses rekap ditolak"},403);
      throw Error("Gagal membaca rekap SMART-GTK");
    }
    const binary=makeWorkbook(data);
    const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).replaceAll("-","");
    const name="REKAP_SMART_GTK_"+data.scope+"_"+today+".xls";
    return new Response(binary,{
      status:200,
      headers:{
        ...headers,
        "Content-Type":"application/vnd.ms-excel",
        "Content-Disposition":'attachment; filename="'+name+'"',
        "Content-Length":String(binary.byteLength),
      },
    });
  }catch(error){
    console.error("SMART-GTK export failed",error instanceof Error?error.message:"unknown");
    return reply({error:"Unduh rekap belum berhasil. Hubungi admin SIMANTAB."},500);
  }
});
