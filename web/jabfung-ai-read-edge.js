/* SIMANTAB_JABFUNG_AI_READ_V1 */
const SUPABASE_URL='https://tizxfzvgglkokzvsiwkg.supabase.co';
const SUPABASE_KEY='sb_publishable_EfCKPSelNMo1X3whBFszJw_Ui6SuRIB';
const MAX_FILE=1572864;
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'};
const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:CORS});
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
const toB64=buf=>{const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode(...b.subarray(i,Math.min(i+0x8000,b.length)));return btoa(s)};
const txt=j=>typeof j?.output_text==='string'?j.output_text:(j?.output||[]).flatMap(x=>x?.content||[]).filter(x=>typeof x?.text==='string').map(x=>x.text).join('\n');
const parse=s=>{const t=String(s||'').trim().replace(/^\`\`\`(?:json)?/i,'').replace(/\`\`\`$/,'').trim();try{return JSON.parse(t)}catch{}const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a)return JSON.parse(t.slice(a,b+1));throw new Error('Output AI tidak valid JSON')};
async function validUser(token){const r=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token}});return r.ok}
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
    headers:{Authorization:'Bearer '+gateway,'Content-Type':'application/json'},
    body:JSON.stringify({model,input:[{type:'message',role:'user',content}],max_output_tokens:1500})
  });
  const aj=await ar.json().catch(()=>({}));
  if(!ar.ok)throw new Error(aj?.error?.message||aj?.error||('AI Gateway HTTP '+ar.status));
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
  if(req.method==='GET')return J({ok:true,configured:!!gateway,engine:'JABFUNG_DOC_AI_V1',model:'google/gemini-2.5-flash-lite',authenticity:'visual-indicator-only'});
  if(req.method!=='POST')return J({error:'Method not allowed'},405);

  try{
    const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/,'');
    if(!token||!await validUser(token))return J({error:'Unauthorized'},401);
    if(!gateway)return J({error:'AI Gateway belum tersedia.'},503);

    const body=await req.json();
    const participant=body?.participant||{};
    const requirements=Array.isArray(body?.requirements)?body.requirements:[];
    const docs=Array.isArray(body?.documents)?body.documents:[];
    const by=new Map(docs.map(x=>[x.requirement_code,x]));
    const active=requirements.filter(r=>by.has(r.code));
    if(!active.length)return J({ok:true,overall_status:'PERLU_TELAAH',counts:{sesuai:0,perbaikan:0,tidak:0,telaah:0,teknis:0},results:[]});

    const loaded=[];
    for(const spec of active){
      const d=by.get(spec.code),r=await fetch(d.signed_url);
      if(!r.ok)throw new Error('Gagal membaca '+spec.label);
      const buf=await r.arrayBuffer();
      if(buf.byteLength<1||buf.byteLength>MAX_FILE)throw new Error(spec.label+' harus berukuran 1 byte–1,5 MB.');
      loaded.push({spec,buf,file_name:d.file_name,mime:String(d.mime_type||r.headers.get('content-type')||'application/pdf').split(';')[0],hash:await sha256Hex(buf)});
    }

    const results=await mapLimit(loaded,3,async item=>{
      try{return await analyzeOne(gateway,participant,item.spec,item)}
      catch(e){return {requirement_code:item.spec.code,status:'PERLU_TELAAH',detected_document_type:null,detected_year:null,detected_name:null,detected_nip:null,readability_score:0,readability_status:'TIDAK_TERBACA',stamp_present:null,signature_present:null,authenticity_indicator:'TIDAK_DAPAT_DIPASTIKAN',authenticity_note:'Pemeriksaan visual AI gagal secara teknis.',confidence:0,evidence:'',note:'Pemeriksaan AI mengalami kendala teknis; verifikasi manusia diperlukan.',technical_error:true}}
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
      engine:'JABFUNG_DOC_AI_V1',
      model:'google/gemini-2.5-flash-lite',
      overall_status,
      counts,
      results,
      disclaimer:'AI hanya memberi indikator kesesuaian, keterbacaan, dan anomali visual. Keabsahan final stempel/tanda tangan/TTE harus ditetapkan verifikator manusia atau diverifikasi ke sumber resmi.'
    });
  }catch(e){
    console.error('JABFUNG_AI_READ_ERROR',e?.message||String(e));
    return J({error:e?.message||String(e)},400);
  }
}