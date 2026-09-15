```text
work: epistles-of-ignatius
range: 1-117
verdict: FAIL
wordsPiblia: 33818
wordsNewAdvent: ~13000
extraInPiblia: after the genuine seven (shorter+longer, through Polycarp ch. 8 / our unit 92): Coxe “Introductory Note to the Syriac Version of the Ignatian Epistles” (Cureton 1845, Bunsen, mss. a/b/g) plus the Curetonian three-letter Syriac collection and colophon “Here end the three Epistles of Ignatius, bishop and martyr.” Spurious Tarsians/Antiochians/Hero/etc. are not in this stream (separate extract). Longer Greek recension in parallel is Father variant, not meta.
missingInPiblia: Ephesians greeting (“Ignatius, who is also called Theophorus, to the Church which is at Ephesus…”) — dropped with the pre-Chapter-I Coxe intro. Later letter greetings sit at the end of the previous unit.
wordingDiffs: ye/you; NA prints only the shorter recension, one letter per URL (0104–0110); we print shorter+longer in each chapter
proposedFix: endAt /^\s*Introductory Note to the Syriac Version of the Ignatian Epistles\s*$/im. Keep the Ephesians greeting (start after “The Epistle of Ignatius to the Ephesians”, not at Chapter I). Do not pull Spurious Epistles of Ignatius.txt into this work.
```

New Advent: https://www.newadvent.org/fathers/0104.htm is Ephesians only; genuine set is 0104 Ephesians, 0105 Magnesians, 0106 Trallians, 0107 Romans, 0108 Philadelphians, 0109 Smyrnæans, 0110 Polycarp. Spurious collection is 0114.htm (not mixed in). Our stream is Ignatius letters through Polycarp, then Syriac editor-matter + abridged three — NA’s genuine letters end before our file does.
