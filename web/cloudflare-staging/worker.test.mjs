import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
const env={ASSETS:{fetch:async()=>new Response('test static asset')}};
test('healthcheck confirms disconnected backend',async()=>{
  const response=await worker.fetch(new Request('https://staging.example/api/staging-health'),env);
  const result=await response.json();
  assert.equal(response.status,200);
  assert.equal(result.productionDataConnected,false);
  assert.equal(result.aiGatewayConnected,false);
});
test('login and data endpoints fail closed',async()=>{
  const response=await worker.fetch(new Request('https://staging.example/api/member-login',{method:'POST'}),env);
  assert.equal(response.status,503);
});
test('Thinking Culture AI endpoint cannot consume paid gateway',async()=>{
  const response=await worker.fetch(new Request('https://staging.example/api/bcks-thinking',{method:'POST'}),env);
  assert.equal(response.status,503);
});
test('static assets are served independently',async()=>{
  const response=await worker.fetch(new Request('https://staging.example/'),env);
  assert.equal(await response.text(),'test static asset');
});

test('staging static HTML refuses any external Supabase connection or script execution',async()=>{
  const response=await worker.fetch(new Request('https://staging.example/'),env);
  assert.equal(response.status,200);
  const csp=response.headers.get('content-security-policy')||'';
  assert.match(csp,/script-src 'none'/);
  assert.match(csp,/connect-src 'none'/);
  assert.match(csp,/form-action 'none'/);
  assert.match(csp,/frame-ancestors 'none'/);
  assert.equal(response.headers.get('x-simantab-environment'),'cloudflare-staging-no-auth');
  assert.equal(response.headers.get('cache-control'),'no-store');
});
test('auth API, data API, paid AI and arbitrary methods all fail closed in staging',async()=>{
  for(const [method,route] of [
    ['POST','/api/member-login'],
    ['POST','/api/simantab-username-login'],
    ['POST','/api/simantab-ensure-profile'],
    ['GET','/api/bcks'],
    ['POST','/api/bcks-thinking'],
    ['POST','/api/admin-update'],
    ['DELETE','/api/member-profile']
  ]){
    const response=await worker.fetch(new Request('https://staging.example'+route,{method}),env);
    assert.equal(response.status,503,method+' '+route);
    assert.match(response.headers.get('cache-control')||'',/no-store/);
    const result=await response.json();
    assert.match(result.error,/belum aktif/);
  }
});
test('no staging worker request triggers a remote fetch or backend write',async()=>{
  let seen=0;
  const local={ASSETS:{fetch:async()=>{seen++;return new Response('synthetic preview only')}}};
  await worker.fetch(new Request('https://staging.example/api/simantab-username-login',{method:'POST'}),local);
  await worker.fetch(new Request('https://staging.example/api/bcks-thinking',{method:'POST'}),local);
  assert.equal(seen,0,'backend API must never fall through to static or remote origin');
  await worker.fetch(new Request('https://staging.example/'),local);
  assert.equal(seen,1,'only static asset requests are allowed');
});
