# Clavis coverage ledger (Patrista / Piblia)

Seminary-survey Clavis Clavium OA extract for building a works coverage checklist into the site.

This is a **coverage spine**, not a text corpus: identifiers, Latin titles, clavis numbers, and tree path only.

## Scope

- 258 authors (ANF/NPNF / Quasten-class + historians / heresiologists / early popes)
- 5117 work/fragment rows (5020 `work`, 97 `fragment`; 4742 rows carry at least one clavis id)
- Latin titles from Clavis OA `#MainContent_OAObjectTree_pnlChildren`
- Source: https://clavis.brepols.net/clacla/OA/

## Files

UTF-8 JSONL, one object per line.

| File | Rows | Meaning |
|------|------|---------|
| `allowlist-expanded.jsonl` | 258 | Author spine |
| `authors-expanded.jsonl` | 258 | Same bytes as `allowlist-expanded.jsonl` (kept so either filename works) |
| `author-summaries.jsonl` | 258 | Per-author rollup |
| `works-by-author.jsonl` | 5117 | Work / fragment rows |

Join key across files: `author_id`.

## Schema

**Author spine** (`allowlist-expanded.jsonl` / `authors-expanded.jsonl`)

- `author_id` — Clavis OA person id
- `nameLatin` — Latin display name
- `detailUrl` — OA Details page
- `letterBucket` — A–Z scrape bucket
- `source` — extract provenance (`expanded_seminary`)

**Author summaries** (`author-summaries.jsonl`)

- `author_id`, `authorNameLatin`, `letterBucket`
- `category` — `none` / `single` / `multiple` (6 / 134 / 118)
- `workCount`, `fragmentCount`, `has_fragment`
- `topPaths` — optional counts by tree label (`Genuina`, `Spuria`, `Vide et`, …)
- `allowlist` / `expanded` — optional membership flags

**Works** (`works-by-author.jsonl`)

- `author_id`, `authorNameLatin`
- `work_id` — Clavis OA object id
- `titleLatin`
- `clavis` — string array of CPG / CPL / etc. ids
- `parent_id`, `path[]` — OA tree (Genuina / Spuria / …)
- `detailUrl`, `kind` — `work` or `fragment`
- `allowlist` / `expanded` — optional membership flags

## Out of scope

Letter-A full dumps, earlier Personae scrapes, bot scripts, and author-queue files are not in this commit.
