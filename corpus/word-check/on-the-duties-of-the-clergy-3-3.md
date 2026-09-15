```text
work: on-the-duties-of-the-clergy
range: 3-3
verdict: FAIL
wordsPiblia: 19787
wordsNewAdvent: ~19359
extraInPiblia: after Book III §138 (“these three books”), NPNF editor “Introduction to the Three Books of St. Ambrose on the Holy Spirit” (8 paras, 741 words: Gratian/De Trinitate/a.d. 381; Gideon–Samson–mission summaries; Jerome/Rufinus/Augustine on plagiarism). Not Father Duties text; On the Holy Spirit is a separate extract.
missingInPiblia: (none — opens on Book III ch. 1 David/Solomon counsel; 22 chapters through §138 “included within these three books,” matching NA 34013.htm. §133 skip / double §134 is in both.)
wordingDiffs: thou/you; NA modernizes spelling and injects encyclopedia/Bible-link tokens — not meta
proposedFix: SPEC_OVERRIDES endAt /^\s*Introduction to the Three Books of St. Ambrose on the Holy Spirit\.?\s*$/im (work-level cut after last book). Do not pull On the Holy Spirit.txt into this work.
```

New Advent: https://www.newadvent.org/fathers/34013.htm (index 3401.htm → Book III). Shape: 22 chapters. Opens “The prophet David taught us that we should go about in our heart…”. Ends §138 then “About this page.” No Schaff intro, no Holy Spirit sequel, no `_____` in the parsed stream. FAIL is the glued NPNF Holy Spirit introduction only.
