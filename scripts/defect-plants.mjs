import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const cases = [
  { name: 'connect-activates-provider', file: 'server/provider-manager.js', from: 'selected = provider;', to: '', test: 'test/provider-manager.test.js' },
  { name: 'connection-poll-deadline', file: 'public/ui/setup-panel.js', from: "if (now() >= pollUntil) { message = 'connectionFailed'; render(); return; }\n      void request", to: "void request", test: 'test/setup-interaction.test.js' },
  { name: 'provider-subscription-gate', file: 'server/provider-manager.js', from: "if(!state.connected || state.method!=='subscription')", to: 'if(false)', test: 'test/provider-manager.test.js' },
  { name: 'provider-output-validation', file: 'server/provider-manager.js', from: 'applyClassifications(rows,result);', to: '', test: 'test/provider-manager.test.js' },
  { name: 'hidden-video-budget', file: 'public/domain/library.js', from: 'value.hidden.length > 20000', to: 'false', test: 'test/panel-actions.test.js' },
  { name: 'claude-tools-disabled', file: 'server/claude-policy.js', from: "'--tools',''", to: "'--tools','default'", test: 'test/claude-policy.test.js' },

  { name: 'community-automatic-call-budget', file: 'server/community-controller.js', from: 'session.automatic && session.analysisSteps >= COMMUNITY_AUTO_CALLS', to: 'false', test: 'test/community-flow.test.js' },
  { name: 'community-cancel-stops-next-call', file: 'public/services/community-discovery.js', from: 'if (isCancelled()) return', to: 'if (false) return', test: 'test/community-discovery.test.js' },
  { name: 'youtube-positive-threshold', file: 'public/domain/youtube-evidence.js', from: 'video.evidence.positive >= 2', to: 'video.evidence.positive >= 0', test: 'test/youtube-evidence.test.js' },
  { name: 'youtube-unknown-input', file: 'public/domain/youtube-evidence.js', from: "!exact(input,'version,videos') || ", to: '', test: 'test/youtube-analysis.test.js' },
  { name: 'reject-malformed-youtube-key', file: 'public/data/browser-store.js', from: 'const key = validateYouTubeKey(value);', to: 'const key = value;', test: 'test/browser-store.test.js' },
  { name: 'community-origin-check', file: 'server/community-route.js', from: 'request.headers.origin !==', to: 'false && request.headers.origin !==', test: 'test/community-route.test.js' },
  { name: 'classification-quote-evidence', file: 'public/domain/community-evidence.js', from: ' || !input.text.includes(item.quote)', to: '', test: 'test/community-evidence.test.js' },
  { name: 'backup-byte-budget', file: 'public/domain/library.js', from: 'if (new TextEncoder()', to: 'if (false && new TextEncoder()', test: 'test/discovery-flow.test.js' },
  { name: 'strict-community-source', file: 'public/domain/community.js', from: "typeof collection.source !== 'string' || ", to: '', test: 'test/community.test.js' },
  { name: 'reject-foreign-host', file: 'server/http-app.js', from: "if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host))", to: 'if (false)', test: 'test/http-app.test.js' },
  { name: 'backup-excludes-key', file: 'public/data/browser-store.js', from: "discovery: this.readDiscovery(), format: 'personaltube-backup',", to: "discovery: this.readDiscovery(), key: this.readKey(), format: 'personaltube-backup',", test: 'test/browser-store.test.js' },
  { name: 'refuse-stale-tab-write', file: 'public/data/browser-store.js', from: 'this.observed.has(key) &&', to: 'false &&', test: 'test/browser-store.test.js' },
  { name: 'refuse-stale-refresh', file: 'public/services/refresh-result.js', from: 'startedRevision !== currentRevision', to: 'false', test: 'test/refresh-result.test.js' },
];
const results = [];
for (const plant of cases) {
  const scratch = await mkdtemp(join(tmpdir(), 'personaltube-plant-'));
  try {
    for (const name of ['public', 'server', 'test', 'package.json']) await cp(name, join(scratch, name), { recursive: true });
    const file = join(scratch, plant.file);
    const before = await readFile(file, 'utf8');
    if (!before.includes(plant.from)) throw new Error(`Plant target changed: ${plant.name}`);
    await writeFile(file, before.replace(plant.from, plant.to));
    const result = spawnSync(process.execPath, ['--test', plant.test], { cwd: scratch, encoding: 'utf8', timeout: 10000, env: { PATH: process.env.PATH } });
    const detected = result.status !== 0 && result.status !== null && /AssertionError|assertion|test failed|✖/.test(result.stdout + result.stderr);
    results.push({ name: plant.name, detected, exitCode: result.status });
    if (!detected) throw new Error(`Undetected defect: ${plant.name}`);
    console.log(`Detected planted defect: ${plant.name}`);
  } finally { await rm(scratch, { recursive: true, force: true }); }
}
await mkdir('.local/reports', { recursive: true });
await writeFile('.local/reports/defect-plants.json', JSON.stringify({ version: 1, results }, null, 2) + '\n');
