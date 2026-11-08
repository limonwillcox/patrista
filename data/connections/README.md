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

- **strong**: a type two or more Fathers draw, two or more Fathers citing both, or a Father and shared words
  together;
- **moderate**: a type one Father draws, one Father citing both, or shared words that weigh 9 or more (rare
  words count for more);
- **weak**: a few common words.

Shared words alone stop at moderate, however many verses share them. Sampled by hand, about a third of the
high-scoring word-only links were chance (two genealogies sharing "concubine, begat"; Psalm 23 and Matthew
23:24 sharing "guides, cup"). Several verses linking to several verses raise a pattern a step, but never
lift a word-only pattern to strong. The rule is `findPatterns` in `src/lib/connectionPatterns.ts`.

The chart above shows the links as arcs from Genesis to Revelation; drag to move, zoom with the buttons,
a double-click, a pinch or Ctrl + scroll. Following a pattern opens it in the tab without moving the
reader; back and forward walk the trail. A star saves a connection (browser storage), and each verse,
passage and word has a note (the same notes as the Journal, `src/lib/readerNotes.ts`).

Clicking a type the Fathers saw opens it in the tab: its group, the Fathers who saw it, their own words, and
every passage in it, joined on the chart from first to last (`public/connections/types.json`).

On the Types page (`/types`) each type says how many Fathers drew it: the different Fathers among its
citations (`fatherNames` in `src/lib/connectionPatterns.ts`). "Follow" walks a type as a trail
(`/types?type=<slug>&stop=<n>`): its passages from Genesis to Revelation, one at a time, each with the KJV
text and a Father's line when the quoted paragraph cites that passage, ending at what it points to in
Christ (`src/lib/typeTrail.ts`).

The site search is Scripture-aware too (`server/scriptureIndex.ts`, `src/api/scripture.ts`): a query finds
the KJV verses behind it, then the chapters of the Fathers that cite those verses, ranked by citations and
by how closely the chapter works through that passage.

## The rule for types

A type is on the site only because the Fathers saw it. We never name one ourselves. The list
(`typology/approved.json`) was found by reading the library, not chosen:

1. **Find.** Every paragraph, in English, Latin and Greek, that uses a word for a figure ("type", "figure",
   "shadow", *typus*, *figura*, *umbra*, τύπος, σκιά…) is a candidate (`scripts/connections/find_type_candidates.ts`,
   4,739 paragraphs).
2. **Read.** Each candidate was read for the types its Father names as his own (not one he reports or
   rejects): the thing in Scripture, what it foreshadows, and his words. Every quotation was checked against
   its paragraph by script; a claim whose words are not there was dropped (4,034 claims kept).
3. **Group.** The claims were grouped into types (one thing foreshadowing one thing) and each type counted
   by the different Fathers who saw it: 1,578 types.
4. **Clean and approve.** The 219 types two or more Fathers saw were cleaned by hand (duplicates merged;
   general statements such as "the sacrifices of the Law", fulfilments and parables dropped), filed in six
   groups, and approved: 160 types.

`scripts/connections/build_fathers_types.ts` turns the list into the site's entries
(`typology/types.json`), and `pack_public.py` publishes them. Each entry carries:

- **The Fathers' words**, at most two per Father, each linked to its paragraph in the reader. A Latin or
  Greek quotation has no English paragraph: it is shown in a machine translation, marked as one, with the
  original.
- **Its passages**: the ones its claims name, and up to three verses of the other Testament that one of
  its own quoted paragraphs cites and that two or more Fathers cite together with the type's passage
  (`witness` in `connections.sqlite`). 89 types have both ends and are drawn as arcs; 71 have their own
  passage only and are found by name.
- **Our words** only in the short label ("The bronze serpent → the crucifixion") and the group.

`tests/typesRule.test.ts` checks every quotation's link and form. The list is not complete: a Father who
draws a type without a figure word ("as Isaac carried the wood, so Christ…") is not found yet, and types
one Father saw are not on the site.

## The Fathers' gatherings: the colours of the types map

A colour on the map is a Father's own gathering: one passage of his (a chapter in the reader) where he names
five or more of the types together, as Justin does in *Dialogue* 111 or Basil in *On the Holy Spirit* 14.
They are computed from the types' quotations (`src/lib/typeGatherings.ts`), listed in the Father's own
order, and run through history by his death.

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
