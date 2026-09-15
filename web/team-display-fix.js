/* SIMANTAB_TEAM_DISPLAY_FIX_V1 */
(()=>{
  const fix=()=>{
    const root=document.getElementById('team');
    if(!root)return;
    root.querySelectorAll('*').forEach(el=>{
      if(el.childElementCount===0&&el.textContent?.trim()==='Agus Arfianto') el.textContent='Agus Arifianto';
    });
  };
  const start=()=>{
    fix();
    const root=document.getElementById('team');
    if(root)new MutationObserver(fix).observe(root,{childList:true,subtree:true,characterData:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
