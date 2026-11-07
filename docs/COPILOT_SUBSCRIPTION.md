# Connect GitHub Copilot

[README](../README.md) · [All connections](ANALYSIS_PROVIDERS.md)

PersonalTube has an actual adapter for the official GitHub Copilot CLI, with browser login and a sample-analysis test. It does not wrap the Copilot website, reuse a browser session or require a separate model API key. This is an independent integration, not a GitHub endorsement.

## First-time setup

1. On the computer running PersonalTube, install the reviewed CLI: `npm install -g @github/copilot@1.0.107`. Use a Node version supported by GitHub's installer. The app does not install or upgrade tools automatically.
2. Restart PersonalTube if its terminal cannot find the newly installed command. Open **Connections → Subscription → GitHub Copilot** and press **Check connection again**.
3. Choose **Sign in with GitHub**. The official CLI opens GitHub in your browser and receives its local login callback. Complete the provider's authorization yourself. PersonalTube never asks for your GitHub password, token or device code.
4. Return to the app. Connection detection runs while the dialog remains open for up to three minutes. **Connected** verifies the login method; it does not establish model access or remaining allowance.
5. Press **Test with one sample** and confirm. One synthetic comment goes through the same analysis/evidence validation used by the app. Successful analysis is shown on the card. Tests are limited to one attempt per minute.
6. Choose **Use Copilot** when ready. This is the step that changes the active analysis service. Signing in and testing do not switch it. Codex and Claude credentials are never changed by this connector.

GitHub currently offers CLI access across Copilot plans; organization accounts can require an administrator to enable CLI access. Model availability and allowance still depend on your account. [Official authentication guidance](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli).

## Allowance and billing

This route uses **your Copilot allowance**, with no separate BYOK key or fallback to a paid model API. It does not use the project owner's account. GitHub billing settings may permit additional paid usage after included allowance; **disable paid overage in GitHub before using it if you want to stay within your plan**. PersonalTube cannot inspect or enforce your account's billing configuration. Failed attempts may consume allowance.

Each analysis has a two-minute deadline, no retry, no automatic continuation and a one-credit session budget requested from the CLI. GitHub's credit budget is a soft limit, not a guarantee against overage on an individual request. The app counters show attempted/completed calls and input counts, not your GitHub bill. Review the official CLI's `copilot help billing` and `copilot help limits`.

## Local account storage and troubleshooting

- The connector uses a dedicated `COPILOT_HOME` at `.local/copilot` under the directory where you start PersonalTube. Start it from the project folder as shown in the README. This folder is ignored by Git and is not served or included in app backups. Keep it private.
- The official CLI manages OAuth credentials, including its OS credential-store behavior. PersonalTube does not read or return tokens. The dedicated configuration directory is not a promise that GitHub's OS credential-store entries are isolated from other Copilot tools.
- Login in your browser or in a different Copilot profile may not connect this profile. Use the app's sign-in button. For account changes/sign-out, run the official CLI with this same `COPILOT_HOME` and follow GitHub's account controls. There is no automatic sign-out.
- Missing CLI: install the exact reviewed version and check again. An incompatible version is refused; do not remove the version guard to bypass this.
- Login failed: check your default browser, local callback availability, account entitlement and organization policy. Retry after the one-minute cooldown. The app never substitutes another credential source to obtain analysis access.
- Analysis failed: check allowance and access to the fixed `claude-haiku-4.5` model. Unavailable models, invalid JSON, fabricated quotes and truncated results fail closed. There is no model or paid-provider fallback.

## Implementation and verification boundary

The adapter speaks the reviewed CLI's JSON-RPC **protocol 3** over standard input/output. CLI **1.0.107** is pinned. It uses `connect`, `auth.getStatus`, `session.create`, `session.send` and session events. Only OAuth user authentication to GitHub is accepted; inherited tokens, API-key auth and `gh` fallback do not authorize analysis. The environment is allowlisted; no BYOK credentials/endpoints, shell startup options or telemetry variables are inherited.

The session uses a fresh temporary working directory, empty tool/MCP/provider lists, disabled configuration discovery, skills, hooks, custom instructions, memory, automatic continuation and session persistence. Server-initiated capability requests are denied. Protocol messages are limited to 1 MB and cumulative stdout/stderr to 4 MB; unexpected tool events or invalid output are refused. Public comments are untrusted text and only classifications supported by exact source quotes enter recommendations.

MEASURED: the official CLI binary passed version/protocol and signed-out status probes with network access blocked. Deterministic tests cover UI → same-origin route → manager → adapter → framed protocol, selection preservation, signed-out refusal, bounded output and evidence validation. No model API was charged and no existing subscription was logged out.

LIMIT: a real Copilot OAuth completion and signed-in model analysis have **not** been verified with a user's account here. Use the explicit test after connecting yours. This is not a promise that every account, operating system or future CLI version will work.

References: [CLI commands and login options](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference), [official programmatic usage](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference), [official SDK protocol implementation](https://github.com/github/copilot-sdk/tree/main/nodejs/src).
