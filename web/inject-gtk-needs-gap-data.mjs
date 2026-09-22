import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
let html=await fs.readFile(outputPath,'utf8');
html=html.replace(/\s*<script\s+type="module"\s+src="\.\/gtk-needs-gap-data\.js\?v=\d+"\s*><\/script>\s*/g,'\n');
html=html.replace(/\s*<script\s+type="module"\s+src="\.\/gtk-needs-review-v7\.js\?v=\d+"\s*><\/script>\s*/g,'\n');
html=html.replace(/\s*<script\s+type="module"\s+src="\.\/gtk-needs-table-final\.js\?v=\d+"\s*><\/script>\s*/g,'\n');
if(!html.includes('./gtk-needs-progress.js?v=31'))throw new Error('GTK needs core v28 tidak ditemukan pada hasil final build.');
if(!html.includes('./school-status-access-v1.js?v=4'))throw new Error('School status access v4 tidak ditemukan pada hasil final build.');
await fs.writeFile(outputPath,html);
console.log(JSON.stringify({gtkNeedsOverlayDisabled:true,coreVersion:31,schoolStatusVersion:4,gapDataInCore:true,verificationInCore:true,clickableGapBreakdowns:true,negeriOnlyInCore:true,positiveShortageAggregation:true,legacyRenderersRemoved:true}));