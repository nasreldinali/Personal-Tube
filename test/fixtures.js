export const NOW = Date.parse('2026-11-03T12:00:00Z');
export const CHANNEL_ID = `UC${'a'.repeat(22)}`;
export const CHANNEL = { id: CHANNEL_ID, title: 'Fixture channel', category: 'Technology', uploads: 'UUfixture' };
export const VIDEO = { id: 'abcdefghijk', title: 'Fixture video', publishedAt: '2026-11-02T12:00:00Z', duration: 'PT12M34S', embeddable: true };
export function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
export function apiResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}
export const CATALOG_ROWS = [
  { vid: 'abcdefghijk', title: 'A careful introduction', channel: 'Fixture channel', summary: 'Learn the foundations.', why_hn: 'A clear explanation.', score: 20, hn: { recommenders: 3 }, categories: [{ id: 'foundations', name: 'Foundations', area: 'software' }], tags: ['code'], shelf_life: 'evergreen' },
  { vid: 'lmnopqrstuv', title: 'A science lecture', channel: 'Fixture science', summary: 'Explore science.', score: 10, hn: { recommenders: 2 }, categories: [{ id: 'physics', name: 'Physics', area: 'science' }], tags: [], shelf_life: 'evergreen' },
  { vid: '12345678901', title: 'Old breaking news', channel: 'Fixture news', summary: '', score: 99, hn: { recommenders: 4 }, categories: [], shelf_life: 'news' },
  { vid: '12345678902', title: 'Only referenced', channel: 'Fixture references', summary: '', score: 1, hn: { recommenders: 0 }, categories: [], shelf_life: 'evergreen' },
];
export function setupDocumentFixture() {
  const nodes=new Map();
  const node=()=>({value:'codex',children:[],dataset:{},attributes:{},setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];},scrollIntoView(){},listeners:{},addEventListener(event,handler){this.listeners[event]=handler;},replaceChildren(...children){this.children=children;},append(...children){this.children.push(...children);},showModal(){this.open=true;},close(){this.open=false;}});
  return {nodes,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node}};
}
