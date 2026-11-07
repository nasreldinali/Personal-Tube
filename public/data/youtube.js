import { videoPattern, channelPattern } from '../config.js';
import { parseChannel, safeImage } from '../domain/feed.js';
import { AppError } from '../domain/errors.js';
import { validateYouTubeKey } from '../domain/youtube-key.js';

export class YouTubeClient {
  constructor(key, fetcher = (url, options) => fetch(url, options), { onRequest = () => {} } = {}) { this.key = key; this.fetcher = fetcher; this.onRequest = onRequest; }

  async request(resource, params) {
    if (!['channels', 'playlistItems', 'videos', 'search', 'commentThreads'].includes(resource)) throw new AppError('invalidResource');
    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
    url.search = new URLSearchParams(params);
    const key = validateYouTubeKey(this.key);
    const controller = new AbortController();
    let timer;
    const deadline = new Promise((resolve, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new AppError('youtubeTimeout')); }, 15000);
    });
    const perform = async () => {
      // Meter failures must not block an otherwise usable connection.
      try { await this.onRequest(resource); } catch { /* The meter exposes its unavailable state. */ }
      if (controller.signal.aborted) throw new AppError('youtubeTimeout');
      let response;
      try { response = await this.fetcher(url, { headers: { 'X-Goog-Api-Key': key }, signal: controller.signal }); }
      catch (error) { throw new AppError(controller.signal.aborted || error?.name === 'TimeoutError' ? 'youtubeTimeout' : 'network'); }
      let data;
      try { data = await response.json(); }
      catch (error) { throw new AppError(controller.signal.aborted || error?.name === 'TimeoutError' ? 'youtubeTimeout' : 'invalidResponse'); }
      return { response, data };
    };
    let response, data;
    try { ({ response, data } = await Promise.race([perform(), deadline])); }
    finally { clearTimeout(timer); }
    if (!response.ok) {
      const reason = data?.error?.errors?.[0]?.reason;
      if (['commentsDisabled', 'videoNotFound'].includes(reason) && resource === 'commentThreads') throw new AppError('commentsUnavailable');
      if (['quotaExceeded', 'dailyLimitExceeded'].includes(reason)) throw new AppError('quota');
      if ([400, 401, 403].includes(response.status)) throw new AppError('invalidKey');
      if (response.status === 404) throw new AppError('channelMissing');
      throw new AppError('serviceUnavailable');
    }
    if (!data || !Array.isArray(data.items) || data.items.length > (resource === 'commentThreads' ? 100 : 50) || (data.nextPageToken !== undefined && (typeof data.nextPageToken !== 'string' || data.nextPageToken.length > 2000))) throw new AppError('invalidResponse');
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

  async recent(channel, now = Date.now()) {
    const found = new Map();
    const seen = new Set();
    let pageToken = '';
    for (let pageNumber = 0; pageNumber < 5; pageNumber++) {
      const page = await this.request('playlistItems', { part: 'contentDetails', playlistId: channel.uploads, maxResults: '50', ...(pageToken ? { pageToken } : {}) });
      const ids = [...new Set(page.items.map(item => item?.contentDetails?.videoId).filter(id => videoPattern.test(id)))];
      if (ids.length) {
        const data = await this.request('videos', { part: 'snippet,contentDetails,status', id: ids.join(',') });
        for (const v of data.items) {
          const published = Date.parse(v?.snippet?.publishedAt);
          if (!ids.includes(v?.id) || v.status?.privacyStatus !== 'public' || v.snippet?.channelId !== channel.id || typeof v.snippet.title !== 'string' || v.snippet.title.length > 500 || v.snippet.liveBroadcastContent === 'upcoming' || !Number.isFinite(published) || published > now || now - published > 7 * 86400000) continue;
          found.set(v.id, { id: v.id, title: v.snippet.title, publishedAt: v.snippet.publishedAt, duration: v.contentDetails?.duration || '', thumbnail: safeImage(v.snippet.thumbnails?.high?.url), embeddable: v.status.embeddable !== false });
        }
      }
      pageToken = page.nextPageToken || '';
      // Upload order is not guaranteed to equal publication order; scan the bounded sample.
      if (!pageToken) return { videos: [...found.values()], limited: false };
      if (seen.has(pageToken)) throw new AppError('pageLimit');
      seen.add(pageToken);
    }
    return { videos: [...found.values()], limited: true };
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
