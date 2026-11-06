import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assetManifest } from '../server/asset-manifest.js';
import { readStylesheet } from './stylesheet-fixture.js';

test('ordered stylesheet entry serves every local fragment with CSS MIME type',async()=>{
  const entry=await readFile(new URL('../public/styles.css',import.meta.url),'utf8');
  const imports=[...entry.matchAll(/^@import "\.\/(styles\/[\w-]+\.css)";$/gm)].map(m=>m[1]);
  assert.equal(imports.length,23);assert.equal(new Set(imports).size,23);
  for(const file of imports){assert.deepEqual(assetManifest.get('/'+file),[file,'text/css']);assert.ok((await readFile(new URL('../public/'+file,import.meta.url),'utf8')).length>0);}
  assert.doesNotMatch(await readStylesheet(),/@import/);
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.ok(html.indexOf('assets/tokens/deeda.css')<html.indexOf('href="/styles.css"')||html.indexOf('assets/tokens/deeda.css')<html.indexOf('href="styles.css"'));
});

test('stylesheet fixture refuses cycles, missing fragments and external imports',async()=>{
  const root=new URL('../public/styles.css',import.meta.url);
  const directive=file=>'@im'+'port '+JSON.stringify(file)+';\n';
  await assert.rejects(readStylesheet(root,async()=> directive('./styles.css')),/Circular/);
  await assert.rejects(readStylesheet(root,async()=> directive('https://example.invalid/style.css')),/local/);
  await assert.rejects(readStylesheet(root,async url=>{if(url.href===root.href)return directive('./absent.css');throw new Error('Missing fragment');}),/Missing fragment/);
  await assert.rejects(readStylesheet(root,async()=> directive('./../outside.css')),/outside/);
});

test('stylesheet HTTP delivery keeps MIME, CSP and the explicit allowlist',async()=>{
  const {createHandler}=await import('../server/http-app.js');
  const handler=createHandler({port:4173,readAsset:file=>readFile(new URL('../public/'+file,import.meta.url)),catalog:async()=>({version:1,videos:[],areas:[]})});
  async function request(path){let result;await handler({url:path,method:'GET',headers:{host:'127.0.0.1:4173'}},{writeHead(status,headers){result={status,headers};},end(body){result.body=body;}});return result;}
  for(const [path,[,type]] of assetManifest){
    if(type!=='text/css')continue;
    const response=await request(path);assert.equal(response.status,200);assert.match(response.headers['Content-Type'],/^text\/css/);assert.match(response.headers['Content-Security-Policy'],/style-src 'self'/);assert.ok(response.body.length>0);
  }
  for(const path of ['/styles/not-allowlisted.css','/styles/%2e%2e/%2e%2e/records/FRONTEND_CLEANUP_MAP.md'])assert.equal((await request(path)).status,404);
});
