/* SIMANTAB_PREMIUM_TWO_THINKING_V1 */
(()=>{
const getSb=()=>window.__simantabSb||null;
const profile=()=>window.__simantabProfile||{};
window.__simantabPremiumTwoThinkingReady=true;
const LETTERS=["A","B","C","D","E"];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const bank=()=>new Map((window.__simantabPremiumTwoV1||[]).map(q=>[Number(q[0]),q]));
async function invoke(body){
 const sb=getSb();
 if(!sb)throw new Error("Sistem belum siap. Tutup modul, tunggu beberapa detik, lalu buka kembali.");
 let {data,error}=await sb.functions.invoke("simantab-bcks-thinking",{body});
 if(error){
  let detail=data?.error;
  try{const p=await error.context?.clone()?.json();detail=p?.error||detail}catch{}
  if(/jwt\s*expired|expired\s*jwt/i.test(String(detail||error.message||""))){
   await sb.auth.refreshSession();
   ({data,error}=await sb.functions.invoke("simantab-bcks-thinking",{body}));
  }
 }
 if(error)throw new Error(data?.error||error.message||"AI Coach Premium sedang bermasalah.");
 if(data?.error)throw new Error(data.error);
 return data;
}
function ensureStyle(){
 if(document.getElementById("premiumThinkingTwoV1Style"))return;
 const st=document.createElement("style");st.id="premiumThinkingTwoV1Style";
 st.textContent=".ptv5-overlay{position:fixed;inset:0;background:#071526b8;z-index:100200;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow:auto}.ptv5-modal{width:min(900px,100%);background:#fff;border-radius:18px;padding:18px;box-shadow:0 24px 70px #00152f55;margin:auto}.ptv5-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.ptv5-card{border:1px solid #c8dced;background:#f8fbfe;border-radius:14px;padding:14px;margin:12px 0}.ptv5-note{font-size:12px;line-height:1.6;color:#4e6578}.ptv5-q{font-size:15px;line-height:1.65;font-weight:700;color:#153c62}.ptv5-opt{display:flex;gap:8px;align-items:flex-start;padding:9px 10px;margin:6px 0;border:1px solid #d6e3ed;border-radius:10px;background:white}.ptv5-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.ptv5-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:800;background:#0f5f9d;color:#fff;cursor:pointer}.ptv5-btn.soft{background:#e7f1f8;color:#174e76}.ptv5-btn:disabled{opacity:.5;cursor:not-allowed}.ptv5-text{width:100%;box-sizing:border-box;border:1px solid #bdd1e2;border-radius:10px;padding:11px;font:inherit}.ptv5-good{border-color:#9ad8b4;background:#f1fcf5}.ptv5-warn{border-color:#efd08b;background:#fff9ea}.ptv5-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#e5f1fa;color:#17537e;font-size:11px;font-weight:800}.ptv5-status{font-weight:800;color:#174e76}";
 document.head.appendChild(st);
}
function statusText(s){
 return s==="TRANSFER_MASTERED"?"Pemahaman berhasil diterapkan pada konteks baru.":
 s==="PARTIAL_TRANSFER"?"Arah berpikir sudah berkembang, tetapi transfernya belum sepenuhnya stabil.":
 s==="NOT_YET"?"Konsep masih perlu diperkuat pada konteks baru.":"";
}
function overlay(){
 ensureStyle();
 let el=document.getElementById("premiumThinkingTwoV1Overlay");
 if(!el){el=document.createElement("div");el.id="premiumThinkingTwoV1Overlay";el.className="ptv5-overlay";document.body.appendChild(el)}
 return el;
}
function close(){document.getElementById("premiumThinkingTwoV1Overlay")?.remove()}

window.__simantabPremiumTwoThinkingV1=async function(attemptId){
 let data;
 try{data=await invoke({action:"items",attempt_id:attemptId})}catch(e){alert(e.message||e);return true}
 if(!data?.premium_two_v1)return false;
 let rows=data.rows||[];
 if(!rows.length){alert("Belum ada jawaban Premium Two yang dapat dipelajari.");return true}
 let current=rows.find(r=>!r.transfer_status)||rows[0];
 const states=new Map();
 const stateFor=qno=>{
  if(!states.has(qno))states.set(qno,{hint:Math.max(1,Number(rows.find(r=>r.question_no===qno)?.highest_hint||0)||1),coach:null,reflection:"",retry:"",reinforcement:"",transferQuestion:"",transferResponse:"",result:null,busy:false,message:""});
  return states.get(qno);
 };
 async function refresh(){
  const d=await invoke({action:"items",attempt_id:attemptId});
  rows=d.rows||rows;
  current=rows.find(r=>r.question_no===current.question_no)||current;
 }
 function render(){
  const q=bank().get(Number(current.question_no)),st=stateFor(current.question_no),el=overlay();
  if(!q){el.innerHTML='<div class="ptv5-modal"><b>Data soal Premium Two tidak ditemukan.</b><div class="ptv5-actions"><button class="ptv5-btn" id="ptv5Close">Tutup</button></div></div>';document.getElementById("ptv5Close").onclick=close;return}
  const initIdx=LETTERS.indexOf(String(current.selected_option||""));
  const initText=initIdx>=0?q[3][initIdx]:"Belum dijawab";
  const completed=!!current.transfer_status||!!st.result;
  let html='<div class="ptv5-modal"><div class="ptv5-head"><div><h2 style="margin:0;color:#103f68">Thinking Culture • Premium Two</h2><div class="ptv5-note">FAKTA → MASALAH → AKAR → PRINSIP → PRIORITAS → DAMPAK</div></div><button class="ptv5-btn soft" id="ptv5Close">Tutup</button></div>';
  html+='<div class="ptv5-card"><label><b>Pilih kasus untuk dipelajari</b></label><select id="ptv5Case" class="ptv5-text" style="margin-top:7px">'+rows.map(r=>'<option value="'+r.question_no+'" '+(r.question_no===current.question_no?'selected':'')+'>Soal '+r.display_no+(r.transfer_status?' · selesai':'')+'</option>').join("")+'</select>';
  html+='<div class="ptv5-q" style="margin-top:12px">'+esc(q[2])+'</div><div class="ptv5-note" style="margin-top:8px"><b>Jawaban awal:</b> '+esc(current.selected_option||"-")+'. '+esc(initText)+'</div><div class="ptv5-note"><b>Catatan:</b> jawaban pertama tetap menjadi nilai simulasi. Thinking Culture adalah proses belajar setelah tes.</div></div>';
  if(completed){
   const status=st.result?.transfer_status||current.transfer_status;
   html+='<div class="ptv5-card ptv5-good"><span class="ptv5-badge">Cek Pemahaman</span><h3>'+esc(statusText(status))+'</h3>'+(st.result?.feedback?'<div class="ptv5-note">'+esc(st.result.feedback)+'</div>':'')+'<div class="ptv5-actions"><button class="ptv5-btn" id="ptv5NextCase">Pelajari kasus berikutnya</button></div></div>';
  }else{
   html+='<div class="ptv5-card"><span class="ptv5-badge">AI Coach · H'+st.hint+'</span>';
   if(st.coach){
    html+='<h3 style="margin-bottom:6px">Petunjuk reflektif</h3><div class="ptv5-note" style="font-size:13px">'+esc(st.coach.coach_message)+'</div><p><b>'+esc(st.coach.reflection_question)+'</b></p>';
   }else{
    html+='<h3>Mulai dari alasan keputusan Anda</h3><div class="ptv5-note">AI Coach tidak akan memberikan kunci. Ia membantu menemukan fakta yang terlewat, akar masalah, prinsip, dan prioritas keputusan.</div>';
   }
   html+='<textarea id="ptv5Reflection" class="ptv5-text" rows="3" maxlength="3000" placeholder="Tuliskan alasan atau refleksi singkat Anda...">'+esc(st.reflection)+'</textarea>';
   if(st.coach&&st.coach.next_action!=="GO_TO_TRANSFER"){
    html+='<div style="margin-top:12px"><b>Keputusan ulang</b><div class="ptv5-note">Pilih kembali setelah mempertimbangkan petunjuk. Ini tidak mengubah nilai simulasi.</div>'+q[3].map((v,i)=>'<label class="ptv5-opt"><input type="radio" name="ptv5Retry" value="'+LETTERS[i]+'" '+(st.retry===LETTERS[i]?'checked':'')+'><b>'+LETTERS[i]+'.</b><span>'+esc(v)+'</span></label>').join("")+'</div>';
   }
   if(st.message)html+='<div class="ptv5-card ptv5-warn">'+esc(st.message)+'</div>';
   if(st.reinforcement)html+='<div class="ptv5-card ptv5-good"><b>Penguatan</b><div class="ptv5-note" style="margin-top:5px">'+esc(st.reinforcement)+'</div></div>';
   const tq=st.transferQuestion||(st.coach?.next_action==="GO_TO_TRANSFER"?st.coach.transfer_question:"");
   if(tq){
    html+='<div class="ptv5-card ptv5-good"><span class="ptv5-badge">Cek Pemahaman / Transfer</span><p><b>'+esc(tq)+'</b></p><textarea id="ptv5Transfer" class="ptv5-text" rows="4" maxlength="4000" placeholder="Jawab dengan kata-kata Anda dan jelaskan alasannya...">'+esc(st.transferResponse)+'</textarea><div class="ptv5-actions"><button class="ptv5-btn" id="ptv5Eval" '+(st.busy?'disabled':'')+'>Nilai pemahaman</button></div></div>';
   }else{
    html+='<div class="ptv5-actions">'+(!st.coach?'<button class="ptv5-btn" id="ptv5Hint">Mulai AI Coach</button>':'<button class="ptv5-btn soft" id="ptv5Hint">'+(st.hint<4?'Petunjuk berikutnya (H'+Math.min(4,st.hint+1)+')':'Ulangi refleksi H4')+'</button><button class="ptv5-btn" id="ptv5Retry">Uji keputusan ulang</button>')+'</div>';
   }
   html+='</div>';
  }
  html+='</div>';el.innerHTML=html;
  document.getElementById("ptv5Close").onclick=close;
  document.getElementById("ptv5Case").onchange=e=>{current=rows.find(r=>r.question_no===Number(e.target.value))||current;render()};
  const refl=document.getElementById("ptv5Reflection");if(refl)refl.oninput=e=>{st.reflection=e.target.value};
  document.querySelectorAll('input[name="ptv5Retry"]').forEach(x=>x.onchange=e=>{st.retry=e.target.value});
  const hintBtn=document.getElementById("ptv5Hint");
  if(hintBtn)hintBtn.onclick=async()=>{
    if(st.busy)return;st.busy=true;hintBtn.disabled=true;
    try{
      const h=st.coach?Math.min(4,st.hint+1):st.hint;
      const out=await invoke({action:"coach_step",attempt_id:attemptId,question_no:current.question_no,hint_level:h,stimulus_soal:q[2],pertanyaan:q[2],opsi_yang_dipilih:initText,competency:q[1]});
      st.hint=h;st.coach=out;st.message="";
      if(out.next_action==="GO_TO_TRANSFER"){st.transferQuestion=out.transfer_question;st.reinforcement=out.coach_message}
    }catch(e){st.message=e.message||String(e)}finally{st.busy=false;render()}
  };
  const retryBtn=document.getElementById("ptv5Retry");
  if(retryBtn)retryBtn.onclick=async()=>{
    if(!st.retry){st.message="Pilih satu keputusan ulang terlebih dahulu.";render();return}
    if(!st.reflection.trim()){st.message="Tuliskan singkat alasan keputusan ulang Anda.";render();return}
    if(st.busy)return;st.busy=true;render();
    try{
      const retryIdx=LETTERS.indexOf(st.retry);
      const retryText=retryIdx>=0?q[3][retryIdx]:"";
      const out=await invoke({action:"record_recovery",attempt_id:attemptId,question_no:current.question_no,recovery_option:st.retry,
        reasoning_latest:st.reflection,stimulus_soal:q[2],pertanyaan:q[2],opsi_yang_dipilih:retryText,competency:q[1]});
      st.message=out.message||"";
      if(out.recovery_success){
        st.reinforcement=out.reinforcement;st.transferQuestion=out.transfer_question;st.message="";
      }else{
        st.hint=Number(out.next_hint||Math.min(4,st.hint+1));
        if(out.retry_coach_message||out.retry_reflection_question){
          st.coach={
            ...(st.coach||{}),
            coach_message:out.retry_coach_message||st.coach?.coach_message||"",
            reflection_question:out.retry_reflection_question||st.coach?.reflection_question||"",
            next_action:"RETRY_REASONING",
            hint_level:4
          };
          st.retry="";
          st.reflection="";
        }else if(st.hint>=4){
          st.coach={
            ...(st.coach||{}),
            coach_message:"Keputusan ulang Anda sudah diperiksa, tetapi alasan dan prioritasnya belum sepenuhnya menjawab inti kasus. Gunakan prinsip pada H4 untuk membandingkan kembali seluruh pilihan, bukan hanya tindakan yang tampak paling cepat dilakukan.",
            reflection_question:"Pilihan mana yang paling menjaga prinsip utama sekaligus menjawab akar masalah dan dampaknya, bukan hanya salah satu gejalanya?",
            next_action:"RETRY_REASONING",
            hint_level:4
          };
          st.message="H4 telah diperbarui. Pilihan sebelumnya dikosongkan agar Anda dapat menguji kembali keputusan secara sadar.";
          st.retry="";
          st.reflection="";
        }
      }
    }catch(e){st.message=e.message||String(e)}finally{st.busy=false;render()}
  };
  const transfer=document.getElementById("ptv5Transfer");if(transfer)transfer.oninput=e=>{st.transferResponse=e.target.value};
  const evalBtn=document.getElementById("ptv5Eval");
  if(evalBtn)evalBtn.onclick=async()=>{
    if(!st.transferResponse.trim()){st.message="Jawab pertanyaan transfer terlebih dahulu.";render();return}
    if(st.busy)return;st.busy=true;render();
    try{
      st.result=await invoke({action:"evaluate_transfer",attempt_id:attemptId,question_no:current.question_no,participant_response:st.transferResponse});
      await refresh();st.message="";
    }catch(e){st.message=e.message||String(e)}finally{st.busy=false;render()}
  };
  const nextBtn=document.getElementById("ptv5NextCase");
  if(nextBtn)nextBtn.onclick=()=>{
    const next=rows.find(r=>r.question_no!==current.question_no&&!r.transfer_status);
    if(next){current=next;render()}else{alert("Semua kasus yang telah diproses tersimpan. Anda dapat memilih kasus lain dari daftar untuk belajar kembali.")}
  };
 }
 render();
 return true;
};
})();