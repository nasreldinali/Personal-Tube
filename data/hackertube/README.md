# HackerTube source and evidence

`videos.jsonl`, `taxonomy.json` and `DATA.md` remain byte-for-byte unchanged from the supplied export. The catalog contains 6,454 videos, 16 areas and 150 categories (taxonomy version `405edcef`).

The owner copy also preserves all original comments, related-video data, embeddings, embedding IDs and prompt under ignored `original/`. These exact source bytes are checked against `source-integrity.json` before regeneration. They are retained, not replaced. Embeddings are not used by the current runtime.

`evidence.json` is a version 1 derived display index: original comment stances and bounded excerpts, source links, month precision and co-recommended video IDs. It omits comment-author names and redacts email/common credential patterns. The source catalog's existing scores remain authoritative; scores are not recomputed from the capped comment sample. Attribution and comment permalinks remain visible.

To regenerate when the complete original files are available locally:

```sh
node scripts/build-community-evidence.mjs
```

Fresh checkouts run from the included index without downloading original archives or calling a model. All runtime data and branding hashes are checked by `npm run check`. See [NOTICE](../../NOTICE.md) and [pipeline](../../docs/COMMUNITY_PIPELINE.md).
