/* SIMANTAB_KASIM_ROLE_LABEL_V1 */
(()=>{
  const OLD='Staf KP/PAK/Jabfung/SKP-PAK';
  const NEXT='Admin KSPS • KP/PAK/Jabfung/SKP-PAK';
  function normalize(v){return String(v||'').replace(/\s+/g,' ').trim()}
  function apply(){
    const body=normalize(document.body?.innerText||'');
    if(!/\bKasim\b/i.test(body))return;
    document.querySelectorAll('span,div,p,strong,b').forEach(el=>{
      if(el.children.length)return;
      if(normalize(el.textContent)===OLD){
        el.textContent=NEXT;
        el.setAttribute('title','Admin KSPS dan Staf KP/PAK/Jabfung/SKP-PAK');
      }
    });
  }
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;apply()},80)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();
