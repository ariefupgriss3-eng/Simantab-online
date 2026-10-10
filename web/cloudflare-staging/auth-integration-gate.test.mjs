import test from 'node:test';
import assert from 'node:assert/strict';
import {probeApprovedTestAccount} from './auth-integration-gate.mjs';
import {EXISTING_SIMANTAB_PROJECT_URL} from './supabase-auth-readonly.mjs';

const TEST_ID='12345678-1234-4234-8234-1234567890ab';
const OTHER_ID='87654321-4321-4321-8321-0987654321ff';
const KEY='sb_publishable_SAFE_SYNTHETIC_ONLY_0123456789';
const TOKEN='SAFE_SYNTHETIC_TOKEN_OFFLINE_2026';
const profile=(override={})=>({
  id:TEST_ID,role:'KEPALA_SEKOLAH',account_channel:'DINAS',
  approval_status:'APPROVED',is_active:true,must_change_password:false,
  position:'Kepala Sekolah',school_npsn:null,...override
});
const mock=(config={})=>{
  const calls=[];
  const fetchImpl=async (url,options)=>{
    const target=new URL(url);
    calls.push({target,options});
    assert.equal(target.origin,EXISTING_SIMANTAB_PROJECT_URL);
    assert.equal(options.method,'GET');
    assert.equal(options.body,undefined);
    assert.equal(options.redirect,'error');
    assert.equal(options.headers.Authorization,'Bearer '+TOKEN);
    assert.equal(options.headers.apikey,KEY);
    if(target.pathname==='/auth/v1/user')
      return Response.json({id:config.identity||TEST_ID});
    if(target.pathname==='/rest/v1/profiles')
      return Response.json([profile(config.profile||{})]);
    if(target.pathname==='/rest/v1/team_task_assignments')
      return Response.json(config.assignments||[]);
    throw new Error('Unexpected path');
  };
  const args={
    allowExplicitReadonlyProbe:true,
    expectedTestUserId:TEST_ID,
    authorization:'Bearer '+TOKEN,
    requestedChannel:'GTK',
    projectUrl:EXISTING_SIMANTAB_PROJECT_URL,
    publishableKey:KEY,fetchImpl
  };
  return {calls,args};
};
test('probe disabled by default and never calls a network transport',async()=>{
  let called=0;
  const r=await probeApprovedTestAccount({
    ...mock().args,allowExplicitReadonlyProbe:false,
    fetchImpl:async()=>{called++;throw Error('unsafe')}
  });
  assert.equal(r.code,'PROBE_DISABLED');
  assert.equal(called,0);
});
test('unapproved or missing test account ID denies before any remote reads',async()=>{
  for(const expectedTestUserId of [undefined,'',OTHER_ID.slice(0,3),'../../account']){
    const f=mock();
    const r=await probeApprovedTestAccount({...f.args,expectedTestUserId});
    assert.equal(r.code,'TEST_SUBJECT_NOT_APPROVED');
    assert.equal(f.calls.length,0);
  }
});
test('missing read transport or bearer denies without touching Supabase',async()=>{
  const f=mock();
  assert.equal((await probeApprovedTestAccount({...f.args,fetchImpl:null})).code,'READONLY_TRANSPORT_NOT_CONFIGURED');
  assert.equal((await probeApprovedTestAccount({...f.args,authorization:'Bearer abc'})).code,'AUTH_REQUIRED');
  assert.equal(f.calls.length,0);
});
test('approved test identity yields only minimal, anonymous authorization result',async()=>{
  const f=mock();
  const r=await probeApprovedTestAccount(f.args);
  assert.equal(r.ok,true);
  assert.equal(r.code,'READONLY_AUTH_VALIDATED');
  assert.equal(r.role,'KEPALA_SEKOLAH');
  assert.equal(r.loginChannel,'GTK');
  assert.equal(r.visibilityScope,'SELF_ONLY');
  assert.equal(r.productionWritesPerformed,false);
  assert.equal(r.aiGatewayUsed,false);
  assert.equal(r.apiMigrationCompleted,false);
  assert.equal(f.calls.length,2);
  assert.deepEqual(f.calls.map(x=>x.target.pathname),['/auth/v1/user','/rest/v1/profiles']);
  const output=JSON.stringify(r);
  for(const secret of [TEST_ID,TOKEN,KEY,'Kepala Sekolah','school_npsn','assigned_by'])
    assert.equal(output.includes(secret),false,secret);
});
test('a bearer for another user is rejected without querying any profile or assignments',async()=>{
  const f=mock({identity:OTHER_ID});
  const r=await probeApprovedTestAccount(f.args);
  assert.equal(r.ok,false);
  assert.equal(r.code,'INVALID_SESSION');
  assert.deepEqual(f.calls.map(x=>x.target.pathname),['/auth/v1/user']);
});
test('pending, inactive and rejected profiles are denied, without exposing profile',async()=>{
  for(const override of [
    {approval_status:'PENDING'},
    {approval_status:'REJECTED'},
    {is_active:false},
    {must_change_password:true}
  ]){
    const f=mock({profile:override});
    const r=await probeApprovedTestAccount(f.args);
    assert.equal(r.ok,false);
    assert.equal(r.status,403);
    assert.equal(JSON.stringify(r).includes('Kepala Sekolah'),false);
  }
});
test('legacy kepala sekolah Dinas-channel still needs GTK login',async()=>{
  const f=mock();
  const r=await probeApprovedTestAccount({...f.args,requestedChannel:'DINAS'});
  assert.equal(r.code,'WRONG_LOGIN_CHANNEL');
  assert.equal(r.status,403);
});
test('unassigned capability fails closed using a user-scoped read only',async()=>{
  const f=mock({assignments:[]});
  const r=await probeApprovedTestAccount({...f.args,requiredCapability:'ADMIN_KSPS'});
  assert.equal(r.code,'INSUFFICIENT_CAPABILITY');
  assert.equal(f.calls.length,3);
  const task=f.calls.at(-1).target;
  assert.equal(task.pathname,'/rest/v1/team_task_assignments');
  assert.equal(task.searchParams.get('user_id'),'eq.'+TEST_ID);
  assert.equal(task.searchParams.get('is_active'),'eq.true');
});
test('capability cannot be inferred from role alone, but active matching record permits',async()=>{
  const f=mock({assignments:[{user_id:TEST_ID,capability:'ADMIN_KSPS',is_active:true}]});
  const r=await probeApprovedTestAccount({...f.args,requiredCapability:'ADMIN_KSPS'});
  assert.equal(r.ok,true);
  assert.equal(r.requiredCapabilityChecked,true);
});
test('invalid adapter configuration fails before any outbound read',async()=>{
  const f=mock();
  const r=await probeApprovedTestAccount({...f.args,projectUrl:'https://unknown.supabase.co'});
  assert.equal(r.code,'READONLY_ADAPTER_NOT_CONFIGURED');
  assert.equal(f.calls.length,0);
});
test('unavailable database fails closed without leaking simulated internal errors',async()=>{
  const f=mock();
  const r=await probeApprovedTestAccount({
    ...f.args,fetchImpl:async()=>{throw new Error('Private DB secret warning!')}
  });
  assert.equal(r.ok,false);
  assert.equal(JSON.stringify(r).includes('Private DB secret'),false);
});
