import { localModelEndpoint, normalizeLocalModels } from '../public/domain/local-models.js';
import { requestAnalysis } from './analysis-request.js';
export function createLocalModels({request=requestAnalysis}={}) {
  return async (provider,port) => {
    localModelEndpoint(provider,port);
    return normalizeLocalModels(provider,await request(provider,{method:'GET',port}));
  };
}
