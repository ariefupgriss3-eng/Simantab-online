import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../web/operator-multi-usulan-preview.js',import.meta.url),'utf8');
function prepare(){
  const elements={};
  class Element {
    constructor(id='',tag='div'){
      this.id=id;this.tagName=tag;this.style={};this.listeners={};
      this.classList={add(){},remove(){}};this._innerHTML='';
      this.value='';this.checked=false;this.textContent='';this.children=[];
    }
    set innerHTML(s){
      this._innerHTML=s;
      for(const m of s.matchAll(/id="([^"]+)"/g)) if(!elements[m[1]])elements[m[1]]=new Element(m[1]);
      if(s.includes('id="opPreviewService"')){
        elements.opPreviewService.value='CUTI';
        elements.opPreviewPosition.value='GURU';
      }
    }
    get innerHTML(){return this._innerHTML;}
    addEventListener(event,fn){this.listeners[event]=fn;}
    replaceChildren(){this.children=[];this.value='';}
    appendChild(node){this.children.push(node);if(this.children.length===1)this.value=node.value;}
    click(){this.listeners.click?.({target:this});}
  }
  const body=new Element('body');
  const win={__SIMANTAB_OPERATOR_QA_PREVIEW__:true,__SIMANTAB_OPERATOR_QA_OFFLINE__:true,
    __simantabProfile:{id:'qa-local',username:'qa_simantab_01',role:'OPERATOR_SMP'}};
  const doc={
    createElement:tag=>new Element('',tag),
    getElementById:id=>elements[id]||null,
    querySelector:()=>null,querySelectorAll:()=>[],body
  };
  body.appendChild=(node)=>{elements[node.id]=node;};
  runInNewContext(source,{window:win,document:doc,console});
  return {e:elements,api:win.__SIMANTAB_OPERATOR_PREVIEW_TEST_API__};
}
function subject(e,name,nip){
  e.opPreviewName.value=name;e.opPreviewNip.value=nip;e.opPreviewAttest.checked=true;
}
test('QA preview: scope boundaries, multi applicants, routing and no backend writes',()=>{
  const {e,api}=prepare();
  assert.equal(api.mode,'OFFLINE_NO_BACKEND'); // 1
  assert.equal(e.opPreviewSchool.children.length,1); // 2
  subject(e,'Guru Contoh A','123456789012345678');e.opPreviewAdd.click();
  assert.equal(api.records().length,1); // 3
  assert.equal(api.records()[0].route,'STAFF_CUTI'); // 4
  subject(e,'Guru Contoh A','123456789012345678');e.opPreviewAdd.click();
  assert.equal(api.records().length,1); // 5: duplicate
  e.opPreviewService.value='KGB';e.opPreviewService.listeners.change({target:e.opPreviewService});
  subject(e,'Guru Contoh A','123456789012345678');e.opPreviewAdd.click();
  assert.equal(api.records().length,2); // 6: different service
  assert.equal(api.records()[1].route,'STAFF_KGB'); // 7
  e.opPreviewSchool.value='20322771';subject(e,'Guru SMP Lain','123456789012345679');e.opPreviewAdd.click();
  assert.equal(api.records().length,2); // 8: foreign SMP
  e.opPreviewRole.value='KORWIL';e.opPreviewRole.listeners.change({target:e.opPreviewRole});
  assert.equal(e.opPreviewSchool.children.length,2); // 9
  assert.equal(api.records().length,0); // 10
  subject(e,'Guru SD Contoh A','123456789012345681');e.opPreviewAdd.click();
  assert.equal(api.records().length,1); // 11
  e.opPreviewSchool.value='90000002';subject(e,'Guru Kecamatan Lain','123456789012345682');e.opPreviewAdd.click();
  assert.equal(api.records().length,1); // 12
  e.opPreviewClear.click();assert.equal(api.records().length,0); // 13
  assert.equal(/(?:\bsb\.rpc\b|\bsb\.from\b|\.upload\(|\bfetch\()/.test(source),false);
});
