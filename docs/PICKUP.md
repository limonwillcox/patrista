# Where to pick up (2026-09-29)

Stopped for the day. Do not start the next stage from this note. Read `patrista-final-prompts.md` and ask Liam before coding.

## Repo

- `origin/main` is `99b9d17` — **Merge PR #228: Add provenance fields and block ready texts that lack a source.**
- Local `main` matches that commit.
- This working tree is on `cursor/clavis-reader-8b3e`, which points at the same commit and has no commits of its own and no remote. It is not a started reader. Next session: `git checkout main` and branch from latest `origin/main`.
- Prompt files in the repo root (`patrista-final-prompts.md`, `patrista-web-team.md`, `patrista-phone-team.md`) are untracked on purpose. Do not commit them.
- `docs/pibliaios-audit.md` is also untracked here. The committed copy is on `cursor/pibliaios-audit-7f2a` (draft PR #227). Do not add it to another branch.

## Done: stage 1a (prompt B)

Merged in #228. Provenance lives on `work_texts`: translator, edition, edition year, source URL, license, and quality (`ocr-raw`, `needs-cleanup`, `partial`, `clean`, `verified`).

Liam's answers, now in the code:

- No `found-batches.md`. It will not be added. Backfill reads `data/clavis/provenance-backfill.csv`. That CSV is **not in the repo yet**. Liam said he would commit it separately. If the file is missing, `scripts/clavis/backfill-provenance.mjs` prints a note and exits 0 (`e3bd61b`).
- Rows that are already `ready` and still `needs-cleanup` become `clean` in `data/clavis/migrations/0002_ready_quality_clean.sql`. Only a person sets `verified`.
- A text can be `ready` with no translator only when `language` is `original`, or the translator is `anonymous` or `n/a`. English still needs `source_url` and `license`.
- `--force` may replace a filled field. On a `ready` row it prints `force ready <work_id> <field>: ...` before it writes.
- `.pnpm-store/` is gitignored.
- These two paths no longer contain `:`:
  - `Fathers/Flavius Josephus/The-Works-of-Flavius-Josephus - An-Index`
  - `Fathers/Latin/Augustine_Latin/On the Creed - A Sermon to Catechumens.txt`

Details: `docs/CLAVIS_DATA.md`.

## Next, from the final prompts

Order is still: every Fathers text in Clavis, then the site reads from it, then format, then tag. Paused until stages 1–2: P2, P3, P5–P9, and the whole phone team.

| Prompt | Who | When |
| --- | --- | --- |
| A. CI (`required-ready`, Node 22) | Codex | A worktree already exists: `cursor/ci-pr-checks-a93f` at `C:\Users\sictrai_user03\Downloads\patrista\.worktrees\ci-pr-checks`. Do not start a second CI branch. |
| B. Provenance | Grok | Done. On main. |
| C. Import every `Fathers/` text into Clavis as `draft` / `needs-cleanup` | Codex | **Unblocked.** B has merged. See prompt C in `patrista-final-prompts.md`. |
| D. Site reads from Clavis, flag default `fathers` | AGY | After C merges. Includes `docs/cloudflare-runbook.md`. Do not run wrangler. |
| E. Phone | Codex | Hold. Do not start M4 or any phone work. |
| Stage 3 formatting, stage 4 tagging | later | After D. AZMO drafts the formatting rules. |

Still in force: one branch `cursor/<slug>-<4hex>`, one draft PR, Liam merges. Never push to main, never force-push, never rewrite history without asking. Do not touch `data/clavis/imports`. Worker stays `piblia`. Free tier only. Do not restyle UI.

## Known test and Windows issues (not fixed)

`package.json` `test` and `build` use bash-style `NODE_OPTIONS=...`. In Windows `cmd`, `pnpm test` fails before Vitest starts. The suite was run as `node --max-old-space-size=8192 node_modules/vitest/vitest.mjs run`. On 2026-09-29 that was 177 passed, 3 failed, in code this provenance work did not change:

- `tests/bibleRemote.test.ts` — `parseBibleRemoteQuery("../etc", "JHN.1")` is accepted. `BIBLE_ID_RE` exists in `server/bibleRemote.ts` and is not used there.
- `tests/churchHistory.test.ts` — era `decian` references `treatises-of-cyprian`, which is not in the catalog.
- `tests/shelf.test.ts` — prerender HTML does not contain the title `On "Not Three Gods" (To Ablabius)` (the file is `Fathers/English/Gregory_Nyssa_English/On Not Three Gods.txt`).

Typecheck passed. Vite build passed after moving a stuck `dist/` aside. `pnpm test && pnpm build` is still the done check, and those scripts need to run on Windows.

## PibliaIOS

Draft PR #227, branch `cursor/pibliaios-audit-7f2a`, docs only. Recommendation in the audit: archive, do not keep a second phone app, do not delete until Liam says so. Phone work is paused, so leave the folder alone. Open questions still on that PR: did Liam ever run it, archive or delete, which tabs the Expo app should use, and whether the bundle id becomes `com.patrista.app`.
