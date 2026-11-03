import { applyClassifications, classificationInputs } from '../public/domain/community-evidence.js';
import { AppError } from '../public/domain/errors.js';

export function createCommunityAnalysis({ classify }) {
  let busy = false;
  return async rows => {
    if (!Array.isArray(rows) || !rows.length || rows.length > 24 || classificationInputs(rows).length > 24 || JSON.stringify(classificationInputs(rows)).length > 40000) throw new AppError('invalidCommunityEvidence');
    if (busy) throw new AppError('busy');
    busy = true;
    try { return applyClassifications(rows, await classify(rows)); }
    finally { busy = false; }
  };
}
