import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../smartgtk-unified.js',import.meta.url),'utf8');

test('mobile bulk selection belongs to Kabid panel, not after 57 drafts',()=>{
 assert.match(src,/SIMANTAB_SMARTGTK_BULK_MOBILE_SELECT_V2/);
 assert.match(src,/workflowBulkSelectionList\(eligible\)/);
 assert.match(src,/function workflowBulkPanel\(\)/);
 assert.match(src,/max-height:310px/);
 assert.match(src,/sg-bulk-label/);
 assert.match(src,/tr\.hidden=otherScope/);
 assert.doesNotMatch(src,/workflowBulkCheckbox\(x\)/);
 assert.match(src,/stopImmediatePropagation\(\)/);
 assert.match(src,/modal\.addEventListener\('click',async e=>\{/);
 assert.match(src,/mobileBulkSelection:true/);
 assert.doesNotThrow(()=>new Function(src));
});

test('tap Pilih Semua selects 32 SD cases and activates both buttons immediately',async()=>{
 const a=src.indexOf('function refreshBulkControls(){');
 const b=src.indexOf('async function workflowBulkAssign(',a);
 assert.ok(a>0&&b>a,'refresh function found');
 const refresh=src.slice(a,b);
 const listenerStart=src.indexOf("modal.addEventListener('click',async e=>{",src.indexOf('/* Handle panel buttons directly'));
 const listenerEnd=src.indexOf('},true);',listenerStart);
 assert.ok(listenerStart>0&&listenerEnd>listenerStart,'capture handler found');
 const capture=src.slice(listenerStart,listenerEnd+'},true);'.length);
 const selected=Array.from({length:32},(_,i)=>({
  checked:false,disabled:false,dataset:{scope:'SD',sgBulkRow:'case-'+i},
  closest:()=>({hidden:false})
 }));
 let message='';
 const one={disabled:true},balanced={disabled:true},quick={disabled:true,textContent:''},staffSelect={value:'staff1',innerHTML:''};
 const counter={textContent:''},quickCount={textContent:''};
 const scope={value:'SD'};
 const handlers=[];
 const modal={
  querySelectorAll(selector){
   if(selector==='input[data-sg-bulk-row]'||selector==='#sgBulkPanel input[data-sg-bulk-row]')return selected;
   throw Error('unknown selector '+selector);
  },
  querySelector(selector){
   if(selector==='[data-action="wf-quick-assign"]')return quick;
   if(selector==='[data-action="wf-bulk-single"]')return one;
   if(selector==='[data-action="wf-bulk-balanced"]')return balanced;
   throw Error('unknown query '+selector);
  },
  addEventListener(type,handler,capture){handlers.push({type,handler,capture});}
 };
 const doc={getElementById(id){
  return {'sgBulkScope':scope,'sgBulkStaff':staffSelect,'sgBulkCounter':counter,'sgQuickCount':quickCount}[id]||null;
 }};
 const fn=new Function('modal','document','p','workflowStaff','workflowPage','workflowItems','workflowBulkEligible','esc','option','info','workflowBulkAssign',
  'let busy=false;\n'+refresh+'\n'+capture+'\nreturn {refreshBulkControls};');
 const harness=fn(modal,doc,()=>({role:'KABID'}),
  [{scope:'SD',id:'staff1',name:'Icha',role:'STAFF_SPJ_SIMTENDIK'}],0,
  Array.from({length:32},(_,i)=>({scope:'SD',status:'MENUNGGU_PENUGASAN',owner_id:'case-'+i})),row=>row.scope==='SD',
  x=>String(x),(id,name)=>'<option value="'+id+'">'+name+'</option>',
  x=>{message=x},async()=>{throw Error('not called')});
 const handler=handlers.find(h=>h.capture===true&&h.type==='click')?.handler;
 assert.equal(typeof handler,'function');
 harness.refreshBulkControls();
 assert.equal(one.disabled,true);
 assert.equal(balanced.disabled,true);
 assert.equal(quick.disabled,false);
 assert.match(quick.textContent,/Bagikan 32 Tugas SD Otomatis/);
 const evt=action=>({target:{closest:()=>({dataset:{action}})},
  preventDefault(){},stopImmediatePropagation(){}});
 await handler(evt('wf-bulk-all'));
 assert.equal(selected.filter(x=>x.checked).length,32);
 assert.match(counter.textContent,/^32 dipilih dari 32/);
 assert.equal(one.disabled,false);
 assert.equal(balanced.disabled,false);
 await handler(evt('wf-bulk-clear'));
 assert.equal(selected.filter(x=>x.checked).length,0);
 assert.match(counter.textContent,/^0 dipilih dari 32/);
 assert.equal(one.disabled,true);
 assert.equal(balanced.disabled,true);
 assert.equal(message,'');
});
