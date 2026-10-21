import fs from "node:fs/promises";
import path from "node:path";
const file="smartgtk-export-xls.js";
const source=await fs.readFile(new URL("./"+file,import.meta.url),"utf8");
if(!source.includes("SIMANTAB_SMARTGTK_OFFICER_XLS_UI_V1")
 || !source.includes('simantab-smartgtk-export-xls')
 || !source.includes('ROLES=new Set(["SUPER_ADMIN","KABID","KASI_SD","KASI_SMP","SUBKOOR_TK"])'))
 throw Error("SMART-GTK XLS module contract invalid");
const dir=".vercel/output/static";
await fs.writeFile(path.join(dir,file),source);
const index=path.join(dir,"index.html");
let html=await fs.readFile(index,"utf8");
html=html.replace(/\s*<script\s+type="module"\s+src="\.\/smartgtk-export-xls\.js\?v=\d+"\s*><\/script>\s*/g,"\n");
if(!html.includes("</body>"))throw Error("HTML body missing");
html=html.replace("</body>",'<script type="module" src="./smartgtk-export-xls.js?v=1"></script>\n</body>');
if((html.match(/smartgtk-export-xls\.js\?v=1/g)||[]).length!==1)throw Error("Expected exactly one XLS export script");
await fs.writeFile(index,html);
console.log(JSON.stringify({smartGtkExcelUI:true,version:1,serverRoleEnforced:true}));
