# PersonalTube

A local viewing dashboard with DEEDA branding, English/Arabic, right-to-left layout, light/dark/automatic themes, the supplied HackerTube collection, and your own recent-channel feed.

## Open the dashboard

Double-click **Start PersonalTube.command** in this folder. It starts the server and opens Google Chrome. Keep its Terminal window open while using PersonalTube. Press Ctrl+C to stop it.

Alternatively, with Node.js 20 or newer:

```sh
npm run open
```

Open [PersonalTube](http://127.0.0.1:4173). The address needs the local server running; do not open index.html directly. No package installation, database or hosting is required. The launcher reuses a verified PersonalTube server and refuses unrelated services on the port.

## First-run setup

**Setup & connections** opens the first time and remains available in the sidebar. It checks local requirements and installed/signed-in analysis tools, explains which features need YouTube or an analysis account, and offers **Connect subscription**. Complete the official browser sign-in, then check again. If a tool is missing or a browser login cannot open, official installation links and manual login commands are provided. PersonalTube never receives your account password or installs software automatically.

Choose Codex / ChatGPT or Claude Code / Claude explicitly. Selection is shared by tabs using this local server and resets to Codex on restart. API-only logins are refused for this subscription workflow; there is no automatic provider/billing fallback. Each person uses their own account. Usage shows this server's attempts, validated completions, failures and input counts since startup, not tokens, money or remaining plan balance. Failed attempts can still consume allowance.

## Explore immediately

- The original export contains 6,454 unique videos and 150 categories across 16 topics. Discover selects from 4,654 recommended, non-news videos.
- Search, topic/category filters, daily selections and recommendation sorting work without a key. Original video titles and recommendation excerpts retain their source language; interface controls and taxonomy labels are bilingual.
- Watch later and watched history persist in this browser. Settings & data provides backup export/import.
- The supplied export does not contain reliable durations for every video. Length filters use real metadata fetched with your optional key. Choose **Load lengths for these videos**; durations are never invented.

## Connect your channels

1. Open [Google Cloud Console](https://console.cloud.google.com/), create a project and enable **YouTube Data API v3**.
2. Create an API key. Restrict it to YouTube Data API v3 and website referrer `http://127.0.0.1:4173/*`.
3. Enter it in **Settings & data**, not in source files or a chat.
   Paste only the key value, without labels, internal spaces or invisible formatting characters. Invalid input is rejected without replacing your saved key; a saved key is verified by the next YouTube request.
4. In **Manage channels**, add a handle such as `@lexfridman`, channel URL, or UC channel ID, with an optional category.
5. **My channels** displays recent public uploads within any daily window from 1 to 7 days. Filter by category, channel name and Videos / estimated Shorts / All. Manage channels has an independent scrolling list and confirmed channel/category removal; deleting a category keeps its channels.

The client resolves uploads with channels.list, reads playlistItems.list and verifies videos.list metadata. It scans up to five pages (250 uploads per channel), deduplicates and excludes upcoming/private/unavailable entries. If more pages exist, a partial-sample notice is displayed. Expiry uses publication time. Shorts are estimated from duration (up to 3 minutes); the public API provides no reliable Shorts flag, so short regular videos can appear in that filter. All includes unknown durations. Non-embeddable public videos retain a YouTube link. Results cache for 30 minutes; manual refresh bypasses the interval. Automatic checks run while open, on returning to the page and on reconnecting. Failure of one channel preserves other successful results. API quotas apply.

## Recommendations and communities

Use **Recommendations** to enter a topic, choose declared audio language, set minimum published views/likes and sort by either count. An existing YouTube API key is required. Search is explicit, not automatic. Language filtering excludes unknown audio-language metadata; a creator declaration is not independent speech recognition. Your selected Codex or Claude provider automatically analyzes up to 20 public comments on each of eight candidate videos. Only videos with at least two clear positive endorsements and more positives than criticism are shown, with counts and exact supporting quotes. Generic praise, advertising, questions and criticism do not qualify; identifiable creator comments and duplicates are excluded. Redacted public titles/comments are sent to the selected analysis provider using your local login and account allowance. A search has a two-minute analysis deadline; failures never fall back to unclassified recommendations. This limited sample cannot verify comment authenticity or represent the entire audience. See [automatic analysis](docs/YOUTUBE_ANALYSIS.md). Follow a result through **Add this channel**, or save the video. **Find a similar topic** in the player prepares an editable search.

Use **Communities** to choose a topic and source, then press **Find recommended videos** once. Recent comments are collected and analyzed automatically; progress shows how many selected comments are complete. Only positive recommendations are shown. **More options** contains the date window (30 days by default) and the Stack Exchange site or subreddit. Reddit still requires approved OAuth access. Choose **HackerTube library · ready to browse** for the original ranking, supporting quotes and shared-recommender graph without new analysis.

Each automatic search selects up to 72 comment/video pairs that fit three bounded analysis calls. Long comments or multiple links can reduce the sample. Every selected comment is analyzed unless you press **Stop** or a provider fails; stopping waits for the current step and prevents another call. Partial results are labeled. A search can take several minutes. The selected local CLI uses your subscription and account allowance; selected public text is sent for analysis. Codex 0.155.1 and Claude Code 2.1.281 are verified; other versions refuse pending review. See [automatic community discovery](docs/COMMUNITY_AUTOMATION.md).

An optional **Advanced: import a prepared video-link file** section still accepts small JSON/JSONL video-reference extracts from Reddit, Hugging Face, Kaggle, Stack Exchange, Common Crawl or Wikipedia. These archive imports are separate from the live comment pipeline; they are not automatic archive crawlers or classified recommendations. [Community pipeline](docs/COMMUNITY_PIPELINE.md) and [import format](docs/COMMUNITY_FORMAT.md) describe the exact boundaries.


From 1100px, the desktop grid shows exactly three cards per row with the sidebar expanded and four with it collapsed. Smaller screens use two columns, or one at 440px and below. Filters remain visible while scrolling. The logo is intentionally not clickable.

Choose **Video image** to use the original YouTube thumbnail or the existing video-frame image across all panels. Use a card's × or select several videos and **Remove selected**; confirmation explains that this hides them locally, without deleting anything on YouTube. **Restore removed videos** in Settings restores them. Hidden IDs remain in your backup. Reloading keeps the navigation page through its URL fragment; transient recommendation search results are not persisted.

## Data and privacy

Settings live in this browser at this exact address. A different browser or port has separate storage; backups provide manual transfer. Use one editing tab at a time. If another tab changes data, reload the older tab before editing.

Keys use tab session storage by default. **Remember the key** explicitly opts into local storage. Neither is encrypted by this application; anyone with access to the browser profile can inspect it. Use the API restrictions above. **Remove saved key** withdraws that choice. Exports omit keys and API caches.

Preferences and saved IDs remain until changed or cleared. Channel caches older than seven days and duration metadata older than one day are pruned when read; nothing runs while the browser is closed. Clear personal data requires confirmation and removes only this app's entries. Export first if you want recovery. Imports validate before replacing data and attempt rollback if a write fails.

Thumbnails and playback contact YouTube; API calls go directly to Google. PersonalTube has no analytics or login system. Local settings do not make external media requests private or offline.

## Playback and Premium

The player uses `https://www.youtube.com/embed/VIDEO_ID` with an Open on YouTube fallback. Premium depends on the account and browser cookies; an embed URL cannot guarantee ad-free playback. Creator sponsorships may remain. See [YouTube's embedded-video guidance](https://support.google.com/youtube/answer/7437519).

## Verification

```sh
npm run check
```

This runs Node tests, syntax checks, project-specific lint/format checks, dependency cycles, domain purity, original-data/brand integrity, and seventeen deliberate defect plants in scratch copies. No dependencies are installed. This is not a full ESLint/Prettier or coverage report.

See [verification](docs/VERIFICATION.md), [security](SECURITY.md), [contributing](CONTRIBUTING.md) and [architecture](docs/ARCHITECTURE.md). Real-key channel resolution and latest-video retrieval were verified in Chrome; Premium remains unverified. Automated API tests use synthetic responses.

## Repository layout

| Path | Purpose |
|---|---|
| `public/` | Bilingual UI, domain rules, browser adapters and DEEDA assets |
| `server/` | Loopback HTTP server and catalog reader |
| `data/hackertube/` | Required original video catalog, taxonomy and upstream schema documentation |
| `data/integrity.json` | SHA-256 integrity for retained source data and brand assets |
| `test/`, `scripts/` | Automated tests, validation and local launcher |
| `docs/` | Architecture, community import format and verification |

Exact supplied comments, related data and embeddings are preserved locally in ignored `data/hackertube/original/`, with hashes in `source-integrity.json`. The runtime uses a contact-redacted evidence index derived from the original comments and co-recommendation graph. Embeddings remain preserved for future semantic search; they are not used by the current classifier. Fresh checkouts run from the included evidence index. Internal development records and generated reports belong in ignored `.local/`.


## Source and attribution

The retained export files in `data/hackertube/` remain byte-for-byte unchanged. The catalog is normalized from videos.jsonl and taxonomy.json; raw files and local archives are not served. The supplied folder contains a data export, not HackerTube's application code. This app uses that export and reference card experience with DEEDA branding; it does not claim to run Karpathy's original server. [Karpathy's article](https://karpathy.bearblog.dev/hacker-tube/) describes personal versions built from the export.

Collection: [HackerTube](https://hackertube.org/about), [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news), [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/). DEEDA assets and font licenses are preserved under public/assets. Independent project; unaffiliated with YouTube or HackerTube.

See [NOTICE.md](NOTICE.md) for source and licensing boundaries.
