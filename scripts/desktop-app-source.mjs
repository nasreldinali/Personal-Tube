export function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
export function desktopAppSource(node, launcher, path = '/usr/bin:/bin:/usr/sbin:/sbin') {
  return `#!/bin/sh
export PATH=${shellQuote(path)}
if output=$(${shellQuote(node)} ${shellQuote(launcher)} 2>&1); then
  exit 0
fi
/usr/bin/osascript -e 'on run argv' -e 'display alert "PersonalTube" message (item 1 of argv) as warning buttons {"OK"} default button "OK"' -e 'end run' -- "$output"
exit 1
`;
}
