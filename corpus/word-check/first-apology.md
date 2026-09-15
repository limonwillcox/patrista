```text
work: first-apology
range: 1-68
verdict: FAIL
wordsPiblia: 21013
wordsNewAdvent: ~21000
extraInPiblia: trailing CCEL next-work slug in ch. 68 ("justin_martyr second_apology … The Second Apology http://www.ccel.org/ccel/schaff/anf01.viii.iii.html")
missingInPiblia: (none — opens on the address to Antoninus; ends on the appended imperial letters, which New Advent also prints in ch. 68)
wordingDiffs: ye/you; NA modernizes spelling (Cæsar/Caesar) and injects encyclopedia/Bible-link tokens — not meta
proposedFix: parse-time drop of CCEL catalog lines (e.g. endAt /justin_martyr second_apology/ or strip /^\s*\S+ \S+ anf\d+/i / ccel.org URLs). Keep Adrian / Antoninus / Marcus Aurelius copies — they are on NA 0126.htm ch. 68.
```

New Advent: https://www.newadvent.org/fathers/0126.htm
Shape: 68 chapters. Opens “To the Emperor Titus Ælius Adrianus Antoninus Pius…”. Ch. 68 is Justin’s close plus the Hadrian rescript and the Antoninus / Marcus Aurelius letters, then “About this page.” No Schaff intro, no Elucidations, no `_____` in the parsed stream. FAIL is the glued Second Apology CCEL pointer only.
