import { AppError } from '../public/domain/errors.js';

export async function handleCommunityRequest(request, controller, maxBytes = 6000) {
  if (request.method !== 'POST') return { status: 405, body: { version: 1, error: 'invalidCommunityEvidence' } };
  if (request.headers.origin !== `http://${request.headers.host}` || !/^application\/json(?:;|$)/i.test(request.headers['content-type'] || '') || (request.headers['sec-fetch-site'] && request.headers['sec-fetch-site'] !== 'same-origin')) return { status: 403, body: { version: 1, error: 'invalidCommunityEvidence' } };
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
      const bytes = Buffer.from(chunk); size += bytes.length;
      if (size > maxBytes) return { status: 413, body: { version: 1, error: 'invalidCommunityEvidence' } };
      chunks.push(bytes);
    }
    const result = await controller(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    return { status: 200, body: result };
  } catch (error) {
    return { status: error.code === 'busy' || error.code === 'communityRateLimit' ? 429 : 400, body: { version: 1, error: error instanceof AppError ? error.code : 'communitySourceUnavailable' } };
  }
}
