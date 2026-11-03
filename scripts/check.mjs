import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { assetManifest } from '../server/asset-manifest.js';

async function walk(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue;
    const path = `${directory}/${item.name}`;
    if (path.startsWith('public/assets')) continue;
    if (item.isDirectory()) result.push(...await walk(path)); else result.push(path);
  }
  return result;
}
function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Check failed: ${args.join(' ')}`);
}
const files = ['server.mjs', ...await walk('public'), ...await walk('server'), ...await walk('scripts'), ...await walk('test')];
const graph = new Map();
for (const file of files) {
  const text = await readFile(file, 'utf8');
  if (!text.endsWith('\n') || text.includes('\r') || /[ \t]+$/m.test(text)) throw new Error(`Formatting: ${file}`);
  if (!['.js', '.mjs'].includes(extname(file))) continue;
  run(['--check', file]);
  const dependencies = [];
  for (const match of text.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)) {
    if (!match[1].startsWith('.')) continue;
    const path = resolve(dirname(file), match[1]);
    await readFile(path); dependencies.push(path);
  }
  graph.set(resolve(file), dependencies);
  if (file.startsWith('public/domain/') && /\b(?:fetch|localStorage|sessionStorage|document|window)\b|Date\.now\(/.test(text)) throw new Error(`Domain boundary: ${file}`);
  if (file.startsWith('public/') && /innerHTML|outerHTML|insertAdjacentHTML|\beval\s*\(|new Function\s*\(/.test(text)) throw new Error(`Unsafe rendering: ${file}`);
  if (/AIza[\w-]{30,}/.test(text)) throw new Error(`Possible hardcoded key: ${file}`);
}
function checkCycle(file, trail = new Set(), done = new Set()) {
  if (trail.has(file)) throw new Error(`Circular import: ${file}`);
  if (done.has(file)) return;
  trail.add(file);
  for (const next of graph.get(file) || []) checkCycle(next, trail, done);
  trail.delete(file); done.add(file);
}
for (const file of graph.keys()) checkCycle(file);
for (const [file] of assetManifest.values()) await readFile(`public/${file}`);
const baseline = JSON.parse(await readFile('records/baseline-hashes.json', 'utf8'));
for (const file of ['DATA.md', 'Prompt.md', 'videos.jsonl', 'taxonomy.json', 'mentions.jsonl', 'related.jsonl', 'embedding_ids.json', 'embeddings.npy']) {
  if (createHash('sha256').update(await readFile(file)).digest('hex') !== baseline.files[file]) throw new Error(`Original export changed: ${file}`);
}
const brand = JSON.parse(await readFile('records/brand-assets.json', 'utf8'));
for (const [file, expected] of Object.entries(brand.files)) if (createHash('sha256').update(await readFile(file)).digest('hex') !== expected) throw new Error(`Brand asset changed: ${file}`);
const tests = (await readdir('test')).filter(name => name.endsWith('.test.js')).map(name => `test/${name}`);
run(['--test', ...tests]);
run(['scripts/defect-plants.mjs']);
console.log('PASS: syntax, project lint, formatting, import structure, asset/source integrity, tests and security defect plants.');
