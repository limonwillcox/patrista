```text
work: athanasius-against-the-heathen
range: 3-3
verdict: FAIL
wordsPiblia: 4846
wordsNewAdvent: ~4890
extraInPiblia: trailing NPNF next-work title after Contra Gentes §47 — "Introduction to the Treatise" / "on the" / "Incarnation of the Word." (3 paras, 10 words). Not the De Incarnatione body (that is a separate work).
missingInPiblia: (none of this shard’s close — Piblia Part 3 opens on the body of §39 and ends on the same §47 judgment-day sentence as NA 2801.htm). NA’s “Part 3” label starts at §35; Piblia’s 40-para blob put §35–§39 heading in Part 2 — not missing Father text here.
wordingDiffs: shewn/shown, begat/begot; NA modernizes and injects encyclopedia/Bible-link tokens — not meta. §40–§47 chapter titles are not meta.
proposedFix: parse-time endAt /^\s*Introduction to the Treatise\s*$/im on athanasius-against-the-heathen so the stream stops after §47. Do not skip § headings. Do not pull in On the Incarnation.
```

New Advent: https://www.newadvent.org/fathers/2801.htm (single page, 47 numbered chapters). Part 3 there is §§35–47; this Piblia shard is the closing remainder after Part 2 (§39 body–§47). NA ends at §47 (“…their acts were contrary to their knowledge.”) then “About this page.” (Robertson / Schaff 1892). No De Incarnatione on 2801.htm. Parsed stream has no `_____`, no `[189]` footnote chrome, no Schaff editor line — FAIL is the glued Incarnation title only.
