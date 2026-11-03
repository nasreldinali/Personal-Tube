import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeYouTubeComments } from '../public/data/youtube-analysis.js';

test('comment analysis sends only the supplied sample to the fixed local route and hides raw errors', async () => {
  const input={version:1,videos:[]};
  const response=await analyzeYouTubeComments(input,async(url,options)=>{
    assert.equal(url,'/api/youtube-analysis');assert.equal(options.method,'POST');
    assert.deepEqual(options.headers,{'Content-Type':'application/json'});
    assert.deepEqual(JSON.parse(options.body),input);
    return {ok:true,json:async()=>({version:1,items:[]})};
  });
  assert.equal(response.version,1);
  await assert.rejects(analyzeYouTubeComments(input,async()=>({ok:false,json:async()=>({error:'private diagnostic'})})),{code:'youtubeAnalysisUnavailable'});
  await assert.rejects(analyzeYouTubeComments(input,async()=>{throw new Error('private diagnostic');}),{code:'youtubeAnalysisUnavailable'});
});

test('analysis cooldown has a search-specific message without claiming retained comments', async () => {
  await assert.rejects(analyzeYouTubeComments({version:1,videos:[]},async()=>({ok:false,json:async()=>({error:'communityRateLimit'})})),{code:'youtubeAnalysisCooldown'});
});
