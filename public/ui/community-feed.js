import { byId as $, element } from './dom.js';
import { createVideoCard } from './feed-view.js';
import { t, number, dateLabel } from '../locale.js';
import { AppError } from '../domain/errors.js';
import { videoPattern } from '../config.js';
import { verifyCommunityVideos, communityQualitySettings } from '../services/community-quality.js';
import { discoverCommunity } from '../services/community-discovery.js';

export function createCommunityFeed({ context, onPlay, onToggle, onError, setBusy, client, openSettings, fetcher = (url, options) => fetch(url, options), clock = () => Date.now(), schedule = callback => setInterval(callback, 1000) }) {
  let response = null;
  let running = false;
  let page = 0;
  let shown = 24;
  let generation = 0;
  let error = '';
  let archiveQuery = '';
  let archiveRelated = '';
  let progress = null;
  let stopRequested = false;
  let searching = false;
  let verifying = false;
  const cooldowns = new Map();
  const text = (key,values) => t(context().language,key,values);
  async function request(body) {
    const current = generation;
    const result = await fetcher('/api/community', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({version:1,...body}), signal: AbortSignal.timeout(150000) });
    const data = await result.json();
    if(current !== generation || context().stale) throw new AppError('storageConflict');
    if (body.action === 'discover' && (result.ok || data.error === 'communityRateLimit')) {
      const seconds = Number.isInteger(data.retryAfterSeconds) && data.retryAfterSeconds >= 0 && data.retryAfterSeconds <= 86400 ? data.retryAfterSeconds : 60;
      cooldowns.set(body.source, clock() + seconds * 1000);
    }
    if (!result.ok) throw new AppError(data.error || 'communitySourceUnavailable');
    if (data.version !== 1 || !Array.isArray(data.videos) || data.videos.some(v => !videoPattern.test(v.id))) throw new AppError('invalidCommunityEvidence');
    return data;
  }
  function card(video) {
    const c=context();
    const node=createVideoCard(response?.source==='archive'?video:{...video,recommenders:0,channelCategory:text("communityLiveCard")},{language:c.language,library:c.library,metadata:c.metadata,areas:c.areas,thumbnailStyle:c.thumbnailStyle,onHide:c.onHide,onSelect:c.onSelect,selected:c.selectedVideos.has(video.id),onPlay,onToggle:(field,id)=>onToggle(field,id,video)});
    const box=element('div','discovery-evidence');
    box.append(element('p','evidence-label',text(response?.source==='archive'?'communityOriginalBadge':'communityAnalyzedBadge')));
    if (response?.source !== 'archive') {
      box.append(element('p','community-metrics',`${text('viewsLabel',{count:number(c.language,video.views)})} · ${text('likesLabel',{count:number(c.language,video.likes)})}`));
      box.append(element('p','help',text('communityEndorsers',{count:number(c.language,video.independentRecommenders)})));
    }
    const endorsement=video.evidence.find(proof=>['rec','strong_rec'].includes(proof.stance));
    if(endorsement){const quote=element('blockquote','',endorsement.quote||endorsement.text);quote.dir='auto';box.append(quote);}
    if(video.latest) box.append(element('p','help',`${text('latestMention')}: ${response?.source==='archive'?new Intl.DateTimeFormat(c.language==='ar'?'ar-EG':c.language,{month:'long',year:'numeric'}).format(new Date(video.latest)):dateLabel(c.language,video.latest)}`));
    const details=element('details');details.append(element('summary','',text('commentEvidence',{count:number(c.language,video.evidence.length)})));
    details.append(element('p','',text('communityScore',{score:video.score,shares:video.shares})),element('p','help',text(video.scoreOrigin==='upstream'?'originalRanking':'sampleRanking')));
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
  function cooldownSeconds() { return Math.max(0, Math.ceil(((cooldowns.get($('collect-source').value) || 0) - clock()) / 1000)); }
  function renderCooldown() {
    const archive = $('collect-source').value === 'archive';
    const seconds = archive ? 0 : cooldownSeconds();
    $('collect-submit').disabled = running || context().busy || seconds > 0;
    $('collect-submit').textContent = text(running ? 'communitySearching' : seconds ? 'communityRetryIn' : archive ? 'communityBrowse' : 'communityFind', {seconds:number(context().language,seconds)});
    $('collect-cooldown').hidden = !seconds || running;
    $('collect-cooldown').textContent = seconds ? text('communityCooldownHelp',{seconds:number(context().language,seconds)}) : '';
  }
  function render(){
    const source=$('collect-source').value;
    const archive=source==='archive';
    $('collect-scope-field').hidden=!['reddit','stackexchange'].includes(source);
    $('collect-scope-label').textContent=text(source==='reddit'?'subreddit':'stackSite');
    $('community-options').hidden=archive;
    $('community-quality').hidden=archive; $('community-quality').disabled=archive;
    $('collect-connect').hidden=archive||context().hasKey;
    $('collect-quality-help').hidden=archive;
    $('community-browse-library').disabled=running||context().busy;
    $('collect-query').required=!archive;
    $('collect-scope').required=['reddit','stackexchange'].includes(source);
    $('reddit-connection').hidden=source!=='reddit';
    $('collect-source-help').textContent=text(archive?'communityArchiveHelp':source==='hn'?'communityHnHelp':source==='stackexchange'?'communityStackHelp':'communityRedditHelp');
    $('collect-submit').textContent=text(running?'communitySearching':archive?'communityBrowse':'communityFind');
    $('community-inputs').disabled=running||context().busy;
    for(const id of ['collect-more','collect-clear']) $(id).disabled=running||context().busy;
    renderCooldown();
    $('collect-stop').hidden=!running||!searching||archive;
    $('collect-stop').disabled=stopRequested;
    $('collect-analysis-help').hidden=archive;
    $('collect-clear').hidden=!response||response.source==='archive';
    const values=progress?{done:number(context().language,progress.analyzed),total:number(context().language,progress.totalComments)}:{};
    $('collect-progress').hidden=!running||!searching||archive;
    if(progress?.totalComments){$('collect-progress').max=progress.totalComments;$('collect-progress').value=progress.analyzed;}else $('collect-progress').removeAttribute('value');
    let message=text('communityStartHelp');
    if(response?.source==='archive')message=text('archiveSummary',{count:number(context().language,response.total),comments:number(context().language,response.originalComments)});
    else if(response){
      message=text(response.stopped?'communityStopped':response.videos.length?'communityFinished':response.totalComments?'communityNoQualityResults':'communityNoLinks',{count:number(context().language,response.videos.length),done:number(context().language,response.analyzed),total:number(context().language,response.totalComments)});
      message+=` ${text('communitySampleSummary',{scanned:number(context().language,response.scanned),found:number(context().language,response.foundComments),selected:number(context().language,response.totalComments)})}`;
      if(response.limited)message+=` ${text('communitySampleLimit')}`;
    }
    if(running)message=text(stopRequested?'communityStopping':verifying?'communityVerifying':progress?'communityAnalyzing':searching?'communityCollecting':'communitySearching',values);
    if(error)message=`${text(error)} ${response&&response.source!=='archive'?text('communityPartial',{done:number(context().language,response.analyzed),total:number(context().language,response.totalComments)}):''}`;
    $('collect-status').textContent=message;
    $('community-live-videos').replaceChildren(...(response?.videos||[]).filter(v=>!(context().library.hidden||[]).includes(v.id)).slice(0,shown).map(card));
    $('collect-more').hidden=!response||(response.source==='archive'?response.videos.length>=response.total:shown>=response.videos.length);
  }
  async function perform(action){
    if(running||context().busy)return;
    if(context().stale){onError(new AppError('storageConflict'));return;}
    const started=++generation;running=true;error='';stopRequested=false;progress=null;setBusy(true);render();
    try{await action(started);}catch(caught){if(started===generation){error=caught instanceof AppError?caught.code:'communitySourceUnavailable';if(error==='communityRateLimit')error='';else onError(caught);}}finally{if(started===generation){running=false;searching=false;verifying=false;setBusy(false);render();}}
  }
  async function original(){
    $('collect-source').value='archive';page=0;shown=24;
    archiveQuery=$('collect-query').value;archiveRelated='';
    response=await request({action:'archive',query:archiveQuery,page});
  }
  $('community-collect-form').addEventListener('submit',event=>{
    event.preventDefault();
    if ($('collect-source').value !== 'archive' && cooldownSeconds()) { renderCooldown(); return; }
    if ($('collect-source').value !== 'archive' && !context().hasKey) { openSettings(); return; }
    void perform(async started=>{
      page=0;shown=24;
      if($('collect-source').value==='archive'){await original();return;}
      const quality=communityQualitySettings({language:$('collect-language').value,minViews:Number($('collect-min-views').value),minLikes:Number($('collect-min-likes').value),minRecommenders:Number($('collect-min-recommenders').value)});
      searching=true;render();
      const isCancelled=()=>stopRequested||started!==generation||context().stale;
      const result=await discoverCommunity({request,isCancelled,onProgress:value=>{if(started===generation&&!context().stale){progress=value;response=null;render();}}},{source:$('collect-source').value,query:$('collect-query').value,scope:$('collect-scope').value,days:Number($('collect-days').value),token:$('reddit-token').value,username:$('reddit-username').value,approved:$('reddit-approved').checked});
      verifying=true;render();
      const verified=await verifyCommunityVideos(client(),result.videos,quality,isCancelled);
      if(started===generation&&!context().stale)response={...result,...verified,stopped:result.stopped||isCancelled()};
    });
  });
  $('collect-source').addEventListener('change',()=>{if($('collect-source').value==='reddit'){$('collect-scope').value='videos';$('community-options').open=true;}else if($('collect-source').value==='stackexchange')$('collect-scope').value='stackoverflow';response=null;error='';render();});
  $('collect-connect').addEventListener('click',openSettings);
  $('community-browse-library').addEventListener('click',()=>void perform(async()=>{$('collect-query').value='';await original();}));
  schedule(()=>{if(context().mode==='community')renderCooldown();});
  $('collect-stop').addEventListener('click',()=>{stopRequested=true;render();});
  $('collect-more').addEventListener('click',()=>void perform(async()=>{
    if(response.source==='archive'){
      const next=await request({action:'archive',query:archiveQuery,relatedTo:archiveRelated,page:page+1});
      page++;response={...next,videos:[...response.videos,...next.videos]};shown=response.videos.length;
    }else shown+=24;
  }));
  $('collect-clear').addEventListener('click',()=>void perform(async()=>{if(response?.session)await request({action:'clear',session:response.session});response=null;$('reddit-token').value='';}));
  return {
    render,
    videos:()=>response?.videos||[],
    clear:()=>request({action:'clearAll'}),
    reset(){generation++;running=false;searching=false;stopRequested=true;progress=null;response=null;error='';$('reddit-token').value='';render();},
  };
}
