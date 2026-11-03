import { videoPattern, channelPattern } from '../config.js';
import { parseChannel, safeImage } from '../domain/feed.js';
import { AppError } from '../domain/errors.js';

export class YouTubeClient {
  constructor(key, fetcher = fetch) { this.key = key; this.fetcher = fetcher; }

  async request(resource, params) {
    if (!['channels', 'playlistItems', 'videos', 'search', 'commentThreads'].includes(resource)) throw new AppError('invalidResource');
    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
    url.search = new URLSearchParams(params);
    let response;
    try {
      response = await this.fetcher(url, { headers: { 'X-Goog-Api-Key': this.key }, signal: AbortSignal.timeout(15000) });
    } catch { throw new AppError('network'); }
    let data;
    try { data = await response.json(); } catch { throw new AppError('invalidResponse'); }
    if (!response.ok) {
      const reason = data?.error?.errors?.[0]?.reason;
      if (['commentsDisabled', 'videoNotFound'].includes(reason) && resource === 'commentThreads') throw new AppError('commentsUnavailable');
      if (['quotaExceeded', 'dailyLimitExceeded'].includes(reason)) throw new AppError('quota');
      if ([400, 401, 403].includes(response.status)) throw new AppError('invalidKey');
      if (response.status === 404) throw new AppError('channelMissing');
      throw new AppError('serviceUnavailable');
    }
    if (!data || !Array.isArray(data.items) || data.items.length > 50 || (data.nextPageToken !== undefined && (typeof data.nextPageToken !== 'string' || data.nextPageToken.length > 2000))) throw new AppError('invalidResponse');
    return data;
  }

  async resolve(input) {
    const data = await this.request('channels', { part: 'snippet,contentDetails', ...parseChannel(input) });
    const channel = data.items[0];
    if (!channel) throw new AppError('channelMissing');
    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    if (!channelPattern.test(channel.id) || typeof channel.snippet?.title !== 'string' || channel.snippet.title.length > 250 || typeof uploads !== 'string' || !/^[\w-]{2,100}$/.test(uploads)) throw new AppError('invalidResponse');
    return { id: channel.id, title: channel.snippet.title, image: safeImage(channel.snippet.thumbnails?.default?.url), uploads };
  }

  async latest(channel, now = Date.now()) {
    let pageToken = '';
    const seen = new Set();
    for (let pageNumber = 0; pageNumber < 5; pageNumber++) {
      const page = await this.request('playlistItems', { part: 'contentDetails', playlistId: channel.uploads, maxResults: '50', ...(pageToken ? { pageToken } : {}) });
      const ids = page.items.map(item => item?.contentDetails?.videoId).filter(id => videoPattern.test(id));
      if (ids.length) {
        const data = await this.request('videos', { part: 'snippet,contentDetails,status', id: ids.join(',') });
        const videos = data.items.filter(v => videoPattern.test(v?.id) && v.status?.privacyStatus === 'public' && v.snippet?.channelId === channel.id && typeof v.snippet.title === 'string' && v.snippet.liveBroadcastContent !== 'upcoming' && Number.isFinite(Date.parse(v.snippet.publishedAt)) && Date.parse(v.snippet.publishedAt) <= now);
        videos.sort((a, b) => Date.parse(b.snippet.publishedAt) - Date.parse(a.snippet.publishedAt));
        if (videos.length) {
          const v = videos[0];
          return { id: v.id, title: v.snippet.title, publishedAt: v.snippet.publishedAt, duration: v.contentDetails?.duration || '', embeddable: v.status.embeddable !== false };
        }
      }
      pageToken = page.nextPageToken || '';
      if (!pageToken) return null;
      if (seen.has(pageToken)) throw new AppError('pageLimit');
      seen.add(pageToken);
    }
    throw new AppError('pageLimit');
  }

  async metadata(ids, now) {
    if (!Array.isArray(ids) || ids.length > 200 || !Number.isFinite(now) || ids.some(id => typeof id !== 'string' || !videoPattern.test(id))) throw new AppError('invalidVideo');
    const unique = [...new Set(ids)];
    const result = {};
    for (let i = 0; i < unique.length; i += 50) {
      const batch = unique.slice(i, i + 50);
      const data = await this.request('videos', { part: 'contentDetails,status,snippet', id: batch.join(',') });
      for (const id of batch) result[id] = { unavailable: true, fetchedAt: now };
      for (const v of data.items) {
        if (!batch.includes(v?.id) || v.status?.privacyStatus !== 'public' || typeof v.contentDetails?.duration !== 'string') continue;
        result[v.id] = { duration: v.contentDetails.duration, embeddable: v.status.embeddable !== false, fetchedAt: now, unavailable: false };
      }
    }
    return result;
  }
}
