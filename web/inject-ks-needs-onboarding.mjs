import fs from 'node:fs/promises';

const dir = '.vercel/output/static';
const name = 'ks-needs-onboarding.js';
const code = await fs.readFile(new URL(`./${name}`, import.meta.url), 'utf8');
if (!code.includes('SIMANTAB_KS_NEEDS_ONBOARDING_V1')) throw new Error('Modul wajib KS tidak valid.');
await fs.writeFile(`${dir}/${name}`, code);

let html = await fs.readFile(`${dir}/index.html`, 'utf8');
html = html.replace(/<script type="module" src="\.\/ks-needs-onboarding\.js\?v=\d+"><\/script>\s*/g, '');
html = html.replace('</body>', `<script type="module" src="./${name}?v=1"></script>\n</body>`);
await fs.writeFile(`${dir}/index.html`, html);
