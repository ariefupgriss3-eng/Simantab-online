import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='gtk-needs-progress.js';
const modulePath=new URL(`./${moduleName}`,import.meta.url);
let html=await fs.readFile(outputPath,'utf8');
let code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_GTK_NEEDS_PROGRESS_V2'))throw new Error('Modul Kebutuhan GTK Riil V2 tidak valid.');

// Core V14: authoritative renderer for Kebutuhan GTK Riil.
// Negeri-only scope, Gap Data, verified-only Dinas metrics, review actions,
// and clickable Gap Riil/Gap Data breakdowns by position live here.
code=code.replace('.sim-needs-grid{display:grid;grid-template-columns:repeat(4,1fr);','.sim-needs-grid{display:grid;grid-template-columns:repeat(5,1fr);');
code=code.replace('.sim-needs-right{text-align:right}.sim-needs-nowrap{white-space:nowrap}',`.sim-needs-right{text-align:right}.sim-needs-nowrap{white-space:nowrap}.sim-needs-gap-card{cursor:pointer;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}.sim-needs-gap-card:hover,.sim-needs-gap-card:focus{transform:translateY(-1px);border-color:#9fc4e2;box-shadow:0 8px 22px rgba(10,53,104,.11);outline:none}.sim-needs-gap-card .sim-needs-note{color:#1767b3;font-weight:800}.sim-needs-gap-button{border:0;background:transparent;padding:2px 4px;color:#0a3568;font-weight:950;cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}.sim-needs-gap-button:hover{color:#1767b3}`);
code=code.replace("function aggregateRows(rows){return rows.reduce((o,r)=>{const c=calcRow(r);o.abk+=c.abk;o.asn+=c.asn;o.non+=c.non;o.gap+=c.gap;o.gapData+=c.gapData;return o},{abk:0,asn:0,non:0,gap:0,gapData:0})}","function aggregateRows(rows){return rows.reduce((o,r)=>{const c=calcRow(r);o.abk+=c.abk;o.asn+=c.asn;o.non+=c.non;o.gap+=Math.max(0,c.gap);o.gapData+=Math.max(0,c.gapData);return o},{abk:0,asn:0,non:0,gap:0,gapData:0})}");
code=code.replace(".eq('is_active',true).order('school_name');if(error)throw error;const schools=all||[]", ".eq('is_active',true).eq('school_status','NEGERI').order('school_name');if(error)throw error;const schools=all||[]");

const summaryStart=code.indexOf('function schoolSummaryRows(');
const scopedStart=code.indexOf('async function renderScoped(',summaryStart);
const renderStart=code.indexOf('async function render(force=false)',scopedStart);
if(summaryStart<0||scopedStart<0||renderStart<0)throw new Error('Struktur fungsi GTK needs tidak ditemukan untuk core V14.');

const breakdownHelpers=`function canonicalPositionName(r){
 const code=String(r?.job_code||'').toUpperCase();
 const raw=clean(r?.position_name)||'Jabatan lainnya';
 const lvl=curriculumLevel(r?.school_level||'');
 if(lvl==='TK'&&code==='GURU_TK')return'Guru Kelas TK/PAUD';
 if(lvl==='TK'&&['PENJAGA','PENJAGA_SEKOLAH','PENJAGA_SEKOLAJ'].includes(code))return'Penjaga';
 const map={
  KEPALA_SEKOLAH:'Kepala Sekolah',
  GURU_KELAS:'Guru Kelas',
  GURU_TK:'Guru Kelas',
  GURU_PAI:'Guru Pendidikan Agama dan Budi Pekerti',
  GURU_PJOK:'Guru Pendidikan Jasmani, Olahraga, dan Kesehatan',
  TAS:'Tenaga Administrasi Sekolah',
  PENJAGA:'Penjaga Sekolah',
  PENJAGA_SEKOLAH:'Penjaga Sekolah',
  PENJAGA_SEKOLAJ:'Penjaga Sekolah'
 };
 if(map[code])return map[code];
 const n=norm(raw);
 if(n==='guru pai'||n==='pai')return map.GURU_PAI;
 if(n==='guru pjok')return map.GURU_PJOK;
 if(n==='tas')return map.TAS;
 if(n==='penjaga'||n==='penjaga sekolah'||n==='penjaga sekolaj')return map.PENJAGA_SEKOLAH;
 if(n==='kepala sekolah')return map.KEPALA_SEKOLAH;
 return raw;
}
function positionBreakdown(rows,kind){
 const by=new Map();
 for(const r of rows||[]){
  const c=calcRow(r),value=kind==='gapData'?Math.max(0,c.gapData):Math.max(0,c.gap);
  if(value<=0)continue;
  const name=canonicalPositionName(r);
  by.set(name,(by.get(name)||0)+value);
 }
 return [...by.entries()].map(([position_name,total])=>({position_name,total})).sort((a,b)=>b.total-a.total||a.position_name.localeCompare(b.position_name,'id'));
}
function registerBreakdown(key,title,rows,kind,note=''){
 window.__simGtkNeedsBreakdowns=window.__simGtkNeedsBreakdowns||{};
 window.__simGtkNeedsBreakdowns[key]={title,kind,note,items:positionBreakdown(rows,kind)};
}
window.simGtkNeedsShowBreakdown=key=>{
 const d=window.__simGtkNeedsBreakdowns?.[key];if(!d)return;
 let modal=$('simNeedsBreakdownModal');if(modal)modal.remove();
 modal=document.createElement('div');modal.id='simNeedsBreakdownModal';
 modal.setAttribute('style','position:fixed;inset:0;z-index:9999;background:rgba(8,26,48,.58);display:flex;align-items:center;justify-content:center;padding:16px');
 modal.onclick=e=>{if(e.target===modal)modal.remove()};
 const total=(d.items||[]).reduce((n,x)=>n+num(x.total),0);
 const formula=d.kind==='gapData'?'Gap Data = ABK − ASN − Non-ASN':'Gap Riil = ABK − ASN';
 const rows=(d.items||[]).map((x,i)=>\`<tr><td>\${i+1}</td><td><b>\${esc(x.position_name)}</b></td><td style="text-align:right"><b>\${num(x.total)}</b></td></tr>\`).join('');
 modal.innerHTML=\`<div style="width:min(620px,100%);max-height:86vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.28);padding:18px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div class="sim-needs-note">\${esc(formula)}</div><h3 style="margin:3px 0 4px;color:#0a3568">\${esc(d.title)}</h3>\${d.note?\`<div class="sim-needs-note">\${esc(d.note)}</div>\`:''}</div><button type="button" class="sim-needs-action soft" onclick="document.getElementById('simNeedsBreakdownModal')?.remove()">✕ Tutup</button></div><div style="margin-top:14px" class="sim-needs-table"><table><thead><tr><th>No</th><th>Jabatan</th><th style="text-align:right">Jumlah Kekurangan</th></tr></thead><tbody>\${rows||'<tr><td colspan="3"><div class="sim-needs-note">Tidak ada kekurangan pada cakupan data ini.</div></td></tr>'}</tbody><tfoot><tr><td colspan="2"><b>Total</b></td><td style="text-align:right"><b>\${total}</b></td></tr></tfoot></table></div></div>\`;
 document.body.appendChild(modal);
};
function gapButton(value,key,label){
 return \`<button type="button" class="sim-needs-gap-button" onclick="simGtkNeedsShowBreakdown('\${esc(key)}')" title="Klik untuk melihat rincian \${esc(label)} per jabatan">\${num(value)}</button>\`;
}

`;

const summaryFn=`function schoolSummaryRows(schools,needs,workflow,mode){
 const by=new Map();for(const r of needs){if(!by.has(r.school_npsn))by.set(r.school_npsn,[]);by.get(r.school_npsn).push(r)}
 const needsSet=new Set(needs.map(x=>x.school_npsn));
 const reviewers=['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK'];
 const statusPriority={SUBMITTED:0,REVISION:1,DRAFT:2,NOT_STARTED:3,VERIFIED:4,APPROVED:4};
 const orderedSchools=[...schools].sort((a,b)=>{
  const sa=statusFor(a.npsn,needsSet,workflow),sb=statusFor(b.npsn,needsSet,workflow);
  const pa=statusPriority[sa]??9,pb=statusPriority[sb]??9;
  if(pa!==pb)return pa-pb;
  return String(a.school_name||'').localeCompare(String(b.school_name||''),'id',{sensitivity:'base'});
 });
 return orderedSchools.map(s=>{
  const level=s.jenjang||s.bentuk_pendidikan;const rows=curriculumLevel(level)==='TK'?mergeCurriculumRows(level,by.get(s.npsn)||[]):visibleNeedsRows(level,by.get(s.npsn)||[]),a=aggregateRows(rows),st=statusFor(s.npsn,needsSet,workflow),wf=workflow.get(s.npsn);
  let action=mode==='DINAS'?'—':'Baca saja';
  if(mode==='DINAS'){
   const allowed=reviewers.includes(profile().role);
   if(st==='SUBMITTED')action=allowed?\`<button class="sim-needs-action" onclick="simGtkNeedsReview('\${esc(s.npsn)}','VERIFIED')">✓ Verifikasi</button> <button class="sim-needs-action soft" onclick="simGtkNeedsReview('\${esc(s.npsn)}','REVISION')">↺ Perbaikan</button>\`:'Menunggu verifikasi';
   else if(st==='VERIFIED'||st==='APPROVED')action=allowed?\`<span class="sim-needs-status verified">✓ Diverifikasi</span> <button class="sim-needs-action soft" onclick="simGtkNeedsReview('\${esc(s.npsn)}','REVISION')">↺ Perbaikan</button>\`:'✓ Diverifikasi';
   else if(st==='REVISION')action='<span class="sim-needs-status revision">↺ Perlu Perbaikan</span>';
  }
  const gapKey=\`school-gap-\${s.npsn}\`,gapDataKey=\`school-gap-data-\${s.npsn}\`;
  registerBreakdown(gapKey,\`Gap Riil — \${s.school_name}\`,rows,'gap',\`NPSN \${s.npsn} • ABK dikurangi ASN\`);
  registerBreakdown(gapDataKey,\`Gap Data — \${s.school_name}\`,rows,'gapData',\`NPSN \${s.npsn} • ABK dikurangi ASN dan Non-ASN\`);
  const detail=rows.length?\`<details class="sim-needs-detail"><summary>\${rows.length} jabatan</summary><table><thead><tr><th>Jabatan</th><th>ABK</th><th>ASN</th><th>Non-ASN</th><th>Gap Riil</th><th>Gap Data</th></tr></thead><tbody>\${rows.map(r=>{const c=calcRow(r);return\`<tr><td>\${esc(r.position_name)}</td><td>\${c.abk}</td><td>\${c.asn}</td><td>\${c.non}</td><td>\${Math.max(0,c.gap)}</td><td>\${Math.max(0,c.gapData)}</td></tr>\`}).join('')}</tbody></table></details>\`:'<div class="sim-needs-note">Belum input</div>';
  return \`<tr><td><b>\${esc(s.school_name)}</b><div class="sim-needs-note">\${esc(s.npsn)} • \${esc(s.jenjang||s.bentuk_pendidikan||'-')} • \${esc(s.kecamatan||'-')} • NEGERI</div>\${detail}</td><td><span class="sim-needs-status \${STATUS_CLASS[st]||'not'}">\${esc(st==='SUBMITTED'?'Perlu Verifikasi':(st==='APPROVED'?'Diverifikasi':(STATUS_LABEL[st]||st)))}</span>\${wf?.note?\`<div class="sim-needs-note">\${esc(wf.note)}</div>\`:''}</td><td>\${a.abk}</td><td>\${a.asn}</td><td>\${a.non}</td><td>\${gapButton(a.gap,gapKey,'Gap Riil')}</td><td>\${gapButton(a.gapData,gapDataKey,'Gap Data')}</td><td>\${action}</td></tr>\`;
 }).join('')
}

`;

const scopedFn=`async function renderScoped(box,mode){
 const client=sb();let schools=[],scopeLabel='Kabupaten Batang';
 if(mode==='PENGAWAS'){
  const scope=await resolvePengawasScope();schools=scope.schools;scopeLabel=scope.label;
  if(!schools.length){box.innerHTML=\`<div class="sim-needs-panel"><div class="sim-needs-warn"><b>Wilayah Pengawas belum dapat dipetakan.</b><br>Pastikan NIP Pengawas terhubung ke referensi sekolah binaan atau jabatan mencantumkan kecamatan tempat tugas.</div></div>\`;updateTile('Wilayah belum terpetakan');return}
 }else{
  const {data,error}=await client.from('school_master').select('npsn,school_name,school_status,jenjang,bentuk_pendidikan,kecamatan,is_active').eq('is_active',true).eq('school_status','NEGERI').order('school_name');if(error)throw error;schools=data||[]
 }
 const [{data:needs,error:ne},{data:wfs,error:we}]=await Promise.all([
  client.from('school_gtk_needs').select('school_npsn,school_name,school_level,job_code,position_name,abk,pns,pppk,pppk_pw,non_asn_before_2024,non_asn_after_2024,asn_total,non_asn_total,gap_riil,gap_data,updated_at').order('school_name'),
  client.from('school_gtk_needs_workflow').select('school_npsn,status,note,submitted_at,verified_at,updated_at')
 ]);
 if(ne)throw ne;if(we)throw we;
 const allowed=new Set(schools.map(x=>x.npsn));
 const scopedNeeds=(needs||[]).filter(x=>allowed.has(x.school_npsn));
 const schoolLevelByNpsn=new Map(schools.map(s=>[s.npsn,s.jenjang||s.bentuk_pendidikan||'-']));
 const visibleScopedNeeds=scopedNeeds.filter(x=>visibleNeedsRows(schoolLevelByNpsn.get(x.school_npsn),[x]).length);
 const workflow=new Map((wfs||[]).filter(x=>allowed.has(x.school_npsn)).map(x=>[x.school_npsn,x]));
 const needsSet=new Set(scopedNeeds.map(x=>x.school_npsn));
 const total=schools.length,input=schools.filter(s=>needsSet.has(s.npsn)).length;
 const submitted=schools.filter(s=>statusFor(s.npsn,needsSet,workflow)==='SUBMITTED').length;
 const verified=schools.filter(s=>['VERIFIED','APPROVED'].includes(statusFor(s.npsn,needsSet,workflow))).length;
 const metricNeeds=mode==='DINAS'?visibleScopedNeeds.filter(x=>['VERIFIED','APPROVED'].includes(String(workflow.get(x.school_npsn)?.status||'').toUpperCase())):visibleScopedNeeds;
 const agg=aggregateRows(metricNeeds);
 const metricNote=mode==='DINAS'?'Hanya data sekolah yang telah diverifikasi Dinas':\`Cakupan \${scopeLabel}\`;
 registerBreakdown('scope-gap',\`Rincian Gap Riil per Jabatan — \${scopeLabel}\`,metricNeeds,'gap',metricNote);
 registerBreakdown('scope-gap-data',\`Rincian Gap Data per Jabatan — \${scopeLabel}\`,metricNeeds,'gapData',metricNote);
 updateTile(mode==='PENGAWAS'?\`\${scopeLabel} • \${input}/\${total} sekolah\`:\`\${input}/\${total} sekolah negeri sudah input\`);
 const levelMap=new Map();schools.forEach(s=>{const k=s.jenjang||s.bentuk_pendidikan||'-';if(!levelMap.has(k))levelMap.set(k,{total:0,input:0});const x=levelMap.get(k);x.total++;if(needsSet.has(s.npsn))x.input++});
 const levelHtml=[...levelMap.entries()].map(([k,v])=>\`<div class="sim-needs-level"><b>\${esc(k)}: \${v.input}/\${v.total}</b><small>\${pct(v.input,v.total)}% sudah input</small><div class="sim-needs-bar"><i style="width:\${pct(v.input,v.total)}%"></i></div></div>\`).join('');
 box.innerHTML=\`<div class="sim-needs-scope"><b>Kebutuhan GTK Riil — SEKOLAH NEGERI</b><br>\${mode==='PENGAWAS'?\`Data kebutuhan dibatasi pada sekolah negeri di \${esc(scopeLabel)} sesuai wilayah tugas Pengawas.\`:'Menampilkan hanya sekolah negeri se-Kabupaten Batang. Sekolah swasta tidak termasuk modul ini.'}</div><div class="sim-needs-grid"><div class="sim-needs-metric"><span>Sekolah Negeri</span><b>\${total}</b><div class="sim-needs-note">\${esc(scopeLabel)}</div></div><div class="sim-needs-metric"><span>Sudah Input</span><b>\${input}</b><div class="sim-needs-bar"><i style="width:\${pct(input,total)}%"></i></div></div><div class="sim-needs-metric sim-needs-gap-card" role="button" tabindex="0" onclick="simGtkNeedsShowBreakdown('scope-gap')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();simGtkNeedsShowBreakdown('scope-gap')}"><span>Total Gap Riil</span><b>\${agg.gap}</b><div class="sim-needs-note">\${mode==='DINAS'?'Data terverifikasi • Klik rincian jabatan':'Klik untuk rincian jabatan'}</div></div><div class="sim-needs-metric sim-needs-gap-card" role="button" tabindex="0" onclick="simGtkNeedsShowBreakdown('scope-gap-data')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();simGtkNeedsShowBreakdown('scope-gap-data')}"><span>Gap Data</span><b>\${agg.gapData}</b><div class="sim-needs-note">\${mode==='DINAS'?'Data terverifikasi • Klik rincian jabatan':'Klik untuk rincian jabatan'}</div></div><div class="sim-needs-metric"><span>Diajukan / Diverifikasi</span><b>\${submitted} / \${verified}</b></div></div><div class="sim-needs-panel"><h3>Progres per Jenjang</h3><div class="sim-needs-levels">\${levelHtml||'<div class="sim-needs-note">Belum ada sekolah pada cakupan ini.</div>'}</div></div><div class="sim-needs-panel"><h3>Daftar Sekolah Negeri</h3><input class="sim-needs-filter" id="simNeedsSchoolFilter" placeholder="Cari sekolah, NPSN, kecamatan..."><div class="sim-needs-table"><table id="simNeedsSchoolTable"><thead><tr><th>Sekolah</th><th>Status</th><th>ABK</th><th>ASN</th><th>Non-ASN</th><th>Gap Riil</th><th>Gap Data</th><th>\${mode==='DINAS'?'Verifikasi':'Akses'}</th></tr></thead><tbody>\${schoolSummaryRows(schools,scopedNeeds,workflow,mode)}</tbody></table></div></div>\`;
 $('simNeedsSchoolFilter').oninput=e=>{const q=String(e.target.value||'').toLowerCase();document.querySelectorAll('#simNeedsSchoolTable tbody>tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')}
}

`;

code=code.slice(0,summaryStart)+breakdownHelpers+summaryFn+scopedFn+code.slice(renderStart);
if(!code.includes('<th>Gap Data</th>')||!code.includes('✓ Diverifikasi')||!code.includes("eq('school_status','NEGERI')")||!code.includes('simGtkNeedsShowBreakdown'))throw new Error('Core V12 gagal menanam scope negeri/Gap Data/Verifikasi/rincian jabatan.');

html=html.replace(/<script type="module" src="\.\/gtk-needs-progress\.js\?v=\d+"><\/script>\s*/g,'');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const tag=`<script type="module" src="./${moduleName}?v=18"></script>\n`;
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({gtkNeedsProgress:true,version:18,authoritativeRenderer:true,negeriOnly:true,coreGapData:true,coreVerification:true,clickableGapBreakdowns:true,sdHiddenRows:['GURU_BING','GURU_KODING_KA','GURU_MULOK'],tkVisibleRows:['KEPALA_SEKOLAH','GURU_TK','GURU_KELAS','TAS','PENJAGA','PENJAGA_SEKOLAH','PENJAGA_SEKOLAJ'],smpHiddenRows:['GURU_KODING_KA'],normalizedPositionLabels:true,tkMonitoringAlwaysFourRows:true,breakdownScopes:['kabupaten-or-pengawas','per-school'],positiveShortageAggregation:true,verifiedOnlyDinasMetrics:true,scope:{kepalaSekolah:'own-school-edit',gtk:'own-school-read',pengawas:'assigned-district-negeri-read',dinas:'district-wide-negeri'},workflow:['DRAFT','SUBMITTED','VERIFIED','REVISION'],roleScoped:true,existingNeedsDataUntouched:true}));