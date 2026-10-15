'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'mandatory-personnel-profile.js'),'utf8');
const finalizer=fs.readFileSync(path.join(root,'finalize-html.mjs'),'utf8');
const postbuild=fs.readFileSync(path.join(root,'cloudflare/postbuild.mjs'),'utf8');
const ks=fs.readFileSync(path.join(root,'ks-needs-onboarding.js'),'utf8');

function mount(){
  const handlers={};
  const win={
    __simantabProfile:null,
    __simantabSb:null,
    showTab:async id=>id,
    openSubmission:()=>true,
    addEventListener:(name,fn)=>{(handlers[name] ||= []).push(fn);}
  };
  const doc={
    getElementById:()=>null,
    querySelectorAll:()=>[],
    addEventListener:()=>{}
  };
  vm.runInNewContext(source,{window:win,document:doc,setTimeout:()=>{},console},{timeout:2000});
  return {api:win.__simantabMandatoryPersonnelProfile,win,handlers};
}
const valid={
  full_name:'Nama Lengkap, S.Pd., M.Pd.',
  nip:'197402102008011006',
  pangkat:'Penata Tingkat I',
  golongan_ruang:'III/d',
  unit_gtk:'SMP Negeri 1 Tulis',
  address:'Jl. Pendidikan, Kecamatan Tulis, Kabupaten Batang',
  phone:'081234567890'
};
test('profil ASN requires all seven requested fields',()=>{
  const {api}=mount();
  assert.equal(api.version,2);
  assert.deepEqual(Array.from(api.missingFields(valid)),[]);
  for(const field of Object.keys(valid)){
    const bad={...valid,[field]:''};
    assert.equal(api.missingFields(bad).length,1,'Not blocked: '+field);
  }
});
test('invalid NIP and WA prevent service continuation',()=>{
  const {api}=mount();
  assert.ok(api.missingFields({...valid,nip:'123456'}).some(s=>/NIP/.test(s)));
  assert.ok(api.missingFields({...valid,phone:'123'}).some(s=>/WhatsApp/.test(s)));
  assert.deepEqual(Array.from(api.missingFields({...valid,phone:'+6281234567890'})),[]);
});
test('only personal GTK KS and supervisory roles are gated; institutional/admin accounts stay functional',()=>{
  const {api,win}=mount();
  assert.deepEqual(Array.from(api.roles).sort(),['GTK','KEPALA_SEKOLAH','KORWIL','PENGAWAS'].sort());
  for(const role of ['SUPER_ADMIN','OPERATOR_KORWIL','OPERATOR_SMP','STAFF_TPG']){
    win.__simantabProfile={id:'x',role};
    assert.equal(api.isBlocked(),false);
  }
});
test('save writes only seven personnel fields for the authenticated owner',()=>{
  assert.match(source,/await sb\.auth\.getUser\(\)/);
  assert.match(source,/userId!==getProfile\(\)\?\.id/);
  assert.match(source,/\.update\(payload\)\.eq\('id',userId\)/);
  assert.match(source,/unit_gtk:value\('simPersonnelUnit'\)/);
  assert.doesNotMatch(source,/\bunit:value\('simPersonnelUnit'\)/);
  assert.match(source,/missingFields\(saved\)\.length/);
  assert.match(source,/window\.location\.reload\(\)/);
  assert.doesNotMatch(source,/service_role|delete\(\)|DROP TABLE/);
});
test('build keeps mandatory module Cloudflare-only and KS profile remains reachable',()=>{
  assert.match(finalizer,/SIMANTAB_BUILD_TARGET === 'cloudflare' \? \[\['mandatory-personnel-profile\.js',2\]\]/);
  assert.match(postbuild,/SIMANTAB_PROFILE_WAJIB_LENGKAP_V1_CLOUDFLARE/);
  assert.match(ks,/!\['needs','profile'\]\.includes\(id\)/);
  assert.match(ks,/!\['needs','profile'\]\.includes\(button\.dataset\.tab\)/);
});

async function runNavigation(role,complete){
  const events={};
  const tabs=[];
  let opened=0;
  const data={
    ...valid,id:'profile-owner',role,approval_status:'APPROVED',is_active:true,
    ...(complete?{}:{pangkat:'',golongan_ruang:'',address:'',phone:''})
  };
  const win={
    __simantabProfile:{id:'profile-owner',role},
    __simantabSb:{from:()=>({
      select(){return this;},
      eq(){return this;},
      async single(){return {data,error:null};}
    })},
    showTab:async id=>{tabs.push(id);return id;},
    openSubmission:()=>{opened++;return true;},
    addEventListener:(name,handler)=>{(events[name] ||= []).push(handler);}
  };
  const doc={getElementById:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}};
  vm.runInNewContext(source,{window:win,document:doc,setTimeout:()=>{},console},{timeout:2000});
  for(const fn of events['simantab:profile-ready']||[])fn();
  for(let i=0;i<20;i++)await Promise.resolve();
  tabs.length=0;
  const navigation=await win.showTab('services');
  win.openSubmission('E_JABFUNG','Kenaikan Jenjang Jabfung');
  for(let i=0;i<10;i++)await Promise.resolve();
  return {navigation,tabs,opened,blocked:win.__simantabMandatoryPersonnelProfile.isBlocked()};
}
test('incomplete GTK, Kepala Sekolah and Pengawas cannot open other services',async()=>{
  for(const role of ['GTK','KEPALA_SEKOLAH','PENGAWAS']){
    const x=await runNavigation(role,false);
    assert.equal(x.blocked,true,role);
    assert.equal(x.navigation,'profile',role);
    assert.equal(x.opened,0,role);
    assert.ok(x.tabs.every(tab=>tab==='profile'),role);
  }
});
test('complete GTK and exempt Super Admin can navigate normally',async()=>{
  for(const [role,complete] of [['GTK',true],['SUPER_ADMIN',false]]){
    const x=await runNavigation(role,complete);
    assert.equal(x.blocked,false,role);
    assert.equal(x.navigation,'services',role);
    assert.equal(x.opened,1,role);
  }
});

test('unit kerja is GTK-owned even when protected unit field is empty',()=>{
 const {api}=mount();
 assert.equal(api.effectiveUnit({...valid,unit:'',unit_gtk:'SD Negeri Lawangaji'}),'SD Negeri Lawangaji');
 assert.equal(api.missingFields({...valid,unit:'',unit_gtk:''}).includes('Unit kerja'),true);
 assert.equal(api.missingFields({...valid,unit:'SD Negeri Kumejing',unit_gtk:''}).includes('Unit kerja'),false);
});
