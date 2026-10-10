import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createReadonlySupabaseAuthAdapter,EXISTING_SIMANTAB_PROJECT_URL
} from './supabase-auth-readonly.mjs';
import {inspectSimantabAuthorization} from './auth-boundary.mjs';

const PUBLIC_KEY='sb_publishable_UNIT_TEST_PUBLIC_KEY_0123456789ABCDE';
const TOKEN='SYNTHETIC_OFFLINE_BEARER_TOKEN_ABCDEF123';
const ID='12345678-1234-4234-8234-1234567890ab';
const OTHER_ID='ffffffff-ffff-4fff-8fff-ffffffffffff';
const profile={
  id:ID,role:'KABID',is_active:true,approval_status:'APPROVED',
  account_channel:'DINAS',must_change_password:false,position:'Kabid',
  school_npsn:null
};
const grants=[
  {user_id:ID,capability:'ADMIN_KSPS',is_active:true},
  {user_id:ID,capability:'KP_PAK_JABFUNG',is_active:true}
];
const json=(data,status=200)=>new Response(JSON.stringify(data),{
  status,headers:{'content-type':'application/json'}
});
function setup({fakeUser={id:ID},fakeProfile=[profile],fakeGrants=grants,
               responseStatus=200,failPath='',error=null}={}){
  const calls=[];
  const fakeFetch=async (url,init)=>{
    const u=new URL(url);
    calls.push({url:u,init});
    assert.equal(u.origin,EXISTING_SIMANTAB_PROJECT_URL);
    assert.equal(init.method,'GET');
    assert.equal(init.redirect,'error');
    assert.equal(init.cache,'no-store');
    assert.equal(init.headers.apikey,PUBLIC_KEY);
    assert.equal(init.headers.Authorization,'Bearer '+TOKEN);
    assert.equal(init.headers['Cache-Control'],'no-store');
    assert.equal(init.headers.Accept,'application/json');
    assert.ok(init.signal);
    if(error)throw error;
    if(failPath===u.pathname)return json({error:'sensitive internal details'},responseStatus);
    if(u.pathname==='/auth/v1/user')return json(fakeUser);
    if(u.pathname==='/rest/v1/profiles')return json(fakeProfile);
    if(u.pathname==='/rest/v1/team_task_assignments')return json(fakeGrants);
    throw new Error('Unexpected outbound route: '+u.pathname);
  };
  const readers=createReadonlySupabaseAuthAdapter({
    projectUrl:EXISTING_SIMANTAB_PROJECT_URL,publishableKey:PUBLIC_KEY,
    fetchImpl:fakeFetch
  });
  return {calls,readers};
}
const auth=(readers,opts={})=>inspectSimantabAuthorization({
  authorization:'Bearer '+TOKEN,requestedChannel:'DINAS',...readers,...opts
});

test('only the EXISTING SIMANTAB project and publishable key are accepted',()=>{
  const noop=async()=>json({});
  for(const url of [
    'http://tizxfzvgglkokzvsiwkg.supabase.co',
    'https://another-project.supabase.co',
    'https://tizxfzvgglkokzvsiwkg.supabase.co/extra',
    'https://tizxfzvgglkokzvsiwkg.supabase.co.evil.example'
  ])assert.throws(()=>createReadonlySupabaseAuthAdapter({
    projectUrl:url,publishableKey:PUBLIC_KEY,fetchImpl:noop
  }),/existing SIMANTAB Supabase project/);
  for(const key of [
    'sb_secret_dangerous_example_0123456789',
    'service_role_TEST_ONLY_SECRET',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature',
    '',null
  ])assert.throws(()=>createReadonlySupabaseAuthAdapter({
    projectUrl:EXISTING_SIMANTAB_PROJECT_URL,publishableKey:key,fetchImpl:noop
  }),/publishable key/);
});
test('offline adapter refuses implicit global fetch and cannot contact production by itself',()=>{
  assert.throws(()=>createReadonlySupabaseAuthAdapter({
    projectUrl:EXISTING_SIMANTAB_PROJECT_URL,publishableKey:PUBLIC_KEY
  }),/Explicit fetch dependency/);
});
test('verified auth identity and matched RLS profile allow an approved Kabid',async()=>{
  const fixture=setup();
  const out=await auth(fixture.readers);
  assert.equal(out.ok,true);
  assert.equal(out.context.userId,ID);
  assert.equal(out.context.loginChannel,'DINAS');
  assert.equal(out.context.visibilityScope,'ALL_JENJANG');
  assert.equal(fixture.calls.length,2);
  assert.deepEqual(fixture.calls.map(v=>v.url.pathname),[
    '/auth/v1/user','/rest/v1/profiles'
  ]);
  const query=fixture.calls[1].url.searchParams;
  assert.equal(query.get('id'),'eq.'+ID);
  assert.equal(query.get('limit'),'1');
  assert.equal(query.get('select'),
    'id,role,is_active,approval_status,account_channel,must_change_password,position,school_npsn');
  assert.ok(!query.has('full_name')&&!query.has('phone')&&!query.has('nip'));
});
test('capabilities are read exclusively for verified user and active assignments',async()=>{
  const fixture=setup();
  const out=await auth(fixture.readers,{requiredCapability:'ADMIN_KSPS'});
  assert.equal(out.ok,true);
  assert.equal(fixture.calls.length,3);
  const q=fixture.calls[2].url.searchParams;
  assert.equal(q.get('user_id'),'eq.'+ID);
  assert.equal(q.get('is_active'),'eq.true');
  assert.equal(q.get('select'),'user_id,capability,is_active');
  assert.equal(q.get('limit'),'100');
  assert.equal((await auth(fixture.readers,{requiredCapability:'NOT_GRANTED'})).code,
    'INSUFFICIENT_CAPABILITY');
});
test('cross-user profile or capability rows are rejected despite broad DINAS RLS visibility',async()=>{
  const otherProfile=setup({fakeProfile:[{...profile,id:OTHER_ID}]});
  assert.equal((await auth(otherProfile.readers)).ok,false);
  const otherGrants=setup({fakeGrants:[{user_id:OTHER_ID,capability:'ADMIN_KSPS',is_active:true}]});
  const output=await auth(otherGrants.readers,{requiredCapability:'ADMIN_KSPS'});
  assert.equal(output.code,'INSUFFICIENT_CAPABILITY');
});
test('inactive, pending and rejected actual profile status always denies access',async()=>{
  for(const delta of [
    {is_active:false},
    {approval_status:'PENDING'},
    {approval_status:'REJECTED'},
    {must_change_password:true}
  ]){
    const out=await auth(setup({fakeProfile:[{...profile,...delta}]}).readers);
    assert.equal(out.ok,false);
  }
});
test('legacy PENGAWAS Dinas database channel still requires GTK login',async()=>{
  const fixture=setup({fakeProfile:[{...profile,role:'PENGAWAS',account_channel:'DINAS'}]});
  assert.equal((await auth(fixture.readers)).code,'WRONG_LOGIN_CHANNEL');
  const result=await auth(fixture.readers,{requestedChannel:'GTK'});
  assert.equal(result.ok,true);
  assert.equal(result.context.loginChannel,'GTK');
});
test('HTTP 401, 403 and 500 from trusted API deny without exposing internal details',async()=>{
  for(const code of [401,403,500]){
    for(const path of ['/auth/v1/user','/rest/v1/profiles','/rest/v1/team_task_assignments']){
      const fixture=setup({responseStatus:code,failPath:path});
      const out=await auth(fixture.readers,{requiredCapability:'ADMIN_KSPS'});
      assert.equal(out.ok,false);
      assert.equal(JSON.stringify(out).includes('sensitive internal details'),false);
    }
  }
});
test('network errors fail closed, without unauthenticated fallback',async()=>{
  const fixture=setup({error:new Error('private DNS or token value')});
  const out=await auth(fixture.readers);
  assert.equal(out.ok,false);
  assert.equal(JSON.stringify(out).includes('private DNS'),false);
});
test('unknown and malicious user IDs cannot be used in PostgREST filters',async()=>{
  const fixture=setup({fakeUser:{id:'../../other-user?role=SUPER_ADMIN'}});
  const result=await auth(fixture.readers);
  assert.equal(result.ok,false);
  assert.equal(fixture.calls.length,1);
});
test('all Supabase reads are GET without request bodies, cookie or secret keys',async()=>{
  const fixture=setup();
  await auth(fixture.readers,{requiredCapability:'ADMIN_KSPS'});
  for(const call of fixture.calls){
    assert.equal(call.init.method,'GET');
    assert.equal(call.init.body,undefined);
    assert.equal(call.init.headers.Cookie,undefined);
    assert.equal(call.init.headers['x-simantab-worker-secret'],undefined);
    assert.equal(call.init.headers['service-role'],undefined);
  }
});
test('empty, malformed or mismatched profile result fails closed',async()=>{
  for(const fakeProfile of [[],[{...profile,id:OTHER_ID}],
    [{...profile},{...profile}]]){
    const r=await auth(setup({fakeProfile}).readers);
    assert.equal(r.ok,false);
  }
});
test('returned identity context never includes raw profile, JWT or public key',async()=>{
  const fixture=setup();
  const r=await auth(fixture.readers);
  assert.equal(r.ok,true);
  const publicJson=JSON.stringify(r);
  assert.equal(publicJson.includes(TOKEN),false);
  assert.equal(publicJson.includes(PUBLIC_KEY),false);
  assert.equal(publicJson.includes('Kabid'),false);
});
