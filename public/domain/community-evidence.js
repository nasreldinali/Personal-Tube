import { videoPattern } from '../config.js';
import { AppError } from './errors.js';

export const stances = ['pending', 'rec', 'strong_rec', 'reference', 'critical', 'joke'];
const sourceHosts = { hn: ['news.ycombinator.com'], stackexchange: ['stackoverflow.com', 'stackexchange.com', 'superuser.com', 'serverfault.com', 'askubuntu.com', 'mathoverflow.net'], reddit: ['reddit.com'] };
function decodeEntities(value) {
  return String(value || '').replace(/&#(x[\da-f]+|\d+);/gi, (_,code) => { const n = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1),16) : Number(code); return n <= 1114111 ? String.fromCodePoint(n) : ''; }).replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g, s => ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' })[s]);
}
export function redactContacts(text) {
  return String(text || '').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]').replace(/(?:AIza[\w-]{30,}|gh[pousr]_[\w]{30,}|sk-[\w-]{25,})/g, '[credential]');
}
export function plainText(value) {
  return redactContacts(decodeEntities(String(value || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim());
}
export function extractVideoIds(value) {
  const found = new Set();
  for (const link of decodeEntities(value).match(/https?:\/\/[^\s<>"'\])}]+/g) || []) {
    try {
      const url = new URL(link.replace(/[.,;:!?]+$/g,''));
      if (url.username || url.password || url.port) continue;
      let id;
      if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
      if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed|live)\/([\w-]{11})$/.exec(url.pathname)?.[1];
      if (typeof id === 'string' && videoPattern.test(id)) found.add(id);
    } catch { continue; }
  }
  return [...found].slice(0,5);
}
export function normalizeComment(row, trusted = false) {
  if (!row || typeof row.id !== 'string' || !/^[\w-]{1,100}$/.test(row.id) || !Object.hasOwn(sourceHosts, row.source) || typeof row.text !== 'string' || row.text.length > 100000) throw new AppError('invalidCommunityEvidence');
  const date = new Date(row.date);
  if (!Number.isFinite(date.getTime()) || typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(row.date)) throw new AppError('invalidCommunityEvidence');
  let url;
  try { url = new URL(row.sourceUrl); } catch { throw new AppError('invalidCommunityEvidence'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !sourceHosts[row.source].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new AppError('invalidCommunityEvidence');
  const annotated = row.text.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_,href,label) => `${label} ${extractVideoIds(href).map(id=>`[VIDEO:${id}]`).join(' ')}`);
  const text = plainText(annotated).slice(0,1500);
  const ids = trusted && Array.isArray(row.videoIds) ? row.videoIds.filter(id => typeof id === 'string' && videoPattern.test(id)).slice(0,5) : extractVideoIds(row.text).filter(id=>text.includes(id));
  return { id: row.id, source: row.source, videoIds: [...new Set(ids)], text, title: plainText(row.title).slice(0,200), author: typeof row.author === 'string' ? row.author.slice(0,100) : '', date: date.toISOString(), month: date.toISOString().slice(0,7), sourceUrl: url.href, stance: trusted && stances.includes(row.stance) ? row.stance : 'pending', labels: trusted && row.labels ? row.labels : {} };
}
export function classificationInputs(rows) {
  return rows.flatMap((row, i) => row.videoIds.map(id => ({ key: `${i}:${id}`, video: id, context: row.title, text: row.text })));
}
export function applyClassifications(rows, result) {
  const inputs = classificationInputs(rows);
  if (result?.version !== 1 || Object.keys(result).sort().join(',') !== 'items,version' || !Array.isArray(result.items) || result.items.length !== inputs.length) throw new AppError('invalidClassification');
  const expected = new Map(inputs.map(row => [row.key, row]));
  const next = rows.map(row => ({ ...row, labels: { ...row.labels } }));
  for (const item of result.items) {
    const input = expected.get(item?.key);
    if (!input || Object.keys(item).sort().join(',') !== 'key,quote,stance' || !stances.slice(1).includes(item.stance) || typeof item.quote !== 'string' || item.quote.length > 400 || (['rec','strong_rec'].includes(item.stance) && !item.quote.trim()) || !input.text.includes(item.quote)) throw new AppError('invalidClassification');
    const [index, id] = item.key.split(':');
    next[Number(index)].labels[id] = { stance: item.stance, quote: item.quote, origin: 'analysis' };
    expected.delete(item.key);
  }
  return next;
}
export function rankEvidence(rows, metadata = {}, sort = 'top') {
  const videos = new Map();
  const seen = new Set();
  for (const row of rows) for (const id of row.videoIds) {
    const key = `${row.source}:${row.id}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!videos.has(id)) videos.set(id, { id, title: metadata[id]?.title || `YouTube · ${id}`, channelTitle: metadata[id]?.channelTitle || 'YouTube', categories: metadata[id]?.categories || [], tags: [], summary: metadata[id]?.summary || '', months: new Set(), strong: new Set(), authors: new Set(), shares: 0, latest: '', evidence: [], score: 0 });
    const video = videos.get(id);
    const label = row.labels?.[id] || { stance: row.stance, quote: row.text.slice(0,300), origin: row.stance === 'pending' ? 'pending' : 'upstream' };
    video.shares++;
    if (row.date > video.latest) video.latest = row.date;
    if (['rec','strong_rec'].includes(label.stance)) {
      video.months.add(row.month);
      if (row.author) video.authors.add(`${row.source}:${row.author}`);
      if (label.stance === 'strong_rec') video.strong.add(row.month);
    }
    if (video.evidence.length < 20) video.evidence.push({ source: row.source, date: row.date, sourceUrl: row.sourceUrl, text: row.text, ...label });
  }
  return [...videos.values()].map(({ months, strong, authors, ...video }) => ({ ...video, score: months.size + 0.5 * strong.size, recommenders: authors.size, recommendationMonths: months.size })).filter(v => sort !== 'top' || v.score > 0).sort((a,b) => sort === 'newest' ? b.latest.localeCompare(a.latest) || a.id.localeCompare(b.id) : sort === 'shared' ? b.shares - a.shares || a.id.localeCompare(b.id) : b.score - a.score || b.recommenders - a.recommenders || a.id.localeCompare(b.id));
}
