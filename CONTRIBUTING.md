# Contributing

PersonalTube is a local, dependency-free Node.js application. Use Node.js 22 or 24 (declared minimum: 20) and run `npm run open` to launch it.

## Development workflow

1. Describe the behavior and acceptance criteria before editing.
2. For behavioral changes, reproduce the failure with a focused test before fixing it. For layout changes, record the failing browser geometry and verify the corrected view.
3. Keep business rules in `public/domain`, browser/network access in adapters, and rendering in `public/ui`. Avoid new dependencies unless necessary and approved.
4. Run `npm run check` and `git diff --check` before committing. Check all four interface languages, light/dark/system themes and relevant narrow/wide layouts for UI changes.
5. Review the staged diff for secrets, personal data, generated files and unintended scope. Keep commits focused.

For frontend refactors, characterize existing behavior before moving code, prepare dependency boundaries separately, and keep one responsibility per move. Preserve the stylesheet import order and explicit server asset routes. See [frontend maintenance contract](docs/FRONTEND_CLEANUP.md).

Never commit API keys, browser backups, environment files, screenshots with personal content or raw local logs. `.local/` is ignored and can hold private development evidence. Checks create `.local/reports/defect-plants.json` automatically. Test credentials are synthetic.

Retained source data and brand assets are verified against `data/integrity.json`. Do not silently change their content or hashes. Preserve upstream attribution and font licenses. See [NOTICE](NOTICE.md) and [architecture](docs/ARCHITECTURE.md).

## Find a first contribution

Look for [good first issues](https://github.com/nasreldinali/Personal-Tube/labels/good%20first%20issue). Comment on the issue before a larger change so the scope is clear. Small documentation corrections can go straight to a pull request. Use the bug/feature templates; private security findings belong in the reporting path in SECURITY.md, not public issues.

Fork the repository, create a focused branch, and describe the user-visible problem and validation in your pull request. The Checks workflow runs `npm run check` on Node.js 22 and 24 with public/synthetic fixtures only. No real YouTube key, provider login or model call is needed. Do not add credentials to make a test pass, and do not run an untrusted contribution with your personal credentials or elevated permissions.

Keep the English, Arabic, German and Spanish README entry points consistent when changing setup or feature requirements. Use public catalog content or synthetic data in screenshots. Original contributions are provided under this repository's Apache License 2.0; third-party data, fonts and branding keep the terms listed in NOTICE.md. Preserve LICENSE, NOTICE and applicable third-party notices in distributions; identify modified files as required by Apache 2.0.
