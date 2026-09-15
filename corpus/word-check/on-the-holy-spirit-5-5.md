```text
work: on-the-holy-spirit
range: 5-5
verdict: FAIL
wordsPiblia: 20269
wordsNewAdvent: 0
extraInPiblia: entire unit (heading "Book II") is another work glued after On the Holy Spirit Book III — Ambrose, On the Death of Satyrus Book II / "On the Belief in the Resurrection" (NA https://www.newadvent.org/fathers/34032.htm, ~20500 Father words, §§1–135). Opens "In the former book I indulged my longing…"; ends "I hope to come quickly to thee, my brother… no longer have to fear death." Piblia ch. 4 is Satyrus Book I; ch. 3 last para is the next-work title "The Two Books of St. Ambrose, Bishop of Milan, on the Decease of His Brother Satyrus." No `_____`, Schaff dates, [1234] notes, or Elucidations in this shard.
missingInPiblia: no On the Holy Spirit text in this span. Assigned NA 3402.htm has only Books I–III; real Holy Spirit Book II is already Piblia ch. 2 (NA 34022.htm, Samson / Spirit as Lord), not this second "Book II."
wordingDiffs: thou/you vs NA you/Your on the glued Satyrus book — not meta
proposedFix: parse-time SPEC_OVERRIDES endAt /^\s*The Two Books of St\. Ambrose, Bishop of Milan, on the Decease of His Brother Satyrus\.\s*$/im, expectUnits 3. Drops Satyrus Books I–II (Piblia ch. 4–5) and the title line now trailing Holy Spirit Book III. Do not keep this unit in the Holy Spirit stream.
```

New Advent: https://www.newadvent.org/fathers/3402.htm (On the Holy Spirit — Books I–III only). Glued match: https://www.newadvent.org/fathers/3403.htm → Book II https://www.newadvent.org/fathers/34032.htm.
Shape: Piblia unit 5 is a second "Book II" after three Holy Spirit books. NA 34022.htm is Trinity/Samson, not resurrection/Satyrus. FAIL is the glued work, not wording.
