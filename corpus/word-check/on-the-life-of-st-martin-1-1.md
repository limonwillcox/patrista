```text
work: on-the-life-of-st-martin
range: 1-1
verdict: FAIL
wordsPiblia: 22874
wordsNewAdvent: ~12500
extraInPiblia: entire parsed Book I is the wrong work — Sacred History / Chronica Book I (NA 3505), 54 chapters, not the vita. Opens “I address myself to give a condensed account of those things which are set forth in the sacred Scriptures”; ends Sedechias / Nabuchodonosor / Godolia. Extract also contains (after the vita, not in this shard’s body) Letters (3502), Dialogues I–III (3503), Doubtful Letters, then Sacred History Books I–II (3505). Auto chunk latched onto those two Book marks.
missingInPiblia: entire NA Life of St. Martin (3501): Preface to Desiderius + chapters 1–27. Opens “Severus to his dearest brother Desiderius sends greeting”; ends “not who shall read these things, but who shall believe them.” Vita sits at the front of the extract and is dropped because book-mode only emits Sacred History Book I–II.
wordingDiffs: not comparable (wrong work). Source vita is Roberts/Schaff thou/sendeth vs NA you/sends; chapter titles not meta.
proposedFix: SPEC_OVERRIDES endAt /^\s*The Letters of Sulpitius Severus\.\s*$/im — cuts letters, dialogues, doubtful letters, and Sacred History. Then auto (or chunk: "chapter") yields vita chs I–XXVII (~NA 1–27). Preface to Desiderius is before the first Chapter mark and would still be omitted unless the pre-first-mark block is kept. Do not endAt Sacred History only (that would leave letters/dialogues in a chapter stream).
```

New Advent: https://www.newadvent.org/fathers/3501.htm
Shape: one short vita — Preface to Desiderius + 27 chapters. Not two books. Piblia heading “Book I” is Sacred History Book I glued on as the body; extra work is FAIL.
