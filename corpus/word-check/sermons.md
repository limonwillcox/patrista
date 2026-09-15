```text
work: sermons
range: 1-48
verdict: FAIL
wordsPiblia: 83533
wordsNewAdvent: ~72000 (same selected sermons, without Gregory apparatus)
extraInPiblia: after Sermon XCV, NPNF2 XII Gregory Prolegomena (“diplomatic and practical talents… saint and a divine”; “Pedigree of Kings of Gaul”); false unit “Sermon LVIII” (9 words) from an in-text match
missingInPiblia: Sermon LXXXIV is in the extract (“Sermon LXXXIV [1173] .”) but SERMON_RE requires Sermon N. so it is not a unit — swallowed into the previous sermon
wordingDiffs: Feltoe English — not meta
proposedFix: endAt /^\s*Prolegomena\.?\s*$/im or /^\s*Pedigree of Kings of Gaul/im after last sermon; allow optional [n] before the period in SERMON_RE so LXXXIV is a unit; expectUnits 48 matching NA’s selected list
```

New Advent: https://www.newadvent.org/fathers/3603.htm (Sermons 1, 2, 3, 9, 10, 12, 16, 17, 19, 21–24, 26–28, 31, 33, 34, 36, 39, 40, 42, 46, 49, 51, 54, 55, 58, 59, 62, 63, 67, 68, 71–75, 77, 78, 82, 84, 85, 88, 90, 91, 95).
Shape: opens Sermon I birthday/ordination (“Let my mouth speak the praise of the Lord”) — Piblia matches. NA stops at Sermon 95; Piblia 95 includes Gregory’s editor close.
