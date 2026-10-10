/**
 * SIMANTAB Cloudflare staging — pure authorization boundary, NOT connected to
 * production. This module never imports a Supabase client and never fetches.
 *
 * The Supabase user identity must be verified on the server by a future
 * adapter. Profiles and service assignments must be obtained from a
 * user-scoped, RLS-protected source. These dependencies are INJECTED and mocked
 * by CI. Never accept client-provided roles, account approval or capabilities.
 */
const GTK_ROLES=new Set(['GTK','KEPALA_SEKOLAH','PENGAWAS']);
const DINAS_ROLES=new Set([
  'SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID',
  'KASI_SD','KASI_SMP','SUBKOOR_TK','KORWIL',
  'STAFF_DINAS','STAFF_TPG','STAFF_KGB','STAFF_KP_EKIN',
  'STAFF_PROMOSI','STAFF_ARSIP','STAFF_SKP','STAFF_PENSIUN',
  'STAFF_CUTI','STAFF_SPJ_SIMTENDIK','STAFF_USUL_SK'
]);
const GLOBAL_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID']);
const SCOPED_ROLES=Object.freeze({
  KASI_SD:'SD',
  KASI_SMP:'SMP',
  SUBKOOR_TK:'TK_PAUD_PNF'
});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const denied=(status,code)=>Object.freeze({ok:false,status,code});
const fail=Object.freeze({
  login:denied(401,'AUTH_REQUIRED'),
  invalid:denied(401,'INVALID_SESSION'),
  profile:denied(403,'PROFILE_NOT_ELIGIBLE'),
  channel:denied(403,'WRONG_LOGIN_CHANNEL'),
  password:denied(403,'PASSWORD_CHANGE_REQUIRED'),
  forbidden:denied(403,'INSUFFICIENT_CAPABILITY')
});
export const LOGIN_ROLE_CLASSES=Object.freeze({
  gtk:[...GTK_ROLES],dinas:[...DINAS_ROLES]
});
export function expectedLoginChannel(role){
  if(GTK_ROLES.has(role))return 'GTK';
  if(DINAS_ROLES.has(role))return 'DINAS';
  return null;
}
export function readonlyVisibilityScope(role) {
  if(GLOBAL_ROLES.has(role))return 'ALL_JENJANG';
  if(Object.hasOwn(SCOPED_ROLES,role))return SCOPED_ROLES[role];
  if(role==='KEPALA_SEKOLAH'||role==='GTK')return 'SELF_ONLY';
  if(role==='PENGAWAS')return 'ASSIGNED_DABIN_ONLY';
  if(DINAS_ROLES.has(role))return 'ASSIGNED_SERVICE_ONLY';
  return 'DENY';
}
function parseBearer(authorization){
  if(typeof authorization!=='string')return null;
  const match=authorization.match(/^Bearer ([A-Za-z0-9._~+\/=-]{12,4096})$/i);
  return match?.[1]||null;
}
/**
 * Dependency contracts:
 * verifySession(accessToken) -> {id: verified UUID}; must actually verify
 * token signature/expiry/audience via an authoritative auth provider.
 * readProfile({userId, accessToken}) -> RLS-restricted profile for that ID.
 * readCapabilities({userId, accessToken}) -> trusted active assignments
 * with {capability, is_active:true}. Required ONLY when a server route
 * supplies requiredCapability; never use user JSON to choose this value.
 */
export async function inspectSimantabAuthorization({
  authorization,requestedChannel,requiredCapability=null,
  verifySession,readProfile,readCapabilities
}={}) {
  const accessToken=parseBearer(authorization);
  if(!accessToken)return fail.login;
  if(typeof verifySession!=='function'||typeof readProfile!=='function')
    throw new TypeError('Server verification and profile readers are required');
  let account;
  try{
    const user=await verifySession(accessToken);
    if(!UUID.test(String(user?.id||'')))return fail.invalid;
    const record=await readProfile({userId:user.id,accessToken});
    if(!record||record.id!==user.id)return fail.profile;
    account=record;
  }catch{return fail.invalid;}
  const role=String(account.role||'').trim().toUpperCase();
  const channel=expectedLoginChannel(role);
  if(!channel||account.is_active!==true||account.approval_status!=='APPROVED')
    return fail.profile;
  // Role overrides legacy account_channel for PENGAWAS and school roles,
  // preserving the production V4 login hardening behavior.
  if(String(requestedChannel||'').trim().toUpperCase()!==channel)return fail.channel;
  if(account.must_change_password===true)return fail.password;
  if(requiredCapability!==null){
    if(typeof requiredCapability!=='string'||!/^[A-Z][A-Z_]{1,79}$/.test(requiredCapability))
      return fail.forbidden;
    if(typeof readCapabilities!=='function')return fail.forbidden;
    let assignments;
    try{assignments=await readCapabilities({userId:account.id,accessToken});}
    catch{return fail.forbidden;}
    if(!Array.isArray(assignments)||!assignments.some(
      x=>x?.capability===requiredCapability&&x.is_active===true
    ))return fail.forbidden;
  }
  return Object.freeze({
    ok:true,status:200,
    context:Object.freeze({
      userId:account.id,role,loginChannel:channel,
      visibilityScope:readonlyVisibilityScope(role),
      // Never return access token, PII, requested_role or database row.
      passwordChangeRequired:false
    })
  });
}
