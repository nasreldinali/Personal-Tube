import { AppError } from '../public/domain/errors.js';
import { minimaxModel, validateMiniMaxSubscription } from '../public/domain/minimax-subscription.js';
import { classificationInputs, applyClassifications } from '../public/domain/community-evidence.js';
import { classificationSchema } from './classifier-policy.js';
import { classificationPrompt } from './classification-prompt.js';
import { requestAnalysis } from './analysis-request.js';

export function createMiniMaxSubscription({ request = requestAnalysis } = {}) {
  let configuration = null;
  return {
    configure(value) { configuration = validateMiniMaxSubscription(value); },
    forget() { configuration = null; },
    inspect() { return {installed:true,supported:true,connected:Boolean(configuration),method:'subscription',model:minimaxModel}; },
    async classify(rows, mode='community') {
      if (!configuration) throw new AppError('analysisConnectionRequired');
      const inputs=classificationInputs(rows);
      if (!['youtube','community'].includes(mode) || !inputs.length || inputs.length>(mode==='youtube'?160:24) || JSON.stringify(inputs).length>(mode==='youtube'?250000:40000)) throw new AppError('invalidCommunityEvidence');
      const output=await request('minimax',{
        headers:{Authorization:`Bearer ${configuration.key}`,'anthropic-version':'2023-06-01'},
        body:{model:minimaxModel,max_tokens:8192,stream:false,output_config:{effort:'low'},messages:[{role:'user',content:classificationPrompt(inputs,mode)+'\nOUTPUT JSON SCHEMA:\n'+JSON.stringify(classificationSchema)}]},
      });
      if (output?.type!=='message' || output.stop_reason!=='end_turn' || !Array.isArray(output.content) || output.content.some(item=>!item || !['text','thinking'].includes(item.type))) throw new AppError('invalidClassification');
      const blocks=output.content.filter(item=>item.type==='text');
      if (!blocks.length || blocks.some(item=>typeof item.text!=='string')) throw new AppError('invalidClassification');
      let result;
      try { result=JSON.parse(blocks.map(item=>item.text).join('')); } catch { throw new AppError('invalidClassification'); }
      applyClassifications(rows,result);
      return result;
    },
  };
}
