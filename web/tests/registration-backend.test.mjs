import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../supabase/functions/simantab-register-pending/index.ts', import.meta.url), 'utf8');
const executable = source
  .replace(/^import \{ createClient \} from "npm:@supabase\/supabase-js@2\.57\.4";\n/, '')
  .replace(/:unknown/g, '')
  .replace(/:string/g, '')
  .replace(/ as Error/g, '')
  .replace(/Deno\.env\.get\("SUPABASE_URL"\)!/, 'Deno.env.get("SUPABASE_URL")')
  .replace(/Deno\.env\.get\("SUPABASE_SERVICE_ROLE_KEY"\)!/, 'Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")');
assert.doesNotMatch(executable, /\bimport \{/);
new vm.Script(executable, {filename:'simantab-register-pending/index.ts'});

const CF='https://simantab-cf-preview.m-arief-rohman.workers.dev';
const VC='https://simantab-online.vercel.app';
const base={role:'GTK',email:'qa@example.invalid',password:'TestingOnly12!',full_name:'SIMANTAB QA'};
let passed=0;
function sandbox(config={}){
  const calls={created:0,deleted:0,unitUpdates:[],lookups:0,nipChecks:0};
  let handler;
  const db={
    auth:{admin:{
      async createUser({user_metadata}){calls.created++;calls.metadata=user_metadata;return {data:{user:{id:'fake-auth-uuid'}},error:null};},
      async deleteUser(){calls.deleted++;return {data:{user:null},error:null};}
    }},
    from(table){
      if(table==='school_master'){
        return {
          select(){return this;},eq(){return this;},
          async maybeSingle(){calls.lookups++;return {data:{school_name:'SDN Pengujian',is_active:true},error:null};}
        };
      }
      if(table!=='profiles')throw Error('Unexpected table '+table);
      return {
        select(fields){this.queryFields=fields;return this;},
        eq(){return this;},
        async limit(){
          if(this.queryFields!=='id')throw Error('Only short NIP existence lookup may use limit.');
          calls.nipChecks++;
          return config.nipAlreadyRegistered
            ? {data:[{id:'other-account-id'}],error:null}
            : {data:[],error:null};
        },
        update(fields){calls.unitUpdates.push(fields);return this;},
        async single(){
          if(calls.unitUpdates.length){
            return config.unitSaveFails
              ? {data:null,error:{message:'synthetic save failed'}}
              : {data:{unit:calls.unitUpdates.at(-1).unit},error:null};
          }
          return {data:{id:'fake-auth-uuid',full_name:'SIMANTAB QA'},error:null};
        }
      };
    }
  };
  const Deno={serve(fn){handler=fn;},env:{get(name){return name==='SUPABASE_URL'?'https://example.invalid':'fake-only';}}};
  vm.runInNewContext(executable, {createClient:()=>db,Deno,Response,Request,console}, {timeout:2500});
  return {handler,calls};
}
async function invoke(payload,origin=CF,config={}){
  const s=sandbox(config);
  const response=await s.handler(new Request('https://functions.example.invalid/',{
    method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(payload)
  }));
  return {status:response.status,data:await response.json(),headers:response.headers,calls:s.calls};
}
async function check(label,payload,{status=400,created=0,origin=CF,unitUpdates=0,...opts}={}){
  const v=await invoke(payload,origin,opts);
  assert.equal(v.status,status,label);
  assert.equal(v.calls.created,created,label);
  assert.equal(v.calls.unitUpdates.length,unitUpdates,label);
  console.log('PASS '+label);passed++;
  return v;
}
await check('Reject missing identity fields on Cloudflare',base);
await check('Reject missing ASN NIP',{...base,unit:'SDN Pengujian',employment_status:'PNS'});
await check('Reject invalid short ASN NIP',{...base,unit:'SDN Pengujian',employment_status:'PPPK',nip:'123'});
await check('Reject invalid Unit Kerja',{...base,unit:'',employment_status:'NON_ASN'});
await check('Reject unrecognized status',{...base,unit:'SDN Pengujian',employment_status:'UNKNOWN'});
await check('Allow non-ASN, save Unit Kerja',{...base,unit:'SDN Pengujian',employment_status:'NON_ASN'},{status:200,created:1,unitUpdates:1});
await check('Allow ASN with 18-digit NIP',{...base,unit:'SDN Pengujian',employment_status:'PPPK_PARUH_WAKTU',nip:'123456789012345678'},{status:200,created:1,unitUpdates:1});
const blocked=await check('Reject existing ASN NIP before creating Auth account',
 {...base,unit:'SDN Pengujian',employment_status:'PNS',nip:'123456789012345678'},
 {status:409,created:0,nipAlreadyRegistered:true});
assert.equal(blocked.data.code,'NIP_ALREADY_REGISTERED');
assert.match(blocked.data.error,/Gunakan Masuk|Lupa Password/);
assert.equal(blocked.calls.nipChecks,1);
await check('Reject existing KS NIP before creating account',
 {...base,role:'KEPALA_SEKOLAH',unit:'SDN Pengujian',school_npsn:'12345678',employment_status:'PNS',nip:'123456789012345678'},
 {status:409,created:0,nipAlreadyRegistered:true});
await check('Reject existing optional NIP used by non-ASN',
 {...base,unit:'SDN Pengujian',employment_status:'NON_ASN',nip:'123456789012345678'},
 {status:409,created:0,nipAlreadyRegistered:true});

await check('Pengawas always requires NIP',{...base,role:'PENGAWAS',unit:'Korwil Pengujian',employment_status:'NON_ASN'});
await check('Reject unapproved website origin',{...base,unit:'SDN Pengujian',employment_status:'NON_ASN'},{status:403,origin:'https://malicious.example'});
await check('Preserve legacy Vercel sign-up',{...base},{status:200,created:1,unitUpdates:0,origin:VC});
let ks=await check('Keep KS authoritative school unit',{...base,role:'KEPALA_SEKOLAH',unit:'SDN Pengujian',employment_status:'PNS',nip:'123456789012345678',school_npsn:'12345678'},{status:200,created:1,unitUpdates:0});
assert.equal(ks.calls.lookups,1);
let failed=await check('Roll back signup when Unit Kerja saving fails',{...base,unit:'SDN Pengujian',employment_status:'NON_ASN'},{status:400,created:1,unitUpdates:1,unitSaveFails:true});
assert.equal(failed.calls.deleted,1);
const s=sandbox();
const preflight=await s.handler(new Request('https://functions.example.invalid/',{method:'OPTIONS',headers:{origin:CF}}));
assert.equal(preflight.status,200);
assert.equal(preflight.headers.get('access-control-allow-origin'),CF);
passed++;console.log('PASS Cloudflare preflight CORS');
console.log('PASS '+passed+' isolated backend checks; no live accounts created');
