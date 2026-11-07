# Which connection can I use?

[README](../README.md) · [Step-by-step setup](ANALYSIS_PROVIDERS.md)

Open **Connections** and choose **Subscription**, **Cloud API** or **Local model**. **YouTube** and **Usage & help** have their own sections. Moving between sections does not change the selected analysis service. The selected service stays visible above the form.

In **Subscription → Find my account or subscription**, choose the service you already have. The guide explains its route and opens existing connection controls or API/local setup only when you press a button. Choosing a name does not authenticate, change the active provider or run analysis. The same guide is available in all four interface languages.

## Existing subscriptions

| Your access | Current support | What to do |
|---|---|---|
| ChatGPT with eligible Codex access | Supported through the reviewed Codex CLI | Install the supported CLI, sign in, select it, then test one sample. |
| Claude with eligible Claude Code access | Supported through the reviewed Claude Code CLI | Install the supported CLI, sign in, select it, then test one sample. |
| Global MiniMax M Plan | Optional direct subscription connector | Expand **Add another subscription**. Save, test, then explicitly select it. Existing credit packs may be consumed after quota. No account is assumed or required. |
| Google Gemini / Antigravity consumer subscription | Consumer login pass-through is not supported for third-party apps | Google’s current FAQ also rules out wrapping `agy` in a third-party application under a consumer plan. PersonalTube offers Gemini API separately; it does not use this subscription. |
| GitHub Copilot | No adapter in PersonalTube yet | A provider-specific integration and review are needed. |
| Kimi Code | Not offered for this automated batch flow | Its current guidelines restrict scripted batches/data annotation; a chat subscription is not a general API entitlement. |
| Any other chat subscription | Not automatically compatible | The provider must offer an eligible official integration. Do not enter its credentials in another service's form. |

There is **no universal subscription login**. Being able to chat with a model on a website does not establish permission or technical access for another app to run it automatically. PersonalTube does not scrape chat sessions, impersonate official clients or silently switch to paid APIs. Existing account connections remain available when you choose another provider.

References: [Codex/Claude setup and reviewed versions](ANALYSIS_SETUP.md), [MiniMax setup and billing limits](MINIMAX_SUBSCRIPTION.md), [Google Antigravity FAQ](https://antigravity.google/docs/faq/), [Copilot CLI reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference), [Kimi Code guidelines](https://www.kimi.com/en/help/kimi-code/community-guidelines).

## Cloud APIs

Seven service connectors are available: **OpenAI, Anthropic, OpenRouter, Google Gemini, DeepSeek, Mistral and Groq**. Supply your own service API key and exact model ID, acknowledge possible API costs, save, then confirm a one-sample test. Saving alone does not call a model. API billing and entitlements are separate from chat subscriptions.

OpenRouter provides access to many hosted closed and open-weight models through its own account and billing. It does not spend a Kimi, MiniMax, ChatGPT or other chat subscription. Availability and structured-output support vary by model; a provider name on the list is not a guarantee that every model will work.

The new Gemini, DeepSeek, Mistral and Groq adapters are covered by deterministic protocol tests, **not live account verification**. Their real compatibility is established by your explicit sample test. No cloud API account or balance is included with PersonalTube.

## Models already on your computer

| Your model server | Choose | Discovery |
|---|---|---|
| Ollama | Ollama | Local `/api/tags`, port 11434 |
| LM Studio | LM Studio | Local `/v1/models`, port 1234 |
| OpenAI-compatible server, such as a suitable llama.cpp, vLLM or MLX server | OpenAI-compatible · Local | Your port, `/v1/models`; generation uses `/v1/chat/completions` |

1. Start the model server yourself and make the model available there.
2. Choose the matching local service. For an OpenAI-compatible server, enter its port (1024–65535).
3. Press **Find available models**, choose an ID, or enter its exact ID manually.
4. Press **Use this model**, then confirm **Test with one sample**.

Discovery reads the server's model list only. It does not download a model, start generation or change the selected provider. Some servers list models that still need loading. A model file sitting on disk is not sufficient: it needs a supported serving interface.

Both LLMs and smaller SLMs can be used if they fit the required context and produce valid JSON classifications with exact quotes. Size alone is not a compatibility guarantee. This connector supports unauthenticated `127.0.0.1` servers only; arbitrary remote URLs, LAN hosts and authenticated local servers are not supported. A local address cannot prove that a server you configured never forwards requests to a cloud service.

See [request limits, storage and errors](ANALYSIS_PROVIDERS.md#limits-and-errors). Models never receive file, shell or browsing tools from these API adapters. Invalid output is rejected instead of becoming a recommendation.

Google compatibility was checked against the official FAQ on 2026-11-07. Access to Antigravity through a Google plan is different from authorization for a third-party app to use that login. Earlier Gemini CLI login guidance should not be treated as proof of current consumer subscription integration support.
