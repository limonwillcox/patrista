```text
work: seven-ecumenical-councils
range: 1-5
verdict: FAIL
wordsPiblia: 316817
wordsNewAdvent: n/a as one page — NA splits by council (Nicaea I 3801, Constantinople I 3808, Ephesus 3810, Chalcedon 3811, Constantinople II 3812, Constantinople III 3813, Nicaea II 3819, plus local synods)
extraInPiblia: Philip Schaff; Percival Prolegomena; whole NPNF2 XIV volume including local synods, excursus notes, and CCEL file:/// dump; five false “Chapter” units from commentary citations (e.g. “Chapter LX — treats of Translations of bishops”)
missingInPiblia: work does not open on Nicaea (creed/canons). First parsed unit starts mid-excursus on episcopal translations, then Canon XVI. Nicaea I Historical Introduction is later in the dump, not the start
wordingDiffs: Percival canons vs NA — not the verdict
proposedFix: skip volume Prolegomena/title; chunk on council heads (The First Council of Nice / Historical Introduction) not CHAPTER_RE; endAt CCEL dump; do not treat “Chapter LX.” inside notes as units
```

New Advent: https://www.newadvent.org/fathers/3801.htm and the other council pages linked from https://www.newadvent.org/fathers/
Shape: NA Nicaea opens on the creed “We believe in one God, the Father Almighty…” then 20 canons and the synodal letter. Piblia’s five-unit parse is not that book.
