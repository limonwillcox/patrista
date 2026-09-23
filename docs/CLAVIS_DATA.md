# Clavis relational text store

English and original texts hang off Clavis works by foreign key. Clavis scrape sources stay read-only. This store is a mirror: import a JSONL export, attach a text by `work_id`, serve metadata from D1 and bodies from R2.

GitHub Pages stays the static UI. No AWS.

## Nesting

```
authors 1—* works 1—* work_texts
```

`works.parent_work_id` is a nullable self-FK for Clavis tree nodes that are themselves works (a book under a collection). `work_texts` identifies a body by the composite primary key `(work_id, language)`.

| Table | Role |
| --- | --- |
| `authors` | `author_id`, Latin name, optional detail URL, `letter_bucket` (A–Z from the first Latin letter, else `#`), `imported_at` |
| `works` | `work_id`, `author_id` FK, nullable `parent_work_id` FK, Latin title, optional designated title, `clavis_codes` JSON, `path_json` JSON, detail URL, `kind`, `imported_at` |
| `work_texts` | `(work_id, language)` PK, `language` `english` \| `original`, title, `status` default `draft`, `r2_key`, `source_path`, `content_sha256`, `byte_size`, `updated_at` |

Schema: `data/clavis/schema.sql`.

A Clavis export row looks like:

```json
{"author_id":"553436765CE645E3BBE5B69EBC2B87D1","authorNameLatin":"Acacius Constantinopolitanus","work_id":"6F4F6BC373DE46C0B5C6093B651B0EAE","titleLatin":"Epistula ad Petrum Alexandriae","clavis":["CPG-5991","CPG-9123"],"parent_id":"3AA7F34816089C4AAD0899479D8FD2EE","path":["Genuina"],"detailUrl":"https://clavis.brepols.net/clacla/OA/Details.aspx?id=6F4F6BC373DE46C0B5C6093B651B0EAE","kind":"work"}
```

Import upserts authors and works. It does not write scrape files. `parent_work_id` is set only when that parent row exists in `works`. A grouping id that was not exported (the Acacius `Genuina` node in the fixture) stays `NULL`. `path_json` still keeps `["Genuina"]`. Re-import is safe: the same `author_id` / `work_id` updates in place and does not delete `work_texts`.

Augustine example: `work_id` `E84EBB53FD524B8F8CD332CC55C805D1`, title `Retractationes`, author `Augustinus episcopus Hipponensis`. The fixture author id is synthetic. The work id is the Clavis id.

## D1 vs R2

| | D1 `CLAVIS_DB` | R2 `CLAVIS_TEXTS` |
| --- | --- | --- |
| Holds | authors, works, work_texts metadata | UTF-8 body bytes |
| Key | SQL primary keys | `clavis/texts/{work_id}/{language}.txt` |
| Does not hold | multi-MB bodies | Clavis catalogue rows |

Local sqlite (gitignored): `data/clavis/clavis.sqlite`.

Local body mirror (gitignored): `data/clavis/bodies/{work_id}/{language}.txt`.

`work_texts.r2_key` points at the R2 object. The sqlite file never contains the body.

## Pack and import

The catalogue spine checked into git is `data/clavis/imports/works-by-author.jsonl` (one Clavis work per line). `data/clavis/imports/authors-expanded.jsonl` fills `authors.detail_url`. Neither file is a scrape source; import only reads them.

```bash
pnpm clavis:import -- data/clavis/imports/works-by-author.jsonl data/clavis/clavis.sqlite --authors data/clavis/imports/authors-expanded.jsonl
pnpm clavis:pack
node scripts/clavis/attach-text.mjs \
  --work E84EBB53FD524B8F8CD332CC55C805D1 \
  --language english \
  --status ready \
  --title Retractations \
  --file data/clavis/fixtures/retractationes-english.txt
```

`clavis:import` and `clavis:pack` both apply `data/clavis/schema.sql` and upsert JSONL (one object per line, `#` comments allowed, or a JSON array). Pack does not drop `work_texts`. Attach refuses a `work_id` that is not already in `works`.

The same `work_id` sometimes appears under two authors in the export. Upsert keeps the last row. That cross-listing is why a title can sit on an unexpected author after import.

Tiny fixture: `data/clavis/fixtures/works.jsonl` and `data/clavis/fixtures/retractationes-english.txt`.

Scripts use `node:sqlite` `DatabaseSync`, same as `scripts/links/pack-sqlite.mjs`.

## First English tranche

`scripts/clavis/attach-english.mjs` maps `Fathers/English/**/*.txt` onto imported works. A row becomes `status=ready` only when the folder's author tokens and the Latin title hit exactly one work, and exactly one file claims that work. A reviewed standalone row in `data/clavis/imports/batch-001-promote-plan.json` may choose between two files of the same work (the Pilkington Confessions file is the one kept).

These stay off `ready`:

- two or more Clavis works share the title
- two files claim one work and the plan does not pick one
- the extract contains more than one work (volume dumps, shorter-and-longer Ignatius, catechetical lectures that continue into the mystagogic lectures)
- the plan marks the path as a collection section (`match: collection`)
- the title exists, but the stored author is a cross-list (Novatian, *De cibis iudaicis*, is stored under Tertullian)

A trailing block of `file:///ccel/` cache lines is stripped before the body is hashed. The bytes are still not stored in D1. Local copies go to `data/clavis/bodies/` (gitignored). The committed record is:

- `data/clavis/seeds/work-texts.jsonl` — `work_texts` metadata for the ready rows
- `data/clavis/reports/english-attach.json` — ready rows and every skip, with a reason

```bash
pnpm clavis:attach-english -- --report data/clavis/reports/english-attach.json --seed data/clavis/seeds/work-texts.jsonl
pnpm clavis:attach-english -- --dry-run
```

Re-running attach upserts the same `(work_id, language)` rows. Board label moves are not part of this import.

Staged bodies attached with `attach-text`, rather than a `Fathers/English` volume, are listed below. The bodies stay gitignored; the seed lines are the committed record.

- Issue #160: Chrysostom, *Ad illuminandos catechesis 1* (`84D990F10C594432B98F2B7720BC8D75`), "First Instruction to Catechumens". sha256 `0c063da13b5c0e8824e16f8095103471e8ae12e16fd485eeca63199cfac489b3`, 28572 bytes.
- Issue #150: Chrysostom, *Ad illuminandos catechesis 2* (`CBEB3672B73940E4ABEFFB72CF7F80C5`), "Second Instruction to Catechumens". sha256 `295bb627c982b69522fe3d1aa37321fbb4f3d618fc75995ac2e1b53fe3968a05`, 32575 bytes.
- Issue #124: Gregory Nazianzen, *De XIV luminibus iuxta Nazianzeni recensionem* (`99397283D8804F49A9F053C06D79114C`, CPG-3094), "Oration on the Holy Lights". sha256 `0059129718395301566f35d33716ad800cc4a78732f227ef7a34078d3fb6dc2b`, 33159 bytes.
- Issue #105: Gregory Nazianzen, *Ad Aegyptum in aduentu domini in Hierosolymas* (`9A4671890F0F4D17B10501321F88E559`, CPG-3115.1), "On the Arrival of the Egyptians". sha256 `5c361a2282d481528202a02a8f85cf90d1de227300f8e27cf5bada21fd450396`, 17887 bytes.
- Issue #116: Gregory Nazianzen, *De baptismate et de puritate* (`852554E9B5584DDBA5FCBF0FE2023387`, CPG-3113.2), "The Oration on Holy Baptism". sha256 `fe720e82d48b0c43f479959348e40ab9f28dc66f1a069b12fca144c130bcad54`, 83654 bytes.
- Issue #8: Augustine, *Ad Donatistas post collationem siue Contra partem Donati post gesta* (`12E4B8193BDC4A8C97B8549A3CF39F68`, CPL-338), "The Correction of the Donatists". sha256 `71650f991da761e2fd95640c5b8d5516ec5fb76a17a7f74b975c8f6685219083`, 89982 bytes.

## Formatting English board

The Formatting English board may treat a work as having English only when both are true on `work_texts`:

1. `language = 'english'`
2. `status = 'ready'`

`isEnglishReady` in `server/clavis-api.ts` is that check. `GET /api/clavis/works/:id` and `GET /api/clavis/authors/:id/works` include `english_ready`, computed only from those rows.

A file under `Fathers/English/` does not open the gate. Flat English folders are the legacy corpus. They are not a `work_texts` row and they are not `status = ready`. Draft English stays off the board. `language = original` never satisfies the English gate. `source_path` is provenance, not a substitute for the gate.

## Worker API

Wired from `server/clavis-api.ts` into `server/donate-worker.ts`. Bindings in `wrangler.toml` are comments until the resources exist. Donate, fixes, and the Bible proxy are unchanged.

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/clavis/authors` | `{ authors: [...] }` |
| GET | `/api/clavis/authors/:id/works` | `{ author, works }` with `texts` and `english_ready` |
| GET | `/api/clavis/works/:id` | `{ work }` |
| GET | `/api/clavis/works/:id/text?language=english` | `text/plain` body from R2. `language` defaults to `english`. |

Missing `CLAVIS_DB`: **503** JSON `{ "error": "Clavis database is not connected. Bind D1 CLAVIS_DB." }`.

Missing `CLAVIS_TEXTS` on the text GET (database is bound, metadata row exists): **501** JSON `{ "error": "Clavis text bucket is not connected. Bind R2 CLAVIS_TEXTS." }`.

## Cache

Ready text GET sets `Cache-Control: public, max-age=86400` plus an `ETag` of `content_sha256`. Draft text GET sets `Cache-Control: private, no-store`. Metadata JSON sets `Cache-Control: public, max-age=300`. Errors are `no-store`.

The browser and Cloudflare cache the Worker response. GitHub Pages does not serve these bodies. D1 is not a body cache.

## Create the Cloudflare resources later

Do not run these as part of a code change. After they succeed, uncomment the matching blocks in `wrangler.toml` and fill `database_id`.

```bash
npx wrangler d1 create patrista-clavis
npx wrangler d1 execute patrista-clavis --remote --file=data/clavis/schema.sql
npx wrangler r2 bucket create patrista-clavis-texts
```

Upload a body to the key stored on the row, for example `clavis/texts/E84EBB53FD524B8F8CD332CC55C805D1/english.txt`. D1 should keep foreign keys enabled (D1 default).

Still out of scope here: rewriting `englishWorks.ts`, moving board labels, and creating the live D1 database or R2 bucket. The English attach above is the first ready tranche, not every file under `Fathers/English/`.
