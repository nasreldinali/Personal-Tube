import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/http-app.js';

async function request(path, { method = 'GET', host = '127.0.0.1:4173' } = {}) {
  let result = {};
  const handler = createHandler({ readAsset: async () => Buffer.from('fixture'), catalog: async () => ({ version: 1, videos: [], areas: [] }), port: 4173 });
  await handler({ url: path, method, headers: { host } }, {
    writeHead(status, headers) { result = { status, headers }; },
    end(body) { result.body = body; },
  });
  return result;
}
test('local server serves versioned health and applies browser headers', async () => {
  const health = await request('/health');
  assert.equal(health.status, 200);
  assert.equal(JSON.parse(health.body).app, 'PersonalTube');
  assert.equal(JSON.parse(health.body).version, 1);
  const page = await request('/');
  assert.match(page.headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.match(page.headers['Content-Security-Policy'], /font-src 'self'/);
  assert.equal(page.headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
});
test('server refuses DNS-rebinding hosts, traversal, private records, mutation methods and malformed URLs', async () => {
  assert.equal((await request('/', { host: 'evil.example:4173' })).status, 403);
  for (const path of ['/../DATA.md', '/%2e%2e/records/baseline-source.tar', '/records/APPROVALS.md', '/.env', '/unknown.js']) assert.equal((await request(path)).status, 404);
  assert.equal((await request('/', { method: 'POST' })).status, 405);
  assert.equal((await request('http://[')).status, 400);
});
test('HEAD has no body and catalog is an explicit public route', async () => {
  assert.equal((await request('/', { method: 'HEAD' })).body, undefined);
  assert.equal(JSON.parse((await request('/catalog.json')).body).version, 1);
});
