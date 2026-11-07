import { access, copyFile, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { desktopAppSource } from './desktop-app-source.mjs';

const destination = join(homedir(), 'Desktop', 'PersonalTube.app');
let temporary;
try {
  if (process.platform !== 'darwin') throw new Error('The desktop app installer requires macOS. Use npm start on other systems.');
  try { await access(destination); throw new Error('PersonalTube.app already exists on your Desktop. Move it aside before reinstalling.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  temporary = await mkdtemp(join(tmpdir(), 'personaltube-desktop-'));
  const app = join(temporary, 'PersonalTube.app');
  const launcher = fileURLToPath(new URL('./desktop.mjs', import.meta.url));
  await mkdir(join(app, 'Contents', 'MacOS'), { recursive: true });
  await mkdir(join(app, 'Contents', 'Resources'));
  await writeFile(join(app, 'Contents', 'MacOS', 'PersonalTube'), desktopAppSource(process.execPath, launcher, process.env.PATH), { mode: 0o755 });
  await writeFile(join(app, 'Contents', 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>com.deeda.personaltube.launcher</string>
<key>CFBundleName</key><string>PersonalTube</string>
<key>CFBundleDisplayName</key><string>PersonalTube</string>
<key>CFBundleExecutable</key><string>PersonalTube</string>
<key>CFBundleIconFile</key><string>PersonalTube.icns</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSUIElement</key><true/>
</dict></plist>
`);
  const iconset = join(temporary, 'PersonalTube.iconset');
  await mkdir(iconset);
  const icon = fileURLToPath(new URL('../public/assets/logo/deeda-mark-256.png', import.meta.url));
  for (const size of [16, 32, 128, 256]) {
    execFileSync('/usr/bin/sips', ['-z', String(size), String(size), icon, '--out', join(iconset, `icon_${size}x${size}.png`)], { stdio: 'pipe' });
  }
  const compiledIcon = join(temporary, 'PersonalTube.icns');
  execFileSync('/usr/bin/iconutil', ['-c', 'icns', '-o', compiledIcon, iconset], { stdio: 'pipe' });
  await copyFile(compiledIcon, join(app, 'Contents', 'Resources', 'PersonalTube.icns'));
  await cp(app, destination, { recursive: true, force: false, errorOnExist: true });
  console.log('Installed PersonalTube.app on your Desktop. Double-click it, or drag it to the Dock for one-click opening.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (temporary) await rm(temporary, { recursive: true, force: true });
}
