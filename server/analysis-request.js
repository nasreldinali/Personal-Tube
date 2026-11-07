import { localModelEndpoint } from '../public/domain/local-models.js';
import { AppError } from '../public/domain/errors.js';

const endpoints = {
  gemini:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  deepseek:'https://api.deepseek.com/chat/completions',
  mistral:'https://api.mistral.ai/v1/chat/completions',
  groq:'https://api.groq.com/openai/v1/chat/completions',
  minimax: 'https://api.minimax.io/anthropic/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  ollama: 'http://127.0.0.1:11434/api/chat',
  lmstudio: 'http://127.0.0.1:1234/v1/chat/completions',
};
export async function requestAnalysis(provider, { headers = {}, body, signal, method='POST', port }, fetcher = fetch) {
  if (!['GET','POST'].includes(method) || (!Object.hasOwn(endpoints,provider) && provider!=='local-openai')) throw new AppError('invalidSetup');
  const endpoint=method==='GET'?localModelEndpoint(provider,port):provider==='local-openai'?localModelEndpoint(provider,port).replace('/models','/chat/completions'):endpoints[provider];
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, method==='GET'?10000:120000);
  signal?.addEventListener('abort', abort, { once:true });
  if (signal?.aborted) abort();
  let reader;
  let onAbort;
  const stopped = new Promise((_, reject) => {
    onAbort = () => reject(new AppError('analysisUnavailable'));
    controller.signal.addEventListener('abort', onAbort, { once:true });
    if (controller.signal.aborted) onAbort();
  });
  try {
    const response = await Promise.race([fetcher(endpoint, { method, headers:{'Content-Type':'application/json',...headers}, body:JSON.stringify(body), redirect:'error', signal:controller.signal }), stopped]);
    if ([401,403].includes(response.status)) throw new AppError('analysisAuthFailed');
    if (response.status === 429) throw new AppError('analysisRateLimit');
    if (!response.ok || Number(response.headers.get('content-length') || 0) > 1000000) throw new AppError('analysisUnavailable');
    reader = response.body.getReader();
    const chunks = []; let size = 0;
    while (true) {
      const {done,value} = await Promise.race([reader.read(),stopped]);
      if (done) break;
      size += value.length;
      if (size > 1000000) throw new AppError('analysisUnavailable');
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('analysisUnavailable');
  } finally {
    clearTimeout(timer); controller.abort();
    signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', onAbort);
    if (reader) void reader.cancel().catch(() => {});
  }
}
