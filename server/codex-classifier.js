import { classificationPrompt } from './classification-prompt.js';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classificationInputs } from '../public/domain/community-evidence.js';
import { AppError } from '../public/domain/errors.js';
import { classificationSchema, classifierArguments, supportedCodexVersion } from './classifier-policy.js';

import { claudeArguments, parseClaudeOutput, supportedClaudeVersion } from './claude-policy.js';
const exec = promisify(execFile);
export function parseClassifierEvents(output) {
  if (Array.isArray(output)) output = Buffer.concat(output).toString('utf8');
  let answer;
  let completed = false;
  for (const line of output.trim().split('\n')) {
    let event;
    try { event = JSON.parse(line); } catch { throw new AppError('classificationUnavailable'); }
    if (event.type === 'item.completed' && event.item?.type === 'error' && event.item.message === 'Code Mode is unavailable because code-mode host is disabled. Code mode will fail closed; enable `features.code_mode_host` and install `codex-code-mode-host`.') continue;
    if (event.type === 'turn.failed' || event.type === 'error') throw new AppError('classificationUnavailable');
    if (event.item && !['agent_message','reasoning'].includes(event.item.type)) throw new AppError('classificationUnavailable');
    if (event.type === 'item.completed' && event.item?.type === 'agent_message') answer = event.item.text;
    if (event.type === 'turn.completed') completed = true;
  }
  if (!completed || typeof answer !== 'string') throw new AppError('classificationUnavailable');
  try { return JSON.parse(answer); } catch { throw new AppError('invalidClassification'); }
}
export function createCodexClassifier({ executable = 'codex', environment = process.env, provider = 'codex' } = {}) {
  if (!['codex','claude'].includes(provider)) throw new AppError('invalidSetup');
  const env = Object.fromEntries(['PATH','HOME','USER','TMPDIR','CODEX_HOME'].filter(key => environment[key]).map(key => [key,environment[key]]));
  let busy = false;
  return async (rows, mode = 'community') => {
    if (busy) throw new AppError('busy');
    const inputs = classificationInputs(rows);
    if (!['community','youtube'].includes(mode) || !inputs.length || inputs.length > (mode === 'youtube' ? 160 : 24) || JSON.stringify(inputs).length > (mode === 'youtube' ? 250000 : 40000)) throw new AppError('invalidCommunityEvidence');
    busy = true;
    let scratch;
    try {
      const version = await exec(executable, ['--version'], { env, timeout: 5000, maxBuffer: 16000 });
      if (version.stdout.trim() !== (provider === 'claude' ? supportedClaudeVersion : supportedCodexVersion)) throw new AppError('classifierVersion');
      scratch = await mkdtemp(join(tmpdir(), 'personaltube-classify-'));
      const schema = join(scratch,'schema.json');
      await writeFile(schema, JSON.stringify(classificationSchema), { mode: 0o600 });
      const prompt = classificationPrompt(inputs, mode);
      const output = await new Promise((resolve, reject) => {
        const child = spawn(executable, provider === 'claude' ? claudeArguments() : classifierArguments(scratch,schema), { cwd: scratch, env, shell: false, detached: process.platform !== 'win32', stdio: ['pipe','pipe','pipe'] });
        const out = [];
        let bytes = 0;
        let failed = false;
        const stop = () => {
          failed = true;
          try { if (process.platform !== 'win32' && child.pid) process.kill(-child.pid,'SIGKILL'); else child.kill('SIGKILL'); } catch { child.kill(); }
        };
        const timer = setTimeout(stop, 120000);
        child.stdout.on('data', chunk => { bytes += chunk.length; if (bytes > 1000000) stop(); else out.push(chunk); });
        child.stderr.on('data', chunk => { bytes += chunk.length; if (bytes > 1000000) stop(); });
        child.stdin.on('error', () => {});
        child.on('error', () => { clearTimeout(timer); reject(new AppError('classificationUnavailable')); });
        child.on('close', code => { clearTimeout(timer); if (code !== 0 || failed) reject(new AppError('classificationUnavailable')); else resolve(out); });
        child.stdin.end(prompt);
      });
      return provider === 'claude' ? parseClaudeOutput(Buffer.concat(output)) : parseClassifierEvents(output);
    } catch (error) { if (error instanceof AppError) throw error; throw new AppError('classificationUnavailable'); }
    finally { try { if (scratch) await rm(scratch, { recursive: true, force: true }); } finally { busy = false; } }
  };
}
