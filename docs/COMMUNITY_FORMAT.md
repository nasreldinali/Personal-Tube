# Community video-reference format

Version 1. The Communities screen accepts UTF-8 JSON or JSONL files up to 2,000,000 bytes, with at most 2,000 records/videos across enabled and disabled collections. The complete recoverable backup must also fit 2,000,000 UTF-8 bytes; oversized changes are rejected before storage is changed.

## Canonical JSON

```json
{
  "format": "personaltube-community",
  "version": 1,
  "source": "reddit",
  "videos": [
    {
      "url": "https://www.youtube.com/watch?v=REPLACE_WITH_VIDEO_ID",
      "title": "Replace with the actual title",
      "channelTitle": "Replace with the actual channel",
      "topic": "Your topic",
      "sourceUrl": "https://www.reddit.com/r/EXAMPLE/comments/EXAMPLE/"
    }
  ]
}
```

The example is a template, not a real recommendation. Replace placeholders. Supported source identifiers: reddit, huggingface, kaggle, stackexchange, commoncrawl, wikipedia. Unknown versions/source identifiers are rejected. Imports merge into one collection per provider and deduplicate video IDs; source selection can be disabled without deleting it. Removing a collection requires confirmation. Saved video IDs remain in the personal library.

## Raw extracts

A JSON array or one JSON object per line can contain `url`, `videoUrl`, `youtube_url`, `body`, `Body`, `selftext`, `text`, `content`, or a string `links` array. A direct video `id` is also supported. Only valid HTTPS youtube.com/youtu.be video links or strict video IDs are extracted. Reddit `/r/...` permalinks become source references. Optional `title`/`Title`, `channelTitle` and `topic` are bounded display text. Other fields, authors and raw comment bodies are discarded.

Source links must belong to the selected provider's allowed domains; credentials, alternate ports and unsupported protocols are refused. Query strings/fragments are removed. For Common Crawl pages outside its domain, keep attribution in the dataset and use the dataset source link; arbitrary external links are not rendered by this importer.

Large XML, WARC, WAT, Parquet, compressed archives and torrents are not opened directly in the browser. Extract the relevant video references into this format first. The app does not download archives or operate account credentials for these providers. Use only datasets you are entitled to use and retain their licenses and attribution. Presence of a link is not evidence of positive endorsement; no community vote total is fabricated.

## Availability and intended use

- Reddit: [official Pushshift access](https://support.reddithelp.com/hc/en-us/articles/16470271632404-Pushshift-Access-Request) is restricted, not a general public recommendation API. Academic Torrents distributes archives whose availability/licenses vary.
- Hugging Face: select a dataset with useful links and read its [dataset card](https://huggingface.co/docs/hub/main/datasets-cards).
- Kaggle: [dataset/API access](https://www.kaggle.com/docs/api) may require an account; import permitted extracts locally.
- Stack Exchange: the [network dump announcement](https://meta.stackexchange.com/questions/419975/the-return-of-the-network-data-dump) describes access; convert selected post/link records first.
- Common Crawl: [formats and links](https://www.commoncrawl.org/get-started) require extraction; it is not the entire web or a ready-made video recommendation feed.
- Wikipedia: use [Wikimedia exports](https://dumps.wikimedia.org/) to extract references; mentions do not imply recommendations.
- [Google Books Ngrams](https://books.google.com/ngrams/info) is word/phrase frequency data, not full books or a video corpus. It can inform a topic typed into Recommendations, so it is deliberately not offered as a video importer.
