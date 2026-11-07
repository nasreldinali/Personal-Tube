# Automatic YouTube comment analysis

Request version 2; classification response version 1. Updated 2026-11-07. Original implementation evidence below is historical.

## Scope and acceptance

Connect the existing restricted Codex process adapter to the YouTube recommendation search. Search and public metrics/audio filtering stay in the browser; the YouTube key never leaves its existing Google request path. Send only the bounded, redacted search topic, public video titles/descriptions and comments to the local analysis route and the configured Codex provider.

1. Write failing deterministic tests for input bounds, exact quote validation, negative/neutral exclusion, full search-to-analysis flow and same-origin route refusal.
2. Analyze up to 20 comments for each of at most eight candidate videos in one bounded invocation. Exclude creator comments and duplicate authors/text where available. Reuse the tool-disabled, ephemeral process adapter with a two-minute deadline, shared single-process guard and explicit YouTube classification instructions.
3. A video qualifies only with at least two positive comments and more positive than critical comments. Popularity alone never qualifies it. Preserve the selected popularity ordering among qualifying videos; show positive/critical/analyzed counts and exact supporting excerpts with original links. This is evidence from a limited sample, not proof of authenticity or whole-audience sentiment.
4. Remove the manual-review switch; analysis is part of each explicit search. Keep old version-1 settings/backups readable. Display progress, empty outcomes and safe failures in English and Arabic. Never show unclassified results on failure.
5. Run the full check, security defect plants, an independent security review and native browser verification. Record measured results before delivery.

## Trust boundaries and contract

POST `/api/youtube-analysis`, request version 2, same-origin JSON and loopback Host only. Input contains `version: 2`, nonblank `topic` (maximum 200 characters) and up to eight `videos`, each with `id`, `title` (maximum 500), `description` (maximum 1000, may be empty), `comments`; each comment contains `id`, `text`, `likes`. Unknown fields/versions, duplicate IDs and oversized bodies refuse before model execution. No URLs, credentials, paths, executables or model names are accepted. Legacy version-1 requests are rejected so a stale client cannot silently omit topic checks; refresh the page after updating/restarting the server. No stored settings or backups use this request format, so no data migration is needed. Response contains version 1 and the validated classification JSON; the browser independently binds every label and quote to its supplied comment before filtering.

Application state is request-local and is not written to disk or backups. The existing ephemeral adapter has a transient schema file and deletes it after execution; provider-side retention follows the existing account. The route has a 600,000-byte body cap and a shared classifier guard; no retries or background scheduling. A 15-second cooldown limits repeated completed runs. Existing ASVS L1 and community security mappings apply; the new browser-to-model boundary specifically affects API4/API10, LLM01/02/05/09/10, CWE-20/352/770 and Privacy P2/P5/P10.

The change is a behavior addition, not a code-movement cleanup. No dependency, credential, hosting or repository-visibility change is needed. Codex structured output and ephemeral execution follow the [official non-interactive documentation](https://learn.chatgpt.com/docs/non-interactive-mode); exact output remains validated locally.

## Topic and evidence policy (2026-11-07)

Each comment is judged against two conditions together: the video's public title/description must directly fit the requested subject and intent/level, and the comment must contain a concrete subject-related learning benefit or a specific viewing recommendation with a concrete subject-related reason. The exact displayed excerpt must carry that evidence itself, naming a concept or explaining a specific mechanism/example. Calling it a foundation or suitable for beginners alone is insufficient. Generic praise, thanks, creator flattery, production compliments and incidental topic mentions are neutral. Adjacent subjects do not qualify merely because they share keywords. Criticism is retained separately.

This uses one existing bounded model invocation, not an additional paid service or second analysis call. All supported adapters receive the same topic-aware policy. The requested topic and public metadata remain untrusted data; model tools remain disabled and exact quote/output validation is unchanged. The metadata description adds no Google request because it is already included in the existing video snippet response. Popularity ordering and the eight-video/twenty-comment caps remain unchanged.

Relevance and specificity are semantic model judgments, not a deterministic truth check. Titles/descriptions can misrepresent a video; no transcript or full-video inspection is performed. A small comment sample does not establish authenticity or whole-audience consensus. Strict rules may remove useful adjacent material or return nothing. [Current measured verification](VERIFICATION.md).

## Historical verification

MEASURED: the search-path regression failed before service integration because the analysis adapter was never called (`.local/youtube-analysis-flow-red.txt`, ignored). The implementation passes 92 deterministic tests; eleven deliberate defects are detected, including accepting a single positive comment and accepting unknown analysis input. An independent review found no blocking issue and separately exercised maximum payload, extra fields, creator comments and duplicate author/text boundaries. Model results still cannot prove comment authenticity.

MEASURED: native Chrome with the saved key analyzed 134 public comments across eight candidate videos from 48 search candidates. Seven videos met the evidence rule; one had unavailable comments and was excluded. Exact positive excerpts, original links and critical counts were visible. Review caught a commercial clause selected as evidence in the first run; the prompt was tightened to require self-contained video-related evidence. A second live run showed video-related quotes in the inspected cards. A separate 12-comment synthetic live evaluation correctly separated endorsements, generic praise, commercial promotion, questions, sarcasm and injected instructions, and selected only the learning-benefit clause of a mixed comment. This evaluation is an observed model result, not part of the deterministic suite or an accuracy guarantee.

MEASURED: Chrome console inspection showed one expected YouTube commentThreads HTTP 403 for the unavailable-comment video, handled by exclusion and the visible count; no application exception was observed in that checked flow. No real API key was extracted or copied; only fictional comments and result metadata were saved in ignored local evidence. English result cards were visually inspected and all Arabic/English translation keys pass the UI contract check.

## Provider extension (1.5.0)

The same evidence contract supports explicitly selected Codex or Claude subscriptions, MiniMax M Plan, OpenAI/Anthropic/OpenRouter APIs, and local Ollama/LM Studio models through Setup & connections. See [connection setup and billing](ANALYSIS_PROVIDERS.md). Shared provider controls and usage accounting are described in [architecture](ARCHITECTURE.md). Existing sample limits, exact quotes, positive thresholds and same-origin protection are unchanged. No analysis provider receives the YouTube API key.
