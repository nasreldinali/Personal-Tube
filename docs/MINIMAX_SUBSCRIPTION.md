# MiniMax M Plan subscription

[All analysis connections](ANALYSIS_PROVIDERS.md) · [README](../README.md)

Use your own **global MiniMax M Plan subscription key** directly in PersonalTube. No Codex or Claude configuration files, environment variables or sign-ins are changed. This connection does not need either CLI.

## Set up and test

1. Open **Setup & connections → Subscription → MiniMax · M Plan subscription**.
2. Open your [M Plan account](https://platform.minimax.io/console/plan). Copy the subscription key beginning with `sk-cp-`. A normal pay-as-you-go API key or a chat subscription without M Plan access is not supported here. Do not post your key in an issue or chat.
3. Paste the key in the password field, read the credit-pack notice and tick the acknowledgement. Choose **Save subscription connection**. Saving makes no MiniMax request and keeps your selected analysis provider.
4. Choose **Test with one sample** and confirm. This sends one synthetic comment to MiniMax, without YouTube requests. A valid, evidence-checked response marks the connection as tested. The test also keeps the selected provider unchanged. Allow up to two minutes; there is a one-minute per-provider test cooldown.
5. When ready, choose **Use MiniMax**. Only this deliberate selection switches normal comment analysis to MiniMax. Codex and Claude remain signed in and can be selected again.

The key exists only in this local server's memory. The password field is cleared after submitting, changing connection method or closing setup. Re-enter it after stopping/restarting the server. **Remove connection** clears this session's MiniMax key after confirmation; it does not cancel your plan. Other tabs using the same server share the selection. Removing or exhausting a connection never selects another provider automatically.

## What it consumes

MiniMax distinguishes **M Plan subscription keys** from standard pay-as-you-go keys. This connector accepts only the documented subscription-key shape and never substitutes a pay-as-you-go key, buys credits or retries with another service. Prefix validation is an input safeguard, not independent verification of your account's billing.

**MiniMax can automatically consume existing prepaid credit packs after the included plan quota runs out.** Therefore this is not a guarantee that only the included quota will be used. Review your plan and credit packs in MiniMax before testing. The app cannot disable MiniMax's credit-pack behavior or display its authoritative remaining balance. Its counters show local requests and comments, not tokens, money or plan balance. Failed requests can consume allowance.

The connector makes HTTPS requests to MiniMax's API using the **subscription credential**; that transport does not turn it into ordinary pay-as-you-go access. MiniMax controls eligibility, quota, credit consumption and terms. Use your own eligible plan for personal, interactive searches; this is not a shared or hosted analysis service.

## Supported configuration and boundaries

- Global endpoint: `https://api.minimax.io/anthropic/v1/messages`. No arbitrary or China-region endpoint is accepted.
- Fixed model: `MiniMax-M3.1-Flash`, low reasoning effort, maximum 8,192 output tokens, two-minute deadline and 1 MB response cap.
- No model tools, redirect following, automatic retries or provider fallback. Input limits match the existing analysis flow.
- Only final JSON text is accepted. Thinking blocks are discarded; truncated/tool responses and quotes absent from the input are refused. A successful test proves one response worked, not every future search.
- Codex and Claude continue to use their existing independent official CLI sessions.

## If the test fails

Check that the key came from **M Plan**, the global plan is active and allowance or permitted credits are available. Wait for the displayed cooldown before retrying manually. Authentication, rate-limit and invalid-output failures stay errors; there is no paid fallback. A non-M-Plan chat subscription cannot be connected with this form.

## Verification status

The complete save/test flow, endpoint, secret handling, billing acknowledgement, evidence validation and preserved Codex/Claude selection are tested with deterministic fixtures. **An actual MiniMax account request has not been verified on the maintainer's account.** Enter your own key directly in the app and run its explicit sample test to verify current account/model compatibility. No real MiniMax key is bundled or used by repository tests.

Protocol and billing references: [M Plan compatible tools](https://platform.minimax.io/docs/m-plan/other-tools), [M Plan FAQ](https://platform.minimax.io/docs/m-plan/faq), [Anthropic-compatible messages](https://platform.minimax.io/docs/api-reference/text-chat-anthropic). Checked 2026-11-07; provider behavior can change.
