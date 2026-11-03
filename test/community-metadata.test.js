import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunityMetadata } from '../server/community-metadata.js';

test('public title lookup is bounded, cached, and cannot change ranking or video IDs', async () => {
  let calls=0;
  const enrich=createCommunityMetadata({now:()=>0,request:async url=>{calls++;assert.equal(new URL(url).hostname,'www.youtube.com');return {title:'Real title',author_name:'Real channel',url:'https://evil.test',score:999};}});
  const input=[{id:'abcdefghijk',title:'YouTube · abcdefghijk',score:1}];
  assert.deepEqual(await enrich(input),[{...input[0],title:'Real title',channelTitle:'Real channel'}]);
  await enrich(input);assert.equal(calls,1);
  assert.deepEqual(await enrich([{id:'../secret',title:'fallback'}]),[{id:'../secret',title:'fallback'}]);
  assert.equal(calls,1);
});
