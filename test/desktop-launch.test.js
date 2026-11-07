import test from 'node:test';
import assert from 'node:assert/strict';
import { launchDesktop } from '../scripts/desktop-launch.mjs';

const ready = { version: 1, app: 'PersonalTube', status: 'ready' };
function fixture(states) {
  const events = [];
  return { events, effects: {
    probe: async () => states.length > 1 ? states.shift() : states[0],
    start: () => { events.push('start'); return { stop: () => events.push('stop'), release: () => events.push('release') }; },
    wait: async () => events.push('wait'),
    open: async () => events.push('open'),
  } };
}
test('desktop opens an existing verified server without starting another', async () => {
  const { events, effects } = fixture([ready]);
  await launchDesktop(effects);
  assert.deepEqual(events, ['open']);
});
test('desktop cold start waits for readiness before releasing server and opening', async () => {
  const { events, effects } = fixture([null, null, ready]);
  await launchDesktop(effects);
  assert.deepEqual(events, ['start', 'wait', 'wait', 'release', 'open']);
});
test('desktop refuses a conflicting or unknown server without opening it', async () => {
  for (const state of [{}, { ...ready, version: 2 }]) {
    const { events, effects } = fixture([state]);
    await assert.rejects(launchDesktop(effects), /4173/);
    assert.deepEqual(events, []);
  }
});
test('desktop bounded timeout stops only the newly created process', async () => {
  const { events, effects } = fixture([null]);
  await assert.rejects(launchDesktop(effects), /ready/);
  assert.equal(events.filter(event => event === 'wait').length, 40);
  assert.equal(events.at(-1), 'stop');
  assert.ok(!events.includes('open'));
});
test('desktop reports startup and browser failures without stopping a ready server', async () => {
  const { events, effects } = fixture([null, ready]);
  effects.open = async () => { throw new Error('browser unavailable'); };
  await assert.rejects(launchDesktop(effects), /browser/);
  assert.ok(!events.includes('stop'));
  effects.start = () => { throw new Error('start failed'); };
  effects.probe = async () => null;
  await assert.rejects(launchDesktop(effects), /start failed/);
});

test('desktop detects a failed child promptly and closes only that child', async () => {
  const { events, effects } = fixture([null]);
  effects.start = () => ({ failure: () => true, stop: () => events.push('stop') });
  await assert.rejects(launchDesktop(effects), /could not start/);
  assert.deepEqual(events, ['wait', 'stop']);
});
