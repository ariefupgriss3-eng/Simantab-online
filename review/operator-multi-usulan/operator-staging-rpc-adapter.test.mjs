import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOperatorDraftPayload,createOperatorDraftStaging} from './operator-staging-rpc-adapter.mjs';

const key='00000000-0000-4000-8000-000000000001';
const id='11111111-1111-4111-8111-111111111111';
const form={
  npsn:'20322721',name:'Guru Contoh A',nip:'123456789012345678',
  position:'GURU',service:'KGB',title:'Kenaikan Gaji Berkala',
  description:'Permohonan uji fiktif',attested:true,
  operator_id:'FORGED_USER',role:'SUPER_ADMIN',district:'OTHER_DISTRICT',
  status:'COMPLETED',assigned_role:'KABID'
};

test('RPC payload contains only applicant data, never spoofable authorization/status fields',()=>{
  const p=buildOperatorDraftPayload(form,key);
  assert.deepEqual(Object.keys(p).sort(),[
    'p_request_key','p_npsn','p_name','p_nip','p_position',
    'p_service_type','p_title','p_description','p_leave_type'
  ].sort());
  assert.equal(p.p_service_type,'KGB');
  assert.equal(p.p_leave_type,null);
  assert.equal(JSON.stringify(p).includes('FORGED_USER'),false);
  assert.equal(JSON.stringify(p).includes('COMPLETED'),false);
  assert.equal(JSON.stringify(p).includes('OTHER_DISTRICT'),false);
});

test('staging switch OFF rejects before any RPC call',async()=>{
  let calls=0;
  const mock={rpc:async()=>{calls++;return {data:id,error:null}}};
  await assert.rejects(createOperatorDraftStaging({supabase:mock,form,requestKey:key}),/staging/);
  assert.equal(calls,0);
});

test('staging switch ON requests operator_create_draft only; status remains DRAFT',async()=>{
  const calls=[];
  const mock={rpc:async(name,data)=>{calls.push({name,data});return {data:id,error:null}}};
  const out=await createOperatorDraftStaging({supabase:mock,form,requestKey:key,stagingEnabled:true});
  assert.equal(calls.length,1);
  assert.equal(calls[0].name,'operator_create_draft');
  assert.deepEqual(out,{submissionId:id,status:'DRAFT',sentToDinas:false});
});

test('reject cross-NPSN spoofed/non-numeric NPSN locally (server still authoritative)',()=>{
  assert.throws(()=>buildOperatorDraftPayload({...form,npsn:'20322ABC'},key),/tidak valid/);
});

test('reject missing attestation',()=>{
  assert.throws(()=>buildOperatorDraftPayload({...form,attested:false},key),/Konfirmasi/);
});

test('reject fabricated service',()=>{
  assert.throws(()=>buildOperatorDraftPayload({...form,service:'KABID_APPROVAL'},key),/Layanan/);
});

test('reject non-UUID idempotency key',()=>{
  assert.throws(()=>buildOperatorDraftPayload(form,'not-a-uuid'),/UUID/);
});

test('server error is surfaced but does not claim success',async()=>{
  const mock={rpc:async()=>({data:null,error:{message:'AKSES DITOLAK'}})};
  await assert.rejects(createOperatorDraftStaging({supabase:mock,form,requestKey:key,stagingEnabled:true}),/AKSES DITOLAK/);
});


test('Cuti requires six recognized leave types',()=>{
  for (const leaveType of ['TAHUNAN','SAKIT','MELAHIRKAN','ALASAN_PENTING','BESAR_UMROH','BESAR_HAJI']) {
    const payload=buildOperatorDraftPayload({...form,service:'CUTI',leaveType},key);
    assert.equal(payload.p_leave_type,leaveType);
  }
  assert.throws(()=>buildOperatorDraftPayload({...form,service:'CUTI',leaveType:''},key),/Jenis Cuti/);
  assert.throws(()=>buildOperatorDraftPayload({...form,service:'CUTI',leaveType:'PENGATURAN_ADMIN'},key),/Jenis Cuti/);
  assert.throws(()=>buildOperatorDraftPayload({...form,service:'KGB',leaveType:'SAKIT'},key),/Jenis Cuti/);
});
