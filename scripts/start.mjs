import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { startupPlan } from './start-plan.mjs';

const address = 'http://127.0.0.1:4173';
async function health() {
  try {
    const response = await fetch(`${address}/health`, { signal: AbortSignal.timeout(1000) });
    if (!response.ok) return {};
    try { return await response.json(); } catch { return {}; }
  } catch (error) {
    return error.cause?.code === 'ECONNREFUSED' ? null : {};
  }
}
function openBrowser() {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'darwin' ? ['-a', 'Google Chrome', address] : platform === 'win32' ? ['/c', 'start', '', address] : [address];
  const child = spawn(command, args, { stdio: 'ignore', shell: false });
  child.on('error', () => console.log(`Open this address in your browser: ${address}`));
  child.on('exit', code => { if (code) console.log(`Open this address in your browser: ${address}`); });
}

const decision = startupPlan(await health());
if (decision === 'refuse') {
  console.error('Another service or an unsupported PersonalTube version uses port 4173. Close it before starting.');
  process.exitCode = 1;
} else if (decision === 'reuse') {
  console.log(`PersonalTube is already running: ${address}`); openBrowser();
} else {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], { stdio: 'inherit', shell: false });
  child.on('error', () => { console.error('Unable to start the local server.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code || 0; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  let ready = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    await delay(150);
    if (startupPlan(await health()) === 'reuse') { ready = true; break; }
    if (child.exitCode !== null) break;
  }
  if (ready) openBrowser();
  else { console.error('The server did not become ready. Check the message above and retry.'); child.kill('SIGTERM'); process.exitCode = 1; }
}
