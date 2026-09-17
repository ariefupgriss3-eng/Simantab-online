/* SIMANTAB_SEKDIN_ROLE_OPTION_FIX_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&!window.__simantabProfile;i++)await wait(50);
const isSuper=()=>window.__simantabProfile?.role==='SUPER_ADMIN';
if(!isSuper())return;
function patch(){
 const root=document.getElementById('usersBody');if(!root)return;
 root.querySelectorAll('select').forEach(sel=>{
  const opts=[...sel.options],kadis=opts.find(o=>o.value==='KEPALA_DINAS');
  if(!kadis||opts.some(o=>o.value==='SEKRETARIS_DINAS'))return;
  const o=document.createElement('option');o.value='SEKRETARIS_DINAS';o.textContent='Sekretaris Disdikbud';
  kadis.insertAdjacentElement('afterend',o);
 });
}
function install(){
 const root=document.getElementById('usersBody');if(!root){setTimeout(install,200);return}
 patch();
 if(!window.__sekdinRoleOptionObserver){window.__sekdinRoleOptionObserver=true;new MutationObserver(()=>patch()).observe(root,{childList:true,subtree:true});}
}
const old=window.showTab;
if(typeof old==='function'&&!window.__sekdinRoleShowTabWrap){window.__sekdinRoleShowTabWrap=true;window.showTab=async function(id){const r=await old.apply(this,arguments);if(id==='users')setTimeout(patch,30);return r};}
install();
})();
