# Patrista pickup — end of day 2026-09-29

Prompt B is done and on `main`. Stop here for today. Next session starts at prompt C, and only after reading the questions below.

## Where main is

- Repo: `limonwillcox/patrista`. Local checkout: `C:\Users\sictrai_user03\Downloads\patrista`.
- `origin/main` is `99b9d17` — `Merge PR #228: Add provenance fields and block ready texts that lack a source`.
- That merge contains `9e4c4a3`, `b6e5232`, and `e3bd61b`.
- PR: https://github.com/limonwillcox/patrista/pull/228 (merged).
- This note is committed so it can be read from GitHub. Local branch `cursor/clavis-reader-8b3e` had no commits of its own at shutdown. Do not treat that name as a started reader change.

## What landed

- `work_texts` has `translator`, `edition`, `edition_year`, `source_url`, `license`, and `quality` (`ocr-raw | needs-cleanup | partial | clean | verified`). `status` stays `draft | ready`.
- Fresh databases get the columns from `data/clavis/schema.sql`. Older databases take `data/clavis/migrations/0001_text_provenance.sql`, then `0002_ready_quality_clean.sql`. Applied ids are stored in `schema_migrations`. Do not run `0001` against a database created from the current schema.
- New rows default to `quality=needs-cleanup`. Rows that were already `ready` and still `needs-cleanup` became `clean` in `0002`. Only a person sets `verified`. No script sets it.
- A ready attach requires `source_url` and `license`. English also requires `translator`. The only ready texts that may omit a translator are original-language texts, or rows whose translator is `anonymous` or `n/a`. No other exceptions.
- `scripts/clavis/backfill-provenance.mjs` stays as a tool. There is no `data/clavis/provenance-backfill.csv` and none will be added. If the file is missing, the command prints a note and exits 0 without changing rows. Provenance on existing rows was left empty on purpose.
- When a CSV is passed, backfill fills only empty English fields. `--force` prints each ready-row replacement (`force ready <work_id> <field>: ...`) before it writes.
- `/api/clavis` returns the raw fields plus `attribution`.
- `.pnpm-store/` is gitignored.
- Windows path renames, using ` - ` (space hyphen space):
  - `Fathers/Flavius Josephus/The-Works-of-Flavius-Josephus - An-Index`
  - `Fathers/Latin/Augustine_Latin/On the Creed - A Sermon to Catechumens.txt`
- `On the Creed - A Sermon to the Catechumens.txt` is a different file. Do not collapse them. Work titles may still contain a colon.
- `vite.config.ts` strips CLI shebangs before Vitest collects `scripts/clavis/*.mjs`. That fix is on `main`.

## What the next session does

Order from `patrista-final-prompts.md`: (1) every text in Clavis, (2) the site reads from it, (3) format, (4) tag.

| Prompt | Who | State |
| --- | --- | --- |
| A. CI | Codex | Not this session's job. Local worktree `.worktrees/ci-pr-checks` is `cursor/ci-pr-checks-a93f` at `1f86f6d`. Not checked today. |
| B. Provenance and Windows paths | Grok Build | Done. Merged. |
| C. Import every `Fathers/` text into Clavis | Codex, or whoever picks up tomorrow | **Start here.** B has merged. |
| D. Site reads from the database | AGY | Do not start until C has merged. |
| E. Phone | Codex | Hold. Do not start phone work. |
| P10 cleanup, P5 cutover, P2, P3, P6–P9 | — | Paused by the final prompts. |

Prompt C, from the final prompts, still needs Liam's answers before coding:

1. Latin and Greek both stored as `language=original`, or add a script column?
2. Unmatched files: create new Clavis works, or report only?
3. Commit `data/clavis/reports/import-report.csv`, or keep it local?

The planned script is `scripts/clavis/import-fathers.mjs`. Read `data/clavis/schema.sql`, `data/clavis/migrations/`, `scripts/clavis/*.mjs`, `server/corpus.ts`, `server/englishWorks.ts`, and the `Fathers/` layout first. Import as `status=draft` and `quality=needs-cleanup`. Never overwrite a `status=ready` row. Skip an identical sha256. Ambiguous and unmatched files are reported, not guessed. Bodies stay out of sqlite: `data/clavis/bodies/{work_id}/{language}.txt`. Do not edit `data/clavis/imports`.

## Do not touch

- Liam asked for #228 and for this pickup note to be merged. The standing rule for the next feature PRs is still: one draft PR, Liam merges.
- Do not force-push, reset, rebase, or amend without asking.
- Do not run `wrangler create`, upload, or deploy. Worker stays `piblia` (`server/donate-worker.ts`).
- Do not restyle UI.
- Do not commit these local files: `docs/pibliaios-audit.md`, `patrista-final-prompts.md`, `patrista-phone-team.md`, `patrista-web-team.md`, `HANDOFF.md`, `HANDOFF-2026-09-29.md`, or `patrista-phone-handoff.md`. This pickup note is the one that belongs on `main`.
- Do not commit `.pnpm-store/` or a truncated `Fathers/` directory left behind by an old colon path.
- Leave draft PR #227 (`cursor/pibliaios-audit-7f2a`, `051341d`) as it is.
- `C:\Users\sictrai_user03\Downloads\patrista-cleanup-audit` is `cursor/cleanup-audit-c8d2` and its upstream is `origin/main`. It is behind `main`. Do not push it. A bare `git push` there would target `main`.
- `.worktrees/monorepo-core` and `.worktrees/clavis-client` are also still at `e98706f`.

## How to test on this machine

`gh` is not installed. Draft PRs go through the GitHub API with `git credential fill`. Never print the token. PowerShell `ConvertTo-Json` corrupts a PR body; send the body with Node `fetch` and `JSON.stringify`.

`package.json` uses Unix `NODE_OPTIONS=...`, which fails in cmd.exe. In PowerShell:

```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"; pnpm exec vitest run
$env:NODE_OPTIONS="--max-old-space-size=8192"; pnpm exec tsc --noEmit; pnpm exec vite build
```

If Vite reports `ENOTEMPTY` on `dist\api`, delete `dist` and run the build again.

Last full run on this branch's tests: 178 passed, 3 failed. Those three were already failing before the provenance work:

- `tests/bibleRemote.test.ts` accepts bible id `../etc`
- `tests/churchHistory.test.ts` looks for `treatises-of-cyprian`
- `tests/shelf.test.ts` looks for the title `On "Not Three Gods" (To Ablabius)`

`tests/clavis-provenance.test.ts` and `tests/clavis.test.ts` passed (21).

## Docs already in the repo

`docs/CLAVIS_DATA.md` matches the merged behavior, including the missing-CSV exit.
