# Security

## Supported use

PersonalTube is intended for one person's local browser and a server bound to `127.0.0.1:4173`. It has no authentication or shared-account model. Do not expose this server to a public network without a separate security design.

YouTube API keys are stored in browser session storage by default, optionally local storage with explicit consent. Neither is encrypted by the app. Keys are excluded from exported backups and sent directly to Google. Restrict keys to the YouTube API and the local website origin. The application has no analytics.

## Reporting

Report a suspected vulnerability privately to the repository owner through an existing trusted contact channel. Do not include live credentials, personal exports or exploit details in public issues. If a key is exposed, revoke or rotate it at its provider; deleting a file is insufficient.

## Verification and limitations

`npm run check` includes security-focused validation and 46 deliberately introduced defects in isolated scratch copies. The review target is applicable OWASP ASVS Level 1 controls for this local architecture, not formal certification. No guarantee of complete vulnerability or secret detection is made. Live-key API behavior and Premium playback require separate manual verification.

Before changing repository visibility, review all reachable history, author metadata, branches, tags, attachments and artifacts, plus data and brand licensing. Removing a file in a later commit does not remove earlier copies. History rewrites require explicit owner approval and coordination with existing clones.

See [verification](docs/VERIFICATION.md) and [architecture](docs/ARCHITECTURE.md) for the measured scope and trust boundaries.

Community collection and local Codex/Claude classification add same-origin POST and subprocess boundaries. See [the community security review](docs/COMMUNITY_SECURITY.md). Reddit tokens stay in page memory; model analysis uses the explicitly selected subscription, cloud API or local model and never receives those tokens.

Automatic YouTube comment analysis uses the same restricted classifier with an explicit 160-comment maximum, exact quote checks and no unclassified fallback. The browser sends redacted public titles/comments only, never its YouTube key or author identifiers. See [analysis boundaries](docs/YOUTUBE_ANALYSIS.md).

Community discovery automatically orchestrates at most three bounded classifier attempts per selected sample. Server-enforced attempt budgets, positive-only automatic sessions and browser cancellation/progress validation are documented in [the automation record](docs/COMMUNITY_AUTOMATION.md).

Setup adds a guarded same-origin control route for fixed provider status/login/selection actions. No client-supplied executable, arguments, environment or destination URL is accepted. Codex/Claude subscription actions use fixed commands; MiniMax uses the separate fixed HTTPS subscription adapter described below. The separate API/local connection path accepts validated model IDs and API keys only for fixed service endpoints; see [provider boundaries](docs/ANALYSIS_PROVIDERS.md). Login output is discarded and credentials remain owned by official CLIs. Codex execution is restricted to ChatGPT authentication and shares its explicit credential store with status/login. Claude execution disables tools, MCP, hooks, skills and customizations, limits turns and output, and validates exact evidence before reporting success. The four added defect plants exercise subscription refusal, output validation, hidden-ID budget and disabled Claude tools. Independent review findings on credential-store consistency and usage accounting were corrected and rechecked; see [delivery record](docs/CHANNEL_ENHANCEMENTS.md).

The YouTube usage meter stores only daily aggregate counts and an incomplete-day marker. It never stores request URLs, keys or content, is excluded from portable backups, and is removed with personal data. Counter failure does not grant or change API access; it suppresses unreliable balances. Channel additions recheck pending channel and credential changes before saving. See [usage/loading review](docs/API_USAGE_PLAN.md).

Live community recommendations require multiple distinct known endorsing accounts, positive-over-critical evidence and explicit browser-side popularity/language checks. Failed or cancelled verification never falls back to raw community mentions. Source cooldowns remain server-enforced; only bounded retry seconds reach the UI. Exact-quote validation and restrictions on classifier tools remain unchanged. See [community quality review](docs/COMMUNITY_QUALITY.md).

The contribution workflow runs untrusted pull-request code only on GitHub-hosted runners, with a read-only contents token, no persisted checkout credentials, no repository secrets, pinned official actions and a ten-minute job limit. It does not use pull_request_target or a self-hosted runner. Two deliberate-defect checks verify token and checkout restrictions. Action updates must retain those boundaries. This is not network isolation or a full supply-chain certification.

Cloud analysis keys live only in server memory, never browser persistence, backups, status responses or logs. Requests refuse redirects and enforce a two-minute deadline, a 1 MB response limit and an 8,192-token output cap. Cloud configuration requires explicit billing acknowledgement. Confirmed test/logout/forget actions serialize with active analysis and login. Local connectors use fixed loopback endpoints; the user controls whether the separate model server forwards requests. Synthetic tests and six new deliberate defects verify consent, secret exclusion, transport limits, logout confirmation and output evidence. Actual provider/account compatibility needs a user-initiated test.

Subscription sample tests use the same fixed, subscription-only classifier path as ordinary analysis. Confirmation, selected-provider identity and per-provider cooldown are enforced server-side; three additional defect plants cover test selection, cooldown and known Ollama cloud-tag refusal. Navigation among setup methods performs no provider mutation or analysis and clears an unsent key field.

MiniMax M Plan uses a separate memory-only subscription adapter with a fixed global destination and model. Only documented `sk-cp-` key syntax plus explicit subscription acknowledgement is accepted; this cannot independently certify provider billing. MiniMax may consume existing credit packs after included quota. No pay-as-you-go fallback is implemented. Saving and isolated sample tests preserve the selected provider and CLI credentials. Thinking blocks are discarded; only bounded final JSON with grounded quotes is accepted. Six additional deliberate defects cover key type, consent, selection preservation, endpoint pinning and evidence validation. See [MiniMax boundaries](docs/MINIMAX_SUBSCRIPTION.md).

Connection-center expansion keeps cloud destinations fixed. The generic local connector accepts only integer ports 1024–65535 on literal `127.0.0.1`, fixed `/v1/models` and `/v1/chat/completions` paths, no credentials or arbitrary URLs, and no redirects. Explicit model discovery is read-only, bounded to ten seconds/1 MB/500 records/100 returned IDs; model IDs are validated before UI use. Selection and analysis counters are unchanged. Six additional defect plants cover port confinement, list budgets, cloud-tag refusal, GET-only discovery, stale UI results and cloud endpoint pinning. This deliberately permits access to a user-selected local model server; it is not a public hosting capability.
