import test from 'node:test';
import assert from 'node:assert/strict';
import { focusDesktopBrowser } from '../scripts/desktop-browser.mjs';

test('desktop browser invokes only the fixed bounded automation script and accepts a status', async () => {
  let calls = 0;
  const status = await focusDesktopBrowser(async (command, args, options) => {
    calls++;
    assert.equal(command, '/usr/bin/osascript');
    assert.deepEqual(args.slice(0, 2), ['-l', 'JavaScript']);
    assert.ok(args[2].endsWith('/scripts/focus-personaltube.js'));
    assert.equal(options.timeout, 60000);
    assert.equal(options.maxBuffer, 4096);
    assert.equal(options.shell, false);
    return { stdout: 'focused\n' };
  });
  assert.equal(status, 'focused');
  assert.equal(calls, 1);
});
test('desktop browser reports denied access without fallback, retries or raw browser output', async () => {
  let calls = 0;
  await assert.rejects(focusDesktopBrowser(async () => {
    calls++;
    throw new Error('private browser details: -1743');
  }), error => /Automation/.test(error.message) && !/private browser/.test(error.message));
  assert.equal(calls, 1);
  await assert.rejects(focusDesktopBrowser(async () => ({ stdout: 'unexpected data' })), /could not focus/);
});

test('missing pinned profile opens its directory once and verifies without creating duplicate tabs', async () => {
  const calls = [];
  const status = await focusDesktopBrowser(async (command, args) => {
    calls.push({ command, args });
    if (command === '/usr/bin/open') { assert.ok(args.includes('--profile-directory=Profile 2')); return {}; }
    const config = JSON.parse(args[3]);
    assert.equal(config.name, 'Work');
    return { stdout: config.findOnly ? 'focused' : 'profileMissing' };
  }, { version: 1, directory: 'Profile 2', name: 'Work', marker: 'fixture-marker-12345' }, async () => {});
  assert.equal(status, 'focused');
  assert.equal(calls.filter(call => call.command === '/usr/bin/open').length, 1);
  let opened = 0;
  await assert.rejects(focusDesktopBrowser(async command => {
    if (command === '/usr/bin/open') { opened++; return {}; }
    return { stdout: 'profileMissing' };
  }, { version: 1, directory: 'Profile 2', name: 'Work', marker: 'fixture-marker-12345' }, async () => {}), /selected Chrome profile/);
  assert.equal(opened, 1);
});
