/* SIMANTAB_OPERATOR_MULTI_USULAN_PREVIEW_V1
 * SAFE PREVIEW: in-memory fictitious data, no fetch/storage/Supabase writes.
 * Never use client-only checks as authorization.
 */
(() => {
  'use strict';
  if (window.__SIMANTAB_OPERATOR_QA_PREVIEW__ !== true) return;
  const offline = window.__SIMANTAB_OPERATOR_QA_OFFLINE__ === true;
  const profile = window.__simantabProfile || {};
  const role = String(profile.role || '').toUpperCase();
  if (!offline && !['OPERATOR_SMP','OPERATOR_KORWIL'].includes(role)) return;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const ALLOWED = Object.freeze({CUTI:'STAFF_CUTI',KGB:'STAFF_KGB'});
  const STAGES = Object.freeze({DRAFT:'Draf Simulasi',READY:'Siap Uji (Tidak Terkirim)'});
  const fakeSchools = [
    {npsn:'20322721',name:'SMP Negeri 1 Batang',level:'SMP',district:'Batang',status:'NEGERI'},
    {npsn:'20322771',name:'SMP Negeri 2 Batang',level:'SMP',district:'Batang',status:'NEGERI'},
    {npsn:'90000001',name:'SD Simulasi Batang A',level:'SD',district:'Batang',status:'NEGERI'},
    {npsn:'90000003',name:'SD Simulasi Batang B',level:'SD',district:'Batang',status:'NEGERI'},
    {npsn:'90000002',name:'SD Simulasi Kandeman',level:'SD',district:'Kandeman',status:'NEGERI'}
  ];
  let drafts = [], nextId = 1;
  let kind = offline ? 'SMP' : (role === 'OPERATOR_KORWIL' ? 'KORWIL' : 'SMP');
  const assignment = () => kind === 'SMP'
    ? {kind:'SMP',npsn:'20322721',district:null}
    : {kind:'KORWIL',npsn:null,district:'Batang'};
  const schoolAllowed = (s, a) => s.status === 'NEGERI' &&
    ((a.kind === 'SMP' && s.level === 'SMP' && s.npsn === a.npsn) ||
     (a.kind === 'KORWIL' && s.level === 'SD' && s.district === a.district));
  const schools = () => fakeSchools.filter(s => schoolAllowed(s,assignment()));
  const result = {version:1,mode:'OFFLINE_NO_BACKEND',records:() => drafts.map(x => ({...x}))};
  window.__SIMANTAB_OPERATOR_PREVIEW_TEST_API__ = result;

  const root = document.createElement('section');
  root.id = 'operatorMultiPreview';
  root.className = 'section';
  root.style.display = 'none';
  root.innerHTML =
    '<div class="head"><div><h2>Multi-Usulan Operator</h2><p>Pratinjau khusus QA: satu operator dapat menyiapkan banyak usulan untuk guru dan kepala sekolah.</p></div></div>' +
    '<div style="padding:14px;border:2px solid #bb711d;background:#fff7e8;border-radius:12px;margin-bottom:16px;color:#733b0b"><b>SIMULASI — TIDAK TERKIRIM</b><p style="margin:5px 0 0">Semua identitas dan NPSN contoh digunakan hanya di memori browser. Tidak ada permintaan jaringan atau berkas yang diunggah.</p></div>' +
    '<div class="card" style="padding:17px"><div id="opPreviewScope"></div>' +
    (offline ? '<p><label>Uji peran: <select id="opPreviewRole"><option value="SMP">Operator SMP</option><option value="KORWIL">Operator Korwil</option></select></label></p>' : '') +
    '<div class="grid">' +
    '<div class="field s6"><label>Sekolah</label><select id="opPreviewSchool"></select></div>' +
    '<div class="field s6"><label>Jenis layanan</label><select id="opPreviewService"><option value="CUTI">Cuti</option><option value="KGB">Kenaikan Gaji Berkala</option></select></div>' +
    '<div class="field s6"><label>Nama pemohon simulasi</label><input id="opPreviewName" maxlength="180" placeholder="Guru Contoh A"></div>' +
    '<div class="field s6"><label>NIP contoh (8–20 digit)</label><input id="opPreviewNip" maxlength="20" placeholder="123456789012345678"></div>' +
    '<div class="field s6"><label>Jabatan pemohon</label><select id="opPreviewPosition"><option value="GURU">Guru</option><option value="KEPALA_SEKOLAH">Kepala Sekolah</option></select></div>' +
    '<div class="field s6"><label>Tujuan dinas (otomatis)</label><output id="opPreviewRoute">STAFF_CUTI</output></div>' +
    '</div><label style="display:flex;gap:8px;margin:12px 0"><input type="checkbox" id="opPreviewAttest"> Saya telah memeriksa identitas pemohon (simulasi).</label>' +
    '<button class="btn primary" type="button" id="opPreviewAdd">Tambahkan Usulan Simulasi</button> ' +
    '<button class="btn soft" type="button" id="opPreviewClear">Kosongkan Simulasi</button><p id="opPreviewMessage" role="status" aria-live="polite"></p></div>' +
    '<div class="card" style="padding:17px;margin-top:12px"><h3>Daftar Usulan dalam Sesi Uji</h3><p id="opPreviewCount">0 usulan</p>' +
    '<div style="overflow-x:auto"><table style="width:100%;text-align:left;border-collapse:collapse"><thead><tr><th>No.</th><th>Guru/KS</th><th>NPSN</th><th>Layanan</th><th>Tujuan</th><th>Status</th></tr></thead><tbody id="opPreviewRows"></tbody></table></div></div>';
  const section = document.querySelector('.section');
  (section?.parentElement || document.body).appendChild(root);
  function message(text, bad) { const e=$('opPreviewMessage');e.textContent=text;e.style.color=bad?'#b42318':'#196539'; }
  function scopeView() {
    const a=assignment();
    $('opPreviewScope').textContent = a.kind==='SMP'
      ? 'Operator SMP — khusus NPSN ' + a.npsn
      : 'Operator Korwil — khusus SD Negeri Kecamatan ' + a.district;
    $('opPreviewSchool').replaceChildren();
    for (const s of schools()) {
      const opt=document.createElement('option');opt.value=s.npsn;opt.textContent=s.name+' — '+s.npsn;
      $('opPreviewSchool').appendChild(opt);
    }
    routeView();
  }
  function routeView() {$('opPreviewRoute').textContent=ALLOWED[$('opPreviewService').value] || '-';}
  function render() {
    $('opPreviewCount').textContent=drafts.length+' usulan simulasi';
    $('opPreviewRows').innerHTML=drafts.map((x,i) =>
      '<tr><td>'+escape(i+1)+'</td><td>'+escape(x.name)+'</td><td>'+escape(x.npsn)+'</td><td>'+escape(x.service)+'</td><td>'+escape(x.route)+'</td><td>'+escape(STAGES[x.status])+'</td></tr>').join('');
  }
  function add() {
    const npsn=$('opPreviewSchool').value;
    const school=fakeSchools.find(s=>s.npsn===npsn);
    const name=$('opPreviewName').value.trim();
    const nip=$('opPreviewNip').value.trim();
    const service=$('opPreviewService').value;
    const job=$('opPreviewPosition').value;
    if (!school || !schoolAllowed(school,assignment())) return message('DITOLAK: sekolah di luar kewenangan.',true);
    if (!/^[0-9]{8,20}$/.test(nip) || name.length<3 || name.length>180) return message('Masukkan nama dan NIP contoh yang valid.',true);
    if (!['GURU','KEPALA_SEKOLAH'].includes(job) || !Object.hasOwn(ALLOWED,service)) return message('Layanan atau jabatan tidak dikenal.',true);
    if ($('opPreviewAttest').checked!==true) return message('Konfirmasi identitas pemohon belum dicentang.',true);
    if (drafts.some(x=>x.npsn===npsn&&x.nip===nip&&x.service===service)) return message('Usulan simulasi yang sama sudah terdaftar.',true);
    drafts.push({id:nextId++,name,nip,npsn,job,service,route:ALLOWED[service],status:'READY'});
    $('opPreviewName').value='';$('opPreviewNip').value='';$('opPreviewAttest').checked=false;
    render();message('Berhasil ditambahkan untuk simulasi. Tidak dikirim ke dinas.',false);
  }
  $('opPreviewService').addEventListener('change',routeView);
  $('opPreviewAdd').addEventListener('click',add);
  $('opPreviewClear').addEventListener('click',()=>{drafts=[];render();message('Data simulasi di memori telah dikosongkan.',false);});
  if (offline) $('opPreviewRole').addEventListener('change',e=>{kind=e.target.value;drafts=[];scopeView();render();message('Peran simulasi diganti.',false);});
  scopeView();render();
  const shellShow = window.showTab;
  if (typeof shellShow === 'function') {
    window.showTab = function(tab) {
      if (tab==='operatorMultiPreview') {
        document.querySelectorAll('.section').forEach(el=>el.classList.remove('active'));
        root.classList.add('active');root.style.display='block';return;
      }
      root.classList.remove('active');root.style.display='none';
      return shellShow.apply(this,arguments);
    };
    const nav=$('nav');
    if (nav) {
      const btn=document.createElement('button');btn.className='navbtn';btn.textContent='🧪 Multi-Usulan (QA)';
      btn.addEventListener('click',()=>window.showTab('operatorMultiPreview'));nav.appendChild(btn);
    }
  } else {
    root.style.display='block';root.classList.add('active');
  }
})();