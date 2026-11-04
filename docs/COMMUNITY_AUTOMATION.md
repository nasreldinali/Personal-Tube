# Beginner community discovery

Version 1. Plan recorded 2026-11-04.

## Scope and acceptance

Replace manual collect/analysis controls with one explicit topic-and-source search. Default to Hacker News with a 30-day window. Keep the ready-made original library available as a clearly labeled source without model use. Put date/site options and archive imports behind optional disclosure controls. Show collection/analysis progress, understandable empty/error states, and a stop-after-current-request control. Only evidence-backed recommendations are displayed by the new flow.

Automatic discovery selects a sample that fits at most three existing classifier calls, each at most 24 comment/video pairs and 40,000 serialized characters. At most 72 pairs are selected; long or multi-link comments can reduce the count. Every selected comment is analyzed automatically unless stopped or a provider fails. Selection limits and scanned/found/analyzed counts are shown accurately; excluded comments are not described as pending work requiring clicks. Each process keeps its existing two-minute deadline. No automatic retries, background schedules or provider/credential changes.

Write deterministic failing tests for automatic completion, sample/batch limits, cancellation, no-progress refusal, provider failure, and full controller/service integration. Keep existing manual version-1 API actions compatible. Run the full checks, security defect plants, an independent review, and browser verification before delivery.

## Boundaries and contract

Add version-1 `/api/community` action `discover`, using the same validated collection input and same-origin route. It returns a capped, server-held automatic session with positive-only results, `foundComments`, `totalComments`, `pending`, `analyzed` and `analysisLimit: 3`. Each subsequent existing `analyze` request completes a bounded slice; server-side step limits prevent callers from extending an automatic job. Browser orchestration stops on cancellation, stale page state, failure or non-decreasing pending counts. Failed model work never becomes a positive recommendation. Automatic sessions cannot return raw unclassified shares through a different sort.

The current public-comment privacy, shared single-classifier guard, source cooldown, temporary sessions, exact quote validation and ASVS L1 scope remain applicable. This delta specifically checks API4/LLM10/CWE-770 bounded automatic work, A10 fail-closed errors, Privacy P5 visible account usage, and stale/cancelled-result handling. Browser text rendering and source credentials keep the existing boundaries. No database, dependency, hosted service, public release, or repository-history change is involved.

This is a requested behavior/UI change, not a code-movement cleanup. Automatic orchestration and sample budgeting have separate new service/domain modules; existing source and evidence files are retained.

## Delivery verification — 2026-11-04

The new controller action and UI contract were first exercised as failing tests; local evidence is in ignored `.local/community-auto-red.txt` and `.local/community-ui-red.txt`. The completed suite passes 104 tests and detects 13 deliberate defects. An independent security review found no blocking issue after 22 focused tests and additional budget, cancellation, failure and positive-only-result probes.

A live Hacker News search completed from one submit: 257 comments scanned, 123 containing video links, 66 selected and analyzed, yielding 14 recommended videos. Progress advanced through 23, 44 and 66 analyzed comments without manual batch clicks. The interface disclosed the bounded sample. The original library also returned 275 matching recommended videos with evidence from 39,834 original comments, without a new model call.

Arabic/dark and English/light were visually inspected. Browser viewport checks at 390, 820 and 1200 pixels showed no horizontal overflow; these are desktop simulations, not physical-device tests. No browser errors or warnings were captured in this flow. Cancellation and provider failures were covered deterministically, not by interrupting the live model run.
