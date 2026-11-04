# API usage and channel loading

Acceptance before implementation:
- Settings shows estimated requests recorded in this browser today, used/remaining against Google's default limits. Separate general list units (10,000/day) and search calls (100/day), per official quota documentation checked 2026-11-04. Reset at midnight America/Los_Angeles, including daylight saving changes.
- Counts include attempted requests, including errors; exclude playback and invalid local input. No keys, channel IDs, comments or URLs stored in the meter. No claim of a live project balance; other clients, earlier usage, custom quotas and simultaneous tabs without Web Locks can differ. Storage failure shows unavailable, not a fabricated zero.
- Persist a bounded versioned daily aggregate, excluded from backups and cleared with personal data. Meter storage events must not trigger stale-tab protection. Use Web Locks when available for concurrent tabs.
- Adding a channel has its own loading state, independent from background feed updates. A stalled request/body has a hard 15-second deadline. Adding must not trigger an immediate scan of all channels; auto mode may fetch only the new channel, manual mode waits for explicit refresh. Protect state against deletion/key changes during pending work.
- RED regressions, deterministic tests, full existing gate, browser UI checks and independent security review. Preserve bilingual responsive styling and all refresh preferences.

MEASURED: public/app.js used global busy for add-button text and ran refresh() after addition; public/data/youtube.js relied on transport cooperation with AbortSignal.timeout. INFERRED: these explain misleading or prolonged loading, but the user's live connection still needs verification.

Source: https://developers.google.com/youtube/data/determine_quota_cost (updated 2026-11-03). Current docs specify a separate 100/day search bucket; do not use the older 100-general-units-per-search assumption.

## Delivered interfaces and review

MEASURED: `YouTubeClient` retains its key/fetcher constructor arguments and adds an optional third `{onRequest(resource)}` observer. The observer runs once per validated request attempt, including paginated requests and failures. A 15-second hard deadline covers observation, fetch and response JSON; no automatic retry is added. All four app client construction paths use the shared metered factory.

MEASURED: `YouTubeUsage(storage, clock, locks)` exposes `record(resource)` and `snapshot()`, which returns `{day, units, search}` or null when unavailable. `personaltube.youtube-usage.v1` stores JSON version 1 with those aggregate fields; `personaltube.youtube-usage-incomplete.v1` stores one Pacific calendar-date string. Both are cleared with personal data and excluded from backups. Storage events for these two keys repaint without invalidating other tabs. Current count and remaining are estimates against the default limits, not enforcement or billing information.

Independent review confirmed and corrected two defects: an unrecorded contended-tab request could leave other tabs showing incomplete totals; a cache-only refresh could reject a pending addition. The shared incomplete-day marker now hides that day's numeric estimate across tabs/reloads, with in-place recovery the next day. Channel additions compare the captured channel-list identity and key, allowing cache-only commits while refusing late additions after channel changes or key replacement.

Changed boundaries reviewed: browser storage and DOM (A05/C3/C8/CWE-79: validated counts, safe text rendering); credentials/privacy (A04/P10/CWE-200: no credential fields or identifying request data); external request limits (A10/API4/CWE-770: hard deadline and bounded pages); integrity (A08: pending-add and incomplete-meter guards). Existing project applicability matrices remain in force; no new model, process, authentication, payment, cloud or dependency boundary. ASVS Level 1 remains a review target, not certification.

## Evidence

- RED artifacts: `.local/api-usage-red.txt`, `.local/channel-timeout-red.txt`, `.local/channel-loading-red.txt`. Review follow-up `.local/review-usage-red.txt` explicitly labels the isolated pre-fix reconstruction because production fixes had already landed before those regressions were saved. Next-day recovery failed before the day-scoped correction.
- GREEN: 158 deterministic tests and 26 deliberate defect plants pass. New plants detect a missing usage hook, missing shared incomplete marker, missing pending-add guard and disabled hard deadline. Independent re-review passed 26 focused tests with no remaining blocker.
- Browser: isolated local fixture origin added a channel and fetched its video with exactly 3 recorded units; a deliberately stalled channel request ended with the 15-second message, re-enabled Add, and increased the attempt count to 4. Reload retained 4. No real API key or model allowance was used.
- UI: English/light mobile 390px and tablet 820px, Arabic/dark desktop 1280px checked without horizontal overflow. Production browser warning/error logs were empty; screenshot stored outside the repository. The actual user's saved-key connection was not reverified this turn.
