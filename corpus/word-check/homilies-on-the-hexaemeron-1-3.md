```text
work: homilies-on-the-hexaemeron
range: 1-3
verdict: FAIL
wordsPiblia: 7445
wordsNewAdvent: ~15200
extraInPiblia: Jackson Prolegomena, not Hexaemeron — Homily VII De Avaritia excerpts; Benedictine/Erasmus/Garnier/Maran debate on the Isaiah commentary; Ascetic/Moralia/Regulae survey; Homiletical Latin title list (III. In Illud… through XXIII. In Mamantem martyrem); Homily III on Deut. xv. 9 plus a Rufinus Latin block (~400 words); Homily VI on Luke xii. 18 greed summary. Decorative ........ in ch. 1. (DE SPIRITU SANCTO title is glued at extract end, after this shard.)
missingInPiblia: Hexaemeron Homilies I–III entire (NA 32011–32013). NA opens Homily I “In the Beginning God made the Heaven and the Earth,” then II “The Earth was Invisible and Unfinished,” then III “On the Firmament,” each to Amen. Piblia unit 1 is already Homily VII; order is VII / III / VI, not I / II / III.
wordingDiffs: n/a — different works. Jackson Hexaemeron (same translation as NA) is not in this extract.
proposedFix: endAt/skip on Homilies on the Hexaemeron.txt cannot yield I–IX (body is not in the file). HOMILY_RE is matching Jackson catalog lines (“Homily VII., De Avaritia.”). Parse the nine homilies from Homily I. (“In the Beginning…”) through Homily IX, endAt /^\s*Introduction to the Letters\.?\s*$/im — that block currently sits in On the Holy Spirit.txt after De Spiritu Sancto. Optional endAt /^\s*DE SPIRITU SANCTO/im on this file only cuts DSS glue; leftover is still Prolegomena.
```

New Advent: https://www.newadvent.org/fathers/3201.htm (subpages 32011.htm–32013.htm for this shard; I–IX are 32011–32019). Shape: nine homilies in order I–IX. NA I–III body ~5049 + 5017 + 5175. Piblia work is 18 scrambled catalog units, not those nine.
