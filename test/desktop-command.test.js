import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { desktopAppSource, shellQuote } from '../scripts/desktop-app-source.mjs';

test('installed command executes the selected runtime and literal project path without Terminal', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'desktop-command-'));
  try {
    const target = join(directory, "project ' quoted $name.sh");
    const marker = join(directory, 'opened');
    const command = join(directory, 'PersonalTube');
    await writeFile(target, `printf ready > ${shellQuote(marker)}\n`);
    await writeFile(command, desktopAppSource('/bin/sh', target));
    execFileSync('/bin/sh', [command], { timeout: 3000 });
    assert.equal(await readFile(marker, 'utf8'), 'ready');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
