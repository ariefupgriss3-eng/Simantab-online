// Offline-only staging icon importer. Never reads production data or reaches the network.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export function validatePwaPng(bytes) {
  if(!Buffer.isBuffer(bytes)||bytes.length<1000||bytes.length>5_000_000)
    throw new Error('SIMANTAB staging icon is missing, empty or oversized.');
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'
     || bytes.toString('ascii',12,16)!=='IHDR')
    throw new Error('SIMANTAB staging icon must contain real PNG bytes, not renamed JPEG.');
  if(bytes.readUInt32BE(8)!==13||bytes.subarray(-12).toString('hex')!=='0000000049454e44ae426082')
    throw new Error('SIMANTAB icon PNG has an invalid IHDR or IEND structure.');
  const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
  if(w!==192||h!==192)
    throw new Error('SIMANTAB PWA icon must be exactly 192x192 pixels.');
  return {width:w,height:h,byteCount:bytes.length};
}

export async function copyStagingIcon(sourceFile,destinationDir) {
  if(!sourceFile||!destinationDir)throw new Error('Private icon path and build output are required.');
  const source=path.resolve(sourceFile);
  const output=path.resolve(destinationDir);
  const bytes=await fs.readFile(source);
  const verified=validatePwaPng(bytes);
  await fs.mkdir(output,{recursive:true});
  await fs.writeFile(path.join(output,'simantab-icon-192.png'),bytes);
  return {...verified,outputName:'simantab-icon-192.png',origin:'local-private-icon'};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  if(process.env.SIMANTAB_CLOUDFLARE_STAGING==='1'){
    const icon=process.env.SIMANTAB_STAGING_ICON_FILE;
    if(!icon)throw new Error('SIMANTAB_STAGING_ICON_FILE is mandatory for offline staging build.');
    const info=await copyStagingIcon(icon,path.resolve('.vercel/output/static'));
    console.log(JSON.stringify({stagingIconReady:true,...info}));
  }else{
    console.log(JSON.stringify({stagingIconSkipped:true,productionUnaffected:true}));
  }
}
