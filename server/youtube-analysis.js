import { youtubeAnalysisRows } from '../public/domain/youtube-evidence.js';
import { applyClassifications } from '../public/domain/community-evidence.js';
import { AppError } from '../public/domain/errors.js';

export function createYouTubeAnalysis({ classify, now }) {
  let busy = false;
  let nextRun = 0;
  return async input => {
    const rows = youtubeAnalysisRows(input);
    if (busy) throw new AppError('busy');
    if (!rows.length) return { version: 1, items: [] };
    if (now() < nextRun) throw new AppError('communityRateLimit');
    busy = true;
    try {
      const result = await classify(rows, 'youtube');
      applyClassifications(rows, result);
      return result;
    } finally { busy = false; nextRun = now() + 15000; }
  };
}
