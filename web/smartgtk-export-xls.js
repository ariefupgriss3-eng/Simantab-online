/* SIMANTAB_SMARTGTK_OFFICER_XLS_UI_V1
 * Export controls are decorative only until the officer role is verified
 * by the Supabase RPC; the browser role check is not an access-control boundary.
 */
if(!window.__simantabSmartGtkXlsLoaded){
 window.__simantabSmartGtkXlsLoaded=true;
 const ROLES=new Set(["SUPER_ADMIN","KABID","KASI_SD","KASI_SMP","SUBKOOR_TK"]);
 const officer=()=>{
  const p=window.__simantabProfile||{};
  return p.account_channel==="DINAS" && p.approval_status==="APPROVED"
    && p.is_active===true && ROLES.has(p.role);
 };
 const role=()=>window.__simantabProfile?.role||"";
 const scopeText=()=>({
   KASI_SD:"SD sesuai NPSN terverifikasi dalam master sekolah",
   KASI_SMP:"SMP sesuai NPSN terverifikasi dalam master sekolah",
   SUBKOOR_TK:"TK sesuai NPSN terverifikasi dalam master sekolah",
 }[role()]||"Seluruh jenjang akun Guru/Kepala Sekolah di SIMANTAB");
 const panel=(id)=>{
  const box=document.createElement("section");
  box.id=id;box.className="card";box.setAttribute("aria-label","Unduh rekap SMART-GTK dalam Excel");
  box.style.cssText="border:2px solid #c0d8e9;background:#f1f8ff;color:#183b5d;margin:10px 0;padding:14px;border-radius:12px;";
  const title=document.createElement("h3");title.textContent="📊 Rekap SMART-GTK • Excel (.xls)";
  const desc=document.createElement("p");desc.className="small";
  desc.textContent="Cakupan: "+scopeText()+". Termasuk akun belum mengisi, status berkas, pendidikan, dan skrining JF. Ini rekap akun SIMANTAB, bukan data seluruh guru Batang.";
  const btn=document.createElement("button");btn.type="button";btn.className="btn primary";btn.textContent="⬇ Unduh Rekap SMART-GTK (.xls)";
  btn.addEventListener("click",()=>{void download(btn,msg)});
  const msg=document.createElement("p");msg.style.cssText="font-size:12px;margin:8px 0 0;";
  msg.setAttribute("role","status");
  box.append(title,desc,btn,msg);return box;
 };
 let busy=false;
 async function download(button,msg){
  if(busy||!officer())return;
  const sb=window.__simantabSb;
  if(!sb){msg.textContent="Sesi SIMANTAB belum siap. Coba login ulang.";return}
  busy=true;button.disabled=true;button.textContent="Menyiapkan rekap Excel…";
  msg.textContent="Memeriksa hak akses dan membaca data terbaru. Permintaan ekspor dicatat dalam audit.";
  try{
   const {data,error}=await sb.functions.invoke("simantab-smartgtk-export-xls",{
     body:{action:"EXPORT_XLS"}
   });
   if(error)throw error;
   if(!(data instanceof Blob))throw Error("Server belum mengirim berkas Excel yang valid");
   if(data.size<100)throw Error("Berkas Excel kosong atau tidak valid");
   const filenameDate=new Intl.DateTimeFormat("en-CA",{
     timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"
   }).format(new Date()).replace(/-/g,"");
   const scope=({KASI_SD:"SD",KASI_SMP:"SMP",SUBKOOR_TK:"TK"}[role()]||"SEMUA");
   const a=document.createElement("a");
   const obj=URL.createObjectURL(data);
   a.href=obj;a.download="REKAP_SMART_GTK_"+scope+"_"+filenameDate+".xls";
   a.style.display="none";document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(obj),60000);
   msg.textContent="Unduhan Excel diproses. Simpan berkas untuk kepentingan administrasi Dinas; jangan sebarkan NIP ke grup publik.";
  }catch(err){
   msg.textContent="Gagal mengunduh rekap. "+String(err?.message||err||"").slice(0,220)+". Hubungi admin jika berulang.";
  }finally{
   busy=false;button.disabled=false;button.textContent="⬇ Unduh Rekap SMART-GTK (.xls)";
  }
 }
 function place(){
  const dashboard=document.getElementById("dashboard");
  const mainBody=document.getElementById("dashboardBody");
  const services=document.getElementById("servicesBody");
  if(!officer()){
   document.getElementById("smartgtkExportDashboard")?.remove();
   document.getElementById("smartgtkExportServices")?.remove();
   return;
  }
  if(dashboard && mainBody && !document.getElementById("smartgtkExportDashboard")){
   dashboard.insertBefore(panel("smartgtkExportDashboard"),mainBody);
  }
  if(services && !document.getElementById("smartgtkExportServices")){
   services.prepend(panel("smartgtkExportServices"));
  }
 }
 if(typeof window.showTab==="function"){
  const original=window.showTab;
  window.showTab=async function(...args){
   const r=await original.apply(this,args);
   place();
   return r;
  };
 }
 window.addEventListener("simantab:profile-ready",place);
 window.addEventListener("simantab:logout",place);
 place();
}
