import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHandler } from './server/http-app.js';
import { createCatalogRepository } from './server/catalog-repository.js';

const root = new URL('./', import.meta.url);
const log = event => console.error(JSON.stringify(event));
const server = createServer(createHandler({
  port: 4173,
  readAsset: file => readFile(new URL(`public/${file}`, root)),
  catalog: createCatalogRepository(root),
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
