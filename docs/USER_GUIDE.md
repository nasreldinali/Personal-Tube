# PersonalTube user guide

[Back to overview](../README.md) · [العربية](../README.ar.md)

A local viewing dashboard with DEEDA branding, English/Arabic/German/Spanish controls, Arabic right-to-left layout, light/dark/automatic themes, the supplied HackerTube collection, and your own recent-channel feed.

## Open the dashboard

Double-click **Start PersonalTube.command** in this folder. It starts the server and opens Google Chrome. Keep its Terminal window open while using PersonalTube. Press Ctrl+C to stop it.

Alternatively, with Node.js 20 or newer:

```sh
npm run open
```

Open [PersonalTube](http://127.0.0.1:4173). The address needs the local server running; do not open index.html directly. No package installation, database or hosting is required. The launcher reuses a verified PersonalTube server and refuses unrelated services on the port.

## First-run setup

Follow the [first-time analysis account guide](ANALYSIS_SETUP.md) for installation, official login and troubleshooting. Setup now distinguishes a connected but untested account from a completed analysis in this server session.

**Setup & connections** opens once on the first visit and remains available in the sidebar. The visit is saved immediately, so closing it or reloading without pressing Done does not reopen it. YouTube settings opened from setup provide a Back button; closing those settings also returns to setup. It checks local requirements and installed/signed-in analysis tools, explains which features need YouTube or an analysis account, and presents a separate card for **Codex** and **Claude Code**. Choose **Use Codex/Claude** for an already connected account, or **Sign in** for a disconnected account. The app follows sign-in automatically while the dialog is open, for up to three minutes. Status failures are shown inside the dialog; you can check again manually. If a tool is missing, its button opens installation help. Official installation links and manual login commands are provided if the browser cannot open. PersonalTube never receives your account password or installs software automatically.

Choose a connection explicitly: Codex / ChatGPT, Claude Code / Claude, a supported cloud API, or a local model. See [all connection steps](ANALYSIS_PROVIDERS.md). Selection is shared by tabs using this local server and resets to Codex on restart. API-only logins are refused for this subscription workflow; there is no automatic provider/billing fallback. Each person uses their own account. Usage shows this server's attempts, validated completions, failures and input counts since startup, not tokens, money or remaining plan balance. Failed attempts can still consume allowance.

## Explore immediately

- The original export contains 6,454 unique videos and 150 categories across 16 topics. Discover selects from 4,654 recommended, non-news videos.
- Search, topic/category filters, daily selections and recommendation sorting work without a key. Original video titles and recommendation excerpts retain their source language; interface controls support English, Arabic, German and Spanish; the catalog taxonomy currently has English and Arabic labels.
- Watch later and watched history persist in this browser. Settings & data provides backup export/import.
- The supplied export does not contain reliable durations for every video. Length filters use real metadata fetched with your optional key. Choose **Load lengths for these videos**; durations are never invented.

## Connect your channels

1. Open [Google Cloud Console](https://console.cloud.google.com/), create a project and enable **YouTube Data API v3**.
2. Create an API key. Restrict it to YouTube Data API v3 and website referrer `http://127.0.0.1:4173/*`.
3. Enter it in **Settings & data**, not in source files or a chat.
   Paste only the key value, without labels, internal spaces or invisible formatting characters. Invalid input is rejected without replacing your saved key; a saved key is verified by the next YouTube request.
4. In **Manage channels**, add a handle such as `@lexfridman`, channel URL, or UC channel ID, with an optional category.
5. **My channels** displays recent public uploads within any daily window from 1 to 7 days. Filter by category and channel name; the channel list only shows channels in the selected category. Content defaults to Videos over three minutes, followed by estimated Shorts and Videos + Shorts. Manage channels has an independent scrolling list and confirmed channel/category removal; deleting a category keeps its channels.

The client resolves uploads with channels.list, reads playlistItems.list and verifies videos.list metadata. It scans up to five pages (250 uploads per channel), deduplicates and excludes upcoming/private/unavailable entries. If more pages exist, a partial-sample notice is displayed. Expiry uses publication time. Shorts are estimated from duration (up to 3 minutes); the public API provides no reliable Shorts flag, so short regular videos can appear in that filter. All includes unknown durations. Non-embeddable public videos retain a YouTube link. **Settings & data → Video refresh** lets you choose automatic or manual-only updates. Automatic intervals are 15/30 minutes or 1/3/6/12/24 hours (existing default: 30 minutes); the selected interval controls both scheduling and cached results. Automatic checks only start while the page is visible, including eligible startup/return/reconnect checks. Manual mode also suppresses refresh after saving a key or adding a channel. **Refresh channels** always requests an immediate update. Saving the refresh settings does not itself start a request. Policy changes or hiding the page stop automatic work after its current channel; an explicit update you requested can finish. Choices survive reload and backup import. These controls reduce automatic requests, not impose a hard quota cap: explicit searches, channel resolution and duration loading still use the API. Failure of one channel preserves other successful results. API quotas apply. Adding a channel now has independent progress and does not wait for a whole-library refresh; its immediate automatic fetch targets only that channel. A request that stalls ends after 15 seconds with a retry message.

**Settings & data → YouTube API today** shows estimated daily use recorded in this browser from when tracking starts: general data units and search calls separately, with remaining amounts against Google's default limits (10,000 units and 100 searches). These are not live project balances; previous usage, other devices/apps, custom quotas and simultaneous tabs without Web Locks may differ. Failed attempts count conservatively. Playback does not consume Data API units. Counts reset at midnight Pacific Time, exclude secrets and backups, and are removed by clearing personal data. Storage or lock failure hides incomplete totals rather than displaying a false balance. Use the Google Cloud link for actual usage. See [counter and loading behavior](API_USAGE_PLAN.md) and [Google quota documentation](https://developers.google.com/youtube/data/determine_quota_cost).

## Recommendations and communities

Use **Recommendations** to enter a topic, choose declared audio language, set minimum published views/likes and sort by either count. An existing YouTube API key is required. Search is explicit, not automatic. Language filtering excludes unknown audio-language metadata; a creator declaration is not independent speech recognition. Your explicitly selected subscription, API or local model automatically analyzes up to 20 public comments on each of eight candidate videos. Only videos with at least two clear positive endorsements and more positives than criticism are shown, with counts and exact supporting quotes. Generic praise, advertising, questions and criticism do not qualify; identifiable creator comments and duplicates are excluded. Redacted public titles/comments are sent to the selected analysis provider using your chosen connection and its applicable allowance or API billing. A search has a two-minute analysis deadline; failures never fall back to unclassified recommendations. This limited sample cannot verify comment authenticity or represent the entire audience. See [automatic analysis](YOUTUBE_ANALYSIS.md). Follow a result through **Add this channel**, or save the video. **Find a similar topic** in the player prepares an editable search.

Use **Communities** to choose a topic and source, then press **Find recommended videos** once. Recent comments are collected and analyzed automatically; progress shows how many selected comments are complete. Live results require at least two distinct known endorsing accounts (copied identical praise does not add another account) and more positive than critical sampled comments. Visible quality controls add current YouTube checks: minimum 100,000 views and 1,000 likes by default, editable limits, and declared audio language. Connect your own YouTube key before starting; it stays in the browser and these checks use the API counter. Missing/unknown statistics or missing selected language fail the check. Popularity and model classification do not guarantee quality or authenticity. **More options** contains the date window (30 days by default) and the Stack Exchange site or subreddit. Reddit still requires approved OAuth access. Press **Browse original HackerTube library**, or choose **HackerTube library · ready to browse**, for the original ranking, supporting quotes and shared-recommender graph without new analysis. Original-library ordering is preserved and is not subject to the live popularity controls. **How to use this page** explains the current workflow; old manual-batch instructions and shared/newest controls no longer apply. A neutral per-source countdown shows when another collection is allowed, without clearing results or blocking archive browsing. See [quality and usability](COMMUNITY_QUALITY.md).

Each automatic search selects up to 72 comment/video pairs that fit three bounded analysis calls. Long comments or multiple links can reduce the sample. Every selected comment is analyzed unless you press **Stop** or a provider fails; stopping waits for the current step and prevents another call. Unverified partial results are withheld if analysis or metadata checks fail or the search is stopped. A search can take several minutes. The selected connection uses your subscription allowance, explicit API billing or local model; selected public text is sent for analysis. Codex 0.155.1 and Claude Code 2.1.281 are verified; other versions refuse pending review. See [automatic community discovery](COMMUNITY_AUTOMATION.md).

An optional **Advanced: import a prepared video-link file** section still accepts small JSON/JSONL video-reference extracts from Reddit, Hugging Face, Kaggle, Stack Exchange, Common Crawl or Wikipedia. These archive imports are separate from the live comment pipeline; they are not automatic archive crawlers or classified recommendations. [Community pipeline](COMMUNITY_PIPELINE.md) and [import format](COMMUNITY_FORMAT.md) describe the exact boundaries.


From 1100px, the desktop grid shows exactly three cards per row with the sidebar expanded and four with it collapsed. Smaller screens use two columns, or one at 440px and below. Filters remain visible while scrolling. The logo is intentionally not clickable.

Choose **Video image** to use the original YouTube thumbnail or the existing video-frame image across all panels. Use a card's **Remove** action or select several videos and **Remove selected**; confirmation explains that this hides them locally, without deleting anything on YouTube. **Restore removed videos** in Settings restores them. Hidden IDs remain in your backup. Reloading keeps the navigation page through its URL fragment; transient recommendation search results are not persisted.

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

This runs Node tests, syntax checks, project-specific lint/format checks, dependency cycles, domain purity, original-data/brand integrity, and 33 deliberate defect plants in scratch copies. No dependencies are installed. This is not a full ESLint/Prettier or coverage report.

See [verification](VERIFICATION.md), [security](../SECURITY.md), [contributing](../CONTRIBUTING.md) and [architecture](ARCHITECTURE.md). Real-key channel resolution and latest-video retrieval were verified in Chrome; Premium remains unverified. Automated API tests use synthetic responses.

## Repository layout

| Path | Purpose |
|---|---|
| `public/` | Bilingual UI, domain rules, browser adapters and DEEDA assets |
| `server/` | Loopback HTTP server and catalog reader |
| `data/hackertube/` | Required original video catalog, taxonomy and upstream schema documentation |
| `data/integrity.json` | SHA-256 integrity for retained source data and brand assets |
| `test/`, `scripts/` | Automated tests, validation and local launcher |
| `docs/` | Architecture, community import format and verification |

In the maintainer working copy only, exact supplied comments, related data and embeddings are preserved locally in ignored `data/hackertube/original/`, with hashes in `source-integrity.json`. The runtime uses a contact-redacted evidence index derived from the original comments and co-recommendation graph. Those ignored original files are not included in downloads. Embeddings are not used by the current classifier. Fresh checkouts run from the included evidence index. Internal development records and generated reports belong in ignored `.local/`.


## Source and attribution

The retained export files in `data/hackertube/` remain byte-for-byte unchanged. The catalog is normalized from videos.jsonl and taxonomy.json; raw files and local archives are not served. The supplied folder contains a data export, not HackerTube's application code. This app uses that export and reference card experience with DEEDA branding; it does not claim to run Karpathy's original server. [Karpathy's article](https://karpathy.bearblog.dev/hacker-tube/) describes personal versions built from the export.

Collection: [HackerTube](https://hackertube.org/about), [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news), [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/). DEEDA assets and font licenses are preserved under public/assets. Independent project; unaffiliated with YouTube or HackerTube.

See [NOTICE.md](../NOTICE.md) for source and licensing boundaries.

## More analysis connections and signing out

Setup now provides confirmed **Sign out** for Codex/Claude and an **API or local model** section for OpenAI, Anthropic, OpenRouter, Ollama and LM Studio. Configure a model explicitly, acknowledge cloud API costs, and use the optional one-sample connection test. See [the full connection guide](ANALYSIS_PROVIDERS.md) for session-only keys, local server requirements and supported model formats.
