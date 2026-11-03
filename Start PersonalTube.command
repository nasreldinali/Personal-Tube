#!/bin/zsh
set -eu
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null 2>&1; then
  print 'Node.js 20 or newer is required. Install it from https://nodejs.org/ and try again.'
  read -r '?Press Return to close.'
  exit 1
fi
node scripts/start.mjs
