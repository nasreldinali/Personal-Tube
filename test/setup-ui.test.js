import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('setup and panel controls expose beginner connections, usage and reversible removal',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 for(const id of ['setup-dialog','setup-open','setup-status','setup-provider','setup-connect','setup-check','setup-usage','setup-finish','channel-name-filter','channel-kind','thumbnail-style','delete-selected','restore-hidden','category-manager'])assert.ok(html.includes(`id="${id}"`),id);
 const css=await readFile(new URL('../public/styles.css',import.meta.url),'utf8');assert.match(css,/\.channel-scroll\s*\{[^}]*overflow-y:auto/);
});
