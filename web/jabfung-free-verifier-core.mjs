/* SIMANTAB_JABFUNG_FREE_CORE_V1_20261013
 * Offline advisory only: no network, no database, no external AI invocation.
 * Text from PDF.js / local Tesseract OCR must be examined by a human.
 */
export const REQUIRED_LABELS=Object.freeze({
  PAK_JABFUNG:'PAK Jabfung',SK_CPNS:'SK CPNS',SK_PNS:'SK PNS',
  SK_KP_TERAKHIR:'SK KP terakhir',SK_JABATAN_SEBELUMNYA:'SK Jabatan sebelumnya',
  SERTIFIKAT_UKOM:'Sertifikat UKOM',SKP_2024:'SKP 2024',SKP_2025:'SKP 2025',
  IJAZAH:'Ijazah',TRANSKRIP:'Transkrip',
  SK_PG_PENGGUNAAN_GELAR:'SK Penggunaan Gelar',DOKUMEN_LAIN:'Dokumen pendukung'
});
const CUES={
  PAK_JABFUNG:[/PENETAPAN\s+ANGKA\s+KREDIT/i,/\bPAK\b/i,/ANGKA\s+KREDIT/i],
  SK_CPNS:[/\bCPNS\b/i,/CALON\s+PEGAWAI\s+NEGERI\s+SIPIL/i],
  SK_PNS:[/\bPNS\b/i,/PEGAWAI\s+NEGERI\s+SIPIL/i],
  SK_KP_TERAKHIR:[/KENAIKAN\s+PANGKAT/i,/GOLONGAN\s+RUANG/i,/KEPUTUSAN.*PANGKAT/i],
  SK_JABATAN_SEBELUMNYA:[/JABATAN\s+FUNGSIONAL/i,/PENGANGKATAN.*JABATAN/i],
  SERTIFIKAT_UKOM:[/UJI\s+KOMPETENSI/i,/\bUKOM\b/i,/\bUJIKOM\b/i],
  SKP_2024:[/SASARAN\s+KINERJA/i,/\bSKP\b/i,/PENILAIAN\s+KINERJA/i],
  SKP_2025:[/SASARAN\s+KINERJA/i,/\bSKP\b/i,/PENILAIAN\s+KINERJA/i],
  IJAZAH:[/\bIJAZAH\b/i,/DIPLOMA/i],
  TRANSKRIP:[/TRANSKRIP/i,/DAFTAR\s+NILAI/i],
  SK_PG_PENGGUNAAN_GELAR:[/PENGGUNAAN\s+GELAR/i,/PENCANTUMAN\s+GELAR/i],
  DOKUMEN_LAIN:[]
};
export const MAX_FILE_BYTES=1572864;
export function fileEligibility(file){
  if(!file||!Number.isFinite(file.size)||file.size<1) return {ok:false,reason:'FILE_EMPTY'};
  if(file.size>MAX_FILE_BYTES)return {ok:false,reason:'FILE_TOO_LARGE'};
  const accepted=new Set(['application/pdf','image/jpeg','image/png']);
  const mime=String(file.type||'').toLowerCase();
  if(!accepted.has(mime))return {ok:false,reason:'FILE_UNSUPPORTED'};
  return {ok:true,reason:null};
}
export function verifyExtractedText({requirementCode,text,ocrConfidence=null,expectedNip=null,fileName=null}={}){
  const code=String(requirementCode||'').toUpperCase();
  const content=String(text||'').replace(/\s+/g,' ').slice(0,300000);
  const cues=CUES[code];
  if(!cues)throw new Error('UNKNOWN_REQUIREMENT');
  const reasons=[];
  const normalized=content.toUpperCase();
  const wordCount=(normalized.match(/\b[\p{L}\p{N}]+\b/gu)||[]).length;
  if(wordCount<12)reasons.push('TEKS_TIDAK_CUKUP');
  const signal=cues.some(re=>re.test(content));
  if(cues.length&&!signal&&wordCount>=12)reasons.push('JENIS_PERLU_DICEK');
  const year=code==='SKP_2024'?2024:code==='SKP_2025'?2025:null;
  if(year&&!new RegExp('\\b'+year+'\\b').test(content))reasons.push('TAHUN_SKP_BELUM_TERBACA');
  const nips=[...new Set((content.match(/\b\d{18}\b/g)||[]))].slice(0,5);
  const expected=String(expectedNip||'').replace(/\D/g,'');
  if(expected.length===18&&nips.length&&!nips.includes(expected))reasons.push('NIP_PERLU_DICEK_MANUAL');
  const confidence=Number(ocrConfidence);
  if(ocrConfidence!==null&&Number.isFinite(confidence)&&confidence<45)reasons.push('OCR_KURANG_JELAS');
  // Do not infer authenticity from OCR or missing visual indicators.
  return Object.freeze({
    requirementCode:code,label:REQUIRED_LABELS[code],
    reviewStatus:reasons.length?'PERLU_TELAAH':'TERBACA_AWAL',
    reasons,
    textLength:content.length,wordCount,
    ocrConfidence:Number.isFinite(confidence)&&ocrConfidence!==null?Math.round(confidence):null,
    detectedNipCount:nips.length,
    detectedNipSuffixes:nips.map(n=>'****'+n.slice(-4)),
    expectedYear:year,
    possibleDocumentType:signal?'INDIKASI_SESUAI':'BELUM_DAPAT_DIPASTIKAN',
    source:'OCR_LOKAL_TIDAK_TERVERIFIKASI_SERVER',
    authenticity:'TIDAK_DAPAT_DIPASTIKAN',
    advisoryOnly:true,
    // No raw personal text or OCR document content in the result.
    filenameProvided:Boolean(fileName)
  });
}
export function aggregateChecks(checks){
  const list=Array.isArray(checks)?checks:[];
  return Object.freeze({
    total:list.length,
    terbacaAwal:list.filter(x=>x.reviewStatus==='TERBACA_AWAL').length,
    perluTelaah:list.filter(x=>x.reviewStatus==='PERLU_TELAAH').length,
    status:list.length&&list.every(x=>x.reviewStatus==='TERBACA_AWAL')?'TERBACA_AWAL':'PERLU_TELAAH',
    advisoryOnly:true
  });
}
