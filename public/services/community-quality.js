import { parseRecommendationSettings, candidateVideos } from '../domain/recommendations.js';
import { videoPattern } from '../config.js';
import { AppError } from '../domain/errors.js';

export function communityQualitySettings(input = {}) {
  const value = parseRecommendationSettings({ ...parseRecommendationSettings(null), ...input });
  const minRecommenders = input.minRecommenders ?? 2;
  if (![2, 3, 5].includes(minRecommenders)) throw new AppError('invalidRecommendations');
  return { ...value, minRecommenders };
}

export async function verifyCommunityVideos(client, videos, input, isCancelled = () => false) {
  const settings = communityQualitySettings(input);
  if (!Array.isArray(videos) || videos.length > 72 || videos.some(video => !videoPattern.test(video?.id))) throw new AppError('invalidCommunityEvidence');
  const eligible = videos.filter(video => Number.isSafeInteger(video.independentRecommenders) && video.independentRecommenders >= settings.minRecommenders && Number.isSafeInteger(video.positiveComments) && Number.isSafeInteger(video.criticalComments) && video.criticalComments >= 0 && video.positiveComments > video.criticalComments);
  const metadata = new Map();
  for (let index = 0; index < eligible.length; index += 50) {
    if (isCancelled()) return { videos: [], reviewed: 0 };
    const ids = eligible.slice(index, index + 50).map(video => video.id);
    const response = await client.request('videos', { part: 'snippet,statistics,contentDetails,status', id: ids.join(',') });
    for (const video of candidateVideos(response.items, settings)) if (ids.includes(video.id)) metadata.set(video.id, video);
  }
  if (isCancelled()) return { videos: [], reviewed: 0 };
  // Keep community evidence and ordering; popularity is a separate eligibility check.
  return { videos: eligible.filter(video => metadata.has(video.id)).map(video => ({ ...metadata.get(video.id), ...video, title: metadata.get(video.id).title, channelTitle: metadata.get(video.id).channelTitle, views: metadata.get(video.id).views, likes: metadata.get(video.id).likes, audioLanguage: metadata.get(video.id).audioLanguage, duration: metadata.get(video.id).duration, embeddable: metadata.get(video.id).embeddable, recommenders: video.independentRecommenders })), reviewed: eligible.length };
}
