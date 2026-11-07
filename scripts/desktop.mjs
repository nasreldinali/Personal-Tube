import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { launchDesktop } from './desktop-launch.mjs';

const address = 'http://127.0.0.1:4173';
const root = fileURLToPath(new URL('../', import.meta.url));
async function probe() {
  try {
    const response = await fetch(`${address}/health`, { redirect: 'error', signal: AbortSignal.timeout(1000) });
    return response.ok ? await response.json() : {};
  } catch (error) {
    return error.cause?.code === 'ECONNREFUSED' ? null : {};
  }
}
function start() {
  let failed = false;
  const child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], {
    cwd: root, detached: true, stdio: 'ignore', shell: false,
  });
  child.on('error', () => { failed = true; });
  return { failure: () => failed || child.exitCode !== null || child.signalCode !== null, stop: () => child.kill('SIGTERM'), release: () => child.unref() };
}
function openWith(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('/usr/bin/open', args, { stdio: 'ignore', shell: false });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error('browser unavailable')));
  });
}
async function open() {
  try { await openWith(['-a', 'Google Chrome', address]); }
  catch {
    try { await openWith([address]); }
    catch { throw new Error(`PersonalTube is running, but the browser could not open. Open ${address} in your browser.`); }
  }
}
try {
  if (process.platform !== 'darwin') throw new Error('This launcher requires macOS. Use npm start on other systems.');
  await launchDesktop({ probe, start, wait: () => delay(250), open });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
