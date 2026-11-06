import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('contribution CI runs untrusted changes without write permissions or saved credentials', async () => {
  const workflow = await readFile(new URL('../.github/workflows/check.yml', import.meta.url), 'utf8');
  assert.match(workflow, /permissions:\n  contents: read\n/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /timeout-minutes: 10/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /run: npm run check/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\.|write-all|contents: write|self-hosted|curl\s|wget\s/);
  const actions = [...workflow.matchAll(/uses:\s*([^\s]+)/g)].map(match => match[1]);
  assert.equal(actions.length, 2);
  for (const action of actions) assert.match(action, /^actions\/(checkout|setup-node)@[a-f0-9]{40}$/);
});

test('defect checks select a stable reporter across supported Node versions', async () => {
  const source = await readFile(new URL('../scripts/defect-plants.mjs', import.meta.url), 'utf8');
  assert.match(source, /\['--test', '--test-reporter=spec', plant\.test\]/);
  assert.match(source, /result\.status !== 0 && result\.status !== null/);
});
