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

  const content=[{type:'input_text',text:
   'Anda adalah AI Verifikator administrasi Diklat Kepala Sekolah. Baca isi semua berkas secara teliti. Peserta: '+(participant.full_name||'-')+
   '; NIP: '+(participant.nip||'-')+'; Unit: '+(participant.unit_kerja||'-')+'. SKP_1 wajib SKP tahun 2024; SKP_2 wajib SKP tahun 2025. '+
   'Periksa jenis dokumen, tahun, nama/NIP peserta, keterbacaan, dan kesesuaian substansi dengan label. Jika salah jenis/tahun/identitas => TIDAK_SESUAI. '+
   'Jika buram, terpotong, halaman penting hilang, atau tidak cukup terbaca => PERLU_PERBAIKAN. SESUAI hanya jika isi dapat dibaca dan cocok. '+
   'Jangan menilai keaslian hukum atau motif. Balas hanya JSON valid: {"documents":[{"requirement_code":"...","status":"SESUAI|PERLU_PERBAIKAN|TIDAK_SESUAI","detected_document_type":null,"detected_year":null,"detected_name":null,"detected_nip":null,"readability_score":0.0,"confidence":0.0,"evidence":"...","note":"..."}]}.'
  }];
  const hashes={};
  for(const spec of REQUIRED){
   const d=by.get(spec.code),r=await fetch(d.signed_url);if(!r.ok)throw new Error('Gagal membaca '+spec.label);
   const buf=await r.arrayBuffer();if(buf.byteLength>512000)throw new Error(spec.label+' melebihi 500 KB');
   hashes[spec.code]=await sha256Hex(buf);
   const mime=String(d.mime_type||r.headers.get('content-type')||'application/pdf').split(';')[0];
   content.push({type:'input_text',text:'BERKAS '+spec.code+' — '+spec.label+'. Syarat: '+spec.rule+'. Nama file: '+String(d.file_name||'-')});
   if(mime.startsWith('image/'))content.push({type:'input_image',image_url:'data:'+mime+';base64,'+toB64(buf),detail:'high'});
   else content.push({type:'input_file',filename:String(d.file_name||spec.code+'.pdf'),file_data:'data:application/pdf;base64,'+toB64(buf)});
  }
  const ar=await fetch('https://ai-gateway.vercel.sh/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+gateway,'Content-Type':'application/json'},body:JSON.stringify({model:'google/gemini-2.5-flash-lite',input:[{type:'message',role:'user',content}],max_output_tokens:5000})});
  const aj=await ar.json();if(!ar.ok){console.error('DIKLAT_AI_GATEWAY_ERROR',ar.status,JSON.stringify(aj).slice(0,1500));throw new Error(aj?.error?.message||aj?.error||('AI Gateway '+ar.status));}
  const parsed=parse(txt(aj)),got=new Map((parsed?.documents||[]).map(x=>[x.requirement_code,x]));
  const results=REQUIRED.map(spec=>{const x=got.get(spec.code)||{};let status=['SESUAI','PERLU_PERBAIKAN','TIDAK_SESUAI'].includes(x.status)?x.status:'PERLU_PERBAIKAN';const year=x.detected_year==null?null:Number(x.detected_year),read=clamp(x.readability_score),conf=clamp(x.confidence);if(spec.year&&year!==spec.year)status=year==null?'PERLU_PERBAIKAN':'TIDAK_SESUAI';if((read<.8||conf<.8)&&status==='SESUAI')status='PERLU_PERBAIKAN';return{requirement_code:spec.code,status,detected_document_type:x.detected_document_type??null,detected_year:Number.isFinite(year)?year:null,detected_name:x.detected_name??null,detected_nip:x.detected_nip??null,readability_score:read,confidence:conf,evidence:String(x.evidence||'').slice(0,500),note:String(x.note||'').slice(0,500)}});
  const dup=hashes.SKP_1&&hashes.SKP_1===hashes.SKP_2;
  if(dup)for(const x of results)if(x.requirement_code==='SKP_1'||x.requirement_code==='SKP_2'){x.status='TIDAK_SESUAI';x.note='SKP 2024 dan SKP 2025 menggunakan berkas yang sama.'}
  const counts={sesuai:results.filter(x=>x.status==='SESUAI').length,perbaikan:results.filter(x=>x.status==='PERLU_PERBAIKAN').length,tidak:results.filter(x=>x.status==='TIDAK_SESUAI').length};
  const overall_status=counts.tidak||counts.perbaikan?'PERLU_PERBAIKAN':'SESUAI';
  return J({ok:true,engine:'DIKLAT_DOC_AI_V2',model:'google/gemini-2.5-flash-lite',overall_status,duplicate_skp:dup,counts,results});
 }catch(e){console.error('DIKLAT_AI_READ_ERROR',e?.message||String(e));return J({error:e?.message||String(e)},400)}
}