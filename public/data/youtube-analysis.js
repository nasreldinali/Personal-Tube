import { AppError } from '../domain/errors.js';

export async function analyzeYouTubeComments(input, fetcher = (url, options) => fetch(url, options)) {
  try {
    const response = await fetcher('/api/youtube-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(140000) });
    const data = await response.json();
    if (!response.ok && data.error === 'communityRateLimit') throw new AppError('youtubeAnalysisCooldown');
    if (!response.ok) throw new AppError(['busy','classifierVersion','invalidClassification','invalidYouTubeAnalysis','analysisConnectionRequired','analysisAuthFailed','analysisRateLimit','analysisUnavailable'].includes(data.error) ? data.error : 'youtubeAnalysisUnavailable');
    return data;
  } catch (error) { if (error instanceof AppError) throw error; throw new AppError('youtubeAnalysisUnavailable'); }
}
