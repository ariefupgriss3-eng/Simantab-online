/* SIMANTAB_GTK_STUDENT_COLUMN_FINAL_V1 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const num=v=>Number.isFinite(Number(v))?Number(v):0;
let cache=null,cacheAt=0,busy=false,observer=null,retryTimer=null;

async function schoolMap(force=false){
 const now=Date.now();if(cache&&!force&&now-cacheAt<30000)return cache;
 const sb=window.__simantabSb;if(!sb)throw new Error('Koneksi data belum siap.');
 const {data,error}=await sb.from('school_master').select('npsn,students,rombel').eq('is_active',true);
 if(error)throw error;
 cache=new Map((data||[]).map(x=>[String(x.npsn||''),{students:num(x.students),rombel:num(x.rombel)}]));
 cacheAt=now;return cache;
}
function headerIndex(table,re){
 return [...table.querySelectorAll('thead th')].findIndex(th=>re.test(String(th.textContent||'').trim()));
}
function insertCellAt(tr,index){
 const td=document.createElement('td');
 if(index>=0&&index<tr.cells.length)tr.insertBefore(td,tr.cells[index]);else tr.appendChild(td);
 return td;
}
async function patchTable(force=false){
 if(busy)return false;
 const table=$('simNeedsSchoolTable');if(!table)return false;
 const headRow=table.querySelector('thead tr');if(!headRow)return false;
 busy=true;
 try{
  const map=await schoolMap(force);
  let studentIndex=headerIndex(table,/^jumlah\s*siswa$|^siswa$/i);
  let rombelIndex=headerIndex(table,/^(jumlah\s*)?rombel$/i);
  if(rombelIndex<0)return false;
  if(studentIndex<0){
   const th=document.createElement('th');th.textContent='Jumlah Siswa';th.dataset.studentFinal='1';
   const rombelTh=[...headRow.children][rombelIndex];
   headRow.insertBefore(th,rombelTh);
  }
  studentIndex=headerIndex(table,/^jumlah\s*siswa$|^siswa$/i);
  rombelIndex=headerIndex(table,/^(jumlah\s*)?rombel$/i);
  for(const tr of table.querySelectorAll('tbody>tr')){
   const npsn=(String(tr.cells?.[0]?.textContent||tr.textContent||'').match(/\b\d{8}\b/)||[])[0];
   if(!npsn)continue;
   while(tr.cells.length<headRow.children.length)insertCellAt(tr,studentIndex);
   const rec=map.get(npsn);
   const cells=[...tr.cells];
   const studentCell=cells[studentIndex];
   const rombelCell=cells[rombelIndex];
   if(studentCell){studentCell.dataset.studentFinal='1';studentCell.innerHTML='<b>'+String(rec?.students??0)+'</b>'}
   if(rombelCell&&rec)rombelCell.textContent=String(rec.rombel);
  }
  return true;
 }catch(e){console.error('GTK student final column',e);return false}
 finally{busy=false}
}
async function patchOwnCard(){
 const box=$('simGtkNeedsProgress');if(!box)return false;
 const rombel=[...box.querySelectorAll('.sim-needs-metric')].find(x=>/jumlah\s*rombel/i.test(String(x.querySelector('span')?.textContent||'')));
 if(!rombel)return false;
 const has=[...box.querySelectorAll('.sim-needs-metric')].some(x=>/jumlah\s*siswa/i.test(String(x.querySelector('span')?.textContent||'')));
 if(has)return true;
 const npsn=String(window.__simantabProfile?.school_npsn||'');if(!npsn)return false;
 try{
  const map=await schoolMap(false),rec=map.get(npsn);
  const card=document.createElement('div');card.className='sim-needs-metric';card.innerHTML='<span>Jumlah Siswa</span><b>'+String(rec?.students??0)+'</b>';
  rombel.insertAdjacentElement('beforebegin',card);return true;
 }catch(e){return false}
}
async function patch(force=false){const a=await patchTable(force);const b=await patchOwnCard();return a||b}
function observe(){
 const target=$('needs');if(!target)return false;
 if(observer)observer.disconnect();
 observer=new MutationObserver(()=>{clearTimeout(retryTimer);retryTimer=setTimeout(()=>patch(false),60)});
 observer.observe(target,{childList:true,subtree:true});
 return true;
}
function hook(){
 if(window.__simantabGtkStudentColumnHooked)return;
 const original=window.showTab;
 if(typeof original==='function'){
  window.showTab=async function(id){
   const r=await original.apply(this,arguments);
   if(id==='needs'){setTimeout(()=>patch(true),120);setTimeout(()=>patch(false),650)}
   return r;
  };
 }
 window.__simantabGtkStudentColumnHooked=true;
}
function boot(attempt=0){
 if(attempt>80)return;
 if(window.__simantabSb){observe();hook();patch(true);return}
 setTimeout(()=>boot(attempt+1),150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot(),{once:true});else boot();
window.__simantabGtkStudentColumnFinal={version:1,authoritative:true,source:'school_master.students'};
})();