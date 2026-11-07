# Choose how comments are analyzed

[Setup guide](ANALYSIS_SETUP.md) · [README](../README.md)

PersonalTube supports two subscription CLIs, three cloud API services and two local model servers. Choose one explicitly in **Setup & connections**. It never changes services to work around an error or an exhausted allowance.

| Connection | What you supply | Where analysis runs | Billing |
|---|---|---|---|
| Codex | Supported official CLI and your ChatGPT login | OpenAI | Your eligible plan and allowance |
| Claude Code | Supported official CLI and your Claude login | Anthropic | Your eligible plan and allowance |
| OpenAI API | Your API key and exact model ID | OpenAI | Separate API billing |
| Anthropic API | Your API key and exact model ID | Anthropic | Separate API billing |
| OpenRouter | Your API key and exact model ID | The service/model provider you select | Your OpenRouter account; model-dependent |
| Ollama | Running local server and installed local model ID | Your configured local server | Your hardware; no PersonalTube API fee |
| LM Studio | Running local server and loaded model ID | Your configured local server | Your hardware; no PersonalTube API fee |

Closed and open-weight models are available through these services. Support for a service does **not** mean every model supports the required JSON output, context length or requested generation limit. There is no arbitrary endpoint field. Ollama's `:cloud` model suffix is refused in the local option; you are responsible for ensuring the local server actually uses a local model.

## Subscription sign-in and sign-out

Install a supported CLI using [the account guide](ANALYSIS_SETUP.md). A signed-out card offers **Sign in**. A connected card offers **Use** and **Sign out**. Sign out asks for confirmation because it invokes the official CLI logout on this computer; other tools sharing that CLI login may need to authenticate again. It does not remove your PersonalTube library or cancel your subscription. After sign-out, use Sign in to reconnect or choose another account in the provider's browser flow.

Tests use synthetic accounts for logout. Existing personal credentials are never removed for an automated test.

## Cloud API setup

1. Open **Setup & connections → API or local model**.
2. Choose OpenAI API, Anthropic API or OpenRouter. Enter the exact model ID and your key from that service. A ChatGPT or Claude subscription is not an API key or a promise of included API credit.
3. Read and tick the API cost acknowledgement, then choose **Use this model**. Saving the connection makes no model request.
4. Choose **Test with one sample** and confirm. This sends one synthetic comment; the service may charge for it. A valid result marks the configuration as tested. The test is limited to one attempt per service per minute.
5. Run a normal recommendation search. Public comments go to the selected service. The service's privacy, retention and billing terms apply.

The password field is cleared after submission, service changes and closing setup. Keys are held only in local server memory; they are not returned by status requests, stored in browser preferences, exported in backups or written to project files. **Remove connection** clears that service's configuration after confirmation. Restarting the server clears all API/local configurations and selects Codex again. Other tabs connected to the same server share these settings.

## Local model setup

Install and run [Ollama](https://docs.ollama.com/quickstart) or [LM Studio](https://lmstudio.ai/docs/developer/core/server) separately, then load a model suitable for structured JSON output and your hardware. PersonalTube does not download models or start these services.

- Ollama: `http://127.0.0.1:11434/api/chat`.
- LM Studio: `http://127.0.0.1:1234/v1/chat/completions`; servers requiring API authentication are not supported by this connector.

Choose the local service and enter the exact installed model ID. No cloud API key is requested. Test with one sample before collecting a large batch. A local HTTP address alone cannot prove that a separately configured model server never forwards requests elsewhere.

## Limits and errors

Every analysis request has a two-minute deadline, a 1 MB response limit and no automatic retries. API output is capped at 8,192 tokens. Inputs keep the existing limits: up to 160 YouTube comments per request or 24 community comment/video pairs per call, with at most three community calls per search. An insufficient model context or truncated output fails the request; it is not displayed as a recommendation.

Only validated JSON classifications and exact quotes from the supplied comments are accepted. API models receive no browsing, file, shell or agent tools. Requests use fixed service endpoints and refuse redirects. Failed requests may still cost money or consume allowance; the app's counters measure requests, not a live token balance or bill. Set spending limits with your provider.

API-key rejection, rate limits, unavailable servers and invalid model output are reported separately. Reconfiguring a key or model resets its tested status, while session usage totals remain. Removing a connection does not automatically switch to another service.

## Local setup interface, version 1

`POST /api/setup` requires same-origin JSON and a body of at most 6,000 bytes. Existing status/select/connect actions remain. New actions:

- `logout`: subscription `provider`, `confirm: true`.
- `configure`: API/local `provider`, `configuration` containing exactly `provider`, `model`, `key`, `acknowledgeCost`. Cloud options require a nonempty key and `true`; local options require an empty key and `false`.
- `forget`: API/local `provider`, `confirm: true`.
- `test`: selected API/local `provider`, `confirm: true`.

Every request includes `version: 1`; unknown versions, providers and additional input fields are refused. Status returns availability, method, model ID, tested state and aggregate usage, never keys. Login, analysis and configuration mutations cannot race. The server is for one local user, not a publicly hosted account service.

Reference protocols: [OpenAI Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create), [Anthropic Messages](https://platform.claude.com/docs/en/api/messages), [OpenRouter](https://openrouter.ai/docs/api/reference/overview), [Ollama chat](https://docs.ollama.com/api/chat), [LM Studio compatibility](https://lmstudio.ai/docs/developer/openai-compat/chat-completions).
