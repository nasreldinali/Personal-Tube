export function parseDesktopProfile(value) {
  if (value === null) return null;
  if (value?.version !== 1 || typeof value.directory !== 'string' || !/^(Default|Profile [1-9][0-9]*)$/.test(value.directory) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100 || /[\r\n\x00-\x1f]/.test(value.name) || typeof value.marker !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(value.marker)) throw new Error('Invalid desktop Chrome profile configuration. Check .local/desktop-browser.json.');
  return { version: 1, directory: value.directory, name: value.name, marker: value.marker };
}
