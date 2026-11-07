import { videoPattern } from '../config.js';
import { AppError } from '../domain/errors.js';
import { parseRecommendationSettings, candidateVideos, commentSample } from '../domain/recommendations.js';
import { youtubeAnalysisInput, youtubeEvidenceCandidates } from '../domain/youtube-evidence.js';

export async function recommendVideos(client, input, analyze, onProgress = () => {}) {
  const settings = parseRecommendationSettings(input);
  if (!settings.query) throw new AppError('recommendationTopicRequired');
  const search = await client.request('search', { part: 'snippet', type: 'video', q: settings.query, maxResults: '50', order: 'relevance', ...(settings.language === 'any' ? {} : { relevanceLanguage: settings.language }) });
  const ids = [...new Set(search.items.map(item => item?.id?.videoId).filter(id => typeof id === 'string' && videoPattern.test(id)))];
  if (!ids.length) return { videos: [], inspected: 0, commentsUnavailable: 0, analyzedComments: 0, reviewed: 0 };
  const details = await client.request('videos', { part: 'snippet,statistics,contentDetails,status', id: ids.join(',') });
  const eligible = new Map(candidateVideos(details.items.filter(row => ids.includes(row?.id)), settings).map(video => [video.id,video]));
  const videos = ids.map(id => eligible.get(id)).filter(Boolean).slice(0,8);
  let commentsUnavailable = 0;
  for (const video of videos) {
    try {
      const response = await client.request('commentThreads', { part: 'snippet', videoId: video.id, maxResults: '100', order: 'relevance', textFormat: 'plainText' });
      video.evidence = commentSample(response.items, video.channelId);
    } catch (error) {
      if (error.code !== 'commentsUnavailable') throw error;
      commentsUnavailable++;
    }
  }
  const analyzedComments = videos.reduce((sum, video) => sum + (video.evidence?.comments.length || 0), 0);
  if (!analyzedComments) return { videos: [], inspected: ids.length, commentsUnavailable, analyzedComments, reviewed: videos.length };
  if (typeof analyze !== 'function') throw new AppError('classificationUnavailable');
  onProgress('analyzingYouTubeComments');
  const result = await analyze(youtubeAnalysisInput(videos, settings.query));
  return { videos: youtubeEvidenceCandidates(videos, result, settings.query).sort((a,b) => Number(a.evidence.support === 'limited') - Number(b.evidence.support === 'limited') || b[settings.sort] - a[settings.sort] || a.id.localeCompare(b.id)), inspected: ids.length, commentsUnavailable, analyzedComments, reviewed: videos.length };
}
