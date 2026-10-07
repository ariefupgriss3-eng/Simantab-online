/* SIMANTAB_JABFUNG_JENJANG_UI_V1 */
/* SIMANTAB_JABFUNG_AI_VERIFIER_V2 */
(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<120 && (!window.openSubmission || !window.showTab || !window.__simantabSb);i++) await sleep(50);
  if(!window.openSubmission || !window.__simantabSb) return;

  const sb=window.__simantabSb;
  const MAX_FILE=1572864; // 1.5 MiB
  const ALLOWED=['application/pdf','image/jpeg','image/png'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const getProfile=()=>window.__simantabProfile||{};
  const fmt=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';

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
      <div class="card" style="margin-bottom:13px"><div class="info"><b>AI Verifikator aktif.</b> Setelah berkas dikirim, AI meneliti kesesuaian isi, keterbacaan/blur, serta indikator visual stempel, tanda tangan, TTE atau QR. <b>AI tidak menetapkan dokumen asli/palsu</b>; keabsahan final tetap ditetapkan petugas melalui dokumen sumber atau verifikasi resmi.</div></div>
      <div class="card" style="margin-bottom:13px"><div class="info"><b>Ketentuan unggah:</b> PDF/JPG/PNG, maksimal 1,5 MB per file. Berkas bertanda * wajib diunggah sebelum usulan dikirim.</div></div>
      <div class="card" style="margin-bottom:13px"><h3 style="margin-top:0">Berkas Usul Kenaikan Jenjang Jabfung</h3>
        ${docs.map(r=>`<div class="field"><label>${r.sort_order}. ${esc(r.label)} ${r.is_required?'<b style="color:#b42318">*</b>':'<span class="small">(bila ada/opsional)</span>'}</label><input class="jabfungReqFile" data-code="${esc(r.code)}" data-required="${r.is_required?'1':'0'}" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"><div class="small">${esc(r.description||'')}</div></div>`).join('')}
      </div>
      <div class="card" style="margin-bottom:13px"><div class="field"><label>Catatan/Keterangan Usul</label><textarea id="jabfungNotes" placeholder="Keterangan tambahan bila diperlukan"></textarea></div></div>
      <div class="card"><button id="jabfungSendBtn" class="btn primary" onclick="submitJabfungJenjang()">📤 Kirim Usul & Jalankan AI Verifikator</button><div id="jabfungMsg" class="small" style="margin-top:8px"></div></div>`;
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

  async function runAi(submissionId){
    const {data,error}=await sb.functions.invoke('simantab-jabfung-ai-workflow',{body:{submission_id:submissionId}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }

  window.submitJabfungJenjang=async()=>{
    const msg=document.getElementById('jabfungMsg');
    const btn=document.getElementById('jabfungSendBtn');
    let createdSub=null;
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
      createdSub=sub;

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

      msg.className='small';
      msg.textContent='Berkas berhasil dikirim. AI Verifikator sedang meneliti kesesuaian, keterbacaan, serta indikator stempel/tanda tangan...';
      try{
        const ai=await runAi(sub.id);
        const c=ai?.counts||{};
        msg.className=ai?.overall_status==='SESUAI'?'okmsg':'small';
        msg.textContent=ai?.overall_status==='SESUAI'
          ?`Usul terkirim. AI: ${c.sesuai||0} berkas sesuai. Keabsahan final tetap diverifikasi petugas.`
          :`Usul terkirim. AI menemukan item yang perlu ditelaah: perbaikan ${c.perbaikan||0}, tidak sesuai ${c.tidak||0}, telaah manual ${c.telaah||0}. Status resmi belum diputuskan AI.`;
      }catch(aiErr){
        msg.className='small';
        msg.textContent='Usul berhasil dikirim. AI Verifikator mengalami kendala teknis; usulan tetap tersimpan dan AI dapat dijalankan ulang oleh petugas.';
        console.error('JABFUNG_AI_CLIENT_ERROR',aiErr);
      }
      setTimeout(()=>window.showTab('status'),1800);
    }catch(e){
      if(msg){
        msg.className='err';
        msg.textContent=(createdSub?'Usulan sudah terbentuk, tetapi terjadi kendala saat unggah: ':'')+(e.message||String(e));
      }
    }finally{
      if(btn) btn.disabled=false;
    }
  };

  function ensureAiModal(){
    let m=document.getElementById('jabfungAiModal');
    if(m)return m;
    m=document.createElement('div');
    m.id='jabfungAiModal';
    m.className='hidden';
    m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(15,35,60,.55);padding:20px;overflow:auto';
    m.innerHTML='<div style="max-width:1120px;margin:20px auto;background:#fff;border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.25)"><div id="jabfungAiContent"></div></div>';
    document.body.appendChild(m);
    return m;
  }
  window.__closeJabfungAi=()=>ensureAiModal().classList.add('hidden');

  function badge(status){
    const map={
      SESUAI:['#e9f7ef','#0f7249'],
      PERLU_PERBAIKAN:['#fff3dd','#955a00'],
      TIDAK_SESUAI:['#feeceb','#9f1c13'],
      PERLU_TELAAH:['#edf5ff','#175ea7'],
      TIDAK_DIUNGGAH_OPSIONAL:['#f3f4f6','#667085']
    };
    const [bg,fg]=map[status]||['#f3f4f6','#475467'];
    return `<span style="display:inline-block;padding:4px 7px;border-radius:999px;background:${bg};color:${fg};font-size:10px;font-weight:900">${esc(status||'-')}</span>`;
  }

  function authBadge(v){
    const map={
      WAJAR:['#e9f7ef','#0f7249','Wajar'],
      PERLU_TELAAH:['#fff3dd','#955a00','Perlu telaah'],
      TIDAK_DAPAT_DIPASTIKAN:['#f3f4f6','#667085','Tidak dapat dipastikan']
    };
    const x=map[v]||map.TIDAK_DAPAT_DIPASTIKAN;
    return `<span style="display:inline-block;padding:4px 7px;border-radius:999px;background:${x[0]};color:${x[1]};font-size:10px;font-weight:850">${x[2]}</span>`;
  }

  window.__runJabfungAiFromModal=async id=>{
    const c=document.getElementById('jabfungAiContent');
    if(c)c.innerHTML='<div class="small">AI Verifikator sedang memeriksa dokumen. Mohon tunggu...</div>';
    try{await runAi(id);await window.__openJabfungAiResult(id)}
    catch(e){if(c)c.innerHTML=`<div class="err">${esc(e.message||e)}</div><button class="btn soft" onclick="__closeJabfungAi()">Tutup</button>`}
  };

  window.__openJabfungAiResult=async id=>{
    const m=ensureAiModal(),c=document.getElementById('jabfungAiContent');
    m.classList.remove('hidden');
    c.innerHTML='<div class="small">Memuat hasil AI Verifikator...</div>';
    try{
      const {data:run,error:re}=await sb.from('jabfung_ai_verification_runs').select('*').eq('submission_id',id).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(re)throw re;
      if(!run){
        c.innerHTML=`<div class="head"><div><h2>AI Verifikator Jabfung</h2><p>Belum ada hasil pemeriksaan AI.</p></div><button class="btn soft" onclick="__closeJabfungAi()">Tutup</button></div><div class="card"><button class="btn primary" onclick="__runJabfungAiFromModal('${id}')">🤖 Jalankan AI Verifikator</button></div>`;
        return;
      }
      const [{data:docs,error:de},reqs]=await Promise.all([
        sb.from('jabfung_ai_document_verifications').select('*').eq('run_id',run.id).order('checked_at'),
        getRequirements()
      ]);
      if(de)throw de;
      const order=Object.fromEntries(reqs.map(r=>[r.code,r.sort_order]));
      const rows=(docs||[]).sort((a,b)=>(order[a.requirement_code]||99)-(order[b.requirement_code]||99));
      c.innerHTML=`<div class="head"><div><h2>AI Verifikator Jabfung</h2><p>Pemeriksaan terakhir ${fmt(run.completed_at||run.created_at)} • Hasil AI bersifat rekomendasi.</p></div><button class="btn soft" onclick="__closeJabfungAi()">Tutup</button></div>
      <div class="grid" style="margin-bottom:12px">
        <div class="card s3"><div class="label">Sesuai</div><div class="metric">${run.sesuai_count||0}</div></div>
        <div class="card s3"><div class="label">Perlu Perbaikan</div><div class="metric">${run.perbaikan_count||0}</div></div>
        <div class="card s3"><div class="label">Tidak Sesuai</div><div class="metric">${run.tidak_sesuai_count||0}</div></div>
        <div class="card s3"><div class="label">Telaah Manual</div><div class="metric">${run.telaah_count||0}</div></div>
      </div>
      <div class="card" style="margin-bottom:12px"><div class="notice"><b>Batas AI:</b> AI tidak dapat membuktikan stempel/tanda tangan asli atau palsu. Kolom autentisitas hanya menunjukkan kewajaran/anomali visual. Verifikator manusia tetap memeriksa dokumen sumber, TTE/QR, nomor dokumen, dan instansi penerbit.</div></div>
      <div class="card" style="margin-bottom:12px"><div class="tablewrap"><table><thead><tr><th>No</th><th>Berkas</th><th>Hasil AI</th><th>Keterbacaan</th><th>Stempel / TTD</th><th>Indikator autentisitas</th><th>Catatan AI</th></tr></thead><tbody>
      ${rows.map(x=>`<tr><td>${order[x.requirement_code]||'-'}</td><td><b>${esc(x.expected_label)}</b></td><td>${badge(x.status)}</td><td>${esc(x.readability_status||'-')} ${x.readability_score!=null?`<div class="small">${Math.round(Number(x.readability_score)*100)}%</div>`:''}</td><td>Stempel: ${x.stamp_present===true?'Ada':x.stamp_present===false?'Tidak tampak':'-'}<br>TTD/TTE: ${x.signature_present===true?'Ada':x.signature_present===false?'Tidak tampak':'-'}</td><td>${authBadge(x.authenticity_indicator)}<div class="small" style="margin-top:5px">${esc(x.authenticity_note||'')}</div></td><td>${esc(x.note||'-')}<div class="small" style="margin-top:5px">${esc(x.evidence||'')}</div></td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="card"><button class="btn primary" onclick="__runJabfungAiFromModal('${id}')">🔄 Verifikasi Ulang dengan AI</button></div>`;
    }catch(e){
      c.innerHTML=`<div class="err">${esc(e.message||e)}</div><button class="btn soft" onclick="__closeJabfungAi()">Tutup</button>`;
    }
  };

  async function appendMyJabfungPanel(){
    const target=document.getElementById('statusBody');
    if(!target||document.getElementById('myJabfungAiPanel'))return;
    const {data,error}=await sb.from('submissions').select('id,title,status,submitted_at').eq('service_type','E_JABFUNG').order('submitted_at',{ascending:false});
    if(error||!data?.length)return;
    const d=document.createElement('div');
    d.id='myJabfungAiPanel';
    d.className='card';
    d.style.marginBottom='12px';
    d.innerHTML=`<h3 style="margin-top:0">🤖 AI Verifikator Jabfung</h3><div class="small" style="margin-bottom:8px">Lihat hasil kesesuaian, keterbacaan, dan indikator visual stempel/tanda tangan. Keputusan final tetap oleh petugas.</div>${data.map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #dfe7ef"><div><b>${esc(x.title)}</b><div class="small">${fmt(x.submitted_at)} • ${esc(x.status)}</div></div><button class="btn soft" onclick="__openJabfungAiResult('${x.id}')">Lihat Hasil AI</button></div>`).join('')}`;
    target.prepend(d);
  }

  function addDinasButtons(){
    for(const rootId of ['monitoringBody','servicesBody']){
      const root=document.getElementById(rootId);
      if(!root)continue;
      root.querySelectorAll('tbody tr').forEach(tr=>{
        const tds=tr.querySelectorAll('td');
        if(tds.length<4||tds[1]?.textContent.trim()!=='E_JABFUNG'||tr.querySelector('.jabfung-ai-btn'))return;
        const sel=tr.querySelector('select[onchange*="updateStatus"]');
        if(!sel)return;
        const m=(sel.getAttribute('onchange')||'').match(/updateStatus\('([^']+)'/);
        if(!m)return;
        const btn=document.createElement('button');
        btn.className='btn soft jabfung-ai-btn';
        btn.style.marginTop='5px';
        btn.textContent='🤖 Hasil AI';
        btn.onclick=()=>window.__openJabfungAiResult(m[1]);
        sel.parentElement.appendChild(btn);
      });
    }
  }

  const oldShow=window.showTab;
  window.showTab=async id=>{
    const r=await oldShow(id);
    setTimeout(()=>{
      if(id==='status')appendMyJabfungPanel();
      if(id==='monitoring'||id==='services')addDinasButtons();
    },150);
    return r;
  };
  new MutationObserver(()=>addDinasButtons()).observe(document.body,{subtree:true,childList:true});
})();