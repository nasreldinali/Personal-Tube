# Community collection and recommendation pipeline

Historical implementation record: version-specific descriptions and counts below refer to that work. For current behavior, use the [user guide](USER_GUIDE.md), [analysis connections](ANALYSIS_PROVIDERS.md) and [latest verification](VERIFICATION.md).

Status: implementation. Owner authorized continuing the community feature on 2026-11-03. No history rewrite or deletion is authorized.

## Measured baseline

MEASURED: server/catalog-repository.js reads only videos/taxonomy; public/domain/community.js extracts links from user-imported files without stance classification; public/services/recommendations.js searches YouTube rather than community comments. All supplied original files survive locally with matching original SHA-256 values.

## Delivery and acceptance

1. Restore original mentions, related data and embeddings to a clearly identified local source directory, keeping exact bytes and source manifests. Build a minimized, versioned evidence index from original labels, preserve original catalog score/order, and expose actual supporting comments and co-recommendations. Do not retrain or replace source labels.
2. Add real bounded collection from Hacker News and Stack Exchange; Reddit requires approved OAuth access and an explicit token. Distinguish live community comments from imported archive extracts. No claim that an archive host is itself a community. Fixed outbound hosts only, no arbitrary URL proxy.
3. Separate collection from classification. Raw mentions are pending, not recommendations. The owner selected Codex (local authenticated CLI) instead of Claude; no separate provider API key is needed. A model adapter will classify a bounded batch with quotes checked against actual text. Analysis is explicit, with token/request limits and transient credentials; no live paid call during development. Upstream classifications work without a model key.
4. Rank classified recommendations using distinct recommendation months plus 0.5 times distinct strong-recommendation months. Preserve source evidence, unique commenters and dates; show limited-sample status and separate newest/shared/pending views. Likes alone are not sentiment.
5. English/Arabic interface, review evidence, save/play videos, errors and source requirements. Results are session-only unless deliberately saved; no raw comments/tokens in browser backups.
6. RED-first deterministic tests for extraction, deduplication, scoring, model-output refusal, outbound bounds and request origin. Fresh security reviewer and defect plants. Browser checks plus real public-source smoke checks; paid API and restricted Reddit access remain unverified without credentials.

## Boundaries and decisions

INFERRED: retain full raw source originals locally (ignored), ship a redacted evidence index and unchanged related graph for portable runtime. No public exposure of original comment authors or accidental email addresses. Original bytes remain recoverable and hash-verifiable. Existing import remains as archive input, not a substitute for live collection.

Use the existing local Node server and built-in libraries; no new dependencies. New modules group evidence/ranking rules, source adapters, model adapter, bounded HTTP transport, repository and UI by responsibility. No existing function is moved in this feature.

Security target remains applicable ASVS L1. New trust boundaries: public community API responses, imported comments, untrusted model output, and same-origin POST requests. No model tools or execution, no fetched text used as instructions. Requests are bounded and fail closed; tokens are never logged, persisted or exported.
