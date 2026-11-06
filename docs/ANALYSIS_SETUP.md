# Connect your own analysis account

[Overview](../README.md) · [User guide](USER_GUIDE.md)

You can browse the included library without an analysis account. Automatic comment analysis is optional. **Every user connects their own account on their own computer. Downloading PersonalTube does not give anyone the maintainer’s credentials or allowance.**

## What you need

- PersonalTube running locally, with internet access.
- One official command-line tool (CLI) installed on the **same computer** as the server: **Codex CLI 0.155.1** or **Claude Code 2.1.281**. These are reviewed integration versions, not claims about the latest releases. Other versions are refused pending review.
- Your own account with access to the chosen tool. Your plan’s eligibility, usage limits and provider terms apply; a paid plan may be required. Having the website or desktop app signed in does not prove that this CLI is connected.
- Your own YouTube Data API key for live video searches and statistics. This is separate from the analysis account.

## 1. Install one tool

Follow the official instructions for your operating system:

- [Codex CLI installation](https://learn.chatgpt.com/docs/codex/cli). With npm, the reviewed version can be installed using `npm install -g @openai/codex@0.155.1`.
- [Claude Code installation](https://code.claude.com/docs/en/setup), including its **Install a specific version** section. Select `2.1.281` for this integration.

Check with `codex --version` or `claude --version`. Reopen your terminal after installation, then restart PersonalTube from that terminal so it can find the new tool. PersonalTube does not install or downgrade these tools for you. If you already depend on another version, keep it and request compatibility support rather than changing it blindly.

## 2. Sign in

Open **Setup & connections** in PersonalTube. Choose **Sign in with Codex** or **Sign in with Claude**. Complete the official provider login in your browser using **your own account**. PersonalTube never asks for your password.

The app checks the connection automatically for up to three minutes while this dialog remains open. If you signed in already, choose **Use Codex / Use Claude** instead. There is no analysis request just from opening setup or checking the connection.

If the browser does not open, a login code needs to be pasted, or the attempt expires, wait for the current attempt to finish. Then open a **second terminal** and use the appropriate command:

Codex:

```sh
codex -c 'cli_auth_credentials_store="file"' login
```

Claude Code:

```sh
claude auth login --claudeai
```

Complete the prompts there, return to PersonalTube and press **Check connection again**. Do not run competing login attempts. The Codex command uses the same credential-store setting as this integration; the CLI manages its credentials locally. Never paste passwords, login codes, tokens or account files into an issue.

See [Codex authentication](https://learn.chatgpt.com/docs/auth) and [Claude Code authentication](https://code.claude.com/docs/en/authentication) for the official login and account guidance.

## 3. Verify that analysis actually works

**Connected · analysis not yet tested** means the local tool recognizes your login. It does not prove model access, available allowance or a working network request.

Open **Recommendations**, enter a topic and start a search. This explicitly uses your YouTube quota and selected analysis account. After a successful validated analysis, the active provider card says **analysis completed in this server session**. Counts in **Analysis since server start** show attempts, completions, failures and comment/video inputs. They reset on server restart and are not your provider’s token balance or bill.

No matching videos is possible even after a successful analysis: the sample may not meet your recommendation requirements. An account or network error is different from a valid search with no qualifying results.

## If something goes wrong

| What you see | What to do |
|---|---|
| Not installed | Install the CLI, reopen your terminal and restart PersonalTube. A browser subscription alone is insufficient. |
| Version not verified | Compare `--version` with the reviewed versions above. Do not bypass the version check. |
| Installed, not connected | Finish the provider’s official login, then check again. |
| API or other login detected | This workflow accepts subscription login only. There is no silent fallback to separately billed API usage. Changing the CLI login can affect other tools that share it. |
| Waiting or sign-in did not finish | Allow up to three minutes, then use the manual terminal instructions above. |
| Connected but analysis fails | Check account eligibility/remaining allowance with the provider and your network connection. Failed requests can still consume allowance. |

Provider choice is shared by tabs using this local server and resets to Codex on restart. Public comment samples are sent to the selected provider. Do not expose the server as a public multi-user service.

## Cost and integration boundaries

YouTube Data API access is free within the provided daily quota. Analysis is separate: PersonalTube adds no subscription or per-analysis charge, but your chosen provider’s account, subscription and limits still apply. No credits are pooled, sold or supplied by the maintainer.

This implementation runs the user's installed official CLI; it does not implement its own OAuth token exchange or collect account credentials. Do not interpret local CLI support as permission to resell or host subscription access. In particular, Anthropic distinguishes running unmodified Claude Code from offering Claude.ai login inside third-party products; see its [authentication and product integration conditions](https://code.claude.com/docs/en/legal-and-compliance). A hosted service requires a separate design and provider-terms review.

## What has been verified

Automated tests cover missing tools, unsupported versions, signed-out and API-only states, official login arguments, failures, pending login, successful status transitions and completed-analysis counts for both providers. These use controlled synthetic fixtures. They are **not** a completed browser login with a brand-new account on a clean machine. Existing local credentials were not removed or replaced. A real first-time user must still complete the provider's own authentication and an explicit analysis request to validate their environment.
