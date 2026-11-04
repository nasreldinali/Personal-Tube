# Verification

Reviewed: 2026-11-04.

## Channel panels and subscription setup (1.5.0)

MEASURED: deterministic tests cover multi-page, multi-video channel refresh, all daily windows, sample ceilings, legacy-cache upgrade, filtering, hidden-ID backup roundtrip, category clearing, provider controls and authentication/process boundaries. Native CLI smoke checks on one synthetic public-style comment succeeded for both Codex and Claude with locally validated structured output; no personal comment or credential content was copied. The live sign-in flow itself was not exercised because both installed subscriptions were already connected.

Browser checks verified page retention after reload, original/frame choice, confirmed 18-card removal and restoration (4,654 → 4,636 → 4,654 eligible catalog videos), and clear initial account/usage status. A separate origin with 30 synthetic channels verified category deletion retains all channels and independently scrolling to the last channel leaves the add form at the same vertical position (111.39px). New filters showed no horizontal overflow at 390px or 820px; these are simulated sizes, not physical-device tests. Browser error/warning logs were empty during the checked flows. Multi-video YouTube retrieval was tested with injected API responses, not a fresh real-key channel request in this delivery.

The independent reviewer closed two findings after corrections: rejected output accounting and explicit Codex credential-store consistency. Eighteen focused re-review tests passed with no remaining blocker. Full checks and 17 deliberate defects pass. See [delivery contract](CHANNEL_ENHANCEMENTS.md).

## Automatic community discovery

The 1.4.0 flow was verified with one live Hacker News submission: 257 comments scanned, 123 containing video links, 66 selected and analyzed automatically, and 14 recommended videos returned. Progress advanced through 23, 44 and 66 without manual batch clicks. The bounded sample was disclosed. Original-library browsing returned 275 matching recommended videos and evidence from 39,834 original comments without new model analysis.

Arabic/dark and English/light were visually inspected; viewport checks at 390, 820 and 1200 pixels showed no horizontal overflow. No browser errors or warnings were captured during these checks. Deterministic tests cover cancellation before the next request, provider failure, stale results, no-progress responses, server-side attempt limits and positive-only output. An independent security review ran 22 focused tests and additional boundary probes with no blocking finding. See [the delivery contract](COMMUNITY_AUTOMATION.md).

## Automated checks

`npm run check` passes 127 Node tests and detects seventeen deliberate defects in isolated scratch copies: subscription refusal, provider output validation, hidden-ID budget, disabled Claude tools, automatic community call budget, cancellation before another model call, positive-evidence threshold, unknown analysis input, malformed-key rejection, community Origin enforcement, exact classification quote evidence, backup byte budget, strict community source validation, foreign Host refusal, key exclusion from backups, stale-tab refusal and stale-refresh refusal. It also checks JavaScript syntax, project-specific formatting, import cycles, domain boundaries, asset presence and source/brand SHA-256 integrity. This is not a general linter, coverage report or formal security certification.

The earlier 82-test/nine-defect check also passed in a clean temporary copy without `.git`, `.local`, historical records or ignored original community source files.

The retained real catalog loads 6,454 videos and 16 areas with source taxonomy version `405edcef`. Fresh checkouts use the included community evidence index; the full original comment, relationship and embedding exports are preserved locally. All retained source files and copied brand assets match their pre-cleanup hashes.

## Responsive browser checks

Measured in a desktop browser with viewport overrides, not on physical iOS/Android hardware:

| Width | Expanded sidebar | Collapsed sidebar | Horizontal overflow |
|---|---|---|---|
| 390px | 1 column | 1 column | None |
| 768px | 2 columns | 2 columns | None |
| 820px | 2 columns | 2 columns | None |
| 1024px | 2 columns | 2 columns | None |
| 1200px | 3 columns | 4 columns | None |
| 1600px | 3 columns | 4 columns | None |

Arabic/dark was checked at all sizes. English/light was checked at all except 820px (820px was additionally visually inspected in light mode). Sidebar controls, card readability and sticky filters were inspected. The initial defect was reproduced at 1600px: expanded sidebar incorrectly yielded four columns. It now yields three.

Responsive layout does not make the loopback server reachable from another device. Physical phone/tablet access needs a separately designed hosting or network arrangement. Live YouTube-key requests and Premium account recognition were not exercised in these checks.

## Repository privacy review

An independent review scanned all 109 reachable blobs in the initial history for common Google/GitHub/AWS/Slack credential patterns and PEM private keys; none matched. Synthetic test secrets are fixtures. The current source tree was also checked for common credentials and absolute user-home paths, with no matches. Pattern matching cannot prove the absence of every secret.

The initial commit contains a personal author/committer email; historical development records contain local filesystem paths. The unused upstream full-comment archive also includes email-like strings from public comments. Those records and unused exports are excluded from the current tree but remain in earlier history. This cleanup does not claim to erase previously uploaded data. Future commits use the owner's GitHub no-reply address.

The remote was verified private, with one main branch, no tags, no releases and no Actions artifacts at review time. Keep it private until historical privacy, distribution rights and application licensing have been reviewed. Rewriting published history is a separate owner-approved action; changing visibility was not part of this delivery.

Private development evidence lives in ignored `.local/`; exact restored source exports live in ignored `data/hackertube/original/` in the owner's working folder. Fresh checkouts do not need them. No API key, browser backup or full private brand folder is required to build or test.

## Community delivery, 1.2.0

The original 39,834 comment records and shared-recommender graph are connected to the UI. Original scores are preserved; available comment excerpts are capped upstream and cannot recreate the full historical score. Original raw files still match their recorded hashes.

A real Hacker News sample scanned 291 comments, retained 160 with usable linked-video context, classified 24, and produced four positively recommended videos with exact supporting quotes. Remaining 136 comments stayed pending. Public oEmbed supplied actual titles. This is a bounded sample and an observed model result, not a quality guarantee.

A real Stack Exchange request scanned 300 comments and found no video links in that sample. Provider bounds and failures have synthetic tests; a positive Stack Exchange live recommendation was not demonstrated. Reddit uses tested approved-OAuth adapter logic but was not exercised against a real account. Other dataset sources remain manual reference imports.

Browser verification covered original ordering, evidence disclosure, pagination from 24 to 48 cards, and the shared-recommender filter (12 results for the first card). The community grid was measured at 390px/820px/1200px: one/two/four columns with the sidebar collapsed, and three at 1200px expanded. English/light and Arabic/dark were inspected; no horizontal overflow was observed. No console warnings/errors were observed in the tested flow. These are browser viewport checks, not physical-device certification.

New tests cover collection bounds, classification schemas/quotes, encoded and multi-link context, source credentials, same-origin routes, classifier argument policy and UTF-8 decoding, metadata enrichment, clearing and expiry during active work. Independent review found and helped close sort-before-analysis, UTF-8, global-clear and expiry-race issues. See [community security scope](COMMUNITY_SECURITY.md).

## YouTube connection correction

Native Chrome channel resolution and latest-video retrieval were verified with the owner's unchanged saved key after correcting the default fetch receiver. The original failure was in application transport, not the key. No credentials were extracted. See [connection verification](YOUTUBE_CONNECTION.md).

Follow-up live Chrome verification returned eight recommendations from 48 candidates with declared Arabic audio language and the requested view/like thresholds. Comment samples and their source links were visible; an unavailable-comment result was identified without failing the search. This is manual comment review, not a verified sentiment classifier. Original-catalog duration loading also succeeded for all 18 displayed videos. No application code changed during this follow-up.

## Automatic YouTube analysis, 1.3.0

MEASURED: deterministic tests cover search-to-analysis integration, exact quote binding, dissent counts, two-positive minimum, fail-closed output, creator/author/text deduplication, version/size/field limits, same-origin route checks, cooldown and shared classifier policy. The prior manual sample path is replaced by automatic analysis. Independent security review found no blocker and verified boundaries with synthetic probes; no real keys or author identifiers enter the analysis payload. Live verification is recorded in [the analysis record](YOUTUBE_ANALYSIS.md).
