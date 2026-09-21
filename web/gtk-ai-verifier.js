/* SIMANTAB_GTK_AI_VERIFIER_PILOT_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<240&&(!window.__simantabSb||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};
if(!sb)return;
const RUN_ROLES=new Set(['SUPER_ADMIN','KEPALA_DINAS','SEKRETARIS_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK','KEPALA_SEKOLAH']);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const levelOf=s=>{const x=String(s?.jenjang||s?.bentuk_pendidikan||'').toUpperCase();if(x.includes('SMP'))return'SMP';if(x.includes('SD'))return'SD';if(x.includes('TK')||x.includes('PAUD'))return'TK';return x};
const statusLabel=s=>({SESUAI:'Sesuai',PERLU_KOREKSI:'Perlu Koreksi',PERLU_REVIEW_MANUAL:'Perlu Review Manual'})[s]||s||'-';
const statusClass=s=>s==='SESUAI'?'ok':s==='PERLU_KOREKSI'?'bad':'warn';
function style(){
 if($('gtkAiVerifierStyle'))return;
 const st=document.createElement('style');st.id='gtkAiVerifierStyle';st.textContent=`
 .gtk-ai-panel{background:linear-gradient(135deg,#f3f8ff,#fff);border:1px solid #bfd7ee;border-radius:15px;padding:14px;margin-top:10px;box-shadow:0 6px 18px rgba(10,53,104,.06)}
 .gtk-ai-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}.gtk-ai-head h3{margin:0;color:#0a3568}.gtk-ai-sub{font-size:10px;color:#647a8e;line-height:1.45;margin-top:4px}
 .gtk-ai-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}.gtk-ai-tools select,.gtk-ai-tools input{min-width:220px;max-width:100%;padding:9px 10px;border:1px solid #cddcea;border-radius:9px;background:#fff}
 .gtk-ai-btn{border:0;border-radius:9px;padding:9px 12px;font-weight:850;font-size:10px;cursor:pointer;background:#0a3568;color:#fff}.gtk-ai-btn.soft{background:#eaf3fb;color:#0a3568}
 .gtk-ai-badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:9px;font-weight:900}.gtk-ai-badge.ok{background:#e8f7ee;color:#16784d}.gtk-ai-badge.bad{background:#ffefec;color:#b42318}.gtk-ai-badge.warn{background:#fff4dd;color:#9a5d00}
 .gtk-ai-result{margin-top:12px}.gtk-ai-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.gtk-ai-metric{background:#fff;border:1px solid #dfe9f2;border-radius:11px;padding:10px}.gtk-ai-metric b{display:block;font-size:18px;color:#0a3568}.gtk-ai-metric span{font-size:9px;color:#71869a;font-weight:800}
 .gtk-ai-table{overflow:auto;border:1px solid #e0e8ef;border-radius:11px}.gtk-ai-table table{width:100%;border-collapse:collapse;font-size:10px}.gtk-ai-table th,.gtk-ai-table td{padding:8px;border-bottom:1px solid #edf2f6;text-align:left;vertical-align:top}.gtk-ai-table th{background:#f8fafc;color:#6d8195;white-space:nowrap}
 .gtk-ai-jp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px}.gtk-ai-jp-row{display:grid;grid-template-columns:1fr 86px;gap:8px;align-items:center;background:#fff;border:1px solid #e0e8ef;border-radius:10px;padding:9px}.gtk-ai-jp-row input{width:100%;padding:7px;border:1px solid #ccd9e5;border-radius:8px;text-align:center}
 .gtk-ai-history{margin-top:12px}.gtk-ai-history-item{padding:8px 9px;border:1px solid #e2eaf1;border-radius:10px;background:#fff;margin-top:6px;font-size:10px}
 @media(max-width:760px){.gtk-ai-summary{grid-template-columns:1fr 1fr}.gtk-ai-jp-grid{grid-template-columns:1fr}.gtk-ai-tools select,.gtk-ai-tools input{width:100%;min-width:0}}
 `;document.head.appendChild(st);
}
function resultHtml(r){
 if(!r)return'<div class="gtk-ai-sub">Belum ada hasil pemeriksaan.</div>';
 const data=r.result||{},rows=Array.isArray(data.rows)?data.rows:[];
 return `<div class="gtk-ai-result"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="gtk-ai-badge ${statusClass(r.result_status)}">${esc(statusLabel(r.result_status))}</span><b>${esc(r.school_name||data.school?.name||'-')}</b><span class="gtk-ai-sub">• ${esc(r.school_level||data.school?.level||'-')} • ${Number(r.rombel||data.school?.rombel||0)} rombel • ${esc(r.engine_version||'GTK_ABK_RULES_V1')}</span></div>
 <div class="gtk-ai-summary"><div class="gtk-ai-metric"><b>${Number(r.checked_rows||0)}</b><span>DIPERIKSA</span></div><div class="gtk-ai-metric"><b>${Number(r.match_count||0)}</b><span>SESUAI</span></div><div class="gtk-ai-metric"><b>${Number(r.mismatch_count||0)}</b><span>PERLU KOREKSI</span></div><div class="gtk-ai-metric"><b>${Number(r.manual_review_count||0)}</b><span>REVIEW MANUAL</span></div></div>
 <div class="gtk-ai-table"><table><thead><tr><th>Jabatan/Mapel</th><th>ABK Input</th><th>ABK Pedoman</th><th>JP/Minggu</th><th>Rumus</th><th>Hasil</th><th>Catatan</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.position_name||x.code||'-')}</b><div class="gtk-ai-sub">${esc(x.code||'')}</div></td><td>${x.input_abk??'-'}</td><td><b>${x.expected_abk??'-'}</b></td><td>${x.weekly_jp??'-'}</td><td>${esc(x.formula||'-')}</td><td><span class="gtk-ai-badge ${statusClass(x.status)}">${esc(statusLabel(x.status))}</span></td><td>${esc(x.note||'-')}</td></tr>`).join('')||'<tr><td colspan="7">Tidak ada rincian.</td></tr>'}</tbody></table></div>
 <div class="gtk-ai-sub" style="margin-top:8px"><b>Pilot:</b> pemeriksaan berbasis aturan yang deterministik dan dapat diaudit. AI tidak mengubah ABK dan tidak melakukan persetujuan otomatis. ${esc(data.rounding||'')}</div></div>`;
}
async function historyHtml(npsn){
 const {data,error}=await sb.from('gtk_needs_ai_verifications').select('id,result_status,engine_version,run_by_name,run_by_role,created_at,match_count,mismatch_count,manual_review_count').eq('school_npsn',npsn).order('created_at',{ascending:false}).limit(5);
 if(error)return `<div class="gtk-ai-sub">Riwayat belum dapat dimuat: ${esc(error.message)}</div>`;
 return `<div class="gtk-ai-history"><b style="font-size:11px;color:#0a3568">Riwayat AI Verifikator</b>${(data||[]).map(x=>`<div class="gtk-ai-history-item"><span class="gtk-ai-badge ${statusClass(x.result_status)}">${esc(statusLabel(x.result_status))}</span> <b>${esc(x.run_by_name||'SIMANTAB')}</b> • ${esc(x.run_by_role||'-')}<br><span class="gtk-ai-sub">${new Date(x.created_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})} • sesuai ${x.match_count} • koreksi ${x.mismatch_count} • manual ${x.manual_review_count}</span></div>`).join('')||'<div class="gtk-ai-sub">Belum ada record AI.</div>'}</div>`;
}
async function runVerify(npsn,container){
 if(!npsn)return;
 container.innerHTML='<div class="gtk-ai-sub">AI Verifikator sedang menghitung ABK sesuai pedoman…</div>';
 const {data,error}=await sb.rpc('gtk_needs_ai_verify',{p_school_npsn:npsn});
 if(error){container.innerHTML=`<div class="sim-needs-warn"><b>AI Verifikator gagal.</b><br>${esc(error.message)}</div>`;return}
 const row=Array.isArray(data)?data[0]:data;
 container.innerHTML=resultHtml(row)+await historyHtml(npsn);
}
async function ownSchoolPanel(root){
 const npsn=String(p().school_npsn||'').trim();if(!npsn)return;
 const [{data:school,error:se},{data:needs,error:ne}]=await Promise.all([
  sb.from('school_master').select('npsn,school_name,jenjang,bentuk_pendidikan,rombel,school_status').eq('npsn',npsn).maybeSingle(),
  sb.from('school_gtk_needs').select('id,job_code,position_name,weekly_jp').eq('school_npsn',npsn).order('position_name')
 ]);
 if(se||ne||!school)return;
 const level=levelOf(school),panel=document.createElement('div');panel.id='gtkAiVerifierPanel';panel.className='gtk-ai-panel';
 const guru=(needs||[]).filter(x=>String(x.job_code||'').toUpperCase().startsWith('GURU_')&&String(x.job_code||'').toUpperCase()!=='GURU_KODING_KA');
 const jp=level==='SMP'?`<div style="margin-top:12px"><b style="color:#0a3568;font-size:11px">Parameter SMP — JP per Minggu per Mapel</b><div class="gtk-ai-sub">Isi JP per minggu untuk setiap mapel. Rumus AI: ceil(JP/minggu × rombel / 24).</div><div class="gtk-ai-jp-grid">${guru.map(x=>`<label class="gtk-ai-jp-row"><span><b>${esc(x.position_name)}</b><span class="gtk-ai-sub" style="display:block">${esc(x.job_code)}</span></span><input type="number" min="0" step="1" data-jp-id="${esc(x.id)}" value="${x.weekly_jp??''}" placeholder="JP"></label>`).join('')||'<div class="gtk-ai-sub">Simpan dulu baris guru/mapel pada Kebutuhan GTK Riil.</div>'}</div><button class="gtk-ai-btn soft" id="gtkAiSaveJp" style="margin-top:8px">💾 Simpan JP/Minggu</button><div id="gtkAiJpMsg" class="gtk-ai-sub"></div></div>`:'';
 panel.innerHTML=`<div class="gtk-ai-head"><div><h3>🤖 AI Verifikator Kebutuhan GTK Riil — Pilot</h3><div class="gtk-ai-sub">${esc(school.school_name)} • ${esc(level)} • ${Number(school.rombel||0)} rombel. Cek ABK sebelum/ sesudah diajukan tanpa mengubah data.</div></div><span class="gtk-ai-badge warn">RULE-BASED PILOT</span></div>${jp}<div class="gtk-ai-tools"><button class="gtk-ai-btn" id="gtkAiRunOwn">🤖 Jalankan AI Verifikator</button></div><div id="gtkAiResultOwn"></div>`;
 const scope=root.querySelector('.sim-needs-scope');scope?.insertAdjacentElement('afterend',panel)||root.prepend(panel);
 if(level==='SMP'&&$('gtkAiSaveJp'))$('gtkAiSaveJp').onclick=async()=>{
  const msg=$('gtkAiJpMsg');msg.textContent='Menyimpan JP/minggu…';
  const inputs=[...panel.querySelectorAll('[data-jp-id]')];
  for(const input of inputs){
   const raw=String(input.value||'').trim(),val=raw===''?null:Math.max(0,parseInt(raw,10)||0);
   const {error}=await sb.from('school_gtk_needs').update({weekly_jp:val,updated_at:new Date().toISOString()}).eq('id',input.dataset.jpId);
   if(error){msg.textContent=error.message;return}
  }
  msg.textContent='JP/minggu berhasil disimpan.';
 };
 $('gtkAiRunOwn').onclick=()=>runVerify(npsn,$('gtkAiResultOwn'));
 const {data:last}=await sb.from('gtk_needs_ai_verifications').select('*').eq('school_npsn',npsn).order('created_at',{ascending:false}).limit(1);
 if(last?.length)$('gtkAiResultOwn').innerHTML=resultHtml(last[0])+await historyHtml(npsn);
}
async function dinasPanel(root){
 const role=String(p().role||'');if(role==='KEPALA_SEKOLAH')return;
 let q=sb.from('school_master').select('npsn,school_name,jenjang,bentuk_pendidikan,kecamatan,rombel').eq('is_active',true).eq('school_status','NEGERI').order('school_name');
 const {data,error}=await q;if(error)return;
 let schools=data||[];
 if(role==='KASI_SD')schools=schools.filter(x=>levelOf(x)==='SD');
 if(role==='KASI_SMP')schools=schools.filter(x=>levelOf(x)==='SMP');
 if(role==='SUBKOOR_TK')schools=schools.filter(x=>levelOf(x)==='TK');
 const panel=document.createElement('div');panel.id='gtkAiVerifierPanel';panel.className='gtk-ai-panel';
 panel.innerHTML=`<div class="gtk-ai-head"><div><h3>🤖 AI Verifikator Kebutuhan GTK Riil — Pilot</h3><div class="gtk-ai-sub">Pilih sekolah untuk memeriksa ABK berdasarkan pedoman TK, SD, dan SMP. Hasil tersimpan sebagai record audit; keputusan verifikasi Dinas tetap manual.</div></div><span class="gtk-ai-badge warn">RULE-BASED PILOT</span></div><div class="gtk-ai-tools"><select id="gtkAiSchoolSelect"><option value="">— Pilih sekolah —</option>${schools.map(s=>`<option value="${esc(s.npsn)}">${esc(s.school_name)} • ${esc(levelOf(s))} • ${Number(s.rombel||0)} rombel • ${esc(s.npsn)}</option>`).join('')}</select><button class="gtk-ai-btn" id="gtkAiRunDinas">🤖 Periksa ABK</button><button class="gtk-ai-btn soft" id="gtkAiLoadHistory">Riwayat</button></div><div id="gtkAiResultDinas"></div>`;
 const scope=root.querySelector('.sim-needs-scope');scope?.insertAdjacentElement('afterend',panel)||root.prepend(panel);
 $('gtkAiRunDinas').onclick=()=>runVerify($('gtkAiSchoolSelect').value,$('gtkAiResultDinas'));
 $('gtkAiLoadHistory').onclick=async()=>{const npsn=$('gtkAiSchoolSelect').value;if(!npsn)return;$('gtkAiResultDinas').innerHTML=await historyHtml(npsn)};
}
let installing=false;
async function install(){
 if(installing||!RUN_ROLES.has(String(p().role||'')))return;
 const root=$('simGtkNeedsProgress');if(!root||$('gtkAiVerifierPanel'))return;
 installing=true;style();
 try{if(String(p().role||'')==='KEPALA_SEKOLAH')await ownSchoolPanel(root);else await dinasPanel(root)}finally{installing=false}
}
const observer=new MutationObserver(()=>{if($('needs')?.classList.contains('active'))setTimeout(install,80)});
observer.observe(document.body,{childList:true,subtree:true});
const oldShow=window.showTab;
if(typeof oldShow==='function')window.showTab=async function(id){const r=await oldShow.apply(this,arguments);if(id==='needs')setTimeout(install,120);return r};
if($('needs')?.classList.contains('active'))setTimeout(install,160);
window.__simantabGtkAiVerifier={version:1,engine:'GTK_ABK_RULES_V1',mode:'RULE_BASED_PILOT',run:runVerify};
})();