// SIMANTAB Jabfung AI offline integration/security tests. No network, no paid AI.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const source=p=>readFileSync(resolve(root,p),'utf8');
const gateway=source('web/jabfung-ai-read-edge.js');
const ui=source('web/jabfung-jenjang-enhancement.js');
const edge=source('supabase/functions/simantab-jabfung-ai-workflow/index.ts');
const build=source('web/build.mjs');
const finalize=source('web/finalize-html.mjs');
const module=await import('data:text/javascript;base64,'+Buffer.from(gateway).toString('base64'));
const handler=module.default;

const sid='11111111-1111-4111-8111-111111111111';
const signed='https://tizxfzvgglkokzvsiwkg.supabase.co/storage/v1/object/sign/simantab-documents/test-user/'+sid+'/jabfung/fake.pdf?token=synthetic';
const safeResult=JSON.stringify({
  status:'SESUAI',detected_document_type:'SKP',detected_year:2025,
  detected_name:null,detected_nip:null,readability_score:.99,
  readability_status:'TERBACA',stamp_present:true,signature_present:true,
  authenticity_indicator:'WAJAR',authenticity_note:'Tidak ditemukan anomali jelas.',
  confidence:.95,evidence:'Contoh dokumen uji.',note:'Sesuai pada simulasi.'
});
const fakePdf=new TextEncoder().encode('%PDF-1.7\nSynthetic PDF document, not a real user file.');
const origFetch=globalThis.fetch;
const origGateway=process.env.AI_GATEWAY_API_KEY;
async function scenario(opts={}){
 const requests=[];
 globalThis.fetch=async (url,init={})=>{
  const uri=String(url);
  requests.push({uri,method:init.method||'GET'});
  if(uri.includes('/auth/v1/user'))return new Response('{}',{status:opts.badToken?401:200});
  if(uri.includes('/rest/v1/rpc/jabfung_ai_claim_request'))return new Response(
    JSON.stringify(opts.quotaAllowed===false?{allowed:false,reason:'RATE_LIMIT_SUBMISSION',message:'kuota habis'}:{allowed:true}),{status:200,headers:{'content-type':'application/json'}});
  if(uri.startsWith('https://tizxfzvgglkokzvsiwkg.supabase.co/storage/')){
   if(opts.storageStatus)return new Response('',{status:opts.storageStatus});
   return new Response(opts.emptyFile?new Uint8Array(0):opts.invalidFormat?new TextEncoder().encode('not PDF'):fakePdf,
      {status:200,headers:{'content-type':'application/pdf'}});
  }
  if(uri==='https://ai-gateway.vercel.sh/v1/responses'){
   if(opts.networkException)throw Object.assign(new Error('synthetic network failure'),{name:opts.networkException});
   if(opts.gatewayStatus)return new Response(JSON.stringify({error:{message:'Synthetic provider error must not leak to user'}}),
      {status:opts.gatewayStatus,headers:{'content-type':'application/json'}});
   return new Response(JSON.stringify({output_text:opts.invalidAiJson?'this is not JSON':safeResult}),
      {status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('BLOCKED_REAL_NETWORK: '+uri);
 };
 process.env.AI_GATEWAY_API_KEY='synthetic-not-a-real-secret';
 const body={
   submission_id:sid,
   participant:{full_name:'Synthetic Only',nip:'',unit:'Example School',position:'Teacher'},
   requirements:[{code:'SKP_2025',label:'Synthetic SKP 2025'}],
   documents:opts.noDocs?[]:[{
      requirement_code:'SKP_2025',file_name:'synthetic.pdf',
      mime_type:'application/pdf',signed_url:opts.signedUrl||signed
   }]
 };
 const req=new Request('https://local.invalid/api/jabfung-ai-read',{
   method:'POST',
   headers:opts.noToken?{}:{authorization:'Bearer synthetic-token'},
   body:JSON.stringify(body)
 });
 const logs=[];const oldError=console.error; console.error=(...parts)=>logs.push(parts.map(String).join(' '));
 try{
  const response=await handler(req),payload=await response.json();
  return {status:response.status,payload,requests,logs};
 }finally{
  console.error=oldError;globalThis.fetch=origFetch;
  if(origGateway===undefined)delete process.env.AI_GATEWAY_API_KEY;
  else process.env.AI_GATEWAY_API_KEY=origGateway;
 }
}

test('offline source: JS parses, Edge server has scoped authorization, cache/timestamp fixes',()=>{
 new Function(gateway.replace(/^export default /m,''));
 new Function(ui);
 assert.match(edge,/coordinator_role,assigned_user_id/);
 assert.match(edge,/appointedStaff/);
 assert.match(edge,/account_channel===\"DINAS\"/);
 assert.match(edge,/cached\.overall_status!==\"GAGAL_TEKNIS\"/);
 const start=edge.indexOf('const verificationStartedAt=new Date().toISOString()');
 const insert=edge.indexOf('started_at:verificationStartedAt');
 assert.ok(start>=0&&insert>start,'timestamp must be defined before insert');
 assert.equal(edge.split('const verificationStartedAt=').length-1,1);
 assert.match(ui,/f\.size<1/);
 assert.match(ui,/ai\?\.overall_status==='GAGAL_TEKNIS'/);
 assert.match(build,/marker:'SIMANTAB_JABFUNG_JENJANG_UI_V1',version:3/);
 assert.match(finalize,/\['jabfung-jenjang-enhancement\.js',3\]/);
});

test('offline: signed file URL outside correct storage origin rejected (SSRF defense)',async()=>{
 const x=await scenario({signedUrl:'https://untrusted.invalid/private/file.pdf?token=synthetic'});
 assert.equal(x.payload.code,'INVALID_STORAGE_SIGNED_URL');
 assert.equal(x.status,503);
 assert.equal(x.requests.some(y=>y.uri.includes('untrusted.invalid')),false);
 assert.equal(x.requests.some(y=>y.uri.includes('ai-gateway.vercel.sh')),false);
});
test('offline: empty files and non-PDF content rejected before provider call',async()=>{
 const empty=await scenario({emptyFile:true});
 assert.equal(empty.status,422);
 assert.equal(empty.payload.code,'INVALID_FILE_SIZE');
 assert.equal(empty.requests.some(y=>y.uri.includes('ai-gateway.vercel.sh')),false);
 const fake=await scenario({invalidFormat:true});
 assert.equal(fake.status,422);
 assert.equal(fake.payload.code,'INVALID_FILE_SIGNATURE');
});
test('offline: invalid and absent documents fail closed',async()=>{
 const noDocs=await scenario({noDocs:true});
 assert.equal(noDocs.status,422);
 assert.equal(noDocs.payload.code,'NO_DOCUMENTS');
 const missingToken=await scenario({noToken:true});
 assert.equal(missingToken.status,401);
 const invalidToken=await scenario({badToken:true});
 assert.equal(invalidToken.status,401);
});
test('offline: quota rejection before paid provider request',async()=>{
 const x=await scenario({quotaAllowed:false});
 assert.equal(x.status,429);
 assert.equal(x.payload.reason,'RATE_LIMIT_SUBMISSION');
 assert.equal(x.requests.some(y=>y.uri.includes('ai-gateway.vercel.sh')),false);
});
test('offline: provider 429 creates GAGAL_TEKNIS, not substantive noncompliance',async()=>{
 const x=await scenario({gatewayStatus:429});
 assert.equal(x.status,200);
 assert.equal(x.payload.overall_status,'GAGAL_TEKNIS');
 assert.equal(x.payload.counts.teknis,1);
 assert.equal(x.payload.results[0].technical_error,true);
 assert.equal(x.payload.results[0].error_code,'AI_GATEWAY_HTTP_429');
 assert.ok(x.logs.every(l=>!l.includes('Synthetic provider error must not leak')));
 assert.ok(x.logs.some(l=>l.includes('AI_GATEWAY_HTTP_429')));
});
test('offline: provider malformed JSON becomes technical, not invalid document',async()=>{
 const x=await scenario({invalidAiJson:true});
 assert.equal(x.payload.overall_status,'GAGAL_TEKNIS');
 assert.equal(x.payload.results[0].technical_error,true);
 assert.ok(x.payload.results[0].error_code.startsWith('AI_'));
});
test('offline: transport/timeout errors classified without personal details',async()=>{
 const x=await scenario({networkException:'TimeoutError'});
 assert.equal(x.payload.overall_status,'GAGAL_TEKNIS');
 assert.equal(x.payload.results[0].error_code,'AI_GATEWAY_TIMEOUT');
 assert.ok(x.logs.every(l=>!l.includes('Synthetic Only')));
});
test('offline: valid synthetic PDF + synthetic AI response produces advisory only',async()=>{
 const x=await scenario();
 assert.equal(x.status,200);
 assert.equal(x.payload.overall_status,'SESUAI');
 assert.equal(x.payload.counts.sesuai,1);
 assert.equal(x.payload.counts.teknis,0);
 assert.equal(x.payload.results[0].status,'SESUAI');
 assert.ok(x.payload.disclaimer.includes('verifikator manusia'));
 assert.equal(x.requests.filter(y=>y.uri.includes('ai-gateway.vercel.sh')).length,1);
});
