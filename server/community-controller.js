import { rankEvidence } from '../public/domain/community-evidence.js';
import { AppError } from '../public/domain/errors.js';

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
      const videos = await enrich(rankEvidence(session.comments, metadata,sort));
      if (sessions.get(key) !== session) throw new AppError('communitySessionExpired');
      return { version: 1, session: key, source: session.source, fetchedAt: session.fetchedAt, scanned: session.scanned, limited: session.limited, pending: pendingRows(session).length, analyzed: session.comments.length - pendingRows(session).length, videos, totalComments: session.comments.length };
    } finally { activeResults--; }
  }
  return async input => {
    if (input?.version !== 1) throw new AppError('invalidCommunityEvidence');
    if (!['archive','collect','analyze','results','clear','clearAll'].includes(input.action) || (input.sort !== undefined && !['top','newest','shared'].includes(input.sort))) throw new AppError('invalidCommunityEvidence');
    for (const [key,session] of sessions) if (now() - session.created >= 3600000) drop(key);
    if(input.action==='clearAll') {
      if(collecting || activeJobs || activeResults)throw new AppError('busy');
      for(const key of sessions.keys())drop(key);
      return {version:1,videos:[]};
    }
    if (input.action === 'archive') return archive(input);
    if (input.action === 'collect') {
      if (collecting) throw new AppError('busy');
      collecting = true;
      try {
        const found = await collect(input);
        const key = id();
        if (sessions.size >= 4) drop(sessions.keys().next().value);
        const session = { ...found, created: now(), analyzing: false };
        sessions.set(key,session);
        session.cancelExpiry=schedule(()=>drop(key),3600000);
        return await result(key,session);
      } finally { collecting = false; }
    }
    const session = sessions.get(input.session);
    if (!session) throw new AppError('communitySessionExpired');
    if (input.action === 'clear') { if (session.analyzing) throw new AppError('busy'); drop(input.session); return { version:1, videos:[] }; }
    if (input.action === 'analyze') {
      if (session.analyzing) throw new AppError('busy');
      const rows = [];
      let pairs = 0;
      for (const row of pendingRows(session)) { if (pairs + row.videoIds.length > 24) break; rows.push(row); pairs += row.videoIds.length; }
      if (rows.length) {
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
