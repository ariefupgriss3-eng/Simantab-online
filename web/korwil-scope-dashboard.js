/* SIMANTEB_KORWIL_SCOPE_DASHBOARD_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};if(!sb)return;
const isKorwil=()=>p().role==='PENGAWAS'&&/korwil/i.test(String(p().position||''));
const num=v=>Number(v)||0,fmt=v=>new Intl.NumberFormat('id-ID').format(num(v)),pct=(a,b)=>b?Math.max(0,Math.min(100,Math.round(a/b*100))):0;
const rawLevel=x=>String(x?.bentuk_pendidikan||x?.jenjang||x?.school_level||'').toUpperCase();
function level(x){const r=rawLevel(x);if(r==='TK')return'TK';if(r==='SD')return'SD';if(r==='PNF'||r==='PKBM'||r==='SKB'||r==='KESETARAAN'||r==='PAUD'||r==='KB'||r==='SPS'||r==='TPA'||/PNF|PKBM|KESETARAAN/.test(r))return'PNF';return r}
let cache=null,cacheAt=0;
async function data(force=false){if(cache&&!force&&Date.now()-cacheAt<30000)return cache;const [{data:schools,error:se},{data:needs,error:ne}]=await Promise.all([
 sb.from('school_master').select('npsn,bentuk_pendidikan,jenjang,school_status,kecamatan').eq('is_active',true),
 sb.from('school_gtk_needs').select('school_npsn,school_level,abk,asn_total,gap_riil')
]);if(se)throw se;if(ne)throw ne;cache={schools:schools||[],needs:needs||[]};cacheAt=Date.now();return cache}
function bar(label,v,max,cls=''){return `<div class="pkr"><b>${label}</b><div class="pkt"><div class="pkf ${cls}" style="width:${pct(v,max)}%"></div></div><b>${fmt(v)}</b></div>`}
async function patch(force=false){
 if(!isKorwil())return;const body=$('dashboardBody');if(!body||!body.querySelector('.pkg'))return;
 const d=await data(force),levels=['TK','SD','PNF'],counts={TK:0,SD:0,PNF:0},need={TK:{abk:0,asn:0,gap:0},SD:{abk:0,asn:0,gap:0},PNF:{abk:0,asn:0,gap:0}};
 for(const s of d.schools){const l=level(s);if(counts[l]!=null)counts[l]++}
 for(const n of d.needs){const l=level(n);if(!need[l])continue;need[l].abk+=num(n.abk);need[l].asn+=num(n.asn_total);need[l].gap+=Math.max(0,num(n.gap_riil))}
 const desc=$('dashDesc');if(desc)desc.textContent='Infografis ketenagaan Korwil: TK, SD, dan PNF pada kecamatan tempat tugas.';
 const schoolCard=[...body.querySelectorAll('.pkk.pk3')].find(x=>x.querySelector('.label')?.textContent.trim()==='Sekolah');
 if(schoolCard){const sub=schoolCard.querySelector('.pks');if(sub){const negeri=d.schools.filter(x=>String(x.school_status||'').toUpperCase()==='NEGERI').length,swasta=d.schools.length-negeri;sub.innerHTML=`TK ${fmt(counts.TK)} • SD ${fmt(counts.SD)} • PNF ${fmt(counts.PNF)}<br>Negeri ${fmt(negeri)} • Swasta ${fmt(swasta)}`}}
 const needCard=[...body.querySelectorAll('.pkk')].find(x=>x.querySelector('h2')?.textContent.trim()==='Kebutuhan GTK per Jenjang');
 if(needCard){const head=needCard.querySelector('.pkhead');if(head){const para=head.querySelector('p');if(para)para.textContent='ABK, ASN tersedia, dan gap riil khusus TK, SD, dan PNF di wilayah tugas Korwil.';[...needCard.children].forEach(x=>{if(x!==head)x.remove()});const mx=Math.max(1,...levels.flatMap(l=>[need[l].abk,need[l].asn,need[l].gap]));for(const l of levels){const div=document.createElement('div');div.style.marginBottom='12px';div.innerHTML=`<b>${l}</b>${bar('ABK',need[l].abk,mx)}${bar('ASN',need[l].asn,mx,'pkgood')}${bar('Gap',need[l].gap,mx,'pkwarn')}`;needCard.appendChild(div)}}}
 const tableCard=[...body.querySelectorAll('.pkk')].find(x=>x.querySelector('h2')?.textContent.trim()==='Sekolah Binaan/Wilayah Tugas');if(tableCard){const text=tableCard.querySelector('.pks');if(text)text.textContent='Daftar TK, SD, dan PNF pada kecamatan penugasan Korwil. SMP tidak termasuk kewenangan Korwil.'}
 const hero=body.querySelector('.pkh');if(hero&&!hero.querySelector('[data-korwil-scope]')){const badge=document.createElement('div');badge.dataset.korwilScope='1';badge.style.cssText='margin-top:10px;font-size:11px;font-weight:900;background:#ffffff22;border:1px solid #ffffff44;border-radius:999px;padding:6px 10px;display:inline-block';badge.textContent='Cakupan Korwil: TK • SD • PNF';hero.appendChild(badge)}
}
const prevShow=window.showTab;window.showTab=async id=>{const r=await prevShow(id);if(id==='dashboard'&&isKorwil()){await wait(80);await patch()}return r};
const prevRefresh=window.refreshAll;if(prevRefresh)window.refreshAll=async(...args)=>{const r=await prevRefresh(...args);if(isKorwil()&&$('dashboard')?.classList.contains('active')){cache=null;await patch(true)}return r};
if(isKorwil()&&$('dashboard')?.classList.contains('active')){await wait(180);await patch()}
window.__simantebKorwilScope={levels:['TK','SD','PNF'],exclude:['SMP'],backendRls:true};
})();