# Word-Check agent instructions

Prove a Piblia work’s **parsed reading stream** is Father text only, using New Advent as the clean-shape reference — not as wording to copy.

Analogy: strip an NIV to raw Bible with only an NASB on the desk. Different English is fine. Meta is obvious.

## PASS / FAIL

**PASS:** the shard is the Father’s book. Thou/you, Pusey/Pilkington, Harnack `1. 2. 3.`, and chapter titles are not meta.

**FAIL** if parsed body still has **meta text**:

- decorative `_____` / long underscore rules
- editor names/dates (`Philip Schaff`, `1864`, Bryennios as *editor*, not as a word inside Father prose)
- `[1234]` footnote chrome or leftover note bodies in the reading column
- Introductory Notice / Elucidations / Translator’s Preface as body
- another work glued on (e.g. Apostolic Constitutions after Didache 16)

Extra Father sentences New Advent shortened are not automatically meta. Missing opening or ending of the work (or of this shard’s proper span) is FAIL.

## Steps

1. Load **parsed** Piblia passages for `chapterRange` from `dist/api/works/{workId}.json` (not the raw `Fathers/**/*.txt` dump).
2. Fetch New Advent HTML at `newAdventUrl`. Follow book/chapter/homily/letter subpages when the index splits. Drop NA chrome, ads, encyclopedia links, “About this page.”
3. Compare shape: start, end, chapter/book count, meta in *our* stream. Match this shard’s Piblia chapter numbers to the corresponding NA span (book/homily/letter), not necessarily NA’s numbering.
4. Write the report to `corpus/word-check/{workId}-{start}-{end}.md` and return the same text. Stop. No tags. Do not rewrite `Fathers/**/*.txt`. Do not republish New Advent HTML. Propose parse-time fixes only (`endAt`, skip heading, drop range).

## How to load parsed Piblia text

From the repo root:

```js
import { readFileSync, writeFileSync } from 'fs';
const data = JSON.parse(readFileSync(`dist/api/works/${workId}.json`, 'utf8'));
const chapters = (data.chapters || []).filter(c => c.chapter >= start && c.chapter <= end);
for (const c of chapters) {
  const paras = c.versions.schaff || c.versions.pusey || Object.values(c.versions)[0] || [];
  console.log(`\n=== ch ${c.chapter} :: ${c.heading}\n`);
  console.log(paras.join('\n\n'));
}
```

Count `wordsPiblia` on those English paragraphs (split on whitespace). Do not count Latin/Greek.

## How to fetch New Advent

- Open `newAdventUrl`. If it is an index of books/chapters/homilies, follow the subpages that cover this shard.
- Typical pattern: `3401.htm` index, `34011.htm` book 1, `34012.htm` book 2.
- Strip navigation, gumroad ads, “Please help support…”, encyclopedia cross-links, “About this page.”
- `wordsNewAdvent` is a count of the remaining body words (approximate is fine if you note it).

## Report file (exact fields)

Write `corpus/word-check/{workId}-{start}-{end}.md` as:

```text
work: <workId>
range: <start>-<end>
verdict: PASS | FAIL
wordsPiblia: N
wordsNewAdvent: N
extraInPiblia:
missingInPiblia:
wordingDiffs:
proposedFix:
```

`wordingDiffs` is optional color. Verdict turns on **meta** and **wrong work glued on**, not NIV vs NASB wording.

If this shard is only the middle of a multi-book work, judge the shard (does *this* span match NA’s corresponding book/chapters, and is it Father-only?). Still flag if a different work is glued inside the span.

## Red flags (do not do these)

- “Close enough, leave the extra work in”
- “I’ll copy New Advent’s you/your into the reader”
- “I’ll tag while we’re here”
- “No New Advent page, I’ll use Wikipedia”
- Editing `Fathers/**/*.txt`
