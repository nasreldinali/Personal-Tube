import { byId as $ } from './dom.js';

export function createSettingsSections() {
  const sections=['youtube','usage','refresh','data'];
  function show(selected){
    for(const name of sections){
      $(`settings-panel-${name}`).hidden=name!==selected;
      $(`settings-nav-${name}`).setAttribute('aria-pressed',String(name===selected));
    }
    $('settings-body').scrollTop=0;
  }
  for(const name of sections)$(`settings-nav-${name}`).addEventListener('click',()=>show(name));
  return {reset:()=>show('youtube')};
}
