/* SIMANTAB_JABFUNG_JENJANG_UI_V1 */
(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<120 && (!window.openSubmission || !window.showTab || !window.__simantabSb);i++) await sleep(50);
  if(!window.openSubmission || !window.__simantabSb) return;

  const sb=window.__simantabSb;
  const MAX_FILE=1572864; // 1.5 MiB
  const ALLOWED=['application/pdf','image/jpeg','image/png'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const getProfile=()=>window.__simantabProfile||{};

  async function getRequirements(){
    const {data,error}=await sb.from('service_requirements')
      .select('id,code,label,requirement_type,is_required,sort_order,description')
      .eq('service_type','E_JABFUNG').eq('is_active',true).order('sort_order');
    if(error) throw error;
    return data||[];
  }

  async function renderForm(){
    const section=document.getElementById('newSubmission');
    if(!section) return;
    section.innerHTML='<div class="card"><div class="small">Memuat persyaratan Jabfung...</div></div>';
    try{
      const reqs=await getRequirements();
      const docs=reqs.filter(r=>r.requirement_type==='DOCUMENT');
      section.innerHTML=`<div class="head"><div><h2>Usul SK Kenaikan Jenjang Jabatan (Jabfung)</h2><p>Unggah setiap berkas pada item yang sesuai. Maksimal 1,5 MB per file.</p></div><button class="btn soft" onclick="showTab('services')">← Kembali</button></div>
      <div class="card" style="margin-bottom:13px"><div class="info"><b>Ketentuan unggah:</b> PDF/JPG/PNG, maksimal 1,5 MB per file. Berkas bertanda * wajib diunggah sebelum usulan dikirim.</div></div>
      <div class="card" style="margin-bottom:13px"><h3 style="margin-top:0">Berkas Usul Kenaikan Jenjang Jabfung</h3>
        ${docs.map(r=>`<div class="field"><label>${r.sort_order}. ${esc(r.label)} ${r.is_required?'<b style="color:#b42318">*</b>':'<span class="small">(bila ada/opsional)</span>'}</label><input class="jabfungReqFile" data-code="${esc(r.code)}" data-required="${r.is_required?'1':'0'}" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"><div class="small">${esc(r.description||'')}</div></div>`).join('')}
      </div>
      <div class="card" style="margin-bottom:13px"><div class="field"><label>Catatan/Keterangan Usul</label><textarea id="jabfungNotes" placeholder="Keterangan tambahan bila diperlukan"></textarea></div></div>
      <div class="card"><button id="jabfungSendBtn" class="btn primary" onclick="submitJabfungJenjang()">📤 Kirim Usul Jabfung</button><div id="jabfungMsg" class="small" style="margin-top:8px"></div></div>`;
    }catch(e){
      section.innerHTML=`<div class="card err">Gagal memuat form Jabfung: ${esc(e.message||e)}</div>`;
    }
  }

  const oldOpen=window.openSubmission;
  window.openSubmission=async(type,title)=>{
    if(type!=='E_JABFUNG') return oldOpen(type,title);
    oldOpen(type,title);
    await renderForm();
  };

  window.submitJabfungJenjang=async()=>{
    const msg=document.getElementById('jabfungMsg');
    const btn=document.getElementById('jabfungSendBtn');
    try{
      const profile=getProfile();
      if(!profile.id) throw new Error('Profil login belum tersedia. Silakan masuk ulang.');
      const inputs=[...document.querySelectorAll('.jabfungReqFile')];
      if(!inputs.length) throw new Error('Daftar persyaratan Jabfung belum tersedia.');
      for(const input of inputs){
        const f=input.files?.[0];
        if(input.dataset.required==='1'&&!f) throw new Error('Berkas wajib belum lengkap. Periksa semua item bertanda *.');
        if(f && (f.size>MAX_FILE || !ALLOWED.includes(f.type))) throw new Error(`${f.name}: ukuran harus ≤ 1,5 MB dan format PDF/JPG/PNG.`);
      }

      btn.disabled=true;
      msg.className='small';
      msg.textContent='Mengirim usulan dan dokumen Jabfung...';

      const notes=document.getElementById('jabfungNotes')?.value.trim()||'';
      const {data:sub,error:subErr}=await sb.from('submissions').insert({
        user_id:profile.id,
        service_type:'E_JABFUNG',
        title:'Usul SK Kenaikan Jenjang Jabatan (Jabfung)',
        description:notes
      }).select('*').single();
      if(subErr) throw subErr;

      for(const input of inputs){
        const f=input.files?.[0];
        if(!f) continue;
        const safe=f.name.normalize('NFKD').replace(/[^\w.\-]+/g,'_').slice(-100);
        const path=`${profile.id}/${sub.id}/jabfung/${crypto.randomUUID()}_${safe}`;
        const {error:upErr}=await sb.storage.from('simantab-documents').upload(path,f,{contentType:f.type,upsert:false});
        if(upErr) throw upErr;
        const {error:metaErr}=await sb.from('submission_files').insert({
          submission_id:sub.id,
          user_id:profile.id,
          storage_path:path,
          file_name:f.name,
          file_size:f.size,
          mime_type:f.type,
          requirement_code:input.dataset.code
        });
        if(metaErr) throw metaErr;
      }

      msg.className='okmsg';
      msg.textContent='Usul kenaikan jenjang Jabfung berhasil dikirim.';
      setTimeout(()=>window.showTab('status'),700);
    }catch(e){
      if(msg){msg.className='err';msg.textContent=e.message||String(e)}
    }finally{
      if(btn) btn.disabled=false;
    }
  };
})();