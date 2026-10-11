import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateOperatorScope,assessDraft,districtName,validateSubject} from './authorization.mjs';

const pid='user-qa-1';
const base={id:pid,role:'OPERATOR_SMP',is_active:true,approval_status:'APPROVED',account_channel:'GTK',school_npsn:'20322721'};
const smpAssignment={user_id:pid,operator_kind:'SMP',school_npsn:'20322721',district:null,is_active:true};
const smp={npsn:'20322721',jenjang:'SMP',kecamatan:'Kec. Batang',school_status:'NEGERI',is_active:true};
const otherSmp={...smp,npsn:'20322771'};
const sd={npsn:'90000001',jenjang:'SD',kecamatan:'Kec. Batang',school_status:'NEGERI',is_active:true};
const otherSd={...sd,npsn:'90000002',kecamatan:'Kec. Kandeman'};
const korwilProfile={...base,role:'OPERATOR_KORWIL',school_npsn:null};
const korwilAssignment={user_id:pid,operator_kind:'KORWIL',school_npsn:null,district:'Batang',is_active:true};
const args=(profile=base,assignment=smpAssignment,school=smp,serviceType='KGB')=>({sessionUserId:pid,profile,assignment,school,serviceType});

test('SMP own NPSN: permit multi-service routing to correct staff',()=>{
 assert.deepEqual(evaluateOperatorScope(args()),{allowed:true,school_npsn:'20322721',coordinator:'KASI_SMP',staff:'STAFF_KGB'});
 assert.equal(evaluateOperatorScope(args(base,smpAssignment,smp,'CUTI')).staff,'STAFF_CUTI');
});
test('SMP other NPSN: deny',()=>assert.equal(evaluateOperatorScope(args(base,smpAssignment,otherSmp)).allowed,false));
test('SMP applying SD: deny',()=>assert.equal(evaluateOperatorScope(args(base,smpAssignment,sd)).allowed,false));
test('Korwil own district SD: permit',()=>{
 const r=evaluateOperatorScope(args(korwilProfile,korwilAssignment,sd,'CUTI'));
 assert.equal(r.allowed,true);assert.equal(r.staff,'STAFF_CUTI');assert.equal(r.coordinator,'KASI_SD');
});
test('Korwil other district SD: deny',()=>assert.equal(evaluateOperatorScope(args(korwilProfile,korwilAssignment,otherSd)).allowed,false));
test('Korwil SMP: deny',()=>assert.equal(evaluateOperatorScope(args(korwilProfile,korwilAssignment,smp)).allowed,false));
test('unknown account or forged user id: deny',()=>{
 assert.equal(evaluateOperatorScope({...args(),sessionUserId:'unknown'}).allowed,false);
 assert.equal(evaluateOperatorScope({...args(),assignment:{...smpAssignment,user_id:'attacker'}}).allowed,false);
});
test('inactive or unapproved operator: deny',()=>{
 assert.equal(evaluateOperatorScope(args({...base,is_active:false})).allowed,false);
 assert.equal(evaluateOperatorScope(args({...base,approval_status:'PENDING'})).allowed,false);
 assert.equal(evaluateOperatorScope(args(base,{...smpAssignment,is_active:false})).allowed,false);
});
test('account channel spoofing: deny',()=>assert.equal(evaluateOperatorScope(args({...base,account_channel:'DINAS'})).allowed,false));
test('private or inactive school: deny',()=>{
 assert.equal(evaluateOperatorScope(args(base,smpAssignment,{...smp,school_status:'SWASTA'})).allowed,false);
 assert.equal(evaluateOperatorScope(args(base,smpAssignment,{...smp,is_active:false})).allowed,false);
});
test('role/assignment mismatch: deny',()=>assert.equal(evaluateOperatorScope(args({...base,role:'GTK'})).allowed,false));
test('unsupported services: deny',()=>assert.equal(evaluateOperatorScope(args(base,smpAssignment,smp,'BCKS')).allowed,false));
test('subject attestation and NIP validated independently',()=>{
 const subject={name:'Guru Contoh A',nip:'123456789012345678',role:'GURU'};
 assert.equal(validateSubject(subject),true);
 assert.equal(assessDraft({...args(),subject,attested:true}).allowed,true);
 assert.equal(assessDraft({...args(),subject,attested:false}).allowed,false);
 assert.equal(assessDraft({...args(),subject:{...subject,nip:'123!'},attested:true}).allowed,false);
});
test('district name normalization handles Kec. prefix',()=>assert.equal(districtName(' Kec. Batang '),'BATANG'));
