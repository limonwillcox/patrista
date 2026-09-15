```text
work: sermons
range: 34-39
verdict: FAIL
wordsPiblia: 8017
wordsNewAdvent: ~8008 (8246 with NA Bible-link tokens / one broken Latin note in 71)
extraInPiblia: ch. 34 is leftover footnote chrome — heading "Sermon LVIII" (duplicate of ch. 29) with 9-word body "chaps. 3 and 4, and Sermon LXII. chap. 4." (Schaff n. [1074] cross-ref, not a sermon)
missingInPiblia: (none of the Father sermons — ch. 35 opens Passion XVII / Sermon LXVIII; ch. 39 ends Ascension II Amen. Five sermons map NA 68, 71, 72, 73, 74; NA/Schaff skip 69–70)
wordingDiffs: thou/ye vs you; liveth/lives; NA modernizes spelling and injects Bible-link tokens — not meta; NA 71 also dumps a garbled Latin footnote ("superest ut de resurrectionis…") which Piblia correctly omits
proposedFix: skip heading / drop Piblia ch. 34. Tighten SERMON_RE to whole-line `Sermon N.` only (`^\s*Sermon\s+([IVXLCDM]+|\d+)\s*\.\s*$`) so footnote "cf. Sermon LVIII. chaps." does not split a unit.
```

New Advent: https://www.newadvent.org/fathers/3603.htm → 360368.htm, 360371.htm, 360372.htm, 360373.htm, 360374.htm
Shape: Piblia 35–39 = Leo LXVIII / LXXI / LXXII / LXXIII / LXXIV. Each opens on the feast subtitle and Schaff I. heading (titles not meta), ends on Amen / “Who liveth and reigneth, &c.” No Schaff intro, no Elucidations, no `_____`, no next-work glue. FAIL is the phantom ch. 34 only.
