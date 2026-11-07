# Verification

Reviewed: 2026-11-07.

## Connection methods and live subscription checks (2026-11-07)

MEASURED: 225 deterministic tests and 46 deliberate defects pass. Setup method navigation preserves the active provider, narrows service choices and clears unsent key fields. A deterministic full-path test drives the setup UI through same-origin HTTP into both subscription classifier adapters with controlled responses. Confirmed tests enforce selection, one-minute cooldown, account method and existing concurrency/evidence guards. Known Ollama cloud tags remain outside the local option.

Live browser checks used the actual app's **Test with one sample** controls: Codex and Claude each recorded one attempted/completed analysis, zero failures and one input. Both remained connected through subscription authentication; all five API/local providers recorded zero attempts. The original Codex selection was restored. No login/logout, paid API call or YouTube request was made. This verifies one synthetic comment per account, not a full live YouTube search, future quota availability or first-ever login.

The setup review found repeated information and competing subscription/model forms. The revised flow shows the chosen analysis provider, then three explicit methods; only the selected method's controls appear. YouTube requirements, local preparation and storage details are expandable. Arabic RTL at 390px had no horizontal overflow; returning from YouTube settings reopened setup. These are viewport/interaction checks, not complete accessibility certification. German and Spanish README introductions now accompany the English and Arabic guides; deeper technical documents remain English.

## Analysis connections and channel guidance (2026-11-07)

MEASURED: 221 deterministic tests and all 43 deliberate defects pass through `npm run check`. New coverage exercises confirmed subscription logout, explicit API billing consent, memory-only configuration/removal, fixed destinations, redirect refusal, response/time bounds, exact evidence, no fallback, test cooldown and concurrent-operation refusal. The existing classification instructions were extracted unchanged for reuse by the new adapters. No runtime dependencies were added.

An isolated browser fixture exercised signed-in/signed-out cards, fast-login completion, rejection without API cost acknowledgement, configuration, a confirmed synthetic analysis test, local model selection and confirmed connection removal. A fast-login UI state that left API controls disabled was reproduced and corrected with a regression test. English desktop and Arabic RTL at 390px showed aligned fields and no horizontal overflow or warning/error logs. Channel explanations are grouped behind one concise refresh line; empty detail sections are hidden.

The My channels screenshot uses verified public video metadata in a visibly labelled mixed-date fixture, without changing the live feed's date window, original catalog or personal browser data. See [presentation sources](REPOSITORY_PRESENTATION.md).

LIMITS: subscription logout and new API/local analyses were tested with synthetic accounts and injected responses, not by logging out the owner's real accounts or charging a live API key. Real cloud/model compatibility and a first-ever subscription sign-in remain user-dependent checks. Use the explicit one-sample connection test; configuration alone does not establish successful analysis. ASVS Level 1 remains a review target, not certification.

## Frontend responsibility cleanup

MEASURED (2026-11-06 to 2026-11-07): 207 deterministic tests and all 37 deliberate defects pass. The prior 183 tests and 35 defects remain covered, with added application workflow, module boundary and stylesheet-delivery checks. Each of nine prepared JavaScript factories was moved byte-for-byte with locally recorded SHA-256 proof and separate preparation/move commits. The composition root is 150 lines (previously 531).

The 1,362-line stylesheet was first extracted unchanged into 23 explicitly served sections; concatenation reproduced the original SHA-256. A later approved cleanup removed 14 verified unused application rules (50 lines), without changing supplied brand assets. The import entry is 23 lines. HTML formatting preserved parsed structure and text-bearing inline content; its longest line decreased from 2,519 to 386 characters.

Real-browser comparisons found identical geometry and representative computed styles in 42 video/Shorts/sidebar cases across 14 viewport widths. An additional 60 comparisons covered English, Arabic RTL, German and Spanish with dark, light and system themes at 390/768/1024/1200/1600px. All six views matched DOM elements, attributes and leaf text after the same navigation sequence; 18 dialog comparisons also matched. Tested views had no horizontal overflow or warning/error logs. Nested settings returned to setup, and cancelling removal retained all displayed fixture videos. These are browser viewport checks, not physical-device certification.

Tests use isolated synthetic storage, fixed time and fake API responses; no personal YouTube key, account login or model analysis was used. Data/schema, request budgets, server authorization, provider policies, original catalog, translations and brand hashes are unchanged. ASVS Level 1 remains a review target, not certification. See [frontend maintenance contract](FRONTEND_CLEANUP.md).

## Repository preparation (1.8.2)

177 deterministic tests and 33 deliberate defects pass locally. The defect runner explicitly selects the same reporter across Node versions. CI permission/persisted-credential regressions and defects were added without dropping existing checks. Documentation relative links resolve; English/light and Arabic/dark screenshots use only public catalog content from an isolated browser origin, with empty warning/error logs. Independent read-only review found no blocker for private preparation. Public visibility/history decisions remain separate. See [release preparation](PUBLIC_READINESS.md).

## Dependent channel filters (1.8.1)

175 deterministic tests and 31 deliberate defects pass. Category changes narrow names and clear incompatible selections before rendering; valid selections survive broader categories. Browser fixtures verified 30-to-15 channel narrowing, default Videos after reload, Shorts grid switching, and clean logs. Production Arabic labels/default were also verified. See [channel decisions and evidence](CHANNEL_ENHANCEMENTS.md).

## Community quality and usability (1.8.0)

173 deterministic tests and31 deliberate defects pass. New coverage rejects singleton/copied endorsements, weak or missing YouTube statistics and selected-language mismatches; preserves ordering; enforces cancellation, request bounds and source cooldowns; and prevents failed analysis/metadata from exposing raw progress. Independent review found truncated evidence could omit late positive quotes; the correction preserves supporting excerpts and criticism within20 proofs. Re-review passed42 focused tests with no remaining blocker.

Production browser verified the original library (4,654 entries) and a same-recommender result (12 videos), current guide and rounded keyboard focus. Isolated browser fixtures rejected49-view/0-like output, accepted qualifying150,000-view/2,000-like output and exercised the neutral cooldown. No owner's key/model allowance was used. Arabic/dark and English/light mobile/desktop checks and tablet overflow measurements passed; production warning/error logs were empty. See [scope, evidence and limitations](COMMUNITY_QUALITY.md).

## API usage and channel loading (1.7.0)

158 deterministic tests and 26 deliberate defects pass. Pacific reset (winter/summer), persistence, invalid storage, cross-tab incomplete counts, backup omission/deletion, all request-attempt paths, transport/body stalls and pending-add mutation checks are covered. Independent review found two concurrency issues; corrected regressions and re-review found no remaining blocker.

Local browser fixtures verified successful channel addition (3 units), deliberate timeout with an enabled retry button (4 units), and persisted counts after reload. No actual key or model calls were used. English/light and Arabic/dark settings fit 390/820/1280px checks; production warning/error logs were empty. See [contract and review](API_USAGE_PLAN.md).

## Refresh controls (1.6.0)

145 deterministic tests and 22 deliberate defects pass. Tests use injected clients and explicit clocks to verify manual refusal, explicit forced refresh, selected cache/attempt boundaries, legacy defaults, interval validation, between-channel cancellation, hidden-page refusal and preference backup roundtrip. Only the explicit Refresh channels action bypasses the policy. No live YouTube or model call was used for these tests.

Browser checks verified manual mode survives reload, disables but retains the chosen 6-hour interval, and switching to automatic restores that interval. The original automatic 30-minute setting was restored afterward. Controls work independently from key entry; channel help reflects the active policy. Arabic/dark and English/light were visually inspected at desktop/tablet/mobile widths with no horizontal overflow or browser warning/error logs. Independent review found a visible-only lifecycle mismatch, fixed with a RED/GREEN regression and re-reviewed with 16 focused passing tests and no remaining blocker. See [refresh contract](REFRESH_SETTINGS.md).

## Setup navigation and viewing controls (1.5.2)

137 deterministic tests and20 deliberate defects pass. A fresh localhost browser origin showed setup once; reloading while it was still open, without pressing Done, showed no dialog. Nested YouTube settings returned to setup via both Back and close; closing standalone Settings returned to the feed. Independent review found a preference-reset lifecycle edge case, fixed with idempotent visit persistence and a RED/GREEN regression; seven focused tests passed on re-review with no remaining blocker.

Selection mode was verified with18 selected cards,17 after deselecting one, then0 and no visible checkboxes after Cancel. No videos were removed. Normal collapsed desktop card widths remained277px (four columns), expanded widths324px (three columns); height at277px width decreased from338.6px to311.9px. English/light and Arabic/dark were inspected. Main-header preferences and the floating selection bar fit390px and820px viewports without horizontal overflow. Browser error/warning logs were empty. These are simulated viewports, not physical-device tests. The30-minute cached/manual channel refresh and on-request comment analysis behavior were not changed.

## Connection and card refinement (1.5.1)

Measured: 133 deterministic tests and 19 deliberate defects pass. Real local account selection switched from Codex to Claude and back through the new provider buttons. Both subscriptions were already authenticated; a fresh browser sign-in was not exercised. Pending sign-in, timeout, close cancellation, missing-install help and inline failure feedback are covered by injected responses and fake timers. No analysis call was initiated.

Visual checks covered Arabic/dark and English/light connection dialogs, 390px mobile layout, the fixed Done footer, and missing-install help. Regular cards retained title, channel, recommendation/date, topic, duration when available and library controls; removal opens confirmation and cancel retains the card. Isolated real-component Shorts fixtures verified portrait 9:16 media and 5/3/2 columns at 1280/820/390px without overflow. The actual channel Shorts filter activates the five-column grid. These are simulated viewports, not physical-device tests. Browser warning/error logs were empty.

Independent review found one bounded polling deadline defect; its correction passed re-review and the added regression/mutation check. No remaining security blocker was identified. See [refinement evidence](UX_REFINEMENT.md).

## Channel panels and subscription setup (1.5.0)

MEASURED: deterministic tests cover multi-page, multi-video channel refresh, all daily windows, sample ceilings, legacy-cache upgrade, filtering, hidden-ID backup roundtrip, category clearing, provider controls and authentication/process boundaries. Native CLI smoke checks on one synthetic public-style comment succeeded for both Codex and Claude with locally validated structured output; no personal comment or credential content was copied. The live sign-in flow itself was not exercised because both installed subscriptions were already connected.

Browser checks verified page retention after reload, original/frame choice, confirmed 18-card removal and restoration (4,654 → 4,636 → 4,654 eligible catalog videos), and clear initial account/usage status. A separate origin with 30 synthetic channels verified category deletion retains all channels and independently scrolling to the last channel leaves the add form at the same vertical position (111.39px). New filters showed no horizontal overflow at 390px or 820px; these are simulated sizes, not physical-device tests. Browser error/warning logs were empty during the checked flows. Multi-video YouTube retrieval was tested with injected API responses, not a fresh real-key channel request in this delivery.

The independent reviewer closed two findings after corrections: rejected output accounting and explicit Codex credential-store consistency. Eighteen focused re-review tests passed with no remaining blocker. Full checks and 17 deliberate defects pass. See [delivery contract](CHANNEL_ENHANCEMENTS.md).

## Automatic community discovery

The 1.4.0 flow was verified with one live Hacker News submission: 257 comments scanned, 123 containing video links, 66 selected and analyzed automatically, and 14 recommended videos returned. Progress advanced through 23, 44 and 66 without manual batch clicks. The bounded sample was disclosed. Original-library browsing returned 275 matching recommended videos and evidence from 39,834 original comments without new model analysis.

Arabic/dark and English/light were visually inspected; viewport checks at 390, 820 and 1200 pixels showed no horizontal overflow. No browser errors or warnings were captured during these checks. Deterministic tests cover cancellation before the next request, provider failure, stale results, no-progress responses, server-side attempt limits and positive-only output. An independent security review ran 22 focused tests and additional boundary probes with no blocking finding. See [the delivery contract](COMMUNITY_AUTOMATION.md).

## Automated checks

`npm run check` passes 145 Node tests and detects twenty-two deliberate defects in isolated scratch copies: manual refresh refusal, selected cache interval, setup visit persistence, explicit connection selection, queued-poll deadline, subscription refusal, provider output validation, hidden-ID budget, disabled Claude tools, automatic community call budget, cancellation before another model call, positive-evidence threshold, unknown analysis input, malformed-key rejection, community Origin enforcement, exact classification quote evidence, backup byte budget, strict community source validation, foreign Host refusal, key exclusion from backups, stale-tab refusal and stale-refresh refusal. It also checks JavaScript syntax, project-specific formatting, import cycles, domain boundaries, asset presence and source/brand SHA-256 integrity. This is not a general linter, coverage report or formal security certification.

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
