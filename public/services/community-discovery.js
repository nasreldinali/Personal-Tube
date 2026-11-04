import { COMMUNITY_AUTO_CALLS } from '../config.js';
import { AppError } from '../domain/errors.js';

function validateProgress(result, previous) {
  if (result?.version !== 1 || typeof result.session !== 'string' || !result.session || result.session.length > 100 || result.analysisLimit !== COMMUNITY_AUTO_CALLS || !Array.isArray(result.videos)) throw new AppError('invalidCommunityEvidence');
  for (const field of ['totalComments','foundComments','pending','analyzed']) if (!Number.isSafeInteger(result[field]) || result[field] < 0) throw new AppError('invalidCommunityEvidence');
  if (result.totalComments > 72 || result.foundComments > 400 || result.foundComments < result.totalComments || result.pending + result.analyzed !== result.totalComments || result.videos.some(video => !Number.isFinite(video.score) || video.score <= 0)) throw new AppError('invalidCommunityEvidence');
  if (previous && (result.session !== previous.session || result.totalComments !== previous.totalComments || result.foundComments !== previous.foundComments || result.pending >= previous.pending)) throw new AppError('communityAnalysisStopped');
}
export async function discoverCommunity({ request, onProgress, isCancelled }, input) {
  let result = await request({ ...input, action: 'discover' });
  validateProgress(result);
  onProgress(result);
  for (let step = 0; result.pending && step < COMMUNITY_AUTO_CALLS; step++) {
    if (isCancelled()) return { ...result, stopped: true };
    const next = await request({ action: 'analyze', session: result.session, sort: 'top' });
    validateProgress(next, result);
    result = next;
    onProgress(result);
  }
  if (isCancelled()) return { ...result, stopped: true };
  if (result.pending) throw new AppError('communityAnalysisStopped');
  return result;
}
