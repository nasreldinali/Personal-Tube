import test from 'node:test';
import assert from 'node:assert/strict';
import { validateYouTubeKey } from '../public/domain/youtube-key.js';

test('key syntax accepts URL-safe tokens and removes only surrounding whitespace', () => {
  assert.equal(validateYouTubeKey(' \tfixture-Key_123\n'), 'fixture-Key_123');
  for (const input of [null, {}, 123, '', ' ', 'key\u200f', 'key\u0000', 'key:label', 'x'.repeat(251)]) {
    assert.throws(() => validateYouTubeKey(input), error => error.code === 'keyFormat');
  }
});
