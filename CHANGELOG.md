# Changelog

## 1.4.0 — 2026-11-04

- Simplify Communities to a topic, source and one search that collects and analyzes comments automatically.
- Show live progress, stop-after-current-step control, positive-only results and clear empty/partial outcomes in Arabic and English.
- Move period/site settings and prepared-file imports behind optional controls; retain original-library browsing.
- Bound each automatic search to three classifier attempts with server-side sample limits and tested cancellation.

## 1.3.0 — 2026-11-03

- Automatically classify YouTube comment samples during recommendation search using the existing restricted Codex integration.
- Display only videos meeting the positive-evidence threshold, with exact quotes, original links and dissent/sample counts.
- Exclude identifiable creator comments and duplicates; enforce bounded same-origin analysis, cooldown and fail-closed output in English and Arabic.

## 1.2.1

- Fix native browser fetch invocation so saved YouTube keys can resolve channels and retrieve videos.
- Reject malformed pasted YouTube keys before storage or requests, preserving any previously saved key.
- Distinguish request/body timeouts from connection failures without exposing credential contents.

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
