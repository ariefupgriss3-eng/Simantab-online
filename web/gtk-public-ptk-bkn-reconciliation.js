/* SIMANTAB_PUBLIC_PTK_BKN_RECON_V4
   PTK–ASN public snapshot only, NOT Guru/Tendik ASN breakdown.
   Requires Supabase Edge Function simantab-public-ptk-bkn and RLS staging tables. */
(async()=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<150&&!window.__simantabSb;i++)await sleep(100);
 const sb=window.__simantabSb;if(!sb)return;
 const authorized=()=>['SUPER_ADMIN','KABID'].includes(window.__simantabProfile?.role);
 const fmt=v=>new Intl.NumberFormat('id-ID').format(Number(v)||0);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const link='https://referensi.data.kemendikdasmen.go.id/ptk-bkn/data_ptk?level=2&wilayah=032500';
 let busy=false;
 let latest=null;
 let stats=null;
 async function rows(table,params){
   const all=[];
   for(let from=0;from<3000;from+=500){
     let q=sb.from(table).select(params.columns).order(params.order,{ascending:false}).range(from,from+499);
     if(params.eq)q=q.eq(params.eq[0],params.eq[1]);
     const {data,error}=await q;
     if(error)throw error;
     all.push(...(data||[]));
     if((data||[]).length<500)break;
   }
   return all;
 }
 async function summary(){
   const {data,error}=await sb.from('gtk_public_bkn_runs')
     .select('id,status,completed_at,source_districts,source_schools,matched_schools,unmatched_schools,matched_total_ptk,matched_total_asn')
     .eq('status','COMPLETE').order('completed_at',{ascending:false}).limit(1);
   if(error)throw error;
   latest=data?.[0]||null;
   const area=document.getElementById('gtkBknState');if(!area)return;
   if(!latest){
     area.innerHTML='<div style="font-size:12px;color:#796020">Belum ada snapshot publik yang berhasil disinkronkan. Klik Periksa Sumber dahulu.</div>';
     return;
   }
   const date=new Date(latest.completed_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});
   area.innerHTML='<b>Snapshot '+esc(date)+'</b> • '+fmt(latest.matched_schools)+' NPSN cocok dari '+fmt(latest.source_schools)+' sekolah sumber • '+fmt(latest.matched_total_ptk)+' PTK kohort di laman sekolah • '+fmt(latest.matched_total_asn)+' ASN gabungan Guru/Tendik.'+
     '<div style="font-size:11px;margin-top:5px">PTK pada laman sekolah adalah kohort pemadanan ASN, bukan keseluruhan GTK. Master 7.008 tidak diubah.</div>';
 }
 function feedback(text,isError=false){
   const el=document.getElementById('gtkBknFeedback');if(!el)return;
   el.textContent=text;el.style.color=isError?'#b42318':'#1b5d83';
 }
 async function call(action){
   if(busy||!authorized())return;
   if(action==='sync'&&!confirm('Ambil ulang rekap PTK–ASN publik dari 15 kecamatan Kabupaten Batang? Data asli SIMANTAB tidak akan diubah.'))return;
   busy=true;setButtons(true);
   feedback(action==='preview'?'Menghubungi sumber publik resmi dan memeriksa contoh data…':action==='diagnose'?'Memeriksa selisih ASN Kecamatan Subah tanpa menyimpan data…':'Membaca 15 kecamatan secara bertahap. Mohon tunggu…');
   try{
     const {data,error}=await sb.functions.invoke('simantab-public-ptk-bkn',{body:{action}});
     if(error||data?.ok===false){
       let detail=data?.error||error?.message||'Tidak diketahui';
       if(error?.context?.json)try{const e=await error.context.json();detail=e.error||detail}catch(_){}
       throw Error(detail);
     }
     if(action==='preview'){
       feedback('Sumber dapat dibaca: '+data.example_district+' • '+fmt(data.example_schools)+' sekolah • '+fmt(data.example_ptk)+' PTK pada halaman sekolah dari '+fmt(data.example_ptk_district_total)+' PTK total kecamatan • '+fmt(data.example_asn)+' ASN dari '+fmt(data.example_asn_district_total)+' ASN kecamatan. Data SIMANTAB belum berubah.');
     } else if(action==='diagnose'){
       const area=document.getElementById('gtkBknAuditResult');
       if(area){
         const rows=(data.missing_npsn_examples||[]).map(x=>'<li>'+esc(x.school_name)+' • NPSN: '+esc(x.npsn_display)+' • ASN: '+(x.asn===null?'—':fmt(x.asn))+'</li>').join('');
         const recognized=(data.recognized_letter_npsn||[]).map(x=>'<li>'+esc(x.school_name)+' • NPSN: '+esc(x.npsn)+' • ASN: '+fmt(x.asn)+'</li>').join('');
         area.innerHTML='<div style="padding:10px;background:#fff9ea;border:1px solid #e7c986;border-radius:8px;margin:9px 0">'+
           '<b>Audit '+esc(data.district)+'</b><div style="margin-top:5px">ASN rekap kecamatan: <b>'+fmt(data.district_asn)+'</b> • Jumlah ASN NPSN terbaca: <b>'+fmt(data.parsed_asn)+'</b> • Belum terpetakan: <b>'+fmt(data.unreconciled_asn)+'</b>.</div>'+
           '<div style="margin-top:5px">Sekolah/NPSN terbaca: '+fmt(data.parsed_npsn)+'; baris sekolah tanpa NPSN valid: '+fmt(data.missing_npsn_rows)+'; ASN pada baris tersebut: '+fmt(data.missing_npsn_asn)+'.</div>'+
           (rows?'<details style="margin-top:7px"><summary>Rincian baris NPSN bermasalah</summary><ul>'+rows+'</ul></details>':'')+
           (recognized?'<details open style="margin-top:7px"><summary>NPSN berawalan huruf yang sudah dikenali</summary><ul>'+recognized+'</ul></details>':'')+
           '<div style="margin-top:7px;font-size:11px">Status: <b>'+esc(data.outcome)+'</b>. Hasil ini hanya diagnostik, bukan sinkronisasi. Data master GTK tidak diubah.</div></div>';
       }
       feedback(data.outcome==='MATCH'?'Audit Subah cocok: '+fmt(data.district_asn)+' ASN. NPSN alfanumerik dikenali; SKB tidak otomatis ditambahkan ke master GTK.':'Audit Subah belum cocok: '+fmt(data.unreconciled_asn)+' ASN belum terpetakan; data master tetap aman.');
     } else {
       feedback(data.reused?'Snapshot masih baru; menggunakan hasil sinkron sebelumnya.':
        'Snapshot tersimpan: '+fmt(data.matched_schools)+' sekolah cocok • '+fmt(data.total_asn_matched)+' ASN gabungan.');await summary();
     }
   }catch(e){feedback('Tidak berhasil: '+String(e?.message||e)+'. Snapshot lama tetap aman.',true)}
   finally{busy=false;setButtons(false)}
 }
 function setButtons(disabled){
   for(const id of ['gtkBknProbe','gtkBknAudit','gtkBknSync','gtkBknDetail']){
     const b=document.getElementById(id);if(b)b.disabled=disabled;
   }
 }
 async function detail(){
   if(!authorized()||!latest)return feedback('Belum ada snapshot lengkap untuk ditampilkan.',true);
   if(busy)return;busy=true;setButtons(true);feedback('Mencocokkan snapshot dan master sekolah…');
   try{
     const snap=await rows('gtk_public_bkn_school_snapshot',
       {columns:'npsn,school_name_source,school_status_source,total_ptk,total_asn,district_code',order:'npsn',eq:['run_id',latest.id]});
     const school=await rows('school_master',
       {columns:'npsn,school_name,school_status,bentuk_pendidikan,teachers,staff',order:'npsn'});
     const master=new Map(school.map(x=>[x.npsn,x]));
     const by=snap.map(s=>{
       const m=master.get(s.npsn)||{},level=m.bentuk_pendidikan||'?',gtk=(Number(m.teachers)||0)+(Number(m.staff)||0);
       return {...s,school_name:m.school_name||s.school_name_source,level,gtk}
     }).sort((a,b)=>a.level.localeCompare(b.level,'id')||a.school_name.localeCompare(b.school_name,'id'));
     const root=document.getElementById('gtkBknDetailTable');if(!root)return;
     stats=by;
     root.innerHTML='<h3 style="margin:12px 0 6px">Rekonsiliasi per NPSN</h3>'+
      '<div style="font-size:11px;color:#607588;margin-bottom:6px">PTK pada laman sekolah merupakan kohort pemadanan ASN, bukan semua GTK. Jangan menjumlahkan selisih terhadap GTK master sebagai Non-ASN. Angka ASN masih gabungan Guru dan Tendik.</div>'+
      '<input id="gtkBknSearch" placeholder="Cari nama sekolah atau NPSN…" style="padding:9px;width:100%;max-width:400px;box-sizing:border-box;border-radius:9px;border:1px solid #d1e1ed;margin-bottom:9px">'+
      '<div id="gtkBknResults"></div>';
     const input=document.getElementById('gtkBknSearch');
     const display=()=>{
       const q=input.value.trim().toLowerCase(),hits=by.filter(x=>(x.school_name+' '+x.npsn+' '+x.level).toLowerCase().includes(q));
       const shown=hits.slice(0,80);
       document.getElementById('gtkBknResults').innerHTML=
         '<div style="font-size:11px;color:#677a89;margin:7px 0">Menampilkan '+shown.length+' dari '+hits.length+' sekolah yang sesuai; ketik untuk mempersempit hasil.</div>'+
         '<div style="max-width:100%;overflow:auto"><table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr>'+
         '<th style="text-align:left">NPSN / Sekolah</th><th>Jenjang</th><th>GTK master</th><th>PTK kohort ASN</th><th>ASN publik</th></tr></thead><tbody>'+
         shown.map(x=>'<tr><td style="text-align:left">'+esc(x.npsn)+'<div>'+esc(x.school_name)+'</div></td><td>'+esc(x.level)+'</td>'+
          '<td>'+fmt(x.gtk)+'</td><td>'+fmt(x.total_ptk)+'</td><td>'+fmt(x.total_asn)+'</td></tr>').join('')+
          ''+
         '</tbody></table></div>';
     };
     input.addEventListener('input',display);display();
     feedback('Rekonsiliasi ASN '+fmt(by.length)+' NPSN dimuat. Jangan menafsirkan selisih PTK kohort dan GTK master sebagai jumlah Non-ASN.');
   }catch(e){feedback('Gagal memuat rincian: '+String(e?.message||e),true)}
   finally{busy=false;setButtons(false)}
 }
 function attach(){
   if(!authorized())return;
   const modal=document.getElementById('gtkDapodikOverlay');
   const box=modal?.querySelector('.gtk-modal');if(!modal||!box||modal.hidden)return;
   if(document.getElementById('gtkBknReconcile'))return;
   const d=document.createElement('section');d.id='gtkBknReconcile';
   d.style.cssText='border-top:1px solid #d7e3ee;margin-top:17px;padding-top:12px;font-size:12px';
   d.innerHTML='<h3 style="margin:0 0 6px">🔄 Sinkronisasi Publik PTK–BKN (Pembanding)</h3>'+
     '<div style="margin:0 0 9px;color:#6b7f92">Sumber resmi: <a target="_blank" rel="noopener noreferrer" href="'+link+'">Rekap PTK–ASN Kabupaten Batang</a>. Ini laporan web publik, <b>bukan API resmi terdokumentasi</b>. Hanya Super Admin/Kabid.</div>'+
     '<div id="gtkBknState" style="padding:9px;background:#f4f8ff;border:1px solid #ddeafa;border-radius:8px">Memeriksa snapshot…</div>'+
     '<div class="gtk-actions" style="margin:12px 0">'+
      '<button id="gtkBknProbe" type="button" class="gtk-action">Periksa Sumber</button>'+
      '<button id="gtkBknAudit" type="button" class="gtk-action">Audit Selisih Subah</button>'+
      '<button id="gtkBknSync" type="button" class="gtk-action">Sinkronkan Snapshot</button>'+
      '<button id="gtkBknDetail" type="button" class="gtk-action">Lihat Perbandingan NPSN</button></div>'+
     '<div id="gtkBknFeedback" aria-live="polite" style="font-size:11px"></div><div id="gtkBknAuditResult"></div>'+ 
     '<div id="gtkBknDetailTable"></div>';
   box.appendChild(d);
   document.getElementById('gtkBknProbe').onclick=()=>call('preview');
   document.getElementById('gtkBknAudit').onclick=()=>call('diagnose');
   document.getElementById('gtkBknSync').onclick=()=>call('sync');
   document.getElementById('gtkBknDetail').onclick=detail;
   summary().catch(e=>feedback('Belum dapat membaca snapshot: '+String(e.message||e),true));
 }
 let modalObserver=null;
 const observer=new MutationObserver(()=>{
   const modal=document.getElementById('gtkDapodikOverlay');
   if(modal&&!modalObserver){
      modalObserver=new MutationObserver(attach);
      modalObserver.observe(modal,{childList:true,subtree:false});
   }
   attach();
 });
 observer.observe(document.body,{childList:true,subtree:false});
 attach();
 window.__simantabPublicPtkBknRecon={version:4,source:'PUBLIC_WEBPAGE_NOT_API',scope:'school_aggregate',writeMaster:false};
})();
