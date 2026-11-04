import { AppError } from '../public/domain/errors.js';
import { classificationInputs, applyClassifications } from '../public/domain/community-evidence.js';

export function createProviderManager({ inspect, login, classifiers, now }) {
  const providers = ['codex','claude'];
  const usage = Object.fromEntries(providers.map(p=>[p,{attempted:0,completed:0,failed:0,inputs:0}]));
  const connections = {};
  const lastLogin = {};
  let selected = 'codex';
  let busy = false;
  let checking = false;
  async function status() {
    const states = {};
    for (const provider of providers) states[provider] = { ...await inspect(provider), connection: connections[provider] || 'idle' };
    return { version:1, selected, providers:states, usage:structuredClone(usage), busy, runtime:true };
  }
  return {
    async control(input) {
      if (input?.version !== 1 || !['status','select','connect'].includes(input.action) || (input.action !== 'status' && !providers.includes(input.provider))) throw new AppError('invalidSetup');
      if (checking || (busy && input.action !== 'status')) throw new AppError('busy');
      checking = true;
      try {
        if (input.action === 'select') selected = input.provider;
        if (input.action === 'connect') {
          const provider = input.provider;
          const state = await inspect(provider);
          if (!state.installed) throw new AppError('providerMissing');
          if (!state.supported) throw new AppError('classifierVersion');
          if (!state.connected) {
            if (Object.values(connections).includes('pending') || now() - (lastLogin[provider] ?? -Infinity) < 60000) throw new AppError('connectionCooldown');
            lastLogin[provider] = now();connections[provider] = 'pending';
            Promise.resolve().then(()=>login(provider)).then(()=>{connections[provider]='finished';},()=>{connections[provider]='failed';});
          }
        }
        return await status();
      } finally { checking = false; }
    },
    async classify(rows, mode='community') {
      if(busy || checking || Object.values(connections).includes('pending'))throw new AppError('busy');
      if(!['community','youtube'].includes(mode))throw new AppError('invalidCommunityEvidence');
      const inputs=classificationInputs(rows);
      if(!inputs.length || inputs.length>(mode==='youtube'?160:24) || JSON.stringify(inputs).length>(mode==='youtube'?250000:40000))throw new AppError('invalidCommunityEvidence');
      busy=true;
      const provider=selected;
      let attempted=false;
      try {
        const state=await inspect(provider);
        if(!state.supported)throw new AppError(state.installed?'classifierVersion':'providerMissing');
        if(!state.connected || state.method!=='subscription')throw new AppError('analysisConnectionRequired');
        usage[provider].attempted++;usage[provider].inputs+=inputs.length;attempted=true;
        const result=await classifiers[provider](rows,mode);applyClassifications(rows,result);usage[provider].completed++;return result;
      } catch(error) {if(attempted)usage[provider].failed++;throw error;}
      finally {busy=false;}
    },
  };
}
