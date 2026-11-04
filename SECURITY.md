# Security

## Supported use

PersonalTube is intended for one person's local browser and a server bound to `127.0.0.1:4173`. It has no authentication or shared-account model. Do not expose this server to a public network without a separate security design.

API keys are stored in browser session storage by default, optionally local storage with explicit consent. Neither is encrypted by the app. Keys are excluded from exported backups and sent directly to Google. Restrict keys to the YouTube API and the local website origin. The application has no analytics.

## Reporting

Report a suspected vulnerability privately to the repository owner through an existing trusted contact channel. Do not include live credentials, personal exports or exploit details in public issues. If a key is exposed, revoke or rotate it at its provider; deleting a file is insufficient.

## Verification and limitations

`npm run check` includes security-focused validation and 26 deliberately introduced defects in isolated scratch copies. The review target is applicable OWASP ASVS Level 1 controls for this local architecture, not formal certification. No guarantee of complete vulnerability or secret detection is made. Live-key API behavior and Premium playback require separate manual verification.

Before changing repository visibility, review all reachable history, author metadata, branches, tags, attachments and artifacts, plus data and brand licensing. Removing a file in a later commit does not remove earlier copies. History rewrites require explicit owner approval and coordination with existing clones.

See [verification](docs/VERIFICATION.md) and [architecture](docs/ARCHITECTURE.md) for the measured scope and trust boundaries.

Community collection and local Codex/Claude classification add same-origin POST and subprocess boundaries. See [the community security review](docs/COMMUNITY_SECURITY.md). Reddit tokens stay in page memory; model analysis uses the selected local subscription login and never receives those tokens.

Automatic YouTube comment analysis uses the same restricted classifier with an explicit 160-comment maximum, exact quote checks and no unclassified fallback. The browser sends redacted public titles/comments only, never its YouTube key or author identifiers. See [analysis boundaries](docs/YOUTUBE_ANALYSIS.md).

Community discovery automatically orchestrates at most three bounded classifier attempts per selected sample. Server-enforced attempt budgets, positive-only automatic sessions and browser cancellation/progress validation are documented in [the automation record](docs/COMMUNITY_AUTOMATION.md).

Setup adds a guarded same-origin control route for fixed provider status/login/selection actions. No client-supplied executable, arguments, environment, model or credential values are accepted. Login output is discarded and credentials remain owned by official CLIs. Codex execution is restricted to ChatGPT authentication and shares its explicit credential store with status/login. Claude execution disables tools, MCP, hooks, skills and customizations, limits turns and output, and validates exact evidence before reporting success. The four added defect plants exercise subscription refusal, output validation, hidden-ID budget and disabled Claude tools. Independent review findings on credential-store consistency and usage accounting were corrected and rechecked; see [delivery record](docs/CHANNEL_ENHANCEMENTS.md).

The YouTube usage meter stores only daily aggregate counts and an incomplete-day marker. It never stores request URLs, keys or content, is excluded from portable backups, and is removed with personal data. Counter failure does not grant or change API access; it suppresses unreliable balances. Channel additions recheck pending channel and credential changes before saving. See [usage/loading review](docs/API_USAGE_PLAN.md).
