/**
 * SIMANTAB Cloudflare staging: optional READ-ONLY Supabase Auth/PostgREST adapter.
 *
 * NOT connected to Cloudflare worker routes. Do not wire it to a publicly
 * reachable endpoint or enable real user tokens until separately authorized.
 * Production's existing Supabase project is the only allowed target.
 *
 * No service-role credentials, writes, refresh tokens, cookies, or AI calls.
 * Never log secrets, returned users or original error bodies.
 */
const EXISTING_PROJECT_REF='tizxfzvgglkokzvsiwkg';
const PROJECT_URL='https://'+EXISTING_PROJECT_REF+'.supabase.co';
const USER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACCESS_TOKEN=/^[A-Za-z0-9._~+\/=-]{12,4096}$/;
const PROFILE_COLUMNS='id,role,is_active,approval_status,account_channel,must_change_password,position,school_npsn';
const TASK_COLUMNS='user_id,capability,is_active';
const READ_TIMEOUT_MS=7000;
const rejected=()=>new Error('Supabase read-only identity verification unavailable');

function requireProjectUrl(projectUrl){
  if(projectUrl!==PROJECT_URL)throw new TypeError('Only the existing SIMANTAB Supabase project is allowed');
  return projectUrl;
}
function requirePublicKey(key){
  if(typeof key!=='string'||!/^sb_publishable_[A-Za-z0-9_-]{16,200}$/.test(key))
    throw new TypeError('Only a Supabase publishable key may be configured');
  return key;
}
function requireAccessToken(token){
  if(typeof token!=='string'||!ACCESS_TOKEN.test(token))throw rejected();
  return token;
}
function requireUserId(value){
  if(typeof value!=='string'||!USER_ID.test(value))throw rejected();
  return value;
}

export function createReadonlySupabaseAuthAdapter({
  projectUrl,
  publishableKey,
  fetchImpl,
  timeoutMs=READ_TIMEOUT_MS
}={}){
  const base=requireProjectUrl(projectUrl);
  const key=requirePublicKey(publishableKey);
  if(typeof fetchImpl!=='function')throw new TypeError('Explicit fetch dependency is required in staging');
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>15000)
    throw new TypeError('Invalid identity read timeout');

  function headers(token){
    return {
      apikey:key,
      Authorization:'Bearer '+requireAccessToken(token),
      Accept:'application/json',
      'Cache-Control':'no-store'
    };
  }
  async function get(path,token,params=null){
    const url=new URL(path,base);
    if(params)for(const [name,value] of Object.entries(params))url.searchParams.set(name,value);
    if(url.origin!==base)throw rejected();
    try{
      // Never accept a redirected request carrying a bearer token or apikey.
      const response=await fetchImpl(url.href,{
        method:'GET',
        headers:headers(token),
        redirect:'error',
        cache:'no-store',
        signal:AbortSignal.timeout(timeoutMs)
      });
      if(!response||response.ok!==true)throw rejected();
      return await response.json();
    }catch{throw rejected();}
  }

  async function verifySession(accessToken){
    const token=requireAccessToken(accessToken);
    const data=await get('/auth/v1/user',token);
    const userId=requireUserId(data?.id);
    // VerifySession output deliberately excludes email, phone, role and token.
    return {id:userId};
  }
  async function readProfile({userId,accessToken}={}){
    const id=requireUserId(userId);
    const token=requireAccessToken(accessToken);
    const rows=await get('/rest/v1/profiles',token,{
      select:PROFILE_COLUMNS,id:'eq.'+id,limit:'1'
    });
    if(!Array.isArray(rows)||rows.length!==1||rows[0]?.id!==id)throw rejected();
    const row=rows[0];
    return {
      id:row.id,
      role:row.role,
      is_active:row.is_active,
      approval_status:row.approval_status,
      account_channel:row.account_channel,
      must_change_password:row.must_change_password,
      position:row.position,
      school_npsn:row.school_npsn
    };
  }
  async function readCapabilities({userId,accessToken}={}){
    const id=requireUserId(userId);
    const token=requireAccessToken(accessToken);
    const rows=await get('/rest/v1/team_task_assignments',token,{
      select:TASK_COLUMNS,user_id:'eq.'+id,is_active:'eq.true',limit:'100'
    });
    if(!Array.isArray(rows)||rows.length>100)throw rejected();
    if(rows.some(r=>!r||r.user_id!==id||typeof r.capability!=='string'||r.is_active!==true))
      throw rejected();
    return rows.map(row=>({capability:row.capability,is_active:true}));
  }
  return Object.freeze({verifySession,readProfile,readCapabilities});
}
export const EXISTING_SIMANTAB_PROJECT_URL=PROJECT_URL;
