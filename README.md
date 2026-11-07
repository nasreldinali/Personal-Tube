# PersonalTube

**Your channels. Community recommendations. A viewing space you control.**

[![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=black)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-22%20%7C%2024-339933?logo=nodedotjs&logoColor=white)](#quick-start)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Interface](https://img.shields.io/badge/Interface-EN%20%7C%20AR%20%7C%20DE%20%7C%20ES-487EA4)](README.ar.md)

[Quick start](#quick-start) · [Screenshots](#screenshots) · [Analysis connections](docs/ANALYSIS_PROVIDERS.md) · [User guide](docs/USER_GUIDE.md) · [Contributing](CONTRIBUTING.md) · [Checks](https://github.com/nasreldinali/Personal-Tube/actions/workflows/check.yml)

PersonalTube is a local YouTube dashboard built on **Andrej Karpathy’s [HackerTube](https://karpathy.bearblog.dev/hacker-tube/) idea and exported collection**. Browse the original recommendations immediately, follow your own channels, and discover videos through public community discussions—with English, Arabic, German and Spanish controls, adjustable quality filters and control over refresh usage.

**Read this guide:** English · [العربية](README.ar.md) · [Deutsch](README.de.md) · [Español](README.es.md)

## Screenshots

**Discover · the included community library**

![PersonalTube English interface in light mode, showing public videos from the original collection](docs/images/discover-en-light.png)

<details>
<summary>See the Arabic interface in dark mode</summary>

![PersonalTube Arabic interface in dark mode with right-to-left layout](docs/images/discover-ar-dark.png)

</details>

**My channels · your own viewing interests**

![My channels in light mode with public video examples from Tina Huang, Chase AI, Stanford Online, Nate Herk and Andrej Karpathy](docs/images/my-channels-en-light.jpg)

*Illustrative mixed-date selection, not a live last-week feed. The app normally displays the selected 1–7 day window. [Video sources and presentation notes](docs/REPOSITORY_PRESENTATION.md).*

## What this adds to the HackerTube foundation

Karpathy’s work supplies the starting idea: discover YouTube videos through recommendations in Hacker News comments. This repository retains the supplied catalog and taxonomy, and includes a derived evidence index with source links and related recommendations. **It uses the data export, not HackerTube’s original application or server code.**

PersonalTube adds a workflow for ongoing personal use:

| Addition | Why it helps |
|---|---|
| Your own channel feed | Add channels by handle, URL or ID; see uploads from the last 1–7 days. No source-file editing. |
| Connected filters | Pick a category, then only its channels. Choose long videos, estimated Shorts, or both. |
| Four interface languages | English, Arabic, German and Spanish controls; Arabic right-to-left layout, light/dark/system themes and responsive cards. Source titles and quotes keep their original language; catalog topic/category labels currently have English and Arabic translations. |
| Live community discovery | Choose a topic and source; collect and analyze the selected comments automatically, with progress and supporting quotes. |
| Visible recommendation requirements | Adjust minimum views/likes, declared audio language and endorsement count. Unverified results are withheld. |
| Your choice of analysis provider | Sign in/out of Codex or Claude Code; connect your MiniMax M Plan subscription; choose among seven cloud API services; or connect Ollama, LM Studio or a compatible local model server. Each user supplies their own access. |
| Refresh and usage controls | Manual or scheduled channel refresh, selectable intervals and an explicitly estimated daily YouTube API counter. |
| Personal library controls | Watch later, watched history, confirmed single/bulk hiding, restore, category management and portable backups. |
| A choice of video images | Original thumbnail or a video-frame image; sticky filters and a collapsible sidebar. |

These are PersonalTube capabilities, not a claim that the current HackerTube lacks every comparable feature. HackerTube is the simpler hosted starting point; PersonalTube is for people who want a configurable local dashboard and accept optional setup for live features.

## Quick start

### 1. Install Node.js

Use [Node.js 22 or 24](https://nodejs.org/en/download), with npm, and a modern browser. The code declares Node.js 20 as its minimum; the contribution workflow checks 22 and 24. Start with a desktop or laptop. The layout adapts to tablets and phones, but this is **not a standalone mobile app** and the local server is not exposed to other devices.

### 2. Download the project

Choose **Code → Download ZIP** on GitHub and extract it, or clone it:

```sh
git clone https://github.com/nasreldinali/Personal-Tube.git
cd Personal-Tube
```

For a ZIP download, open a terminal inside the extracted folder.

If GitHub shows **404 / Repository not found**, check that the repository is public or that your signed-in account has access to this private repository. Downloading a private repository requires access; installing Node does not resolve that message.

### 3. Start it

```sh
npm start
```

Open **[http://127.0.0.1:4173](http://127.0.0.1:4173)** and keep that terminal open. Stop with **Ctrl+C**. There is no `npm install` step, build step, database or cloud hosting to configure.

Optional: `npm run open` starts the server and opens a browser; on macOS it tries Chrome. macOS also has **Start PersonalTube.command**. Do not open `index.html` directly.

If the terminal says **port 4173 is already in use**, first open the address above: PersonalTube may already be running. Otherwise stop the conflicting local server before retrying. If `npm` is not found, install Node with npm and reopen the terminal; if `package.json` is not found, open the terminal in the extracted project folder.

See [current verification](docs/VERIFICATION.md) and the [earlier clean-download/account checks](docs/FIRST_RUN_VERIFICATION.md), including the limits of first-time login testing.

## What does it cost?

**YouTube Data API access is free within its daily quota. PersonalTube adds no API fee.** The default allocation currently includes **10,000 daily units for general data requests and 100 video-search calls separately**. Quotas reset at midnight Pacific Time. A project may have different limits; see [Google’s current quota table](https://developers.google.com/youtube/data/determine_quota_cost).

This can comfortably fit moderate personal channel-following, but is not an unlimited-use promise. For illustration, 20 channels refreshed four times a day at two data requests per channel would use about 160 units; additional upload pages, searches, comments, retries and other apps using the same project add usage. Select manual refresh or a longer interval to reduce requests. Playing a video does not consume Data API quota. Reaching the limit stops new requests until quota is available; the app does not buy extra quota automatically.

**Comment analysis is separate and optional.** Choose your own eligible Codex/ChatGPT, Claude Code or MiniMax M Plan subscription, an explicitly configured cloud API, or a local model. API billing is separate from subscriptions and requires acknowledgement before configuration; connection tests can incur charges. Local models require your own hardware and setup. There is no automatic provider switch, shared allowance or unlimited analysis promise. The original library needs none of these connections.

## What do I need for each feature?

| Feature | YouTube API key | Analysis connection |
|---|---|---|
| Browse/search the included HackerTube library, save videos and play available embeds | No | No |
| Follow channels, fetch recent uploads or load missing durations | Your own key | No |
| Find recommendations with analyzed YouTube comments | Your own key | Your own subscription, API or local-model connection |
| Search live communities with verified video statistics | Your own key | Your own subscription, API or local-model connection |
| Import a prepared video-link file | No for import | No for import; it does not automatically classify the file |

**Downloading this repository never gives someone access to the maintainer’s API key or subscription.** Each installation supplies its own YouTube key and analysis access. Subscription analysis uses that account’s allowance; cloud API analysis uses its separate billing; the app does not sell credits, bundle a model, or provide a shared analysis service. Public comments go to the selected analysis service. A truly local model can keep analysis on your computer, while YouTube and community requests still use the internet.

For live features, open **Connections**. Create a key with **YouTube Data API v3** enabled, restrict it to that API and the local website origin, then enter it in **Settings & data**. Install/sign in to your chosen analysis CLI separately if needed; PersonalTube does not install it for you. The app currently accepts **Codex CLI 0.155.1** and **Claude Code 2.1.281** only; other versions are refused until their execution policies are reviewed. A paid account alone does not replace the local CLI requirement. Follow the [first-time account setup guide](docs/ANALYSIS_SETUP.md), or choose **Cloud API** or **Local model** using the [provider guide](docs/ANALYSIS_PROVIDERS.md). Connection detection and a successful analysis are shown separately; the guide explains what has been tested and how to complete your own first-use check.

## Choose your analysis connection

| You prefer… | Choose… | You need… |
|---|---|---|
| Your existing eligible subscription | Codex or Claude Code | Supported CLI and your own login |
| Direct MiniMax subscription | MiniMax M Plan | Global subscription key; included quota, then existing credit packs. [Setup and test](docs/MINIMAX_SUBSCRIPTION.md) |
| Direct cloud API access | OpenAI, Anthropic, Google Gemini, DeepSeek, Mistral or Groq | API key, model ID and explicit billing acknowledgement |
| A wider choice of hosted closed/open-weight models | OpenRouter | Its API key and a compatible model ID |
| Running an LLM or smaller SLM on your computer | Ollama, LM Studio or OpenAI-compatible · Local | Local server, suitable model and hardware; discover available model IDs from the app |

Connections now has five separate sections: **Subscription, Cloud API, Local model, YouTube, Usage & help**. The active analysis service stays visible. **Subscription → Find my account or subscription** explains the route for your existing account without switching providers or making a request. MiniMax is optional under **Add another subscription**; no MiniMax account is required.

**Not every chat subscription is an integration.** Google does not support consumer Antigravity login pass-through in third-party apps, and Copilot is not integrated; Kimi Code is not offered for this automated batch flow. API access is separate. See the [connection compatibility catalog](docs/CONNECTION_CATALOG.md).

MiniMax has a separate **save → test → use** flow. Saving/testing keeps your selected provider and Codex/Claude logins unchanged. It accepts M Plan keys only, without pay-as-you-go fallback; MiniMax may consume existing credit packs after plan quota. Actual MiniMax account compatibility still needs your explicit sample test.

**Configured** is not the same as **tested**. An explicit one-sample test verifies the selected subscription, API or local model; it uses subscription allowance or may cost money for cloud APIs. Keys stay only in the local server's memory until removed or the server stops. Sign-out confirms its effect on the official CLI before acting. [Setup steps, supported endpoints and limits →](docs/ANALYSIS_PROVIDERS.md)

## Three ways to find something worth watching

- **Discover:** start with 4,654 recommended, non-news videos selected from the included 6,454-video export, across 16 topics and 150 categories. Browse source quotes and related recommendations in the original community library.
- **My channels:** build your own list and choose a 1–7 day publication window. Videos over three minutes are the default. Category changes narrow the channel selector automatically.
- **Recommendations / Communities:** search for a topic using public YouTube comments or live Hacker News, Stack Exchange, or authorized Reddit access. The community flow defaults to 100,000 views, 1,000 likes and two distinct endorsing accounts; these controls are editable. The original library remains accessible without a new analysis run.

An original community score measures community recommendation evidence—not a YouTube rating, view count or guarantee of quality. Automatic analysis can be wrong; popularity and multiple accounts do not prove authenticity. Small samples and strict filters may produce no results. [How collection and analysis work →](docs/USER_GUIDE.md#recommendations-and-communities)

## Practical limits and privacy

- **Local application, external content.** Settings and library data live in this browser. Thumbnails/playback contact YouTube; metadata contacts Google; selected public comments go to your chosen analysis provider. There is no PersonalTube analytics or hosted account system.
- **Your API usage is yours.** Refresh, searches and metadata/comment requests consume Data API quota; embedded playback does not. The counter is a browser estimate, not Google’s live project balance. See [Google’s quota documentation](https://developers.google.com/youtube/data/determine_quota_cost).
- **YouTube keys are not encrypted by the app.** Browser session storage is the default; remembering a YouTube key is optional. Analysis API keys stay only in local server memory. Backups omit keys and API caches. Do not commit keys, account exports or personal screenshots.
- **Shorts are estimated.** The app groups videos up to three minutes as estimated Shorts; some short regular videos may appear there. Channel collection is bounded to 250 uploads per channel and discloses incomplete samples.
- **Archives are not live connectors.** Hugging Face, Kaggle, Common Crawl, Wikipedia and Reddit archive imports require a prepared JSON/JSONL extract. PersonalTube does not crawl those entire datasets. Reddit live access requires approved OAuth access.
- **Premium is not guaranteed inside embeds.** It depends on the browser/account and playback eligibility. Open on YouTube is available as a fallback.
- **Keep the server local.** It binds to loopback and has no multi-user authentication. Do not deploy it as a public website without a separate security design.

[Full user guide](docs/USER_GUIDE.md) · [Security policy](SECURITY.md) · [Import format](docs/COMMUNITY_FORMAT.md)

## Help and feedback

- **Installation/account help:** [setup guide](docs/ANALYSIS_SETUP.md) and [provider guide](docs/ANALYSIS_PROVIDERS.md).
- **Something broken:** [report a reproducible bug](https://github.com/nasreldinali/Personal-Tube/issues/new?template=bug_report.yml). Include your OS, Node version and steps; never include keys or account exports.
- **An improvement:** [describe the problem and proposed behavior](https://github.com/nasreldinali/Personal-Tube/issues/new?template=feature_request.yml).
- **A security concern:** follow the private reporting instructions in [SECURITY.md](SECURITY.md).

## Contribute

Small, focused contributions are welcome: clearer documentation, English/Arabic/German/Spanish wording, accessibility improvements and reproducible bug reports. Start with [good first issues](https://github.com/nasreldinali/Personal-Tube/labels/good%20first%20issue), read [CONTRIBUTING.md](CONTRIBUTING.md), and run:

```sh
npm run check
```

The check runs deterministic Node tests, syntax/format/structure checks, data/brand integrity checks and deliberate-defect checks. It needs no real API key or model account. See [verification scope](docs/VERIFICATION.md). The GitHub workflow uses the same command; a passing check is not a security certification.

| Directory | Contents |
|---|---|
| `public/` | Composition root, focused UI modules, pure domain rules, browser adapters and brand assets |
| `public/styles/` | Ordered style sections for components, responsive layouts and later overrides |
| `server/` | Local HTTP server, bounded collectors and analysis adapters |
| `data/hackertube/` | Original catalog/taxonomy and derived recommendation evidence |
| `test/`, `scripts/` | Deterministic tests, checks and launch tools |
| `docs/` | User guide, architecture, formats and verification |

The frontend is separated by responsibility, with characterization tests for user workflows and explicit stylesheet loading order. See the [maintenance map and verification approach](docs/FRONTEND_CLEANUP.md).

## Credit and license

**Thank you, Andrej Karpathy, for HackerTube and the export that makes personal versions possible.** Read [the original project story](https://karpathy.bearblog.dev/hacker-tube/) and visit [HackerTube](https://hackertube.org/). PersonalTube is an independent adaptation with DEEDA branding, not an official Karpathy, HackerTube or YouTube product.

Original PersonalTube code and documentation use the [MIT License](LICENSE). This does **not** relicense everything bundled in the repository: HackerTube/open-index collection material retains its [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/) attribution requirements, fonts retain SIL OFL notices, and DEEDA branding is not granted for general reuse. Video content and third-party material remain with their owners. See [NOTICE.md](NOTICE.md) before redistributing a fork.
