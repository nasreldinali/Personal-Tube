import { assetManifest } from './asset-manifest.js';

export const browserHeaders = {
  'Cache-Control': 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' https://i.ytimg.com https://yt3.ggpht.com https://yt3.googleusercontent.com; connect-src 'self' https://www.googleapis.com; frame-src https://www.youtube.com; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

export function createHandler({ readAsset, catalog, port = 4173, log = () => {} }) {
  return async (request, response) => {
    const send = (status, body, type = 'text/plain') => {
      response.writeHead(status, { ...browserHeaders, 'Content-Type': `${type}; charset=utf-8` });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host)) { send(403, 'Local access only'); return; }
    if (!['GET', 'HEAD'].includes(request.method)) { send(405, 'Method not allowed'); return; }
    let path;
    try { path = new URL(request.url, 'http://localhost').pathname; }
    catch { send(400, 'Invalid request'); return; }
    try {
      if (path === '/health') { send(200, JSON.stringify({ version: 1, app: 'PersonalTube', status: 'ready' }), 'application/json'); return; }
      if (path === '/catalog.json') { send(200, JSON.stringify(await catalog()), 'application/json'); return; }
      const entry = assetManifest.get(path);
      if (!entry) { send(404, 'Not found'); return; }
      send(200, await readAsset(entry[0]), entry[1]);
    } catch {
      log({ event: 'request_failed', route: assetManifest.has(path) ? 'asset' : 'catalog' });
      send(500, 'Unable to load local content');
    }
  };
}
