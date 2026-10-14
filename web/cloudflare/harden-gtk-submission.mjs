import fs from 'node:fs/promises';
import path from 'node:path';

/* SIMANTAB_CLOUDFLARE_GENERIC_SUBMISSION_OWNER_V1
 * Verify authenticated owner before generic GTK submission and document upload.
 * Leave existing database security policies unchanged.
 */
const filename = path.join('.vercel', 'output', 'static', 'index.html');
let html = await fs.readFile(filename, 'utf8');
const begin = 'window.sendSubmission=async()=>{';
const end = '\nasync function loadStatus(){';
if (html.split(begin).length !== 2) throw new Error('Generic submission handler must be unique.');
const start = html.indexOf(begin);
const finish = html.indexOf(end, start);
if (finish < 0) throw new Error('Generic submission handler end is missing.');
let fn = html.slice(start, finish);
function once(oldText, replacement) {
  if (fn.split(oldText).length !== 2) throw new Error('Submission patch anchor missing or duplicated: ' + oldText.slice(0,80));
  fn = fn.replace(oldText,replacement);
}
once(
  " try{\n  const {data:sub,error}=await sb.from('submissions').insert({user_id:profile.id,",
  " try{\n"
  + "  const {data:authData,error:authError}=await sb.auth.getUser();\n"
  + "  const ownerId=authData?.user?.id;\n"
  + "  if(authError||!ownerId)throw new Error('Sesi login sudah tidak valid. Silakan keluar dan masuk kembali sebelum mengirim usulan.');\n"
  + "  if(!profile?.id||profile.id!==ownerId)throw new Error('Sesi login tidak sesuai dengan profil pemohon. Keluar dan masuk kembali sebagai pemohon yang benar.');\n"
  + "  const {data:verifiedProfile,error:verifiedError}=await sb.from('profiles').select('id,is_active,approval_status,role').eq('id',ownerId).single();\n"
  + "  if(verifiedError||!verifiedProfile||verifiedProfile.is_active!==true||verifiedProfile.approval_status!=='APPROVED')throw new Error('Akun pemohon belum aktif/disetujui atau statusnya gagal diverifikasi. Hubungi admin SIMANTAB.');\n"
  + "  if(['OPERATOR_KORWIL','OPERATOR_SMP'].includes(verifiedProfile.role))throw new Error('Operator institusi tidak dapat mengirim usulan GTK atas nama pengguna lain. Gunakan alur verifikasi operator.');\n"
  + "  const {data:sub,error}=await sb.from('submissions').insert({user_id:ownerId,"
);
const oldPath = new RegExp('const path=\\x60[^\\x60]*profile\\.id[^\\x60]*\\x60;');
if(!oldPath.test(fn))throw new Error('Upload owner path cannot be found.');
fn = fn.replace(oldPath,x=>x.replace('profile.id','ownerId'));
once('submission_id:sub.id,user_id:profile.id,storage_path:path',
     'submission_id:sub.id,user_id:ownerId,storage_path:path');
once("}catch(e){$('subMsg').className='err';$('subMsg').textContent=e.message||String(e)}finally{",
     "}catch(e){$('subMsg').className='err';$('subMsg').textContent=(e?.code==='42501'||/row.level.security/i.test(e?.message||''))?'Usulan belum tersimpan karena permintaan ditolak keamanan database. Jangan klik Kirim berulang kali; hubungi admin SIMANTAB.':(e.message||String(e))}finally{");
if(fn.includes('user_id:profile.id'))throw new Error('Unverified profile ID still inserted.');
html = html.slice(0,start)+fn+html.slice(finish);
await fs.writeFile(filename,html,'utf8');
console.log(JSON.stringify({genericSubmissionAuthOwner:true,operatorProtected:true,rlsUnchanged:true}));
