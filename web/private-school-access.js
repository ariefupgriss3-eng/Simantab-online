/* SIMANTAB_PRIVATE_SCHOOL_SERVICE_ACCESS_V1 */
/* SIMANTAB_PRIVATE_SCHOOL_SERVICE_ACCESS_V2 */
/* SIMANTAB_PRIVATE_SCHOOL_SERVICE_ACCESS_V3 */
/* SIMANTAB_PRIVATE_SCHOOL_SERVICE_ACCESS_V4_PASSIVE */
/* SIMANTAB_PRIVATE_SCHOOL_SERVICE_ACCESS_V5_PASSIVE_SINGLE_OWNER */
(()=>{
  // Kebijakan sekolah swasta kini sepenuhnya dimiliki school-status-access-v1.js.
  // Modul ini sengaja pasif agar tidak ada wrapper showTab / penulisan nav ganda.
  window.__simantabPrivateSchoolPolicy={
    version:5,
    passive:true,
    owner:'school-status-access-v1.js',
    negeriNeedsOnly:true,
    skbNegeriIncluded:true,
    privateMenu:['profile','tpg','ptkBaruSwasta','attendance','offlineConsultation','status','docs','notifications'],
    privateServices:['TPG_KONSULTASI','PTK_BARU_SWASTA'],
    ptkBaruSwastaOnly:true
  };
})();