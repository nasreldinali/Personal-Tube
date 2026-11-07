import { videoPattern } from '../config.js';
import { AppError } from './errors.js';
import { redactContacts, plainText, applyClassifications } from './community-evidence.js';

const exact = (value, fields) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === fields;
export function youtubeAnalysisInput(videos, topic) {
  return { version: 2, topic: plainText(topic), videos: videos.map(video => ({ id: video.id, title: redactContacts(video.title), description: plainText(video.description || '').slice(0,1000), comments: (video.evidence?.comments || []).map(comment => ({ id: comment.id, text: redactContacts(comment.text), likes: comment.likes })) })) };
}
export function youtubeAnalysisRows(input) {
  if (!exact(input,'topic,version,videos') || input.version !== 2 || typeof input.topic !== 'string' || !plainText(input.topic) || input.topic.length > 200 || !Array.isArray(input.videos) || input.videos.length > 8) throw new AppError('invalidYouTubeAnalysis');
  const ids = new Set();
  const rows = [];
  for (const video of input.videos) {
    if (!exact(video,'comments,description,id,title') || typeof video.id !== 'string' || !videoPattern.test(video.id) || ids.has(video.id) || typeof video.title !== 'string' || video.title.length > 500 || typeof video.description !== 'string' || video.description.length > 1000 || !Array.isArray(video.comments) || video.comments.length > 20) throw new AppError('invalidYouTubeAnalysis');
    ids.add(video.id);
    const comments = new Set();
    for (const comment of video.comments) {
      if (!exact(comment,'id,likes,text') || typeof comment.id !== 'string' || !/^[\w-]{1,200}$/.test(comment.id) || comments.has(comment.id) || typeof comment.text !== 'string' || !comment.text.trim() || comment.text.length > 1000 || !Number.isSafeInteger(comment.likes) || comment.likes < 0) throw new AppError('invalidYouTubeAnalysis');
      comments.add(comment.id);
      rows.push({ id: comment.id, videoIds: [video.id], title: plainText(`${video.title} — ${video.description}`), topic: plainText(input.topic), text: redactContacts(comment.text), labels: {} });
    }
  }
  return rows;
}
export function youtubeEvidenceCandidates(videos, result, topic) {
  const rows = applyClassifications(youtubeAnalysisRows(youtubeAnalysisInput(videos, topic)), result);
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
    evidence.support = evidence.positive >= 2 ? 'supported' : 'limited';
    return { ...video, evidence };
  }).filter(video => video.evidence.positive >= 1 && video.evidence.positive > video.evidence.critical);
}

export function positiveYouTubeVideos(videos, result, topic) {
  return youtubeEvidenceCandidates(videos, result, topic).filter(video => video.evidence.positive >= 2);
}
