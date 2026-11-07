import { localModelEndpoint } from './local-models.js';
import { AppError } from './errors.js';

export const subscriptionProviders = ['codex', 'claude'];
export const apiProviderIds = ['openai', 'anthropic', 'openrouter', 'gemini', 'deepseek', 'mistral', 'groq', 'ollama', 'lmstudio', 'local-openai'];
export const providerIds = [...subscriptionProviders, ...apiProviderIds, 'minimax'];
export const providerNames = { gemini:'Google Gemini API', deepseek:'DeepSeek API', mistral:'Mistral API', groq:'Groq', 'local-openai':'OpenAI-compatible · Local', minimax:'MiniMax', codex:'Codex', claude:'Claude Code', openai:'OpenAI API', anthropic:'Anthropic API', openrouter:'OpenRouter', ollama:'Ollama', lmstudio:'LM Studio' };
export const isLocalProvider = provider => ['ollama', 'lmstudio', 'local-openai'].includes(provider);
export function validateApiConfiguration(value) {
  if (!value || Object.keys(value).sort().join(',') !== (value.provider==='local-openai'?'acknowledgeCost,key,model,port,provider':'acknowledgeCost,key,model,provider') || !apiProviderIds.includes(value.provider)) throw new AppError('invalidSetup');
  const { provider, model, key, acknowledgeCost } = value;
  if (typeof model !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,199}$/.test(model)) throw new AppError('analysisModelRequired');
  if (typeof key !== 'string' || key.length > 2048 || (key && !/^[\x21-\x7e]+$/.test(key))) throw new AppError('analysisKeyRequired');
  if (isLocalProvider(provider)) {
    if (key || acknowledgeCost !== false || (provider === 'ollama' && /(?:[:-])cloud$/i.test(model))) throw new AppError('invalidSetup');
  } else if (!key) throw new AppError('analysisKeyRequired');
  else if (acknowledgeCost !== true) throw new AppError('analysisCostRequired');
  if (provider==='local-openai') localModelEndpoint(provider,value.port);
  return { provider, model, key, acknowledgeCost, ...(provider==='local-openai'?{port:value.port}:{}) };
}
