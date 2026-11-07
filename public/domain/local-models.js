import { AppError } from './errors.js';
export function localModelEndpoint(provider, port) {
  if (provider==='local-openai') {
    if (!Number.isInteger(port) || port<1024 || port>65535) throw new AppError('invalidSetup');
    return `http://127.0.0.1:${port}/v1/models`;
  }
  if (port!==undefined) throw new AppError('invalidSetup');
  if (provider==='ollama') return 'http://127.0.0.1:11434/api/tags';
  if (provider==='lmstudio') return 'http://127.0.0.1:1234/v1/models';
  throw new AppError('invalidSetup');
}
export function normalizeLocalModels(provider, result) {
  const rows=provider==='ollama'?result?.models:result?.data;
  if (!Array.isArray(rows) || rows.length>500) throw new AppError('invalidSetup');
  const ids=rows.map(item=>provider==='ollama'?item?.name:item?.id).filter(id=>typeof id==='string' && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,199}$/.test(id) && !/(?:[:-])cloud$/i.test(id));
  return [...new Set(ids)].slice(0,100);
}
