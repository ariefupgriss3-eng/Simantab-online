/* SIMANTAB_PRIVATE_SCHOOL_SERVICE_ACCESS_V1 */
/* SIMANTAB_PRIVATE_SCHOOL_SERVICE_ACCESS_V2 */
/* SIMANTAB_PRIVATE_SCHOOL_SERVICE_ACCESS_V3 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<160&&(!window.__simantabSb||!window.showTab);i++)await wait(50);
const sb=window.__simantabSb,$=id=>document.getElementById(id);if(!sb)return;
const p=()=>window.__simantabProfile||{};
const SCHOOL_ROLES=new Set(['GTK','KEPALA_SEKOLAH']);
const isSchoolSide=()=>SCHOOL_ROLES.has(String(p().role||'').toUpperCase());
const ALLOWED_TABS=new Set(['profile','tpg','attendance','offlineConsultation','status','docs','notifications','newSubmission']);
const ALLOWED_SERVICES=new Set(['TPG_KONSULTASI','PTK_BARU_SWASTA']);
let school=null,isPrivate=false,isNegeri=false;

async function resolveSchool(force=false){
 if(!isSchoolSide()){school=null;isPrivate=false;isNegeri=false;return null}
 if(school&&!force)return school;
 const n=String(p().school_npsn||'').trim();
 if(!n){school=null;isPrivate=false;isNegeri=false;return null}
 const {data,error}=await sb.from('school_master').select('npsn,school_name,school_status,bentuk_pendidikan,jenjang,kecamatan').eq('npsn',n).eq('is_active',true).maybeSingle();
 if(error)throw error;
 school=data||null;
 const st=String(school?.school_status||'').toUpperCase();
 isPrivate=st==='SWASTA';isNegeri=st==='NEGERI';
 window.__simantabSchoolAccess={school,isPrivate,isNegeri,allowedServices:isPrivate?[...ALLOWED_SERVICES]:[],allowedTabs:isPrivate?[...ALLOWED_TABS]:[]};
 return school;
}
function privateNav(){
 if(!isPrivate||!$('nav'))return;
 $('nav').innerHTML=`<div class="navhead">Sekolah Swasta</div>
 <button class="navbtn" data-tab="profile" onclick="showTab('profile')"><span class="ico">♙</span>Profil</button>
 <div class="navhead">Layanan</div>
 <button class="navbtn" data-tab="tpg" onclick="showTab('tpg')"><span class="ico">◉</span>TPG</button>
 <button class="navbtn" onclick="openSubmission('PTK_BARU_SWASTA','Usul PTK Baru Swasta')"><span class="ico">🧑‍🏫</span>Usul PTK Baru</button>
 <button class="navbtn" data-tab="attendance" onclick="showTab('attendance')"><span class="ico">✍️</span>Daftar Hadir Kegiatan</button>
 <button class="navbtn" data-tab="offlineConsultation" onclick="showTab('offlineConsultation')"><span class="ico">🎟️</span>Daftar Konsultasi Luring</button>
 <button class="navbtn" data-tab="status" onclick="showTab('status')"><span class="ico">⌛</span>Status Usulan</button>
 <button class="navbtn" data-tab="docs" onclick="showTab('docs')"><span class="ico">▣</span>Dokumen Saya</button>
 <button class="navbtn" data-tab="notifications" onclick="showTab('notifications')"><span class="ico">🔔</span>Notifikasi</button>`;
}
function enforceTpg(){
 if(!isPrivate)return;
 const body=$('tpgBody');if(!body)return;
 body.querySelectorAll('button').forEach(btn=>{if(/Tamsil|THR|Gaji\s*ke-?13|PTK Baru/i.test(btn.textContent||''))btn.remove()});
 body.querySelectorAll('h2,h3,p,.label,.small').forEach(el=>{if(/TPG\s*\/\s*Tamsil/i.test(el.textContent||''))el.textContent=(el.textContent||'').replace(/TPG\s*\/\s*Tamsil/gi,'TPG')});
 const sec=$('tpg'),h=sec?.querySelector('.head h2'),d=sec?.querySelector('.head p');if(h)h.textContent='TPG';if(d)d.textContent='Layanan TPG untuk satuan pendidikan swasta.';
}
const oldOpen=window.openSubmission;
if(oldOpen&&!window.__privateSchoolOpenWrap){
 window.__privateSchoolOpenWrap=true;
 window.openSubmission=(type,name)=>{
  if(isPrivate&&!ALLOWED_SERVICES.has(type)){alert('Satuan pendidikan swasta hanya dapat menggunakan layanan TPG dan Usul PTK Baru.');return window.showTab('tpg')}
  return oldOpen(type,name);
 };
}
const oldShow=window.showTab;
window.showTab=async id=>{
 await resolveSchool();
 let target=id;
 if(isSchoolSide()&&target==='needs'&&!isNegeri)target='profile';
 if(isPrivate&&!ALLOWED_TABS.has(target))target='profile';
 const r=await oldShow(target);
 await wait(40);
 if(isPrivate){privateNav();if(target==='tpg')enforceTpg()}
 return r;
};
const oldRefresh=window.refreshAll;
if(oldRefresh)window.refreshAll=async(...args)=>{
 const r=await oldRefresh(...args);
 await resolveSchool(true);await wait(40);
 if(isPrivate)privateNav();
 return r;
};
for(let i=0;i<100&&!window.__simantabProfile;i++)await wait(80);
await resolveSchool(true);
if(isPrivate){
 privateNav();
 const active=document.querySelector('.section.active')?.id||'profile';
 if(!ALLOWED_TABS.has(active))await window.showTab('profile');
 else if(active==='tpg')enforceTpg();
}
window.__simantabPrivateSchoolPolicy={version:3,negeriNeedsOnly:true,skbNegeriIncluded:true,privateMenu:['profile','tpg','ptkBaruSwasta','attendance','offlineConsultation','status','docs','notifications'],privateServices:['TPG_KONSULTASI','PTK_BARU_SWASTA'],ptkBaruSwastaOnly:true};
})();