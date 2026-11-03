import { videoPattern } from '../config.js';
import { AppError } from './errors.js';
import { redactContacts, applyClassifications } from './community-evidence.js';

const exact = (value, fields) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === fields;
export function youtubeAnalysisInput(videos) {
  return { version: 1, videos: videos.map(video => ({ id: video.id, title: redactContacts(video.title), comments: (video.evidence?.comments || []).map(comment => ({ id: comment.id, text: redactContacts(comment.text), likes: comment.likes })) })) };
}
export function youtubeAnalysisRows(input) {
  if (!exact(input,'version,videos') || input.version !== 1 || !Array.isArray(input.videos) || input.videos.length > 8) throw new AppError('invalidYouTubeAnalysis');
  const ids = new Set();
  const rows = [];
  for (const video of input.videos) {
    if (!exact(video,'comments,id,title') || typeof video.id !== 'string' || !videoPattern.test(video.id) || ids.has(video.id) || typeof video.title !== 'string' || video.title.length > 500 || !Array.isArray(video.comments) || video.comments.length > 20) throw new AppError('invalidYouTubeAnalysis');
    ids.add(video.id);
    const comments = new Set();
    for (const comment of video.comments) {
      if (!exact(comment,'id,likes,text') || typeof comment.id !== 'string' || !/^[\w-]{1,200}$/.test(comment.id) || comments.has(comment.id) || typeof comment.text !== 'string' || !comment.text.trim() || comment.text.length > 1000 || !Number.isSafeInteger(comment.likes) || comment.likes < 0) throw new AppError('invalidYouTubeAnalysis');
      comments.add(comment.id);
      rows.push({ id: comment.id, videoIds: [video.id], title: redactContacts(video.title), text: redactContacts(comment.text), labels: {} });
    }
  }
  return rows;
}
export function positiveYouTubeVideos(videos, result) {
  const rows = applyClassifications(youtubeAnalysisRows(youtubeAnalysisInput(videos)), result);
  return videos.map(video => {
    const evidence = { sampled: video.evidence?.sampled || 0, analyzed: 0, positive: 0, critical: 0, comments: [] };
    for (const row of rows.filter(row => row.videoIds[0] === video.id)) {
      const label = row.labels[video.id]; evidence.analyzed++;
      if (label.stance === 'critical') evidence.critical++;
      if (['rec','strong_rec'].includes(label.stance)) {
        evidence.positive++;
        const original = video.evidence.comments.find(comment => comment.id === row.id);
        evidence.comments.push({ id: row.id, text: row.text, likes: original.likes, quote: label.quote, stance: label.stance });
      }
    }
    return { ...video, evidence };
  }).filter(video => video.evidence.positive >= 2 && video.evidence.positive > video.evidence.critical);
}
