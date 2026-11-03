import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { plainText, stances } from '../public/domain/community-evidence.js';
import { videoPattern } from '../public/config.js';

const root = new URL('../data/hackertube/', import.meta.url);
const source = JSON.parse(await readFile(new URL('source-integrity.json',root),'utf8'));
for (const [name, hash] of Object.entries(source.files)) {
  if (createHash('sha256').update(await readFile(new URL(`original/${name}`,root))).digest('hex') !== hash) throw new Error(`Original source integrity: ${name}`);
}
const rows = (await readFile(new URL('original/mentions.jsonl',root),'utf8')).trim().split('\n').map(line => JSON.parse(line));
const byVideo = {};
for (const row of rows) {
  if (!videoPattern.test(row.vid) || !Number.isSafeInteger(row.hn_comment_id) || !stances.slice(1).includes(row.stance) || !/^\d{4}-\d{2}$/.test(row.month)) throw new Error('Unsupported original comment');
  (byVideo[row.vid] ||= []).push({ source: 'hn', sourceUrl: `https://news.ycombinator.com/item?id=${row.hn_comment_id}`, date: `${row.month}-01T00:00:00.000Z`, precision: 'month', stance: row.stance, text: plainText(row.text).slice(0,600), quote: plainText(row.quote).slice(0,400), origin: 'upstream' });
}
const related = {};
for (const line of (await readFile(new URL('original/related.jsonl',root),'utf8')).trim().split('\n')) {
  const row = JSON.parse(line);
  if (!videoPattern.test(row.vid) || !Array.isArray(row.related)) throw new Error('Unsupported related data');
  related[row.vid] = row.related.filter(v => videoPattern.test(v.vid)).map(v => ({ id: v.vid, shared: v.shared_recommenders || v.shared || 0 })).slice(0,12);
}
await writeFile(new URL('evidence.json',root),JSON.stringify({ version: 1, sourceVersion: '405edcef', comments: rows.length, byVideo, related })+'\n');
const integrityURL = new URL('../integrity.json',root);
const integrity = JSON.parse(await readFile(integrityURL,'utf8'));
integrity.files['data/hackertube/evidence.json'] = createHash('sha256').update(await readFile(new URL('evidence.json',root))).digest('hex');
await writeFile(integrityURL,JSON.stringify(integrity,null,2)+'\n');
console.log(`Indexed ${rows.length} original comments across ${Object.keys(byVideo).length} videos; original bytes preserved.`);
