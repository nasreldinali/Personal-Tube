import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

export async function focusDesktopBrowser(execute = promisify(execFile)) {
  try {
    const { stdout } = await execute('/usr/bin/osascript', ['-l', 'JavaScript', fileURLToPath(new URL('./focus-personaltube.js', import.meta.url))], {
      timeout: 60000, maxBuffer: 4096, shell: false, encoding: 'utf8',
    });
    const status = stdout.trim();
    if (!['focused', 'opened'].includes(status)) throw new Error('Unexpected browser status');
    return status;
  } catch {
    throw new Error('PersonalTube could not focus Google Chrome. Make sure Chrome is installed. If macOS asks, allow PersonalTube to control Google Chrome under Privacy & Security → Automation. Accessibility and Full Disk Access are not needed. No fallback tab was opened.');
  }
}
