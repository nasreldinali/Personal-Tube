import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { parseDesktopProfile } from './desktop-profile.mjs';

export async function focusDesktopBrowser(execute = promisify(execFile), configuration = null, pause = () => delay(250)) {
  const profile = parseDesktopProfile(configuration);
  const options = { timeout: 60000, maxBuffer: 4096, shell: false, encoding: 'utf8' };
  async function focus(findOnly = false) {
    const args = ['-l', 'JavaScript', fileURLToPath(new URL('./focus-personaltube.js', import.meta.url))];
    if (profile) args.push(JSON.stringify({ ...profile, findOnly }));
    const { stdout } = await execute('/usr/bin/osascript', args, options);
    return stdout.trim();
  }
  try {
    let status = await focus();
    if (profile && status === 'profileMissing') {
      await execute('/usr/bin/open', ['-n', '-a', 'Google Chrome', '--args', `--profile-directory=${profile.directory}`, `http://127.0.0.1:4173/?desktop=${profile.marker}#channels`], options);
      for (let attempt = 0; attempt < 8; attempt++) {
        await pause(); status = await focus(true);
        if (status === 'focused') break;
      }
    }
    if (!['focused', 'opened'].includes(status)) throw new Error('Unexpected browser status');
    return status;
  } catch {
    throw new Error('PersonalTube could not focus the selected Chrome profile. Make sure Chrome is installed and the configured profile directory still exists. If macOS asks, allow PersonalTube to control Google Chrome under Privacy & Security → Automation. Accessibility and Full Disk Access are not needed. No fallback to another profile was attempted.');
  }
}
