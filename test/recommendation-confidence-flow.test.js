import test from 'node:test';
import assert from 'node:assert/strict';
import { appBrowserFixture } from './app-browser-fixture.js';
import { VIDEO, CHANNEL } from './fixtures.js';
import { t } from '../public/locale.js';

test('recommendation cards distinguish one-viewer evidence from supported recommendations in all languages', async () => {
  for(const language of ['en','ar','de','es']) for(const positives of [0,1,2]) {
    const f=await appBrowserFixture({hash:'#recommendations',key:'fixture',preferences:{language},fetcher:async(url,options)=>{
      let data;
      if(String(url)==='/api/youtube-analysis') {
        const input=JSON.parse(options.body);
        data={version:1,items:input.videos[0].comments.map((c,i)=>({key:`${i}:${VIDEO.id}`,stance:i<positives?'rec':'reference',quote:i<positives?c.text:''}))};
      } else if(String(url).startsWith('https://www.googleapis.com/')) {
        const resource=new URL(url).pathname.split('/').at(-1);
        data={items:resource==='search'?[{id:{videoId:VIDEO.id}}]:resource==='videos'?[{id:VIDEO.id,snippet:{title:'Shooting lesson',channelId:CHANNEL.id},status:{privacyStatus:'public'},statistics:{viewCount:'200000',likeCount:'2000'}}]:[0,1].map(i=>({snippet:{topLevelComment:{id:`c${i}`,snippet:{textOriginal:`Practicing foot placement improved my shooting accuracy ${i}`,likeCount:1}}}}))};
      }
      if(data)return {ok:true,json:async()=>data};
    }});
    try {
      f.$('rec-query').value='shooting';
      await f.$('recommendation-form').emit('submit');
      const cards=f.$('discovery-videos').children;
      assert.equal(cards.length,positives?1:0);
      if(positives) {
        const labels=cards[0].querySelectorAll('.evidence-label').map(n=>n.textContent);
        assert.ok(labels.includes(t(language,positives===1?'limitedEvidence':'supportedEvidence')));
        assert.ok(!labels.includes(t(language,positives===1?'supportedEvidence':'limitedEvidence')));
      }
      assert.ok(!f.$('discovery-status').textContent.includes('{limited}'));
    } finally { f.restore(); }
  }
});
