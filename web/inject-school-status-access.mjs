import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const moduleName='school-status-access-v1.js';
let html=await fs.readFile(outputPath,'utf8');
let code=await fs.readFile(new URL(`./${moduleName}`,import.meta.url),'utf8');
if(!code.includes('SIMANTAB_SCHOOL_STATUS_ACCESS_V1'))throw new Error('Modul status sekolah tidak valid.');

// Kebijakan sekolah:
// - Kebutuhan GTK Riil hanya sekolah negeri (renderer otoritatif ada di gtk-needs-progress V11).
// - Sekolah swasta: TPG + Usul PTK Baru Swasta.
// - Modul ini tidak boleh lagi merender ulang Kebutuhan GTK Riil.
code=code
 .replace("allowedServices:['TPG_KONSULTASI']","allowedServices:['TPG_KONSULTASI','PTK_BARU_SWASTA']")
 .replace('<div class="navhead">Layanan</div><button class="navbtn" data-tab="tpg" onclick="showTab(\'tpg\')"><span class="ico">◉</span>TPG</button>', '<div class="navhead">Layanan</div><button class="navbtn" onclick="openSubmission(\'PTK_BARU_SWASTA\',\'Usul PTK Baru Swasta\')"><span class="ico">🧑‍🏫</span>Usul PTK Baru</button><button class="navbtn" data-tab="tpg" onclick="showTab(\'tpg\')"><span class="ico">◉</span>TPG</button>')
 .replace('/Tamsil|PTK Baru/i','/Tamsil/i')
 .replace(".eq('service_type','TPG_KONSULTASI')",".in('service_type',['TPG_KONSULTASI','PTK_BARU_SWASTA'])")
 .replace('dibatasi pada TPG.','mencakup TPG dan Usul PTK Baru.')
 .replace('Akses sekolah swasta pada SIMANTAB khusus <b>TPG</b>. Modul Kebutuhan GTK Riil, Tamsil, dan layanan ketenagaan sekolah negeri tidak ditampilkan.','Akses sekolah swasta pada SIMANTAB meliputi <b>TPG</b> dan <b>Usul PTK Baru</b>. Modul Kebutuhan GTK Riil, Tamsil, dan layanan khusus sekolah negeri tidak ditampilkan.')
 .replace('<div class="label">Layanan TPG</div>','<div class="label">Layanan Swasta</div>')
 .replace('Konsultasi/layanan TPG sekolah swasta.','TPG dan Usul PTK Baru sekolah swasta.')
 .replace('<div class="quick"><button onclick="showTab(\'tpg\')">🎓<b>TPG</b><span>Konsultasi dan penyelesaian kendala TPG.</span></button>', '<div class="quick"><button onclick="openSubmission(\'PTK_BARU_SWASTA\',\'Usul PTK Baru Swasta\')">🧑‍🏫<b>Usul PTK Baru</b><span>Pengajuan PTK baru khusus sekolah swasta.</span></button><button onclick="showTab(\'tpg\')">🎓<b>TPG</b><span>Konsultasi dan penyelesaian kendala TPG.</span></button>')
 .replace(/Status TPG/g,'Status Usulan')
 .replace(/Dokumen TPG/g,'Dokumen Usulan')
 .replace("if(isPrivate&&type!=='TPG_KONSULTASI'){alert('Sekolah swasta hanya dapat menggunakan layanan TPG.');return window.showTab('tpg')}","if(isPrivate&&!['TPG_KONSULTASI','PTK_BARU_SWASTA'].includes(type)){alert('Sekolah swasta hanya dapat menggunakan layanan TPG dan Usul PTK Baru.');return window.showTab('tpg')}")
 .replace("privateServices:['TPG_KONSULTASI']","privateServices:['TPG_KONSULTASI','PTK_BARU_SWASTA']");

// Hentikan renderer lama Kebutuhan GTK Riil agar tidak menimpa core V11.
const oldShowNeeds="}else if(id==='needs'){await wait(120);await renderNegeriNeeds()}return r};";
const newShowNeeds="}return r};";
if(!code.includes(oldShowNeeds))throw new Error('Anchor override needs pada showTab tidak ditemukan.');
code=code.replace(oldShowNeeds,newShowNeeds);

const oldRefreshNeeds="}else if($('needs')?.classList.contains('active'))await renderNegeriNeeds();return r};";
const newRefreshNeeds="}return r};";
if(!code.includes(oldRefreshNeeds))throw new Error('Anchor override needs pada refreshAll tidak ditemukan.');
code=code.replace(oldRefreshNeeds,newRefreshNeeds);
code=code.replace("window.__simantabSchoolStatusAccess={version:1,","window.__simantabSchoolStatusAccess={version:3,needsRenderer:'core-v11',");

// Patch modul PTK lama: pada KS negeri jangan tampilkan kartu error PTK Swasta sama sekali.
const ptkPath='.vercel/output/static/ptk-swasta-enhancement.js';
let ptkCode=await fs.readFile(ptkPath,'utf8');
const oldCatch="}catch(e){x.innerHTML=`<h3>Usul PTK Baru Swasta</h3><p>${esc(e.message)}</p>`}g.prepend(x)}";
const newCatch="}catch(e){return}g.prepend(x)}";
if(!ptkCode.includes(oldCatch))throw new Error('Anchor kartu PTK Swasta tidak ditemukan.');
ptkCode=ptkCode.replace(oldCatch,newCatch);
await fs.writeFile(ptkPath,ptkCode);

html=html.replace(/<script type="module" src="\.\/school-status-access-v1\.js\?v=\d+"><\/script>\s*/g,'');
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');
html=html.slice(0,bodyClose)+`<script type="module" src="./${moduleName}?v=3"></script>\n`+html.slice(bodyClose);
await fs.writeFile(`.vercel/output/static/${moduleName}`,code);
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({schoolStatusAccess:true,version:3,negeriNeedsOnly:true,needsRenderer:'gtk-needs-progress-v11',legacyNeedsOverrideDisabled:true,privateSchoolServices:['TPG_KONSULTASI','PTK_BARU_SWASTA'],ptkBaruNegeriHidden:true}));
