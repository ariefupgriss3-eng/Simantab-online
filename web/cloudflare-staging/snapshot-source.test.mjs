import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {extractSavedViewSource,validateSnapshotHtml,resolveSnapshotFile,localSnapshotResponse} from './snapshot-source.mjs';

const LIVE='https://simantab-online.vercel.app/';
const HTML='<!doctype html><html lang="id"><head><title>SIMANTAB Online</title></head><body><h1>SIMANTAB Online</h1></body></html>';

test('reject a missing source snapshot path before a live fetch can occur',()=>{
  assert.throws(()=>resolveSnapshotFile('',LIVE,LIVE),/Snapshot lokal belum tersedia/);
});
test('validate a clearly identified HTML source',()=>{
  assert.equal(validateSnapshotHtml(HTML),true);
  assert.throws(()=>validateSnapshotHtml('<html>other application</html>'),/tidak valid/);
});
test('block snapshots containing recognizable server secrets',()=>{
  assert.throws(()=>validateSnapshotHtml(HTML+' sb_secret_EXAMPLE'),/rahasia server/);
});
test('cannot resolve URLs from a different origin',()=>{
  assert.throws(()=>resolveSnapshotFile('/tmp/base.html','https://evil.example/test',LIVE),/origin/);
});
test('deny path traversal and unapproved asset names',()=>{
  assert.throws(()=>resolveSnapshotFile('/tmp/base.html',LIVE+'../config.json',LIVE),/tidak termasuk/);
});
test('load local source without contacting production, and normalize before returning it',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'simantab-staging-'));
  const source=path.join(root,'index.html');
  try{
    await fs.writeFile(source,HTML);
    const response=await localSnapshotResponse(LIVE,LIVE,source,html=>html.replace('</body>','<p>normalized</p></body>'));
    assert.equal(response.status,200);
    assert.equal(response.headers.get('x-simantab-base'),'local-snapshot');
    assert.match(await response.text(),/normalized/);
    assert.equal(response.headers.get('content-type'),'text/html; charset=utf-8');
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('a missing local static asset returns 404, without remote fallback',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'simantab-staging-'));
  try {
    const source=path.join(root,'index.html');
    await fs.writeFile(source,HTML);
    const response=await localSnapshotResponse(LIVE+'manifest.json',LIVE,source,x=>x);
    assert.equal(response.status,404);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('extract Chrome View Source saved browser wrapper without publishing original source',()=>{
  const lines=[
    '&lt;!doctype html&gt;',
    '&lt;html lang="id"&gt;',
    '&lt;head&gt;&lt;title&gt;SIMANTAB Online&lt;/title&gt;&lt;/head&gt;',
    '&lt;body&gt;',
    '  &lt;div <span class="html-attribute-name">class</span>="<span class="html-attribute-value">login</span>"&gt;A &amp; B&lt;/div&gt;',
    '&lt;script src="<a class="html-resource-link" href="/safe.js">./safe.js</a>"&gt;&lt;/script&gt;',
    '&lt;/body&gt;',
    '&lt;/html&gt;'
  ];
  const wrapper='<html><body><div class="source-container"><table><tbody>'+lines.map((s,i)=>
    '<tr><td class="line-number" value="'+(i+1)+'"></td><td class="line-content">'+s+'</td></tr>'
  ).join('')+'</tbody></table></div></body></html>';
  const extracted=extractSavedViewSource(wrapper);
  assert.equal(extracted,[
    '<!doctype html>',
    '<html lang="id">',
    '<head><title>SIMANTAB Online</title></head>',
    '<body>',
    '  <div class="login">A & B</div>',
    '<script src="./safe.js"></script>',
    '</body>',
    '</html>'
  ].join('\n'));
  assert.equal(validateSnapshotHtml(extracted),true);
});

test('reject a fake saved view source with missing source rows',()=>{
  assert.throws(()=>extractSavedViewSource('<html><div class="source-container">No rows</div></html>'),/missing or malformed/);
});

test('localSnapshotResponse unwraps Chrome source wrapper from local file',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'simantab-view-source-'));
  const browserSaved='<html><div class="source-container"><table>'+
    ['&lt;!doctype html&gt;','&lt;html&gt;','&lt;head&gt;&lt;title&gt;SIMANTAB Online&lt;/title&gt;&lt;/head&gt;',
     '&lt;body&gt;','&lt;h1&gt;SIMANTAB Online&lt;/h1&gt;','&lt;/body&gt;','&lt;/html&gt;']
     .map(x=>'<tr><td class="line-content">'+x+'</td></tr>').join('')+'</table></div></html>';
  try{
    const filename=path.join(root,'view-source.html');
    await fs.writeFile(filename,browserSaved);
    const response=await localSnapshotResponse(LIVE,LIVE,filename,html=>html);
    assert.equal(response.status,200);
    assert.equal((await response.text()).startsWith('<!doctype html>'),true);
  }finally{await fs.rm(root,{recursive:true,force:true})}
});
