/* SIMANTAB_ACTIVITY_PARTICIPANT_IMPORT_SAVE_V1 */
(async()=>{
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<180&&(!window.__simantabSb||!window.showTab||!window.editActivity||!window.saveAuthorizedActivityInput);i++)await wait(50);
const sb=window.__simantabSb,p=()=>window.__simantabProfile||{};if(!sb||!window.saveAuthorizedActivityInput)return;
let editId=null,editInProgress=false,saving=false;
const priorShow=window.showTab;window.showTab=async id=>{if(id==='activities'&&!editInProgress&&!saving)editId=null;return priorShow(id)};
const priorEdit=window.editActivity;window.editActivity=async id=>{editId=id;editInProgress=true;try{return await priorEdit(id)}finally{editInProgress=false}};
const priorCancel=window.cancelActivityEdit;window.cancelActivityEdit=async()=>{editId=null;return priorCancel?priorCancel():window.showTab('activities')};
const baseSave=window.saveAuthorizedActivityInput;
async function persist(rows,idHint,snapshot){let id=idHint;if(!id){let q=sb.from('field_activities').select('id').eq('created_by',p().id).eq('activity_name',snapshot.name).eq('activity_date',snapshot.date).order('created_at',{ascending:false}).limit(1);const {data,error}=await q;if(error)throw error;id=data?.[0]?.id||null}if(!id)throw new Error('Kegiatan berhasil disimpan, tetapi ID kegiatan baru belum ditemukan untuk metadata peserta.');const {error}=await sb.from('field_activities').update({participant_import_data:Array.isArray(rows)?rows:[]}).eq('id',id);if(error)throw error;return id}
window.saveAuthorizedActivityInput=async()=>{const rows=Array.isArray(window.__simantabParticipantImportRows)?structuredClone(window.__simantabParticipantImportRows):[];const idHint=editId;const snapshot={name:document.getElementById('actName')?.value.trim()||'',date:document.getElementById('actDate')?.value||''};saving=true;try{await baseSave()}finally{saving=false}const msg=document.getElementById('actMsg');if(document.getElementById('actName')&&msg?.classList.contains('err'))return;try{if(idHint||rows.length)await persist(rows,idHint,snapshot)}catch(e){console.error('participant_import_data persist failed',e);alert('Kegiatan sudah tersimpan, tetapi detail terstruktur hasil import peserta belum tersimpan: '+(e?.message||'kesalahan tidak diketahui'))}editId=null};
})();