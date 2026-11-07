import { AppError } from '../public/domain/errors.js';
import { apiProviderIds, isLocalProvider, validateApiConfiguration } from '../public/domain/analysis-providers.js';
import { classificationInputs, applyClassifications } from '../public/domain/community-evidence.js';
import { classificationSchema } from './classifier-policy.js';
import { classificationPrompt } from './classification-prompt.js';
import { requestAnalysis } from './analysis-request.js';

export function createApiAnalysis({ request = requestAnalysis } = {}) {
  const configurations = new Map();
  return {
    configure(value) { const config = validateApiConfiguration(value); configurations.set(config.provider, config); },
    forget(provider) { if (!apiProviderIds.includes(provider)) throw new AppError('invalidSetup'); configurations.delete(provider); },
    inspect(provider) {
      const config = configurations.get(provider);
      return { installed:true, supported:true, connected:Boolean(config), method:isLocalProvider(provider)?'local':'api', model:config?.model || '' };
    },
    async classify(provider, rows, mode='community') {
      const config = configurations.get(provider);
      if (!config) throw new AppError('analysisConnectionRequired');
      const inputs = classificationInputs(rows);
      if (!['youtube','community'].includes(mode) || !inputs.length || inputs.length > (mode==='youtube'?160:24) || JSON.stringify(inputs).length > (mode==='youtube'?250000:40000)) throw new AppError('invalidCommunityEvidence');
      const prompt = classificationPrompt(inputs, mode) + '\nOUTPUT JSON SCHEMA:\n' + JSON.stringify(classificationSchema);
      const messages = [{role:'user',content:prompt}];
      const body = {model:config.model,messages,stream:false};
      let headers = {};
      if (provider === 'anthropic') {
        headers = {'x-api-key':config.key,'anthropic-version':'2023-06-01'};
        body.max_tokens = 8192;
      } else if (provider === 'ollama') {
        body.format = classificationSchema; body.options = {num_predict:8192};
      } else {
        if (config.key) headers.Authorization = `Bearer ${config.key}`;
        body[provider==='openai'?'max_completion_tokens':'max_tokens'] = 8192;
        body.response_format = {type:'json_schema',json_schema:{name:'comment_recommendations',strict:true,schema:classificationSchema}};
        if (provider === 'openai') body.store = false;
        if (provider === 'openrouter') body.provider = {require_parameters:true,allow_fallbacks:false};
      }
      const output = await request(provider, {headers,body});
      let text;
      if (provider === 'anthropic') {
        if (output.stop_reason !== 'end_turn' || !Array.isArray(output.content) || output.content.some(item=>item.type!=='text')) throw new AppError('invalidClassification');
        text = output.content.map(item=>item.text).join('');
      } else if (provider === 'ollama') {
        if (output.done !== true || output.done_reason !== 'stop' || output.message?.tool_calls?.length) throw new AppError('invalidClassification');
        text = output.message?.content;
      } else {
        const choice = output.choices?.[0];
        if (choice?.finish_reason !== 'stop' || choice.message?.tool_calls?.length || choice.message?.refusal) throw new AppError('invalidClassification');
        text = choice.message?.content;
      }
      let result;
      try { result = JSON.parse(text); } catch { throw new AppError('invalidClassification'); }
      applyClassifications(rows,result);
      return result;
    },
  };
}
