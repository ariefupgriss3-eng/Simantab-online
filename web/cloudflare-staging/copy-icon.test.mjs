import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {validatePwaPng,copyStagingIcon} from './copy-icon.mjs';

function fixture(width=192,height=192){
  const data=Buffer.alloc(1100);
  Buffer.from('89504e470d0a1a0a0000000d49484452','hex').copy(data,0);
  data.writeUInt32BE(width,16);
  data.writeUInt32BE(height,20);
  Buffer.from('0000000049454e44ae426082','hex').copy(data,data.length-12);
  return data;
}
test('only 192x192 PNG assets are allowed for PWA build',()=>{
  const result=validatePwaPng(fixture());
  assert.equal(result.width,192);
  assert.equal(result.height,192);
  assert.throws(()=>validatePwaPng(fixture(1536,1536)),/192x192/);
  assert.throws(()=>validatePwaPng(fixture(512,512)),/192x192/);
});
test('misnamed JPEG, empty source and truncated PNG are rejected',()=>{
  assert.throws(()=>validatePwaPng(Buffer.concat([Buffer.from([255,216,255,224]),Buffer.alloc(1100)])),/real PNG/);
  assert.throws(()=>validatePwaPng(Buffer.from('not an image')),/missing, empty/);
  const broken=fixture();
  broken.fill(0,broken.length-12);
  assert.throws(()=>validatePwaPng(broken),/IHDR or IEND/);
});
test('staging copy produces a validated local file, without network',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'simantab-icon-staging-'));
  try{
    const source=path.join(dir,'source.png');
    const output=path.join(dir,'build','assets');
    await fs.writeFile(source,fixture());
    const result=await copyStagingIcon(source,output);
    assert.equal(result.outputName,'simantab-icon-192.png');
    const out=await fs.readFile(path.join(output,'simantab-icon-192.png'));
    assert.deepEqual(out,fixture());
  }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('staging icon copy fails closed on missing file',async()=>{
  await assert.rejects(()=>copyStagingIcon('', '/tmp'),/required/);
});
