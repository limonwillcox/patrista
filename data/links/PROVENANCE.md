# Link-store provenance

Filled 2026-09-11. Schema: `docs/DATA_CONTRACT.md` and `src/links/` (there is no `server/links/`).

No CatenaBible crawl. No neuu-org/bible-commentaries-dataset. No ACCS / IVP excerpts.

## 1. Historical Christian Faith Commentaries-Database

- Source: https://github.com/HistoricalChristianFaith/Commentaries-Database
- Artifact: compiled Release sqlite `commentaries.sqlite` (tag `latest`, published 2026-09-08, 149 MB)
- Cached at `data/links/cache/commentaries.sqlite` (gitignored — do not commit)
- License: public-domain dedication for the compilation and public-domain excerpts (ANF/NPNF/CCEL and similar). The repo also carries a fair-use notice for some modern excerpts; those are not used here.
- Ingest: `node scripts/links/ingest-hcf.mjs`
- This pass: Matthew, Mark, Luke, John, Romans only
- Mapping: HCF father folder names matched **exactly** to `scripts/links/map-authors.json` catalog ids
- Rows whose father is not in our catalog are reported as orphans (Aquinas, Bede, CS Lewis, Cyril of Alexandria, …)
- `sectionId` is null (verse-keyed). Catalog `workId` is stored when `source_title` maps; otherwise a slug of the title. No paragraph indexes invented.
- `provenance=hcf`, `confidence=1`, `status=verified`
- Some HCF excerpts are Catena Aurea quotations under the Father (`source_title` = "Catena Aurea by Aquinas"). That is Newman/Aquinas public-domain catena material already in HCF, not a third scrape.

## 2. e-Catena (Peter Kirby / earlychristianwritings.com)

- Source: https://www.earlychristianwritings.com/e-catena/
- Stated size: 12,517 ANF allusions (not always commentary)
- Access dump: `database.zip` → `e-catena.mdb` (2002). The MDB is a linked-table shell (`[e-Catena].Verse/Chapter/Book/…`) with **no local rows**. Queries "Gospels in Apostolic Fathers" and "Paul in Irenaeus" are empty shells.
- Used instead: the public HTML index for Matthew, Mark, Luke, John, Romans (105 chapter pages), cached at `data/links/cache/ecatena/html/` (gitignored)
- License: Kirby’s site compilation of public-domain ANF footnote allusions. Pointer + work title + short excerpt.
- Ingest: `node scripts/links/ingest-ecana.mjs`
- `provenance=ecatena`, `confidence=0.7`, `status=verified`

## 3. Handmade fixture (already in the store)

- `data/links/fixtures/matthew-16-18.json`
- `provenance=anf-fn`, `status=verified`
- Kept when HCF / e-Catena are merged

## Filters

Dropped if `source_url` or `source_title` matches ACCS, InterVarsity/IVP, catenabible.com, or neuu-org/bible-commentaries-dataset.

## This pass vs remaining

See `node scripts/links/report.mjs` and `data/links/REPORT.txt`. Gospels + John + Romans ingested. ~30k further mapped HCF rows remain on other books (Psalms, Isaiah, Acts, 1 Corinthians, Genesis, …). Rest of the e-Catena NT was not downloaded.
