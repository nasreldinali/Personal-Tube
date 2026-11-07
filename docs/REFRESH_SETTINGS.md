# Video refresh controls

Historical implementation record: version-specific descriptions and counts below refer to that work. For current behavior, use the [user guide](USER_GUIDE.md), [analysis connections](ANALYSIS_PROVIDERS.md) and [latest verification](VERIFICATION.md).

Authorized scope: add automatic/manual channel-video refresh and a selectable automatic interval to Settings & data, persisted in browser preferences and backups. Keep current defaults for existing users: automatic, 30 minutes.

Acceptance:
- Intervals: 15/30 minutes,1/3/6/12/24 hours. The interval chooser is disabled in manual mode and remembers its last choice.
- Manual mode suppresses scheduled, startup, visibility, reconnect, post-key-save and post-channel-add video refresh. Explicit Refresh channels still works. Resolving a newly added channel and other explicitly requested YouTube searches still use the API.
- Automatic mode uses the chosen interval for both attempt throttling and cached channel freshness. Longer intervals must not retain the fixed 30-minute cache behavior.
- Saving preferences does not force a refresh or reset successful cache times. Pending automatic work completes its current channel then stops if policy changes; no hidden catch-up burst.
- Existing settings/error handling, backups, stale-tab guards, bilingual UI and responsive layout remain supported. No model analysis is scheduled.

Verification: RED regression tests, service tests with injected clients and clocks (no live API quota), preference/backup roundtrip, browser persistence/manual-auto controls and full project gate. Independent review for consumption/storage boundary changes.

## Evidence

- RED `.local/refresh-settings-red.txt`: manual request refusal, custom freshness, between-channel cancellation and preference roundtrip initially failed. GREEN tests cover these plus exact timing boundaries, legacy defaults, invalid mode/interval values and backup import.
- Independent review identified a visible-only copy/lifecycle mismatch. RED `.local/refresh-visibility-red.txt` then correction added the central visibility gate and between-channel visibility check. Re-review passed 16 focused tests with no remaining blocker.
- Live UI: selected 6 hours, saved manual mode, reloaded and verified manual+disabled 6-hour interval persisted; switching back to auto restored 6 hours. Restored the original automatic 30-minute choice after testing. Saving works independently from the API-key form. Arabic/dark and English/light inspected, 357px and 820px showed no overflow; desktop 1280px screenshot saved outside the repository. No live YouTube or model requests were used for behavioral tests; request counts use injected clients and explicit clocks.

Final gate: 145 tests and 22 deliberate defects passed. No credentials or screenshots were added to tracked files.
