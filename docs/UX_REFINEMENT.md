# Connection and card refinement

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
