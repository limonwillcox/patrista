```text
work: concerning-widows
range: 9-15
verdict: FAIL
wordsPiblia: 6415
wordsNewAdvent: ~6300
extraInPiblia: trailing Schaff editor note in ch. 15 after §90 — "Note on the Letters of St. Ambrose." plus two Benedictine/selection paragraphs (~109 words: 91 Epistles, "Only a few are here presented to the reader")
missingInPiblia: (none of this shard — opens ch. 9 §52 “You have learnt, then, you who are widows…”; Father text ends §90 “Take care, then, my daughter, lest you be both unable to hold fast the grace of marriage, and also increase your own troubles.”)
wordingDiffs: learnt/learned, thou/you, liveth/lives, forthwith/immediately, corn/grain, amongst/among; NA inline verse refs and encyclopedia-link tokens — not meta
proposedFix: parse-time endAt /^\s*Note on the Letters of St\. Ambrose\.?\s*$/im on concerning-widows (SPEC_OVERRIDES). Keep §90 close; do not ingest the Letters preface.
```

New Advent: https://www.newadvent.org/fathers/3408.htm (single page, 15 chapters; this shard is ch. 9–15). Opens “You have learned, then, you who are widows…”. Ends §90 on holding the grace of marriage, then “About this page.” No Schaff intro, no Elucidations, no `_____` / `[1234]` in the parsed stream. FAIL is the glued Letters note only.
