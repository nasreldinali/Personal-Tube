# First-use clarity and language expansion

Historical delivery record: MIT references below describe the license at that time. The owner subsequently adopted Apache License 2.0 on 2026-11-07; see the current [LICENSE](../LICENSE) and [attribution boundaries](../NOTICE.md).

## Scope and acceptance

- Explain that YouTube Data API access has a free daily quota, not unlimited usage or a guarantee that every workload fits. Keep optional analysis-account costs separate.
- Make first-use setup actionable: install a supported CLI, complete its official login, return and check the connection, then request analysis. A connected account is not proof that a model request has succeeded.
- Exercise missing tools, unsupported versions, signed-out accounts, API-only authentication, pending login, failure and successful status transitions with synthetic fixtures. Do not log out an existing user or copy credentials.
- Add German and Spanish interface catalogs, validate preference persistence, placeholders, direction and number/date formatting. Preserve original titles, quotes and imported taxonomy labels unless translations exist.
- Keep the current MIT license while explaining the requested non-commercial alternative; changing license terms needs a concrete decision. Defer the broader public-download audit as requested.

## Validation plan

Write failing behavior checks before implementation; retain local RED evidence. Run the project check command, inspect the browser with fresh synthetic preferences, and record the limits of simulated authentication. No new dependencies, shared subscription service, account secrets or automatic model requests.

## Findings before changes

MEASURED: `server/provider-process.js` uses fixed official CLI login commands and returns connection flags, not credentials. It accepts only reviewed CLI versions. Login output is discarded, so manual terminal instructions are necessary when a browser cannot open or a code must be pasted.

MEASURED: `public/ui/setup-panel.js` polls login status for about three minutes and offers installation help, but its connected wording implies readiness before any real analysis. The help does not present a clear first-use sequence.

INFERRED: This can save recurring channel-monitoring and comment-reading time. It is not a measured productivity study. Module boundaries, tests and the contribution guide support learning; dense UI markup and first-use friction remain improvement areas.

## Results — 2026-11-06

- MEASURED: `public/locales/extra.js` supplies German and Spanish for all 423 interface message keys. `test/preferences.test.js` checks key/placeholder parity, direction and locale-aware number/date formatting; `test/browser-store.test.js` verifies persistence and backup transfer. Catalog taxonomy remains English/Arabic and source content retains its language.
- MEASURED: `test/provider-process.test.js`, `test/provider-manager.test.js` and `test/setup-interaction.test.js` cover first-use states for both providers. `public/ui/setup-panel.js` now separates a recognized login from a completed analysis in the current server session. No authentication command, credential handling or billing mode was changed.
- MEASURED: `npm run check` passed 183 tests and detected all 35 deliberate defects, including unsupported-language acceptance and false analysis-success status. Syntax, formatting, import graph, asset integrity and diff whitespace checks passed. Local RED evidence records the missing translations, premature readiness message and initially unserved locale asset.
- MEASURED: Browser checks verified German setup, Spanish controls after reload, Arabic cost explanations and no warning/error console entries. At 390px viewport width, document width/scroll width were both 390px; setup dialog width/scroll width were both 360px. Existing Arabic/dark preferences and normal viewport were restored after testing.
- LIMIT: Actual new-account browser authentication on a clean computer was not completed. Tests use synthetic states; the existing local account logins were only inspected, not removed or replaced. The first-use guide makes this distinction explicit. No model request or YouTube-key request was made for this review.
- INFERRED: Moderate personal channel-following can fit the default free quota; sufficiency depends on request volume. The README example is illustrative arithmetic, not measured consumption or a guarantee.

Official references checked: [Google quota costs](https://developers.google.com/youtube/data/determine_quota_cost), [Codex authentication](https://learn.chatgpt.com/docs/auth), [Claude Code authentication](https://code.claude.com/docs/en/authentication), and [Claude Code integration conditions](https://code.claude.com/docs/en/legal-and-compliance). MIT remains unchanged; a non-commercial license would require a separate rights and terms decision.
