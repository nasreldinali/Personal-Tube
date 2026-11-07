# Clean-download verification

Date: 2026-11-07. Tested application revision: `893a241`.

This is a historical check of the revision above, not the latest main. See [current verification](VERIFICATION.md) and the [provider guide](ANALYSIS_PROVIDERS.md) for the newer connections, including MiniMax.

## Measured results

| Check | Result |
|---|---|
| Download from GitHub into an empty folder | Passed using an account with repository access. No files were copied from the development checkout. |
| Anonymous download | Not available: GitHub reported the repository as private and returned 404 to an unauthenticated visitor. Visibility remains the owner's decision. |
| README startup | `npm start` served the downloaded application at `http://127.0.0.1:4173`, without `npm install`, a build step or a database. Tested on macOS with Node 24.3.0 and npm 11.11.0. |
| Full project check in downloaded folder | `npm run check` passed all 207 tests and detected all 37 deliberate defects. |
| Included library without an API key | Loaded 18 initial cards from the bundled collection. Language and appearance controls worked. |
| First-use help without installed analysis tools | Both tools were reported as missing, and installation help opened. YouTube settings returned to setup; refreshing after dismissal did not reopen setup. |
| Supported CLI availability | The documented Codex 0.155.1 and Claude Code 2.1.281 versions were available in the npm registry; installed versions and documented login arguments were checked. |
| Existing subscription connections | Both providers were recognized by the downloaded application's normal process adapter. No account identifiers or credentials were recorded. |
| Real analysis through each provider | One synthetic comment per provider returned HTTP 200 with validated recommendation output. The setup screen showed one completion and zero failures for each provider. No YouTube key was used. |
| Browser application warnings/errors | None observed in the tested library/setup flows. |

The ordinary README startup used the unmodified downloaded entry point. The first-use missing-tool check used a separate loopback test address and an empty tool-discovery path, while serving the downloaded application modules and assets. This isolates browser preferences and tool availability; it is not a new operating-system installation.

## What remains unverified

- A new user's first interactive browser sign-in. Existing credentials were not deleted or replaced. Synthetic tests cover signed-out, pending, failed and successful login transitions; those tests do not prove a real first login on another computer.
- Anonymous access while the repository is private. An invited collaborator can download it; public visitors cannot.
- Windows and Linux runtime behavior, installation of Node on a clean operating system, and a new user's YouTube key configuration. The successful macOS run is not evidence for these environments.

Follow [the account setup guide](ANALYSIS_SETUP.md) to install a supported tool, complete its official login, check the connection, and request one analysis. **Connected** alone confirms recognized credentials; a completed analysis confirms that a request worked in that server session. Provider allowances and network access can change later.
