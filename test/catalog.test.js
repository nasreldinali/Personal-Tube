import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCatalog, selectCatalog, durationSeconds } from '../public/domain/catalog.js';
import { CATALOG_ROWS } from './fixtures.js';

const catalog = () => normalizeCatalog(CATALOG_ROWS);
test('catalog retains real source fields without inventing dates or durations', () => {
  const rows = catalog();
  assert.equal(rows.length, 4);
  assert.equal(rows[0].id, 'abcdefghijk');
  assert.equal(rows[0].publishedAt, undefined);
  assert.equal(rows[0].duration, undefined);
  assert.throws(() => normalizeCatalog([{ vid: '../escape' }]));
});
test('daily selection is stable, excludes news and non-recommendations by default', () => {
  const options = { day: '2026-11-03', mode: 'discover' };
  const a = selectCatalog(catalog(), options);
  assert.deepEqual(a, selectCatalog(catalog(), options));
  assert.equal(a.length, 2);
  assert.deepEqual(selectCatalog(catalog(), { ...options, query: 'code', area: 'software' }).map(v => v.id), ['abcdefghijk']);
});
test('saved and watched views retain chosen news/reference records; unknown durations never match length filters', () => {
  assert.equal(selectCatalog(catalog(), { mode: 'later', library: { later: ['12345678901'] } }).length, 1);
  assert.equal(selectCatalog(catalog(), { mode: 'watched', library: { watched: ['12345678902'] } }).length, 1);
  assert.equal(selectCatalog(catalog(), { mode: 'discover', duration: 'long', metadata: {} }).length, 0);
  assert.equal(selectCatalog(catalog(), { mode: 'discover', duration: 'long', metadata: { abcdefghijk: { duration: 'PT1H2M' } } }).length, 1);
  assert.equal(durationSeconds('PT1H2M3S'), 3723);
  assert.equal(durationSeconds('invalid'), null);
});
