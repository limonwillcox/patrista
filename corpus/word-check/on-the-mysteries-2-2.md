```text
work: on-the-mysteries
range: 2-2
verdict: FAIL
wordsPiblia: 12092
wordsNewAdvent: ~11800 (NA 34062.htm Book II of Concerning Repentance; 3405.htm has no Book II)
extraInPiblia: the whole unit is Ambrose Concerning Repentance Book II (NA 3406/34062.htm, De Paenitentia), not leftover Mysteries chapters; plus trailing NPNF editor “Note on the Penitential Discipline of the Early Church” (~411 words; Freiburg Kirchen-Lexikon / Dict. of Christian Antiquities — not on NA)
missingInPiblia: none of On the Mysteries (NA 3405.htm, one treatise, chs. 1–9) — this shard is a different work glued on
wordingDiffs: ye/you, doth/does vs NA modernization; chapter titles and Harnack 1. 2. 3. — not the FAIL
proposedFix: parse-time endAt /^\s*Two Books Concerning Repentance\.\s*$/im so on-the-mysteries stops at de Mysteriis (then chunk by Chapter I–IX). Drop this Book II unit. If De Paenitentia is ever its own work, also skip /^\s*Note on the Penitential Discipline of the Early Church\.?\s*$/im.
```

New Advent Mysteries: https://www.newadvent.org/fathers/3405.htm — one short treatise, Introduction + 9 chapters, opens “We have spoken daily upon subjects connected with morals…”, ends on the Spirit at the Font / new birth. No Book II.

Piblia unit 2 heading “Book II” is NA Concerning Repentance Book II (https://www.newadvent.org/fathers/34062.htm): chs. I–XI, opens “Although in the former book we have written many things which may tend to the more perfect practice of repentance…”, Father text ends at §107 (Moses’ shoes / feet of the soul). The NPNF extract `On the Mysteries.txt` concatenates Mysteries then Two Books Concerning Repentance; auto book-chunking took Repentance Book I/II as the two units and skipped de Mysteriis.
