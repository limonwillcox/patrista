# Clavis checklist provenance

Working list of authors and works to fill in original language + English.

## Source

- `data/clavis-coverage/` — seminary-survey Clavis Clavium OA extract
- 258 authors, 5,117 work/fragment rows
- OA: https://clavis.brepols.net/clacla/OA/

## Not this list

- `data/clavis-extract/` (9,699 A–Z Authors/Saints names + Personae scrape) is out of scope.
- Empty rows are not added to `catalog.json` / `server/englishWorks.ts`.
- This folder is a working checklist. It is not wired into the site.
- Six survey authors have no work rows in the dump (Anastasius bibliothecarius,
  Aristides, Dionysius Areopagita, Eusebius papa, Gregory III, Leo I). They stay
  on the author list with 0/0 until works are added to `works.jsonl`.
- `work_id` can repeat across authors (shared / see-also rows). The checklist
  row is `(author_id, work_id)`.

## Kept vs refused from Clavis

- Keep: author name, work title, clavis id, OA URL, our checkoff + file paths.
- Refuse: editions, manuscripts, incipits, bibliography, revision history.
- English titles are conventional when known, otherwise a literal of the Latin.

## Y/N columns (every work)

| Field | Meaning |
|-------|---------|
| `hasEnglishText` | Raw English file exists (1:1) |
| `hasOriginalText` | Raw original-language file exists (1:1) |
| `formattedEnglish` | English is split/readable for the shelf |
| `formattedOriginal` | Original is split/readable for the shelf |
| `englishTagged` | English has verse/topic tags |
| `originalTagged` | Original has verse/topic tags |

Export: `data/clavis/tasks.csv` (Y/N). Import that into a spreadsheet or GitHub project.
Do not create one GitHub issue per row unless you mean ~5,117 issues.

## How to update

1. Land a 1:1 text under `Fathers/`.
2. Set the matching Y/N fields on that row in `works.jsonl`.
3. Run `python3 scripts/clavis-checklist.py regen`.


## Full CPG / CPL list (`data/clavis/full/`)

Every work in Clavis Clavium that carries a CPG or CPL number, for the translation checklist.
The whole folder is git-ignored: the repo is public, and committing it would republish the list.
The same keep / refuse rule applies: ids, Latin titles, numbers, and the category / author / group
path. No editions, manuscripts, incipits or bibliography.

| File | Meaning |
|------|---------|
| `works.jsonl` | One line per CPG / CPL work. `group` is Genuina / Spuria / Dubia …; `onPatrista` is the English file when the site has it. |
| `checklist.csv` | The works as a spreadsheet, with empty "English exists elsewhere" and "Notes" columns to fill in. |
| `browse/` | Raw A–Z browse of all ~43,600 works in all six claves. |

A bracketed number such as `CPG-[1931]` is how Clavis marks a withdrawn or moved number.

How it was made:

1. `pnpm clavis:browse` reads the Works A–Z browse, 20 works a page (about 2,200 pages).
   It waits 1 s between pages, keeps one session, and backs off 5 minutes when the site says
   "Turnaway". A finished letter is skipped on a re-run.
2. `pnpm clavis:checklist` writes `works.jsonl` and `checklist.csv`. It finds the author in each
   path by matching the 9,699 person names in `data/clavis-extract/authors/`.

"Open access" on the Clavis site means free to consult. It is not a licence to republish the whole
database, so this folder is a working list. The site shows only the numbers of works it hosts.

## Site labels (`site-labels.json`)

The CPG / CPL numbers shown on each work's page on Patrista, keyed by English source file.
`pnpm clavis:labels` builds it from `works.jsonl` `translationPath` matches plus the corrections
in `site-labels-manual.json`. `server/workClavis.ts` reads it.
