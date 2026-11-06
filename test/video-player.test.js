import test from 'node:test';
import assert from 'node:assert/strict';
import { createVideoPlayer } from '../public/ui/video-player.js';
import { setupDocumentFixture, VIDEO } from './fixtures.js';

test('player rejects invalid ids and checks the latest metadata before embedding', () => {
  const f = setupDocumentFixture(); const previous = globalThis.document; globalThis.document = f.document;
  let metadata = {}, library = { later: [], watched: [] }, error, similar, saved;
  const handlers = {}, $ = id => f.document.getElementById(id);
  try {
    const player = createVideoPlayer({ text: key => key, readLibrary: () => library, readMetadata: () => metadata, showError: value => { error = value.code; }, bind: (id, _event, action) => { handlers[id] = action; }, toggleSaved: (...args) => { saved = args; }, onSimilar: value => { similar = value; } });
    player.renderPlayerButtons(); player.play({ ...VIDEO, id: 'invalid/path' }); assert.equal(error, 'invalidVideo'); assert.equal($('player-dialog').open, undefined);
    player.play(VIDEO); assert.equal($('player-container').children.length, 1); assert.match($('player-container').children[0].src, /^https:\/\/www.youtube.com\/embed\//);
    library = { later: [VIDEO.id], watched: [] }; player.renderPlayerButtons(); assert.equal($('player-later').textContent, 'removeLater');
    handlers['player-watched'](); assert.deepEqual(saved, ['watched', VIDEO.id, VIDEO]);
    metadata = { [VIDEO.id]: { unavailable: true } }; player.play(VIDEO); assert.equal($('player-container').children[0].textContent, 'embedBlocked');
    handlers['player-similar'](); assert.equal(similar, VIDEO);
    $('player-dialog').listeners.close(); assert.equal($('player-container').children.length, 0);
  } finally { globalThis.document = previous; }
});
