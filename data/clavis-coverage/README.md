# Clavis coverage ledger (Patrista / Piblia)

Seminary-survey Clavis Clavium OA extract for building a works coverage checklist into the site.

## Scope

- ~258 authors (ANF/NPNF / Quasten-class + historians / heresiologists / early popes)
- Latin titles from Clavis OA `#MainContent_OAObjectTree_pnlChildren`
- Not full texts — identifiers + titles + clavis numbers + tree path (Genuina/Spuria/…)

## Files

| File | Rows | Meaning |
|------|------|---------|
| `allowlist-expanded.jsonl` | 258 | Author spine: `author_id`, `nameLatin`, `detailUrl`, `letterBucket` |
| `authors-expanded.jsonl` | 258 | Same spine as the allowlist (byte-identical copy) |
| `author-summaries.jsonl` | 258 | Per author: `category` (none/single/multiple), `workCount`, fragment flags |
| `works-by-author.jsonl` | 5117 | Work rows: `work_id`, `titleLatin`, `clavis[]`, `path[]`, `kind` |

## Notes

- The A–Z Authors/Saints spine (~9.7k) and the earlier Personae scrape live in `data/clavis-extract/`. This folder is the smaller survey ledger only.
- Source: https://clavis.brepols.net/clacla/OA/
