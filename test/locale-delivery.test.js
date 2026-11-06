import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, posix } from 'node:path';
import { assetManifest } from '../server/asset-manifest.js';
import { messages } from '../public/locale.js';

test('all browser module imports are publicly served and every interface language is selectable',async()=>{
 for(const [url,[file,type]] of assetManifest) {
  if(type!=='text/javascript')continue;
  const source=await readFile(new URL(`../public/${file}`,import.meta.url),'utf8');
  for(const match of source.matchAll(/(?:from\s+|import\s*)['"]([.][^'"]+)['"]/g)) {
   assert.ok(assetManifest.has(posix.resolve(dirname(url),match[1])),`${file} imports ${match[1]} but the server does not expose it`);
  }
 }
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const select=html.match(/<select id="language">([\s\S]*?)<\/select>/)[1];
 for(const language of Object.keys(messages))assert.ok(select.includes(`value="${language}"`));
});
