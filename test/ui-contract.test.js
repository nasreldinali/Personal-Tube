import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { messages } from '../public/locale.js';

test('UI exposes language, theme, library, data and channel controls with complete translations', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const id of ['language', 'theme', 'view-discover', 'view-channels', 'view-later', 'view-watched', 'export-data', 'import-data', 'clear-data', 'channel-form']) assert.ok(html.includes(`id="${id}"`), id);
  for (const match of html.matchAll(/data-i18n(?:-placeholder|-label)?="([^"]+)"/g)) assert.ok(messages.en[match[1]] && messages.ar[match[1]], match[1]);
  assert.ok(html.includes('assets/tokens/deeda.css'));
  assert.ok(html.includes('assets/logo/deeda-mark-96.png'));
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/);
});
test('rendering uses text nodes and safe DOM construction rather than HTML interpolation', async () => {
  for (const file of ['app.js', 'ui/dom.js', 'ui/feed-view.js']) {
    const source = await readFile(new URL(`../public/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(/);
  }
});

test('compact layout exposes an accessible sidebar toggle, sticky filters and discovery source controls', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
  for (const id of ['sidebar-toggle', 'view-recommendations', 'view-community', 'recommendation-form', 'community-file', 'rec-language', 'rec-min-views', 'rec-min-likes', 'player-similar']) assert.ok(html.includes(`id="${id}"`), id);
  assert.doesNotMatch(html, /<a[^>]*class="d-brand"/);
  assert.match(css, /\.filters\s*\{[^}]*position:\s*sticky/);
  assert.match(css, /data-collapsed/);
  assert.match(css, /repeat\(4,minmax\(0,1fr\)\)/);
});
test('community discovery exposes one automatic search with progress and optional settings', async () => {
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  for(const id of ['collect-submit','collect-stop','collect-progress','community-options','community-inputs'])assert.ok(html.includes(`id="${id}"`),id);
  for(const id of ['collect-analyze','collect-analyze-next','community-original','collect-sort'])assert.equal(html.includes(`id="${id}"`),false,id);
  assert.match(html,/<progress[^>]*id="collect-progress"/);
  assert.match(html,/<details[^>]*id="community-options"/);
});
