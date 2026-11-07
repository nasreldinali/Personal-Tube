# Choose how comments are analyzed

[Setup guide](ANALYSIS_SETUP.md) · [README](../README.md)

PersonalTube supports three subscription CLIs, a direct MiniMax M Plan connection, seven cloud API services and three local model connection types. Choose one explicitly in **Connections**. The **Subscription → Find my account or subscription** guide helps new users identify the correct route without logging in or switching their active connection. It never changes services to work around an error or an exhausted allowance.

| Connection | What you supply | Where analysis runs | Billing |
|---|---|---|---|
| Codex | Supported official CLI and your ChatGPT login | OpenAI | Your eligible plan and allowance |
| Claude Code | Supported official CLI and your Claude login | Anthropic | Your eligible plan and allowance |
| GitHub Copilot | Official CLI 1.0.107 and your GitHub OAuth login | GitHub Copilot | Your plan allowance; disable paid overage in GitHub billing |
| MiniMax M Plan | Your global subscription key (`sk-cp-…`) | MiniMax | Included quota, then existing credit packs; no pay-as-you-go fallback |
| OpenAI API | Your API key and exact model ID | OpenAI | Separate API billing |
| Anthropic API | Your API key and exact model ID | Anthropic | Separate API billing |
| OpenRouter | Your API key and exact model ID | The service/model provider you select | Your OpenRouter account; model-dependent |
| Google Gemini, DeepSeek, Mistral or Groq API | Your service API key and exact model ID | The selected service | Separate API billing/entitlements |
| OpenAI-compatible · Local | Running loopback server, port and model ID | Your configured server | Your hardware; no PersonalTube API fee |
| Ollama | Running local server and installed local model ID | Your configured local server | Your hardware; no PersonalTube API fee |
| LM Studio | Running local server and loaded model ID | Your configured local server | Your hardware; no PersonalTube API fee |

Closed and open-weight models are available through these services. Support for a service does **not** mean every model supports the required JSON output, context length or requested generation limit. Cloud endpoints are fixed. The generic local connector accepts only a numeric loopback port, not a destination URL. Ollama's `:cloud` and `-cloud` model suffixes are refused in the local option; you are responsible for ensuring the local server actually uses a local model.

## Codex and Claude sign-in and sign-out

Install a supported CLI using [the account guide](ANALYSIS_SETUP.md). A signed-out card offers **Sign in**. A connected card offers **Use** and **Sign out**. Sign out asks for confirmation because it invokes the official CLI logout on this computer; other tools sharing that CLI login may need to authenticate again. It does not remove your PersonalTube library or cancel your subscription. After sign-out, use Sign in to reconnect or choose another account in the provider's browser flow.

**Test with one sample** also works for the selected connected subscription. It sends one synthetic comment through the same classifier, uses your plan allowance, requires confirmation and has a one-minute per-service cooldown. It does not log out, fetch YouTube data or fall back to a paid API.

Tests use synthetic accounts for logout. Existing personal credentials are never removed for an automated test.

## GitHub Copilot subscription setup

[Install the reviewed CLI, sign in, test a sample and explicitly select Copilot](COPILOT_SUBSCRIPTION.md). Unlike Codex/Claude, its login and test do not change the active provider. No Copilot sign-out control is provided; use the official tool with the documented dedicated profile.

## MiniMax subscription setup

Choose **Subscription → Add another subscription → MiniMax · M Plan subscription**. Save your M Plan key, then test one sample. Saving and testing do not change the selected provider or Codex/Claude sign-ins. Choose **Use MiniMax** explicitly when ready. See the [step-by-step guide and credit-pack caveat](MINIMAX_SUBSCRIPTION.md).

## Cloud API setup

1. Open **Connections → Cloud API**.
2. Choose OpenAI, Anthropic, OpenRouter, Google Gemini, DeepSeek, Mistral or Groq. Enter the exact model ID and your key from that service. A ChatGPT or Claude subscription is not an API key or a promise of included API credit.
3. Read and tick the API cost acknowledgement, then choose **Use this model**. Saving the connection makes no model request.
4. Choose **Test with one sample** and confirm. This sends one synthetic comment; the service may charge for it. A valid result marks the configuration as tested. The test is limited to one attempt per service per minute.
5. Run a normal recommendation search. Public comments go to the selected service. The service's privacy, retention and billing terms apply.

The password field is cleared after submission, service changes and closing setup. Keys are held only in local server memory; they are not returned by status requests, stored in browser preferences, exported in backups or written to project files. **Remove connection** clears that service's configuration after confirmation. Restarting the server clears all API/local configurations and selects Codex again. Other tabs connected to the same server share these settings.

## Local model setup

Install and run [Ollama](https://docs.ollama.com/quickstart) or [LM Studio](https://lmstudio.ai/docs/developer/core/server) separately, then load a model suitable for structured JSON output and your hardware. PersonalTube does not download models or start these services.

- Ollama: `http://127.0.0.1:11434/api/chat`.
- LM Studio: `http://127.0.0.1:1234/v1/chat/completions`.
- OpenAI-compatible · Local: `http://127.0.0.1:PORT/v1/chat/completions`, with a port between 1024 and 65535. This can connect suitable llama.cpp, vLLM or MLX servers. Authenticated local servers are not supported by these connectors.

Choose the local service, press **Find available models**, and select a model or enter its exact ID. This explicit read-only discovery has a ten-second deadline, 1 MB response limit and returns at most 100 validated IDs from at most 500 records. It does not generate text or switch the active provider. No cloud API key is requested. Test with one sample before collecting a large batch. A local HTTP address alone cannot prove that a separately configured model server never forwards requests elsewhere.

## Limits and errors

Every analysis request has a two-minute deadline, a 1 MB response limit (Copilot: 1 MB per protocol message and 4 MB cumulative output) and no automatic retries. API output is capped at 8,192 tokens. Inputs keep the existing limits: up to 160 YouTube comments per request or 24 community comment/video pairs per call, with at most three community calls per search. An insufficient model context or truncated output fails the request; it is not displayed as a recommendation.

Only validated JSON classifications and exact quotes from the supplied comments are accepted. API models receive no browsing, file, shell or agent tools. Requests use fixed service endpoints and refuse redirects. Failed requests may still cost money or consume allowance; the app's counters measure requests, not a live token balance or bill. Set spending limits with your provider.

API-key rejection, rate limits, unavailable servers and invalid model output are reported separately. Reconfiguring a key or model resets its tested status, while session usage totals remain. Removing a connection does not automatically switch to another service.

## Local setup interface, version 1

`POST /api/setup` requires same-origin JSON and a body of at most 6,000 bytes. Existing status/select/connect actions remain. New actions:

- `login`: `provider: "copilot"` only. Starts bounded official browser OAuth without switching the selected provider.
- `logout`: Codex/Claude `provider`, `confirm: true`.
- `configure` for MiniMax: `provider: "minimax"`, `configuration` containing exactly `provider: "minimax"`, `key` starting with `sk-cp-`, and `confirmSubscription: true`. Saves without selection or network access.
- `configure`: API/local `provider`, `configuration` containing exactly `provider`, `model`, `key`, `acknowledgeCost`. Cloud options require a nonempty key and `true`; local options require an empty key and `false`. The `local-openai` configuration additionally requires an integer `port` between 1024 and 65535; other configurations reject this extra field.
- `models`: local `provider` only, plus `port` only for `local-openai`. Returns validated model IDs without selection or analysis. Cloud providers and extra fields are refused.
- `forget`: MiniMax/API/local `provider`, `confirm: true`.
- `test`: selected subscription/API/local `provider`, `confirm: true`. MiniMax and Copilot may also be tested while inactive; its isolated test preserves selection.

Every request includes `version: 1`; unknown versions, providers and additional input fields are refused. Status returns availability, method, model ID, local port where applicable, tested state and aggregate usage, never keys. Login, analysis and configuration mutations cannot race. The server is for one local user, not a publicly hosted account service.

Reference protocols: [OpenAI Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create), [Anthropic Messages](https://platform.claude.com/docs/en/api/messages), [OpenRouter](https://openrouter.ai/docs/api/reference/overview), [Ollama chat](https://docs.ollama.com/api/chat), [LM Studio compatibility](https://lmstudio.ai/docs/developer/openai-compat/chat-completions).

## Gemma 4 already on your computer

1. Start your Ollama app/server. Run `ollama list` to see installed model IDs; this does not download a model.
2. In PersonalTube choose **Local model → Ollama**.
3. Press **Find available models**, select it, or copy the exact installed name into **Model ID**, for example `gemma4:e4b` only if that variant is already listed. A model file downloaded elsewhere is not automatically registered with Ollama.
4. Choose **Use this model**, then **Test with one sample**. This changes the active analysis provider; it does not sign out of Codex or Claude.
5. To return, choose **Subscription → Use Codex/Claude**.

For LM Studio, load your model and start its local server on port 1234, then select LM Studio and its model ID. Model size, hardware, context and JSON support determine whether the test succeeds. PersonalTube does not install models. [Ollama's Gemma 4 listing](https://registry.ollama.com/library/gemma4) documents available variants; cloud variants are not local inference.

## Kimi subscriptions

Kimi is not a direct PersonalTube subscription connector. Do not paste its subscription key into another service’s field. OpenRouter models use OpenRouter billing, not a Kimi subscription.

Kimi Code's [current usage guidelines](https://www.kimi.com/en/help/kimi-code/community-guidelines) distinguish interactive personal use from non-interactive scripted batches/data annotation. That makes it unsuitable to present as a drop-in subscription for this automatic comment-analysis flow without provider clarification. This is a product-support limitation, not a claim that Kimi models cannot analyze comments. Separately billed model API access is a different product.

## Expanded API protocols

Gemini, Mistral and Groq use OpenAI-compatible chat requests with a JSON schema; support depends on the model. DeepSeek and the generic local connector request JSON-object output and still undergo the same strict evidence validation. There is no automatic retry or provider fallback. Newly added cloud adapters have deterministic protocol coverage; actual account/model compatibility still requires the explicit sample test.

References: [Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai), [DeepSeek JSON mode](https://api-docs.deepseek.com/guides/json_mode/), [Mistral chat](https://docs.mistral.ai/api/endpoint/chat), [Groq structured output](https://console.groq.com/docs/structured-outputs), [Ollama model listing](https://docs.ollama.com/api/tags), [LM Studio model listing](https://lmstudio.ai/docs/developer/openai-compat/models).

For other subscriptions and the difference between model support and account entitlement, see the [connection catalog](CONNECTION_CATALOG.md).
