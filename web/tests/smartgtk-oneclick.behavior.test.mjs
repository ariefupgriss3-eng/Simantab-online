import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../smartgtk-unified.js',import.meta.url),'utf8');

test('Kabid one-click UI is prominent, with optional manual controls and a single capture-phase tap',()=>{
 assert.match(source,/SIMANTAB_SMARTGTK_KABID_ONECLICK_V1/);
 assert.match(source,/id="sgQuickAssign"/);
 assert.match(source,/wf-quick-assign/);
 assert.match(source,/⚡ Bagikan Semua Otomatis \(1 Klik\)/);
 assert.match(source,/<details id="sgBulkManual">/);
 assert.match(source,/oneClickAutoAssign:true/);
 assert.match(source,/version:26/);
 assert.match(source,/quick\.disabled=pending\.length===0\|\|candidates\.length===0/);
 assert.doesNotMatch(source,/quick\.disabled=.*\|\|busy/);
 assert.match(source,/await workflowQuickAssign\(\)/);
 assert.doesNotThrow(()=>new Function(source));
});
test('one tap distributes all 32 eligible SD cases, without selecting names or confirmation',async()=>{
 const begin=source.indexOf('async function workflowQuickAssign(){');
 const end=source.indexOf('async function workflowBulkAssign(',begin);
 assert.ok(begin>0&&end>begin);
 const fnBody=source.slice(begin,end);
 assert.doesNotMatch(fnBody,/\bconfirm\s*\(/);
 assert.doesNotMatch(fnBody,/querySelectorAll/);
 assert.match(fnBody,/p_mode:'BALANCED',p_staff:null/);
 const cases=Array.from({length:32},(_,i)=>({owner_id:'sd'+i,scope:'SD',version:1,ready:true}));
 cases.push({owner_id:'smp1',scope:'SMP',version:1,ready:true});
 cases.push({owner_id:'sd-draft',scope:'SD',version:1,ready:false});
 const calls=[];
 const messages=[];
 let loads=0,renders=0;
 const rpc=async (name,args)=>{
  calls.push({name,args});
  return {data:{ok:true,count:32,assignments:cases.slice(0,32).map(x=>({owner_id:x.owner_id,staff_name:'Icha'}))}};
 };
 const factory=new Function('p','document','workflowItems','workflowStaff','workflowBulkEligible','sb','loadDinasWorkflow','workflowDashboard','info',fnBody+'return workflowQuickAssign;');
 const run=factory(()=>({role:'KABID'}),{getElementById:()=>({value:'SD'})},
  cases,[{scope:'SD',id:'staff1',name:'Icha'}],row=>row.ready,
  {rpc},async()=>{loads++},()=>{renders++},(message)=>messages.push(message));
 await run();
 assert.equal(calls.length,1);
 assert.equal(calls[0].name,'smartgtk_workflow_bulk_assign');
 assert.equal(calls[0].args.p_scope,'SD');
 assert.equal(calls[0].args.p_mode,'BALANCED');
 assert.equal(calls[0].args.p_staff,null);
 assert.equal(calls[0].args.p_cases.length,32);
 assert.deepEqual(calls[0].args.p_cases[0],{owner_id:'sd0',version:1});
 assert.equal(loads,1);
 assert.equal(renders,1);
 assert.match(messages[0],/Berhasil membagikan 32 kasus SD otomatis/);
});
test('one-click Kabid only; no eligible cases does not call server',async()=>{
 const begin=source.indexOf('async function workflowQuickAssign(){');
 const end=source.indexOf('async function workflowBulkAssign(',begin);
 const fnBody=source.slice(begin,end);
 const factory=new Function('p','document','workflowItems','workflowStaff','workflowBulkEligible','sb','loadDinasWorkflow','workflowDashboard','info',fnBody+'return workflowQuickAssign;');
 let rpcCount=0,notice='';
 const base=[{scope:'SD',id:'staff1',name:'Icha'}],doc={getElementById:()=>({value:'SD'})};
 const client={rpc:async()=>{rpcCount++;return {data:{}}}};
 const unauthorized=factory(()=>({role:'GTK'}),doc,[],base,()=>true,client,async()=>{},()=>{},()=>{});
 await assert.rejects(unauthorized(),/Hanya Kabid aktif/);
 const empty=factory(()=>({role:'KABID'}),doc,[],base,()=>true,client,async()=>{},()=>{},m=>notice=m);
 await empty();
 assert.equal(rpcCount,0);
 assert.match(notice,/Tidak ada kasus siap tugas/);
});
