/* SIMANTAB_OPERATOR_STAGING_RPC_ADAPTER_V1
 * Not imported by the production build. Only use with the isolated staging DB.
 * Authorization is done server-side by public.operator_create_draft.
 */
const services = new Set(['CUTI','KGB']);
const positions = new Set(['GURU','KEPALA_SEKOLAH']);
function val(x) { return String(x ?? '').trim(); }

export function buildOperatorDraftPayload(form,requestKey) {
  if (!form || typeof form !== 'object') throw new Error('Formulir tidak valid.');
  const service=val(form.service).toUpperCase();
  const position=val(form.position).toUpperCase();
  const name=val(form.name), nip=val(form.nip), npsn=val(form.npsn);
  const title=val(form.title),description=val(form.description);
  if(!services.has(service) || !positions.has(position)) throw new Error('Layanan atau jabatan tidak dikenal.');
  if(!/^[0-9]{8}$/.test(npsn) || !/^[0-9]{8,20}$/.test(nip) || name.length<3 || name.length>180 ||
     title.length>200 || description.length>4000) {
    throw new Error('Data pemohon tidak valid.');
  }
  if(form.attested!==true) throw new Error('Konfirmasi identitas pemohon wajib.');
  if(typeof requestKey!=='string' ||
     !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) {
    throw new Error('Request key UUID tidak valid.');
  }
  // Deliberately does NOT send user_id, role, account name, district or routing.
  // These must be derived on the authenticated server.
  return {
    p_request_key:requestKey,p_npsn:npsn,p_name:name,p_nip:nip,
    p_position:position,p_service_type:service,
    p_title:title||null,p_description:description
  };
}

export async function createOperatorDraftStaging({
  supabase,form,requestKey,stagingEnabled=false
}) {
  if(stagingEnabled!==true) throw new Error('Fitur hanya boleh digunakan di lingkungan staging.');
  if(!supabase || typeof supabase.rpc!=='function') throw new Error('Koneksi Supabase staging tidak tersedia.');
  const payload=buildOperatorDraftPayload(form,requestKey);
  const {data,error}=await supabase.rpc('operator_create_draft',payload);
  if(error) throw new Error(error.message || 'Penyimpanan draf gagal.');
  if(typeof data!=='string' || !/^[0-9a-f-]{36}$/i.test(data)) {
    throw new Error('Server tidak mengembalikan ID draf yang valid.');
  }
  return {submissionId:data,status:'DRAFT',sentToDinas:false};
}
