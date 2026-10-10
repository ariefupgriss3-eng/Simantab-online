import test from 'node:test';
import assert from 'node:assert/strict';
import {createTelemetryDelivery,validateTelemetryEvent,TELEMETRY_EVENT_TYPES} from './telemetry-delivery.mjs';

const ID1='01010101-0101-4101-8101-010101010101';
const ID2='02020202-0202-4202-8202-020202020202';
const event=(type='QUESTION_ENTER')=>({
  attempt_id:ID1,user_id:ID2,event_type:type,client_ts:'2026-10-10T02:30:00.000Z',
  question_no:210,display_no:7,revision:false,dwell_seconds:null,
  away_seconds:null,after_return_seconds:null,metadata:{}
});
const clock=()=>{
  const pending=[];
  return {pending,delay:(callback,ms)=>{const id={callback,ms};pending.push(id);return id},
    cancel:(id)=>{const i=pending.indexOf(id);if(i!==-1)pending.splice(i,1)}};
};

test('nine event types match deployed database constraint',()=>{
  assert.equal(TELEMETRY_EVENT_TYPES.length,9);
  for(const type of TELEMETRY_EVENT_TYPES)assert.equal(validateTelemetryEvent(event(type)).ok,true);
  assert.deepEqual(validateTelemetryEvent(event('TAB_BLUR')), {ok:false,reason:'UNKNOWN_EVENT_TYPE'});
});
test('invalid database fields are rejected before network call',()=>{
  for(const bad of [
    {...event(),question_no:3001},
    {...event(),display_no:0},
    {...event(),dwell_seconds:7201},
    {...event(),attempt_id:'not-a-uuid'},
    {...event(),metadata:[]},
    {...event(),revision:null}
  ])assert.equal(validateTelemetryEvent(bad).ok,false);
});
test('a successful batch is acknowledged once without score/answer modification',async()=>{
  const batches=[];const timer=clock();
  const delivery=createTelemetryDelivery({send:async batch=>batches.push(batch.slice()),delay:timer.delay,cancel:timer.cancel});
  assert.equal(delivery.add(event('SESSION_START')),true);
  assert.equal(delivery.add(event('QUESTION_ENTER')),true);
  const result=await delivery.flush();
  assert.equal(result.sent,2);assert.equal(delivery.diagnostics().pending,0);
  assert.equal(batches.length,1);assert.equal(batches[0].length,2);
});
test('temporary failure retries later without discarding original events',async()=>{
  let calls=0;
  const timer=clock();
  const delivery=createTelemetryDelivery({send:async()=>{calls++;if(calls===1)throw Object.assign(new Error('network'),{status:503});},
    delay:timer.delay,cancel:timer.cancel});
  delivery.add(event());
  const first=await delivery.flush();
  assert.equal(first.retrying,true);assert.equal(delivery.diagnostics().pending,1);
  assert.equal(delivery.diagnostics().retries,1);
  assert.equal(timer.pending.length,1);assert.equal(timer.pending[0].ms,1000);
  const second=await delivery.flush();
  assert.equal(second.sent,1);assert.equal(delivery.diagnostics().pending,0);
});
test('permanent HTTP 400 stops retry storm and retains bounded pending data',async()=>{
  let calls=0;const diagnostics=[];const timer=clock();
  const delivery=createTelemetryDelivery({send:async()=>{calls++;throw Object.assign(new Error('event_type_check'),{status:400})},
    delay:timer.delay,cancel:timer.cancel,onDiagnostic:x=>diagnostics.push(x)});
  delivery.add(event('WINDOW_FOCUS'));
  const first=await delivery.flush();
  assert.equal(first.blocked,true);
  await delivery.flush();
  assert.equal(calls,1);
  assert.equal(delivery.diagnostics().pending,1);
  assert.equal(delivery.diagnostics().permanentErrors,1);
  assert.equal(timer.pending.length,0);
  assert.equal(diagnostics.at(-1).kind,'PERMANENT_HTTP_ERROR');
});
test('invalid event names never reach Supabase',async()=>{
  let calls=0;
  const delivery=createTelemetryDelivery({send:async()=>{calls++}});
  assert.equal(delivery.add(event('UNSUPPORTED_EMERGENCY_EVENT')),false);
  await delivery.flush();
  assert.equal(calls,0);
  assert.equal(delivery.diagnostics().rejected,1);
});
test('maximum pending events is enforced without dropping older events',()=>{
  const delivery=createTelemetryDelivery({send:async()=>{},maxPending:2,delay:()=>1,cancel:()=>{}});
  delivery.add(event());delivery.add(event('WINDOW_BLUR'));
  assert.equal(delivery.add(event('SESSION_SUBMIT')),false);
  assert.equal(delivery.diagnostics().pending,2);
  assert.equal(delivery.diagnostics().overflow,1);
});
test('PostgreSQL SQLSTATE 23514 is permanent without HTTP status',async()=>{
  let calls=0;
  const clockNow=clock();
  const delivery=createTelemetryDelivery({
    send:async()=>{calls++;throw Object.assign(new Error('constraint'),{code:'23514'})},
    delay:clockNow.delay,cancel:clockNow.cancel
  });
  delivery.add(event('ANSWER_CHANGE'));
  const first=await delivery.flush();
  assert.equal(first.blocked,true);
  assert.equal(delivery.diagnostics().permanentErrors,1);
  assert.equal(delivery.diagnostics().retries,0);
  await delivery.flush();
  assert.equal(calls,1);
  assert.equal(clockNow.pending.length,0);
});
test('SQLSTATE validation error 22P02 is permanent and safe',async()=>{
  let calls=0;
  const delivery=createTelemetryDelivery({
    send:async()=>{calls++;throw Object.assign(new Error('invalid input'),{code:'22P02'})},
    delay:()=>1,cancel:()=>{}
  });
  delivery.add(event('SESSION_START'));
  assert.equal((await delivery.flush()).blocked,true);
  assert.equal(calls,1);
});
test('HTTP 429 is transient and allowed to retry',async()=>{
  let calls=0;
  const timer=clock();
  const delivery=createTelemetryDelivery({
    send:async()=>{calls++;if(calls===1)throw Object.assign(new Error('rate limited'),{status:429})},
    delay:timer.delay,cancel:timer.cancel
  });
  delivery.add(event('QUESTION_ENTER'));
  assert.equal((await delivery.flush()).retrying,true);
  assert.equal(timer.pending.length,1);
  assert.equal((await delivery.flush()).sent,1);
  assert.equal(calls,2);
});
test('simultaneous flush calls send one batch, not duplicates',async()=>{
  let calls=0,release;
  const delivery=createTelemetryDelivery({send:async()=>{calls++;await new Promise(r=>release=r)}});
  delivery.add(event());
  const a=delivery.flush(),b=delivery.flush();
  while(!release)await Promise.resolve();
  release();
  await Promise.all([a,b]);
  assert.equal(calls,1);
  assert.equal(delivery.diagnostics().sent,1);
});
