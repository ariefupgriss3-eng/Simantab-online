/* SIMANTAB_KP_SOP_UI_V1 */
(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<120 && (!window.openSubmission || !window.showTab || !window.__simantabSb);i++) await sleep(50);
  if(!window.openSubmission || !window.__simantabSb) return;

  const sb=window.__simantabSb;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const stageLabels={PENGAJUAN:'Pengajuan GTK',VERIF_ADMIN:'Verifikasi Administrasi',VERIF_KELAYAKAN:'Verifikasi Kelayakan',PERBAIKAN:'Perbaikan / TMS',SIMPEG_OPD:'Usul melalui Simpeg OPD',BKPSDM:'Verifikasi BKPSDM',BKN:'Verifikasi BKN',PERTEK:'Pertimbangan Teknis',SK_TERBIT:'SK Kenaikan Pangkat Terbit',DISAMPAIKAN:'SK Disampaikan',DIARSIPKAN:'Pengarsipan / Selesai'};
  const stages=Object.keys(stageLabels);
  const statusBadge=s=>s==='MS'?'<span class="status st-COMPLETED">MS</span>':s==='TMS'?'<span class="status st-REVISION">TMS</span>':'<span class="status st-VERIFYING">PENDING</span>';
  const fmt=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
  const getProfile=()=>window.__simantabProfile||{};

  async function getRequirements(){
    const {data,error}=await sb.from('service_requirements').select('id,code,label,requirement_type,is_required,sort_order,description').eq('service_type','KP').eq('is_active',true).order('sort_order');
    if(error) throw error;
    return data||[];
  }

  function kpSteps(active='PENGAJUAN'){
    const idx=Math.max(0,stages.indexOf(active));
    return `<div style="display:flex;gap:7px;overflow:auto;padding:4px 0 12px">${stages.map((s,i)=>`<div style="min-width:132px;border:1px solid ${i<=idx?'#8eb9df':'#dfe7ef'};background:${i<idx?'#e9f7ef':i===idx?'#edf5ff':'#fff'};border-radius:12px;padding:9px"><div style="font-size:9px;font-weight:900;color:#66758a">${i+1}</div><div style="font-size:10px;font-weight:850">${esc(stageLabels[s])}</div></div>`).join('')}</div>`;
  }

  async function renderKpForm(){
    const section=document.getElementById('newSubmission');
    if(!section) return;
    section.innerHTML='<div class="card"><div class="small">Memuat persyaratan KP...</div></div>';
    try{
      const reqs=await getRequirements();
      const docs=reqs.filter(r=>r.requirement_type==='DOCUMENT');
      const profile=getProfile();
      section.innerHTML=`<div class="head"><div><h2>Usul Kenaikan Pangkat</h2><p>Form khusus sesuai SOP KP. Setiap dokumen maksimal 500 KB.</p></div><button class="btn soft" onclick="showTab('services')">← Kembali</button></div>
      <div class="card" style="margin-bottom:13px"><div class="info"><b>Alur:</b> Pengajuan → Verifikasi Administrasi → Verifikasi Kelayakan → Simpeg OPD → BKPSDM/BKN → Pertek → SK → Penyampaian → Arsip.</div>${kpSteps('PENGAJUAN')}</div>
      <div class="card" style="margin-bottom:13px"><h3 style="margin-top:0">A. Data Usulan</h3><div class="grid">
        <div class="field s4"><label>NIP</label><input id="kpNip" value="${esc(profile.nip||'')}" placeholder="NIP"></div>
        <div class="field s8"><label>Unit Kerja Pengusul *</label><input id="kpProposingUnit" value="${esc(profile.unit||'')}" placeholder="Nama sekolah/unit kerja pengusul"></div>
        <div class="field s6"><label>Jenis Usul</label><select id="kpProposalType"><option value="REGULER">KP Reguler</option><option value="BERSAMAAN_KENAIKAN_JENJANG">Bersamaan Kenaikan Jenjang</option></select></div>
        <div class="field s6"><label>TMT KP Terakhir</label><input id="kpLastPromotionDate" type="date"></div>
        <div class="field s6"><label>Pangkat/Golongan Terakhir</label><input id="kpLastRank" placeholder="Contoh: Penata Tk.I / III-d"></div>
        <div class="field s6"><label>Jabatan Terakhir</label><input id="kpLastPosition" value="${esc(profile.position||'')}" placeholder="Jabatan fungsional terakhir"></div>
        <div class="field s6"><label>Pangkat/Golongan yang Diusulkan</label><input id="kpProposedRank" placeholder="Pangkat/golongan tujuan"></div>
        <div class="field s6"><label>Jabatan yang Diusulkan</label><input id="kpProposedPosition" placeholder="Isi jika bersamaan kenaikan jenjang"></div>
        <div class="field s12"><label>Catatan/Keterangan Usul</label><textarea id="kpNotes" placeholder="Keterangan tambahan jika diperlukan"></textarea></div>
        <div class="field s6"><label><input id="kpCompetencyRequired" type="checkbox" onchange="document.getElementById('kpCompetencyPassedWrap').classList.toggle('hidden',!this.checked)"> Memerlukan Uji Kompetensi</label></div>
        <div id="kpCompetencyPassedWrap" class="field s6 hidden"><label><input id="kpCompetencyPassed" type="checkbox"> Sudah lulus Uji Kompetensi</label></div>
      </div></div>
      <div class="card" style="margin-bottom:13px"><h3 style="margin-top:0">B. Konfirmasi Persyaratan Sistem</h3>
        <label style="display:block;padding:8px 0"><input id="kpEligibility" type="checkbox"> Saya memastikan masa KP minimal 2 tahun dari KP terakhir atau telah terbit SK kenaikan jenjang sesuai ketentuan.</label>
        <label style="display:block;padding:8px 0"><input id="kpAkSync" type="checkbox"> Angka Kredit telah disinkronkan ke SIASN melalui E-Kinerja BKN.</label>
        <label style="display:block;padding:8px 0"><input id="kpSkpSync" type="checkbox"> SKP telah dikirim ke SIASN.</label>
      </div>
      <div class="card" style="margin-bottom:13px"><h3 style="margin-top:0">C. Unggah Dokumen KP</h3><div class="small" style="margin-bottom:8px">PDF/JPG/PNG maksimal 500 KB per dokumen. Dokumen bertanda * wajib.</div>
        ${docs.map(r=>`<div class="field"><label>${r.sort_order}. ${esc(r.label)} ${r.is_required?'<b style="color:#b42318">*</b>':'(opsional)'}</label><input class="kpReqFile" data-code="${esc(r.code)}" data-required="${r.is_required?'1':'0'}" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"><div class="small">${esc(r.description||'')}</div></div>`).join('')}
      </div>
      <div class="card"><button id="kpSendBtn" class="btn primary" onclick="submitKpSop()">📤 Kirim Usulan KP</button><div id="kpMsg"></div></div>`;
    }catch(e){section.innerHTML=`<div class="card err">Gagal memuat form KP: ${esc(e.message||e)}</div>`}
  }

  const oldOpen=window.openSubmission;
  window.openSubmission=async(type,title)=>{
    if(type!=='KP') return oldOpen(type,title);
    oldOpen(type,title);
    await renderKpForm();
  };

  window.submitKpSop=async()=>{
    const msg=document.getElementById('kpMsg'),btn=document.getElementById('kpSendBtn'),profile=getProfile();
    try{
      if(!profile.id) throw new Error('Profil login belum tersedia. Silakan masuk ulang.');
      const proposingUnit=document.getElementById('kpProposingUnit').value.trim();
      if(!proposingUnit) throw new Error('Unit Kerja Pengusul wajib diisi.');
      if(!document.getElementById('kpEligibility').checked) throw new Error('Konfirmasi syarat masa KP/kenaikan jenjang wajib dicentang.');
      if(!document.getElementById('kpAkSync').checked) throw new Error('Konfirmasi sinkron Angka Kredit SIASN wajib dicentang.');
      if(!document.getElementById('kpSkpSync').checked) throw new Error('Konfirmasi pengiriman SKP ke SIASN wajib dicentang.');
      const inputs=[...document.querySelectorAll('.kpReqFile')];
      for(const input of inputs){
        const f=input.files?.[0];
        if(input.dataset.required==='1'&&!f) throw new Error('Dokumen wajib belum lengkap. Periksa semua item bertanda *.');
        if(f && (f.size>512000||!['application/pdf','image/jpeg','image/png'].includes(f.type))) throw new Error(`${f.name}: ukuran harus ≤ 500 KB dan format PDF/JPG/PNG.`);
      }
      const proposalType=document.getElementById('kpProposalType').value;
      const compReq=document.getElementById('kpCompetencyRequired').checked;
      if(proposalType==='BERSAMAAN_KENAIKAN_JENJANG' && compReq && !document.getElementById('kpCompetencyPassed').checked) throw new Error('Usul memerlukan uji kompetensi tetapi status lulus belum dikonfirmasi.');
      btn.disabled=true; msg.className='small'; msg.textContent='Mengirim usulan dan dokumen KP...';
      const {data:sub,error:subErr}=await sb.from('submissions').insert({user_id:profile.id,service_type:'KP',title:'Usul Kenaikan Pangkat',description:document.getElementById('kpNotes').value.trim()}).select('*').single();
      if(subErr) throw subErr;
      const detail={proposal_type:proposalType,employee_nip:document.getElementById('kpNip').value.trim(),proposing_unit:proposingUnit,last_rank:document.getElementById('kpLastRank').value.trim(),last_position:document.getElementById('kpLastPosition').value.trim(),last_promotion_date:document.getElementById('kpLastPromotionDate').value||null,proposed_rank:document.getElementById('kpProposedRank').value.trim(),proposed_position:document.getElementById('kpProposedPosition').value.trim(),competency_test_required:compReq,competency_test_passed:compReq?document.getElementById('kpCompetencyPassed').checked:null,eligibility_declared:true,ak_siasn_declared:true,skp_siasn_declared:true,notes:document.getElementById('kpNotes').value.trim(),updated_by:profile.id,updated_at:new Date().toISOString()};
      const {error:detailErr}=await sb.from('kp_submission_details').update(detail).eq('submission_id',sub.id);
      if(detailErr) throw detailErr;
      for(const input of inputs){
        const f=input.files?.[0]; if(!f) continue;
        const safe=f.name.normalize('NFKD').replace(/[^\w.\-]+/g,'_').slice(-100);
        const path=`${profile.id}/${sub.id}/${crypto.randomUUID()}_${safe}`;
        const {error:upErr}=await sb.storage.from('simantab-documents').upload(path,f,{contentType:f.type,upsert:false}); if(upErr) throw upErr;
        const {error:metaErr}=await sb.from('submission_files').insert({submission_id:sub.id,user_id:profile.id,storage_path:path,file_name:f.name,file_size:f.size,mime_type:f.type,requirement_code:input.dataset.code}); if(metaErr) throw metaErr;
      }
      msg.className='okmsg'; msg.textContent='Usulan KP berhasil dikirim dan checklist dokumen telah terbentuk.';
      setTimeout(()=>window.showTab('status'),700);
    }catch(e){msg.className='err';msg.textContent=e.message||String(e)}finally{btn.disabled=false}
  };

  async function openSigned(path){const {data,error}=await sb.storage.from('simantab-documents').createSignedUrl(path,120);if(error)alert(error.message);else window.open(data.signedUrl,'_blank','noopener')}
  window.__openKpFile=async encoded=>openSigned(decodeURIComponent(encoded));

  async function fetchKpBundle(id){
    const [{data:sub,error:e1},{data:detail,error:e2},{data:checks,error:e3},{data:files,error:e4},{data:events,error:e5}]=await Promise.all([
      sb.from('submissions').select('*').eq('id',id).single(),
      sb.from('kp_submission_details').select('*').eq('submission_id',id).single(),
      sb.from('submission_requirement_checks').select('id,status,note,file_id,checked_at,requirement_id,service_requirements(code,label,requirement_type,is_required,sort_order)').eq('submission_id',id).order('requirement_id'),
      sb.from('submission_files').select('*').eq('submission_id',id).order('created_at'),
      sb.from('submission_events').select('*').eq('submission_id',id).order('created_at')
    ]);
    if(e1||e2||e3||e4||e5) throw (e1||e2||e3||e4||e5);
    return {sub,detail,checks:checks||[],files:files||[],events:events||[]};
  }

  function ensureModal(){
    let m=document.getElementById('kpProcessModal'); if(m) return m;
    m=document.createElement('div');m.id='kpProcessModal';m.className='sigmodal hidden';m.innerHTML='<div class="sigbox" style="width:min(1050px,100%);max-height:92vh;overflow:auto"><div id="kpProcessContent"></div></div>';document.body.appendChild(m);return m;
  }
  window.__closeKpProcess=()=>ensureModal().classList.add('hidden');

  window.__openKpProcess=async id=>{
    const m=ensureModal(),c=document.getElementById('kpProcessContent');m.classList.remove('hidden');c.innerHTML='<div class="small">Memuat proses KP...</div>';
    try{
      const b=await fetchKpBundle(id),d=b.detail,profile=getProfile(),isDinas=!['GTK','KEPALA_SEKOLAH'].includes(profile.role);
      const fileById=Object.fromEntries(b.files.map(f=>[f.id,f]));
      c.innerHTML=`<div class="head"><div><h2>Proses Kenaikan Pangkat</h2><p>${esc(b.sub.title)} • ${esc(d.employee_nip||'-')}</p></div><button class="btn soft" onclick="__closeKpProcess()">Tutup</button></div>
      <div class="card" style="margin-bottom:12px">${kpSteps(d.workflow_stage)}<div class="grid"><div class="s3"><b>Jenis:</b> ${esc(d.proposal_type)}</div><div class="s3"><b>Unit kerja:</b> ${esc(d.proposing_unit||'-')}</div><div class="s3"><b>Pangkat terakhir:</b> ${esc(d.last_rank||'-')}</div><div class="s3"><b>Usulan:</b> ${esc(d.proposed_rank||'-')}</div></div></div>
      <div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">Checklist Persyaratan</h3><div class="tablewrap"><table><thead><tr><th>No</th><th>Persyaratan</th><th>Berkas/Konfirmasi</th><th>Status</th><th>Catatan</th>${isDinas?'<th>Verifikasi</th>':''}</tr></thead><tbody>${b.checks.map((x,i)=>{const r=x.service_requirements||{},f=x.file_id?fileById[x.file_id]:null;let proof=f?`<button class="btn soft" onclick="__openKpFile('${encodeURIComponent(f.storage_path)}')">📎 ${esc(f.file_name)}</button>`:(r.code==='ELIGIBILITY_2Y_OR_JENJANG'?(d.eligibility_declared?'✅ Dikonfirmasi GTK':'❌ Belum'):(r.code==='SINKRON_AK_SIASN'?(d.ak_siasn_declared?'✅ Dikonfirmasi GTK':'❌ Belum'):(r.code==='KIRIM_SKP_SIASN'?(d.skp_siasn_declared?'✅ Dikonfirmasi GTK':'❌ Belum'):(r.is_required?'Belum ada berkas':'Opsional — tidak diunggah'))));return `<tr><td>${r.sort_order||i+1}</td><td>${esc(r.label||'')}</td><td>${proof}</td><td>${statusBadge(x.status)}</td><td>${esc(x.note||'-')}</td>${isDinas?`<td><select id="kpcheck-${x.id}" style="padding:6px;border:1px solid #dfe7ef;border-radius:8px"><option value="PENDING" ${x.status==='PENDING'?'selected':''}>Pending</option><option value="MS" ${x.status==='MS'?'selected':''}>MS</option><option value="TMS" ${x.status==='TMS'?'selected':''}>TMS</option></select><input id="kpnote-${x.id}" value="${esc(x.note||'')}" placeholder="Catatan" style="margin-top:5px;padding:6px;border:1px solid #dfe7ef;border-radius:8px;max-width:180px"><button class="btn soft" style="margin-top:5px" onclick="__saveKpCheck(${x.id})">Simpan</button></td>`:''}</tr>`}).join('')}</tbody></table></div></div>
      ${isDinas?`<div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">Tahap Proses</h3><div class="grid"><div class="field s6"><label>Tahap</label><select id="kpStage">${stages.map(s=>`<option value="${s}" ${s===d.workflow_stage?'selected':''}>${stageLabels[s]}</option>`).join('')}</select></div><div class="field s6"><label>Hasil Verifikasi Administrasi</label><select id="kpAdminResult"><option value="">-</option><option value="MS" ${d.admin_result==='MS'?'selected':''}>MS</option><option value="TMS" ${d.admin_result==='TMS'?'selected':''}>TMS</option></select></div><div class="field s6"><label>Hasil Kelayakan</label><select id="kpEligibilityResult"><option value="">-</option><option value="MS" ${d.eligibility_result==='MS'?'selected':''}>MS</option><option value="TMS" ${d.eligibility_result==='TMS'?'selected':''}>TMS</option></select></div><div class="field s6"><label>Catatan Proses</label><textarea id="kpProcessNotes">${esc(d.notes||'')}</textarea></div></div><button class="btn primary" onclick="__saveKpStage('${id}')">💾 Simpan Tahap</button></div>
      <div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">Referensi Simpeg / BKPSDM / BKN / SK</h3><div class="grid"><div class="field s6"><label>No. Usul Simpeg OPD</label><input id="kpSimpegNo" value="${esc(d.simpeg_proposal_no||'')}"></div><div class="field s6"><label>Tanggal Usul Simpeg</label><input id="kpSimpegDate" type="date" value="${esc(d.simpeg_proposal_date||'')}"></div><div class="field s6"><label>No. Usul BKPSDM</label><input id="kpBkpsdmNo" value="${esc(d.bkpsdm_proposal_no||'')}"></div><div class="field s6"><label>Tanggal Usul BKPSDM</label><input id="kpBkpsdmDate" type="date" value="${esc(d.bkpsdm_proposal_date||'')}"></div><div class="field s6"><label>Referensi BKN</label><input id="kpBknRef" value="${esc(d.bkn_reference||'')}"></div><div class="field s6"><label>No. Pertek</label><input id="kpPertekNo" value="${esc(d.pertek_no||'')}"></div><div class="field s6"><label>Tanggal Pertek</label><input id="kpPertekDate" type="date" value="${esc(d.pertek_date||'')}"></div><div class="field s6"><label>No. SK KP</label><input id="kpSkNo" value="${esc(d.sk_no||'')}"></div><div class="field s6"><label>Tanggal SK KP</label><input id="kpSkDate" type="date" value="${esc(d.sk_date||'')}"></div></div><button class="btn success" onclick="__saveKpRefs('${id}')">💾 Simpan Nomor/Tanggal</button></div>`:''}
      <div class="card"><h3 style="margin-top:0">Riwayat Proses</h3>${b.events.length?b.events.map(e=>`<div style="padding:8px 0;border-bottom:1px solid #dfe7ef"><b>${esc(e.status)}</b> <span class="small">${fmt(e.created_at)}</span><div class="small">${esc(e.note||'')}</div></div>`).join(''):'<div class="small">Belum ada riwayat.</div>'}</div>`;
    }catch(e){c.innerHTML=`<div class="err">${esc(e.message||e)}</div><button class="btn soft" onclick="__closeKpProcess()">Tutup</button>`}
  };

  window.__saveKpCheck=async checkId=>{const status=document.getElementById(`kpcheck-${checkId}`).value,note=document.getElementById(`kpnote-${checkId}`).value.trim(),p=getProfile();const {error}=await sb.from('submission_requirement_checks').update({status,note,checked_by:p.id,checked_at:status==='PENDING'?null:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',checkId);if(error)alert(error.message);else alert('Verifikasi persyaratan disimpan.')};
  window.__saveKpStage=async id=>{const p=getProfile(),payload={workflow_stage:document.getElementById('kpStage').value,admin_result:document.getElementById('kpAdminResult').value||null,eligibility_result:document.getElementById('kpEligibilityResult').value||null,notes:document.getElementById('kpProcessNotes').value.trim(),updated_by:p.id,updated_at:new Date().toISOString()};if(payload.workflow_stage==='DISAMPAIKAN')payload.delivered_at=new Date().toISOString();if(payload.workflow_stage==='DIARSIPKAN')payload.archived_at=new Date().toISOString();const {error}=await sb.from('kp_submission_details').update(payload).eq('submission_id',id);if(error)alert(error.message);else{alert('Tahap proses KP diperbarui.');await window.__openKpProcess(id)}};
  window.__saveKpRefs=async id=>{const p=getProfile(),payload={simpeg_proposal_no:document.getElementById('kpSimpegNo').value.trim(),simpeg_proposal_date:document.getElementById('kpSimpegDate').value||null,bkpsdm_proposal_no:document.getElementById('kpBkpsdmNo').value.trim(),bkpsdm_proposal_date:document.getElementById('kpBkpsdmDate').value||null,bkn_reference:document.getElementById('kpBknRef').value.trim(),pertek_no:document.getElementById('kpPertekNo').value.trim(),pertek_date:document.getElementById('kpPertekDate').value||null,sk_no:document.getElementById('kpSkNo').value.trim(),sk_date:document.getElementById('kpSkDate').value||null,updated_by:p.id,updated_at:new Date().toISOString()};const {error}=await sb.from('kp_submission_details').update(payload).eq('submission_id',id);if(error)alert(error.message);else alert('Nomor dan tanggal proses berhasil disimpan.')};

  async function appendMyKpPanel(){
    const target=document.getElementById('statusBody'); if(!target||document.getElementById('myKpPanel')) return;
    const {data,error}=await sb.from('submissions').select('id,title,status,submitted_at').eq('service_type','KP').order('submitted_at',{ascending:false}); if(error||!data?.length) return;
    const d=document.createElement('div');d.id='myKpPanel';d.className='card';d.style.marginBottom='12px';d.innerHTML=`<h3 style="margin-top:0">Proses Kenaikan Pangkat Saya</h3>${data.map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #dfe7ef"><div><b>${esc(x.title)}</b><div class="small">${fmt(x.submitted_at)} • ${esc(x.status)}</div></div><button class="btn soft" onclick="__openKpProcess('${x.id}')">Lihat Proses</button></div>`).join('')}`;target.prepend(d);
  }

  function addDinasButtons(){
    for(const rootId of ['monitoringBody','servicesBody']){
      const root=document.getElementById(rootId); if(!root) continue;
      root.querySelectorAll('tbody tr').forEach(tr=>{const tds=tr.querySelectorAll('td');if(tds.length<4||tds[1]?.textContent.trim()!=='KP'||tr.querySelector('.kp-process-btn'))return;const sel=tr.querySelector('select[onchange*="updateStatus"]');if(!sel)return;const m=(sel.getAttribute('onchange')||'').match(/updateStatus\('([^']+)'/);if(!m)return;const btn=document.createElement('button');btn.className='btn primary kp-process-btn';btn.style.marginTop='5px';btn.textContent='⚙ Proses KP';btn.onclick=()=>window.__openKpProcess(m[1]);sel.parentElement.appendChild(btn)})
    }
  }

  const oldShow=window.showTab;
  window.showTab=async id=>{const r=await oldShow(id);setTimeout(()=>{if(id==='status')appendMyKpPanel();if(id==='monitoring'||id==='services')addDinasButtons()},120);return r};
  const observer=new MutationObserver(()=>addDinasButtons());observer.observe(document.body,{subtree:true,childList:true});
})();
