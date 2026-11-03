# Changelog

## 1.2.0

- Reconnect original comment evidence and shared-recommender relationships without modifying the original source files.
- Collect bounded live comments from Hacker News and Stack Exchange, with approved-token Reddit support.
- Classify comment/video evidence using local authenticated Codex and rank recommendations separately from pending/neutral/critical shares.
- Show supporting quotations, source links and available public video titles; keep transient analysis out of browser backups.

- Desktop video grids use three columns with the sidebar expanded and four when collapsed, including wide monitors. Screens below 1100px use two columns; phones up to 440px use one.
- Required HackerTube data is grouped under `data/hackertube`; unused source exports and internal records are excluded from the current tracked tree.
- Quality checks use a portable source/brand integrity manifest and write local reports to ignored `.local/`.
- Added maintenance, security and licensing guidance.

## 1.1.0

- English/Arabic DEEDA interface with light, dark and automatic themes.
- Original HackerTube discovery catalog, personal channel feed, expiry settings and saved videos.
- Topic/audio-language YouTube recommendations with published counts and comment excerpts.
- Bounded community video imports and browser-data backup/restore.
