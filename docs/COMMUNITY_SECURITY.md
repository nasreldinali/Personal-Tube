# Community pipeline security review

Reviewed 2026-11-03. Target: applicable ASVS Level 1, not formal certification. This is a delta to the local personal application review.

## Boundaries and evidence

MEASURED: external API bodies enter only through `server/bounded-http.js`; redirects and non-allowlisted hosts are refused, with byte/time limits. Reddit credentials are used only for the fixed OAuth host, never sent to the classifier. The route requires loopback Host, exact Origin, JSON POST and a bounded body. Collection/classification use fixed adapters; no arbitrary URL, executable, model or path comes from the browser. Source text is untrusted data rendered via text nodes.

MEASURED: classification operates on server-held evidence, bounded batches and an exact output schema with verified quotes. A fresh reviewer identified invalid-sort validation occurring after a model call and chunk-by-chunk UTF-8 decoding; both were reproduced in failing tests and corrected. A later review found global browser clearing omitted server collections and expiry was lazy; regression tests now verify clear-all and scheduled expiry, with global UI clearing integrated and refused during active jobs. The same check command exercises rejection paths and planted missing-origin/missing-quote checks.

MEASURED: Codex CLI 0.155.1 is invoked without a shell in an isolated scratch working directory, read-only mode, minimal environment and broad tool-feature disables. Process groups are terminated on timeout/oversized output. One exact startup warning that code-mode host is disabled is tolerated; other unexpected error/tool items reject. The integration is version-pinned. Successful synthetic and real-comment runs produced structured output without tool events. This is observed behavior, not proof of the absence of every native tool capability.

MEASURED: deferred analysis and metadata tests reproduce expiry during active work. Independent active-job tracking prevents clear-all from reporting success while work remains active, and post-await session checks prevent expired evidence from being returned. The fresh reviewer confirmed these findings closed, with no remaining blocker identified within that review's scope.

## Applicable reference items

| Reference | Applies / control or reason |
|---|---|
| A01 | Applies: loopback Host and exact Origin, no cross-origin write/model route. |
| A02 | Applies: fixed route/host/configuration allowlists; version-pinned classifier. |
| A03 | Applies: no added packages; locally installed CLI is an explicit runtime dependency. |
| A04 | Applies: external HTTPS; local loopback HTTP exception documented. |
| A05 | Applies: text rendering, serialized stdin, shell:false and strict model schema. |
| A06 | Applies: bounded samples, timeouts, manual analysis and evidence review. |
| A07 | Applies: source OAuth and existing Codex authentication; no app account system. |
| A08 | Applies: original hashes and derived index integrity; source/model data validation. |
| A09 | Applies: no raw comments, source tokens or process output in application logs. |
| A10 | Applies: safe errors and fail-closed model output, no positive fallback. |
| API1 | Applies: unguessable temporary session IDs; local-only service. |
| API2 | Applies: source tokens are explicit and transient; no shared hosted authentication. |
| API3 | Applies: strict public output fields, no raw author names or source credentials. |
| API4 | Applies: body/page/batch/session/process/response bounds and cooldowns. |
| API5 | Applies: explicit same-origin POST actions only. |
| API6 | Applies: analysis only on explicit action, one classifier process at a time. |
| API7 | Applies: fixed HTTPS providers and redirect rejection. |
| API8 | Applies: no public binding, no permissive CORS. |
| API9 | Applies: version 1 action contract documented. |
| API10 | Applies: source and model output validated independently. |
| LLM01 | Applies: comments are data; no intended tool use; execution surfaces disabled. Residual CLI capability caveat above. |
| LLM02 | Applies: selected public text only, redaction and token exclusion; user-facing provider disclosure. |
| LLM03 | Applies: locally installed CLI pinned; no downloaded models/packages. |
| LLM04 | Applies: classification evidence reviewed; no training or feedback ingestion. |
| LLM05 | Applies: exact ID/enum/field/quote checks; no generated code or HTML execution. |
| LLM06 | Applies: bounded classification only; no agent action workflow exposed. |
| LLM07 | Applies: prompt contains no secrets; prompt secrecy is not a security boundary. |
| LLM08 | Not applicable to new analysis: original embeddings are preserved, not queried by this pipeline. |
| LLM09 | Applies: visible source quotes, supplied-versus-new label distinction and uncertainty notice. |
| LLM10 | Applies: explicit action, 24 pairs, 40,000 characters, two minutes, 1 MB output. |
| ASI01 | Applies: source text cannot define application actions. |
| ASI02 | Applies: tool features disabled and unexpected tool events reject; residual caveat above. |
| ASI03 | Applies: no source credentials in model input/environment. |
| ASI04 | Applies: CLI version pin and strict response boundary. |
| ASI05 | Applies: no generated code execution, read-only sandbox and fixed argv. |
| ASI06 | Applies: ephemeral sessions; no model-written memory is ingested. |
| ASI07 | Not applicable: no inter-agent communication in the product pipeline. |
| ASI08 | Applies: bounded one-process jobs, failures preserve pending evidence. |
| ASI09 | Applies: quotes and pending labels prevent presenting raw shares as endorsed results. |
| ASI10 | Applies: process deadline, group termination and no autonomous scheduling. |
| C1–C10 | Apply: local access, HTTPS, validation, prior design, secure defaults, pinned CLI, existing auth, browser headers, safe logs and fixed outbound hosts respectively. |
| CWE-79/20/22/78/94/434/502/918/770 | Apply: text-only output, schema/bounds, no input paths, no shell/eval, existing bounded imports, JSON-only data, fixed destinations and resource limits. |
| CWE-352/862/863/200/306/639 | Apply: same-origin gate, local scope, no sensitive API output and opaque session IDs. |
| CWE-89/787/416/125/120/476/122/119/190/77 | No new native memory, SQL or interpreter-command implementation; dependency risk remains in the runtime/CLI. |
| Privacy P1–P10 | Apply: input protections; no raw logs; existing incident guidance; explicit analysis action; provider disclosure; one-hour memory lifetime and clear; pending/uncertainty labels; ephemeral jobs; existing saved-ID export/delete; data minimization. |
| ASVS L1 | Applies to validation, access boundary, browser safety, communications, secrets, errors and data handling; hosting/accounts are outside this local architecture. |

No new training, payment, cloud deployment, mobile binary, IoT or CI/CD service was added. Their corresponding standards are not applicable to this change. Public release/history cleanup remains a separate owner decision.

## Copilot subscription adapter, 2026-11-07

The existing L1 applicability map remains. Additional boundaries: same-origin explicit login/test → provider manager → pinned official CLI/protocol → GitHub OAuth and model service → exact-quote validator. C1/C3/C5/C7, API2/API4/API8, LLM01/02/05/06/10 and ASI02/03/04/05/06/10 apply through OAuth-only checks, allowlisted environment, bounded frames/process lifetime, disabled tools/hooks/discovery/memory, fixed model and no paid API fallback. Unlike the Codex adapter, this connector does not claim an OS filesystem sandbox around inference; it removes model tools and rejects capability requests. The process retains local-user privileges.

GitHub manages OAuth storage, which may use the OS keychain or a plaintext fallback in the dedicated ignored profile. Never commit that profile. CLI credit limits are soft; GitHub billing configuration controls overage. No actual Copilot account/model analysis is certified by deterministic or signed-out probes. New code adds no payment processing, hosted identity system or storage schema. [Connection contract and verification limits](COPILOT_SUBSCRIPTION.md).
