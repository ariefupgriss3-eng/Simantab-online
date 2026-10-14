'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'cloudflare/build-social-login-preview.mjs'),'utf8');
const svg=fs.readFileSync(path.join(root,'cloudflare/og-simantab-login.svg'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('share preview is a PNG sized for large WhatsApp/Facebook cards',()=>{
 assert.match(svg,/width="1200" height="630"/);
 assert.match(svg,/Masuk SIMANTAB Online/);
 assert.match(svg,/Login Dinas/);
 assert.match(svg,/GTK \/ Pengawas/);
 assert.match(code,/new Resvg\(svg,/);
 assert.match(code,/rendered\.width !== 1200 \|\| rendered\.height !== 630/);
 assert.match(code,/og-simantab-login\.png/);
});
test('both shared login and older install links include social image metadata',()=>{
 assert.match(code,/await apply\('index\.html'\)/);
 assert.match(code,/await apply\('install\.html'\)/);
 for(const key of ['og:image','og:image:width','og:image:height','og:title','og:url','twitter:card','twitter:image']){
   assert.ok(code.includes("'"+key+"'"),'Missing '+key);
 }
 assert.match(code,/summary_large_image/);
 assert.match(code,/OG image must be declared exactly once/);
});
test('public absolute image URL uses Cloudflare domain, not Vercel',()=>{
 assert.match(code,/https:\/\/simantab-cf-preview\.m-arief-rohman\.workers\.dev/);
 assert.doesNotMatch(code,/https:\/\/simantab-online\.vercel\.app/);
 assert.match(code,/BASE \+ '\/og-simantab-login\.png\?v=/);
 assert.match(code,/html\.replace\('<\/head>'/);
});
test('preview build runs after PWA without altering authentication',()=>{
 assert.match(pkg.scripts['build:cloudflare'],/node cloudflare\/enable-pwa\.mjs && node cloudflare\/build-social-login-preview\.mjs$/);
 assert.equal(pkg.dependencies['@resvg/resvg-js'],'2.6.2');
 assert.doesNotMatch(code,/signInWithPassword|updateUser|resetPasswordForEmail|rpc\(/);
});
