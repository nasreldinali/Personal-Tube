import { readFile } from 'node:fs/promises';
import { normalizeCatalog } from '../public/domain/catalog.js';

export function createCatalogRepository(root) {
  let pending;
  return async () => {
    if (!pending) {
      pending = Promise.all([readFile(new URL('data/hackertube/videos.jsonl', root), 'utf8'), readFile(new URL('data/hackertube/taxonomy.json', root), 'utf8')]).then(([source, topics]) => {
        const taxonomy = JSON.parse(topics);
        if (taxonomy.version !== '405edcef' || !Array.isArray(taxonomy.areas)) throw new Error('Unsupported catalog version');
        return { version: 1, sourceVersion: taxonomy.version, videos: normalizeCatalog(source.trim().split('\n').map(line => JSON.parse(line))), areas: taxonomy.areas.map(a => ({ id: a.id, name: a.name, categories: a.categories.map(c => ({ id: c.id, name: c.name })) })) };
      }).catch(error => { pending = undefined; throw error; });
    }
    return pending;
  };
}
