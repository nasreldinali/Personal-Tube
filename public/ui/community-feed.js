import { byId as $, element } from './dom.js';
import { createVideoCard } from './feed-view.js';
import { t, number, dateLabel } from '../locale.js';
import { AppError } from '../domain/errors.js';
import { videoPattern } from '../config.js';

export function createCommunityFeed({ context, onPlay, onToggle, onError, setBusy }) {
  let response = null;
  let running = false;
  let initialized = false;
  let page = 0;
  let shown = 24;
  let generation = 0;
  let error = '';
  let archiveQuery = '';
  let archiveRelated = '';
  const text = (key,values) => t(context().language,key,values);
  async function request(body) {
    const current = generation;
    const result = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({version:1,...body}), signal: AbortSignal.timeout(150000) });
    const data = await result.json();
    if(current !== generation) throw new AppError('storageConflict');
    if (!result.ok) throw new AppError(data.error || 'communitySourceUnavailable');
    if (data.version !== 1 || !Array.isArray(data.videos) || data.videos.some(v => !videoPattern.test(v.id))) throw new AppError('invalidCommunityEvidence');
    return data;
  }
  function card(video) {
    const c=context();
    const node=createVideoCard(response?.source==='archive'?video:{...video,recommenders:0,channelCategory:text("communityLiveTitle")},{language:c.language,library:c.library,metadata:c.metadata,areas:c.areas,onPlay,onToggle:(field,id)=>onToggle(field,id,video)});
    const box=element('div','discovery-evidence');
    box.append(element('p','',text('communityScore',{score:video.score,shares:video.shares})));
    box.append(element('p','help',text(video.scoreOrigin==='upstream'?'originalRanking':'sampleRanking')));
    if(video.latest) box.append(element('p','help',`${text('latestMention')}: ${response?.source==='archive'?new Intl.DateTimeFormat(c.language==='ar'?'ar-EG':'en',{month:'long',year:'numeric'}).format(new Date(video.latest)):dateLabel(c.language,video.latest)}`));
    const details=element('details');details.append(element('summary','',text('commentEvidence',{count:number(c.language,video.evidence.length)})));
    for(const proof of video.evidence){
      details.append(element('p','evidence-label',`${proof.source} · ${text(`stance_${proof.stance}`)}`));
      const quote=element('blockquote','',proof.quote||proof.text);quote.dir='auto';details.append(quote);
      const link=element('a','',text('openReference'));link.href=proof.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';details.append(link);
    }
    box.append(details);
    if(response?.source==='archive'){
      const related=element('button','text-button',text('communityRelated'));related.type='button';related.disabled=running;
      related.addEventListener('click',()=>void perform(async()=>{page=0;archiveRelated=video.id;archiveQuery='';response=await request({action:'archive',relatedTo:video.id});}));box.append(related);
    }
    node.append(box);return node;
  }
  function render(){
    const source=$('collect-source').value;
    const archive=source==='archive';
    $('collect-scope-field').hidden=!['reddit','stackexchange'].includes(source);
    $('collect-scope-label').textContent=text(source==='reddit'?'subreddit':'stackSite');
    $('collect-days-field').hidden=archive;
    $('collect-analysis-field').hidden=archive;
    $('reddit-connection').hidden=source!=='reddit';
    $('collect-source-help').textContent=text(archive?'archiveSourceHelp':source==='hn'?'hnLiveHelp':source==='stackexchange'?'stackLiveHelp':'redditLiveHelp');
    $('collect-submit').textContent=text(running?'communityWorking':archive?'browseEvidence':'collectComments');
    for(const id of ['collect-submit','collect-source','collect-query','collect-scope','collect-days','collect-sort','community-original','collect-analyze-next','collect-more']) $(id).disabled=running;
    $('collect-sort').disabled=running||!response||response.source==='archive';
    $('collect-analyze-next').hidden=!response?.pending;
    $('collect-clear').hidden=!response||response.source==='archive';
    $('collect-status').textContent=error?text(error):running?text('communityWorking'):!response?text('communityIdle'):response.source==='archive'?text('archiveSummary',{count:number(context().language,response.total),comments:number(context().language,response.originalComments)}):text('collectionSummary',{scanned:response.scanned,found:response.totalComments,analyzed:response.analyzed,pending:response.pending})+(response.limited?` ${text('limitedSample')}`:'');
    $('community-live-videos').replaceChildren(...(response?.videos||[]).slice(0,shown).map(card));
    $('collect-more').hidden=!response||(response.source==='archive'?response.videos.length>=response.total:shown>=response.videos.length);
  }
  async function perform(action){
    if(running||context().busy)return;
    const started=++generation;running=true;error='';setBusy(true);render();
    try{await action(started);}catch(caught){if(started===generation){error=caught instanceof AppError?caught.code:'communitySourceUnavailable';onError(caught);}}finally{if(started===generation){running=false;setBusy(false);render();}}
  }
  async function original(){
    $('collect-source').value='archive';page=0;shown=24;
    archiveQuery=$('collect-query').value;archiveRelated='';
    response=await request({action:'archive',query:archiveQuery,page});
  }
  async function analyze(){
    const previous=response;
    const next=await request({action:'analyze',session:previous.session,sort:'top'});
    response=next;$('collect-sort').value='top';shown=24;
  }
  $('community-collect-form').addEventListener('submit',event=>{
    event.preventDefault();void perform(async()=>{
      page=0;shown=24;
      if($('collect-source').value==='archive'){await original();return;}
      response=await request({action:'collect',source:$('collect-source').value,query:$('collect-query').value,scope:$('collect-scope').value,days:Number($('collect-days').value),token:$('reddit-token').value,username:$('reddit-username').value,approved:$('reddit-approved').checked});
      $('collect-sort').value='shared';
      if($('collect-analyze').checked&&response.pending)await analyze();
    });
  });
  $('collect-source').addEventListener('change',()=>{if($('collect-source').value==='reddit')$('collect-scope').value='videos';else if($('collect-source').value==='stackexchange')$('collect-scope').value='stackoverflow';render();});
  $('community-original').addEventListener('click',()=>void perform(original));
  $('collect-analyze-next').addEventListener('click',()=>void perform(analyze));
  $('collect-sort').addEventListener('change',()=>void perform(async()=>{if(response?.session)response=await request({action:'results',session:response.session,sort:$('collect-sort').value});shown=24;}));
  $('collect-more').addEventListener('click',()=>void perform(async()=>{
    if(response.source==='archive'){
      const next=await request({action:'archive',query:archiveQuery,relatedTo:archiveRelated,page:page+1});
      page++;response={...next,videos:[...response.videos,...next.videos]};shown=response.videos.length;
    }else shown+=24;
  }));
  $('collect-clear').addEventListener('click',()=>void perform(async()=>{if(response?.session)await request({action:'clear',session:response.session});response=null;$('reddit-token').value='';}));
  return {
    render(){render();if(!initialized&&!context().busy){initialized=true;void perform(original);}},
    videos:()=>response?.videos||[],
    clear:()=>request({action:'clearAll'}),
    reset(){generation++;running=false;response=null;initialized=false;error='';$('reddit-token').value='';render();},
  };
}
