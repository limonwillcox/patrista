```text
work: martyrdom-of-polycarp
range: 1-22
verdict: FAIL
wordsPiblia: 3525
wordsNewAdvent: 3604
extraInPiblia: last chapter ends with glued next-work heading "Ignatius" (1 word)
missingInPiblia: NA Greeting (~45 words) "The Church of God which sojourns at Smyrna…" — parser drops pre-Chapter I text
wordingDiffs: you/ye; chapter titles not meta; Caius/Socrates/Pionius colophon is in both streams (NA ch. 22)
proposedFix: SPEC_OVERRIDES endAt /^\s*Ignatius\s*$/im — drops glue only; does not restore Greeting
```

New Advent: https://www.newadvent.org/fathers/0102.htm
Shape: Greeting + 22 chapters, opens Smyrna to Philomelium, ends Pionius colophon Amen.
