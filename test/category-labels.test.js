import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { categoryLabels } from '../public/category-labels.js';

test('every source category has an Arabic UI label without changing the source taxonomy', async () => {
  const taxonomy = JSON.parse(await readFile(new URL('../taxonomy.json', import.meta.url), 'utf8'));
  for (const category of taxonomy.areas.flatMap(a => a.categories)) assert.match(categoryLabels[category.id], /[\u0600-\u06ff]/, category.id);
  assert.equal(Object.keys(categoryLabels).length, 150);
});
