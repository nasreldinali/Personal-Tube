# Release readiness — 7 November 2026

Scope: local personal use, macOS, Node 24.3.0 and npm 11.11.0. This is a measured release review, not a security certification or a promise that every machine/provider will behave identically.

## A new download

- Cloned GitHub into a newly created folder, without copying development files, browser data, credentials or local configuration. There is no install/build/database step.
- Ran the README's `npm start`. The existing personal server occupied port 4173, so it correctly refused with the documented port-conflict message. The existing server was left running.
- For the isolated live check, copied only the entry point and changed its loopback port to 4187. All downloaded modules/assets were unchanged. The application served its health response, all 6,454 catalog entries and the 4,654-video Discover subset; the browser initially displayed 18 cards and zero personal channels. This is not a claim that two default-port servers can run simultaneously.
- The downloaded project's full check passed. The release includes 287 deterministic tests and 81 deliberate-defect checks; CI also checks Node 22 and 24.
- Browser warning/error capture was empty in the tested Discover/Connections flow. Empty tool discovery correctly reported both analysis CLIs as missing, without changing any account files.

## Codex and Claude

The downloaded server's normal setup endpoint selected and tested each supported subscription adapter once. Both returned validated classification output for one synthetic comment: one completed call, zero failures per provider. Both remained connected afterwards; other providers recorded zero attempts. The original server's selected account was not changed. The Connections screen showed successful analysis for each account, independently of connection detection.

The setup guide now uses the actual path **Connections → Subscription → 2 · Choose a service**, followed by installation/login and **Test with one sample**. CLI versions are intentionally pinned to reviewed policies. A website subscription alone does not install the CLI, and unsupported versions are refused.

**Not tested:** first interactive sign-in with a new account or on a clean operating-system user. Existing credentials were neither removed nor replaced. Deterministic tests cover signed-out, pending, failed, API-only and successful states; they do not replace a first-time provider login. These live checks used existing subscriptions, not paid APIs. See [setup](ANALYSIS_SETUP.md) and [provider limits](ANALYSIS_PROVIDERS.md).

## Security and publication review

- Reviewed HTTP boundaries, origin/Host checks, explicit asset allowlists, subprocess argument/environment restrictions, model-output validation, fixed external endpoints, redirect/body/time limits, browser rendering and storage/backup boundaries.
- Exercised the live isolated server: five private/traversal paths returned 404; foreign Host and cross-origin setup requests returned 403; oversized input returned 413; unknown setup versions returned 400. Browser protection headers were present.
- Scanned every reachable Git file version for targeted personal-email/path and credential patterns, including Google/provider tokens, JWTs and private keys. Reviewed author metadata, tracked filenames and the five README screenshots. No matching private credentials, maintainer personal email/local path, browser backups or account exports were detected. GitHub's public noreply identity, public video/source attribution, license authors and project branding are intentionally retained.
- Reviewed remote branches/tags, pull requests, issue bodies/comments, release assets, Actions artifacts and secret/variable names before publication. At the start there was one branch, no tags/releases, no pull requests/comments, no uploaded Actions artifacts and no Actions secrets/variables. Three existing contributor issues contained no private data.
- CI uses pinned official actions, read-only permissions, no persisted checkout credentials and no repository secrets. The package has no npm runtime/test dependencies. Apache 2.0 and the legacy/data/font/brand notices remain intact.

No release-blocking issue was identified in this scope. Pattern scans can miss unknown secrets, and this was not an independent penetration test, exhaustive provider/OS audit, or review of GitHub's inaccessible caches. Public-source comments and author attribution are bundled data, not a private user export. Keep Node and the official CLIs maintained and use the documented local-only deployment. Do not expose the running server to the internet.

Publication and CI results are available in the repository's [Actions](https://github.com/nasreldinali/Personal-Tube/actions) and [releases](https://github.com/nasreldinali/Personal-Tube/releases). Relevant topics and contributor issues improve discoverability; they do not guarantee traffic or stars.
