// SIMANTAB Cloudflare staging QA fixtures — synthetic only, no production credentials.
// This module makes NO fetch(), database, storage or AI calls.
// Production /api/* endpoints are never routed here.
const SERVICES=Object.freeze({
  'diklat-ai-read':new Set(['KABID','KASI_SD','KASI_SMP','SUBKOOR_TK']),
  'jabfung-ai-read':new Set(['KABID','KASI_SD','KASI_SMP','STAFF_KP_EKIN']),
  'bcks-thinking':new Set(['KEPALA_SEKOLAH'])
});
const ROLE_PATTERN=/^[A-Z][A-Z_]{1,40}$/;
const CODES=new Set(['SKP_1','SKP_2','SK_PENGALAMAN_MANAJERIAL','SK_HUDIS','SKCK','PAKTA_INTEGRITAS','SURAT_PERNYATAAN_DIKLAT']);
function reply(status,body){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
      'X-Robots-Tag':'noindex, nofollow',
      'X-SIMANTAB-MOCK':'synthetic-only'
    }
  });
}
function isEqualFixedLength(a,b){
  if(a.length!==b.length)return false;
  let different=0;
  for(let i=0;i<a.length;i++)different|=a.charCodeAt(i)^b.charCodeAt(i);
  return different===0;
}
function isEnabled(env){
  return env?.STAGING_ENABLE_MOCK_API==='true' &&
    typeof env.STAGING_MOCK_KEY==='string' && env.STAGING_MOCK_KEY.length>=24 &&
    typeof env.STAGING_MOCK_ROLE==='string' && ROLE_PATTERN.test(env.STAGING_MOCK_ROLE);
}
function isAuthorized(request,env){
  const key=request.headers.get('x-simantab-staging-key')||'';
  return key.length>=24 && isEqualFixedLength(key,env.STAGING_MOCK_KEY);
}
const ALLOWED_BODY_KEYS=new Set(['mock_case','mode','hint_level']);
function syntheticDiklat(){
  return {
    ok:true,engine:'DIKLAT_DOC_AI_V11_RULE_CLARITY',model:'staging-mock',
    partial:true,only_codes:['SKP_1'],overall_status:'PERLU_PERBAIKAN',
    duplicate_skp:false,
    counts:{sesuai:0,perbaikan:1,tidak:0,teknis:0},
    results:[{
      requirement_code:'SKP_1',status:'PERLU_PERBAIKAN',detected_document_type:null,
      detected_year:null,detected_name:null,detected_nip:null,
      readability_score:0,confidence:0,evidence:'',
      note:'DATA TIRUAN: tidak ada dokumen atau identitas peserta yang diperiksa.',
      technical_error:false
    }]
  };
}
function syntheticJabfung(){
  return {
    ok:true,engine:'JABFUNG_DOC_AI_V2_COST_GUARD',model:'staging-mock',
    overall_status:'PERLU_TELAAH',
    counts:{sesuai:0,perbaikan:0,tidak:0,telaah:1,teknis:0},
    results:[{
      requirement_code:'SKP_2024',status:'PERLU_TELAAH',detected_document_type:null,
      detected_year:null,detected_name:null,detected_nip:null,
      readability_score:0,readability_status:'TIDAK_TERBACA',
      stamp_present:null,signature_present:null,
      authenticity_indicator:'TIDAK_DAPAT_DIPASTIKAN',
      authenticity_note:'DATA TIRUAN: tidak ada dokumen asli.',
      confidence:0,evidence:'',note:'DATA TIRUAN: verifikasi manusia tetap diperlukan.',
      technical_error:false
    }],
    disclaimer:'Uji kontrak API dengan data fiktif; bukan pemeriksaan dokumen.'
  };
}
function syntheticThinking(input){
  if(input.mode==='coach'){
    if(![1,2,3,4].includes(input.hint_level))return null;
    return {ok:true,coach_message:'DATA TIRUAN: tinjau fakta kasus fiktif.',
      reflection_question:'Bukti apa yang sebaiknya diperiksa lebih dahulu?',
      next_action:'CONTINUE_HINT',model:'staging-mock'};
  }
  if(input.mode==='reinforce'){
    return {ok:true,reinforcement:'DATA TIRUAN: pertimbangkan alasan keputusan.',
      transfer_question:'KASUS FIKTIF: bagaimana memeriksa data sebelum memutuskan?',
      model:'staging-mock'};
  }
  if(input.mode==='transfer'){
    return {ok:true,principle_score:0,context_transfer_score:0,priority_score:0,
      reasoning_score:0,misconception_avoidance_score:0,total_score:0,
      transfer_status:'NOT_YET',
      feedback:'DATA TIRUAN: angka ini bukan nilai peserta atau penilaian AI.',
      model:'staging-mock'};
  }
  return null;
}
export async function handleStagingMock(request,env,service){
  // Deliberately use test-only paths; real /api/{service} remain 503.
  if(!Object.hasOwn(SERVICES,service))return reply(404,{error:'Mock service not found'});
  if(!isEnabled(env))return reply(503,{error:'SIMANTAB mock API is disabled'});
  if(!isAuthorized(request,env))return reply(401,{error:'Staging QA credential required'});
  // Mock principal is provisioned server-side, never accepted from request JSON/header.
  if(!SERVICES[service].has(env.STAGING_MOCK_ROLE))return reply(403,{error:'Synthetic role not allowed for this service'});
  if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
  if(request.headers.has('authorization')||request.headers.has('cookie')||
     request.headers.has('x-simantab-worker-secret'))return reply(400,{error:'Real authentication headers forbidden in QA fixture'});
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply(415,{error:'JSON content type required'});
  const size=Number(request.headers.get('content-length')||0);
  if(size>512)return reply(413,{error:'Mock request too large'});
  let body;
  try{
    const raw=await request.text();
    if(raw.length>512)return reply(413,{error:'Mock request too large'});
    body=JSON.parse(raw);
  }catch{return reply(400,{error:'Invalid JSON'});}
  if(!body||typeof body!=='object'||Array.isArray(body)||
     Object.keys(body).some(key=>!ALLOWED_BODY_KEYS.has(key))||
     body.mock_case!=='SYNTHETIC_ONLY')
    return reply(400,{error:'Only synthetic contract fixtures allowed'});
  let output=null;
  if(service==='diklat-ai-read'){
    if(body.mode!==undefined||body.hint_level!==undefined)return reply(400,{error:'Unexpected mock fields'});
    output=syntheticDiklat();
  }else if(service==='jabfung-ai-read'){
    if(body.mode!==undefined||body.hint_level!==undefined)return reply(400,{error:'Unexpected mock fields'});
    output=syntheticJabfung();
  }else if(service==='bcks-thinking'){
    output=syntheticThinking(body);
    if(!output)return reply(400,{error:'Invalid synthetic thinking mode or hint_level'});
  }
  return reply(200,{...output,mock:true,authoritative:false,productionDataConnected:false,aiGatewayConnected:false});
}
export const STAGING_MOCK_PATHS=Object.freeze(Object.keys(SERVICES));
