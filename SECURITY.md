# Security

## Supported use

PersonalTube is intended for one person's local browser and a server bound to `127.0.0.1:4173`. It has no authentication or shared-account model. Do not expose this server to a public network without a separate security design.

API keys are stored in browser session storage by default, optionally local storage with explicit consent. Neither is encrypted by the app. Keys are excluded from exported backups and sent directly to Google. Restrict keys to the YouTube API and the local website origin. The application has no analytics.

## Reporting

Report a suspected vulnerability privately to the repository owner through an existing trusted contact channel. Do not include live credentials, personal exports or exploit details in public issues. If a key is exposed, revoke or rotate it at its provider; deleting a file is insufficient.

## Verification and limitations

`npm run check` includes security-focused validation and six deliberately introduced defects in isolated scratch copies. The review target is applicable OWASP ASVS Level 1 controls for this local architecture, not formal certification. No guarantee of complete vulnerability or secret detection is made. Live-key API behavior and Premium playback require separate manual verification.

Before changing repository visibility, review all reachable history, author metadata, branches, tags, attachments and artifacts, plus data and brand licensing. Removing a file in a later commit does not remove earlier copies. History rewrites require explicit owner approval and coordination with existing clones.

See [verification](docs/VERIFICATION.md) and [architecture](docs/ARCHITECTURE.md) for the measured scope and trust boundaries.
