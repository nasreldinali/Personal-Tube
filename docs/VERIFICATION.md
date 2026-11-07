# Verification

## macOS desktop launcher — 2026-11-07

MEASURED: **276 deterministic tests and 77 deliberate-defect checks** pass. Launcher tests cover running-instance reuse, readiness before opening, unknown-service refusal, bounded timeout, child failures, browser failures and literal shell argument handling. A command-path test executes the generated launcher against a local fixture without network or browser access. Three added defect plants prove conflicting-listener refusal, cleanup of only the newly created process, and command quoting are enforced.

MEASURED: the installed named desktop app opened successfully and reused the existing listener without changing its process. A separate scratch copy cold-started the real server on an isolated loopback port; it survived launcher exit and a second invocation reused the same listener. The browser command was stubbed only in that scratch run; opening the installed app exercised the real browser path. The test stopped only its isolated server. Reinstallation refused the existing desktop app. No account selection, credentials, browser data, login items or existing server lifecycle changed. This is a local macOS installation check, not a signed/notarized desktop release or a first-use OS-permission test on a clean machine.

## Apache 2.0 license transition — 2026-11-07

MEASURED: LICENSE matches the official Apache License 2.0 text byte-for-byte (SHA-256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`). Package metadata uses `Apache-2.0`; all four README entry points and contribution terms agree. NOTICE retains the existing application copyright and Karpathy/HackerTube, data, font and brand credits. NOTICE.md describes the separate licensing boundaries. The previous MIT notice is preserved verbatim in `docs/licenses/MIT-legacy.txt` (SHA-256 `98f855fd22d8f350018282825eae6bce25797efefe28a7de7e552b3233e5f63e`); earlier distribution rights are not withdrawn. Historical delivery records explicitly identify their MIT references as historical.

MEASURED: **267 deterministic tests and 74 deliberate-defect checks** pass. A new packaging regression failed against MIT metadata before the change and now verifies canonical Apache text, the unchanged legacy grant, preserved attribution and consistent current license declarations. Existing source/brand integrity checks pass; no bundled data, fonts, brand assets, runtime behavior or account settings changed. This verifies packaging and preservation, not a legal audit of ownership. Official source: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt).

## Practical-skill recommendations and evidence tiers — 2026-11-07

MEASURED: **266 deterministic tests and 74 deliberate-defect checks** pass. RED regressions reproduced popularity displacing the search shortlist, missing practical-outcome guidance, shallow comment sampling and the old 50-item response ceiling. The previous UI also failed the new evidence-tier regression in an isolated copy. Tests cover relevance order despite reordered metadata, unchanged eligibility gates, bounded distributed sampling, resource-specific response limits, supported-before-limited ordering, exact evidence, and distinct card labels across all four interface languages. No dependency, credential store, paid-provider fallback or analysis-call budget changed.

MEASURED: initial revised-policy sports runs still returned zero supported results (132 comments each). Inspecting the redacted public sample showed unrelated engagement, requests for other videos and generic praise crowding the first twenty comments. One specific endorsement was insufficient for the supported threshold. The final implementation selects eligible videos in search-relevance order, samples twenty comments across up to one hundred per video in the same Google request, and recognizes explicit applied skill/recipe outcomes. Two positives and more support than criticism remain necessary for a supported recommendation. Exactly one qualifying positive with zero criticism may appear after supported results as **limited evidence**, visibly distinguished from consensus. Generic praise alone qualifies for neither tier.

### Final fresh browser searches

Fixed queries: `طريقة عمل البيتزا في البيت` and `تعلم تسديد كرة القدم للمبتدئين`; declared Arabic audio, minimum 100,000 views / 1,000 likes, views order. No thresholds were lowered between the following runs. Each search used one subscription analysis call. YouTube comments were unavailable for zero videos.

| Topic | Provider | Search candidates | Videos analyzed | Comments analyzed | Supported | Limited evidence |
|---|---|---:|---:|---:|---:|---:|
| Football shooting | Codex | 42 | 8 | 160 | 1 | 0 |
| Home pizza | Codex | 45 | 8 | 160 | 4 | 1 |
| Home pizza | Claude | 45 | 8 | 160 | 4 | 1 |
| Football shooting | Claude | 45 | 6 | 120 | 1 | 1 |

MEASURED: both sports runs displayed the same shooting-power lesson with two specific Arabic comments: correcting striking errors and scoring using the demonstrated technique. Claude additionally displayed a ball-curling lesson with one viewer reporting mastering the move in five minutes; this was explicitly labelled limited evidence. Cooking results contained applied dough, sauce and recipe experiences, including colloquial Arabic. Reviewed every displayed excerpt (up to five per card). Repeated recipe use and subjective successful-result claims are weaker than detailed technique explanations; they are not independently verified. One Codex cooking result showed five positive versus four critical comments, so support does not imply unanimity. Spot checks of rejected labels confirmed generic creator praise and unrelated engagement remained neutral.

INFERRED: the final sports searches demonstrate useful subject-related results where the earlier runs were empty, while preserving a separate stronger evidence standard. This is a small, adaptive live check, not a held-out accuracy benchmark. Search results, metadata and sampled comments changed between runs; equal samples or provider superiority are not claimed. Model judgments can still miss useful comments or accept weak ones. Public metadata, viewer claims and exact source quotes do not prove authenticity, full-video quality, recipe safety or coaching quality.

MEASURED: the four final searches analyzed 600 comment inputs. Including three diagnostic runs, this task consumed seven successful subscription calls: Codex 452 inputs across three calls, Claude 572 across four, with zero failed model calls. One intermediate browser search hit the old response-size limit before analysis; a regression fixed that. One immediate next search was refused by the existing 15-second cooldown and retried after waiting; it made no model call. These intermediate searches still used YouTube quota. All paid/cloud API usage counters stayed zero, and neither account was logged out.

MEASURED: Arabic mobile inspection at 319px showed no horizontal overflow; both evidence tiers and source quotes were visible. Final browser warning/error capture was empty. A temporary local diagnostic harness used the same routes and providers and saved only redacted public analysis inputs/validated labels in ignored records. It was stopped after testing and the ordinary server restored with Codex selected and both subscriptions connected. Restart resets session usage/test-status counters; captured pre-restart evidence is retained privately. Raw comments, account identifiers, keys and diagnostic files are not part of the commit. At that test revision, the license was MIT; see the later license transition above.

## Arabic cooking and sports searches — 2026-11-07

MEASURED on application revision `cbb6fb5`: four fresh searches through the Recommendations page, using existing Codex and Claude subscriptions. Fixed queries: `طريقة عمل البيتزا في البيت` (home pizza) and `تعلم تسديد كرة القدم للمبتدئين` (beginner football shooting). Each used declared Arabic audio, minimum 100,000 views / 1,000 likes and views order. Filters were not weakened after empty results.

| Topic | Provider | Candidates | Videos analyzed | Comments analyzed | Displayed recommendations |
|---|---|---:|---:|---:|---:|
| Home pizza | Codex | 45 | 8 | 150 | 5 |
| Home pizza | Claude | 45 | 8 | 152 | 2 |
| Beginner football shooting | Codex | 46 | 8 | 148 | 0 |
| Beginner football shooting | Claude | 46 | 6 | 113 | 0 |

MEASURED: every displayed cooking title matched pizza preparation, and all 18 displayed excerpts across the two searches were Arabic. Evidence included successful dough attempts, water measurements, sauce preparation, refrigeration and dough thickness. Claude's two results were also present in Codex's five. One Codex excerpt praised fluffy dough without an explicit trial or learning outcome; it remains borderline evidence rather than a confident quality pass. Thanks or blessings accompanying practical detail were not treated as standalone proof.

MEASURED: both sports analyses completed successfully but returned no video with sufficient qualifying support. Comments were unavailable for zero videos in all four searches. No sports recommendation was delivered or manually assessed as useful. Searches fetched independently, with different sample sizes and sports candidate subsets; this is not a controlled provider comparison. Hidden rejected labels were not independently reviewed.

INFERRED: the cooking results support useful Arabic recommendations beyond AI videos, including colloquial Arabic evidence. The sports result establishes execution only, not useful coverage or correct rejection of every candidate. These two topics do not establish general Arabic accuracy, comment authenticity, recipe quality or coaching quality. Strict evidence can suppress useful results, and borderline praise can still pass model judgment.

MEASURED: these runs added two successful calls per subscription: 298 comment inputs for Codex and 265 for Claude, with no failures. End-of-session totals were 4 completed / 497 inputs for Codex and 4 completed / 464 inputs for Claude, including earlier English checks. All cloud API counters remained zero; both accounts remained connected and Codex was restored as selected. No logout, paid API or application-code change occurred. YouTube quota and subscription allowances were consumed. Browser warning/error capture contained zero entries, and `npm run check` passed. Raw source quotes, links and screenshots remain in ignored local records; no credentials or account identifiers were published.

## Fresh YouTube search with both subscriptions — 2026-11-07

MEASURED on application revision `cbb6fb5`: two new searches were submitted through the actual Recommendations page, selecting Codex and then Claude in Connections. Query: `large language models introduction`; declared English audio; minimum 100,000 views and 1,000 likes; popularity order by views. Each search inspected 50 candidates and analyzed **157 newly retrieved comments across 8 videos**, with comments unavailable for 0. This completes the fresh-browser check that was pending during the replay below. The key was entered by the user directly in the app, never extracted or copied into evidence.

| Provider | Displayed results | Positive counts on displayed videos |
|---|---:|---|
| Codex | 3 | Transformers: 6/19; Karpathy LLM deep dive: 2/20; LLMs explained briefly: 6/20 |
| Claude | 2 | Transformers: 5/19; LLMs explained briefly: 6/20 |

MEASURED: both displayed the two 3Blue1Brown explanations, while Codex also displayed Karpathy's *Deep Dive into LLMs like ChatGPT*. The prior general AI overview, RAG tutorial and agent-course candidates did not appear. Reviewed every displayed evidence excerpt (up to five per video): they identify embeddings, vector arithmetic, transformer computation, attention, token prediction, training data, RLHF or hallucinations/post-training. The previously observed bare engagement/clarity/foundation and color-choice praise did not appear as standalone proof. The two providers disagreed on some positive/critical classifications, including 2 versus 0 critical comments for the brief LLM explainer. Searches fetched independently and public statistics changed, so byte-identical samples are not claimed.

INFERRED: these results better match the requested subject and provide more specific evidence than the earlier seven-result run. Some concept-specific appreciation remains weaker than an explicit viewing recommendation. This single English-topic check, source titles/context and sampled excerpts do not establish overall accuracy, authenticity, best-provider status or a full review of the videos. Strict evidence can exclude relevant videos; a title mentioning a concept is not itself proof of quality.

MEASURED: after both runs, each account showed 2 completed calls, 0 failed and 199 inputs in the current server session: the previous 42-excerpt replay plus the new 157-comment search. Both subscription accounts remained connected; Codex was restored as selected. All cloud API counters stayed zero. No logout, paid API, fallback or application-code change occurred during this follow-up. YouTube quota and subscription allowances were used. Browser warning/error capture contained zero entries. Private raw result/quote records and the verification screenshot remain ignored locally; no key or account identifier was published.

## Topic-aware YouTube recommendations — 2026-11-07

MEASURED: **259 deterministic tests and 69 deliberate-defect checks** pass. New regressions cover mandatory topic/version/context fields, redaction, description bounds, end-to-end search-to-classifier topic delivery, and the stricter multilingual evidence policy. RED failures showed the previous request omitted the topic and used version 1. Three added defects (dropped topic, missing-topic acceptance and missing description bound) are detected. No dependency was added.

MEASURED: both real subscription adapters were exercised through the production same-origin analysis route with the same **42 public comment excerpts from 7 videos**, deduplicated by original comment ID and retained from the earlier live YouTube test. These are real source excerpts, not synthetic praise fixtures. They are not full comments, a fresh YouTube search or an unbiased evaluation dataset; prior selection favors previously positive evidence. No new YouTube request was needed for this replay.

An initial policy run still accepted two overly general displayed extracts. After requiring the quotation itself to name a concept or describe a specific mechanism/example, both final runs retained **2 videos**: *Transformers, the tech behind LLMs* and *Large Language Models explained briefly*. Both excluded the general AI, RAG and agent-course candidates; both also excluded the Karpathy and IBM LLM candidates for insufficient qualifying evidence in this reduced excerpt sample. This is not a judgment that those videos are poor. Reviewed every final positive label: retained evidence identifies embeddings, vector arithmetic, transformer computation, word prediction or LLM limitations. Previously displayed color-choice praise, generic engagement/clarity compliments and an unspecified “great foundation” did not qualify. No broad accuracy percentage is claimed.

Both accounts completed one 42-input run with zero failures on the final server session, remained connected, and Codex was restored as selected. All cloud API counters remained zero. One earlier 42-input iteration per account also consumed subscription allowance before the stricter final run; no paid API or logout was used in either iteration. Counters reset when the local server restarts.

REPLAY LIMIT: this earlier check reused saved excerpts rather than fetching new comments. The fresh browser follow-up above subsequently completed after user key entry and recovery of the existing tab. The replay and fresh-search results remain separate evidence; semantic decisions are fallible and strict rules may suppress useful results.

## Focused Connections navigation — 2026-11-07

MEASURED: **257 deterministic tests and 66 deliberate-defect checks** pass. New coverage verifies one visible subscription service, safe fallback, preserved browsing during status updates, Help navigation and secret/consent clearing. A UI → same-origin setup route → provider manager test proves browsing sends status requests only, keeps Codex/Claude connected and makes no analysis request. A deliberate secret-lifetime defect is detected.

Browser review covers the actual local app at desktop and 390px mobile widths, Arabic RTL, German, Spanish and English, and light/dark themes. Subscription, API and local forms remain separate; the active account does not change during navigation. This is a navigation/layout verification, not a new live authentication or paid API test. Existing provider verification limits below still apply.

## Copilot connection and settings layout — 2026-11-07

MEASURED: the full check passes **254 deterministic tests and 65 deliberate-defect checks**. New coverage exercises isolated Copilot login/test selection, official fixed login arguments, OAuth-only auth, version/protocol refusal, disabled tools/config discovery, bounded frames and process lifetime, exact evidence and the UI → same-origin HTTP → manager → classifier → protocol path with synthetic responses. Existing Codex/Claude tests remain unchanged. No runtime dependency was added.

MEASURED: official Copilot CLI 1.0.107 returned its version, negotiated protocol 3 and returned signed-out status in an OS sandbox with networking denied. No OAuth completion or model call was made. A live signed-in Copilot account analysis remains **unverified**; the sample test is the user's explicit verification step. This adapter does not promise quota-only billing independently of GitHub's overage settings.

MEASURED: Settings sections and the Connections return route were exercised in the browser. English/light desktop, Arabic/dark at 390×844 and German/Spanish tablet at 768×1024 were inspected. The measured mobile dialog/body had no horizontal overflow. A checkbox draft survived section switches; navigation/unit tests also verify unsaved fields. Browser warning/error capture was empty. The actual preview still detected Codex and Claude without login/logout or analysis requests. The README preview shows an empty key field, not a real credential.

## Account finder for new users — 2026-11-07

MEASURED: full check passes **241 deterministic tests and 58 deliberate-defect checks**. RED-first interaction tests cover explicit-only navigation, supported account controls, unknown choice refusal and no automatic provider selection. The optional finder explains Codex, Claude, MiniMax, Google, Copilot, Kimi and other accounts in all four interface languages; named guidance is not a claim of seven subscription integrations.

MEASURED: isolated browser fixture verified Google guidance → Gemini API form with empty key and unchecked cost consent, Codex still selected, and Claude guidance → existing controls without login or selection. Arabic mobile at 390×844 had no horizontal content overflow; console warnings/errors were empty. No model request, authentication change or paid API call. Google consumer Antigravity guidance was corrected against its current official FAQ. This adds onboarding guidance, not a new Google subscription adapter.

## Connection center and broader model support — 2026-11-07

MEASURED: the complete check passes **239 deterministic tests and 58 deliberate-defect checks**, including syntax, formatting, import/layer and asset integrity gates. New coverage includes four fixed cloud API protocols, explicit local-only GET discovery, port/list limits, strict configuration fields, stale-result refusal, an origin-guarded full HTTP flow and returning from YouTube settings to its connection section, and reopening the active model configuration. Existing tests and defect checks remain.

MEASURED: isolated browser fixture at desktop 1280×720, mobile 390×844 and tablet 768×1024. Verified all five sections, seven API choices, three local choices, explicit fixture model discovery/selection and unchanged Codex selection, plus the YouTube settings return path. English/light and Arabic/dark screenshots inspected; German and Spanish controls inspected on tablet. The scrolling content had no horizontal overflow at the measured mobile/tablet sizes. Console warning/error capture was empty. Fixture credentials and model IDs were synthetic; no real account login/logout or paid API call occurred.

LIMIT: Gemini, DeepSeek, Mistral, Groq and generic local model generation have deterministic adapter coverage, not live account/server compatibility certification. No installed model server was assumed or started. Each user's model must pass their explicit sample test. The UI offers three specific subscription integrations; it does not claim universal access to every chat subscription. No accessibility conformance certification is claimed.

## Repository documentation and download check — 2026-11-07

MEASURED: reviewed all 35 tracked Markdown files for internal links/assets: 167 relative references resolved, including checked Markdown heading anchors. Reconciled current language/provider guidance, GitHub About/topics and contribution templates; retained dated historical evidence. `npm run check` passed 231 tests and 52 deliberate-defect checks. No runtime source or account configuration changed in this documentation update.

MEASURED: downloaded GitHub application revision `8a5fe8d` into an empty temporary folder with an authorized account. `npm start` launched it without installing dependencies; its health response, all 84 allowlisted assets and bundled catalog loaded. Only the scratch copy's port was changed to 4187 to avoid stopping the user's running app. This verifies the startup path with an isolated port, not an additional unmodified-port run. macOS, Node 24.3.0, npm 11.11.0. The full check in that downloaded copy also passed 231 tests and 52 deliberate defects. No setup, login, model or YouTube API request was made. Anonymous download remains unavailable while the repository is private.

## MiniMax M Plan connection — 2026-11-07

MEASURED: `npm run check` passes **231 deterministic tests and 52 deliberate-defect checks**, plus syntax, formatting, import/layer and source/asset integrity checks. New fixtures cover strict subscription credentials, acknowledgement, fixed destination/model, memory-only key handling, exact-quote evidence, rejected output, preserved selection, concurrency and no fallback. The full UI → same-origin HTTP → manager → MiniMax-adapter path runs with an injected response, never a paid service.

MEASURED: isolated browser setup/save/confirmed-test succeeded while Codex remained selected. The real restarted local server still detected both Codex and Claude subscriptions, with Codex selected; no login/logout or model calls were made during this change. Desktop Arabic, 390-pixel phone and 768-pixel tablet layouts were inspected, with no dialog horizontal overflow or browser warning/error logs in these checks. Session counters reset on server restart; earlier real Codex/Claude test evidence remains in the earlier dated records below.

LIMIT: no real MiniMax subscription key was supplied or consumed. Actual MiniMax account/model compatibility must be verified using **Test with one sample** after entering an eligible M Plan key in the app. The key-prefix gate cannot independently verify provider billing; MiniMax's possible use of existing credit packs is disclosed before saving and testing. This is not security certification or a guarantee of quota-only billing.

## Earlier verification records

The dated results below describe the revisions tested at the time; their smaller counts are historical, not the current test total.

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
