import { videoPattern } from '../config.js';
import { AppError } from '../domain/errors.js';
import { parseRecommendationSettings, candidateVideos, commentSample } from '../domain/recommendations.js';

export async function recommendVideos(client, input) {
  const settings = parseRecommendationSettings(input);
  if (!settings.query) throw new AppError('recommendationTopicRequired');
  const search = await client.request('search', { part: 'snippet', type: 'video', q: settings.query, maxResults: '50', order: 'relevance', ...(settings.language === 'any' ? {} : { relevanceLanguage: settings.language }) });
  const ids = [...new Set(search.items.map(item => item?.id?.videoId).filter(id => typeof id === 'string' && videoPattern.test(id)))];
  if (!ids.length) return { videos: [], inspected: 0, commentsUnavailable: 0 };
  const details = await client.request('videos', { part: 'snippet,statistics,contentDetails,status', id: ids.join(',') });
  const videos = candidateVideos(details.items.filter(row => ids.includes(row?.id)), settings).slice(0,8);
  let commentsUnavailable = 0;
  if (settings.includeComments) for (const video of videos) {
    try {
      const response = await client.request('commentThreads', { part: 'snippet', videoId: video.id, maxResults: '20', order: 'relevance', textFormat: 'plainText' });
      video.evidence = commentSample(response.items);
    } catch (error) {
      if (error.code !== 'commentsUnavailable') throw error;
      commentsUnavailable++;
    }
  }
  return { videos, inspected: ids.length, commentsUnavailable };
}
