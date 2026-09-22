# Clavis extract

Open-access identifiers from [Clavis Clavium](https://clavis.brepols.net/clacla/OA/). Names, titles, and catalogue numbers — not full texts.

- **Authors/Saints spine (A–Z):** 9,699 authors in `authors/authors-*.jsonl`. I/J and U/V follow the site’s combined letter buckets. The empty `Other` bucket is omitted.
- **Personae scrape (early):** 1,384 persons (`persons.jsonl`) and 2,420 work rows (`works-by-person.jsonl`) from Personae aliae. Mostly BHL. Person-page titles only; not the full works tree.

`authors/summary.json` and `authors/progress.json` record the alphabet walk (complete). Root `summary.json`, `persons-summary.json`, `progress.json`, and `nesting-notes.md` record the Personae walk. Per-letter `progress-*.json` files and empty captures were left out.

The smaller seminary-survey ledger (about 258 authors and their works) is in `data/clavis-coverage/`.
