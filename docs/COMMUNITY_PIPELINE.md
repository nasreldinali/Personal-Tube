# Community recommendation pipeline

Version 1. Reviewed 2026-11-04.

## What works

The Communities screen has two distinct inputs:

- **Original HackerTube:** source ranking, supporting classified comments and the original shared-recommender graph. No new model request is needed. The score remains the original `videos.score`; a capped set of twenty comments per video cannot reproduce the original complete scoring history.
- **Live comments:** Hacker News search (at most four requests / 400 returned hits), Stack Exchange recent comments (three pages / 300 comments), and Reddit recent subreddit comments (three pages / 300 comments with approved OAuth). A topic filter narrows the sample. Source backoff and at least a one-minute collection cooldown apply. These are bounded samples, not complete crawls.

Optional archive imports from Hugging Face, Kaggle, Common Crawl, Wikipedia and other supported datasets remain video-reference imports. They do not download arbitrary datasets or classify those imports. Their schemas, extraction needs and limitations are in [COMMUNITY_FORMAT.md](COMMUNITY_FORMAT.md).

## Collection, analysis and ranking

Links are extracted before HTML normalization; encoded HN links and sentence punctuation are handled. Multiple links retain per-video context markers. Duplicate comment/video pairs are counted once. Raw author identifiers become in-memory opaque hashes for counting distinct recommenders, and are not returned to the browser. Email/common credential patterns in displayed/analyzed text are redacted.

New comments start pending. The beginner UI starts collection and analysis with one search. It selects up to 72 comment/video pairs fitting three bounded calls, then automatically analyzes every selected comment. The stop control waits for the active request and prevents the next call; errors preserve only completed positive results. The old manual API actions remain compatible but are not exposed as batch controls. The classifier returns `rec`, `strong_rec`, `reference`, `critical` or `joke` per comment/video pair. Unknown IDs, duplicates, extra fields, wrong versions, invented quotes and missing labels reject the entire batch. Recommendations need an exact supporting quote. The method can still misinterpret language; source links allow review.

The new sample score is distinct recommendation months plus 0.5 times distinct strong-recommendation months. Critical, joking, neutral and pending mentions do not raise the recommendation score. The beginner UI shows positive recommendations only. The compatible manual API can sort newest mentions and most shared links, including pending references in legacy sessions; automatic sessions filter those out for every sort. Dates are comment dates, not video publication dates. Original month-only evidence is displayed without inventing a day.

Public YouTube oEmbed supplies available titles/channel names for up to 24 visible unknown videos, with four bounded workers, three-second individual deadlines and a one-hour memory cache. Missing/unavailable metadata retains an explicit YouTube ID fallback. It never changes community scores or invents publication dates.

## Codex integration

The owner selected Codex. The adapter invokes the locally installed CLI **0.155.1**, using its existing login; other versions fail closed pending review. No Claude/API key is required by this integration. It sends at most 24 comment/video pairs and 40,000 serialized characters per process call, with a 120-second process deadline and 1 MB combined output limit. Automatic searches permit at most three process attempts, including failures. This consumes the account's allowance and requires working Codex authentication. It is not an offline model or an unlimited free service.

Execution uses a fresh scratch directory, read-only mode, no inherited user/project instructions, disabled command/app/browser/plugin/agent/hook/skill tool features, disabled web search, no approval escalation, a minimal environment and no shell interpolation. Output must be a completed structured response. Unexpected tool events and malformed responses are rejected. These controls and observed no-tool runs do not constitute a formal proof that every native CLI capability is unavailable. See [security scope](COMMUNITY_SECURITY.md).

The CLI's ephemeral option avoids persisted session files; it is not a promise about every provider/CLI cache or log. No raw CLI output is returned to the UI. Temporary schema files are removed. Local original sources never enter model prompts; only the selected public live-comment batch does.

## HTTP contract

`POST /api/community` accepts JSON version 1, maximum 6,000 bytes, from the exact local origin only. Public assets remain GET/HEAD-only. Unknown actions and invalid sort values are refused before model/network side effects.

| Action | Input | Output |
|---|---|---|
| `archive` | optional query <=120 chars, page 0–300, relatedTo strict video ID | original ranked page, up to 24 videos and eight evidence excerpts each |
| `discover` | same collection input as `collect` | automatic session, positive-only results, capped `totalComments`, `foundComments`, `pending`, `analyzed`, `analysisLimit: 3` |
| `collect` | source hn/stackexchange/reddit, query <=120, scope <=60, days 7/30/365; Reddit approved=true, token and username | opaque session ID, sample counts and ranked pending references |
| `analyze` | session ID, optional sort top/newest/shared | next at-most-24 pairs classified; updated evidence/rankings |
| `results` | session ID, sort | same collected/classified evidence in another order |
| `clear` | session ID | removes the inactive session |
| `clearAll` | no session ID | removes all inactive local-server collections; refuses while collection/analysis is active |

At most four collections remain in server memory; expiry timers remove them after one hour even when idle. An already-running request may retain its bounded input until it completes or hits its deadline. They are not durable watchlists or a database. Restarting the server loses them. Clear session results removes the collection and clears the page's Reddit token. Global Clear personal data also removes local-server collections before clearing browser data; it refuses while a job is active. Saved video IDs use the existing personal library and backup flow; raw collected comments, model output and tokens are not included in browser backups. No background collection or analysis happens when the page is closed.

## Source files and reproduction

Exact original comments, related data, embedding vectors and IDs are preserved in ignored `data/hackertube/original/`, with recorded original hashes. `scripts/build-community-evidence.mjs` checks those hashes and derives a contact-redacted display index. It does not rewrite source bytes or reclassify originals. The index and existing catalog are sufficient for a fresh checkout. Embeddings are retained but semantic search is not implemented here.

References: [HN Search](https://hn.algolia.com/api), [Stack Exchange comments](https://api.stackexchange.com/docs/comments), [backoff](https://api.stackexchange.com/docs/throttle), [Reddit access](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki), [Codex non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode), [Codex configuration](https://learn.chatgpt.com/docs/config-file/config-reference).
