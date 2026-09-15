```text
work: ecclesiastical-history
range: 7-7
verdict: FAIL
wordsPiblia: 52185
wordsNewAdvent: 19080
extraInPiblia: after Socrates VII.48 close (“305th Olympiad… seventeenth consulate”), NPNF Sozomen volume glued on — title “THE / ECCLESIASTICAL HISTORY / OF / Sozomen,” Hartranft Introduction (Parts I–IV), Valesius “Life and Writings of Sozomen,” “Memoir of Sozomen,” Sozomen’s Address to Theodosius, and title “salaminius hermias sozomenus” (~33284 words). Socrates VII body itself is Father-only (18901 words).
missingInPiblia: (none of Socrates Book VII) — opens After the death of Arcadius…, 48 chapters through Thalassius at Cæsarea, ends on the 305th Olympiad / seventeenth consulate; matches NA 26017.htm
wordingDiffs: entrusted/intrusted and similar Zenos vs NA punctuation — not meta; chapter titles not meta
proposedFix: SPEC_OVERRIDES endAt /^\s*THE\s*$/m — unique all-caps title line of the Sozomen volume immediately after Socrates VII.48 (do not use /i; do not cut at Memoir/Address, those sit ~31k words later). expectUnits 7
```

New Advent: https://www.newadvent.org/fathers/26017.htm
Shape: NA Book VII is Socrates only (chs 1–48). Piblia Book VII start/end of Socrates match NA; the remainder is another work (Sozomen apparatus + Address), not Socrates.
