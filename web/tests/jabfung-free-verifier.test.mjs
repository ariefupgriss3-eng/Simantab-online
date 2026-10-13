// Test suite for local, no-token Jabfung OCR precheck. No documents or network needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fileEligibility,verifyExtractedText,aggregateChecks} from '../jabfung-free-verifier-core.mjs';
const web=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(web,f),'utf8');

test('file validation rejects empty, oversized and unknown inputs',()=>{
 assert.deepEqual(fileEligibility({size:0,type:'application/pdf'}),{ok:false,reason:'FILE_EMPTY'});
 assert.deepEqual(fileEligibility({size:1572865,type:'application/pdf'}),{ok:false,reason:'FILE_TOO_LARGE'});
 assert.deepEqual(fileEligibility({size:100,type:'text/plain'}),{ok:false,reason:'FILE_UNSUPPORTED'});
 assert.deepEqual(fileEligibility({size:100,type:'application/pdf'}),{ok:true,reason:null});
});
test('text-based SKP 2025 yields advisory result only, no document text retained',()=>{
 const raw='SURAT SASARAN KINERJA PEGAWAI TAHUN 2025 untuk guru dan pejabat penilai. Dokumen ini mencantumkan kegiatan yang disepakati dan indikator kinerja tahunan. 198001012009031001';
 const res=verifyExtractedText({requirementCode:'SKP_2025',text:raw,expectedNip:'198001012009031001'});
 assert.equal(res.reviewStatus,'TERBACA_AWAL');
 assert.equal(res.authenticity,'TIDAK_DAPAT_DIPASTIKAN');
 assert.equal(res.source,'OCR_LOKAL_TIDAK_TERVERIFIKASI_SERVER');
 assert.equal(res.advisoryOnly,true);
 assert.equal(res.expectedYear,2025);
 assert.ok(!JSON.stringify(res).includes('198001012009031001'),'never return raw NIP');
 assert.ok(!JSON.stringify(res).includes('SURAT SASARAN KINERJA'),'never return raw OCR text');
});
test('wrong SKP year is flagged for human review, not condemned',()=>{
 const raw='Dokumen SASARAN KINERJA PEGAWAI tahun 2024. Perencanaan kinerja guru untuk periode tahun pelaksanaan 2024. Penilaian prestasi kinerja.';
 const res=verifyExtractedText({requirementCode:'SKP_2025',text:raw});
 assert.equal(res.reviewStatus,'PERLU_TELAAH');
 assert.ok(res.reasons.includes('TAHUN_SKP_BELUM_TERBACA'));
 assert.ok(!res.reasons.includes('FILE_REJECTED'));
});
test('image unreadable or scanned PDF with no OCR text requests review',()=>{
 const res=verifyExtractedText({requirementCode:'SK_PNS',text:' '});
 assert.equal(res.reviewStatus,'PERLU_TELAAH');
 assert.ok(res.reasons.includes('TEKS_TIDAK_CUKUP'));
});
test('detects potential NIP mismatch but never reveals full number',()=>{
 const raw='Surat KEPUTUSAN PENGANGKATAN PEGAWAI NEGERI SIPIL nomor 023 untuk pegawai tahun 2014. Identitas NIP 198101012010031002 tercantum dalam dokumen ini.';
 const res=verifyExtractedText({requirementCode:'SK_PNS',text:raw,expectedNip:'198001012009031001'});
 assert.equal(res.reviewStatus,'PERLU_TELAAH');
 assert.ok(res.reasons.includes('NIP_PERLU_DICEK_MANUAL'));
 assert.ok(res.detectedNipSuffixes[0].endsWith('1002'));
 assert.equal(JSON.stringify(res).includes('198101012010031002'),false);
});
test('optional supporting documents do not fail just for lacking specific heading',()=>{
 const raw='Lampiran dokumen pendukung sertifikat kegiatan pembinaan tenaga kependidikan yang diselenggarakan secara resmi, digunakan sebagai bukti kegiatan.';
 const res=verifyExtractedText({requirementCode:'DOKUMEN_LAIN',text:raw});
 assert.equal(res.reviewStatus,'TERBACA_AWAL');
});
test('OCR confidence below threshold requires human review',()=>{
 const res=verifyExtractedText({requirementCode:'IJAZAH',text:'IJAZAH diberikan setelah mengikuti program studi pendidikan dan dinyatakan lulus pada tahun 2021 melalui keputusan dekan.',ocrConfidence:35});
 assert.equal(res.reviewStatus,'PERLU_TELAAH');
 assert.ok(res.reasons.includes('OCR_KURANG_JELAS'));
});
test('unknown requirement throws rather than approving unknowable document',()=>{
 assert.throws(()=>verifyExtractedText({requirementCode:'NONEXISTENT',text:'whatever'}),/UNKNOWN_REQUIREMENT/);
});
test('aggregates advisory results without approval decisions',()=>{
 const good=verifyExtractedText({requirementCode:'IJAZAH',text:'IJAZAH diterbitkan kepada lulusan Universitas Pendidikan dengan program pembelajaran formal dan telah selesai studi pada tahun akademik 2025.'});
 const bad=verifyExtractedText({requirementCode:'TRANSKRIP',text:''});
 const summary=aggregateChecks([good,bad]);
 assert.equal(summary.total,2);
 assert.equal(summary.terbacaAwal,1);
 assert.equal(summary.perluTelaah,1);
 assert.equal(summary.status,'PERLU_TELAAH');
 assert.equal(summary.advisoryOnly,true);
});
test('active Jabfung form contains no paid gateway invocation',()=>{
 const ui=read('jabfung-jenjang-enhancement.js');
 const freeUi=read('jabfung-free-verifier-ui.mjs');
 const fin=read('finalize-html.mjs');
 new Function(ui);
 // ESM module syntax is verified separately with node --check (import.meta allowed).
 assert.doesNotMatch(ui,/sb\.functions\.invoke\('simantab-jabfung-ai-workflow'/);
 assert.doesNotMatch(ui,/await runAi\(sub\.id\)/);
 assert.match(ui,/__verifyJabfungFreeFromForm\(\)/);
 assert.match(ui,/f\.size<1/);
 assert.match(ui,/Tanpa AI Berbayar/);
 assert.match(freeUi,/OCR_BROWSER_LOCAL/);
 assert.doesNotMatch(freeUi,/ai-gateway\.vercel\.sh|generativelanguage\.googleapis\.com|fetch\('https:\/\/api/);
 assert.doesNotMatch(freeUi,/cdn\.jsdelivr\.net|unpkg\.com/);
 assert.match(freeUi,/ocr\/pdf\.mjs/);
 assert.match(freeUi,/workerPath:libs\.worker/);
 assert.match(fin,/jabfung-free-verifier-core\.mjs/);
 assert.match(fin,/jabfung-free-verifier-ui\.mjs/);
});
