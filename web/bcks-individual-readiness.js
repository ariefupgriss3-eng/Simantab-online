/* SIMANTAB_BCKS_INDIVIDUAL_READINESS_V1 */
(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<300&&(!window.__simantabSb||!window.__simantabProfile);i++)await wait(50);
  const sb=window.__simantabSb;
  const profile=()=>window.__simantabProfile||{};
  if(!sb)return;

  const ALLOWED=new Set(["KABID","KASI_SD","KASI_SMP","SUBKOOR_TK"]);
  const role=String(profile().role||"");
  const isDinas=String(profile().account_channel||"").toUpperCase()==="DINAS";
  if(!isDinas||!ALLOWED.has(role))return;

  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const pct=v=>Number(v||0).toLocaleString("id-ID",{maximumFractionDigits:1});
  const fmt=s=>({SANGAT_SIAP:"Sangat Siap",SIAP:"Siap",PERLU_PENGUATAN:"Perlu Penguatan",PERLU_PENDAMPINGAN_INTENSIF:"Perlu Pendampingan Intensif"}[s]||s||"-");
  const api=async body=>{
    const {data,error}=await sb.functions.invoke("simantab-bcks-substansi",{body});
    if(error)throw new Error(data?.error||error.message||"Layanan kesiapan BCKS bermasalah.");
    if(data?.error)throw new Error(data.error);
    return data;
  };

  const downloadResult=async(attemptId,format)=>{
    try{
      const {data,error}=await sb.functions.invoke("simantab-bcks-result-export",{body:{attempt_id:attemptId,format}});
      if(error)throw new Error(data?.error||error.message||"Gagal membuat dokumen.");
      if(data?.error)throw new Error(data.error);
      const bin=atob(data.base64||"");
      const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      const blob=new Blob([bytes],{type:data.mime||"application/octet-stream"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=data.filename||("Hasil-Simulasi-BCKS."+format);
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
    }catch(e){alert(e.message||e)}
  };

  function style(){
    if(document.getElementById("bcksIndStyle"))return;
    const s=document.createElement("style");
    s.id="bcksIndStyle";
    s.textContent=
      ".bcki-card{margin:12px 0;padding:16px;border:1px solid #c8dff1;border-radius:16px;background:#f8fbff;box-shadow:0 7px 20px #0f3f7610}"+
      ".bcki-card h3{margin:0 0 6px;color:#0f3f76}.bcki-note{font-size:11px;line-height:1.55;color:#5c7084}"+
      ".bcki-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:900;cursor:pointer;background:#155fa8;color:#fff;margin-top:10px}"+
      ".bcki-overlay{position:fixed;inset:0;z-index:100050;background:#06182ee8;padding:14px;display:flex;align-items:stretch;justify-content:center}"+
      ".bcki-modal{width:min(1180px,100%);height:100%;background:#f5f8fb;border-radius:18px;overflow:hidden;display:flex;flex-direction:column}"+
      ".bcki-top{background:#0f3f76;color:#fff;padding:13px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px}.bcki-top h2{font-size:17px;margin:0}"+
      ".bcki-body{padding:14px;overflow:auto;flex:1}.bcki-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px}"+
      ".bcki-stat{grid-column:span 3;background:#fff;border:1px solid #dfe8f0;border-radius:14px;padding:13px}.bcki-wide{grid-column:span 12}"+
      ".bcki-num{font-size:27px;font-weight:950;color:#0f3f76}.bcki-label{font-size:10px;text-transform:uppercase;font-weight:900;color:#6a8094}"+
      ".bcki-table{width:100%;border-collapse:collapse;font-size:11px}.bcki-table th,.bcki-table td{padding:9px;border-bottom:1px solid #e4ebf1;text-align:left;vertical-align:top}"+
      ".bcki-ok{color:#177245;font-weight:900}.bcki-bad{color:#a44528;font-weight:900}"+
      "@media(max-width:800px){.bcki-overlay{padding:0}.bcki-modal{border-radius:0}.bcki-stat{grid-column:span 6}}";
    document.head.appendChild(s);
  }

  function readinessCell(row,comp){
    const v=row&&row.competency_scores&&row.competency_scores[comp]?row.competency_scores[comp].percentage:null;
    return v===null||v===undefined?"-":pct(v)+"%";
  }

  function workflowStatusHtml(row,isCurrent){
    if(isCurrent){
      const st=String(row.attempt_status||"NOT_STARTED");
      if(st==="IN_PROGRESS")return '<span style="font-weight:900;color:#155fa8">Sedang Mengerjakan</span>';
      if(st==="SUBMITTED")return '<span class="bcki-ok">Selesai</span>';
      if(st==="EXPIRED")return '<span class="bcki-bad">Kedaluwarsa</span>';
      return '<span style="font-weight:850;color:#6b7f90">Belum Mulai</span>';
    }
    return row.attempted?'<span class="bcki-ok">Selesai</span>':'<span style="font-weight:850;color:#6b7f90">Belum Simulasi</span>';
  }

  function readinessHtml(row){
    if(!row.readiness_label)return "-";
    const good=row.readiness_label==="SANGAT_SIAP"||row.readiness_label==="SIAP";
    return '<span class="'+(good?"bcki-ok":"bcki-bad")+'">'+esc(fmt(row.readiness_label))+"</span>";
  }

  function telemetryHtml(row,isCurrent){
    if(!isCurrent)return "-";
    const t=row.telemetry||{};
    if(String(row.attempt_status||"NOT_STARTED")==="NOT_STARTED")return "-";
    if(t.indicator==="PERLU_TELAAH")return '<span class="bcki-bad">Perlu Telaah</span>';
    if(Number(t.event_count||0)>0)return '<span class="bcki-ok">Terlacak</span>';
    return '<span style="color:#6b7f90;font-weight:850">Belum Ada</span>';
  }

  let dashboardData=null,currentView="CURRENT";

  function activeRows(){
    return dashboardData?.session_monitoring?.individuals||[];
  }
  function previousRows(){
    return dashboardData?.individuals||[];
  }
  function filterOptions(isCurrent){
    return isCurrent
      ? "<option value='ALL'>Semua</option><option value='DONE'>Sudah Selesai</option><option value='RUNNING'>Sedang Mengerjakan</option><option value='PENDING'>Belum Mulai</option><option value='REVIEW'>Perlu Telaah</option>"
      : "<option value='ALL'>Semua</option><option value='DONE'>Sudah Simulasi</option><option value='PENDING'>Belum Simulasi</option>";
  }

  function renderRows(){
    const tbody=document.getElementById("bckiRows");
    if(!tbody||!dashboardData)return;
    const isCurrent=currentView==="CURRENT";
    const rows=isCurrent?activeRows():previousRows();
    const q=String(document.getElementById("bckiSearch")?.value||"").trim().toLowerCase();
    const mode=String(document.getElementById("bckiFilter")?.value||"ALL");
    const filtered=(rows||[]).filter(r=>{
      const hit=!q||String(r.full_name||"").toLowerCase().includes(q)||String(r.unit_kerja||r.school_name||"").toLowerCase().includes(q);
      let ok=true;
      if(isCurrent){
        const st=String(r.attempt_status||"NOT_STARTED");
        ok=mode==="ALL"||(mode==="DONE"&&st==="SUBMITTED")||(mode==="RUNNING"&&st==="IN_PROGRESS")||(mode==="PENDING"&&st==="NOT_STARTED")||(mode==="REVIEW"&&r.telemetry?.indicator==="PERLU_TELAAH");
      }else{
        ok=mode==="ALL"||(mode==="DONE"&&r.attempted)||(mode==="PENDING"&&!r.attempted);
      }
      return hit&&ok;
    });
    tbody.innerHTML=filtered.length?filtered.map((r,i)=>{
      const done=isCurrent?String(r.attempt_status||"")==="SUBMITTED":!!r.attempted;
      return "<tr>"+
        "<td>"+(i+1)+"</td>"+
        "<td><b>"+esc(r.full_name||"-")+"</b><div class='bcki-note'>"+esc(r.unit_kerja||r.school_name||"-")+"</div></td>"+
        "<td>"+esc(r.jenjang||"-")+"</td>"+
        "<td>"+workflowStatusHtml(r,isCurrent)+"</td>"+
        "<td><b>"+(done&&r.score!==null&&r.score!==undefined?pct(r.score):"-")+"</b></td>"+
        "<td>"+readinessHtml(r)+"</td>"+
        "<td>"+esc(r.priority_competency||"-")+"</td>"+
        "<td>"+readinessCell(r,"KEPRIBADIAN")+"</td>"+
        "<td>"+readinessCell(r,"SOSIAL")+"</td>"+
        "<td>"+readinessCell(r,"MANAJERIAL")+"</td>"+
        "<td>"+readinessCell(r,"KEWIRAUSAHAAN")+"</td>"+
        "<td>"+readinessCell(r,"SUPERVISI")+"</td>"+
        "<td>"+telemetryHtml(r,isCurrent)+"</td>"+
        "<td>"+(done&&r.attempt_id?"<button class='bcki-btn' style='margin:0;padding:6px 8px;font-size:10px' data-bcki-docx='"+esc(r.attempt_id)+"'>DOCX</button> <button class='bcki-btn' style='margin:0;padding:6px 8px;font-size:10px' data-bcki-pdf='"+esc(r.attempt_id)+"'>PDF</button>":"-")+"</td>"+
        "</tr>";
    }).join(""):"<tr><td colspan='14' class='bcki-note'>Tidak ada peserta yang sesuai pencarian/filter.</td></tr>";
    const count=document.getElementById("bckiCount");
    if(count)count.textContent=filtered.length+" peserta";
    document.querySelectorAll("[data-bcki-docx]").forEach(b=>b.onclick=()=>downloadResult(b.dataset.bckiDocx,"docx"));
    document.querySelectorAll("[data-bcki-pdf]").forEach(b=>b.onclick=()=>downloadResult(b.dataset.bckiPdf,"pdf"));
  }

  function renderView(){
    if(!dashboardData)return;
    const isCurrent=currentView==="CURRENT";
    const mon=dashboardData.session_monitoring||{};
    const sess=mon.session||{};
    const prev=dashboardData.previous_session||{};
    const label=isCurrent?(sess.label||"Sesi Aktif"):(prev.label||"Sesi Sebelumnya");
    const stats=document.getElementById("bckiStats");
    const heading=document.getElementById("bckiListTitle");
    const note=document.getElementById("bckiListNote");
    const filter=document.getElementById("bckiFilter");
    document.querySelectorAll("[data-bcki-view]").forEach(b=>{
      const active=b.dataset.bckiView===currentView;
      b.style.background=active?"#155fa8":"#eef5fb";
      b.style.color=active?"#fff":"#155fa8";
    });
    if(isCurrent){
      stats.innerHTML=
        "<div class='bcki-stat'><div class='bcki-label'>Peserta</div><div class='bcki-num'>"+(mon.participants||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Belum Mulai</div><div class='bcki-num'>"+(mon.not_started||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Sedang Mengerjakan</div><div class='bcki-num'>"+(mon.in_progress||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Sudah Selesai</div><div class='bcki-num'>"+(mon.submitted||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Rata-rata Selesai</div><div class='bcki-num'>"+pct(mon.average_score||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Telemetry Terlacak</div><div class='bcki-num'>"+(mon.telemetry?.tracked||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Perlu Telaah</div><div class='bcki-num'>"+(mon.telemetry?.perlu_telaah||0)+"</div></div>";
      heading.textContent="Daftar Individu — "+label;
      note.innerHTML="Menampilkan status dan hasil <b>"+esc(label)+"</b>. Peserta yang masih mengerjakan belum memiliki nilai/kesiapan final. Telemetry hanya indikator untuk telaah manusia.";
    }else{
      stats.innerHTML=
        "<div class='bcki-stat'><div class='bcki-label'>Peserta</div><div class='bcki-num'>"+(dashboardData.participants||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Sudah Simulasi</div><div class='bcki-num'>"+(dashboardData.attempted||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Belum</div><div class='bcki-num'>"+(dashboardData.not_attempted||0)+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Rata-rata</div><div class='bcki-num'>"+pct(dashboardData.average_score||0)+"</div></div>";
      heading.textContent="Daftar Individu — Hasil "+label;
      note.innerHTML="Menampilkan hasil sesi sebelumnya <b>"+esc(label)+"</b>, terpisah dari sesi aktif.";
    }
    filter.innerHTML=filterOptions(isCurrent);
    filter.value="ALL";
    renderRows();
  }

  async function openDashboard(){
    style();
    document.getElementById("bckiOverlay")?.remove();
    const overlay=document.createElement("div");
    overlay.id="bckiOverlay";
    overlay.className="bcki-overlay";
    overlay.innerHTML="<div class='bcki-modal'><div class='bcki-top'><h2>Kesiapan Individu Peserta BCKS</h2><button id='bckiClose' class='bcki-btn' style='margin:0;background:#fff;color:#155fa8'>Tutup</button></div><div class='bcki-body' id='bckiBody'><div class='bcki-card'>Memuat data…</div></div></div>";
    document.body.appendChild(overlay);
    document.getElementById("bckiClose").onclick=()=>overlay.remove();
    try{
      dashboardData=await api({action:"kabid_summary"});
      currentView="CURRENT";
      const d=dashboardData;
      const mon=d.session_monitoring||{};
      const sess=mon.session||{};
      const prev=d.previous_session||{};
      const body=document.getElementById("bckiBody");
      body.innerHTML=
        "<div class='bcki-grid'>"+
        "<div class='bcki-card bcki-wide' style='margin:0'><h3>Ruang Lingkup: "+esc(d.scope_label||"Sesuai Kewenangan")+"</h3><div class='bcki-note'>Data individu hanya ditampilkan sesuai kewenangan jenjang akun yang sedang masuk.</div>"+
        "<div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px'>"+
        "<button class='bcki-btn' style='margin:0' data-bcki-view='CURRENT'>"+esc(sess.label||"Sesi Aktif")+" • "+(mon.is_active?"Sesi Aktif":"Monitoring")+"</button>"+
        (prev?.label?"<button class='bcki-btn' style='margin:0;background:#eef5fb;color:#155fa8' data-bcki-view='PREVIOUS'>"+esc(prev.label)+" • Hasil Sebelumnya</button>":"")+
        "</div></div>"+
        "<div id='bckiStats' class='bcki-wide bcki-grid' style='grid-column:span 12'></div>"+
        "<div class='bcki-card bcki-wide' style='margin:0'><h3 id='bckiListTitle'>Daftar Individu</h3><div id='bckiListNote' class='bcki-note'></div>"+
        "<div style='display:flex;gap:8px;flex-wrap:wrap;margin:10px 0'>"+
        "<input id='bckiSearch' type='search' placeholder='Cari nama / unit kerja…' style='flex:1;min-width:210px;padding:10px;border:1px solid #cbd8e3;border-radius:10px'>"+
        "<select id='bckiFilter' style='padding:10px;border:1px solid #cbd8e3;border-radius:10px;background:#fff'></select>"+
        "<span id='bckiCount' class='bcki-note' style='align-self:center;font-weight:850'></span></div>"+
        "<div style='overflow:auto;max-height:470px'><table class='bcki-table' style='min-width:1320px'><thead style='position:sticky;top:0;background:#fff'><tr><th>No</th><th>Peserta / Unit</th><th>Jenjang</th><th>Status</th><th>Nilai</th><th>Kesiapan</th><th>Prioritas</th><th>Kep</th><th>Sos</th><th>Man</th><th>Kew</th><th>Sup</th><th>Telemetry</th><th>Unduh</th></tr></thead><tbody id='bckiRows'></tbody></table></div>"+
        "<div class='bcki-note' style='margin-top:8px'>Kep = Kepribadian • Sos = Sosial • Man = Manajerial • Kew = Kewirausahaan • Sup = Supervisi. Telemetry tidak mengubah nilai dan bukan bukti otomatis kecurangan.</div>"+
        "</div></div>";
      document.querySelectorAll("[data-bcki-view]").forEach(b=>b.onclick=()=>{currentView=b.dataset.bckiView;document.getElementById("bckiSearch").value="";renderView()});
      document.getElementById("bckiSearch").oninput=renderRows;
      document.getElementById("bckiFilter").onchange=renderRows;
      renderView();
    }catch(e){
      document.getElementById("bckiBody").innerHTML="<div class='bcki-card'><h3>Data belum dapat dimuat</h3><div class='bcki-note'>"+esc(e.message||e)+"</div></div>";
    }
  }

  let injecting=false;
  async function inject(){
    if(injecting)return;
    const body=document.getElementById("diklatKsBcksBody");
    if(!body)return;
    const existing=[...document.querySelectorAll("#bcksIndividualReadinessCard")];
    if(existing.length){existing.slice(1).forEach(x=>x.remove());return}
    injecting=true;
    try{
      if(document.getElementById("bcksIndividualReadinessCard"))return;
      const status=await api({action:"access_status"});
      if(!status.can_view_readiness)return;
      if(document.getElementById("bcksIndividualReadinessCard"))return;
      const card=document.createElement("div");
      card.id="bcksIndividualReadinessCard";
      card.className="bcki-card";
      card.innerHTML="<h3>👤 Kesiapan Individu Peserta</h3><div class='bcki-note'><b>"+esc(status.scope_label||"Sesuai Kewenangan")+"</b> • lihat nilai, status kesiapan, prioritas penguatan, dan lima kompetensi setiap peserta.</div><button id='bckiOpen' class='bcki-btn'>Lihat Kesiapan Individu</button>";
      const aggregate=document.getElementById("bcksSubstansiSimulatorCard");
      if(aggregate&&aggregate.parentElement===body)aggregate.insertAdjacentElement("afterend",card);
      else if(body.firstElementChild)body.firstElementChild.insertAdjacentElement("afterend",card);
      else body.prepend(card);
      document.getElementById("bckiOpen").onclick=openDashboard;
    }finally{
      injecting=false;
      const dup=[...document.querySelectorAll("#bcksIndividualReadinessCard")];
      dup.slice(1).forEach(x=>x.remove());
    }
  }

  style();
  const observer=new MutationObserver(()=>setTimeout(inject,80));
  observer.observe(document.body,{childList:true,subtree:true});
  for(const ms of [150,500,1200,2200])setTimeout(inject,ms);
  window.__simantabBcksIndividualReadiness={version:3,resultExport:true,roles:[...ALLOWED]};
})();