# Frontend maintenance contract

The frontend cleanup preserves behavior, appearance, stored formats, MIT licensing and account/API boundaries. Modules are separated by responsibility, not a line-count target. No dependencies are added.

Characterization runs the application with deterministic DOM, storage, time and network fixtures. It covers navigation, player lifecycle, saved/hidden videos, confirmations, channel changes, settings and stale-tab refusals. Browser layout verification complements the DOM fixture; it is not simulated by that fixture.

Extraction follows separate dependency preparation and literal move checkpoints. CSS fragments preserve their original cascade order. Private baseline hashes and browser evidence stay outside the published repository. Run `npm run check` before every checkpoint.

## Extracted responsibilities

- `ui/feedback-panel.js` owns notices and pending confirmations. It receives safety readers and translation; it has no access to keys or storage.
