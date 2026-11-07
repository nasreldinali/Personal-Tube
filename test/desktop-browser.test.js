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
