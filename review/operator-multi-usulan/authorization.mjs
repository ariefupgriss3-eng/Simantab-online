// REVIEW-ONLY pure policy module. No Supabase connection; never a server authorization substitute.
export const OPERATOR_ROLES = Object.freeze(['OPERATOR_SMP','OPERATOR_KORWIL']);
export const SERVICES = Object.freeze(['CUTI','KGB']);
export const ROUTES = Object.freeze({ CUTI:'STAFF_CUTI', KGB:'STAFF_KGB' });
export const COORDINATORS = Object.freeze({ SMP:'KASI_SMP', SD:'KASI_SD' });

function normalized(value) { return String(value ?? '').trim().toUpperCase(); }
export function districtName(value) {
  // Exact school_master district labels are required for backend parity.
  return normalized(value).replace(/\s+/g, ' ');
}
function schoolIsState(s) { return ['NEGERI','N'].includes(normalized(s?.school_status)); }

export function evaluateOperatorScope({ sessionUserId, profile, assignment, school, serviceType }) {
  if (!sessionUserId || !profile || !assignment || !school) return { allowed:false, reason:'MISSING_CONTEXT' };
  if (profile.id !== sessionUserId || assignment.user_id !== sessionUserId) return { allowed:false, reason:'IDENTITY_MISMATCH' };
  if (profile.is_active !== true || profile.approval_status !== 'APPROVED' || normalized(profile.account_channel) !== 'GTK') {
    return { allowed:false, reason:'INACTIVE_OR_UNAPPROVED' };
  }
  if (assignment.is_active !== true || school.is_active !== true || !schoolIsState(school)) {
    return { allowed:false, reason:'INACTIVE_OR_PRIVATE_SCOPE' };
  }
  const kind = normalized(assignment.operator_kind), role = normalized(profile.role);
  const service = normalized(serviceType), level = normalized(school.jenjang);
  if (!SERVICES.includes(service)) return { allowed:false, reason:'UNSUPPORTED_SERVICE' };
  if (kind === 'SMP' && role === 'OPERATOR_SMP' &&
      level === 'SMP' && assignment.school_npsn === school.npsn &&
      profile.school_npsn === school.npsn && !!school.npsn) {
    return { allowed:true, school_npsn:school.npsn, coordinator:COORDINATORS.SMP, staff:ROUTES[service] };
  }
  if (kind === 'KORWIL' && role === 'OPERATOR_KORWIL' && level === 'SD' &&
      assignment.school_npsn == null && !!districtName(assignment.kecamatan) &&
      districtName(assignment.kecamatan) === districtName(school.kecamatan)) {
    return { allowed:true, school_npsn:school.npsn, coordinator:COORDINATORS.SD, staff:ROUTES[service] };
  }
  return { allowed:false, reason:'OUT_OF_SCOPE' };
}

export function validateSubject({name, nip, role}) {
  return (
    typeof name === 'string' && name.trim().length >= 3 && name.trim().length <= 180 &&
    typeof nip === 'string' && /^[0-9]{8,20}$/.test(nip) &&
    ['GURU','KEPALA_SEKOLAH'].includes(normalized(role))
  );
}

// Convenience for UI previews/tests only; database RPC must re-check every field.
export function assessDraft({sessionUserId,profile,assignment,school,serviceType,subject,attested}) {
  const scope=evaluateOperatorScope({sessionUserId,profile,assignment,school,serviceType});
  if(!scope.allowed) return scope;
  if(attested !== true || !validateSubject(subject ?? {})) return {allowed:false,reason:'INVALID_SUBJECT'};
  return scope;
}
