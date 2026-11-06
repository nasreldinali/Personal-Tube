import { readFile } from 'node:fs/promises';
import { memoryStorage, NOW, CHANNEL, VIDEO } from './fixtures.js';

// A deterministic DOM/network boundary for application workflows; layout is checked in a real browser.
export async function appBrowserFixture({ hash = '#channels', preferences = {}, fetcher, state, library, metadata = {}, key = '' } = {}) {
  const nodes = [];
  let document;
  function node(tag, attributes = {}) {
    const value = {
      tagName: tag.toUpperCase(), attributes, dataset: {}, children: [], listeners: {}, value: '', textContent: '', checked: false, hidden: false, open: false,
      append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } },
      replaceChildren(...children) { this.children = []; this.append(...children); },
      setAttribute(name, text) { this.attributes[name] = String(text); },
      removeAttribute(name) { delete this.attributes[name]; },
      getAttribute(name) { return this.attributes[name] ?? null; },
      addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
      async emit(name, extra = {}) { for (const callback of this.listeners[name] || []) await callback({ preventDefault() {}, target: this, ...extra }); },
      focus() { document.activeElement = this; },
      showModal() { this.open = true; }, close() { this.open = false; void this.emit('close'); },
      click() { return this.emit('click'); }, scrollIntoView() {}, reset() { this.resets = (this.resets || 0) + 1; },
      getClientRects() { return this.hidden ? [] : [{}]; },
      querySelectorAll(selector) { return descendants(this).filter(child => matches(child, selector)); },
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
      get lastElementChild() { return this.children.at(-1); },
      get className() { return this.attributes.class || ''; }, set className(text) { this.attributes.class = text; },
      classList: { toggle(name, enabled) { const names = new Set(value.className.split(' ').filter(Boolean)); if (enabled) names.add(name); else names.delete(name); value.className = [...names].join(' '); } },
    };
    for (const [name, text] of Object.entries(attributes)) {
      if (name.startsWith('data-')) value.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = text;
      else if (['id', 'value', 'type'].includes(name)) value[name] = text;
      else if (['hidden', 'checked', 'open', 'disabled', 'selected'].includes(name)) value[name] = true;
    }
    nodes.push(value); return value;
  }
  function descendants(parent) { return parent.children.flatMap(child => [child, ...descendants(child)]); }
  function matches(item, selector) {
    const parts = selector.split(' '); const last = parts.pop();
    if (parts.length) { let parent = item.parent; while (parent && !matches(parent, parts.join(' '))) parent = parent.parent; if (!parent) return false; }
    const tag = last.match(/^[a-z]+/i)?.[0]; if (tag && item.tagName !== tag.toUpperCase()) return false;
    for (const match of last.matchAll(/\.([\w-]+)|#([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)) {
      if (match[1] && !item.className.split(' ').includes(match[1])) return false;
      if (match[2] && item.id !== match[2]) return false;
      if (match[3]) { const actual = match[3] === 'open' ? item.open ? '' : undefined : match[3].startsWith('data-') ? item.dataset[match[3].slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] : item.attributes[match[3]]; if (actual === undefined || (match[4] !== undefined && actual !== match[4])) return false; }
    }
    return true;
  }
  const root = node('root'); const stack = [root];
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/<\/?([\w-]+)\b([^>]*)>/g)) {
    const [raw, tag, attrs] = match;
    if (raw.startsWith('</')) { if (stack.at(-1).tagName === tag.toUpperCase()) stack.pop(); continue; }
    const attributes = Object.fromEntries([...attrs.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g)].map(m => [m[1], m[2] ?? m[3] ?? '']));
    const child = node(tag, attributes); stack.at(-1).append(child);
    if (!['meta', 'link', 'input', 'img', 'br', 'hr', 'source'].includes(tag)) stack.push(child);
  }
  for (const select of nodes.filter(n => n.tagName === 'SELECT')) select.value = (select.children.find(n => n.selected) || select.children[0])?.value || '';
  document = { ...node('document'), hidden: false, documentElement: nodes.find(n => n.tagName === 'HTML'), activeElement: null,
    getElementById(id) { const found = nodes.find(n => n.id === id); if (!found) throw new Error(`Missing fixture element: ${id}`); return found; },
    createElement: tag => node(tag), querySelectorAll: selector => descendants(root).filter(n => matches(n, selector)),
    querySelector: selector => descendants(root).find(n => matches(n, selector)) || null,
  };
  const local = memoryStorage({
    'personaltube.state.v1': JSON.stringify(state || { version: 1, days: 7, channels: [CHANNEL], cache: { [CHANNEL.id]: { fetchedAt: NOW, videos: [VIDEO] } } }),
    'personaltube.preferences.v1': JSON.stringify({ version: 1, language: 'en', theme: 'dark', setupDone: true, refreshMode: 'manual', ...preferences }),
    'personaltube.library.v1': JSON.stringify(library || { version: 1, later: [], watched: [] }),
    'personaltube.metadata.v1': JSON.stringify({ version: 1, videos: metadata }),
  });
  const session = memoryStorage(key ? { 'personaltube.key.v1': key } : {});
  const requests = []; const intervals = []; const timeouts = []; const location = { hash };
  const window = node('window'); const OriginalDate = Date;
  const replacements = {
    document, window, location, history: { replaceState(_a, _b, next) { location.hash = next; } },
    localStorage: local, sessionStorage: session, navigator: { locks: undefined },
    Date: class extends OriginalDate { constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return NOW; } },
    setInterval: callback => { intervals.push(callback); return intervals.length; }, clearInterval() {},
    setTimeout: callback => { timeouts.push(callback); return timeouts.length; }, clearTimeout() {},
    fetch: async (url, options) => { requests.push({ url: String(url), options }); if (fetcher) { const response = await fetcher(url, options); if (response) return response; } return { ok: true, json: async () => String(url) === '/catalog.json' ? { version: 1, videos: [{ ...VIDEO, channelTitle: CHANNEL.title, categories: [], tags: [], score: 10 }], areas: [] } : { version: 1, items: [], sources: [] } }; },
  };
  const previous = Object.fromEntries(Object.keys(replacements).map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const [name, value] of Object.entries(replacements)) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  function restore() { for (const [name, descriptor] of Object.entries(previous)) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } }
  try { await import(`../public/app.js?fixture=${fixtureId++}`); } catch (error) { restore(); throw error; }
  return { document, window, local, session, requests, intervals, timeouts, location, restore, $: id => document.getElementById(id), state: () => JSON.parse(local.getItem('personaltube.state.v1')), library: () => JSON.parse(local.getItem('personaltube.library.v1')) };
}
let fixtureId = 0;
