# PersonalTube

A local viewing dashboard with DEEDA branding, English/Arabic, right-to-left layout, light/dark/automatic themes, the supplied HackerTube collection, and your own recent-channel feed.

## Open the dashboard

Double-click **Start PersonalTube.command** in this folder. It starts the server and opens Google Chrome. Keep its Terminal window open while using PersonalTube. Press Ctrl+C to stop it.

Alternatively, with Node.js 20 or newer:

```sh
npm run open
```

Open [PersonalTube](http://127.0.0.1:4173). The address needs the local server running; do not open index.html directly. No package installation, database or hosting is required. The launcher reuses a verified PersonalTube server and refuses unrelated services on the port.

## Explore immediately

- The original export contains 6,454 unique videos and 150 categories across 16 topics. Discover selects from 4,654 recommended, non-news videos.
- Search, topic/category filters, daily selections and recommendation sorting work without a key. Original video titles and recommendation excerpts retain their source language; interface controls and taxonomy labels are bilingual.
- Watch later and watched history persist in this browser. Settings & data provides backup export/import.
- The supplied export does not contain reliable durations for every video. Length filters use real metadata fetched with your optional key. Choose **Load lengths for these videos**; durations are never invented.

## Connect your channels

1. Open [Google Cloud Console](https://console.cloud.google.com/), create a project and enable **YouTube Data API v3**.
2. Create an API key. Restrict it to YouTube Data API v3 and website referrer `http://127.0.0.1:4173/*`.
3. Enter it in **Settings & data**, not in source files or a chat.
4. In **Manage channels**, add a handle such as `@lexfridman`, channel URL, or UC channel ID, with an optional category.
5. **My channels** displays one latest public, published video per channel within 1, 3 or 7 days. Edit categories and remove channels in Manage channels.

The client resolves uploads with channels.list, reads playlistItems.list and verifies videos.list metadata. It checks up to five pages when needed and excludes upcoming/private/unavailable entries. Expiry uses publication time. Non-embeddable public videos retain a YouTube link. Results cache for 30 minutes; manual refresh bypasses the interval. Automatic checks run while open, on returning to the page and on reconnecting. Failure of one channel preserves other successful results. API quotas apply.

## Recommendations and communities

Use **Recommendations** to enter a topic, choose declared audio language, set minimum published views/likes and sort by either count. An existing YouTube API key is required. Search is explicit, not automatic. Language filtering excludes unknown audio-language metadata; a creator declaration is not independent speech recognition. Up to eight results show public comment excerpts for your own review. No automatic positive-comment or quality score is claimed. Follow a result through **Add this channel**, or save the video. **Find a similar topic** in the player prepares an editable search.

Use **Communities** to import a small JSON/JSONL extract from Reddit, Hugging Face, Kaggle, Stack Exchange, Common Crawl or Wikipedia. [Format and source limitations](docs/COMMUNITY_FORMAT.md) explain extraction, attribution and access. A source mention is not automatically an endorsement. No huge archive download runs inside the browser. Google Books Ngrams contains word frequencies, so use its topics in search rather than importing it as video data.

From 1100px, the desktop grid shows exactly three cards per row with the sidebar expanded and four with it collapsed. Smaller screens use two columns, or one at 440px and below. Filters remain visible while scrolling. The logo is intentionally not clickable.

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

This runs Node tests, syntax checks, project-specific lint/format checks, dependency cycles, domain purity, original-data/brand integrity, and six deliberate defect plants in scratch copies. No dependencies are installed. This is not a full ESLint/Prettier or coverage report.

See [verification](docs/VERIFICATION.md), [security](SECURITY.md), [contributing](CONTRIBUTING.md) and [architecture](docs/ARCHITECTURE.md). Real-key channel fetching and Premium remain unverified; automated API tests use synthetic responses.

## Repository layout

| Path | Purpose |
|---|---|
| `public/` | Bilingual UI, domain rules, browser adapters and DEEDA assets |
| `server/` | Loopback HTTP server and catalog reader |
| `data/hackertube/` | Required original video catalog, taxonomy and upstream schema documentation |
| `data/integrity.json` | SHA-256 integrity for retained source data and brand assets |
| `test/`, `scripts/` | Automated tests, validation and local launcher |
| `docs/` | Architecture, community import format and verification |

Unused original embeddings, related-video data, full comment archive and internal development records are excluded from the current source tree. They are not needed to run or test the app. Local archives and generated reports belong in ignored `.local/`.


## Source and attribution

The retained export files in `data/hackertube/` remain byte-for-byte unchanged. The catalog is normalized from videos.jsonl and taxonomy.json; raw files and local archives are not served. The supplied folder contains a data export, not HackerTube's application code. This app uses that export and reference card experience with DEEDA branding; it does not claim to run Karpathy's original server. [Karpathy's article](https://karpathy.bearblog.dev/hacker-tube/) describes personal versions built from the export.

Collection: [HackerTube](https://hackertube.org/about), [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news), [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/). DEEDA assets and font licenses are preserved under public/assets. Independent project; unaffiliated with YouTube or HackerTube.

See [NOTICE.md](NOTICE.md) for source and licensing boundaries.
