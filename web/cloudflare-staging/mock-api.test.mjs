import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';

const HOST='https://cloudflare-staging.example';
const KEY='LOCAL_QA_FIXTURE_KEY_NOT_PRODUCTION_2026';
const baseEnv={STAGING_ENABLE_MOCK_API:'true',STAGING_MOCK_KEY:KEY,
  STAGING_MOCK_ROLE:'KABID',
  ASSETS:{fetch:async()=>new Response('offline mock asset')}};
const fixture=(service,body={mock_case:'SYNTHETIC_ONLY'},opts={})=>
  new Request(HOST+'/api/staging/mock/'+service,{
    method:opts.method||'POST',
    headers:{'content-type':'application/json','x-simantab-staging-key':KEY,...(opts.headers||{})},
    ...((opts.method||'POST')==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})
  });
const get=async(response)=>({status:response.status,body:await response.json()});

test('staging mock endpoints fail closed without explicit secure QA configuration',async()=>{
  const r=await get(await worker.fetch(fixture('diklat-ai-read'),{ASSETS:baseEnv.ASSETS}));
  assert.equal(r.status,503);
  assert.match(r.body.error,/disabled/);
});
test('staging mock endpoints require a distinct QA key',async()=>{
  for(const headers of [{'x-simantab-staging-key':'bad'},{'x-simantab-staging-key':''}]){
    const r=await get(await worker.fetch(fixture('diklat-ai-read',undefined,{headers}),baseEnv));
    assert.equal(r.status,401);
  }
});
test('production AI routes stay strictly disabled even with mock credentials and role',async()=>{
  for(const route of ['diklat-ai-read','jabfung-ai-read','bcks-thinking']){
    const r=await get(await worker.fetch(
      new Request(HOST+'/api/'+route,{method:'POST',headers:{'x-simantab-staging-key':KEY}}),baseEnv));
    assert.equal(r.status,503,route);
    assert.match(r.body.error,/belum aktif/);
  }
});
test('authorized synthetic KABID can inspect diklat response shape without documents',async()=>{
  const response=await worker.fetch(fixture('diklat-ai-read'),baseEnv);
  const result=await response.json();
  assert.equal(response.status,200);
  assert.equal(response.headers.get('x-simantab-mock'),'synthetic-only');
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(result.mock,true);
  assert.equal(result.authoritative,false);
  assert.equal(result.productionDataConnected,false);
  assert.equal(result.aiGatewayConnected,false);
  assert.equal(result.engine,'DIKLAT_DOC_AI_V11_RULE_CLARITY');
  assert.equal(result.overall_status,'PERLU_PERBAIKAN');
  assert.equal(result.counts.perbaikan,result.results.length);
  assert.equal(result.results[0].requirement_code,'SKP_1');
  assert.equal(result.results[0].detected_nip,null);
});
test('synthetic KABID gets Jabfung status and visual-authenticity shape',async()=>{
  const response=await worker.fetch(fixture('jabfung-ai-read'),baseEnv);
  const result=await response.json();
  assert.equal(response.status,200);
  assert.equal(result.engine,'JABFUNG_DOC_AI_V2_COST_GUARD');
  assert.equal(result.overall_status,'PERLU_TELAAH');
  assert.equal(result.results[0].authenticity_indicator,'TIDAK_DAPAT_DIPASTIKAN');
  assert.equal(result.results[0].status,'PERLU_TELAAH');
  assert.equal(result.counts.telaah,1);
  assert.equal(result.results[0].detected_name,null);
});
test('GTK synthetic role cannot use staff-only Diklat or Jabfung endpoints',async()=>{
  for(const service of ['diklat-ai-read','jabfung-ai-read']){
    const r=await get(await worker.fetch(fixture(service),{
      ...baseEnv,STAGING_MOCK_ROLE:'GTK'}));
    assert.equal(r.status,403);
  }
});
test('a synthetic BCKS kepala sekolah can use coach, reinforce and transfer schemas',async()=>{
  const env={...baseEnv,STAGING_MOCK_ROLE:'KEPALA_SEKOLAH'};
  const c=await get(await worker.fetch(fixture('bcks-thinking',{
    mock_case:'SYNTHETIC_ONLY',mode:'coach',hint_level:2}),env));
  assert.equal(c.status,200);
  assert.equal(c.body.next_action,'CONTINUE_HINT');
  assert.equal(typeof c.body.coach_message,'string');
  assert.equal(typeof c.body.reflection_question,'string');
  const r=await get(await worker.fetch(fixture('bcks-thinking',{mock_case:'SYNTHETIC_ONLY',mode:'reinforce'}),env));
  assert.equal(r.status,200);
  assert.equal(typeof r.body.reinforcement,'string');
  assert.match(r.body.transfer_question,/FIKTIF/);
  const t=await get(await worker.fetch(fixture('bcks-thinking',{mock_case:'SYNTHETIC_ONLY',mode:'transfer'}),env));
  assert.equal(t.status,200);
  assert.equal(t.body.total_score,0);
  assert.equal(t.body.transfer_status,'NOT_YET');
  assert.equal(t.body.authoritative,false);
  assert.equal(t.body.principle_score+t.body.context_transfer_score+t.body.priority_score+
    t.body.reasoning_score+t.body.misconception_avoidance_score,t.body.total_score);
});
test('KABID synthetic role may not act as a BCKS participant',async()=>{
  const r=await get(await worker.fetch(fixture('bcks-thinking',{
    mock_case:'SYNTHETIC_ONLY',mode:'coach',hint_level:1}),baseEnv));
  assert.equal(r.status,403);
});
test('client-supplied role cannot raise privileges or access another service',async()=>{
  const r=await get(await worker.fetch(fixture('diklat-ai-read',{
    mock_case:'SYNTHETIC_ONLY',role:'KABID'
  }),baseEnv));
  assert.equal(r.status,400);
  const other=await get(await worker.fetch(fixture('bcks-thinking',{
    mock_case:'SYNTHETIC_ONLY',mode:'transfer'
  },{headers:{'x-simantab-role':'KEPALA_SEKOLAH'}}),baseEnv));
  assert.equal(other.status,403);
});
test('reject production-like participant and document payloads without making network calls',async()=>{
  for(const payload of [
    {mock_case:'SYNTHETIC_ONLY',documents:[{signed_url:'https://example.invalid/private'}]},
    {mock_case:'SYNTHETIC_ONLY',participant:{name:'Real Person'}},
    {mock_case:'SYNTHETIC_ONLY',access_token:'bearer-secret'}
  ]){
    const r=await get(await worker.fetch(fixture('diklat-ai-read',payload),baseEnv));
    assert.equal(r.status,400);
  }
});
test('reject real authorization, cookie, and worker-secret headers even with QA key',async()=>{
  for(const header of ['authorization','cookie','x-simantab-worker-secret']){
    const r=await get(await worker.fetch(fixture('diklat-ai-read',undefined,
      {headers:{[header]:'not-an-actual-credential'}}),baseEnv));
    assert.equal(r.status,400);
  }
});
test('reject malformed, unsupported, too-large and non-JSON inputs',async()=>{
  for(const [input,headers,status] of [
    ['not-json',{},400],
    [{mock_case:'WRONG'}, {},400],
    [{mock_case:'SYNTHETIC_ONLY',mode:'not-real'}, {},400],
    [{mock_case:'SYNTHETIC_ONLY',mode:'coach',hint_level:5}, {},400],
    [{mock_case:'SYNTHETIC_ONLY',mode:'coach',extra:'a'.repeat(600)}, {},413],
    [{mock_case:'SYNTHETIC_ONLY',mode:'coach',hint_level:1},{'content-type':'text/plain'},415],
  ]){
    const r=await get(await worker.fetch(fixture('bcks-thinking',input,{headers}),{
      ...baseEnv,STAGING_MOCK_ROLE:'KEPALA_SEKOLAH'}));
    assert.equal(r.status,status,JSON.stringify(input).slice(0,70));
  }
});
test('non-POST fixture methods are rejected',async()=>{
  const r=await get(await worker.fetch(fixture('diklat-ai-read',undefined,{method:'GET'}),baseEnv));
  assert.equal(r.status,405);
});
test('no external network, Supabase, AI call or static asset fetch is made by mock APIs',async()=>{
  let assetReads=0;
  const env={...baseEnv,ASSETS:{fetch:async()=>{assetReads++;throw Error('must not fetch assets')}}};
  for(const name of ['diklat-ai-read','jabfung-ai-read']){
    assert.equal((await worker.fetch(fixture(name),env)).status,200);
  }
  assert.equal(assetReads,0);
});
test('an unknown mock path cannot fall through to any real endpoint',async()=>{
  const r=await get(await worker.fetch(fixture('secret-reset'),baseEnv));
  assert.equal(r.status,404);
});
