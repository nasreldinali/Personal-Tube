# Frontend maintenance contract

Historical delivery record: MIT references below describe the license at that time. The owner subsequently adopted Apache License 2.0 on 2026-11-07; see the current [LICENSE](../LICENSE) and [attribution boundaries](../NOTICE.md).

The frontend cleanup preserves behavior, appearance, stored formats, MIT licensing and account/API boundaries. Modules are separated by responsibility, not a line-count target. No dependencies are added.

Characterization runs the application with deterministic DOM, storage, time and network fixtures. It covers navigation, player lifecycle, saved/hidden videos, confirmations, channel changes, settings and stale-tab refusals. Browser layout verification complements the DOM fixture; it is not simulated by that fixture.

Extraction follows separate dependency preparation and literal move checkpoints. CSS fragments preserve their original cascade order. Private baseline hashes and browser evidence stay outside the published repository. Run `npm run check` before every checkpoint.

## Extracted responsibilities

- `ui/feedback-panel.js` owns notices and pending confirmations. It receives safety readers and translation; it has no access to keys or storage.
- `ui/video-player.js` owns active playback, embed construction, saved controls and iframe cleanup. Library/metadata are read at action time.
- `ui/channel-manager.js` owns channel/category editing and add-request state. A pending addition checks current channel identity and key identity before saving. Background refresh never owns the add spinner.
- `ui/settings-panel.js` owns key-entry presentation, refresh drafts and estimated quota display. Persistence is injected and key fields still empty when the dialog closes.
- `ui/data-transfer.js` owns validated backup import/export and reset confirmations. Transactional persistence stays in BrowserStore; temporary community deletion still completes before personal data is cleared.
- `ui/library-actions.js` owns selection, hide/restore and watch-later/watched actions. Saved metadata is written before library flags; selection restores keyboard focus.
- `ui/library-feed.js` owns filters, feed rendering and pagination. Auxiliary panels are refreshed through a composition callback in their original order; selectors read current state on every action.
- `ui/navigation-panel.js` owns route transitions, sidebar collapse, language/theme application and the search shortcut. App state remains owned by the composition root.
- `data/feed-updates.js` owns the browser refresh schedule and metadata requests. It reads current revisions and refresh policies, meters requests and commits through the unchanged refresh service/result contracts.

## Stylesheets

`public/styles.css` is an ordered import entry. Its 23 fragments preserve the original rule and responsive-override sequence. Do not merge base and later overrides by selector without checking their cascade. Brand tokens load first and remain unchanged. Every fragment has an explicit static route and CSS MIME type. Tests read the composed stylesheet through `test/stylesheet-fixture.js`, which rejects missing imports, cycles and external paths.

## Static markup

The HTML remains a static document. Formatting changes preserve parsed element order, attributes and text-bearing inline contents; no runtime templates or HTML interpolation are introduced. DOM workflow tests and real-browser layout comparisons cover the formatted document.

## Confirmed unused rules

After literal extraction, 14 application-only rules (50 lines) for `.d-ctl`, `.d-ctls` and `.community-live-filters` were removed with owner approval. Current HTML/JavaScript has no producers, and all six rendered views plus dialogs contained no matching elements. Supplied brand tokens remain untouched. An unused DOM import introduced in the refresh adapter extraction was also removed; that adapter depends on injected UI callbacks.

## Verification and rollback

MEASURED: the final check passes 207 tests and 37 deliberate-defect detections. Browser comparisons cover 42 responsive cases, 60 language/theme/viewport cases, six view DOM comparisons and 18 dialogs. See [verification scope](VERIFICATION.md). Factory bodies retain their extraction hashes; source/brand integrity checks remain in the normal check command. UI factories are internal package interfaces, not a versioned plugin API; stored and HTTP formats retain their existing versions.

Preparation and literal moves are separate focused commits. Revert the relevant commit through normal Git history to roll back; do not reset user storage, rewrite published history or change repository visibility.
