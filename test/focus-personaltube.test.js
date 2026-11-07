import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function browserFixture(urlLists) {
  const windows = urlLists.map(urls => ({
    tabs: Object.assign(() => urls.map(url => Object.defineProperty({}, 'url', {
      get: () => () => url, set: () => { throw new Error('Existing tabs must not navigate'); },
    })), { push(tab) { urls.push(tab.url); } }),
    activeTabIndex: 1, index: 2, minimized: true,
  }));
  const browser = {
    windows: Object.assign(() => windows, { push() {
      const tab = { url: 'chrome://newtab/' };
      windows.push({ tabs: Object.assign(() => [tab], { 0: tab }), activeTabIndex: 1 });
    } }),
    Tab: value => value, Window: () => ({}),
    activate() { browser.activated = true; },
  };
  const context = vm.createContext({ Application: name => { assert.equal(name, 'com.google.Chrome'); return browser; } });
  vm.runInContext(await readFile(new URL('../scripts/focus-personaltube.js', import.meta.url), 'utf8'), context);
  return { browser, windows, run: profile => context.run(profile ? [JSON.stringify(profile)] : []) };
}
test('desktop focuses an existing PersonalTube tab and preserves its route without creating or navigating', async () => {
  const lists = [['https://example.com'], ['https://example.org', 'http://127.0.0.1:4173/#recommendations']];
  const { browser, windows, run } = await browserFixture(lists);
  assert.equal(run(), 'focused');
  assert.equal(windows[1].activeTabIndex, 2);
  assert.equal(windows[1].index, 1);
  assert.equal(windows[1].minimized, false);
  assert.equal(browser.activated, true);
  assert.deepEqual(lists, [['https://example.com'], ['https://example.org', 'http://127.0.0.1:4173/#recommendations']]);
});
test('desktop rejects lookalike origins and creates exactly one tab only when none matches', async () => {
  const urls = ['http://127.0.0.1:41730/', 'http://127.0.0.1:4173.evil.example/', 'http://127.0.0.1:4173@evil.example/', 'https://example.com/?http://127.0.0.1:4173/'];
  const { windows, run } = await browserFixture([urls]);
  assert.equal(run(), 'opened');
  assert.equal(urls.length, 5);
  assert.equal(urls.at(-1), 'http://127.0.0.1:4173/');
  assert.equal(windows[0].activeTabIndex, 5);
  assert.equal(run(), 'focused');
  assert.equal(urls.length, 5);
});
test('desktop recognizes localhost and creates a window when Chrome has none', async () => {
  const existing = await browserFixture([['http://localhost:4173/#feed']]);
  assert.equal(existing.run(), 'focused');
  const empty = await browserFixture([]);
  assert.equal(empty.run(), 'opened');
  assert.equal(empty.windows.length, 1);
  assert.equal(empty.windows[0].tabs[0].url, 'http://127.0.0.1:4173/');
});

test('desktop profile pin ignores another profile with the same PersonalTube URL', async () => {
  const { windows, run } = await browserFixture([['http://127.0.0.1:4173/'], ['http://127.0.0.1:4173/?desktop=fixture-marker-12345#channels']]);
  assert.equal(run({ version: 1, directory: 'Profile 2', name: 'Work', marker: 'fixture-marker-12345' }), 'focused');
  assert.equal(windows[0].minimized, true);
  assert.equal(windows[1].minimized, false);
  const absent = await browserFixture([['http://127.0.0.1:4173/']]);
  assert.equal(absent.run({ version: 1, directory: 'Profile 2', name: 'Work', marker: 'fixture-marker-12345' }), 'profileMissing');
  assert.equal(absent.windows.length, 1);
});

test('desktop routing marker must match exactly once in the local URL query', async () => {
  for (const suffix of ['?desktop=fixture-marker-12345-other', '#desktop=fixture-marker-12345', '?desktop=fixture-marker-12345&desktop=fixture-marker-12345']) {
    const { run } = await browserFixture([['http://127.0.0.1:4173/'+suffix]]);
    assert.equal(run({version:1,directory:'Profile 2',name:'Work',marker:'fixture-marker-12345'}), 'profileMissing');
  }
});
