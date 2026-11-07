import { byId as $, element } from './dom.js';

const choices = new Map([
  ['codex', {name:'ChatGPT / Codex',copy:'guideCodex',target:'setup-card-codex'}],
  ['claude', {name:'Claude / Claude Code',copy:'guideClaude',target:'setup-card-claude'}],
  ['minimax', {name:'MiniMax M Plan',copy:'guideMinimax',target:'minimax-panel'}],
  ['google', {name:'Google Gemini / Antigravity',copy:'guideGoogle',api:'gemini'}],
  ['copilot', {name:'GitHub Copilot',copy:'guideCopilot',target:'setup-card-copilot'}],
  ['kimi', {name:'Kimi / Kimi Code',copy:'guideKimi'}],
  ['other', {copy:'guideOther'}],
]);
export function createSubscriptionGuide({text,showMethod}) {
  const choice=()=>choices.get($('subscription-account').value);
  function render() {
    const selected=$('subscription-account').value;
    const placeholder=element('option','',text('guideChoose'));placeholder.value='';
    $('subscription-account').replaceChildren(placeholder,...[...choices].map(([id,value])=>{const option=element('option','',value.name || text('guideOtherAccount'));option.value=id;return option;}));
    $('subscription-account').value=choices.has(selected)?selected:'';
    const current=choice();
    $('subscription-guide-copy').textContent=text(current?.copy || 'guideHint');
    $('subscription-guide-action').hidden=!current?.target;
    $('subscription-guide-api').hidden=!current || Boolean(current.target);
    $('subscription-guide-local').hidden=!current || Boolean(current.target);
    $('subscription-guide-source').hidden=selected!=='google';
  }
  $('subscription-account').addEventListener('change',render);
  $('subscription-guide-action').addEventListener('click',()=>{
    const current=choice();if(!current?.target)return;
    showMethod('subscription',$('subscription-account').value);
    const target=$(current.target);if(current.target==='minimax-panel')target.open=true;
    $('subscription-provider').focus();
  });
  $('subscription-guide-api').addEventListener('click',()=>{const current=choice();if(current&&!current.target)showMethod('api',current.api);});
  $('subscription-guide-local').addEventListener('click',()=>{const current=choice();if(current&&!current.target)showMethod('local');});
  return {render};
}
