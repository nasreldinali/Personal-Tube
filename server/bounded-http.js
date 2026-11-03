import { AppError } from '../public/domain/errors.js';

const hosts = new Set(['hn.algolia.com', 'api.stackexchange.com', 'oauth.reddit.com', 'www.youtube.com']);
export async function boundedJSON(value, { headers = {}, maxBytes = 2000000, timeoutMs = 15000 } = {}, fetcher = fetch) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.has(url.hostname)) throw new AppError('communitySourceUnavailable');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url.href, { headers: { Accept: 'application/json', ...headers }, redirect: 'error', signal: controller.signal });
    if (!response.ok || Number(response.headers.get('content-length') || 0) > maxBytes) throw new AppError('communitySourceUnavailable');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        size += chunk.length;
        if (size > maxBytes) throw new AppError('communitySourceUnavailable');
        chunks.push(Buffer.from(chunk));
      }
    } finally { await reader.cancel().catch(() => {}); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { throw new AppError('communitySourceUnavailable'); }
  finally { clearTimeout(timer); }
}
