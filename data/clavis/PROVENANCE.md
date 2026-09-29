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

