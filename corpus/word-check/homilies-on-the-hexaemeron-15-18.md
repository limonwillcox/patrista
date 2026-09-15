```text
work: homilies-on-the-hexaemeron
range: 15-18
verdict: FAIL
wordsPiblia: 7992
wordsNewAdvent: 0
extraInPiblia: entire shard — Jackson NPNF2-8 Prolegomena (catalog of non-Hexaemeron homilies + §§ V–X Letters/Liturgical/Spurious/Lost/Doctrine/MSS) and glued De Spiritu Sancto title
missingInPiblia: all nine Hexaemeron homilies (NA Homilies I–IX); this span has no NA counterpart
wordingDiffs: n/a — different works, not thou/you
proposedFix: SPEC_OVERRIDES endAt /^\s*Homily XXII\s*[.,]/im (drop this shard) and/or /^\s*(THE BOOK OF SAINT BASIL ON THE SPIRIT|DE SPIRITU SANCTO\.?)\s*$/im (unglue De Spiritu Sancto); skip Homily XXII / Homily V (Julitta) / Homily XVIII / Homily XIX; drop range 15-18. Parse-time cut cannot restore Hexaemeron I–IX — they are not in this extract.
```

New Advent: https://www.newadvent.org/fathers/3201.htm (index; subpages 32011.htm–32019.htm). Nine homilies only. Opens Homily I “In the Beginning God made the Heaven and the Earth.” Closes Homily IX on terrestrial animals / “Let us make man,” “Retire, then… Amen.”

Piblia 15–18 headings Homily XXII, Homily V, Homily XVIII, Homily XIX. Parser HOMILY_RE matched Jackson’s catalog, not Basil’s Hexaemeron.

- ch 15 Homily XXII: Address to Young Men on pagan literature (treatise, “really not a homily at all”).
- ch 16 Homily V: panegyric on Julitta (martyred 306); also Barlaam / Homily XVII.
- ch 17 Homily XVIII: martyr Gordius.
- ch 18 Homily XIX: Forty Martyrs of Sebaste, then Mamas (XXIII), Prolegomena V–X (editor names/dates, Bodleian and British Museum MSS), then “THE BOOK OF SAINT BASIL ON THE SPIRIT” / “DE SPIRITU SANCTO.”

Glued work: De Spiritu Sancto (NPNF2-8 next title; NA https://www.newadvent.org/fathers/3203.htm). The nine Hexaemeron homilies sit in Fathers/English/Basil_English/On the Holy Spirit.txt at “Homily I. / In the Beginning God made…”, not in Homilies on the Hexaemeron.txt (volume front matter through Prolegomena, then the De Spiritu Sancto heading).
