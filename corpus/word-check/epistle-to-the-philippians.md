```text
work: epistle-to-the-philippians
range: 1-14
verdict: FAIL
wordsPiblia: 2621
wordsNewAdvent: 2463
extraInPiblia: last chapter swallows next-work glue after Amen — "Introductory Note to the Epistle Concerning the Martyrdom of Polycarp" plus Coxe martyrology preface (~407 words). Heading chrome: Chapter X still carries leftover [391]
missingInPiblia: NA Greeting (~32 words) "Polycarp, and the presbyters with him…" — parser drops pre-Chapter I text
wordingDiffs: ye vs you; chapter titles not meta
proposedFix: SPEC_OVERRIDES endAt /^\s*Introductory Note to the Epistle Concerning the Martyrdom of Polycarp\s*$/im — drops glue only; does not restore Greeting
```

New Advent: https://www.newadvent.org/fathers/0136.htm
Shape: Greeting + 14 chapters, opens Polycarp and the presbyters, ends Grace be with you all. Amen.
