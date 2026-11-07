# Connection and card refinement

Historical implementation record: version-specific descriptions and counts below refer to that work. For current behavior, use the [user guide](USER_GUIDE.md), [analysis connections](ANALYSIS_PROVIDERS.md) and [latest verification](VERIFICATION.md).

Scope authorized by the user: replace intrusive card removal, shorten cards without dropping metadata, portrait Shorts with five desktop columns, and a clear functional connection dialog.

Acceptance:
- Removal is a labeled footer action with the existing confirmation and restore path; selection no longer consumes a separate card row.
- Regular cards retain title, channel, date/recommendations, topic, duration and library actions.
- The channel Shorts view uses portrait media and five desktop columns, three tablet and two phone columns. Classification remains explicitly estimated.
- Connections show YouTube separately from analysis; provider cards show connection and active-provider states with an explicit usable action. Connected accounts are selectable without another login.
- Pending login checks automatically while the dialog is open, stops on close/completion/error and is time bounded. Errors appear inline. No automatic analysis or paid request.
- Requirements and usage detail are progressive disclosures. English/Arabic and both themes remain supported.

Validation: regression tests before behavior changes, full project checks, visual desktop/mobile inspection, provider selection against the local service, independent security review of connection changes. Existing accounts are not signed out for testing.

## Delivered evidence

- Regression RED: connecting authenticated Claude previously left Codex selected (`.local/ux-red.txt`). Queued polling past the deadline previously issued an additional request (`.local/ux-poll-red.txt`). Both now pass.
- Independent security review: no blocker. Its polling deadline finding was corrected and covered by a regression and a scratch-copy mutation.
- Live browser: existing Claude selected successfully, then Codex restored. No fresh login or real analysis was initiated; both subscriptions were already authenticated. Status counts stayed unchanged.
- Card removal opens the existing confirmation; cancel leaves the card. Regular Arabic/dark cards measured 338.6px tall at 277px width, with all metadata and four footer controls present.
- Isolated component fixture using real card code: Shorts 9:16, columns 5 at1280px,3 at820px,2 at390px; no page overflow. Fixture images are catalog samples for layout, not claims that these videos are actual Shorts. Narrow footer overflow found visually was corrected to a two-column action grid.
- Original source catalog and DEEDA assets are unchanged. No credentials or fixture state included in tracked files.
- Final full gate:133 tests and19 deliberate defects passed; no browser warning/error logs in the checked production and fixture flows. Security re-review confirmed the queued callback correction with9 focused passing tests and no remaining blocker.

## Follow-up acceptance — 1.5.2

User correction: onboarding must not repeat on reload, YouTube settings must return to setup, close controls must match, regular tiles must retain normal width with less height, bulk selection must be an explicit mode, and language/theme controls belong in the main header. Preserve existing 3/4 regular desktop columns and 5 Shorts columns. Keep the existing bounded automatic channel-refresh policy and explain it in the channel view. No automatic comment analysis.

Regression first: setup visit persisted before any dismissal/reload; nested settings return only when entered from setup; selection enters/exits cleanly and applies to visible cards only. Verify real reload, both close paths, desktop/card dimensions, RTL/light/dark/mobile header and browser errors.

Follow-up evidence: the original completion flag was only persisted by Done. RED regressions caught missing immediate persistence and missing nested-dialog return. Independent review also caught a stale private visit flag after preferences reset; that RED regression now passes by calling the app's idempotent persistence callback on every opening.

Live browser: a fresh localhost origin showed setup on first load, then a reload while setup was still open showed zero open dialogs without ever clicking Done. Both Back and close returned from nested settings to setup; ordinary settings close opened no other dialog. Selection showed18 checked cards, then17 after deselecting one; Cancel cleared all checks and hid all selection boxes. No removal was executed.

At1280px, collapsed regular cards remain277px wide and four per row; expanded cards remain324px wide and three per row. Measured first-row height decreased from338.6px to311.9px at277px width. Header and selection bar fit390px and820px without horizontal overflow. English/light and Arabic/dark were visually inspected. Fresh-origin and main browser error/warning logs were empty. Channel refresh policy remains30-minute cached checks plus manual force refresh; no new network or analysis policy was introduced.

Final follow-up gate:137 tests and20 deliberate defects pass. Independent re-review confirmed the preference-reset correction; no remaining blocker.
