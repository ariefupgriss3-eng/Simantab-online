import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectSimantabAuthorization,expectedLoginChannel,readonlyVisibilityScope,LOGIN_ROLE_CLASSES
} from './auth-boundary.mjs';

const ID='12345678-1234-4234-8234-1234567890ab';
const TOKEN='SIMANTAB_STAGING_SYNTHETIC_TEST_TOKEN';
const AUTH='Bearer '+TOKEN;
const profile=(changes={})=>({
  id:ID,role:'KABID',is_active:true,approval_status:'APPROVED',
  account_channel:'DINAS',must_change_password:false,...changes
});
const check=(record,options={})=>{
  const calls={verify:0,profile:0,capabilities:0};
  return {
    calls,
    run:opts=>inspectSimantabAuthorization({
      authorization:AUTH,requestedChannel:'DINAS',
      verifySession:async token=>{calls.verify++;assert.equal(token,TOKEN);return {id:ID}},
      readProfile:async ({userId,accessToken})=>{
        calls.profile++;assert.equal(userId,ID);assert.equal(accessToken,TOKEN);return record;
      },
      readCapabilities:async ({userId})=>{
        calls.capabilities++;assert.equal(userId,ID);return options.assignments||[];
      },
      ...opts
    })
  };
};
test('login categories follow current production role routing, not stale account channel',()=>{
  for(const role of ['GTK','KEPALA_SEKOLAH','PENGAWAS'])assert.equal(expectedLoginChannel(role),'GTK');
  for(const role of ['KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','STAFF_TPG','SUPER_ADMIN'])
    assert.equal(expectedLoginChannel(role),'DINAS');
  assert.equal(expectedLoginChannel('UNKNOWN'),null);
  assert.ok(LOGIN_ROLE_CLASSES.gtk.includes('PENGAWAS'));
});
test('approved active Kabid passes with server-verified identity and scope',async()=>{
  const testAccount=check(profile());
  const result=await testAccount.run();
  assert.equal(result.ok,true);
  assert.deepEqual(result.context,{
    userId:ID,role:'KABID',loginChannel:'DINAS',
    visibilityScope:'ALL_JENJANG',passwordChangeRequired:false
  });
  assert.equal('accessToken' in result.context,false);
  assert.deepEqual(testAccount.calls,{verify:1,profile:1,capabilities:0});
});
test('active but pending and rejected accounts are denied',async()=>{
  for(const approval_status of ['PENDING','REJECTED',null]){
    const result=await check(profile({approval_status})).run();
    assert.equal(result.ok,false);
    assert.equal(result.status,403);
    assert.equal(result.code,'PROFILE_NOT_ELIGIBLE');
  }
});
test('inactive accounts are denied even when approved',async()=>{
  const r=await check(profile({is_active:false})).run();
  assert.equal(r.code,'PROFILE_NOT_ELIGIBLE');
});
test('a kepala sekolah with legacy DINAS channel is routed to GTK per role',async()=>{
  const source=check(profile({role:'KEPALA_SEKOLAH',account_channel:'DINAS'}));
  const good=await source.run({requestedChannel:'GTK'});
  assert.equal(good.ok,true);
  assert.equal(good.context.loginChannel,'GTK');
  assert.equal(good.context.visibilityScope,'SELF_ONLY');
  const wrong=await source.run({requestedChannel:'DINAS'});
  assert.equal(wrong.status,403);
  assert.equal(wrong.code,'WRONG_LOGIN_CHANNEL');
});
test('Pengawas with legacy DINAS database channel also uses GTK login',async()=>{
  const t=check(profile({role:'PENGAWAS',account_channel:'DINAS'}));
  const result=await t.run({requestedChannel:'GTK'});
  assert.equal(result.ok,true);
  assert.equal(result.context.visibilityScope,'ASSIGNED_DABIN_ONLY');
  assert.equal((await t.run({requestedChannel:'DINAS'})).code,'WRONG_LOGIN_CHANNEL');
});
test('scope labels are advisory, never treated as Supabase row permissions',()=>{
  assert.equal(readonlyVisibilityScope('KASI_SD'),'SD');
  assert.equal(readonlyVisibilityScope('KASI_SMP'),'SMP');
  assert.equal(readonlyVisibilityScope('SUBKOOR_TK'),'TK_PAUD_PNF');
  assert.equal(readonlyVisibilityScope('STAFF_KP_EKIN'),'ASSIGNED_SERVICE_ONLY');
  assert.equal(readonlyVisibilityScope('somethingElse'),'DENY');
});
test('password-change-required account cannot access normal services',async()=>{
  const result=await check(profile({must_change_password:true})).run();
  assert.equal(result.code,'PASSWORD_CHANGE_REQUIRED');
});
test('role, approval, active and capabilities cannot be supplied in untrusted request',async()=>{
  const r=await check(profile({role:'GTK',is_active:false})).run({
    requestedChannel:'DINAS',claimedRole:'SUPER_ADMIN',claimedApproval:'APPROVED',
    clientCapabilities:['ADMIN_KSPS']
  });
  assert.equal(r.ok,false);
  assert.equal(r.code,'PROFILE_NOT_ELIGIBLE');
});
test('unknown roles are denied by default, not mapped to Dinas',async()=>{
  for(const role of ['SUPERUSER','',null]){
    const result=await check(profile({role})).run();
    assert.equal(result.ok,false);
  }
});
test('missing/malformed bearer and invalid session never read profiles',async()=>{
  const t=check(profile());
  for(const authorization of ['', 'Basic '+TOKEN,'Bearer tiny','Bearer '+TOKEN+' with-spaces']){
    const result=await t.run({authorization});
    assert.equal(result.code,'AUTH_REQUIRED');
  }
  assert.equal(t.calls.profile,0);
  const expired=await t.run({verifySession:async()=>{throw new Error('expired')}});
  assert.equal(expired.code,'INVALID_SESSION');
  assert.equal(t.calls.profile,0);
});
test('profile must refer to the verified user id, not a chosen client user id',async()=>{
  const result=await check(profile({id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'})).run();
  assert.equal(result.code,'PROFILE_NOT_ELIGIBLE');
});
test('server-selected capabilities require an active DB assignment',async()=>{
  const t=check(profile({role:'STAFF_KP_EKIN'}),{assignments:[
    {capability:'E_JABFUNG',is_active:false},
    {capability:'KP',is_active:true}
  ]});
  const allowed=await t.run({requiredCapability:'KP'});
  assert.equal(allowed.ok,true);
  const inactive=await t.run({requiredCapability:'E_JABFUNG'});
  assert.equal(inactive.code,'INSUFFICIENT_CAPABILITY');
  const nonexistent=await t.run({requiredCapability:'ADMIN_KSPS'});
  assert.equal(nonexistent.code,'INSUFFICIENT_CAPABILITY');
  assert.equal(t.calls.capabilities,3);
});
test('capability check fails closed if the trusted reader is missing or fails',async()=>{
  const t=check(profile());
  const missing=await t.run({requiredCapability:'ADMIN_KSPS',readCapabilities:undefined});
  assert.equal(missing.code,'INSUFFICIENT_CAPABILITY');
  const broken=await t.run({requiredCapability:'ADMIN_KSPS',
    readCapabilities:async()=>{throw new Error('db offline')}});
  assert.equal(broken.code,'INSUFFICIENT_CAPABILITY');
});
test('invalid capability names are rejected',async()=>{
  const t=check(profile());
  for(const cap of ['admin_ksps','','../../root','ADMIN_KSPS?role=admin']){
    const r=await t.run({requiredCapability:cap});
    assert.equal(r.code,'INSUFFICIENT_CAPABILITY');
  }
});
test('profile database failure denies access without revealing error details',async()=>{
  const t=check(profile());
  const r=await t.run({readProfile:async()=>{throw new Error('private table details')}});
  assert.equal(r.code,'INVALID_SESSION');
  assert.equal(JSON.stringify(r).includes('private table'),false);
});
