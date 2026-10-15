/* SIMANTAB_SUPER_ADMIN_DUPLICATE_NIP_AUDIT_V1_CLOUDFLARE
 * Read-only audit of existing duplicate NIPs. No account merges or changes.
 * RPC enforces active/approved SUPER_ADMIN on the server.
 */
(async()=>{
'use strict';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(let i=0;i<140&&(!window.__simantabSb||!window.showTab);i++)await sleep(50);
const sb=window.__simantabSb;
if(!sb||!window.showTab)return;
const $=id=>document.getElementById(id);
const admin=()=>window.__simantabProfile?.role==='SUPER_ADMIN';
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));
const time=s=>{
 if(!s)return 'Belum pernah';
 const d=new Date(s);
 return Number.isFinite(d.getTime())?d.toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
};
const fnum=n=>Number(n||0).toLocaleString('id-ID');
let loading=false,rows=[];
function stateLabel(a){
 return a.approval_status==='APPROVED'&&a.is_active?'Aktif & disetujui':
 a.approval_status==='PENDING'?'Menunggu persetujuan':
 a.approval_status==='REJECTED'?'Ditolak':
 a.is_active?'Aktif (status '+a.approval_status+')':'Tidak aktif';
}
function tag(r){
 if(Number(r.approved_active)>1)return '⚠️ Beberapa akun aktif';
 if(Number(r.name_variants)>1)return '⚠️ Periksa identitas';
 return 'Perlu pemeriksaan';
}
function csvCell(value){
 let v=String(value??'');
 // Guard CSV formula injection from arbitrary names/email/unit values.
 if(/^\s*[=+\-@]/.test(v))v="'"+v;
 return '"'+v.replace(/"/g,'""')+'"';
}
function downloadCsv(){
 if(!admin()||!rows.length)return;
 const header=['NIP','Jumlah Akun','Akun Aktif Disetujui','Nama Akun','Email','Unit Kerja',
  'Role','Status Persetujuan','Aktif','Jumlah Usulan','Terakhir Masuk',
  'Terakhir Usulan','Rekomendasi Pemeriksaan','Keputusan Super Admin','Catatan Pemeriksa'];
 const data=[header.map(csvCell).join(',')];
 for(const r of rows){
  for(const a of r.accounts||[]){
   const safeNip=/^\d{18}$/.test(r.nip)?'="'+r.nip+'"':r.nip;
   data.push([safeNip,r.account_count,r.approved_active,a.full_name,a.email,a.unit,
     a.role,a.approval_status,a.is_active?'YA':'TIDAK',a.submission_count,
     a.last_sign_in_at||'',a.last_submitted||'',tag(r),'',''].map(csvCell).join(','));
  }
 }
 const blob=new Blob(['\ufeff',data.join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='audit-nip-ganda-simantab-2026-10-15.csv';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderTable(box){
 const extras=rows.reduce((sum,r)=>sum+Math.max(0,Number(r.account_count)-1),0);
 const multiple=rows.filter(r=>Number(r.approved_active)>1).length;
 const variants=rows.filter(r=>Number(r.name_variants)>1).length;
 box.innerHTML=
  '<div class="label">SUPER ADMIN · AUDIT NIP GANDA</div>'+
  '<h3 style="margin:6px 0">🔒 Pemeriksaan Akun Ganda Berdasarkan NIP</h3>'+
  '<div class="small" style="margin-bottom:12px">Hanya untuk pemeriksaan. Tidak ada akun yang otomatis dinonaktifkan, digabung, atau dihapus. Pemeriksaan identitas dan riwayat usulan wajib dilakukan sebelum tindakan administratif.</div>'+
  '<div class="grid" style="margin-bottom:12px">'+
    '<div class="s4"><div class="label">NIP ganda</div><div class="metric">'+fnum(rows.length)+'</div></div>'+
    '<div class="s4"><div class="label">Akun tambahan</div><div class="metric">'+fnum(extras)+'</div></div>'+
    '<div class="s4"><div class="label">NIP >1 akun aktif</div><div class="metric">'+fnum(multiple)+'</div></div>'+
  '</div>'+
  '<div class="small" style="margin:0 0 12px">'+fnum(variants)+' NIP memerlukan perhatian tambahan karena variasi penulisan nama. Verifikasi data kepegawaian sebelum memilih akun utama.</div>'+
  '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+
    '<button type="button" class="btn soft" id="simAuditNipRefresh">↻ Perbarui Audit</button>'+
    '<button type="button" class="btn primary" id="simAuditNipCsv">⬇ Unduh CSV untuk Super Admin</button>'+
  '</div>'+
  '<div class="small" style="margin-bottom:8px">Buka salah satu NIP untuk memeriksa masing-masing akun, email, unit, status, aktivitas login, dan jumlah usulan.</div>'+
  (rows.length?rows.map((r,index)=>
   '<details style="border:1px solid var(--line);border-radius:12px;padding:11px 12px;margin-bottom:8px">'+
   '<summary style="cursor:pointer;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">'+
     '<b>'+(index+1)+'. NIP '+esc(r.nip)+'</b>'+
     '<span class="small">'+fnum(r.account_count)+' akun · '+esc(tag(r))+'</span>'+
   '</summary>'+
   '<div style="overflow-x:auto;margin-top:10px"><table class="table" style="width:100%;min-width:720px">'+
   '<thead><tr><th>Nama / Email</th><th>Unit Kerja</th><th>Peran & Status</th><th>Riwayat</th></tr></thead>'+
   '<tbody>'+(r.accounts||[]).map(a=>
     '<tr><td><b>'+esc(a.full_name)+'</b><div class="small">'+esc(a.email||'(email tidak tersedia)')+'</div></td>'+
     '<td>'+esc(a.unit||'-')+'</td>'+
     '<td>'+esc(a.role||a.requested_role||'-')+'<div class="small">'+esc(stateLabel(a))+'</div></td>'+
     '<td>'+fnum(a.submission_count)+' usulan<div class="small">Login: '+esc(time(a.last_sign_in_at))+'</div>'+
       '<div class="small">Usulan: '+esc(time(a.last_submitted))+'</div></td></tr>'
    ).join('')+'</tbody></table></div>'+
   '</details>').join(''):
   '<div class="info">Saat ini tidak ada NIP ganda pada database.</div>')+
  '<div class="small" style="margin-top:10px">Audit ini bersifat baca-saja. Jangan membagikan CSV yang memuat NIP dan email ke grup publik.</div>';
 $('simAuditNipRefresh')?.addEventListener('click',()=>{render(true)});
 $('simAuditNipCsv')?.addEventListener('click',downloadCsv);
}
async function render(force=false){
 if(!admin()||loading)return;
 const body=$('usersBody');
 if(!body)return;
 let panel=body.querySelector('#simDuplicateNipAuditPanel');
 if(!panel){
   panel=document.createElement('section');
   panel.id='simDuplicateNipAuditPanel';
   panel.className='card';
   panel.style.cssText='margin-bottom:14px;border:1px solid #e4c58b';
   body.prepend(panel);
 }
 if(!force&&rows.length){renderTable(panel);return;}
 loading=true;
 panel.innerHTML='<h3 style="margin:0 0 8px">🔒 Pemeriksaan NIP Ganda</h3><div class="small">Memeriksa akun melalui hak akses Super Admin...</div>';
 try{
   const {data,error}=await sb.rpc('simantab_duplicate_nip_audit');
   if(error)throw error;
   rows=Array.isArray(data)?data:[];
   if(!admin())return;
   renderTable(panel);
 }catch(e){
   console.error('SIMANTAB_DUPLICATE_NIP_AUDIT',e);
   panel.innerHTML='<h3>Audit NIP Ganda</h3><div class="err">Tidak dapat memuat laporan: '+esc(e?.message||e)+'</div>';
 }finally{loading=false;}
}
const prior=window.showTab;
window.showTab=async function(tab,...rest){
 const result=await prior.call(this,tab,...rest);
 if(tab==='users'&&admin())await render();
 return result;
};
window.addEventListener('simantab:profile-ready',()=>{
 if($('users')?.classList.contains('active')&&admin())render();
});
if($('users')?.classList.contains('active')&&admin())render();
window.__simantabDuplicateNipAudit={version:1,viewOnly:true,render};
})();