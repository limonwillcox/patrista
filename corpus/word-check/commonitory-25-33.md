```text
work: commonitory
range: 25-33
verdict: FAIL
wordsPiblia: 6214
wordsNewAdvent: 5109
extraInPiblia: ch. 33 swallows Heurtley/Schaff editor Appendices I–III after Vincent’s §87 close (~1179 words) — Athanasian Creed parallel table; notes on Augustine/Massilian clergy (Prosper, De dono Perseverantiae); Celestine letter / Semipelagian apparatus (Noris, Benedictine editor)
missingInPiblia: (none) — opens ch. 25 Heretics appeal to Scripture; Vincent’s close §87 wearied by prolixity is present; 9 chs match NA 25–33 (work ending)
wordingDiffs: thou/ye vs you; NA verse refs in body; ch. 28 bracket “Second Book of the Commonitory is lost” is in both NA and Piblia (lacuna notice, not Elucidations); chapter titles not meta
proposedFix: SPEC_OVERRIDES endAt /^Appendix I\.\s*$/m — unindented heading only (indented “See Appendix I.” in ch. XIV notes must not match). Drops Appendices I–III; keeps §87. expectUnits 33
```

New Advent: https://www.newadvent.org/fathers/3506.htm
Shape: single page, 33 chapters. This shard is NA 25–33. Opens on heretics appealing to Scripture. Ends §87 recapitulation of the two Commonitories. Appendices after that are editor meta, not Vincent.
