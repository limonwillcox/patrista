```text
work: ecclesiastical-history-and-dialogues
range: 1-10
verdict: FAIL
wordsPiblia: 423450
wordsNewAdvent: ~160000 (History 5 books + Dialogues prologue/3 dialogues; Demonstrations and Letters are separate NA works)
extraInPiblia: NPNF2 III remainder glued on — Demonstrations by Syllogisms, Theodoret Letters, then Jerome and Gennadius Lives of Illustrious Men, Rufinus, and CCEL file:/// dump; volume Preface/Prolegomena in the extract; History Book V is 220k words because Dialogues have no Book marks
missingInPiblia: History 5-book count is present; Dialogues/Eranistes are inside Book V rather than NA’s Prologue + Dialogues 1–3
wordingDiffs: Jackson English — not meta
proposedFix: endAt /^\s*Jerome and Gennadius/im (drop non-Theodoret volume); optionally split History (expectUnits 5) from Dialogues; endAt CCEL dump
```

New Advent: https://www.newadvent.org/fathers/2702.htm (History I–V), https://www.newadvent.org/fathers/2703.htm (Dialogues), plus 2701/2704/2707 as other Theodoret works.
Shape: History opens “When artists paint on panels…” (Prologue — Design of the History) — Piblia matches. NA History ends at Book V; Piblia Book V swallows Eranistes and the rest of the volume.
