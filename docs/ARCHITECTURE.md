# Architecture and formats

Version: 1. Reviewed: 2026-11-04.

## Responsibilities

MEASURED: public/domain holds pure validation, expiry, catalog, library and preference rules with explicit time inputs. public/data owns storage and the YouTube adapter. public/services coordinates refresh through an injected client and protects revisions. public/ui constructs DOM and cards. public/app.js is the browser composition root, event controller and screen-state renderer. server/http-app.js handles HTTP; server/catalog-repository.js reads the original export; server.mjs manages the process. public/config.js contains constants. The compatibility facade public/core.js preserves existing test imports.

INFERRED: a functional core with explicit adapters suits this local app without a framework or database. The composition root constructs adapters; UI and adapters share domain rules. This dependency-inversion arrangement is a documented interpretation of the requested layers, not a claim that every import follows a literal five-level call chain. No circular imports are allowed. No external runtime or test packages are required.

## Trust and access boundaries

- User input, imported JSON, stored data and API responses are untrusted. Schema versions, types, bounds, IDs and enums are checked. Text is rendered through safe DOM properties, never HTML interpolation.
- Browser validation protects local data integrity; it is not a server authorization boundary. Personal data relies on browser-profile/origin isolation. The app has no roles, accounts, shared private server records or privileged remote operations.
- The server enforces exact loopback Host values, GET/HEAD for public assets and an explicit asset allowlist; `/api/community`, `/api/youtube-analysis` and `/api/setup` additionally accept bounded same-origin JSON POST. Public assets and the normalized catalog require no authentication. YouTube keys and personal preferences are not sent to this server. Optional Reddit tokens are transiently proxied only to the fixed Reddit OAuth host.
- Fixed HTTPS YouTube endpoints, 15-second timeouts, bounded pages/batches and safe errors constrain external requests.
- The process retains the owner's filesystem permissions. HTTP route restrictions do not isolate it from local files or hostile local processes.
- Catalog source files are data, never executed. Only the normalized public subset is served.

## Versioned interfaces

| Interface | Contract |
|---|---|
| GET/HEAD /health | JSON version 1, app=PersonalTube, status=ready; launcher rejects unknown service/version. |
| GET/HEAD /catalog.json | JSON version 1, videos and areas arrays; frontend refuses unknown versions. Video IDs are 11-character identifiers. Dates/durations absent from the source are not fabricated. |
| Asset manifest | Static same-origin modules/styles/fonts/images, package release 1.8.0; not an extension API. |
| YouTube | External Data API v3; channels, playlistItems, videos, search and commentThreads only. X-Goog-Api-Key header, never URL. |

## Storage and input rules

| Format | Validation |
|---|---|
| personaltube.youtube-usage.v1 | version 1; Pacific YYYY-MM-DD day, nonnegative safe integer units/search. Daily aggregate only, no request identities or keys. Unknown/corrupt records show unavailable. |
| personaltube.youtube-usage-incomplete.v1 | Versioned-key format: Pacific YYYY-MM-DD string marking a lost increment. Shared across tabs, excludes that day from numeric display; next day can recover. |
| personaltube.state.v1 | version 1; integer days 1–7; channels <=200; cache keyed by channel ID, with at most 250 videos plus fetchedAt/limited. Legacy single-video entries remain readable but do not satisfy the new refresh cache. Channel IDs are UC plus 22 allowed characters, title <=250, category <=60, uploads ID 2-100 allowed characters; images use an HTTPS host allowlist. |
| personaltube.preferences.v1 | version 1; language en/ar; theme auto/light/dark; optional thumbnail original/frame, boolean setupDone, refreshMode auto/manual and refreshMinutes 15/30/60/180/360/720/1440; other versions/enums refused. |
| personaltube.library.v1 | version 1; later/watched and optional hidden each <=20,000 strict string video IDs, deduplicated. |
| personaltube.metadata.v1 | version 1; videos dictionary; entries expire one day after fetchedAt. |
| personaltube.key.v1 | 1-250 trimmed characters, raw string in sessionStorage by default, optional localStorage; never exported/logged. |
| personaltube-backup.json | format personaltube-backup, writer version 2, readers 1/2 only; days, channels, required preferences/library, and v2 discovery. Filename .json, <=2,000,000 bytes before reading. No key or API caches/comment samples. Complete pretty-printed UTF-8 payload stays within the same byte limit. Invalid versions/schema refuse before writes. |
| HackerTube source | taxonomy version 405edcef; unknown versions refused. Original export formats remain documented in data/hackertube/DATA.md; only videos.jsonl and taxonomy.json are used. |

Imports save prior entries and restore them if any write fails; rollback failure is reported. Export before deliberate clearing; clearing has no automatic undo. Compare-before-write plus storage-event invalidation reject ordinary stale-tab writes, but localStorage is not an atomic multi-tab database. Reload after a conflict.

## Maintenance and deployment

Local personal deployment only, bound to 127.0.0.1:4173. Loopback HTTP is a deliberate HTTPS/HSTS exception. External connections use HTTPS. Public/shared deployment would require a new authentication, TLS and privacy assessment.

Use maintained Node/browser versions and review security updates monthly. For an applicable exploited or critical issue, stop the affected workflow and update before resuming (target one day); high severity seven days; medium thirty days; low next maintenance cycle, at most ninety days. These are maintenance targets, not evidence that every upstream advisory was checked. There are no npm dependencies. The measured runtime for this delivery is Node v24.3.0; its full advisory status has not been independently audited.

Logs contain lifecycle/request categories, no keys, lists or raw URLs. Report suspected issues privately to the owner. No public disclosure before review/fix. There is no hosted incident-response operator. Reassess privacy roles, consent and breach obligations before making the app available to others.

## Discovery extension (version 1.1.0)

public/domain/recommendations.js validates settings, published counts/audio metadata and comment sample shape; public/services/recommendations.js sequences injected API calls. public/domain/community.js normalizes references and allowed source links. public/domain/discovery.js validates version1 discovery state. public/ui/discovery-panel.js owns the recommendation/community screens. Original domain/adapter boundaries remain intact.

Storage personaltube.discovery.v1 contains version1, collapsed boolean, version1 recommendation settings and up to six provider collections / 2,000 videos. New writes enforce a combined 2,000,000-byte pretty-printed backup budget across settings, library, channels and collections. Imported references remain until removed; external API comment samples stay in memory only. Saved-video title/duration metadata expires with the existing one-day metadata cache. Schema and source limits are documented in COMMUNITY_FORMAT.md. V1 backup import uses default discovery state; unknown versions refuse. Import validates complete replacement budget before transactional writes/rollback.

## Community evidence extension

MEASURED: `public/domain/community-evidence.js` owns pure extraction, stance validation and scoring. `server/community-collector.js` owns fixed-provider adapters through `bounded-http.js`; `community-controller.js` coordinates injected dependencies and bounded in-memory sessions. `community-analysis.js` bounds and validates classification; `codex-classifier.js` owns process I/O and `classifier-policy.js` fixed configuration. `community-repository.js` reads the minimized original index. `public/ui/community-feed.js` owns the community interaction. See [pipeline](COMMUNITY_PIPELINE.md) for versioned contracts.

## YouTube comment analysis extension

MEASURED: `public/domain/youtube-evidence.js` validates the version-1 public-comment payload and filters exact-quote classifications; `server/youtube-analysis.js` controls cooldown and server-side validation through the shared classifier. `public/data/youtube-analysis.js` sends same-origin requests; the recommendation service coordinates the injected analysis adapter. `POST /api/youtube-analysis` accepts at most eight videos with twenty comments each, under 600,000 bytes. Its versioned request/response and selection rules are documented in [automatic analysis](YOUTUBE_ANALYSIS.md). No analysis result is persisted in application storage. Old version-1 `includeComments` settings remain readable for backup compatibility; new searches always analyze comments.

## Automatic community discovery

MEASURED: `public/domain/community-batches.js` budgets server-held samples by pair count and serialized input size. `public/services/community-discovery.js` coordinates injected requests with cancellation, validated progress and a three-call ceiling. The community controller counts attempts server-side and returns positive-only automatic sessions. The UI exposes topic/source search, progress, stop and optional advanced inputs; it does not expose manual batch or raw-share controls. See [contract and verification](COMMUNITY_AUTOMATION.md).

## Channel panels and setup (1.5.0)

`public/domain/panel-actions.js` validates hidden-video actions, category clearing, thumbnail URLs and navigation fragments. Hidden IDs are reversible library preferences, not remote deletions. `YouTubeClient.recent()` provides a bounded seven-day sample through the existing refresh port; `latest()` remains a compatibility API. Duration-based content filters are explicitly estimates.

`public/ui/setup-panel.js` owns first-run requirement/account/usage presentation. `server/provider-manager.js` owns explicit selection, attempt counts and mutual exclusion; `provider-process.js` owns fixed CLI status/login processes. The existing classifier adapter now dispatches fixed Codex or Claude policies. The manager validates classifications before counting completion. Codex login/status/execution use explicit file credential storage, execution requires ChatGPT; Claude login selects Claude.ai, with minimal environment and no API-key fallback. PersonalTube does not read credential files or return account identifiers.

`POST /api/setup`, JSON version 1, accepts `action: status | select | connect` and an allowlisted `provider: codex | claude` for mutations. Body <=1000 bytes; existing Host/Origin/JSON checks apply. Response includes selected provider, boolean availability/support/connection state, subscription/other/none method, connection lifecycle, busy/runtime flags and nonnegative per-provider usage counts. Unknown versions/actions/providers refuse. Login is explicit, single-process, at most 180 seconds, with a 60-second retry interval; its output is discarded. Status probes have five-second and 16 KB limits. Selection and counters are server-memory only and reset on restart. The auth files belong to the official CLIs and are excluded from the repository.

## Refresh preferences (1.6.0)

Optional validated preference fields `refreshMode` (auto/manual) and `refreshMinutes` (15,30,60,180,360,720,1440) preserve the existing auto/30-minute behavior for older stores/backups. `refreshSettings` and `automaticRefreshDue` are pure functions. The browser composition root uses explicit time and page visibility for scheduling, passes the captured settings into `refreshChannels`, and supplies a continuation predicate checked between channels. The service independently rejects non-forced manual work and uses the chosen interval for freshness. Only the explicit Refresh channels action forces refresh. Preference saves retain existing storage conflict checks; existing channel revision checks still protect completed results. No new server route, provider command or model call was introduced.

Community result version 1 adds independentRecommenders, positiveComments and criticalComments; the original upstream score is unchanged. Automatic server sessions require two known distinct endorsing accounts and positive evidence exceeding criticism. The browser applies explicit current YouTube popularity/language constraints using services/community-quality.js, preserves community order and never displays raw partial progress as a verified result. Community responses/errors may include an integer retryAfterSeconds (0–86400 on success, 1–86400 on cooldown errors); the browser tracks per-source eligibility without changing the server rate limit. Classification input includes a bounded optional topic string as untrusted data. See COMMUNITY_QUALITY.md.
