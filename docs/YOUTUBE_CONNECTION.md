# YouTube connection fix

2026-11-03. Scope: native browser transport, key validation and accurate connection errors. No credential, proxy, endpoint or browser-protection changes.

## Plan and acceptance

Reproduce the failure; identify the failing transport boundary; add a failing regression before the fix; preserve header-only credential transport; run the full checks and independent security review; verify channel addition and latest-video retrieval in the owner's Chrome browser with the same saved key.

## Confirmed cause and correction

MEASURED: `public/data/youtube.js:7` previously stored native `fetch` directly, then called it as `this.fetcher(...)`. This passes the client object as receiver. A browser-like receiver guard reproduced the immediate safe `network` error. The default adapter now wraps the native call, preserving the normal browser receiver while retaining injected test adapters. The regression failed before and passes after the correction.

MEASURED: Chrome resolved and added the requested channel with the unchanged saved key after this fix. The My channels view then showed one current video with title, duration and publication date. No Google configuration or credential change was needed. No real credential was extracted, logged or put in a URL. User-specific channel metadata remains only in browser storage, not in repository fixtures.

## Diagnostic improvements

MEASURED: malformed pasted keys are rejected before storage or network calls and cannot replace an existing saved key. Request and response-body timeouts are distinguished from network or malformed-response errors. Fixed messages expose no credential contents. A synthetic hidden-direction-mark input displayed the correct bilingual message in the settings UI.

The earlier malformed-key hypothesis did not explain the owner's failure: their unchanged key worked after the receiver correction.

## Verification and security scope

MEASURED: `npm run check` passes 82 deterministic tests and detects nine deliberate defects. RED evidence is retained in ignored local reports. A fresh security review found no blocker, including the receiver and body-timeout changes.

MEASURED: a subsequent native Chrome check with the same saved key returned eight recommendations from 48 candidates for an Arabic topic, using declared Arabic audio language, at least 100,000 views and 1,000 likes, ordered by views. Public comment samples and source links were displayed; one result reported unavailable comments without removing the other results. These samples support manual review and do not establish automatic positive-sentiment classification. Loading lengths for the original catalog updated all 18 displayed video durations successfully. This follow-up changed verification documentation only; application code and the recorded automated-check result are unchanged.

Input validation (C3/CWE-20), secret handling (A04/A09/CWE-200), exception handling (A10), API authentication/configuration (API2/API8) and privacy P1/P2 apply. Existing local-app ASVS L1 scope and other reference mappings remain unchanged; no new model, hosting, dependency or credential permissions are introduced.
