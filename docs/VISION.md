# Patrista: the north star

**Patrista helps you see Scripture as one story, with the Fathers as your guides.**

Every feature must pass one test: does it help a reader *see a pattern*, with a Father showing the way?

Other sites answer a different question: "what did everyone say about this verse?" That question gives a
page of 200 quotations, and the reader drowns. Patrista answers "how does this passage belong to the
whole, and which Father saw it?"

The way of reading comes from James Jordan's *Through New Eyes* and the Theopolis school: Scripture is one
patterned world, with garden, mountain, water, bride, exile and return recurring from Genesis to
Revelation. The Fathers were the first great readers of those patterns. Jordan gives the frame; the
Fathers give the content. Patrista never names a type itself (see `data/connections/README.md`).

## Four rules

1. **Three kinds of thing.** Patrista has passages, Fathers and types. A good feature is a new door into
   those three. A feature that adds a fourth kind of thing (accounts, votes, symbols we invented) needs a
   very strong reason.
2. **One question per screen.** A screen shows one passage, one Father, one type, one day. More is one tap
   away, never on screen by default.
3. **One feature at a time, finished.** A feature is finished when it is built, used and quiet. Start the
   next one after that.
4. **Retire what does not earn its place.** Write down what was cut and why, as with the story-shape
   matcher and the 3D Bible map (`data/connections/README.md`, "Retired").

## Doors into the three things

| Door | What it shows | State |
|---|---|---|
| Fathers shelf and reader | A Father's works, chapter by chapter | Built |
| Real manuscripts | The work as a scribe wrote it, before the generated book | Built (Nov 2026) |
| Bible with Connections | A passage, the Fathers who cite it, its patterns | Built |
| Types map | Every type as arcs over the line of the Bible: calm at rest, explored by pointing, zooming and dragging; the Fathers' own gatherings (a passage where one Father names five or more types) as its colours; a chapter or one Father as other ways in | Built (Nov 2026) |
| Trails | One type followed through Scripture, one stop at a time; the map flies to each stop | Built (Nov 2026) |
| Tabernacle | The tabernacle at true size, and its echoes of creation; reached from Exodus 25–40 on the types map | Built (Nov 2026) |
| Church history | The Fathers in their centuries | Built |

## Decided against

- **Votes on connections.** A vote measures what is popular. Patrista's standard is "a Father drew this,"
  which can be checked. Votes would also need accounts and moderation. (Nov 2026)
- **A Bible-in-a-year reading plan.** Many sites already have one, so it would not be a door that only
  Patrista has. Patrista should build what no other site has: trails, types, the tabernacle. (Nov 2026)
- **Suggested types from readers.** Not now. If the site needs it later: a form where the reader gives the
  Father's quotation and chapter, the types test checks the quotation, and the editor approves. (Nov 2026)
- **A grid of type cards.** Seventy-eight cards of equal weight gave the reader no place to start. The types
  map replaced the grid, the kind chips and the book menu. It is flat, not 3D: the whole-Bible 3D map was
  retired earlier to keep the site simple. (Nov 2026)
- **Types and themes we named ourselves.** The first map had 78 types gathered from study notes and grouped
  into seven themes chosen by hand (and by AI). Neither could be checked. The types are now the 160 that two
  or more Fathers saw, found by reading every paragraph of the library that uses a word for a figure, and the
  colours are the Fathers' own gatherings (`data/connections/README.md`, "The rule for types"). (Nov 2026)
