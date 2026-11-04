import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('setup and panel controls expose beginner connections, usage and reversible removal',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 for(const id of ['setup-dialog','setup-open','setup-status','setup-provider','setup-codex','setup-claude','setup-check','setup-usage','setup-finish','channel-name-filter','channel-kind','thumbnail-style','delete-selected','restore-hidden','category-manager'])assert.ok(html.includes(`id="${id}"`),id);
 const css=await readFile(new URL('../public/styles.css',import.meta.url),'utf8');assert.match(css,/\.channel-scroll\s*\{[^}]*overflow-y:auto/);
});
test('Shorts uses portrait media and five desktop columns with smaller responsive grids',async()=>{
 const css=await readFile(new URL('../public/styles.css',import.meta.url),'utf8');
 assert.match(css,/\.video-grid\.shorts-grid[^}]*repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/\.short-card \.thumbnail\s*\{ aspect-ratio:9\/16/);
 assert.match(css,/@media\(max-width:600px\)[^}]*shorts-grid[^}]*repeat\(2,minmax\(0,1fr\)\)/);
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');assert.match(app,/channelMode && \$\('channel-kind'\)\.value === 'shorts'/);
});
