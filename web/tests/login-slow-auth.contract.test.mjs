import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync(new URL('../login-click-rescue.js',import.meta.url),'utf8');
const inject=fs.readFileSync(new URL('../inject-login-click-rescue.mjs',import.meta.url),'utf8');
const finalizer=fs.readFileSync(new URL('../finalize-html.mjs',import.meta.url),'utf8');
const verify=fs.readFileSync(new URL('../cloudflare/verify-deployment-bundle.mjs',import.meta.url),'utf8');

test('login v5 does not race a still-pending password login against a 15-second timeout',()=>{
 assert.match(src,/SIMANTAB_LOGIN_SLOW_AUTH_PROGRESS_V1/);
 assert.match(src,/const uid=await authenticate\(sb,login,password\)/);
 assert.doesNotMatch(src,/Promise\.race\(\[authenticate/);
 assert.doesNotMatch(src,/wait\(15000\)/);
 assert.match(src,/if\(busy\)return/);
 assert.match(src,/btn\.disabled=true/);
 assert.match(src,/progressTimers\.forEach\(clearTimeout\)/);
 assert.match(src,/slowAuthProgress:true/);
 assert.doesNotThrow(()=>new Function(src));
});
test('Cloudflare outputs version-busted v5 and requires slow auth fix',()=>{
 assert.match(inject,/login-click-rescue\.js\?v=5/);
 assert.match(finalizer,/\['login-click-rescue\.js',5\]/);
 assert.match(verify,/login-click-rescue\.js\?v=5/);
 assert.match(verify,/SIMANTAB_LOGIN_SLOW_AUTH_PROGRESS_V1/);
 assert.match(verify,/noFalseTimeout:true/);
});
test('exactly one login request remains pending until the server returns',async()=>{
 const from=src.indexOf('async function runLogin(){');
 const to=src.indexOf('function bind()',from);
 assert.ok(from>0&&to>from,'runLogin body available for simulation');
 const code=src.slice(from,to);
 const fields={email:{value:'test@example.invalid'},password:{value:'example_pass'},authBtn:{disabled:false}};
 const events=[];let callCount=0;let refreshCount=0;let resolveAuth;
 const pendingAuth=new Promise(resolve=>resolveAuth=resolve);
 const profile={role:'KABID',is_active:true,approval_status:'APPROVED',account_channel:'DINAS',full_name:'Synthetic'};
 const sb={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:profile,error:null})})})})};
 const fn=new Function('$','isSignup','window','show','getClient','authenticate','effectiveChannel','selectedChannel','clearNetworkHelp','isNetworkError','showNetworkHelp','location',
 'let busy=false;'+code+'return runLogin;');
 const runner=fn(k=>fields[k]||null,()=>false,{},(msg,kind)=>events.push({msg,kind}),
  async()=>sb,async()=>{callCount++;return pendingAuth},()=> 'DINAS',()=> 'DINAS',()=>{},()=>false,()=>{}, {reload:()=>{refreshCount++}});
 const p=runner();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(callCount,1);
 assert.equal(fields.authBtn.disabled,true);
 const second=runner();
 await second;
 assert.equal(callCount,1,'second click during pending login must be ignored');
 assert.equal(refreshCount,0);
 resolveAuth('00000000-0000-4000-8000-000000000000');
 await p;
 assert.equal(refreshCount,1,'success reloads when server responds');
 assert.ok(events.some(x=>/Login berhasil/.test(x.msg)));
 assert.ok(events.every(x=>x.kind!=='err'));
});
