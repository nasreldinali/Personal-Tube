import test from 'node:test';
import assert from 'node:assert/strict';
import { createVideoCard } from '../public/ui/feed-view.js';
import { setupDocumentFixture, VIDEO } from './fixtures.js';
test('compact card retains metadata and keeps removal and selection off the image',()=>{
 const before=globalThis.document;globalThis.document=setupDocumentFixture().document;
 try{
  let removed;let selected;let played;
  const video={...VIDEO,channelTitle:'Fixture channel',channelCategory:'Science'};
  const card=createVideoCard(video,{language:'en',library:{later:[],watched:[]},metadata:{},areas:[],onPlay:value=>{played=value;},onToggle:()=>{},onHide:ids=>{removed=ids;},onSelect:(id,value)=>{selected=[id,value];},portrait:true});
  assert.equal(card.className,'video-card short-card');assert.equal(card.children.length,3);
  const [thumbnail,body,actions]=card.children;
  assert.equal(thumbnail.className,'thumbnail');assert.equal(thumbnail.children[2].textContent,'12:34');
  assert.equal(body.children[0].textContent,video.title);assert.equal(body.children[1].children[0].textContent,'Fixture channel');assert.ok(body.children[1].children[1].textContent);assert.equal(body.children[2].textContent,'Science');
  assert.equal(actions.children[2].textContent,'Remove');actions.children[2].listeners.click();assert.deepEqual(removed,[video.id]);
  const checkbox=actions.children[3].children[0];checkbox.checked=true;checkbox.listeners.change();assert.deepEqual(selected,[video.id,true]);
  thumbnail.listeners.click();assert.equal(played,video);
 }finally{globalThis.document=before;}
});
