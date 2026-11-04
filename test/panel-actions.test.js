import test from 'node:test';
import assert from 'node:assert/strict';
import { hideVideos, removeCategory, viewFromHash, thumbnailURL } from '../public/domain/panel-actions.js';
import { parseLibrary } from '../public/domain/library.js';
import { CHANNEL, VIDEO } from './fixtures.js';

test('hiding is bounded, deduplicated, persistent and does not remove saved IDs', () => {
  const result=hideVideos({version:1,later:[VIDEO.id],watched:[]},[VIDEO.id,VIDEO.id]);
  assert.deepEqual(result.hidden,[VIDEO.id]);assert.deepEqual(result.later,[VIDEO.id]);
  assert.deepEqual(parseLibrary(result),result);
  assert.throws(()=>hideVideos(result,['../bad']));
  assert.throws(()=>parseLibrary({...result,hidden:Array(20001).fill(VIDEO.id)}));
});
test('removing a category clears only its assignments and retains channels/cache', () => {
  const state={channels:[CHANNEL,{...CHANNEL,id:'UC'+'b'.repeat(22),category:'Music'}],cache:{}};
  const result=removeCategory(state,'Technology');
  assert.equal(result.channels.length,2);assert.equal(result.channels[0].category,'');assert.equal(result.channels[1].category,'Music');assert.equal(state.channels[0].category,'Technology');
});
test('navigation fragments are allowlisted and image choices cannot inject a URL', () => {
  assert.equal(viewFromHash('#community'),'community');assert.equal(viewFromHash('#channels'),'channels');assert.equal(viewFromHash('#bad'),'discover');
  assert.match(thumbnailURL(VIDEO,'frame'),/hq2.jpg$/);assert.match(thumbnailURL({...VIDEO,thumbnail:'javascript:bad'},'original'),/hqdefault.jpg$/);
  assert.throws(()=>thumbnailURL({...VIDEO,id:'../bad'},'original'));
});
