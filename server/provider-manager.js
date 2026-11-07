import { subscriptionProviders, apiProviderIds, providerIds } from '../public/domain/analysis-providers.js';
import { AppError } from '../public/domain/errors.js';
import { classificationInputs, applyClassifications } from '../public/domain/community-evidence.js';

export function createProviderManager({ inspect, login, classifiers, now, logout, api, minimax, localModels }) {
  const providers = [...(api ? providerIds.filter(p=>p!=='minimax') : subscriptionProviders), ...(minimax ? ['minimax'] : [])];
  const tested = {};
  const lastTest = {};
  const pendingLogin = () => Object.values(connections).includes('pending');
  const inspectProvider = provider => provider === 'minimax' ? minimax.inspect() : apiProviderIds.includes(provider) ? api.inspect(provider) : inspect(provider);
  const usage = Object.fromEntries(providers.map(p=>[p,{attempted:0,completed:0,failed:0,inputs:0}]));
  const connections = {};
  const lastLogin = {};
  let selected = 'codex';
  let busy = false;
  let checking = false;
  async function status() {
    const states = {};
    for (const provider of providers) states[provider] = { ...await inspectProvider(provider), tested: Boolean(tested[provider]), connection: connections[provider] || 'idle' };
    return { version:1, selected, providers:states, usage:structuredClone(usage), busy, runtime:true };
  }
  return {
    async control(input) {
      if (input?.version !== 1 || !['status','select','connect','logout','configure','forget','test','models'].includes(input.action) || (input.action !== 'status' && !providers.includes(input.provider))) throw new AppError('invalidSetup');
      const fields = {models:['version','action','provider','port'],status:['version','action','provider'],select:['version','action','provider'],connect:['version','action','provider'],logout:['version','action','provider','confirm'],configure:['version','action','provider','configuration'],forget:['version','action','provider','confirm'],test:['version','action','provider','confirm']};
      if (Object.keys(input).some(key=>!fields[input.action].includes(key))) throw new AppError('invalidSetup');
      if (['logout','forget','test'].includes(input.action) && input.confirm !== true) throw new AppError('invalidSetup');
      if (checking || ((busy || pendingLogin()) && input.action !== 'status')) throw new AppError('busy');
      checking = true;
      try {
        if (input.action === 'models') {
          if (!localModels) throw new AppError('invalidSetup');
          const models=await localModels(input.provider,input.port);
          return {...await status(),models};
        }
        if (input.action === 'select') selected = input.provider;
        const provider = input.provider;
        if (input.action === 'configure') {
          if (provider === 'minimax') { minimax.configure(input.configuration); tested[provider]=false; }
          else {
            if (!api || !apiProviderIds.includes(provider) || input.configuration?.provider !== provider) throw new AppError('invalidSetup');
            api.configure(input.configuration); tested[provider]=false; selected=provider;
          }
        }
        if (input.action === 'forget') {
          if (provider === 'minimax') minimax.forget();
          else { if (!api || !apiProviderIds.includes(provider)) throw new AppError('invalidSetup'); api.forget(provider); }
          tested[provider]=false;
        }
        if (input.action === 'logout') {
          if (!subscriptionProviders.includes(provider) || !logout) throw new AppError('invalidSetup');
          const state = await inspect(provider);
          if (!state.installed || !state.supported) throw new AppError('classifierVersion');
          await logout(provider); tested[provider]=false; connections[provider]='idle';
        }
        if (input.action === 'test') {
          if (selected !== provider && provider !== 'minimax') throw new AppError('invalidSetup');
          if (now() - (lastTest[provider] ?? -Infinity) < 60000) throw new AppError('connectionCooldown');
          lastTest[provider]=now();
          await execute([{id:'connection-test',videoIds:['abcdefghijk'],text:'Recommended explanation',title:'Synthetic connection test'}], 'community', provider);
        }
        if (input.action === 'connect') {
          const provider = input.provider;
          const state = await inspectProvider(provider);
          if (apiProviderIds.includes(provider) || provider === 'minimax') {
            if (!state.connected) throw new AppError('analysisConnectionRequired');
          }
          if (!state.installed) throw new AppError('providerMissing');
          if (!state.supported) throw new AppError('classifierVersion');
          if (!state.connected) {
            if (Object.values(connections).includes('pending') || now() - (lastLogin[provider] ?? -Infinity) < 60000) throw new AppError('connectionCooldown');
            lastLogin[provider] = now();connections[provider] = 'pending';
            Promise.resolve().then(()=>login(provider)).then(()=>{connections[provider]='finished';},()=>{connections[provider]='failed';});
          }
          selected = provider;
        }
        return await status();
      } finally { checking = false; }
    },
    async classify(rows, mode='community') {
      if(busy || checking || pendingLogin())throw new AppError('busy');
      return execute(rows, mode);
    },
  };
  async function execute(rows, mode, provider=selected) {
      if(!['community','youtube'].includes(mode))throw new AppError('invalidCommunityEvidence');
      const inputs=classificationInputs(rows);
      if(!inputs.length || inputs.length>(mode==='youtube'?160:24) || JSON.stringify(inputs).length>(mode==='youtube'?250000:40000))throw new AppError('invalidCommunityEvidence');
      busy=true;
      let attempted=false;
      try {
        const state=await inspectProvider(provider);
        if(!state.supported)throw new AppError(state.installed?'classifierVersion':'providerMissing');
        if (subscriptionProviders.includes(provider) || provider === 'minimax') {
          if(!state.connected || state.method!=='subscription')throw new AppError('analysisConnectionRequired');
        } else if (!state.connected) throw new AppError('analysisConnectionRequired');
        usage[provider].attempted++;usage[provider].inputs+=inputs.length;attempted=true;
        const result=provider === 'minimax' ? await minimax.classify(rows,mode) : apiProviderIds.includes(provider) ? await api.classify(provider,rows,mode) : await classifiers[provider](rows,mode);applyClassifications(rows,result);usage[provider].completed++;tested[provider]=true;return result;
      } catch(error) {if(attempted)usage[provider].failed++;throw error;}
      finally {busy=false;}
  }
}
