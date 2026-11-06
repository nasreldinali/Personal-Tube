import { readFile } from 'node:fs/promises';

// During extraction the same behavior tests follow its current owner.
export async function frontendSource(module) {
  try { return await readFile(new URL(`../public/${module}`, import.meta.url), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; return readFile(new URL('../public/app.js', import.meta.url), 'utf8'); }
}
export function factorySource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing factory ${name}`);
  const end = source.indexOf('\n}\n', start);
  if (end < 0) throw new Error(`Unclosed factory ${name}`);
  return source.slice(start, end + 3);
}
