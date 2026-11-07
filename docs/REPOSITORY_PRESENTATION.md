# Repository presentation decisions

Reviewed 2026-11-07. These projects informed presentation choices, not implementation or copied content:

- [FreeTube](https://github.com/FreeTubeApp/FreeTube): clear navigation between screenshots, features, downloads and contribution guidance. Applied: a short README navigation row and a separate My channels preview.
- [Open WebUI](https://github.com/open-webui/open-webui): distinguishes local model connections from cloud APIs and links detailed configuration guidance. Applied: a connection matrix and a dedicated provider guide, with PersonalTube's narrower supported endpoints stated explicitly.
- [Immich](https://github.com/immich-app/immich): uses direct documentation/demo links and a capability table. Applied: an honest demonstration caption, requirements table and links to support/verification rather than an unsupported live demo promise.

Existing MIT licensing, Karpathy/HackerTube data attribution, DEEDA asset notices, contribution rules, issue forms and security reporting remain. No upstream wording, screenshots, graphics, code, popularity badges or sponsorship claims were copied.

## My channels screenshot

The preview uses public examples supplied by the project owner, in an isolated browser fixture. It is labelled an illustrative mixed-date selection, not a live last-week feed. Original titles, channel names, durations and dates were checked on public YouTube pages. The fixture does not modify the bundled catalog or any user's actual subscriptions. UI generation uses the app's card renderer; the demo-only date selector is visibly labelled.

Examples: [Chase AI](https://www.youtube.com/watch?v=RVeCbPg0liw), [Stanford Online](https://www.youtube.com/watch?v=g50FHC-PzK8), [Nate Herk](https://www.youtube.com/watch?v=jqoFP9QapXI), [Tina Huang](https://www.youtube.com/watch?v=rPGJhrunbxo), plus videos from [Andrej Karpathy's channel](https://www.youtube.com/@AndrejKarpathy/videos). These choices illustrate personal subscriptions, not independent recommendation scores or endorsements of PersonalTube by the creators.
