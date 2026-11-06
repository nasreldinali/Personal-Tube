# Attribution and licensing

## HackerTube collection

`data/hackertube/videos.jsonl` and `taxonomy.json` are retained unchanged from the supplied HackerTube export. `DATA.md` in that directory preserves the original export schema documentation, including descriptions of optional files not distributed in this source tree.

Sources: [HackerTube](https://hackertube.org/about), [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news). The source collection identifies [Open Data Commons Attribution License 1.0](https://opendatacommons.org/licenses/by/1-0/). Preserve attribution when reusing the data. Video content, trademarks and external linked material retain their respective owners' rights.

This repository uses the supplied data export, not Karpathy's original application/server source. It is an independent project, unaffiliated with YouTube, HackerTube or their owners.

The derived `data/hackertube/evidence.json` preserves original stance labels, bounded redacted excerpts and comment permalinks; it is not a new independent source. Live Stack Exchange content retains source links and its applicable CC BY-SA attribution requirements. Live third-party comments stay in memory and are not redistributed as a new committed dataset.

## Fonts and brand assets

Bundled fonts retain their accompanying notices in `public/assets/fonts/OFL.txt`, `NotoKufiArabic-OFL.txt` and `README.md`. DEEDA marks and design assets are included for this application. Their inclusion does not grant a general right to reuse the brand.

## Application code

Original PersonalTube application code and documentation are licensed under MIT; see [LICENSE](LICENSE). This grant does not replace the separate terms for the HackerTube/open-index data, third-party excerpts, bundled fonts, videos, or DEEDA marks/design assets described above. Screenshots illustrate the application and may contain third-party video imagery; they do not grant rights to reuse that video content or branding. Preserve the applicable notices when distributing a fork.
