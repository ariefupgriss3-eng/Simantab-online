import fs from 'node:fs/promises';

const outputPath='.vercel/output/static/index.html';
const brandingName='ui-branding-icons.js';
const brandingPath=new URL('./ui-branding-icons.js',import.meta.url);
const kasimName='kasim-role-label.js';
const kasimPath=new URL('./kasim-role-label.js',import.meta.url);
const loginBrandingName='login-developer-branding.js';
const loginBrandingPath=new URL('./login-developer-branding.js',import.meta.url);
const premiumDashboardName='premium-dashboard-theme.js';
const premiumDashboardPath=new URL('./premium-dashboard-theme.js',import.meta.url);

let html=await fs.readFile(outputPath,'utf8');
const brandingCode=await fs.readFile(brandingPath,'utf8');
const kasimCode=await fs.readFile(kasimPath,'utf8');
const loginBrandingCode=await fs.readFile(loginBrandingPath,'utf8');
const premiumDashboardCode=await fs.readFile(premiumDashboardPath,'utf8');

if(!brandingCode.includes('SIMANTAB_UI_BRANDING_ICONS_V1'))throw new Error('Modul branding/icon SIMANTAB tidak valid.');
if(!kasimCode.includes('SIMANTAB_KASIM_ROLE_LABEL_V1'))throw new Error('Modul label Admin KSPS Kasim tidak valid.');
if(!loginBrandingCode.includes('SIMANTAB_LOGIN_DEVELOPER_BRANDING_V1'))throw new Error('Modul branding login SIMANTAB tidak valid.');
if(!premiumDashboardCode.includes('SIMANTAB_PREMIUM_DASHBOARD_THEME_V1'))throw new Error('Modul premium dashboard SIMANTAB tidak valid.');

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('Tag </body> tidak ditemukan.');

html=html.replace(/<script type="module" src="\.\/ui-branding-icons\.js\?v=\d+"><\/script>\s*/g,'');
html=html.replace(/<script type="module" src="\.\/kasim-role-label\.js\?v=\d+"><\/script>\s*/g,'');
html=html.replace(/<script type="module" src="\.\/login-developer-branding\.js\?v=\d+"><\/script>\s*/g,'');
html=html.replace(/<script type="module" src="\.\/premium-dashboard-theme\.js\?v=\d+"><\/script>\s*/g,'');

const tags=`<script type="module" src="./${brandingName}?v=2"></script>\n<script type="module" src="./${kasimName}?v=1"></script>\n<script type="module" src="./${loginBrandingName}?v=1"></script>\n<script type="module" src="./${premiumDashboardName}?v=1"></script>\n`;
html=html.slice(0,bodyClose)+tags+html.slice(bodyClose);

await fs.writeFile(outputPath,html);
await fs.writeFile(`.vercel/output/static/${brandingName}`,brandingCode);
await fs.writeFile(`.vercel/output/static/${kasimName}`,kasimCode);
await fs.writeFile(`.vercel/output/static/${loginBrandingName}`,loginBrandingCode);
await fs.writeFile(`.vercel/output/static/${premiumDashboardName}`,premiumDashboardCode);

console.log(JSON.stringify({developerFooter:true,loginDeveloperBranding:true,premiumDashboard:true,theme:'navy-orange-executive',developer:'M. Arief Rohman, S.Pd.SD., M.Si., M.Pd., M.Pd',unit:'Dinas Pendidikan dan Kebudayaan',year:2026,svgIcons:true,kasimRoleLabel:'Admin KSPS • KP/PAK/Jabfung/SKP-PAK',productionUntouched:true}));
