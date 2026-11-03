# Contributing

PersonalTube is a local, dependency-free Node.js application. Use Node.js 20 or newer and run `npm run open` to launch it.

## Development workflow

1. Describe the behavior and acceptance criteria before editing.
2. For behavioral changes, reproduce the failure with a focused test before fixing it. For layout changes, record the failing browser geometry and verify the corrected view.
3. Keep business rules in `public/domain`, browser/network access in adapters, and rendering in `public/ui`. Avoid new dependencies unless necessary and approved.
4. Run `npm run check` and `git diff --check` before committing. Check both languages, both themes and relevant narrow/wide layouts for UI changes.
5. Review the staged diff for secrets, personal data, generated files and unintended scope. Keep commits focused.

Never commit API keys, browser backups, environment files, screenshots with personal content or raw local logs. `.local/` is ignored and can hold private development evidence. Checks create `.local/reports/defect-plants.json` automatically. Test credentials are synthetic.

Retained source data and brand assets are verified against `data/integrity.json`. Do not silently change their content or hashes. Preserve upstream attribution and font licenses. See [NOTICE](NOTICE.md) and [architecture](docs/ARCHITECTURE.md).
