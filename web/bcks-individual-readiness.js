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

  function statusHtml(row){
    if(!row.attempted)return '<span style="font-weight:850;color:#6b7f90">Belum Simulasi</span>';
    const good=row.readiness_label==="SANGAT_SIAP"||row.readiness_label==="SIAP";
    return '<span class="'+(good?"bcki-ok":"bcki-bad")+'">'+esc(fmt(row.readiness_label))+"</span>";
  }

  function renderRows(rows){
    const tbody=document.getElementById("bckiRows");
    if(!tbody)return;
    const q=String(document.getElementById("bckiSearch")?.value||"").trim().toLowerCase();
    const mode=String(document.getElementById("bckiFilter")?.value||"ALL");
    const filtered=(rows||[]).filter(r=>{
      const hit=!q||String(r.full_name||"").toLowerCase().includes(q)||String(r.unit_kerja||"").toLowerCase().includes(q);
      const ok=mode==="ALL"||(mode==="DONE"&&r.attempted)||(mode==="PENDING"&&!r.attempted);
      return hit&&ok;
    });
    tbody.innerHTML=filtered.length?filtered.map((r,i)=>
      "<tr>"+
      "<td>"+(i+1)+"</td>"+
      "<td><b>"+esc(r.full_name||"-")+"</b><div class='bcki-note'>"+esc(r.unit_kerja||r.school_name||"-")+"</div></td>"+
      "<td>"+esc(r.jenjang||"-")+"</td>"+
      "<td><b>"+(r.attempted?pct(r.score):"-")+"</b></td>"+
      "<td>"+statusHtml(r)+"</td>"+
      "<td>"+esc(r.priority_competency||"-")+"</td>"+
      "<td>"+readinessCell(r,"KEPRIBADIAN")+"</td>"+
      "<td>"+readinessCell(r,"SOSIAL")+"</td>"+
      "<td>"+readinessCell(r,"MANAJERIAL")+"</td>"+
      "<td>"+readinessCell(r,"KEWIRAUSAHAAN")+"</td>"+
      "<td>"+readinessCell(r,"SUPERVISI")+"</td>"+
      "<td>"+(r.attempted?"<button class='bcki-btn' style='margin:0;padding:6px 8px;font-size:10px' data-bcki-docx='"+esc(r.attempt_id)+"'>DOCX</button> <button class='bcki-btn' style='margin:0;padding:6px 8px;font-size:10px' data-bcki-pdf='"+esc(r.attempt_id)+"'>PDF</button>":"-")+"</td>"+
      "</tr>"
    ).join(""):"<tr><td colspan='12' class='bcki-note'>Tidak ada peserta yang sesuai pencarian/filter.</td></tr>";
    const count=document.getElementById("bckiCount");
    if(count)count.textContent=filtered.length+" peserta";
    document.querySelectorAll("[data-bcki-docx]").forEach(b=>b.onclick=()=>downloadResult(b.dataset.bckiDocx,"docx"));
    document.querySelectorAll("[data-bcki-pdf]").forEach(b=>b.onclick=()=>downloadResult(b.dataset.bckiPdf,"pdf"));
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
      const d=await api({action:"kabid_summary"});
      const rows=d.individuals||[];
      const body=document.getElementById("bckiBody");
      body.innerHTML=
        "<div class='bcki-grid'>"+
        "<div class='bcki-card bcki-wide' style='margin:0'><h3>Ruang Lingkup: "+esc(d.scope_label||"Sesuai Kewenangan")+"</h3><div class='bcki-note'>Data individu hanya ditampilkan sesuai kewenangan jenjang akun yang sedang masuk.</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Peserta</div><div class='bcki-num'>"+d.participants+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Sudah Simulasi</div><div class='bcki-num'>"+d.attempted+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Belum</div><div class='bcki-num'>"+d.not_attempted+"</div></div>"+
        "<div class='bcki-stat'><div class='bcki-label'>Rata-rata</div><div class='bcki-num'>"+pct(d.average_score)+"</div></div>"+
        "<div class='bcki-card bcki-wide' style='margin:0'><h3>Daftar Kesiapan Individu</h3>"+
        "<div style='display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 10px'>"+
        "<input id='bckiSearch' type='search' placeholder='Cari nama / unit kerja…' style='flex:1;min-width:210px;padding:10px;border:1px solid #cbd8e3;border-radius:10px'>"+
        "<select id='bckiFilter' style='padding:10px;border:1px solid #cbd8e3;border-radius:10px;background:#fff'><option value='ALL'>Semua</option><option value='DONE'>Sudah Simulasi</option><option value='PENDING'>Belum Simulasi</option></select>"+
        "<span id='bckiCount' class='bcki-note' style='align-self:center;font-weight:850'></span></div>"+
        "<div style='overflow:auto;max-height:470px'><table class='bcki-table' style='min-width:1080px'><thead style='position:sticky;top:0;background:#fff'><tr><th>No</th><th>Peserta / Unit</th><th>Jenjang</th><th>Nilai</th><th>Status</th><th>Prioritas</th><th>Kep</th><th>Sos</th><th>Man</th><th>Kew</th><th>Sup</th><th>Unduh</th></tr></thead><tbody id='bckiRows'></tbody></table></div>"+
        "<div class='bcki-note' style='margin-top:8px'>Kep = Kepribadian • Sos = Sosial • Man = Manajerial • Kew = Kewirausahaan • Sup = Supervisi. Hasil merupakan indikator latihan SIMANTAB, bukan passing grade resmi.</div>"+
        "</div></div>";
      renderRows(rows);
      document.getElementById("bckiSearch").oninput=()=>renderRows(rows);
      document.getElementById("bckiFilter").onchange=()=>renderRows(rows);
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
  window.__simantabBcksIndividualReadiness={version:2,resultExport:true,roles:[...ALLOWED]};
})();