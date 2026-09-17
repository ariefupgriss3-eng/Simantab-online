import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='gtk-needs-progress.js';
const modulePath=new URL(`./${moduleName}`,import.meta.url);
let html=await fs.readFile(outputPath,'utf8');
let code=await fs.readFile(modulePath,'utf8');
if(!code.includes('SIMANTAB_GTK_NEEDS_PROGRESS_V2'))throw new Error('Modul Kebutuhan GTK Riil V2 tidak valid.');

// Core V10: Gap Data + workflow review are rendered by the main GTK-needs module itself.
code=code.replace('.sim-needs-grid{display:grid;grid-template-columns:repeat(4,1fr);','.sim-needs-grid{display:grid;grid-template-columns:repeat(5,1fr);');

const summaryStart=code.indexOf('function schoolSummaryRows(');
const scopedStart=code.indexOf('async function renderScoped(',summaryStart);
const renderStart=code.indexOf('async function render(force=false)',scopedStart);
if(summaryStart<0||scopedStart<0||renderStart<0)throw new Error('Struktur fungsi GTK needs tidak ditemukan untuk core V10.');

const summaryFn=`function schoolSummaryRows(schools,needs,workflow,mode){
 const by=new Map();for(const r of needs){if(!by.has(r.school_npsn))by.set(r.school_npsn,[]);by.get(r.school_npsn).push(r)}
 const needsSet=new Set(needs.map(x=>x.school_npsn));
 const reviewers=['SUPER_ADMIN','KEPALA_DINAS','KABID','KASI_SD','KASI_SMP','SUBKOOR_TK'];
 return schools.map(s=>{
  const rows=by.get(s.npsn)||[],a=aggregateRows(rows),st=statusFor(s.npsn,needsSet,workflow),wf=workflow.get(s.npsn);
  let action=mode==='DINAS'?'—':'Baca saja';
  if(mode==='DINAS'){
   const allowed=reviewers.includes(profile().role);
   if(st==='SUBMITTED')action=allowed?\`<button class="sim-needs-action" onclick="simGtkNeedsReview('\${esc(s.npsn)}','VERIFIED')">✓ Verifikasi</button> <button class="sim-needs-action soft" onclick="simGtkNeedsReview('\${esc(s.npsn)}','REVISION')">↺ Perbaikan</button>\`:'Menunggu verifikasi';
   else if(st==='VERIFIED')action=allowed?\`<span class="sim-needs-status verified">✓ Diverifikasi</span> <button class="sim-needs-action soft" onclick="simGtkNeedsReview('\${esc(s.npsn)}','REVISION')">↺ Perbaikan</button>\`:'✓ Diverifikasi';
   else if(st==='REVISION')action='<span class="sim-needs-status revision">↺ Perlu Perbaikan</span>';
  }
  const detail=rows.length?\`<details class="sim-needs-detail"><summary>\${rows.length} jabatan</summary><table><thead><tr><th>Jabatan</th><th>ABK</th><th>ASN</th><th>Non-ASN</th><th>Gap Riil</th><th>Gap Data</th></tr></thead><tbody>\${rows.map(r=>{const c=calcRow(r);return\`<tr><td>\${esc(r.position_name)}</td><td>\${c.abk}</td><td>\${c.asn}</td><td>\${c.non}</td><td>\${c.gap}</td><td>\${c.gapData}</td></tr>\`}).join('')}</tbody></table></details>\`:'<div class="sim-needs-note">Belum input</div>';
  return \`<tr><td><b>\${esc(s.school_name)}</b><div class="sim-needs-note">\${esc(s.npsn)} • \${esc(s.jenjang||s.bentuk_pendidikan||'-')} • \${esc(s.kecamatan||'-')}</div>\${detail}</td><td><span class="sim-needs-status \${STATUS_CLASS[st]||'not'}">\${esc(STATUS_LABEL[st]||st)}</span>\${wf?.note?\`<div class="sim-needs-note">\${esc(wf.note)}</div>\`:''}</td><td>\${a.abk}</td><td>\${a.asn}</td><td>\${a.non}</td><td><b>\${a.gap}</b></td><td><b>\${a.gapData}</b></td><td>\${action}</td></tr>\`;
 }).join('')
}

`;

const scopedFn=`async function renderScoped(box,mode){
 const client=sb();let schools=[],scopeLabel='Kabupaten Batang';
 if(mode==='PENGAWAS'){
  const scope=await resolvePengawasScope();schools=scope.schools;scopeLabel=scope.label;
  if(!schools.length){box.innerHTML=\`<div class="sim-needs-panel"><div class="sim-needs-warn"><b>Wilayah Pengawas belum dapat dipetakan.</b><br>Pastikan NIP Pengawas terhubung ke referensi sekolah binaan atau jabatan mencantumkan kecamatan tempat tugas.</div></div>\`;updateTile('Wilayah belum terpetakan');return}
 }else{
  const {data,error}=await client.from('school_master').select('npsn,school_name,school_status,jenjang,bentuk_pendidikan,kecamatan,is_active').eq('is_active',true).order('school_name');if(error)throw error;schools=data||[]
 }
 const [{data:needs,error:ne},{data:wfs,error:we}]=await Promise.all([
  client.from('school_gtk_needs').select('school_npsn,school_name,school_level,job_code,position_name,abk,pns,pppk,pppk_pw,non_asn_before_2024,non_asn_after_2024,asn_total,non_asn_total,gap_riil,gap_data,updated_at').order('school_name'),
  client.from('school_gtk_needs_workflow').select('school_npsn,status,note,submitted_at,verified_at,updated_at')
 ]);
 if(ne)throw ne;if(we)throw we;
 const allowed=new Set(schools.map(x=>x.npsn));
 const scopedNeeds=(needs||[]).filter(x=>allowed.has(x.school_npsn));
 const workflow=new Map((wfs||[]).filter(x=>allowed.has(x.school_npsn)).map(x=>[x.school_npsn,x]));
 const needsSet=new Set(scopedNeeds.map(x=>x.school_npsn));
 const total=schools.length,input=schools.filter(s=>needsSet.has(s.npsn)).length;
 const submitted=schools.filter(s=>statusFor(s.npsn,needsSet,workflow)==='SUBMITTED').length;
 const verified=schools.filter(s=>statusFor(s.npsn,needsSet,workflow)==='VERIFIED').length;
 const metricNeeds=mode==='DINAS'?scopedNeeds.filter(x=>['VERIFIED','APPROVED'].includes(String(workflow.get(x.school_npsn)?.status||'').toUpperCase())):scopedNeeds;
 const agg=aggregateRows(metricNeeds);
 updateTile(mode==='PENGAWAS'?\`\${scopeLabel} • \${input}/\${total} sekolah\`:\`\${input}/\${total} sekolah sudah input\`);
 const levelMap=new Map();schools.forEach(s=>{const k=s.jenjang||s.bentuk_pendidikan||'-';if(!levelMap.has(k))levelMap.set(k,{total:0,input:0});const x=levelMap.get(k);x.total++;if(needsSet.has(s.npsn))x.input++});
 const levelHtml=[...levelMap.entries()].map(([k,v])=>\`<div class="sim-needs-level"><b>\${esc(k)}: \${v.input}/\${v.total}</b><small>\${pct(v.input,v.total)}% sudah input</small><div class="sim-needs-bar"><i style="width:\${pct(v.input,v.total)}%"></i></div></div>\`).join('');
 box.innerHTML=\`<div class="sim-needs-scope"><b>\${mode==='PENGAWAS'?'Akses Pengawas — baca saja':'Akses Dinas — Kabupaten Batang'}</b><br>\${mode==='PENGAWAS'?\`Data kebutuhan dibatasi server pada \${esc(scopeLabel)} sesuai wilayah tugas Pengawas.\`:'Menampilkan seluruh sekolah aktif se-Kabupaten Batang. Pengisian dan perubahan data dilakukan oleh Kepala Sekolah; Dinas melakukan monitoring/verifikasi.'}</div><div class="sim-needs-grid"><div class="sim-needs-metric"><span>Sekolah Aktif</span><b>\${total}</b><div class="sim-needs-note">\${esc(scopeLabel)}</div></div><div class="sim-needs-metric"><span>Sudah Input</span><b>\${input}</b><div class="sim-needs-bar"><i style="width:\${pct(input,total)}%"></i></div></div><div class="sim-needs-metric"><span>Total Gap Riil</span><b>\${agg.gap}</b><div class="sim-needs-note">\${mode==='DINAS'?'Hanya data yang telah di-approve Dinas':'ABK dikurangi ASN'}</div></div><div class="sim-needs-metric"><span>Gap Data</span><b>\${agg.gapData}</b><div class="sim-needs-note">\${mode==='DINAS'?'Hanya data yang telah di-approve Dinas':'ABK dikurangi ASN dan Non-ASN'}</div></div><div class="sim-needs-metric"><span>Diajukan / Diverifikasi</span><b>\${submitted} / \${verified}</b></div></div><div class="sim-needs-panel"><h3>Progres per Jenjang</h3><div class="sim-needs-levels">\${levelHtml||'<div class="sim-needs-note">Belum ada sekolah pada cakupan ini.</div>'}</div></div><div class="sim-needs-panel"><h3>Daftar Sekolah & Kebutuhan GTK Riil</h3><input class="sim-needs-filter" id="simNeedsSchoolFilter" placeholder="Cari sekolah, NPSN, kecamatan..."><div class="sim-needs-table"><table id="simNeedsSchoolTable"><thead><tr><th>Sekolah</th><th>Status</th><th>ABK</th><th>ASN</th><th>Non-ASN</th><th>Gap Riil</th><th>Gap Data</th><th>\${mode==='DINAS'?'Verifikasi':'Akses'}</th></tr></thead><tbody>\${schoolSummaryRows(schools,scopedNeeds,workflow,mode)}</tbody></table></div></div>\`;
 $('simNeedsSchoolFilter').oninput=e=>{const q=String(e.target.value||'').toLowerCase();document.querySelectorAll('#simNeedsSchoolTable tbody>tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')}
}

`;

code=code.slice(0,summaryStart)+summaryFn+scopedFn+code.slice(renderStart);
if(!code.includes('<th>Gap Data</th>')||!code.includes('✓ Diverifikasi'))throw new Error('Core V10 gagal menanam Gap Data/Verifikasi.');

html=html.replace(/<script type="module" src="\.\/gtk-needs-progress\.js\?v=\d+"><\/script>\s*/g,'');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
const tag=`<script type="module" src="./${moduleName}?v=10"></script>\n`;
html=html.slice(0,bodyClose)+tag+html.slice(bodyClose);
await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
console.log(JSON.stringify({gtkNeedsProgress:true,version:10,coreGapData:true,coreVerification:true,verifiedOnlyDinasMetrics:true,scope:{kepalaSekolah:'own-school-edit',gtk:'own-school-read',pengawas:'assigned-district-read',dinas:'district-wide-all-schools'},workflow:['DRAFT','SUBMITTED','VERIFIED','REVISION'],roleScoped:true,existingNeedsDataUntouched:true}));
