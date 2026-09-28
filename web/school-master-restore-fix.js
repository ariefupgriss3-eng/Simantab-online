/* SIMANTAB_SCHOOL_MASTER_RESTORE_FIX_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb||!window.showTab)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
const fmtNum=v=>new Intl.NumberFormat('id-ID').format(Number(v)||0);
const pick=(r,...keys)=>{for(const k of keys){if(r&&r[k]!==undefined&&r[k]!==null&&r[k]!=='')return r[k]}return ''};
const EDU_BATANG={
 snapshot_at:'22 September 2026',
 total:1194,
 formal:{total:854,negeri:509,swasta:345,types:{TK:{total:323,negeri:13,swasta:310},SD:{total:455,negeri:445,swasta:10},SMP:{total:76,negeri:51,swasta:25}}},
 nonformal:{total:340,negeri:1,swasta:339,types:{KB:214,TPA:17,SPS:35,'Kursus/LKP':30,PKBM:23,SKB:1,Ponpes:20}},
 status:{negeri:510,swasta:684}
};
let rows=[];
const form=r=>String(pick(r,'bentuk_pendidikan','jenjang','level','education_level')).trim().toUpperCase();
const schoolName=r=>pick(r,'school_name','nama_sekolah','nama','name');
const district=r=>pick(r,'kecamatan','district','kec');
const status=r=>pick(r,'school_status','status_sekolah','status');
const npsn=r=>pick(r,'npsn','school_npsn');
const students=r=>Number(pick(r,'students','jumlah_siswa','peserta_didik','pd'))||0;
const rombel=r=>Number(pick(r,'rombel','jumlah_rombel'))||0;
const teachers=r=>Number(pick(r,'teachers','jumlah_guru','guru'))||0;
const staff=r=>Number(pick(r,'staff','jumlah_tendik','tendik'))||0;
const synced=r=>pick(r,'synced_at','source_synced_at','updated_at','last_synced_at');
function ensureStyle(){if($('schoolMasterDashAlignStyle'))return;const s=document.createElement('style');s.id='schoolMasterDashAlignStyle';s.textContent=`.sm-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px}.sm-kpi{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px}.sm-kpi .label{font-size:10px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.sm-kpi .metric{font-size:28px;font-weight:950;color:#0f3f76;margin-top:4px}.sm-kpi .sub{font-size:10px;color:var(--muted);margin-top:3px}.sm-breakdown{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}.sm-box{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fbfdff}.sm-box h4{margin:0 0 8px}.sm-chipwrap{display:flex;gap:7px;flex-wrap:wrap}.sm-chip{padding:6px 9px;border-radius:999px;background:#edf5ff;color:#175ea7;font-size:10px;font-weight:900}.sm-chip.alt{background:#fff5df;color:#8a5a00}.sm-dbnote{font-size:10px;color:var(--muted);line-height:1.5;margin-top:8px}@media(max-width:900px){.sm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.sm-breakdown{grid-template-columns:1fr}}@media(max-width:560px){.sm-kpis{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function table(data){return data.length?`<div class="tablewrap"><table><thead><tr><th>NPSN</th><th>Sekolah</th><th>Jenjang</th><th>Status</th><th>Kecamatan</th><th>PD</th><th>Rombel</th><th>Guru</th><th>Tendik</th><th>Sinkron</th></tr></thead><tbody>${data.map(r=>`<tr><td>${esc(npsn(r)||'-')}</td><td><b>${esc(schoolName(r)||'-')}</b></td><td>${esc(form(r)||'-')}</td><td>${esc(status(r)||'-')}</td><td>${esc(district(r)||'-')}</td><td>${students(r)}</td><td>${rombel(r)}</td><td>${teachers(r)}</td><td>${staff(r)}</td><td>${fmtDate(synced(r))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Tidak ada data sesuai filter.</div>'}
function activateSchoolMaster(){
 document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id==='schoolMaster'));
 document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab==='schoolMaster'));
 const overlay=document.getElementById('overlay');if(overlay)overlay.classList.remove('show');
 const sidebar=document.getElementById('sidebar');if(sidebar)sidebar.classList.remove('open');
 window.scrollTo?.({top:0,behavior:'auto'});
}
function render(){
 ensureStyle();
 const body=$('schoolMasterBody');if(!body)return;
 const last=rows.reduce((m,x)=>{const v=String(synced(x)||'');return !m||v>m?v:m},'');
 const formalRows=rows.filter(x=>['TK','SD','SMP'].includes(form(x)));
 const levels=[...new Set(rows.map(form).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
 const formalTypes=Object.entries(EDU_BATANG.formal.types).map(([k,v])=>`<span class="sm-chip">${esc(k)} ${fmtNum(v.total)} <small>(N ${fmtNum(v.negeri)} • S ${fmtNum(v.swasta)})</small></span>`).join('');
 const nonformalTypes=Object.entries(EDU_BATANG.nonformal.types).map(([k,v])=>`<span class="sm-chip alt">${esc(k)} ${fmtNum(v)}</span>`).join('');
 body.innerHTML=`
 <div class="sm-kpis">
  <div class="sm-kpi"><div class="label">Total Satuan Pendidikan</div><div class="metric">${fmtNum(EDU_BATANG.total)}</div><div class="sub">Se-Kabupaten Batang</div></div>
  <div class="sm-kpi"><div class="label">Formal</div><div class="metric">${fmtNum(EDU_BATANG.formal.total)}</div><div class="sub">TK, SD, SMP</div></div>
  <div class="sm-kpi"><div class="label">Nonformal</div><div class="metric">${fmtNum(EDU_BATANG.nonformal.total)}</div><div class="sub">PAUD nonformal & DIKMAS/PNF</div></div>
  <div class="sm-kpi"><div class="label">Status</div><div class="metric">${fmtNum(EDU_BATANG.status.negeri)} / ${fmtNum(EDU_BATANG.status.swasta)}</div><div class="sub">Negeri / Swasta</div></div>
 </div>
 <div class="sm-breakdown">
  <div class="sm-box"><h4>🏫 Formal — ${fmtNum(EDU_BATANG.formal.total)}</h4><div class="sm-chipwrap">${formalTypes}</div><div class="sm-dbnote">Negeri ${fmtNum(EDU_BATANG.formal.negeri)} • Swasta ${fmtNum(EDU_BATANG.formal.swasta)}</div></div>
  <div class="sm-box"><h4>🎓 Nonformal — ${fmtNum(EDU_BATANG.nonformal.total)}</h4><div class="sm-chipwrap">${nonformalTypes}</div><div class="sm-dbnote">Negeri ${fmtNum(EDU_BATANG.nonformal.negeri)} • Swasta ${fmtNum(EDU_BATANG.nonformal.swasta)}</div></div>
 </div>
 <div class="card" style="margin-bottom:12px"><div class="info"><b>Ringkasan Master sudah diselaraskan dengan Dashboard Dinos.</b> Snapshot ${esc(EDU_BATANG.snapshot_at)}: total ${fmtNum(EDU_BATANG.total)} satuan pendidikan = formal ${fmtNum(EDU_BATANG.formal.total)} + nonformal ${fmtNum(EDU_BATANG.nonformal.total)}. Detail tabel di bawah dibaca dari database <code>school_master</code> dan saat ini memuat ${fmtNum(rows.length)} data aktif (${fmtNum(formalRows.length)} formal). Data nonformal pada Dashboard Dinas masih berupa agregat referensi.${last?` Terakhir sinkron master: ${fmtDate(last)}.`:''}</div><div class="grid" style="margin-top:10px"><div class="field s6"><label>Cari sekolah/NPSN/kecamatan</label><input id="schoolRestoreSearch" placeholder="Ketik nama sekolah, NPSN, atau kecamatan"></div><div class="field s3"><label>Jenjang</label><select id="schoolRestoreLevel"><option value="">Semua</option>${levels.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div><div class="field s3"><label>Status</label><select id="schoolRestoreStatus"><option value="">Semua</option><option value="NEGERI">Negeri</option><option value="SWASTA">Swasta</option></select></div></div></div>
 <div class="card"><div id="schoolRestoreRows">${table(rows)}</div></div>`;
 const filter=()=>{const q=String($('schoolRestoreSearch')?.value||'').trim().toLowerCase(),level=$('schoolRestoreLevel')?.value||'',st=$('schoolRestoreStatus')?.value||'',out=rows.filter(r=>(!q||[npsn(r),schoolName(r),district(r)].some(v=>String(v||'').toLowerCase().includes(q)))&&(!level||form(r)===level)&&(!st||String(status(r)||'').toUpperCase()===st));const el=$('schoolRestoreRows');if(el)el.innerHTML=table(out)};
 $('schoolRestoreSearch')?.addEventListener('input',filter);$('schoolRestoreLevel')?.addEventListener('change',filter);$('schoolRestoreStatus')?.addEventListener('change',filter)
}
async function load(){const body=$('schoolMasterBody');if(!body)return;body.innerHTML='<div class="card"><div class="small">Memuat Master Sekolah…</div></div>';let q=sb.from('school_master').select('*').limit(1500);const {data,error}=await q;if(error){body.innerHTML=`<div class="card err">${esc(error.message)}</div>`;return}rows=(data||[]).filter(r=>r.is_active!==false).sort((a,b)=>String(schoolName(a)||'').localeCompare(String(schoolName(b)||''),'id'));render()}
const prior=window.showTab;
window.__simantabSchoolMasterRestoreFix={version:3,schemaAgnostic:true,bypassLegacy:true,dashboardAligned:true,snapshot:'22-09-2026'};
window.showTab=async id=>{
 if(id==='schoolMaster'){
  activateSchoolMaster();
  await load();
  return;
 }
 await prior(id);
};
if(document.querySelector('.section.active')?.id==='schoolMaster'){activateSchoolMaster();await load()}
})();
