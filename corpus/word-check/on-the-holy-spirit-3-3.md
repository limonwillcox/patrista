```text
work: on-the-holy-spirit
range: 3-3
verdict: FAIL
wordsPiblia: 20248
wordsNewAdvent: ~20000
extraInPiblia: after Book III §170, NPNF next-work glue (~272 words): title “The Two Books of St. Ambrose … on the Decease of His Brother Satyrus,” editor Introduction (Marcellina, Satyrus d. 17 Oct. 379, funeral / resurrection discourses), Latin epitaph (Uranio Satyro …), title repeated. Piblia chs. 4–5 (out of this shard) are those two Satyrus books.
missingInPiblia: (none of Book III — opens on NA ch. 1 “In the former book we have shown…”; 22 chapters through §170 “Who searcheth the deep things of God?”)
wordingDiffs: thou/hath vs you/has; NA modernizes spelling and injects encyclopedia/Bible-link tokens; Piblia transliterates Greek (pantodunamon) where NA keeps Greek — not meta
proposedFix: SPEC_OVERRIDES endAt /^\s*The Two Books of St\. Ambrose, Bishop of Milan, on the Decease of His Brother Satyrus\.?\s*$/im, expectUnits: 3. Drops the Introduction + epitaph from this shard and unglues De excessu Satyri (current chs. 4–5).
```

New Advent: https://www.newadvent.org/fathers/34023.htm (index 3402.htm lists three books only). Shape: Book III, 22 chapters. Opens “In the former book we have shown by the clear evidence of the Scriptures…”. Ends §170 “But how will you drag Him down, Who searches the deep things of God?” then “About this page.” No Schaff intro, no Elucidations, no `_____` in the parsed Book III body. FAIL is the glued Decease-of-Satyrus heading and NPNF Introduction after §170.
