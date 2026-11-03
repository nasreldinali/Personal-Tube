# DEEDA fonts

The three DEEDA typefaces, unmodified, under the SIL Open Font License 1.1.
That license allows using them in apps and websites, embedding them, and keeping them in a repository.

| File | Family | Weight used | CSS `font-weight` mapped to it |
|---|---|---|---|
| `Inter-Regular.ttf` | Inter 4.001 | 400 | `400` |
| `Inter-Bold.ttf` | Inter 4.001 | 700 | `600 800` (labels 600, bold 700, eyebrow 800) |
| `Montserrat-Bold.ttf` | Montserrat 9.000 | 700 | `700` |
| `Montserrat-ExtraBold.ttf` | Montserrat 9.000 | 800 | `800` |
| `NotoKufiArabic-Variable.ttf` | Noto Kufi Arabic 2.109, variable | 100–900 | `100 900` |

Where they come from (all downloaded unmodified on 9 September 2026):
- Inter and Montserrat: Google Fonts (fonts.gstatic.com).
- Noto Kufi Arabic: https://github.com/google/fonts/tree/main/ofl/notokufiarabic
  SHA-256 `494f6b61469d7a02a2d63f0fc4930bb007388d8cfe551de5eb98354e100889f3` (checked when copied here).

Licenses:
- `OFL.txt`: Inter (Copyright 2016 The Inter Project Authors) and Montserrat
  (Copyright 2011 The Montserrat Project Authors). Its first lines also mention
  Noto Sans Arabic, which was in the original download but is not used by DEEDA.
- `NotoKufiArabic-OFL.txt`: Noto Kufi Arabic (Copyright 2022 The Noto Project Authors).

Keep the license files next to the fonts whenever you copy them into another project.

Used by:
- `../tokens/deeda.css` (the `@font-face` rules at the top load these files by relative path).
- `../DEEDA_BRAND_IDENTITY.html` (embedded when the guide is built).
