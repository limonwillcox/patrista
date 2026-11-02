# Connections data

The data behind the Connections tool: patterns in Scripture found from several signals that must agree.
How to read symbols: `docs/symbolic-grammar/METHOD.md`. The vocabulary: `docs/symbolic-grammar/GRAMMAR.md`.

## What the reader sees

The Connections tab in the Bible reader (`src/components/ConnectionsPanel.tsx`) follows the reader's last
action:

- **Double-click a word**: where else it appears (with its Greek or Hebrew equivalent), and which of those
  verses the Fathers cite most.
- **Click a verse**: the Fathers who cite it, the types they draw from it, and its patterns.
- **Select a passage**: the same, with links from several verses grouped into larger patterns.

A pattern is a passage elsewhere that this one links to, by shared Hebrew and Greek words or by the Fathers
citing both in one paragraph. Links landing within a few verses of each other form one pattern. Patterns
sort by how many signs agree, and each is marked:

- **strong**: a type the Fathers name, two or more Fathers citing both, or a Father and shared words together;
- **moderate**: one Father citing both, or shared words that weigh 9 or more (rare words count for more);
- **weak**: a few common words.

Shared words alone stop at moderate. Sampled by hand, about a third of the high-scoring word-only links
were chance (two genealogies sharing "concubine, begat"). Several verses linking to several verses raise
a pattern a step. The rule is `findPatterns` in `src/components/ConnectionsPanel.tsx`.

The chart above shows the links as arcs from Genesis to Revelation; drag to move, zoom with the buttons,
a double-click, a pinch or Ctrl + scroll. Following a pattern opens it in the tab without moving the
reader; back and forward walk the trail. A star saves a connection (browser storage), and each verse,
passage and word has a note (the same notes as the Journal, `src/lib/readerNotes.ts`).

Clicking a type the Fathers draw opens it in the tab: its meaning, how it points to Christ, the Fathers' own
words, and every passage in it, joined on the chart from first to last (`public/connections/types.json`).

The site search is Scripture-aware too (`server/scriptureIndex.ts`, `src/api/scripture.ts`): a query finds
the KJV verses behind it, then the chapters of the Fathers that cite those verses, ranked by citations and
by how closely the chapter works through that passage.

## The rule for types

A type is on the site only because the Fathers drew it. We never name one ourselves, and nothing is added
because it seems plausible. A type needs:

- **At least two Fathers**, each cited from a passage in this library that draws the figure (not just
  mentions the Old Testament story), with a link to the reader chapter.
- **Faithful quotations.** A quotation must be found in the chapter it links to. Case, punctuation, cuts
  marked "…" and small differences of wording are allowed; a paraphrase without quotation marks needs
  only its link.
- **"In Christ" in the Fathers' terms:** the line saying what the type points to names a Father it cites.

Our own words appear only in the short label and the one-line description of the Old Testament thing.
`tests/typesRule.test.ts` checks every added type against this rule. The older entries in `sources.json`
(from the study notes) were checked once against the whole library: all 312 of their quotations are in it


New types go in `grammar/fathers-types/<slug>.json`, one file each, not in `sources.json` (which
`extract_sources.py` rewrites from the private notes). Both build steps read the folder.

The list is not complete. It holds the types found in the Fathers so far; more are added as they are
found and checked.

## Pipeline

Run from the repo root. Each step is plain Python 3 with no packages. `pnpm connections:build` runs
them all (about a minute).

| Step | Command | Makes |
|---|---|---|
| Word layer | `python -I scripts/connections/build_word_layer.py` | `connections.sqlite` (git-ignored) |
| Witnesses | `python -I scripts/connections/build_witness.py` | tables `witness`, `cited`, `witness_curated` |
| Site data | `python -I scripts/connections/pack_public.py` | `public/connections/` (one file per chapter) |
| Types from the Fathers | `python -I scripts/connections/extract_sources.py <notes folder>` | `grammar/sources.json` (only when the notes change) |
| Links for the quotations | `npx tsx scripts/connections/link_type_quotes.ts` | `grammar/type-links.json`: each quotation's paragraph in the reader (when a type or the library changes; run before Site data) |

The reading notes behind `sources.json` are private study notes. They quote copyrighted books, so they
stay outside the repo. `sources.json` keeps locations (chapter, page, URL) and drops those quotations;
it keeps the Fathers' quotations, which are public domain.

## The signals

1. **Shared words.** Verses that share Hebrew or Greek words, from the KJV's Strong's tags in
   `public/strongs/`. A word also reaches its Septuagint Greek equivalent and the word it derives from.
   Rare words weigh more than common ones; grammar words ("and", "upon") are left out.
2. **The Fathers** (`build_witness.py`), from the per-Father folders in `Fathers/English`, reading the
   references in the text and the editors' footnotes:
   - *Cited*: every verse each Father cites (13,488 verses).
   - *Cited together*: two passages cited in one paragraph of at most 8 references, not in the same story.
   - *Types*: the typological links recorded from the Fathers by hand (`sources.json`, entries `04:*`).

## Retired

The story-shape matcher, the whole-Bible 3D map and the symbol entries were taken out of the site
(Nov 2026) to keep the tool simple. The symbolic grammar stays in `grammar/` and
`docs/symbolic-grammar/` (`build_grammar_doc.py` regenerates the doc). Tuning showed the automatic shapes barely beat chance (agreement with the Fathers' types
0.58, where 0.5 is guessing), while shared words reached 0.72. The scripts are still in
`scripts/connections/` (`auto_tag.py`, `scan_patterns.py`, `match_shapes.py`, `combine_evidence.py`)
with their data (`stories/`, `shape-matches.json`, `story-evidence.json`, `shape-params.json`), but
nothing runs them.

## Known limits

- **KJV tagging undercounts common Hebrew words.** *'owd* ("still, again") occurs about 490 times in
  Hebrew but is tagged in 30 verses, so it looks rare. Fix: a fully tagged Hebrew text (STEPBible
  TAHOT, CC BY) in place of the KJV tags.
- **Strong's numbers merge homonyms.** H2560 covers both "daub with pitch" and "foam, roar".
- **The Fathers' citations come from references only.** A Father who alludes to a verse without a
  reference or footnote is missed: Genesis 22:2 (the sacrifice of Isaac) shows one citation.
- **A word is not a meaning.** Shared words point to passages worth reading together; the reader judges
  whether the meaning is shared.
