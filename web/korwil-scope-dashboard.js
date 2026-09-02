/* SIMANTEB_KORWIL_SCOPE_DASHBOARD_V2 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabSb||!window.showTab||!window.__simantabProfile);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id),p=()=>window.__simantabProfile||{};if(!sb)return;
const isKorwil=()=>p().role==='PENGAWAS'&&/korwil/i.test(String(p().position||''));
const num=v=>Number(v)||0,fmt=v=>new Intl.NumberFormat('id-ID').format(num(v)),pct=(a,b)=>b?Math.max(0,Math.min(100,Math.round(a/b*100))):0;
const norm=s=>String(s||'').toLowerCase().replace(/^kec[.]?\s*/,'').replace(/^kecamatan\s*/,'').replace(/[^a-z0-9]+/g,' ').trim();
const rawLevel=x=>String(x?.bentuk_pendidikan||x?.jenjang||x?.school_level||'').toUpperCase();
function level(x){const r=rawLevel(x);if(r==='TK')return'TK';if(r==='SD')return'SD';if(r==='PNF'||r==='PKBM'||r==='SKB'||r==='KESETARAAN'||r==='PAUD'||r==='KB'||r==='SPS'||r==='TPA'||/PNF|PKBM|KESETARAAN/.test(r))return'PNF';return r}
const allowed=x=>['TK','SD','PNF'].includes(level(x));
let cache=null,cacheAt=0;
async function resolveDistrict(){const {data,error}=await sb.from('school_master').select('kecamatan').eq('is_active',true);if(error)throw error;const districts=[...new Set((data||[]).map(x=>x.kecamatan).filter(Boolean))],pos=norm(p().position);let best='';for(const d of districts){const dn=norm(d);if(dn&&pos.includes(dn)&&dn.length>norm(best).length)best=d}return best||null}
async function data(force=false){if(cache&&!force&&Date.now()-cacheAt<30000)return cache;const district=await resolveDistrict();if(!district)throw new Error('Kecamatan penugasan Korwil belum dikenali dari profil.');const [{data:schoolRows,error:se},{data:needs,error:ne}]=await Promise.all([
 sb.from('school_master').select('npsn,school_name,bentuk_pendidikan,jenjang,school_status,kecamatan,students,teachers,staff,rombel').eq('is_active',true).eq('kecamatan',district),
 sb.from('school_gtk_needs').select('school_npsn,school_name,school_level,abk,pns,pppk,pppk_pw,asn_total,non_asn_total,gap_riil')
]);if(se)throw se;if(ne)throw ne;const schools=(schoolRows||[]).filter(allowed),npsn=new Set(schools.map(x=>x.npsn));cache={district,schools,needs:(needs||[]).filter(x=>npsn.has(x.school_npsn))};cacheAt=Date.now();return cache}
function bar(label,v,max,cls=''){return `<div class="pkr"><b>${label}</b><div class="pkt"><div class="pkf ${cls}" style="width:${pct(v,max)}%"></div></div><b>${fmt(v)}</b></div>`}
function card(body,label){return [...body.querySelectorAll('.pkk.pk3')].find(x=>x.querySelector('.label')?.textContent.trim()===label)}
async function patch(force=false){
 if(!isKorwil())return;const body=$('dashboardBody');if(!body||!body.querySelector('.pkg'))return;
 const d=await data(force),levels=['TK','SD','PNF'],counts={TK:0,SD:0,PNF:0},need={TK:{abk:0,asn:0,gap:0},SD:{abk:0,asn:0,gap:0},PNF:{abk:0,asn:0,gap:0}};
 let students=0,teachers=0,staff=0,rombel=0,negeri=0;for(const s of d.schools){counts[level(s)]++;students+=num(s.students);teachers+=num(s.teachers);staff+=num(s.staff);rombel+=num(s.rombel);if(String(s.school_status||'').toUpperCase()==='NEGERI')negeri++}
 let abk=0,asn=0,non=0,gap=0;for(const n of d.needs){const l=level(n);if(!need[l])continue;const a=num(n.abk),s=num(n.asn_total),g=Math.max(0,num(n.gap_riil));need[l].abk+=a;need[l].asn+=s;need[l].gap+=g;abk+=a;asn+=s;non+=num(n.non_asn_total);gap+=g}
 const desc=$('dashDesc');if(desc)desc.textContent=`Infografis ketenagaan Korwil: TK, SD, dan PNF di ${d.district.replace(/^Kec\.\s*/i,'Kecamatan ')}.`;
 const schoolCard=card(body,'Sekolah');if(schoolCard){const v=schoolCard.querySelector('.pkv'),sub=schoolCard.querySelector('.pks');if(v)v.textContent=fmt(d.schools.length);if(sub)sub.innerHTML=`TK ${fmt(counts.TK)} • SD ${fmt(counts.SD)} • PNF ${fmt(counts.PNF)}<br>Negeri ${fmt(negeri)} • Swasta ${fmt(d.schools.length-negeri)}`}
 const guruCard=card(body,'Guru');if(guruCard){const v=guruCard.querySelector('.pkv'),sub=guruCard.querySelector('.pks');if(v)v.textContent=fmt(teachers);if(sub)sub.innerHTML=`Tendik ${fmt(staff)} • Siswa ${fmt(students)} • Rombel ${fmt(rombel)}`}
 const abkCard=card(body,'Kebutuhan/ABK');if(abkCard){const v=abkCard.querySelector('.pkv'),sub=abkCard.querySelector('.pks');if(v)v.textContent=fmt(abk);if(sub)sub.innerHTML=`ASN tersedia ${fmt(asn)} • Non-ASN ${fmt(non)} • Cakupan ${fmt(new Set(d.needs.map(x=>x.school_npsn)).size)}/${fmt(d.schools.length)} sekolah`}
 const gapCard=card(body,'Kekurangan GTK');if(gapCard){const v=gapCard.querySelector('.pkv'),sub=gapCard.querySelector('.pks');if(v)v.textContent=fmt(gap);if(sub)sub.textContent='Gap riil agregat TK, SD, dan PNF wilayah Korwil.'}
 const needCard=[...body.querySelectorAll('.pkk')].find(x=>x.querySelector('h2')?.textContent.trim()==='Kebutuhan GTK per Jenjang');if(needCard){const head=needCard.querySelector('.pkhead');if(head){const para=head.querySelector('p');if(para)para.textContent='ABK, ASN tersedia, dan gap riil khusus TK, SD, dan PNF di wilayah tugas Korwil.';[...needCard.children].forEach(x=>{if(x!==head)x.remove()});const mx=Math.max(1,...levels.flatMap(l=>[need[l].abk,need[l].asn,need[l].gap]));for(const l of levels){const div=document.createElement('div');div.style.marginBottom='12px';div.innerHTML=`<b>${l}</b>${bar('ABK',need[l].abk,mx)}${bar('ASN',need[l].asn,mx,'pkgood')}${bar('Gap',need[l].gap,mx,'pkwarn')}`;needCard.appendChild(div)}}}
 const tableCard=[...body.querySelectorAll('.pkk')].find(x=>x.querySelector('h2')?.textContent.trim()==='Sekolah Binaan/Wilayah Tugas');if(tableCard){const text=tableCard.querySelector('.pks');if(text)text.textContent='Daftar TK, SD, dan PNF pada kecamatan penugasan Korwil. SMP tidak termasuk kewenangan Korwil.';const tbody=tableCard.querySelector('tbody');if(tbody)tbody.innerHTML=d.schools.slice(0,100).map(s=>`<tr><td><b>${String(s.school_name||'')}</b><br><span class="pks">${String(s.npsn||'')}</span></td><td>${level(s)}</td><td>${String(s.school_status||'-')}</td><td>${fmt(s.students)}</td><td>${fmt(s.teachers)}</td><td>${fmt(s.staff)}</td><td>${fmt(s.rombel)}</td></tr>`).join('')}
 const hero=body.querySelector('.pkh');if(hero){let badge=hero.querySelector('[data-korwil-scope]');if(!badge){badge=document.createElement('div');badge.dataset.korwilScope='1';badge.style.cssText='margin-top:10px;font-size:11px;font-weight:900;background:#ffffff22;border:1px solid #ffffff44;border-radius:999px;padding:6px 10px;display:inline-block';hero.appendChild(badge)}badge.textContent=`Cakupan Korwil: TK • SD • PNF • ${d.district.replace(/^Kec\.\s*/i,'Kecamatan ')}`}
}
const prevShow=window.showTab;window.showTab=async id=>{const r=await prevShow(id);if(id==='dashboard'&&isKorwil()){await wait(100);await patch()}return r};
const prevRefresh=window.refreshAll;if(prevRefresh)window.refreshAll=async(...args)=>{const r=await prevRefresh(...args);if(isKorwil()&&$('dashboard')?.classList.contains('active')){cache=null;await patch(true)}return r};
if(isKorwil()&&$('dashboard')?.classList.contains('active')){await wait(220);await patch()}
window.__simantebKorwilScope={version:2,levels:['TK','SD','PNF'],exclude:['SMP'],backendRls:true,directSchoolMasterMetrics:true};
})();