import test from 'node:test';
import assert from 'node:assert/strict';
import { startupPlan } from '../scripts/start-plan.mjs';

test('launcher reuses only a verified PersonalTube server and refuses conflicting software', () => {
  assert.equal(startupPlan(null), 'start');
  assert.equal(startupPlan({ version: 1, app: 'PersonalTube', status: 'ready' }), 'reuse');
  assert.equal(startupPlan({ version: 2, app: 'PersonalTube', status: 'ready' }), 'refuse');
  assert.equal(startupPlan({ app: 'Other app' }), 'refuse');
});
