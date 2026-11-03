import { readFile } from 'node:fs/promises';
import { AppError } from '../public/domain/errors.js';

export function createCommunityRepository({ root, catalog }) {
  let pending;
  const load = () => pending ||= readFile(new URL('data/hackertube/evidence.json',root),'utf8').then(text => {
    const data = JSON.parse(text);
    if (data.version !== 1 || data.sourceVersion !== '405edcef' || !data.byVideo || !data.related) throw new AppError('invalidCommunityEvidence');
    return data;
  }).catch(error => { pending = undefined; throw error; });
  return async ({ query = '', page = 0, relatedTo = '' } = {}) => {
    if (typeof query !== 'string' || query.length > 120 || !Number.isInteger(page) || page < 0 || page > 300 || (relatedTo && !/^[\w-]{11}$/.test(relatedTo))) throw new AppError('invalidCommunityEvidence');
    const [data, source] = await Promise.all([load(),catalog()]);
    const peers = relatedTo ? data.related[relatedTo] || [] : null;
    const found = source.videos.filter(video => video.recommenders > 0 && video.shelfLife !== 'news' && (!peers || peers.some(peer => peer.id === video.id)) && (!query || `${video.title} ${video.summary} ${video.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())));
    found.sort((a,b) => b.score - a.score);
    return { version: 1, source: 'archive', total: found.length, originalComments: data.comments, page, videos: found.slice(page*24,(page+1)*24).map(video => ({ ...video, evidence: (data.byVideo[video.id] || []).filter(row => ['rec','strong_rec'].includes(row.stance)).slice(0,8), shares: (data.byVideo[video.id] || []).length, latest: (data.byVideo[video.id] || []).map(row => row.date).sort().at(-1) || '', scoreOrigin: 'upstream' })) };
  };
}
