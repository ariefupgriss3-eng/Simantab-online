/* SIMANTAB_JABFUNG_AI_READ_V1 */
/* JABFUNG_AI_SAFE_DIAGNOSTICS_V3_20261013 */
const SUPABASE_URL='https://tizxfzvgglkokzvsiwkg.supabase.co';
const SUPABASE_KEY='sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB';
const MAX_FILE=1572864;
const failureCode=e=>{
  const raw=String(e?.message||e||'');
  if(/^AI_GATEWAY_HTTP_(?:4\d\d|5\d\d)$/.test(raw))return raw;
  if(raw==='INVALID_STORAGE_SIGNED_URL')return raw;
  if(raw==='INVALID_FILE_SIGNATURE')return raw;
  if(raw==='INVALID_FILE_SIZE')return raw;
  if(/^SIGNED_FILE_HTTP_(?:4\d\d|5\d\d)$/.test(raw))return raw;
  if(raw.includes('Output AI tidak valid JSON'))return 'AI_OUTPUT_INVALID_JSON';
  if(e?.name==='AbortError'||e?.name==='TimeoutError')return 'AI_GATEWAY_TIMEOUT';
  return 'AI_GATEWAY_TRANSPORT_ERROR';
};
const isApprovedSignedUrl=(value,submissionId)=>{
  try{
    const u=new URL(String(value||'')), origin=new URL(SUPABASE_URL);
    return u.protocol==='https:' && u.host===origin.host &&
      u.pathname.startsWith('/storage/v1/object/sign/simantab-documents/') &&
      u.pathname.includes('/'+encodeURIComponent(submissionId)+'/') &&
      u.searchParams.has('token');
  }catch{return false}
};
const validSignature=(buf,mime)=>{
  const bytes=new Uint8Array(buf);
  if(mime==='application/pdf'){
    return bytes.length>=5 && Array.from(bytes.slice(0,Math.min(bytes.length,1024))).some((v,i,a)=>
      v===37&&a[i+1]===80&&a[i+2]===68&&a[i+3]===70&&a[i+4]===45);
  }
  if(mime==='image/jpeg')return bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(mime==='image/png')return bytes.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  return false;
};
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:CORS});
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
const toB64=buf=>{const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode(...b.subarray(i,Math.min(i+0x8000,b.length)));return btoa(s)};
const txt=j=>typeof j?.output_text==='string'?j.output_text:(j?.output||[]).flatMap(x=>x?.content||[]).filter(x=>typeof x?.text==='string').map(x=>x.text).join('\n');
const parse=s=>{const t=String(s||'').trim().replace(/^\`\`\`(?:json)?/i,'').replace(/\`\`\`$/,'').trim();try{return JSON.parse(t)}catch{}const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a)return JSON.parse(t.slice(a,b+1));throw new Error('Output AI tidak valid JSON')};
async function validUser(token){const r=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token}});return r.ok}
async function claimAiQuota(token,submissionId){
  const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/jabfung_ai_claim_request',{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({p_submission_id:submissionId})
  });
  const raw=await r.text();
  let j={};try{j=JSON.parse(raw)}catch{}
  if(!r.ok)throw new Error(j?.message||j?.error||raw||('Quota HTTP '+r.status));
  return j||{};
}
async function sha256Hex(buf){const h=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}

function expectedRule(code,label){
  if(code==='SKP_2024') return 'Harus merupakan SKP/Sasaran Kinerja Pegawai tahun 2024.';
  if(code==='SKP_2025') return 'Harus merupakan SKP/Sasaran Kinerja Pegawai tahun 2025.';
  if(code==='PAK_JABFUNG') return 'Harus merupakan PAK yang relevan untuk pengajuan kenaikan jenjang Jabatan Fungsional/PAK 2025.';
  if(code==='SK_CPNS') return 'Harus merupakan SK pengangkatan CPNS milik pengusul.';
  if(code==='SK_PNS') return 'Harus merupakan SK pengangkatan PNS milik pengusul.';
  if(code==='SK_KP_TERAKHIR') return 'Harus merupakan SK kenaikan pangkat terakhir milik pengusul.';
  if(code==='SK_JABATAN_SEBELUMNYA') return 'Harus merupakan SK Jabatan Fungsional pada jabatan/jenjang sebelumnya.';
  if(code==='SERTIFIKAT_UKOM') return 'Harus merupakan sertifikat Uji Kompetensi yang relevan dengan kenaikan jenjang.';
  if(code==='SK_PG_PENGGUNAAN_GELAR') return 'Jika diunggah, harus merupakan SK penggunaan/pencantuman gelar yang relevan.';
  if(code==='IJAZAH') return 'Harus merupakan ijazah milik pengusul.';
  if(code==='TRANSKRIP') return 'Harus merupakan transkrip nilai milik pengusul dan konsisten dengan ijazah.';
  if(code==='DOKUMEN_LAIN') return 'Dokumen pendukung lain/sertifikat lain; cukup identifikasi isi dan relevansinya.';
  return 'Harus sesuai dengan jenis persyaratan: '+label+'.';
}

function normalize(spec,x){
  let status=['SESUAI','PERLU_PERBAIKAN','TIDAK_SESUAI','PERLU_TELAAH'].includes(x?.status)?x.status:'PERLU_TELAAH';
  const read=clamp(x?.readability_score),conf=clamp(x?.confidence);
  const readability=['TERBACA','BURAM','TERPOTONG','KONTRAS_RENDAH','TIDAK_TERBACA','SEBAGIAN_TERBACA'].includes(x?.readability_status)?x.readability_status:(read>=.85?'TERBACA':read>=.55?'SEBAGIAN_TERBACA':'TIDAK_TERBACA');
  const auth=['WAJAR','PERLU_TELAAH','TIDAK_DAPAT_DIPASTIKAN'].includes(x?.authenticity_indicator)?x.authenticity_indicator:'TIDAK_DAPAT_DIPASTIKAN';
  const expectedNip=String(spec.participant_nip||'').replace(/\D/g,''),detectedNip=String(x?.detected_nip||'').replace(/\D/g,'');
  const year=x?.detected_year==null?null:Number(x.detected_year);

  if(spec.code==='SKP_2024' && year && year!==2024) status='TIDAK_SESUAI';
  if(spec.code==='SKP_2025' && year && year!==2025) status='TIDAK_SESUAI';
  if(expectedNip&&detectedNip&&expectedNip!==detectedNip) status='TIDAK_SESUAI';
  if(read<.55 || readability==='TIDAK_TERBACA') status='PERLU_PERBAIKAN';
  else if((read<.8 || ['BURAM','TERPOTONG','KONTRAS_RENDAH','SEBAGIAN_TERBACA'].includes(readability)) && status==='SESUAI') status='PERLU_PERBAIKAN';
  if(auth==='PERLU_TELAAH' && status==='SESUAI') status='PERLU_TELAAH';

  return {
    requirement_code:spec.code,
    status,
    detected_document_type:x?.detected_document_type??null,
    detected_year:Number.isFinite(year)?year:null,
    detected_name:x?.detected_name??null,
    detected_nip:x?.detected_nip??null,
    readability_score:read,
    readability_status:readability,
    stamp_present:typeof x?.stamp_present==='boolean'?x.stamp_present:null,
    signature_present:typeof x?.signature_present==='boolean'?x.signature_present:null,
    authenticity_indicator:auth,
    authenticity_note:String(x?.authenticity_note||'').slice(0,600),
    confidence:conf,
    evidence:String(x?.evidence||'').slice(0,600),
    note:String(x?.note||'').slice(0,600),
    technical_error:false
  };
}

async function analyzeOne(gateway,participant,spec,loaded){
  const content=[{type:'input_text',text:
    'Anda adalah AI Verifikator dokumen administrasi kenaikan jenjang Jabatan Fungsional. Periksa satu dokumen secara hati-hati. '+
    'Pengusul: '+(participant.full_name||'-')+'; NIP: '+(participant.nip||'-')+'; Unit: '+(participant.unit||'-')+'. '+
    'Slot berkas: '+spec.code+' — '+spec.label+'. Ketentuan: '+expectedRule(spec.code,spec.label)+' '+
    'WAJIB memeriksa: (1) kesesuaian jenis/isi dokumen dengan slot, (2) identitas/tahun bila relevan, (3) keterbacaan termasuk blur, terpotong, kontras, halaman penting, '+
    '(4) keberadaan dan kewajaran visual stempel/tanda tangan/TTE/QR bila tampak. '+
    'Untuk aspek autentisitas, JANGAN pernah menyatakan ASLI atau PALSU sebagai kepastian. Anda hanya boleh memberi indikator visual: WAJAR, PERLU_TELAAH, atau TIDAK_DAPAT_DIPASTIKAN. '+
    'PERLU_TELAAH dipakai bila terlihat indikasi seperti tepi tempelan yang tidak wajar, resolusi/kompresi stempel atau tanda tangan sangat berbeda dari dokumen, posisi/lapisan tidak natural, pengulangan visual mencurigakan, atau anomali lain. '+
    'TIDAK_DAPAT_DIPASTIKAN dipakai bila kualitas/format tidak memungkinkan penilaian forensik. Dokumen TTE/QR tidak boleh dianggap bermasalah hanya karena tidak ada tanda tangan basah/stempel basah. '+
    'Keabsahan final harus diverifikasi manusia melalui dokumen sumber, QR/TTE, nomor dokumen, atau instansi penerbit. '+
    'Status: SESUAI bila jenis/isi cocok dan terbaca serta tidak ada indikator yang memerlukan telaah; PERLU_PERBAIKAN bila blur/terpotong/tidak cukup terbaca; TIDAK_SESUAI bila jelas salah jenis/tahun/identitas; PERLU_TELAAH bila isi sesuai tetapi ada indikator visual autentisitas yang perlu dicek manusia. '+
    'Balas HANYA JSON valid tanpa markdown: {"status":"SESUAI|PERLU_PERBAIKAN|TIDAK_SESUAI|PERLU_TELAAH","detected_document_type":null,"detected_year":null,"detected_name":null,"detected_nip":null,"readability_score":0.0,"readability_status":"TERBACA|BURAM|TERPOTONG|KONTRAS_RENDAH|TIDAK_TERBACA|SEBAGIAN_TERBACA","stamp_present":null,"signature_present":null,"authenticity_indicator":"WAJAR|PERLU_TELAAH|TIDAK_DAPAT_DIPASTIKAN","authenticity_note":"...","confidence":0.0,"evidence":"...","note":"..."}'
  }];
  content.push({type:'input_text',text:'Nama file: '+String(loaded.file_name||'-')});
  if(loaded.mime.startsWith('image/'))content.push({type:'input_image',image_url:'data:'+loaded.mime+';base64,'+toB64(loaded.buf),detail:'high'});
  else content.push({type:'input_file',filename:String(loaded.file_name||spec.code+'.pdf'),file_data:'data:application/pdf;base64,'+toB64(loaded.buf)});

  const model='google/gemini-2.5-flash-lite';
  const ar=await fetch('https://ai-gateway.vercel.sh/v1/responses',{
    method:'POST',
    signal:AbortSignal.timeout(25000),
    headers:{Authorization:'Bearer '+gateway,'Content-Type':'application/json'},
    body:JSON.stringify({model,input:[{type:'message',role:'user',content}],max_output_tokens:1200})
  });
  const aj=await ar.json().catch(()=>({}));
  if(!ar.ok)throw new Error('AI_GATEWAY_HTTP_'+ar.status);
  const parsed=parse(txt(aj));
  return normalize({...spec,participant_nip:participant.nip},parsed);
}

async function mapLimit(items,limit,fn){
  const out=new Array(items.length);let next=0;
  async function worker(){for(;;){const i=next++;if(i>=items.length)return;out[i]=await fn(items[i],i)}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));
  return out;
}

export default async function handler(req){
  if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
  const gateway=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||'';
  if(req.method==='GET')return J({ok:true,configured:!!gateway,engine:'JABFUNG_DOC_AI_V2_COST_GUARD',model:'google/gemini-2.5-flash-lite',authenticity:'visual-indicator-only'});
  if(req.method!=='POST')return J({error:'Method not allowed'},405);

  try{
    const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/,'');
    if(!token||!await validUser(token))return J({error:'Unauthorized'},401);
    if(!gateway)return J({error:'AI Gateway belum tersedia.'},503);

    const body=await req.json();
    const submissionId=String(body?.submission_id||'').trim();
    if(!submissionId)return J({error:'submission_id wajib.'},400);
    const quota=await claimAiQuota(token,submissionId);
    if(quota?.allowed===false)return J({error:quota.message||'Batas penggunaan AI tercapai.',rate_limited:true,reason:quota.reason||'RATE_LIMIT'},429);
    const participant=body?.participant||{};
    const requirements=Array.isArray(body?.requirements)?body.requirements:[];
    const docs=Array.isArray(body?.documents)?body.documents:[];
    const by=new Map(docs.map(x=>[x.requirement_code,x]));
    const active=requirements.filter(r=>by.has(r.code));
    if(!active.length)return J({error:'Tidak ada dokumen valid yang dapat diperiksa.',code:'NO_DOCUMENTS'},422);

    const loaded=[];
    for(const spec of active){
      const d=by.get(spec.code);
      if(!isApprovedSignedUrl(d.signed_url,submissionId))throw new Error('INVALID_STORAGE_SIGNED_URL');
      const r=await fetch(d.signed_url,{signal:AbortSignal.timeout(15000)});
      if(!r.ok)throw new Error('SIGNED_FILE_HTTP_'+r.status);
      const buf=await r.arrayBuffer();
      if(buf.byteLength<1||buf.byteLength>MAX_FILE)throw new Error('INVALID_FILE_SIZE');
      const mime=String(d.mime_type||r.headers.get('content-type')||'').split(';')[0].toLowerCase();
      if(!validSignature(buf,mime))throw new Error('INVALID_FILE_SIGNATURE');
      loaded.push({spec,buf,file_name:d.file_name,mime,hash:await sha256Hex(buf)});
    }

    const results=await mapLimit(loaded,3,async item=>{
      try{return await analyzeOne(gateway,participant,item.spec,item)}
      catch(e){
        const code=failureCode(e);
        console.error('JABFUNG_AI_ITEM_FAIL',JSON.stringify({code}));
        return {requirement_code:item.spec.code,status:'PERLU_TELAAH',detected_document_type:null,detected_year:null,detected_name:null,detected_nip:null,readability_score:0,readability_status:'TIDAK_TERBACA',stamp_present:null,signature_present:null,authenticity_indicator:'TIDAK_DAPAT_DIPASTIKAN',authenticity_note:'AI gagal memproses dokumen secara teknis.',confidence:0,evidence:'',note:'Gagal teknis ('+code+'); verifikasi manual dibutuhkan, bukan bukti berkas salah.',error_code:code,technical_error:true};
      }
    });

    const counts={
      sesuai:results.filter(x=>x.status==='SESUAI').length,
      perbaikan:results.filter(x=>x.status==='PERLU_PERBAIKAN').length,
      tidak:results.filter(x=>x.status==='TIDAK_SESUAI').length,
      telaah:results.filter(x=>x.status==='PERLU_TELAAH').length,
      teknis:results.filter(x=>x.technical_error).length
    };
    const overall_status=counts.teknis?'GAGAL_TEKNIS':((counts.perbaikan||counts.tidak||counts.telaah)?'PERLU_TELAAH':'SESUAI');
    return J({
      ok:true,
      engine:'JABFUNG_DOC_AI_V2_COST_GUARD',
      model:'google/gemini-2.5-flash-lite',
      overall_status,
      counts,
      results,
      disclaimer:'AI hanya memberi indikator kesesuaian, keterbacaan, dan anomali visual. Keabsahan final stempel/tanda tangan/TTE harus ditetapkan verifikator manusia atau diverifikasi ke sumber resmi.'
    });
  }catch(e){
    const code=failureCode(e);
    console.error('JABFUNG_AI_READ_ERROR',JSON.stringify({code}));
    return J({error:'AI Verifikator belum dapat memproses berkas; pemeriksaan oleh petugas tetap tersedia.',code},
      code==='INVALID_FILE_SIZE'||code==='INVALID_FILE_SIGNATURE'?422:503);
  }
}