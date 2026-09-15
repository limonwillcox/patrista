```text
work: sozomen-ecclesiastical-history
range: 9-9
verdict: FAIL
wordsPiblia: 42790
wordsNewAdvent: 7706
extraInPiblia: after Book IX ch. 17 close (“concealed by the eyebrows”), NPNF2 vol. II GENERAL INDEXES (Socrates’ index ~12291w; Sozomen’s index ~9349w), CCEL Indexes (scripture/Greek/German/French/pages), CCEL footer, then 5360 file:///ccel/s/schaff/npnf202/... URLs (~10720w). Extra ~35206 words / 1696 paras. No Elucidations heading; no next Father work as prose (Theodoret is Vol. III).
missingInPiblia: (none for Book IX — 17 chapters; opens “Such are the details that have been transmitted concerning John”; ends Zechariah relics / “concealed by the eyebrows.” NA the same. Stephen account named in ch. 16–17 titles is unfinished in both.)
wordingDiffs: NA Arabic ch. 1–17 vs Schaff Roman I–XVII; same Hartranft wording; NA encyclopedia links are chrome
proposedFix: SPEC_OVERRIDES endAt /^\s*GENERAL INDEXES\.?\s*$/im — unique in the extract; drops volume indexes + CCEL file:// dump only
```

New Advent: https://www.newadvent.org/fathers/26029.htm
Shape: NA Book IX is 17 chapters, Arcadius/Pulcheria through Zechariah relics. Parsed ch. 9 matches that span (43 paras / 7584 words), then swallows the rest of NPNF202. Glue boundary is `GENERAL INDEXES.` immediately after the eyebrows sentence. No `_____`, `[n]`, or Schaff-name chrome in the Father columns of this shard.
