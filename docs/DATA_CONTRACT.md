# Scripture ↔ Fathers link store

One table, two lookups. No UI. No CatenaBible / ACCS scrape. Citations are not invented.

CrowdVote is deferred — not in this store.

## BibleRef

```ts
type Canon = "ot" | "nt" | "dt";

type BibleRef = {
  bookId: string;      // Bibles/KJV/manifest.json id (gn, mt, jo, …)
  bookNum: number;     // 1-based index in that manifest (Genesis 1, Matthew 40)
  canon: Canon;        // ot = books 1–39, nt = 40–66; dt reserved
  chapter: number;
  verseStart: number;
  verseEnd: number;
  locStart: number;    // chapter * 1_000_000 + verseStart
  locEnd: number;      // chapter * 1_000_000 + verseEnd
};
```

A verse `ch:vs` hits a ref when `bookId` matches and `locStart <= loc(ch,vs) <= locEnd`.

## Link

```ts
type Provenance = "hcf" | "ecatena" | "catena-aurea" | "anf-fn" | "crowd";
type LinkStatus = "verified" | "crowd" | "rejected";

type Link = {
  id: string;
  sectionId: string | null;  // Bible pericope, e.g. mt.16.peters-confession
  workId: string;
  fatherId: string;
  workTitle: string;
  excerpt: string;
  sourceUrl: string;
  sourceWork: string;
  deathYear: number;
  century: number;           // 1–6
  provenance: Provenance;
  confidence: number;        // 0–1
  status: LinkStatus;
  refs: BibleRef[];          // verse spans this excerpt treats
};
```

Century = `ceil(deathYear / 100)` clamped to 1–6.

Rejected rows are stored but omitted from lookups.

## Lookups

- Verse → Fathers: `getLinksForVerse(bookId, ch, vs)` then `getTreeForVerse` → `CenturyNode[]` (century → father → work → excerpt).
- Father-tagged section → verses: `getLinksForSection(sectionId)` then `getTreeForSection` → `TestamentNode[]` (canon → book → refs).

## On disk

`data/links/links.sqlite` if present, else `data/links/links.json`.

SQLite table `links`: Link columns plus `refsJson` (JSON array of BibleRef).

JSON: `{ "links": Link[] }`.

Pack: `node scripts/links/pack-sqlite.mjs` (JSON → sqlite).
Ingest fixture: `node scripts/links/ingest-fixture.mjs`.

Golden fixture: `data/links/fixtures/matthew-16-18.json`.
