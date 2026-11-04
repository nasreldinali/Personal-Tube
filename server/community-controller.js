import { rankEvidence } from '../public/domain/community-evidence.js';
import { AppError } from '../public/domain/errors.js';
import { communityBatches } from '../public/domain/community-batches.js';
import { COMMUNITY_AUTO_CALLS } from '../public/config.js';

export function createCommunityController({ archive, collect, analyze, catalog, enrich = async videos => videos, now, id, schedule = () => () => {} }) {
  const sessions = new Map();
  let collecting = false;
  let activeJobs = 0;
  let activeResults = 0;
  const drop = key => { sessions.get(key)?.cancelExpiry?.(); sessions.delete(key); };
  const pendingRows = session => session.comments.filter(row => row.videoIds.some(video => !row.labels[video]));
  async function result(key, session, sort = 'shared') {
    if (!['top','newest','shared'].includes(sort)) throw new AppError('invalidCommunityEvidence');
    activeResults++;
    try {
      const source = await catalog();
      const metadata = Object.fromEntries(source.videos.map(video => [video.id,video]));
      const ranked = rankEvidence(session.comments, metadata,sort);
      const videos = await enrich(session.automatic ? ranked.filter(video => video.score > 0) : ranked);
      if (sessions.get(key) !== session) throw new AppError('communitySessionExpired');
      return { version: 1, session: key, source: session.source, fetchedAt: session.fetchedAt, scanned: session.scanned, limited: session.limited, pending: pendingRows(session).length, analyzed: session.comments.length - pendingRows(session).length, videos, totalComments: session.comments.length, ...(session.automatic ? { foundComments: session.foundComments, analysisLimit: COMMUNITY_AUTO_CALLS } : {}) };
    } finally { activeResults--; }
  }
  return async input => {
    if (input?.version !== 1) throw new AppError('invalidCommunityEvidence');
    if (!['archive','collect','discover','analyze','results','clear','clearAll'].includes(input.action) || (input.sort !== undefined && !['top','newest','shared'].includes(input.sort))) throw new AppError('invalidCommunityEvidence');
    for (const [key,session] of sessions) if (now() - session.created >= 3600000) drop(key);
    if(input.action==='clearAll') {
      if(collecting || activeJobs || activeResults)throw new AppError('busy');
      for(const key of sessions.keys())drop(key);
      return {version:1,videos:[]};
    }
    if (input.action === 'archive') return archive(input);
    if (['collect','discover'].includes(input.action)) {
      if (collecting) throw new AppError('busy');
      collecting = true;
      try {
        const found = await collect(input);
        const automatic = input.action === 'discover';
        const sample = automatic ? communityBatches(found.comments) : null;
        const key = id();
        if (sessions.size >= 4) drop(sessions.keys().next().value);
        const session = { ...found, ...(sample ? { comments: sample.comments, foundComments: found.comments.length, limited: found.limited || sample.omitted > 0 } : {}), automatic, analysisSteps: 0, created: now(), analyzing: false };
        sessions.set(key,session);
        session.cancelExpiry=schedule(()=>drop(key),3600000);
        return await result(key,session,automatic ? 'top' : 'shared');
      } finally { collecting = false; }
    }
    const session = sessions.get(input.session);
    if (!session) throw new AppError('communitySessionExpired');
    if (input.action === 'clear') { if (session.analyzing) throw new AppError('busy'); drop(input.session); return { version:1, videos:[] }; }
    if (input.action === 'analyze') {
      if (session.analyzing) throw new AppError('busy');
      const rows = communityBatches(pendingRows(session),1).comments;
      if (rows.length) {
        if (session.automatic && session.analysisSteps >= COMMUNITY_AUTO_CALLS) throw new AppError('communityAnalysisStopped');
        session.analysisSteps++;
        session.analyzing = true;
        activeJobs++;
        try {
          const classified = await analyze(rows);
          if(sessions.get(input.session)!==session)throw new AppError('communitySessionExpired');
          const byId = new Map(classified.map(row => [row.id,row]));
          session.comments = session.comments.map(row => byId.get(row.id) || row);
        } finally { session.analyzing = false; activeJobs--; }
      }
    } else if (input.action !== 'results') throw new AppError('invalidCommunityEvidence');
    return result(input.session,session,input.sort);
  };
}
