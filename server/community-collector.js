import { createHash } from 'node:crypto';
import { normalizeComment } from '../public/domain/community-evidence.js';
import { AppError } from '../public/domain/errors.js';

export function validateCollectionRequest(value) {
  if (value?.version !== 1 || !['hn','stackexchange','reddit'].includes(value.source) || typeof value.query !== 'string' || value.query.length > 120 || typeof value.scope !== 'string' || value.scope.length > 60 || ![7,30,365].includes(value.days)) throw new AppError('invalidCommunityEvidence');
  if (value.source !== 'hn' && !/^[a-zA-Z0-9_][a-zA-Z0-9_.-]{1,59}$/.test(value.scope)) throw new AppError('invalidCommunityEvidence');
  if (value.source === 'reddit' && (value.approved !== true || typeof value.token !== 'string' || !/^[\w.-]{10,2000}$/.test(value.token) || typeof value.username !== 'string' || !/^[\w-]{3,30}$/.test(value.username))) throw new AppError('redditConnectionRequired');
  return { ...value, query: value.query.trim() };
}
export function createCommunityCollector({ request, now }) {
  const backoff = new Map();
  return async input => {
    const settings = validateCollectionRequest(input);
    const started = now();
    if ((backoff.get(settings.source) || 0) > started) {
      const error = new AppError('communityRateLimit');
      error.retryAfterSeconds = Math.min(86400, Math.ceil((backoff.get(settings.source) - started) / 1000));
      throw error;
    }
    backoff.set(settings.source, started + 60000);
    const from = Math.floor(started / 1000) - settings.days * 86400;
    const comments = new Map();
    let scanned = 0;
    let limited = false;
    const add = row => {
      try {
        const comment = normalizeComment(row);
        if (!comment.videoIds.length || new Date(comment.date).getTime() < from * 1000 || (settings.query && !`${comment.title} ${comment.text}`.toLowerCase().includes(settings.query.toLowerCase()))) return;
        comment.topic = settings.query;
        comment.author = comment.author ? createHash('sha256').update(`${settings.source}:${comment.author}`).digest('hex').slice(0,24) : '';
        comments.set(comment.id, comment);
      } catch { return; }
    };
    if (settings.source === 'hn') {
      for (const term of ['youtube','youtu.be']) for (let page = 0; page < 2; page++) {
        const url = new URL('https://hn.algolia.com/api/v1/search_by_date');
        url.search = new URLSearchParams({ tags: 'comment', query: `${settings.query} ${term}`.trim(), numericFilters: `created_at_i>${from}`, hitsPerPage: '100', page: String(page) }).toString();
        const data = await request(url.href);
        if (!Array.isArray(data.hits) || data.hits.length > 100) throw new AppError('communitySourceUnavailable');
        scanned += data.hits.length;
        for (const item of data.hits) add({ id: String(item.objectID), source: 'hn', text: item.comment_text, title: item.story_title, author: item.author, date: item.created_at, sourceUrl: `https://news.ycombinator.com/item?id=${item.objectID}` });
        limited ||= data.nbPages > 2;
        if (!(data.nbPages > page + 1)) break;
      }
    } else if (settings.source === 'stackexchange') {
      for (let page = 1; page <= 3; page++) {
        const url = new URL('https://api.stackexchange.com/2.3/comments');
        url.search = new URLSearchParams({ site: settings.scope, filter: 'withbody', pagesize: '100', page: String(page), sort: 'creation', order: 'desc', fromdate: String(from) }).toString();
        const data = await request(url.href);
        if (!Array.isArray(data.items) || data.items.length > 100) throw new AppError('communitySourceUnavailable');
        scanned += data.items.length;
        for (const item of data.items) add({ id: String(item.comment_id), source: 'stackexchange', text: item.body, title: settings.scope, author: String(item.owner?.user_id || ''), date: new Date(item.creation_date * 1000).toISOString(), sourceUrl: item.link });
        limited = Boolean(data.has_more);
        if (data.backoff) backoff.set(settings.source, Math.max(backoff.get(settings.source), now() + Math.min(86400, Number(data.backoff) || 0) * 1000));
        if (!data.has_more || data.backoff || data.quota_remaining === 0) break;
      }
    } else {
      let after = '';
      for (let page = 0; page < 3; page++) {
        const url = new URL(`https://oauth.reddit.com/r/${settings.scope}/comments`);
        url.search = new URLSearchParams({ limit: '100', raw_json: '1', ...(after ? { after } : {}) }).toString();
        const data = await request(url.href, { headers: { Authorization: `Bearer ${settings.token}`, 'User-Agent': `desktop:personaltube:v1.2.0 (by /u/${settings.username})` } });
        if (!Array.isArray(data?.data?.children) || data.data.children.length > 100) throw new AppError('communitySourceUnavailable');
        scanned += data.data.children.length;
        for (const { data: item } of data.data.children) if (item && !['[deleted]','[removed]'].includes(item.body)) add({ id: item.id, source: 'reddit', text: item.body, title: item.link_title, author: item.author === '[deleted]' ? '' : item.author, date: new Date(item.created_utc * 1000).toISOString(), sourceUrl: `https://www.reddit.com${item.permalink}` });
        after = data.data.after;
        limited = Boolean(after);
        if (!after || !/^t1_[a-z0-9]+$/.test(after)) break;
      }
    }
    return { version: 1, source: settings.source, comments: [...comments.values()].slice(0,400), scanned, limited, retryAfterSeconds: Math.max(0, Math.min(86400, Math.ceil((backoff.get(settings.source) - now()) / 1000))), fetchedAt: new Date(started).toISOString() };
  };
}
