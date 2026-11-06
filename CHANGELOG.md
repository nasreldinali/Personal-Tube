# Changelog

## 1.8.0 — 2026-11-06

- Live community discovery requires multiple independent account endorsements and current YouTube popularity/language checks, with visible editable thresholds and no unverified fallback. Preserve community ranking and supporting quotes, including late endorsements.
- Show a neutral per-source cooldown countdown and keep results available. Add a direct original-library entry and current workflow guide; manual batches remain automatic.
- Use one rounded focus indicator for header fields, retaining keyboard/forced-color visibility. Separate API-estimate help from analysis-account usage help.

## 1.7.0 — 2026-11-04

- Settings shows estimated daily YouTube data units and search calls, remaining against default limits, Pacific-midnight reset and a link to actual Google Cloud usage. Local counts include attempts, omit secrets and stay out of backups.
- Channel addition stays available during background work, reports its own progress/success, and only targets the new channel for an immediate automatic fetch. Manual mode is preserved.
- A hard 15-second request deadline covers stalled transport and response bodies. Concurrent channel/key changes cannot restore stale additions; concurrent meter failures remain visibly unavailable across tabs and reloads.

## 1.6.0 — 2026-11-04

- Add saved automatic/manual video refresh controls, with 15/30-minute and 1/3/6/12/24-hour intervals.
- Apply the interval to both attempt scheduling and cached channel freshness; manual mode blocks startup, reconnect, return-to-page, key-save and channel-add refresh.
- Keep explicit Refresh channels available; changing policy or hiding the page stops automatic work between channels.
- Include refresh choices in backups and show the active policy in My channels.

## 1.5.2 — 2026-11-04

- Remember the first setup visit immediately, including after preferences are reset; reload no longer requires pressing Done first.
- Add a return path from YouTube settings to setup and match the close buttons.
- Move language and appearance controls into the main header.
- Replace the persistent bulk checkbox with an explicit selection mode and a floating action bar; preserve keyboard focus after selecting a card.
- Retain regular card widths and reduce vertical space by grouping metadata; explain the existing automatic channel refresh policy.

## 1.5.1 — 2026-11-04

- Replace the crowded setup dialog with separate YouTube and analysis provider cards, clear active-account feedback and expandable requirements/usage details.
- Make connecting an authenticated provider activate it; follow pending sign-in automatically with bounded polling and inline errors.
- Move video removal and selection into a compact footer, retaining confirmation and recovery.
- Shorten regular video cards while retaining metadata; show portrait Shorts in five desktop, three tablet and two phone columns.

## 1.5.0 — 2026-11-04

- Fetch multiple recent uploads per followed channel, with every daily window from 1–7 days, channel-name filtering and clearly labeled estimated Shorts filtering.
- Add original-thumbnail/frame choice, confirmed single/bulk panel removal and restore, confirmed custom-category deletion and an independently scrolling channel list.
- Keep the current navigation page after reload.
- Add first-run setup, official Codex/Claude subscription connection controls and bounded, validated analysis usage counters.
- Preserve existing channels, legacy caches, backups, original data and brand assets.

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
