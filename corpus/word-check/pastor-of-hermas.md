```text
work: pastor-of-hermas
range: 1-8
verdict: FAIL
wordsPiblia: 40762
wordsNewAdvent: ~37600
extraInPiblia: Coxe/Edinburgh Introductory Note (~3271 words) at the front of blob part 1 (Muratorian, Bunsen, Crombie, “a.d. 160”) before Vision First. Elucidations heading is already dropped by stripEditorialSections.
missingInPiblia: (none of the Father book — Vision 1 Rhode/Tiber through Similitude 10 “send back the Shepherd and the virgins to my dwelling. Amen.”)
wordingDiffs: thou/you; NA is 5 Visions + 12 Commandments + 10 Similitudes on 02011–02013.htm; we blob into 8 parts because Vision/Commandment/Similitude are not Chapter marks
proposedFix: skip until /^\s*(Book First\.?--Visions\.?|Vision First\.?)\s*$/im (EDITORIAL_HEADING_RE today matches Introductory Notice, not Introductory Note). Optional: chunk Vision/Commandment/Similitude. Catalog URL 0202.htm is Tatian’s Address — Hermas shape is 0201.htm.
```

New Advent: catalog https://www.newadvent.org/fathers/0202.htm is Tatian, not Hermas. Shape taken from https://www.newadvent.org/fathers/0201.htm (02011 Visions, 02012 Commandments, 02013 Similitudes).
Father text after the intro matches NA (opens “He who had brought me up, sold me to one Rhode in Rome”; ends Sim. 10 Amen). FAIL is the Schaff intro still in the parsed stream.
