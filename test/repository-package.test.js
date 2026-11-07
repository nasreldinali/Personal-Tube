import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

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


test('distribution declares Apache 2.0 while retaining legacy and third-party notices', async () => {
  const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const digest = text => createHash('sha256').update(text).digest('hex');
  assert.equal(JSON.parse(await read('package.json')).license,'Apache-2.0');
  assert.equal(digest(await read('LICENSE')),'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30');
  assert.equal(digest(await read('docs/licenses/MIT-legacy.txt')),'98f855fd22d8f350018282825eae6bce25797efefe28a7de7e552b3233e5f63e');
  const notice=await read('NOTICE');
  for(const attribution of ['Nasreldin and PersonalTube contributors','Andrej Karpathy','ODC-By 1.0','Inter Project Authors','Montserrat Project Authors','Noto Project Authors','NOTICE.md']) assert.ok(notice.includes(attribution));
  const boundaries=await read('NOTICE.md');
  for(const license of ['Apache License 2.0','Open Data Commons Attribution','CC BY-SA','OFL.txt','DEEDA','MIT-legacy.txt']) assert.ok(boundaries.includes(license));
  for(const path of ['README.md','README.ar.md','README.de.md','README.es.md','CONTRIBUTING.md']) {
    const content=await read(path);
    assert.match(content,/Apache (?:License )?2\.0/);
    assert.doesNotMatch(content,/\[MIT(?: License)?\]\(LICENSE\)|License-MIT|repository.s MIT license/);
  }
});
