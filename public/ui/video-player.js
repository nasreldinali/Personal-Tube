import { videoPattern } from '../config.js';
import { AppError } from '../domain/errors.js';
import { byId as $, element } from './dom.js';

export function createVideoPlayer({ text, readLibrary, readMetadata, showError, bind, toggleSaved, onSimilar }) {
  let activeVideo = null;
  function renderPlayerButtons() {
    if (!activeVideo) return;
    $('player-later').textContent = text(readLibrary().later.includes(activeVideo.id) ? 'removeLater' : 'saveLater');
    $('player-watched').textContent = text(readLibrary().watched.includes(activeVideo.id) ? 'removeWatched' : 'markWatched');
  }
  function play(video) {
    if (!videoPattern.test(video.id)) { showError(new AppError('invalidVideo')); return; }
    activeVideo = video;
    $('player-title').textContent = video.title;
    $('youtube-link').href = `https://www.youtube.com/watch?v=${video.id}`;
    $('player-container').replaceChildren();
    if (video.embeddable === false || readMetadata()[video.id]?.embeddable === false || readMetadata()[video.id]?.unavailable) $('player-container').append(element('p', 'd-note', text('embedBlocked')));
    else {
      const iframe = element('iframe'); iframe.title = video.title;
      iframe.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&playsinline=1`;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      $('player-container').append(iframe);
    }
    $('recommendation').hidden = !video.summary && !video.why;
    $('video-summary').textContent = video.summary || ''; $('video-why').textContent = video.why || '';
    $('video-quote').textContent = video.quote?.text || ''; $('video-quote').hidden = !video.quote;
    $('hn-comment').hidden = !video.quote;
    if (video.quote) $('hn-comment').href = `https://news.ycombinator.com/item?id=${video.quote.commentId}`;
    renderPlayerButtons(); $('player-dialog').showModal();
  }
  bind('player-similar', 'click', () => { const video = activeVideo; $('player-dialog').close(); if (video) onSimilar(video); });
  bind('player-later', 'click', () => toggleSaved('later', activeVideo.id, activeVideo));
  bind('player-watched', 'click', () => toggleSaved('watched', activeVideo.id, activeVideo));
  $('player-dialog').addEventListener('close', () => { $('player-container').replaceChildren(); activeVideo = null; });
  return { renderPlayerButtons, play };
}
