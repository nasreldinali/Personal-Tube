# Architecture and formats

Version: 1. Reviewed: 2026-11-03.

## Responsibilities

MEASURED: public/domain holds pure validation, expiry, catalog, library and preference rules with explicit time inputs. public/data owns storage and the YouTube adapter. public/services coordinates refresh through an injected client and protects revisions. public/ui constructs DOM and cards. public/app.js is the browser composition root, event controller and screen-state renderer. server/http-app.js handles HTTP; server/catalog-repository.js reads the original export; server.mjs manages the process. public/config.js contains constants. The compatibility facade public/core.js preserves existing test imports.

INFERRED: a functional core with explicit adapters suits this local app without a framework or database. The composition root constructs adapters; UI and adapters share domain rules. This dependency-inversion arrangement is a documented interpretation of the requested layers, not a claim that every import follows a literal five-level call chain. No circular imports are allowed. No external runtime or test packages are required.

## Trust and access boundaries

- User input, imported JSON, stored data and API responses are untrusted. Schema versions, types, bounds, IDs and enums are checked. Text is rendered through safe DOM properties, never HTML interpolation.
- Browser validation protects local data integrity; it is not a server authorization boundary. Personal data relies on browser-profile/origin isolation. The app has no roles, accounts, shared private server records or privileged remote operations.
- The server enforces exact loopback Host values, GET/HEAD only and an explicit asset allowlist. Public assets and the normalized catalog require no authentication. No API key or personal preferences are sent to this server.
- Fixed HTTPS YouTube endpoints, 15-second timeouts, bounded pages/batches and safe errors constrain external requests.
- The process retains the owner's filesystem permissions. HTTP route restrictions do not isolate it from local files or hostile local processes.
- Catalog source files are data, never executed. Only the normalized public subset is served.

## Versioned interfaces

| Interface | Contract |
|---|---|
| GET/HEAD /health | JSON version 1, app=PersonalTube, status=ready; launcher rejects unknown service/version. |
| GET/HEAD /catalog.json | JSON version 1, videos and areas arrays; frontend refuses unknown versions. Video IDs are 11-character identifiers. Dates/durations absent from the source are not fabricated. |
| Asset manifest | Static same-origin modules/styles/fonts/images, package release 1.1.0; not an extension API. |
| YouTube | External Data API v3; channels, playlistItems, videos, search and commentThreads only. X-Goog-Api-Key header, never URL. |

## Storage and input rules

| Format | Validation |
|---|---|
| personaltube.state.v1 | version 1; days 1/3/7; channels <=200; cache keyed by channel ID. Channel IDs are UC plus 22 allowed characters, title <=250, category <=60, uploads ID 2-100 allowed characters; images use an HTTPS host allowlist. |
| personaltube.preferences.v1 | version 1; language en/ar; theme auto/light/dark; other versions/enums refused. |
| personaltube.library.v1 | version 1; later/watched each <=20,000 strict string video IDs, deduplicated. |
| personaltube.metadata.v1 | version 1; videos dictionary; entries expire one day after fetchedAt. |
| personaltube.key.v1 | 1-250 trimmed characters, raw string in sessionStorage by default, optional localStorage; never exported/logged. |
| personaltube-backup.json | format personaltube-backup, writer version 2, readers 1/2 only; days, channels, required preferences/library, and v2 discovery. Filename .json, <=2,000,000 bytes before reading. No key or API caches/comment samples. Complete pretty-printed UTF-8 payload stays within the same byte limit. Invalid versions/schema refuse before writes. |
| HackerTube source | taxonomy version 405edcef; unknown versions refused. Other original formats remain documented in DATA.md. |

Imports save prior entries and restore them if any write fails; rollback failure is reported. Export before deliberate clearing; clearing has no automatic undo. Compare-before-write plus storage-event invalidation reject ordinary stale-tab writes, but localStorage is not an atomic multi-tab database. Reload after a conflict.

## Maintenance and deployment

Local personal deployment only, bound to 127.0.0.1:4173. Loopback HTTP is a deliberate HTTPS/HSTS exception. External connections use HTTPS. Public/shared deployment would require a new authentication, TLS and privacy assessment.

Use maintained Node/browser versions and review security updates monthly. For an applicable exploited or critical issue, stop the affected workflow and update before resuming (target one day); high severity seven days; medium thirty days; low next maintenance cycle, at most ninety days. These are maintenance targets, not evidence that every upstream advisory was checked. There are no npm dependencies. The measured runtime for this delivery is Node v24.3.0; its full advisory status has not been independently audited.

Logs contain lifecycle/request categories, no keys, lists or raw URLs. Report suspected issues privately to the owner. No public disclosure before review/fix. There is no hosted incident-response operator. Reassess privacy roles, consent and breach obligations before making the app available to others.

## Discovery extension (version 1.1.0)

public/domain/recommendations.js validates settings, published counts/audio metadata and comment sample shape; public/services/recommendations.js sequences injected API calls. public/domain/community.js normalizes references and allowed source links. public/domain/discovery.js validates version1 discovery state. public/ui/discovery-panel.js owns the recommendation/community screens. Original domain/adapter boundaries remain intact.

Storage personaltube.discovery.v1 contains version1, collapsed boolean, version1 recommendation settings and up to six provider collections / 2,000 videos. New writes enforce a combined 2,000,000-byte pretty-printed backup budget across settings, library, channels and collections. Imported references remain until removed; external API comment samples stay in memory only. Saved-video title/duration metadata expires with the existing one-day metadata cache. Schema and source limits are documented in COMMUNITY_FORMAT.md. V1 backup import uses default discovery state; unknown versions refuse. Import validates complete replacement budget before transactional writes/rollback.
