import { preferenceAttributes } from '../domain/preferences.js';
import { viewFromHash } from '../domain/panel-actions.js';
import { byId as $, translatePage } from './dom.js';

export function createNavigationPanel({
  text, readPreferences, readDiscovery, savePreferences, saveDiscovery, setMode, resetPageSize, resetSelection,
  renderFilters, render, renderChannels, renderPlayerButtons, renderConfirmation, bind,
}) {
  function applyLayout() {
    document.documentElement.dataset.collapsed = String(readDiscovery().collapsed);
    const label = text(readDiscovery().collapsed ? 'expandSidebar' : 'collapseSidebar');
    $('sidebar-toggle').setAttribute('aria-expanded', String(!readDiscovery().collapsed));
    $('sidebar-toggle').setAttribute('aria-label', label); $('sidebar-toggle').title = label;
    $('sidebar-toggle').lastElementChild.textContent = label;
    document.querySelectorAll('.d-nav button').forEach(button => {
      const key = button.querySelector('[data-i18n]')?.dataset.i18n;
      if (key) { button.setAttribute('aria-label', text(key)); button.title = text(key); }
    });
  }
  function applyPreferences() {
    const attrs = preferenceAttributes(readPreferences());
    document.documentElement.lang = attrs.lang;
    document.documentElement.dir = attrs.dir;
    if (attrs.theme) document.documentElement.dataset.theme = attrs.theme;
    else delete document.documentElement.dataset.theme;
    translatePage(readPreferences().language);
    $('language').value = readPreferences().language;
    $('theme').value = readPreferences().theme;
    applyLayout(); renderFilters(); render(); renderChannels(); renderPlayerButtons();
    renderConfirmation();
  }
  function changeMode(value) {
    setMode(value); history.replaceState(null,'',`#${value}`); resetPageSize(); resetSelection();
    $('search').value = ''; $('area').value = ''; $('category').value = ''; $('duration').value = 'all'; $('hide-watched').checked = false;
    renderFilters(); render();
  }
  for (const view of ['discover', 'channels', 'later', 'watched', 'recommendations', 'community']) bind(`view-${view}`, 'click', () => changeMode(view));
  bind('sidebar-toggle', 'click', () => { saveDiscovery({ ...readDiscovery(), collapsed: !readDiscovery().collapsed }); applyLayout(); });
  bind('hero-explore', 'click', () => { changeMode('discover'); $('feed').scrollIntoView(); });
  bind('language', 'change', () => { const next = { ...readPreferences(), language: $('language').value }; savePreferences(next); applyPreferences(); });
  bind('theme', 'change', () => { const next = { ...readPreferences(), theme: $('theme').value }; savePreferences(next); applyPreferences(); });
  window.addEventListener('hashchange',()=>{if(location.hash!=='#feed')changeMode(viewFromHash(location.hash));});
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { event.preventDefault(); $('search').focus(); }
  });
  return { applyPreferences, applyLayout, changeMode };
}
