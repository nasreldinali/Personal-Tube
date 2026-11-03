# Runtime catalog

These files are retained byte-for-byte from the supplied HackerTube export:

- `videos.jsonl`: 6,454 video records, read by the local catalog repository.
- `taxonomy.json`: 16 areas and 150 categories, taxonomy version `405edcef`.
- `DATA.md`: upstream documentation; descriptions of additional export files do not imply they are bundled here.

The full mention archive, related-video neighbors, embedding vectors and embedding ID index are not used by this application and are excluded. The application can run and pass its checks without them. Retained file hashes are recorded in `../integrity.json`.

See [attribution and licensing](../../NOTICE.md).
