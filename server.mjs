import { createLocalModels } from './server/local-models.js';
import { createMiniMaxSubscription } from './server/minimax-subscription.js';
import { createApiAnalysis } from './server/api-analysis.js';
import { createProviderManager } from './server/provider-manager.js';
import { createProviderProcesses } from './server/provider-process.js';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHandler } from './server/http-app.js';
import { createCatalogRepository } from './server/catalog-repository.js';
import { randomUUID } from 'node:crypto';
import { createCommunityRepository } from './server/community-repository.js';
import { createCommunityCollector } from './server/community-collector.js';
import { createCommunityController } from './server/community-controller.js';
import { createCommunityAnalysis } from './server/community-analysis.js';
import { createCodexClassifier } from './server/codex-classifier.js';
import { boundedJSON } from './server/bounded-http.js';
import { createCommunityMetadata } from './server/community-metadata.js';
import { createYouTubeAnalysis } from './server/youtube-analysis.js';

const root = new URL('./', import.meta.url);
const log = event => console.error(JSON.stringify(event));
const catalog = createCatalogRepository(root);
const processes = createProviderProcesses();
const providers = createProviderManager({ ...processes, localModels:createLocalModels(), api:createApiAnalysis(), minimax:createMiniMaxSubscription(), classifiers: { codex:createCodexClassifier(), claude:createCodexClassifier({executable:'claude',provider:'claude'}) }, now:Date.now });
const classify = providers.classify;
const youtubeAnalysis = createYouTubeAnalysis({ classify, now: Date.now });
const community = createCommunityController({ archive: createCommunityRepository({ root, catalog }), collect: createCommunityCollector({ request: boundedJSON, now: Date.now }), analyze: createCommunityAnalysis({ classify }), enrich: createCommunityMetadata({ request: boundedJSON, now: Date.now }), catalog, now: Date.now, id: randomUUID, schedule: (task, delay) => { const timer=setTimeout(task,delay); timer.unref(); return ()=>clearTimeout(timer); } });
const server = createServer(createHandler({
  port: 4173,
  readAsset: file => readFile(new URL(`public/${file}`, root)),
  catalog, community, youtubeAnalysis, setup:providers.control,
  log,
}));
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.on('error', error => {
  log({ event: 'startup_failed', code: error.code || 'UNKNOWN' });
  console.error(error.code === 'EADDRINUSE' ? 'Port 4173 is already in use. If PersonalTube is running, open http://127.0.0.1:4173. Otherwise close the conflicting local server.' : 'Could not start PersonalTube. Check that local server access is allowed.');
  process.exitCode = 1;
});
server.listen(4173, '127.0.0.1', () => console.log('PersonalTube is ready: http://127.0.0.1:4173\nKeep this window open. Press Ctrl+C to stop.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
