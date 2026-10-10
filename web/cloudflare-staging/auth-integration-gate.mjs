/**
 * LOCAL, READ-ONLY SIMANTAB staging authorization probe.
 *
 * Not imported into the Cloudflare Worker. Its sole purpose is to verify the
 * integration contract against a specifically authorized test account.
 * No CLI endpoint, deployed HTTP route, automatic login, or global fetch.
 *
 * This probe stays disabled unless ALLOW_EXPLICIT_READONLY_PROBE=true.
 * The test subject ID must come from a private, separately approved test plan.
 * Never commit a bearer token, refresh token, UUID, password or real profile.
 */
import {createReadonlySupabaseAuthAdapter} from './supabase-auth-readonly.mjs';
import {inspectSimantabAuthorization} from './auth-boundary.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const denied=(code,status=503)=>Object.freeze({ok:false,status,code});
export async function probeApprovedTestAccount({
  allowExplicitReadonlyProbe=false,
  expectedTestUserId,
  authorization,
  requestedChannel,
  requiredCapability=null,
  projectUrl,
  publishableKey,
  fetchImpl
}={}){
  if(allowExplicitReadonlyProbe!==true)return denied('PROBE_DISABLED');
  if(typeof expectedTestUserId!=='string'||!UUID.test(expectedTestUserId))
    return denied('TEST_SUBJECT_NOT_APPROVED');
  if(typeof fetchImpl!=='function')return denied('READONLY_TRANSPORT_NOT_CONFIGURED');
  if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9._~+\/=-]{12,4096}$/i.test(authorization))
    return denied('AUTH_REQUIRED',401);
  let adapter;
  try{
    adapter=createReadonlySupabaseAuthAdapter({projectUrl,publishableKey,fetchImpl});
  }catch{return denied('READONLY_ADAPTER_NOT_CONFIGURED');}
  const trustedVerify=async token=>{
    const user=await adapter.verifySession(token);
    if(user.id!==expectedTestUserId)throw new Error('test subject mismatch');
    return user;
  };
  let result;
  try{
    result=await inspectSimantabAuthorization({
      authorization,
      requestedChannel,
      requiredCapability,
      verifySession:trustedVerify,
      readProfile:adapter.readProfile,
      readCapabilities:adapter.readCapabilities
    });
  }catch{return denied('PROBE_VERIFICATION_UNAVAILABLE');}

  // The PROBE result contains no UUID, token, name, NIP, school or assignments.
  if(!result.ok)return denied(result.code,result.status);
  return Object.freeze({
    ok:true,status:200,code:'READONLY_AUTH_VALIDATED',
    role:result.context.role,
    loginChannel:result.context.loginChannel,
    visibilityScope:result.context.visibilityScope,
    requiredCapabilityChecked:requiredCapability!==null,
    // Even a successful probe does NOT imply row-level authorization
    // outside these specific read-only calls.
    productionWritesPerformed:false,
    aiGatewayUsed:false,
    apiMigrationCompleted:false
  });
}
