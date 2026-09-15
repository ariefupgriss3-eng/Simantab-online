/* SIMANTAB_SCHOOL_MASTER_RESTORE_FIX_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<200&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb||!window.showTab)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const fmt=v=>v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
const pick=(r,...keys)=>{for(const k of keys){if(r&&r[k]!==undefined&&r[k]!==null&&r[k]!=='')return r[k]}return ''};
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
function table(data){return data.length?`<div class="tablewrap"><table><thead><tr><th>NPSN</th><th>Sekolah</th><th>Jenjang</th><th>Status</th><th>Kecamatan</th><th>PD</th><th>Rombel</th><th>Guru</th><th>Tendik</th><th>Sinkron</th></tr></thead><tbody>${data.map(r=>`<tr><td>${esc(npsn(r)||'-')}</td><td><b>${esc(schoolName(r)||'-')}</b></td><td>${esc(form(r)||'-')}</td><td>${esc(status(r)||'-')}</td><td>${esc(district(r)||'-')}</td><td>${students(r)}</td><td>${rombel(r)}</td><td>${teachers(r)}</td><td>${staff(r)}</td><td>${fmt(synced(r))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Tidak ada data sesuai filter.</div>'}
function activateSchoolMaster(){
 document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id==='schoolMaster'));
 document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab==='schoolMaster'));
 const overlay=document.getElementById('overlay');if(overlay)overlay.classList.remove('show');
 const sidebar=document.getElementById('sidebar');if(sidebar)sidebar.classList.remove('open');
 window.scrollTo?.({top:0,behavior:'auto'});
}
function render(){const body=$('schoolMasterBody');if(!body)return;const count=l=>rows.filter(x=>form(x)===l).length,last=rows.reduce((m,x)=>{const v=String(synced(x)||'');return !m||v>m?v:m},'');body.innerHTML=`<div class="grid" style="margin-bottom:12px"><div class="card s3"><div class="label">Total Sekolah</div><div class="metric">${rows.length}</div></div><div class="card s3"><div class="label">TK</div><div class="metric">${count('TK')}</div></div><div class="card s3"><div class="label">SD</div><div class="metric">${count('SD')}</div></div><div class="card s3"><div class="label">SMP</div><div class="metric">${count('SMP')}</div></div></div><div class="card" style="margin-bottom:12px"><div class="info"><b>Master Sekolah berhasil dibaca dari database restorasi.</b> Pembacaan kolom dibuat adaptif terhadap skema database saat ini.${last?` Terakhir sinkron: ${fmt(last)}.`:''}</div><div class="grid" style="margin-top:10px"><div class="field s8"><label>Cari sekolah/NPSN/kecamatan</label><input id="schoolRestoreSearch" placeholder="Ketik nama sekolah, NPSN, atau kecamatan"></div><div class="field s4"><label>Jenjang</label><select id="schoolRestoreLevel"><option value="">Semua</option><option value="TK">TK</option><option value="SD">SD</option><option value="SMP">SMP</option></select></div></div></div><div class="card"><div id="schoolRestoreRows">${table(rows)}</div></div>`;const filter=()=>{const q=String($('schoolRestoreSearch')?.value||'').trim().toLowerCase(),level=$('schoolRestoreLevel')?.value||'',out=rows.filter(r=>(!q||[npsn(r),schoolName(r),district(r)].some(v=>String(v||'').toLowerCase().includes(q)))&&(!level||form(r)===level));const el=$('schoolRestoreRows');if(el)el.innerHTML=table(out)};$('schoolRestoreSearch')?.addEventListener('input',filter);$('schoolRestoreLevel')?.addEventListener('change',filter)}
async function load(){const body=$('schoolMasterBody');if(!body)return;body.innerHTML='<div class="card"><div class="small">Memuat Master Sekolah…</div></div>';let q=sb.from('school_master').select('*').limit(1500);const {data,error}=await q;if(error){body.innerHTML=`<div class="card err">${esc(error.message)}</div>`;return}rows=(data||[]).filter(r=>r.is_active!==false).sort((a,b)=>String(schoolName(a)||'').localeCompare(String(schoolName(b)||''),'id'));render()}
const prior=window.showTab;
window.__simantabSchoolMasterRestoreFix={version:2,schemaAgnostic:true,bypassLegacy:true};
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