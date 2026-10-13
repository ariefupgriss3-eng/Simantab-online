/* SIMANTAB_SUPERVISOR_SCOPE_POLICY_V1 */
(()=>{
const norm=v=>String(v||'').toLowerCase().replace(/^kec(?:amatan)?\.?\s*/,'').replace(/[^a-z0-9]+/g,' ').trim();
const classify=s=>{
 const shape=String(s?.bentuk_pendidikan||'').trim().toUpperCase();
 const grade=String(s?.jenjang||'').trim().toUpperCase();
 if(grade==='PNF'||['PNF','PKBM','SKB','SPNF','LKP'].includes(shape))return'PNF';
 if(shape==='TK'||grade==='TK')return'TK';
 if(shape==='SD'||grade==='SD')return'SD';
 if(shape==='SMP'||grade==='SMP')return'SMP';
 return shape||grade||'-';
};
const client=()=>window.__simantabSb;
const profile=()=>window.__simantabProfile||{};
const unique=arr=>[...new Set(arr.filter(Boolean))];
async function get(){
 const p=profile(),sb=client();
 if(!sb||p.role!=='PENGAWAS'||!p.id||p.is_active!==true||p.approval_status!=='APPROVED')
  return {kind:'NONE',reason:'Profil Pengawas belum aktif atau belum disetujui.',unmapped:true};
 // Pimpinan Korwil dikenali dari surat penugasan kecamatan, bukan teks jabatan PENGAWAS SD.
 const {data:grants,error:ge}=await sb.from('discipline_submitter_grants')
  .select('submitter_kind,scope_level,kecamatan,is_active')
  .eq('user_id',p.id).eq('is_active',true);
 if(ge)throw new Error('Penugasan Korwil tidak dapat diverifikasi: '+ge.message);
 const korwil=(grants||[]).filter(x=>x.submitter_kind==='KORWIL'&&x.scope_level==='SD');
 if(korwil.length>1)throw new Error('Penugasan Korwil ganda; hubungi admin.');
 if(korwil.length===1){
  const district=norm(korwil[0].kecamatan);
  if(!district)throw new Error('Kecamatan penugasan Korwil belum diisi.');
  return {kind:'KORWIL',district,levels:['TK','SD','PNF'],source:'penugasan Korwil aktif',unmapped:false};
 }
 const nip=String(p.nip||'').replace(/\D/g,'');
 if(nip.length!==18)return {kind:'PENGAWAS',unmapped:true,reason:'NIP Pengawas belum valid.',levels:[],schoolNpsns:[]};
 const [sd,other]=await Promise.all([
  sb.from('tcs_sd_dabin_reference').select('school_npsn,district').eq('supervisor_nip',nip).eq('is_active',true),
  sb.from('supervisor_dabin_reference').select('school_npsn,district,education_level').eq('supervisor_nip',nip).eq('is_active',true)
 ]);
 if(sd.error||other.error)throw new Error('Referensi Dabin gagal dibaca: '+(sd.error?.message||other.error?.message));
 const assignments=new Map(),districts=[];
 for(const r of sd.data||[]){
  if(r.school_npsn)assignments.set(String(r.school_npsn).trim(),'SD');
  if(r.district)districts.push(norm(r.district));
 }
 for(const r of other.data||[]){
  const level=String(r.education_level||'').trim().toUpperCase();
  if(['TK','SMP'].includes(level)&&r.school_npsn)assignments.set(String(r.school_npsn).trim(),level);
  if(r.district)districts.push(norm(r.district));
 }
 const schoolNpsns=unique([...assignments.keys()]);
 const levels=unique([...assignments.values()]);
 return {kind:'PENGAWAS',source:'referensi Dabin aktif',schoolNpsns,levels,
  level:levels.length===1?levels[0]:null,levelByNpsn:assignments,
  district:unique(districts).join(', '),unmapped:schoolNpsns.length===0,
  reason:schoolNpsns.length?'':'Tidak ada sekolah Dabin aktif untuk NIP Pengawas ini.'};
}
async function schoolRows(){
 const sb=client(),scope=await get();
 if(scope.unmapped)return {scope,schools:[]};
 const cols='npsn,school_name,school_status,bentuk_pendidikan,jenjang,kecamatan,students,teachers,staff,rombel,is_active';
 let result=[];
 if(scope.kind==='KORWIL'){
  // The profile unit is a Dinas name; district comes ONLY from active Korwil assignment.
  const districtName='Kec. '+scope.district;
  const exact=await sb.from('school_master').select(cols).eq('is_active',true).ilike('kecamatan',districtName).limit(1600);
  if(exact.error)throw exact.error;
  result=(exact.data||[]).filter(s=>norm(s.kecamatan)===scope.district&&scope.levels.includes(classify(s)));
 }else if(scope.kind==='PENGAWAS'){
  for(let i=0;i<scope.schoolNpsns.length;i+=150){
   const chunk=await sb.from('school_master').select(cols).eq('is_active',true).in('npsn',scope.schoolNpsns.slice(i,i+150));
   if(chunk.error)throw chunk.error;
   result.push(...(chunk.data||[]));
  }
  result=result.filter(s=>scope.levelByNpsn.get(String(s.npsn))===classify(s));
 }
 const seen=new Set();
 result=result.filter(s=>{if(seen.has(s.npsn))return false;seen.add(s.npsn);return true})
  .sort((a,b)=>String(a.school_name||'').localeCompare(String(b.school_name||''),'id'));
 return {scope,schools:result};
}
window.__simantabSupervisorScope={version:1,get,schoolRows,classify};
})();