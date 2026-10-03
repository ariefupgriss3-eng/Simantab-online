import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, VerticalAlign,
  HeadingLevel, ShadingType
} from "npm:docx@9.5.1";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const CORS={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Content-Type":"application/json"
};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:CORS});
const COMP_ORDER=["KEPRIBADIAN","SOSIAL","MANAJERIAL","KEWIRAUSAHAAN","SUPERVISI"];
const LABEL:any={
  KEPRIBADIAN:"Kepribadian",SOSIAL:"Sosial",MANAJERIAL:"Manajerial",
  KEWIRAUSAHAAN:"Kewirausahaan",SUPERVISI:"Supervisi"
};
const READINESS_LABEL:any={
  SANGAT_SIAP:"Sangat Siap",
  SIAP:"Siap",
  PERLU_PENGUATAN:"Perlu Penguatan",
  PERLU_PENDAMPINGAN_INTENSIF:"Perlu Pendampingan Intensif"
};
const RECOMMENDATION:any={
  KEPRIBADIAN:"Perkuat integritas, refleksi, kematangan emosi, konsistensi keputusan, serta keberpihakan pada peserta didik.",
  SOSIAL:"Perkuat komunikasi, mediasi, kolaborasi, jejaring, dan kemampuan membangun kemitraan yang etis serta produktif.",
  MANAJERIAL:"Perkuat analisis akar masalah, pengambilan keputusan berbasis data, prioritas program, pengelolaan sumber daya, dan evaluasi dampak.",
  KEWIRAUSAHAAN:"Perkuat kemampuan melihat peluang, merancang inovasi, mengelola risiko, memobilisasi sumber daya, dan mengukur nilai pendidikan.",
  SUPERVISI:"Perkuat observasi berbasis bukti, refleksi guru, umpan balik, tindak lanjut, diferensiasi, serta fokus pada kualitas pengalaman belajar siswa."
};
const LOGO_URLS=[
  "https://boss.batangkab.go.id/src/back/img/favicon.png",
  "https://upload.wikimedia.org/wikipedia/commons/f/f4/Lambang_Kabupaten_Batang.png"
];
let logoCache:Uint8Array|null=null;

function bytesToBase64(bytes:Uint8Array){
  let s="";
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk){
    s+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  }
  return btoa(s);
}
function sanitizeName(s:string){
  return String(s||"Peserta").normalize("NFKD").replace(/[^A-Za-z0-9 _.-]/g,"").trim().replace(/\s+/g,"-").slice(0,80)||"Peserta";
}
function idDateTime(v:string|null|undefined){
  if(!v)return "-";
  try{
    return new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(v))+" WIB";
  }catch{return "-"}
}
function durationLabel(start:string,end:string){
  const ms=Math.max(0,new Date(end).getTime()-new Date(start).getTime());
  const min=Math.floor(ms/60000), sec=Math.floor((ms%60000)/1000);
  return min+" menit "+sec+" detik";
}
function pct(v:any){return Number(v||0).toLocaleString("id-ID",{minimumFractionDigits:0,maximumFractionDigits:1})+"%";}
async function getLogo(){
  if(logoCache)return logoCache;
  for(const url of LOGO_URLS){
    try{
      const r=await fetch(url,{headers:{"User-Agent":"SIMANTAB-ONLINE/1.0"}});
      if(r.ok){
        const b=new Uint8Array(await r.arrayBuffer());
        if(b.length>1000){logoCache=b;return b;}
      }
    }catch{}
  }
  throw new Error("Logo Kabupaten Batang tidak dapat dimuat.");
}
async function loadResult(admin:any,attemptId:string){
  const {data:attempt,error:ae}=await admin.from("bcks_substansi_attempts")
    .select("id,user_id,mode,started_at,submitted_at,status,total_questions,correct_count,score,readiness_label,priority_competency,dominant_subcompetency,is_official_result,official_exclusion_reason")
    .eq("id",attemptId).maybeSingle();
  if(ae||!attempt)throw new Error("Hasil simulasi tidak ditemukan.");
  if(attempt.mode!=="SIMULASI"||attempt.status!=="SUBMITTED")throw new Error("Dokumen hanya tersedia untuk simulasi yang sudah selesai.");
   if(attempt.is_official_result!==true)throw new Error("Dokumen resmi hanya tersedia untuk hasil simulasi pertama yang diperhitungkan.");

  const [{data:detail,error:de},{data:prof,error:pe},{data:scores,error:se}]=await Promise.all([
    admin.from("ks_bcks_submission_details").select("full_name,nip,pangkat_golruang,unit_kerja").eq("user_id",attempt.user_id).maybeSingle(),
    admin.from("profiles").select("id,full_name,nip,school_npsn").eq("id",attempt.user_id).maybeSingle(),
    admin.from("bcks_substansi_competency_scores").select("competency,correct_count,total_count,percentage").eq("attempt_id",attemptId)
  ]);
  if(de||pe||se)throw de||pe||se;

  let school:any=null;
  if(prof?.school_npsn){
    const {data,error}=await admin.from("school_master").select("npsn,school_name,jenjang").eq("npsn",prof.school_npsn).maybeSingle();
    if(error)throw error;
    school=data;
  }
  const scoreMap=new Map((scores||[]).map((x:any)=>[x.competency,x]));
  const rows=COMP_ORDER.map(comp=>({
    competency:comp,
    label:LABEL[comp],
    correct_count:Number(scoreMap.get(comp)?.correct_count||0),
    total_count:Number(scoreMap.get(comp)?.total_count||0),
    percentage:Number(scoreMap.get(comp)?.percentage||0)
  }));
  const priority=String(attempt.priority_competency||"");
  return {
    attempt,
    person:{
      full_name:detail?.full_name||prof?.full_name||"Peserta BCKS",
      nip:detail?.nip||prof?.nip||"-",
      pangkat_golruang:detail?.pangkat_golruang||"-",
      unit_kerja:detail?.unit_kerja||school?.school_name||"-",
      npsn:prof?.school_npsn||school?.npsn||"-",
      jenjang:String(school?.jenjang||"-").toUpperCase()
    },
    rows,
    statusLabel:READINESS_LABEL[attempt.readiness_label]||attempt.readiness_label||"-",
    priorityLabel:LABEL[priority]||priority||"-",
    recommendation:priority?RECOMMENDATION[priority]:"Pertahankan konsistensi pengambilan keputusan yang profesional, berbasis bukti, etis, kolaboratif, akuntabel, dan berpihak pada peserta didik."
  };
}
function cellText(text:string,bold=false,size=20,align:any=AlignmentType.LEFT){
  return new TableCell({
    verticalAlign:VerticalAlign.CENTER,
    margins:{top:100,bottom:100,left:120,right:120},
    children:[new Paragraph({alignment:align,children:[new TextRun({text:String(text??""),bold,size,font:"Arial"})]})]
  });
}
function sectionHeading(text:string){
  return new Paragraph({spacing:{before:180,after:100},children:[new TextRun({text,bold:true,size:23,font:"Arial",color:"0F3F76"})]});
}
async function makeDocx(data:any,logo:Uint8Array){
  const border={style:BorderStyle.SINGLE,size:6,color:"B8C7D6"};
  const resultRows=data.rows.map((r:any,i:number)=>new TableRow({children:[
    cellText(String(i+1),false,19,AlignmentType.CENTER),
    cellText(r.label,false,19),
    cellText(String(r.correct_count),false,19,AlignmentType.CENTER),
    cellText(String(r.total_count),false,19,AlignmentType.CENTER),
    cellText(pct(r.percentage),true,19,AlignmentType.CENTER)
  ]}));
  const doc=new Document({
    creator:"SIMANTAB-ONLINE - Disdikbud Kabupaten Batang",
    title:"Hasil Simulasi dan Thinking Culture BCKS",
    description:"Dokumen hasil latihan SIMANTAB",
    sections:[{
      properties:{page:{margin:{top:700,right:850,bottom:700,left:850}}},
      children:[
        new Table({
          width:{size:100,type:WidthType.PERCENTAGE},
          borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideHorizontal:{style:BorderStyle.NONE},insideVertical:{style:BorderStyle.NONE}},
          rows:[new TableRow({children:[
            new TableCell({width:{size:18,type:WidthType.PERCENTAGE},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new ImageRun({data:logo,type:"png",transformation:{width:70,height:88}})]})]}),
            new TableCell({width:{size:82,type:WidthType.PERCENTAGE},children:[
              new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"PEMERINTAH KABUPATEN BATANG",bold:true,size:25,font:"Arial"})]}),
              new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"DINAS PENDIDIKAN DAN KEBUDAYAAN",bold:true,size:25,font:"Arial"})]}),
              new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"BIDANG PEMBINAAN KETENAGAAN",bold:true,size:23,font:"Arial"})]}),
              new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Jl. Slamet Riyadi No. 29 Batang",size:18,font:"Arial"})]})
            ]})
          ]})]
        }),
        new Paragraph({border:{bottom:{color:"000000",space:1,style:BorderStyle.DOUBLE,size:8}},spacing:{after:180}}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:40},children:[new TextRun({text:"HASIL SIMULASI DAN THINKING CULTURE",bold:true,size:27,font:"Arial"})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:180},children:[new TextRun({text:"Diklat Kepala Sekolah / BCKS",bold:true,size:22,font:"Arial",color:"0F3F76"})]}),

        sectionHeading("A. IDENTITAS PESERTA"),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:{top:border,bottom:border,left:border,right:border,insideHorizontal:border,insideVertical:border},rows:[
          new TableRow({children:[cellText("Nama Peserta",true),cellText(data.person.full_name)]}),
          new TableRow({children:[cellText("NIP",true),cellText(data.person.nip)]}),
          new TableRow({children:[cellText("Pangkat/Gol. Ruang",true),cellText(data.person.pangkat_golruang)]}),
          new TableRow({children:[cellText("Unit Kerja",true),cellText(data.person.unit_kerja)]}),
          new TableRow({children:[cellText("Jenjang",true),cellText(data.person.jenjang)]}),
          new TableRow({children:[cellText("NPSN",true),cellText(data.person.npsn)]}),
          new TableRow({children:[cellText("Waktu Mulai",true),cellText(idDateTime(data.attempt.started_at))]}),
          new TableRow({children:[cellText("Waktu Selesai",true),cellText(idDateTime(data.attempt.submitted_at))]}),
          new TableRow({children:[cellText("Durasi",true),cellText(durationLabel(data.attempt.started_at,data.attempt.submitted_at))]})
        ]}),

        sectionHeading("B. RINGKASAN HASIL"),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:{top:border,bottom:border,left:border,right:border,insideHorizontal:border,insideVertical:border},rows:[
          new TableRow({children:[cellText("Nilai Akhir",true),cellText(String(Number(data.attempt.score||0).toLocaleString("id-ID",{maximumFractionDigits:1})),true)]}),
          new TableRow({children:[cellText("Jumlah Benar",true),cellText(String(data.attempt.correct_count||0)+" dari "+String(data.attempt.total_questions||70)+" soal")]}),
          new TableRow({children:[cellText("Status Kesiapan",true),cellText(data.statusLabel,true)]}),
          new TableRow({children:[cellText("Prioritas Penguatan",true),cellText(data.priorityLabel,true)]})
        ]}),

        sectionHeading("C. RINCIAN 5 KOMPETENSI"),
        new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:{top:border,bottom:border,left:border,right:border,insideHorizontal:border,insideVertical:border},rows:[
          new TableRow({tableHeader:true,children:[
            cellText("No",true,19,AlignmentType.CENTER),
            cellText("Kompetensi",true,19,AlignmentType.CENTER),
            cellText("Benar",true,19,AlignmentType.CENTER),
            cellText("Total",true,19,AlignmentType.CENTER),
            cellText("Persentase",true,19,AlignmentType.CENTER)
          ]}),
          ...resultRows
        ]}),

        sectionHeading("D. REKOMENDASI PENGUATAN"),
        new Paragraph({spacing:{after:80},children:[new TextRun({text:"Prioritas: "+data.priorityLabel,bold:true,size:21,font:"Arial"})]}),
        new Paragraph({alignment:AlignmentType.JUSTIFIED,spacing:{after:100,line:300},children:[new TextRun({text:data.recommendation,size:20,font:"Arial"})]}),
        new Paragraph({alignment:AlignmentType.JUSTIFIED,spacing:{after:160,line:300},children:[new TextRun({text:"Peserta dapat melanjutkan latihan melalui AI Coach pada SIMANTAB untuk memperkuat kompetensi prioritas melalui kasus adaptif.",size:20,font:"Arial"})]}),

        sectionHeading("E. CATATAN"),
        new Paragraph({alignment:AlignmentType.JUSTIFIED,spacing:{after:180,line:300},children:[
          new TextRun({text:"Hasil ini merupakan indikator latihan pada sistem SIMANTAB dan bukan passing grade resmi Kemendikdasmen. Dokumen digunakan sebagai bahan refleksi, pemetaan kesiapan, dan penguatan kompetensi peserta.",italic:true,size:19,font:"Arial"})
        ]}),
        new Paragraph({alignment:AlignmentType.RIGHT,spacing:{before:180},children:[new TextRun({text:"Diterbitkan otomatis oleh SIMANTAB-ONLINE",size:18,font:"Arial",color:"667788"})]}),
        new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Bidang Pembinaan Ketenagaan - Disdikbud Kabupaten Batang",bold:true,size:18,font:"Arial",color:"0F3F76"})]})
      ]
    }]
  });
  return new Uint8Array(await Packer.toBuffer(doc));
}

function splitText(text:string,font:any,size:number,maxWidth:number){
  const words=String(text).split(/\s+/);
  const lines:string[]=[];
  let line="";
  for(const w of words){
    const t=line?line+" "+w:w;
    if(font.widthOfTextAtSize(t,size)<=maxWidth)line=t;
    else{if(line)lines.push(line);line=w;}
  }
  if(line)lines.push(line);
  return lines;
}
async function makePdf(data:any,logo:Uint8Array){
  const pdf=await PDFDocument.create();
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const img=await pdf.embedPng(logo);
  const pageSize:[number,number]=[595.28,841.89];
  let page=pdf.addPage(pageSize);
  let y=805;
  const left=48,right=547,width=499;
  const addPage=()=>{page=pdf.addPage(pageSize);y=795;};
  const ensure=(need:number)=>{if(y-need<55)addPage();};
  const text=(s:string,x:number,yy:number,size=10,f=font,color=rgb(0.08,0.14,0.22))=>page.drawText(String(s),{x,y:yy,size,font:f,color});
  const center=(s:string,yy:number,size:number,f:any)=>{const w=f.widthOfTextAtSize(s,size);text(s,(595.28-w)/2,yy,size,f);};
  const line=(yy:number)=>page.drawLine({start:{x:left,y:yy},end:{x:right,y:yy},thickness:0.7,color:rgb(.2,.25,.3)});
  const section=(s:string)=>{ensure(28);y-=14;text(s,left,y,11,bold,rgb(.06,.25,.46));y-=9;};
  const row=(a:string,b:string)=>{
    ensure(26);page.drawRectangle({x:left,y:y-20,width:155,height:22,borderWidth:.4,borderColor:rgb(.72,.78,.84)});page.drawRectangle({x:left+155,y:y-20,width:344,height:22,borderWidth:.4,borderColor:rgb(.72,.78,.84)});
    text(a,left+6,y-13,8.5,bold);text(b,left+161,y-13,8.5,font);y-=22;
  };
  const drawWrapped=(s:string,size=9,f=font,indent=0)=>{
    const lines=splitText(s,f,size,width-indent);
    ensure(lines.length*(size+4)+4);
    for(const ln of lines){text(ln,left+indent,y,size,f);y-=size+4;}
  };

  page.drawImage(img,{x:54,y:743,width:62,height:78});
  center("PEMERINTAH KABUPATEN BATANG",805,12,bold);
  center("DINAS PENDIDIKAN DAN KEBUDAYAAN",789,12,bold);
  center("BIDANG PEMBINAAN KETENAGAAN",773,11,bold);
  center("Jl. Slamet Riyadi No. 29 Batang",758,8.5,font);
  line(744);page.drawLine({start:{x:left,y:741},end:{x:right,y:741},thickness:1.6,color:rgb(0,0,0)});
  center("HASIL SIMULASI DAN THINKING CULTURE",718,13,bold);
  center("Diklat Kepala Sekolah / BCKS",702,10.5,bold);
  y=675;

  section("A. IDENTITAS PESERTA");
  row("Nama Peserta",data.person.full_name);row("NIP",data.person.nip);row("Pangkat/Gol. Ruang",data.person.pangkat_golruang);
  row("Unit Kerja",data.person.unit_kerja);row("Jenjang",data.person.jenjang);row("NPSN",data.person.npsn);
  row("Waktu Mulai",idDateTime(data.attempt.started_at));row("Waktu Selesai",idDateTime(data.attempt.submitted_at));row("Durasi",durationLabel(data.attempt.started_at,data.attempt.submitted_at));

  section("B. RINGKASAN HASIL");
  row("Nilai Akhir",Number(data.attempt.score||0).toLocaleString("id-ID",{maximumFractionDigits:1}));
  row("Jumlah Benar",String(data.attempt.correct_count||0)+" dari "+String(data.attempt.total_questions||70)+" soal");
  row("Status Kesiapan",data.statusLabel);row("Prioritas Penguatan",data.priorityLabel);

  section("C. RINCIAN 5 KOMPETENSI");
  ensure(145);
  const cols=[left,left+35,left+245,left+325,left+390,right];
  const headers=["No","Kompetensi","Benar","Total","Persentase"];
  for(let i=0;i<5;i++){page.drawRectangle({x:cols[i],y:y-22,width:cols[i+1]-cols[i],height:22,borderWidth:.5,borderColor:rgb(.65,.72,.78),color:rgb(.92,.96,.99)});text(headers[i],cols[i]+4,y-14,8,bold);}
  y-=22;
  data.rows.forEach((r:any,i:number)=>{
    for(let c=0;c<5;c++)page.drawRectangle({x:cols[c],y:y-21,width:cols[c+1]-cols[c],height:21,borderWidth:.4,borderColor:rgb(.72,.78,.84)});
    text(String(i+1),cols[0]+12,y-13,8.5,font);text(r.label,cols[1]+5,y-13,8.5,font);text(String(r.correct_count),cols[2]+24,y-13,8.5,font);text(String(r.total_count),cols[3]+24,y-13,8.5,font);text(pct(r.percentage),cols[4]+16,y-13,8.5,bold);y-=21;
  });

  section("D. REKOMENDASI PENGUATAN");
  drawWrapped("Prioritas: "+data.priorityLabel,9.5,bold);
  y-=3;drawWrapped(data.recommendation,9,font);
  y-=3;drawWrapped("Peserta dapat melanjutkan latihan melalui AI Coach pada SIMANTAB untuk memperkuat kompetensi prioritas melalui kasus adaptif.",9,font);

  section("E. CATATAN");
  drawWrapped("Hasil ini merupakan indikator latihan pada sistem SIMANTAB dan bukan passing grade resmi Kemendikdasmen. Dokumen digunakan sebagai bahan refleksi, pemetaan kesiapan, dan penguatan kompetensi peserta.",8.5,font);
  y-=14;ensure(45);text("Diterbitkan otomatis oleh SIMANTAB-ONLINE",left,y,8.5,font,rgb(.35,.42,.5));y-=14;text("Bidang Pembinaan Ketenagaan - Disdikbud Kabupaten Batang",left,y,8.5,bold,rgb(.06,.25,.46));

  const pages=pdf.getPages();
  pages.forEach((p:any,idx:number)=>{const n=String(idx+1)+" / "+String(pages.length);p.drawText(n,{x:510,y:24,size:8,font,color:rgb(.45,.5,.55)});});
  return new Uint8Array(await pdf.save());
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
    if(!token)return json({error:"Unauthorized"},401);
    const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
    const {data:{user},error:ue}=await admin.auth.getUser(token);
    if(ue||!user)return json({error:"Unauthorized"},401);

    const {data:viewer,error:ve}=await admin.from("profiles").select("id,role,account_channel,is_active").eq("id",user.id).maybeSingle();
    if(ve||!viewer?.is_active)return json({error:"Akun tidak aktif."},403);

    const body=await req.json().catch(()=>({}));
    const attemptId=String(body?.attempt_id||"").trim();
    const format=String(body?.format||"pdf").toLowerCase();
    if(!attemptId||!["pdf","docx"].includes(format))return json({error:"attempt_id dan format wajib valid."},400);

    const {data:attempt}=await admin.from("bcks_substansi_attempts").select("id,user_id,mode,status").eq("id",attemptId).maybeSingle();
    if(!attempt)return json({error:"Hasil simulasi tidak ditemukan."},404);

    let allowed=attempt.user_id===user.id;
    if(!allowed&&String(viewer.account_channel||"").toUpperCase()==="DINAS"){
      const role=String(viewer.role||"");
      if(["SUPER_ADMIN","KEPALA_DINAS","SEKRETARIS_DINAS","KABID"].includes(role))allowed=true;
      else if(["KASI_SD","KASI_SMP","SUBKOOR_TK"].includes(role)){
        const {data:target}=await admin.from("profiles").select("school_npsn").eq("id",attempt.user_id).maybeSingle();
        if(target?.school_npsn){
          const {data:school}=await admin.from("school_master").select("jenjang").eq("npsn",target.school_npsn).maybeSingle();
          const j=String(school?.jenjang||"").toUpperCase();
          allowed=(role==="KASI_SD"&&j==="SD")||(role==="KASI_SMP"&&j==="SMP")||(role==="SUBKOOR_TK"&&["TK","PAUD"].includes(j));
        }
      }
    }
    if(!allowed)return json({error:"Tidak berwenang mengunduh hasil peserta ini."},403);

    const data=await loadResult(admin,attemptId);
    const logo=await getLogo();
    const bytes=format==="docx"?await makeDocx(data,logo):await makePdf(data,logo);
    const ext=format==="docx"?"docx":"pdf";
    const mime=format==="docx"?"application/vnd.openxmlformats-officedocument.wordprocessingml.document":"application/pdf";
    const filename="Hasil-Simulasi-BCKS-"+sanitizeName(data.person.full_name)+"."+ext;
    return json({ok:true,filename,mime,base64:bytesToBase64(bytes),size:bytes.length});
  }catch(e:any){
    console.error("BCKS_EXPORT_ERROR",e?.message||String(e));
    return json({error:e?.message||String(e)},400);
  }
});
