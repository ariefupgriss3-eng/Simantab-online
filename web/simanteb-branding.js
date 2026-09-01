/* SIMANTEB_BRANDING_V1 */
(()=>{
const replaceText=s=>String(s??'').replace(/SIMANTAB/g,'SIMANTEB').replace(/Simantab/g,'Simanteb').replace(/simantab online/gi,'SIMANTEB Online');
function patchNode(root=document){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(/simantab/i.test(n.nodeValue||''))n.nodeValue=replaceText(n.nodeValue)}
 for(const el of root.querySelectorAll?.('[title],[aria-label],[placeholder]')||[]){for(const a of ['title','aria-label','placeholder']){const v=el.getAttribute(a);if(v&&/simantab/i.test(v))el.setAttribute(a,replaceText(v))}}
 if(/simantab/i.test(document.title||''))document.title=replaceText(document.title);
}
patchNode(document);
const mo=new MutationObserver(ms=>{for(const m of ms){for(const n of m.addedNodes){if(n.nodeType===Node.TEXT_NODE&&/simantab/i.test(n.nodeValue||''))n.nodeValue=replaceText(n.nodeValue);else if(n.nodeType===Node.ELEMENT_NODE)patchNode(n)}}});
mo.observe(document.documentElement,{subtree:true,childList:true});
const originalOpen=window.open.bind(window);
window.open=(...args)=>{const w=originalOpen(...args);try{if(w?.document){const originalWrite=w.document.write.bind(w.document);w.document.write=(...parts)=>originalWrite(...parts.map(x=>typeof x==='string'?replaceText(x):x));}}catch(_){}return w};
window.__simantebBranding={displayName:'SIMANTEB',technicalName:'SIMANTAB'};
})();