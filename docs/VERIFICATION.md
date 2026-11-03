# Verification

Reviewed: 2026-11-03.

## Automated checks

`npm run check` passes 55 Node tests and detects six deliberate defects in isolated scratch copies: backup byte budget, strict community source validation, foreign Host refusal, key exclusion from backups, stale-tab refusal and stale-refresh refusal. It also checks JavaScript syntax, project-specific formatting, import cycles, domain boundaries, asset presence and source/brand SHA-256 integrity. This is not a general linter, coverage report or formal security certification.

The same check also passes in a clean temporary copy without `.git`, `.local` or historical records.

The retained real catalog loads 6,454 videos and 16 areas with source taxonomy version `405edcef`. Unused exports are not required. All retained source files and copied brand assets match their pre-cleanup hashes.

## Responsive browser checks

Measured in a desktop browser with viewport overrides, not on physical iOS/Android hardware:

| Width | Expanded sidebar | Collapsed sidebar | Horizontal overflow |
|---|---|---|---|
| 390px | 1 column | 1 column | None |
| 768px | 2 columns | 2 columns | None |
| 820px | 2 columns | 2 columns | None |
| 1024px | 2 columns | 2 columns | None |
| 1200px | 3 columns | 4 columns | None |
| 1600px | 3 columns | 4 columns | None |

Arabic/dark was checked at all sizes. English/light was checked at all except 820px (820px was additionally visually inspected in light mode). Sidebar controls, card readability and sticky filters were inspected. The initial defect was reproduced at 1600px: expanded sidebar incorrectly yielded four columns. It now yields three.

Responsive layout does not make the loopback server reachable from another device. Physical phone/tablet access needs a separately designed hosting or network arrangement. Live YouTube-key requests and Premium account recognition were not exercised in these checks.

## Repository privacy review

An independent review scanned all 109 reachable blobs in the initial history for common Google/GitHub/AWS/Slack credential patterns and PEM private keys; none matched. Synthetic test secrets are fixtures. The current source tree was also checked for common credentials and absolute user-home paths, with no matches. Pattern matching cannot prove the absence of every secret.

The initial commit contains a personal author/committer email; historical development records contain local filesystem paths. The unused upstream full-comment archive also includes email-like strings from public comments. Those records and unused exports are excluded from the current tree but remain in earlier history. This cleanup does not claim to erase previously uploaded data. Future commits use the owner's GitHub no-reply address.

The remote was verified private, with one main branch, no tags, no releases and no Actions artifacts at review time. Keep it private until historical privacy, distribution rights and application licensing have been reviewed. Rewriting published history is a separate owner-approved action; changing visibility was not part of this delivery.

Private development evidence and the preserved unused exports live only in ignored `.local/` in the owner's working folder. Fresh checkouts do not need them. No API key, browser backup or full private brand folder is required to build or test.
