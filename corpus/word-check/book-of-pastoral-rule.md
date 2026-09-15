```text
work: book-of-pastoral-rule
range: 1-62
verdict: FAIL
wordsPiblia: 207137
wordsNewAdvent: ~40000 (4 books of the Rule only)
extraInPiblia: Register of the Epistles of Saint Gregory the Great glued after Pastoral Rule Book IV; CCEL file:/// dump; Chapter XL (Book III) is 142k words because Book IV has no Chapter mark
missingInPiblia: Book IV of the Rule is not its own unit (NA 36014.htm: preacher returns to himself / “plank of thy prayer”); Barmby Preface before Chapter I is dropped (correct)
wordingDiffs: Barmby English — not meta
proposedFix: endAt /^\s*Register of the Epistles of Saint Gregory/im; treat Book IV as a unit (book-chunk or a Book IV heading); drop CCEL dump; expectUnits 4 books or 63 chapters (62 + Book IV)
```

New Advent: https://www.newadvent.org/fathers/3601.htm (Books I–IV).
Shape: Piblia opens Book I ch. I “No one presumes to teach an art…” matching NA. NA closes Book IV on the prayer-plank to John of Ravenna. Piblia then reads Gregory’s Register (another work) through the volume index.
