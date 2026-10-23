import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ui = fs.readFileSync(new URL('../registration-ui-final.js', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../../supabase/functions/simantab-register-pending/index.ts', import.meta.url), 'utf8');
new vm.Script(ui, { filename: 'registration-ui-final.js' });
assert.match(ui, /signupUnit/);
assert.match(ui, /signupEmploymentStatus/);
assert.match(ui, /input\.required=isSignup\(\)&&required/);
assert.match(service, /const requireIdentity=origin===cloudflareOrigin/);
assert.match(service, /update\(\{unit\}\)/);
assert.match(service, /NIP 18 digit wajib untuk seluruh ASN/);
assert.match(service, /simantab-cf-preview\.m-arief-rohman\.workers\.dev/);

function element(id, value = '') {
  const classes = new Set();
  const handlers = {};
  const label = { textContent: '' };
  return {
    id, value, dataset: {}, style: {}, textContent: '', placeholder: '', disabled: false, required: false,
    classList: { contains: n => classes.has(n), add: n => classes.add(n), remove: n => classes.delete(n) },
    closest: () => ({ querySelector: () => label }),
    setAttribute(n, v) { this[n] = v; },
    removeAttribute(n) { delete this[n]; },
    addEventListener(n, f) { handlers[n] = f; },
    querySelector: () => ({ textContent: '' })
  };
}
async function runCase({status, nip = '', unit = 'SDN Sambong 02', role = 'GTK', npsn = '', ksAssignment = '', login = false}) {
  const ids = {
    nameWrap: element('nameWrap'),
    signupExtra: element('signupExtra'),
    signupRole: element('signupRole', role),
    signupNip: element('signupNip', nip),
    signupUnit: element('signupUnit', unit),
    signupEmploymentStatus: element('signupEmploymentStatus', status),
    signupKsAssignment: element('signupKsAssignment', ksAssignment),
    signupKsAssignmentField: element('signupKsAssignmentField'),
    signupNpsn: element('signupNpsn', npsn),
    tabDinas: element('tabDinas'), tabGtk: element('tabGtk'),
    authMsg: element('authMsg'), authBtn: element('authBtn'), switchLink: element('switchLink'),
    fullName: element('fullName','GTK Contoh'), email: element('email','contoh@example.test'),
    password: element('password','TestPassword123')
  };
  if(login)ids.nameWrap.classList.add('hidden');
  const listeners = {};
  const requests = [];
  const document = {
    readyState:'complete',
    getElementById: n => ids[n] || null,
    querySelector: n => n === '.loginbox' ? {querySelector:()=>({textContent:''})} : null,
    addEventListener: (n,f) => {listeners[n] = f;},
  };
  const fetch = async (url,opts) => {
    requests.push({url,body:JSON.parse(opts.body)});
    return {ok:true,text:async()=>JSON.stringify(url.includes('registration_school_lookup')?[{npsn:npsn||'12345678'}]:{ok:true})};
  };
  vm.runInNewContext(ui, {document,fetch,setTimeout:()=>0,console,window:{}}, {timeout:1500});
  if(!login){
    const event = {
      type:'click', target:{closest:n=>n==='#authBtn'?{}:null},
      preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}
    };
    listeners.click(event);
    await new Promise(resolve=>setImmediate(resolve));
    await new Promise(resolve=>setImmediate(resolve));
  }
  return {message:ids.authMsg.textContent,requests,ids};
}

let result = await runCase({status:'PNS'});
assert.match(result.message,/NIP 18 digit wajib/);assert.equal(result.requests.length,0);
result = await runCase({status:'PPPK_PARUH_WAKTU'});
assert.match(result.message,/NIP 18 digit wajib/);assert.equal(result.requests.length,0);
result = await runCase({status:'NON_ASN',nip:''});
assert.equal(result.requests.length,1);
assert.equal(result.requests[0].body.unit,'SDN Sambong 02');
assert.equal(result.requests[0].body.employment_status,'NON_ASN');
result = await runCase({status:'PPPK',nip:'123456789012345678'});
assert.equal(result.requests.length,1);
assert.equal(result.requests[0].body.nip,'123456789012345678');
result = await runCase({status:'PNS',nip:'not-an-nip'});
assert.match(result.message,/NIP hanya boleh berisi/);assert.equal(result.requests.length,0);
result = await runCase({status:'NON_ASN',unit:''});
assert.match(result.message,/Unit Kerja wajib/);assert.equal(result.requests.length,0);
result = await runCase({status:'NON_ASN',role:'PENGAWAS'});
assert.match(result.message,/NIP 18 digit wajib/);assert.equal(result.requests.length,0);
result = await runCase({status:'PNS',role:'KEPALA_SEKOLAH',nip:'123456789012345678',npsn:'12345678',ksAssignment:'PLT'});
assert.equal(result.requests.length,2);
assert.equal(result.requests[1].body.role,'KEPALA_SEKOLAH');
assert.equal(result.requests[1].body.ks_assignment_status,'PLT');
assert.equal(result.requests[1].body.employment_status,'PNS');
result = await runCase({status:'PPPK',role:'KEPALA_SEKOLAH',nip:'123456789012345678',npsn:'12345678',ksAssignment:'PLT'});
assert.match(result.message,/berstatus PNS/);assert.equal(result.requests.length,0);
result = await runCase({status:'PNS',role:'KEPALA_SEKOLAH',nip:'123456789012345678',npsn:'12345678'});
assert.match(result.message,/Pilih Kepala Sekolah/);assert.equal(result.requests.length,0);
result = await runCase({status:'PNS',role:'KEPALA_SEKOLAH',nip:'123456789012345678',npsn:'12345678',ksAssignment:'DEFINITIF'});
assert.equal(result.requests[1].body.ks_assignment_status,'DEFINITIF');
result = await runCase({status:'PNS',login:true});
assert.equal(result.ids.signupNip.required,false);
assert.equal(result.ids.signupUnit.required,false);
assert.equal(result.ids.signupEmploymentStatus.required,false);
assert.equal(result.ids.signupKsAssignment.required,false);
console.log('PASS: ASN NIP, unit, non-ASN, payload, origin and login checks');
