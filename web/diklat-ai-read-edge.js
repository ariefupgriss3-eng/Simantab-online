const SUPABASE_URL='https://tizxfzvgglkokzvsiwkg.supabase.co';
const SUPABASE_KEY='sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB';
const REQUIRED=[
 {code:'SKP_1',label:'SKP 2024',year:2024,rule:'SKP/Sasaran Kinerja Pegawai tahun 2024'},
 {code:'SKP_2',label:'SKP 2025',year:2025,rule:'SKP/Sasaran Kinerja Pegawai tahun 2025'},
 {code:'SK_PENGALAMAN_MANAJERIAL',label:'SK Pengalaman Manajerial',year:null,rule:'SK/surat resmi pengalaman atau penugasan manajerial'},
 {code:'SK_HUDIS',label:'SK Bebas Hudis',year:null,rule:'Surat keterangan bebas/tidak sedang menjalani hukuman disiplin'},
 {code:'SKCK',label:'SKCK',year:null,rule:'Surat Keterangan Catatan Kepolisian'},
 {code:'PAKTA_INTEGRITAS',label:'Pakta Integritas',year:null,rule:'Pakta Integritas peserta'},
 {code:'SURAT_PERNYATAAN_DIKLAT',label:'Surat Pernyataan Diklat KS',year:null,rule:'Surat pernyataan bersedia mengikuti seluruh proses Diklat Kepala Sekolah'}
];
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:CORS});
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
const toB64=buf=>{const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode(...b.subarray(i,Math.min(i+0x8000,b.length)));return btoa(s)};
const txt=j=>typeof j?.output_text==='string'?j.output_text:(j?.output||[]).flatMap(x=>x?.content||[]).filter(x=>typeof x?.text==='string').map(x=>x.text).join('\n');
const parse=s=>{const t=String(s||'').trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();try{return JSON.parse(t)}catch{}const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a)return JSON.parse(t.slice(a,b+1));throw new Error('Output AI tidak valid JSON')};
async function validUser(token){const r=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token}});return r.ok}
async function sha256Hex(buf){const h=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export default async function handler(req){
 if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
 const gateway=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||'';
 if(req.method==='GET'){
  const u=new URL(req.url),probe=u.searchParams.get('probe');
  if(probe==='text'){
   if(!gateway)return J({ok:false,configured:false,error:'AI Gateway belum tersedia.'},503);
   try{
    const pr=await fetch('https://ai-gateway.vercel.sh/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+gateway,'Content-Type':'application/json'},body:JSON.stringify({model:'google/gemini-2.5-flash-lite',input:'Balas tepat: OK',max_output_tokens:32})});
    const pj=await pr.json().catch(()=>({}));
    return J({ok:pr.ok,status:pr.status,model:'google/gemini-2.5-flash-lite',output:txt(pj).slice(0,200),error:pj?.error||null},pr.ok?200:502);
   }catch(e){return J({ok:false,error:e?.message||String(e)},502)}
  }
  if(probe==='pdf'){
   if(!gateway)return J({ok:false,configured:false,error:'AI Gateway belum tersedia.'},503);
   try{
    const pdf='%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 18 Tf 40 120 Td (SKP Tahun 2025) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \ntrailer<</Root 1 0 R/Size 6>>\nstartxref\n0\n%%EOF';
    const b64=btoa(pdf);
    const pr=await fetch('https://ai-gateway.vercel.sh/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+gateway,'Content-Type':'application/json'},body:JSON.stringify({model:'google/gemini-2.5-flash-lite',input:[{role:'user',content:[{type:'input_text',text:'Baca PDF ini. Tahun SKP berapa? Balas hanya tahunnya.'},{type:'input_file',filename:'uji.pdf',file_data:'data:application/pdf;base64,'+b64}]}],max_output_tokens:64})});
    const pj=await pr.json().catch(()=>({}));
    return J({ok:pr.ok,status:pr.status,output:txt(pj).slice(0,300),error:pj?.error||null},pr.ok?200:502);
   }catch(e){return J({ok:false,error:e?.message||String(e)},502)}
  }
  if(probe==='model'){
   try{
    const mr=await fetch('https://ai-gateway.vercel.sh/v1/models'),mj=await mr.json();
    const m=(mj?.data||[]).find(x=>x.id==='google/gemini-2.5-flash-lite')||null;
    return J({ok:true,model:m});
   }catch(e){return J({ok:false,error:e?.message||String(e)},502)}
  }
  return J({ok:true,configured:!!gateway,engine:'DIKLAT_DOC_AI_V2',model:'google/gemini-2.5-flash-lite'});
 }
 if(req.method!=='POST')return J({error:'Method not allowed'},405);
 try{
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/,'');
  if(!token||!(await validUser(token)))return J({error:'Unauthorized'},401);
  const body=await req.json(),participant=body?.participant||{},docs=Array.isArray(body?.documents)?body.documents:[];
  const by=new Map(docs.map(x=>[x.requirement_code,x]));
  const missing=REQUIRED.filter(x=>!by.get(x.code));
  if(missing.length)return J({ok:true,overall_status:'PERLU_PERBAIKAN',results:REQUIRED.map(x=>({requirement_code:x.code,status:by.get(x.code)?'PERLU_PERBAIKAN':'TIDAK_SESUAI',note:by.get(x.code)?'Belum diperiksa karena berkas belum lengkap.':'Berkas belum diunggah.'}))});
  if(!gateway)return J({error:'AI Gateway belum tersedia.'},503);

  async function loadDoc(spec){
   const d=by.get(spec.code),r=await fetch(d.signed_url);if(!r.ok)throw new Error('Gagal membaca '+spec.label);
   const buf=await r.arrayBuffer();if(buf.byteLength>512000)throw new Error(spec.label+' melebihi 500 KB');
   return {spec,d,buf,hash:await sha256Hex(buf),mime:String(d.mime_type||r.headers.get('content-type')||'application/pdf').split(';')[0]};
  }
  const loaded=await Promise.all(REQUIRED.map(loadDoc));
  const loadedBy=new Map(loaded.map(x=>[x.spec.code,x]));
  const hashes=Object.fromEntries(loaded.map(x=>[x.spec.code,x.hash]));

  function normalizeResult(spec,x){
   let status=['SESUAI','PERLU_PERBAIKAN','TIDAK_SESUAI'].includes(x?.status)?x.status:'PERLU_PERBAIKAN';
   const year=x?.detected_year==null?null:Number(x.detected_year),read=clamp(x?.readability_score),conf=clamp(x?.confidence);
   if(spec.year&&year!==spec.year)status=year==null?'PERLU_PERBAIKAN':'TIDAK_SESUAI';
   if((read<.8||conf<.8)&&status==='SESUAI')status='PERLU_PERBAIKAN';
   return {requirement_code:spec.code,status,detected_document_type:x?.detected_document_type??null,detected_year:Number.isFinite(year)?year:null,detected_name:x?.detected_name??null,detected_nip:x?.detected_nip??null,readability_score:read,confidence:conf,evidence:String(x?.evidence||'').slice(0,500),note:String(x?.note||'').slice(0,500),technical_error:false};
  }

  async function analyzeGroup(specs){
   const content=[{type:'input_text',text:
    'Anda adalah AI Verifikator administrasi Diklat Kepala Sekolah. Periksa SEMUA berkas dalam kelompok ini dan wajib mengembalikan tepat '+specs.length+' hasil, satu untuk setiap requirement_code. '+
    'Peserta: '+(participant.full_name||'-')+'; NIP: '+(participant.nip||'-')+'; Unit: '+(participant.unit_kerja||'-')+'. '+
    'Baca ISI dokumen, bukan hanya nama file. Periksa jenis dokumen, tahun bila relevan, nama/NIP peserta, keterbacaan, dan kesesuaian substansi. '+
    'Jika jenis/tahun/identitas jelas salah => TIDAK_SESUAI. Jika buram, terpotong, halaman penting hilang, atau informasi kunci tidak cukup terbaca => PERLU_PERBAIKAN. '+
    'SESUAI hanya jika isi terbaca dan memenuhi persyaratan. Jangan menilai keaslian hukum atau motif. '+
    'Balas HANYA JSON valid: {"documents":[{"requirement_code":"...","status":"SESUAI|PERLU_PERBAIKAN|TIDAK_SESUAI","detected_document_type":null,"detected_year":null,"detected_name":null,"detected_nip":null,"readability_score":0.0,"confidence":0.0,"evidence":"ringkasan isi yang benar-benar terbaca","note":"alasan singkat keputusan"}]}.'
   }];
   for(const spec of specs){
    const x=loadedBy.get(spec.code);
    content.push({type:'input_text',text:'BERKAS '+spec.code+' — '+spec.label+'. Syarat: '+spec.rule+'. '+(spec.year?('Tahun wajib: '+spec.year+'. '):'')+'Nama file: '+String(x.d.file_name||'-')});
    if(x.mime.startsWith('image/'))content.push({type:'input_image',image_url:'data:'+x.mime+';base64,'+toB64(x.buf),detail:'high'});
    else content.push({type:'input_file',filename:String(x.d.file_name||spec.code+'.pdf'),file_data:'data:application/pdf;base64,'+toB64(x.buf)});
   }
   const ar=await fetch('https://ai-gateway.vercel.sh/v1/responses',{
    method:'POST',headers:{Authorization:'Bearer '+gateway,'Content-Type':'application/json'},
    body:JSON.stringify({model:'google/gemini-2.5-flash-lite',input:[{type:'message',role:'user',content}],max_output_tokens:2600})
   });
   const aj=await ar.json().catch(()=>({}));
   if(!ar.ok){
    console.error('DIKLAT_AI_GATEWAY_GROUP_ERROR',specs.map(s=>s.code).join(','),ar.status,JSON.stringify(aj).slice(0,1200));
    return specs.map(spec=>({requirement_code:spec.code,status:'PERLU_PERBAIKAN',detected_document_type:null,detected_year:null,detected_name:null,detected_nip:null,readability_score:0,confidence:0,evidence:'',note:'Pemeriksaan AI mengalami kendala teknis; dokumen belum dinilai.',technical_error:true}));
   }
   try{
    const parsed=parse(txt(aj)),arr=Array.isArray(parsed?.documents)?parsed.documents:[];
    return specs.map(spec=>{
     const x=arr.find(z=>z.requirement_code===spec.code);
     if(!x)return {requirement_code:spec.code,status:'PERLU_PERBAIKAN',detected_document_type:null,detected_year:null,detected_name:null,detected_nip:null,readability_score:0,confidence:0,evidence:'',note:'AI belum mengembalikan hasil untuk berkas ini.',technical_error:true};
     return normalizeResult(spec,x);
    });
   }catch(e){
    console.error('DIKLAT_AI_PARSE_GROUP_ERROR',specs.map(s=>s.code).join(','),e?.message||String(e),txt(aj).slice(0,1200));
    return specs.map(spec=>({requirement_code:spec.code,status:'PERLU_PERBAIKAN',detected_document_type:null,detected_year:null,detected_name:null,detected_nip:null,readability_score:0,confidence:0,evidence:'',note:'Hasil AI tidak dapat diproses; silakan verifikasi ulang.',technical_error:true}));
   }
  }

  const primaryGroups=[
   REQUIRED.filter(x=>x.code==='SKP_1'||x.code==='SKP_2'),
   REQUIRED.filter(x=>['SK_PENGALAMAN_MANAJERIAL','SK_HUDIS','SKCK'].includes(x.code)),
   REQUIRED.filter(x=>['PAKTA_INTEGRITAS','SURAT_PERNYATAAN_DIKLAT'].includes(x.code))
  ];
  let results=(await Promise.all(primaryGroups.map(analyzeGroup))).flat();

  const retrySpecs=REQUIRED.filter(spec=>results.find(x=>x.requirement_code===spec.code)?.technical_error);
  if(retrySpecs.length){
   const retry=await analyzeGroup(retrySpecs);
   const retryBy=new Map(retry.map(x=>[x.requirement_code,x]));
   results=results.map(x=>retryBy.get(x.requirement_code)||x);
  }
  const dup=hashes.SKP_1&&hashes.SKP_1===hashes.SKP_2;
  if(dup){
   const s1=results.find(x=>x.requirement_code==='SKP_1'),s2=results.find(x=>x.requirement_code==='SKP_2');
   const y1=s1?.detected_year,y2=s2?.detected_year;
   const sharedYear=(y1===y2&&(y1===2024||y1===2025))?y1:((y1===2024||y1===2025)&&!y2?y1:((y2===2024||y2===2025)&&!y1?y2:null));
   if(sharedYear===2025){
    if(s1){s1.status='TIDAK_SESUAI';s1.note='Berkas ini identik dengan SKP 2025 dan isi terbaca tahun 2025; slot SKP 2024 salah unggah.'}
    if(s2&&s2.status==='SESUAI')s2.note=(s2.note? s2.note+' ':'')+'Berkas sama dengan yang diunggah pada slot SKP 2024, tetapi isi/tahun sesuai untuk SKP 2025.';
   }else if(sharedYear===2024){
    if(s2){s2.status='TIDAK_SESUAI';s2.note='Berkas ini identik dengan SKP 2024 dan isi terbaca tahun 2024; slot SKP 2025 salah unggah.'}
    if(s1&&s1.status==='SESUAI')s1.note=(s1.note? s1.note+' ':'')+'Berkas sama dengan yang diunggah pada slot SKP 2025, tetapi isi/tahun sesuai untuk SKP 2024.';
   }else{
    for(const x of [s1,s2])if(x){x.status='PERLU_PERBAIKAN';x.technical_error=true;x.note='Dua slot memakai file identik, tetapi AI belum konsisten menentukan tahun isi. Verifikasi ulang.'}
   }
  }
  const counts={sesuai:results.filter(x=>x.status==='SESUAI').length,perbaikan:results.filter(x=>x.status==='PERLU_PERBAIKAN').length,tidak:results.filter(x=>x.status==='TIDAK_SESUAI').length,teknis:results.filter(x=>x.technical_error).length};
  const overall_status=counts.teknis?'GAGAL_TEKNIS':(counts.tidak||counts.perbaikan?'PERLU_PERBAIKAN':'SESUAI');
  return J({ok:true,engine:'DIKLAT_DOC_AI_V4_GROUPED',model:'google/gemini-2.5-flash-lite',overall_status,duplicate_skp:dup,counts,results});
 }catch(e){console.error('DIKLAT_AI_READ_ERROR',e?.message||String(e));return J({error:e?.message||String(e)},400)}
}