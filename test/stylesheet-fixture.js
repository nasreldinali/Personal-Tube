import { readFile } from 'node:fs/promises';

const publicRoot = new URL('../public/', import.meta.url);
export async function readStylesheet(url = new URL('styles.css', publicRoot), read = file => readFile(file, 'utf8'), trail = new Set()) {
  if (!url.href.startsWith(publicRoot.href)) throw new Error('Stylesheet outside public assets');
  if (trail.has(url.href)) throw new Error('Circular stylesheet import');
  const next = new Set([...trail, url.href]);
  const source = await read(url);
  const pattern = /^@import ["']([^"']+)["'];\n/gm;
  let result = '', end = 0;
  for (const match of source.matchAll(pattern)) {
    if (!match[1].startsWith('./')) throw new Error('Stylesheet import must be local and relative');
    result += source.slice(end, match.index) + await readStylesheet(new URL(match[1], url), read, next);
    end = match.index + match[0].length;
  }
  return result + source.slice(end);
}
