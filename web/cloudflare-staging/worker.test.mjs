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
