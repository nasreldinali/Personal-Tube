import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubscriptionGuide } from '../public/ui/subscription-guide.js';
import { createConnectionMethod } from '../public/ui/connection-method.js';
import { setupDocumentFixture } from './fixtures.js';
test('account finder explains unsupported subscriptions and only navigates after an explicit action',()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const methods=[];
 try {
  const n=id=>f.document.getElementById(id),navigation=createConnectionMethod({setMethod:(...args)=>methods.push(args)});
  const ui=createSubscriptionGuide({text:key=>key,showMethod:navigation.show});
  n('subscription-account').value='';ui.render();assert.equal(n('subscription-guide-action').hidden,true);
  n('subscription-account').value='google';n('subscription-account').listeners.change();assert.equal(n('subscription-guide-copy').textContent,'guideGoogle');assert.equal(n('subscription-guide-action').hidden,true);assert.equal(n('subscription-guide-api').hidden,false);assert.equal(n('subscription-guide-source').hidden,false);assert.deepEqual(methods,[]);
  n('subscription-guide-api').listeners.click();assert.deepEqual(methods,[['api','gemini']]);assert.equal(n('method-api').attributes['aria-pressed'],'true');
  n('subscription-guide-local').listeners.click();assert.deepEqual(methods.at(-1),['local',undefined]);
  n('subscription-account').value='copilot';n('subscription-account').listeners.change();assert.equal(n('subscription-guide-copy').textContent,'guideCopilot');assert.equal(n('subscription-guide-source').hidden,true);assert.equal(n('subscription-guide-action').hidden,false);
  n('subscription-account').value='kimi';n('subscription-account').listeners.change();assert.equal(n('subscription-guide-copy').textContent,'guideKimi');assert.equal(n('subscription-guide-action').hidden,true);
  n('subscription-account').value='constructor';n('subscription-account').listeners.change();assert.equal(n('subscription-guide-copy').textContent,'guideHint');assert.equal(n('subscription-guide-api').hidden,true);
 }finally{globalThis.document=before;}
});
test('supported subscription guidance reveals existing controls without login or provider selection',()=>{
 const before=globalThis.document,f=setupDocumentFixture();globalThis.document=f.document;const opened=[];
 try {
  const n=id=>f.document.getElementById(id);createSubscriptionGuide({text:key=>key,showMethod:(method,provider)=>{assert.equal(method,'subscription');assert.ok(['codex','claude','minimax'].includes(provider));}});
  for(const provider of ['codex','claude','minimax']){
   const target=n(provider==='minimax'?'minimax-panel':`setup-card-${provider}`);n('subscription-provider').focus=()=>opened.push(provider);
   n('subscription-account').value=provider;n('subscription-account').listeners.change();assert.equal(n('subscription-guide-action').hidden,false);assert.equal(n('subscription-guide-api').hidden,true);assert.equal(opened.length,provider==='codex'?0:provider==='claude'?1:2);
   n('subscription-guide-action').listeners.click();
  }
  assert.deepEqual(opened,['codex','claude','minimax']);assert.equal(n('minimax-panel').open,true);
 }finally{globalThis.document=before;}
});
