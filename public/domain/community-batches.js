import { COMMUNITY_AUTO_CALLS } from '../config.js';
import { classificationInputs } from './community-evidence.js';
import { AppError } from './errors.js';

export function communityBatches(rows, limit = COMMUNITY_AUTO_CALLS) {
  if (!Array.isArray(rows) || rows.length > 400 || !Number.isInteger(limit) || limit < 1 || limit > COMMUNITY_AUTO_CALLS) throw new AppError('invalidCommunityEvidence');
  const batches = [];
  let current = [];
  const fits = batch => classificationInputs(batch).length <= 24 && JSON.stringify(classificationInputs(batch)).length <= 40000;
  for (const row of rows) {
    if (!Array.isArray(row?.videoIds) || !row.videoIds.length || !fits([row])) throw new AppError('invalidCommunityEvidence');
    if (!fits([...current,row])) { batches.push(current); current = []; }
    if (batches.length === limit) break;
    current.push(row);
  }
  if (current.length) batches.push(current);
  const comments = batches.flat();
  return { batches, comments, omitted: rows.length - comments.length };
}
