import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { shellQuote, desktopAppSource } from '../scripts/desktop-app-source.mjs';

test('desktop command quoting preserves spaces and metacharacters as literal text', () => {
  const path = '/tmp/a b/quote\'" $(echo injected) `id` \\ newline\n';
  const result = execFileSync('/bin/sh', ['-c', `printf %s ${shellQuote(path)}`], { encoding: 'utf8' });
  assert.equal(result, path);
});
test('desktop app runs directly without an AppleScript applet and displays failures only', () => {
  const source = desktopAppSource('/tmp/Node "path"', '/tmp/Project/app.mjs');
  assert.match(source, /^#!\/bin\/sh/);
  assert.match(source, /display alert "PersonalTube"/);
  assert.match(source, /if output=/);
  assert.doesNotMatch(source, /Terminal|administrator privileges|do shell script/);
});
