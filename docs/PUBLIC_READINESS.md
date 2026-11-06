# Repository presentation and release preparation

Plan recorded 2026-11-06 before edits.

- Rewrite README as a short product entry: purpose, actual screenshots, credit to Andrej Karpathy and HackerTube, added capabilities, three-step local setup, per-feature requirements, ownership of API/model usage, honest limits, contribution and license links. Preserve detailed operational guidance in a user guide.
- Select MIT for original application code and documentation, as requested; preserve the distinct upstream data, font and DEEDA brand conditions in NOTICE. Do not claim the original HackerTube server is included or relicense third-party material.
- Add public-safe screenshots from an isolated browser profile using bundled public catalog data, with no private channel lists, credentials or account details.
- Add bounded, read-only GitHub Actions checks with pinned official actions, contribution templates and a small set of concrete beginner issues. Update GitHub description and relevant topics. Do not publish promotional posts.
- Inspect tracked files, reachable Git history and GitHub metadata/artifacts for publication concerns without writing discovered private values into public documentation. Keep detailed findings under ignored .local. Do not rewrite history, change visibility or expose the local server.
- Verify documentation links, existing quality gates, a fresh checkout startup and the new workflow. No new runtime dependencies or product behavior changes.

Public visibility is a separate owner decision after private history/licensing findings are reviewed. Preparation is not a certification that all sensitive data has been found.

## Measured preparation

- README.md and README.ar.md provide linked entry points with screenshots, source credit, practical additions, local setup, per-feature requirements and licensing boundaries. docs/USER_GUIDE.md retains detailed instructions and states that maintainer-only ignored originals are not shipped.
- LICENSE covers original application code/documentation under MIT. NOTICE.md preserves data/font terms and excludes general DEEDA brand reuse; package.json stays private to prevent accidental npm publication. GitHub visibility is independent of that flag.
- .github/workflows/check.yml pins official actions to reviewed commit hashes, runs Node.js 22/24 with contents:read, disables persisted checkout credentials, uses a ten-minute limit and does not reference secrets or privileged pull-request triggers. A regression and two deliberate-defect checks enforce these boundaries.
- Local full gate: 176 deterministic tests and 33 detected deliberate defects. Relative documentation links resolve. Both screenshots were visually reviewed from an isolated local origin using the bundled public catalog; no personal channels, API key or provider login was used. Browser warning/error logs were empty.
- Independent read-only review found no blocker for keeping this preparation private; a count correction and maintainer-only archive clarification were incorporated. This does not establish ownership of upstream material or certify security.
- GitHub About/topics and three scoped beginner issues were added: Arabic user guide, exact duration-boundary tests and a keyboard-use guide. No promotional message was posted and no public visibility change was made.
- Reachable history was scanned for common credential patterns and local-path/identity exposure. Detailed results stay in ignored local records. Historical metadata/removed records need a separate owner decision before public visibility; current-tree cleanup cannot erase prior commits. No history was rewritten.

Applicable release delta: CICD-SEC-2/5/6 and SSDF PS/PW for least-privilege checks, action pinning and synthetic test inputs; A03 supply-chain and P10 screenshot/data minimization. Runtime authentication, API/model budgets, storage schemas and application behavior are unchanged. No public-server deployment, payment, container or native-app scope was added. Existing security applicability remains in force; ASVS L1 remains a review target, not certification.
