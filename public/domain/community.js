import { videoPattern } from '../config.js';
import { AppError } from './errors.js';

export const communitySources = {
  reddit: { name: 'Reddit / Academic Torrents', url: 'https://support.reddithelp.com/hc/en-us/articles/16470271632404-Pushshift-Access-Request', hosts: ['reddit.com', 'redd.it', 'academictorrents.com'] },
  huggingface: { name: 'Hugging Face', url: 'https://huggingface.co/datasets', hosts: ['huggingface.co'] },
  kaggle: { name: 'Kaggle', url: 'https://www.kaggle.com/datasets', hosts: ['kaggle.com'] },
  stackexchange: { name: 'Stack Exchange', url: 'https://meta.stackexchange.com/questions/419975/the-return-of-the-network-data-dump', hosts: ['stackexchange.com', 'stackoverflow.com', 'superuser.com', 'serverfault.com', 'askubuntu.com', 'mathoverflow.net', 'archive.org'] },
  commoncrawl: { name: 'Common Crawl', url: 'https://commoncrawl.org/get-started', hosts: ['commoncrawl.org'] },
  wikipedia: { name: 'Wikipedia', url: 'https://dumps.wikimedia.org/', hosts: ['wikipedia.org', 'wikimedia.org'] },
};

export function safeSourceLink(value, source) {
  if (typeof value !== 'string' || value.length > 2000 || (typeof source !== 'string' || !Object.hasOwn(communitySources, source))) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !communitySources[source].hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) return '';
    url.search = ''; url.hash = '';
    return url.href;
  } catch { return ''; }
}

function videoId(value) {
  if (typeof value !== 'string') return '';
  if (videoPattern.test(value)) return value;
  try {
    const url = new URL(value.replace(/&amp;/g, '&'));
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
    let id = '';
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed)\/([\w-]{11})$/.exec(url.pathname)?.[1];
    return typeof id === 'string' && videoPattern.test(id) ? id : '';
  } catch { return ''; }
}

export function validateCollections(value) {
  if (!Array.isArray(value) || value.length > 6) throw new AppError('invalidCommunity');
  const sources = new Set();
  let total = 0;
  return value.map(collection => {
    if (!collection || (typeof collection.source !== 'string' || !Object.hasOwn(communitySources, collection.source)) || sources.has(collection.source) || typeof collection.name !== 'string' || collection.name.length > 80 || typeof collection.enabled !== 'boolean' || !Array.isArray(collection.videos) || (total += collection.videos.length) > 2000) throw new AppError('invalidCommunity');
    sources.add(collection.source);
    const ids = new Set();
    const videos = collection.videos.map(video => {
      if (!video || typeof video.id !== 'string' || !videoPattern.test(video.id) || ids.has(video.id) || typeof video.title !== 'string' || video.title.length > 500 || typeof video.channelTitle !== 'string' || video.channelTitle.length > 250 || typeof video.topic !== 'string' || video.topic.length > 100) throw new AppError('invalidCommunity');
      ids.add(video.id);
      return { id: video.id, title: video.title, channelTitle: video.channelTitle, topic: video.topic, sourceUrl: safeSourceLink(video.sourceUrl, collection.source) };
    });
    return { source: collection.source, name: collection.name, enabled: collection.enabled, videos };
  });
}

export function parseCommunityImport(text, source, name) {
  if (typeof text !== 'string' || text.length > 2000000 || (typeof source !== 'string' || !Object.hasOwn(communitySources, source)) || typeof name !== 'string' || !name.trim() || name.length > 80) throw new AppError('invalidCommunity');
  let data;
  try { data = JSON.parse(text); }
  catch {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length > 2000) throw new AppError('invalidCommunity');
    try { data = lines.map(line => JSON.parse(line)); } catch { throw new AppError('invalidCommunity'); }
  }
  if (data?.format !== undefined || data?.version !== undefined) {
    if (data.format !== 'personaltube-community' || data.version !== 1 || data.source !== source) throw new AppError('invalidCommunity');
    data = data.videos;
  }
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length > 2000) throw new AppError('invalidCommunity');
  const videos = new Map();
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new AppError('invalidCommunity');
    const fields = ['url', 'id', 'videoUrl', 'youtube_url', 'body', 'Body', 'selftext', 'text', 'content', 'links'];
    const references = fields.flatMap(field => Array.isArray(row[field]) ? row[field].filter(v => typeof v === 'string') : typeof row[field] === 'string' ? [row[field]] : []);
    for (const reference of references) {
      const links = [reference, ...(reference.match(/https:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s<>"'\])}]+/g) || [])];
      for (const link of links) {
        const id = videoId(link);
        if (!id || videos.has(id)) continue;
        const rawSource = row.sourceUrl || (source === 'reddit' && typeof row.permalink === 'string' && row.permalink.startsWith('/r/') ? `https://www.reddit.com${row.permalink}` : '');
        videos.set(id, { id, title: typeof row.title === 'string' ? row.title.slice(0,500) : typeof row.Title === 'string' ? row.Title.slice(0,500) : `YouTube · ${id}`, channelTitle: typeof row.channelTitle === 'string' ? row.channelTitle.slice(0,250) : 'YouTube', topic: typeof row.topic === 'string' ? row.topic.slice(0,100) : '', sourceUrl: safeSourceLink(rawSource, source) });
        if (videos.size > 2000) throw new AppError('invalidCommunity');
      }
    }
  }
  if (!videos.size) throw new AppError('noCommunityVideos');
  return validateCollections([{ source, name: name.trim(), enabled: true, videos: [...videos.values()] }])[0];
}

export function mergeCollections(current, incoming) {
  const validated = validateCollections([incoming])[0];
  const previous = validateCollections(current);
  const existing = previous.find(c => c.source === validated.source);
  const videos = [...new Map([...(existing?.videos || []), ...validated.videos].map(video => [video.id, video])).values()];
  return validateCollections([...previous.filter(c => c.source !== validated.source), { ...validated, videos }]);
}
