# Public-domain English source catalog (Christian texts, c. 1–800)

Address book of English collections, volumes, PDFs, `.txt` dumps, and online libraries.
US public-domain cutoff used: first publication **1930 or earlier** (as of 2026).
One row = one volume / PDF / `.txt` page / web-library hub. Individual works inside a volume are not listed.

Machine-readable twin: [`catalog.jsonl`](catalog.jsonl).
How to pull this branch and run checks: [`README.md`](README.md).

## Eyeball coverage vs Patrista `Fathers/English/`

| Coverage | Rows | Meaning |
|---|---:|---|
| `in_patrista` | 38 | This exact edition is already on disk (ANF/NPNF dumps) |
| `overlap` | 138 | Patrista already has PD English of substantially the same work, usually from Schaff |
| `not_in_patrista` | 85 | No English of this work (or this unique content) in `Fathers/English/` |
| `hub` | 22 | Web-library landing page, not a volume to ingest as-is |
| **total** | **283** | |

English on disk today is almost entirely Schaff ANF 10 + NPNF I 14 + NPNF II 14 (volume dumps plus author splits).
`scripts/ccel-english/download.mjs` already fetches those. ANCL is the same English as ANF. Most LFC/SPCK/Loeb/Bagster/Bohn lines are other 19th/early-20th-c. translations of works already held.
The genuinely new English is concentrated in §5 (Oriental / Syriac / Coptic / apocrypha), Pearse Additional Fathers, LFC Cyril of Alexandria and Gregory *Morals on Job*, English Bede, Evagrius, Philo, Gildas, and unique SPCK (Egeria, Macarius, Palladius, Dionysius Areopagite, Ferrar *Demonstratio*, Lausiac History, Irenaeus *Demonstration*).

## 1. CCEL (`ccel.org`)

### Ante-Nicene Fathers (ANF, 10 vols) — TXT

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| ANF Vol. 1. The Apostolic Fathers with Justin Martyr and Irenaeus | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf01.txt |
| ANF Vol. 2. Fathers of the Second Century: Hermas, Tatian, Athenagoras, Theophilus, Clement of Alexandria | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf02.txt |
| ANF Vol. 3. Latin Christianity: Its Founder, Tertullian | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf03.txt |
| ANF Vol. 4. Fathers of the Third Century: Tertullian Part Fourth; Minucius Felix; Commodian; Origen | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf04.txt |
| ANF Vol. 5. Fathers of the Third Century: Hippolytus, Cyprian, Caius, Novatian, Appendix | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf05.txt |
| ANF Vol. 6. Fathers of the Third Century: Gregory Thaumaturgus, Dionysius the Great, Julius Africanus, Anatolius and Minor Writers, Methodius, Arnobius | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf06.txt |
| ANF Vol. 7. Fathers of the Third and Fourth Centuries: Lactantius, Venantius, Asterius, Victorinus, Dionysius, Apostolic Teaching and Constitutions, Homily, Liturgies | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf07.txt |
| ANF Vol. 8. The Twelve Patriarchs, Excerpts and Epistles, The Clementina, Apocrypha, Decretals, Memoirs of Edessa and Syriac Documents, Remains of the First Ages | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf08.txt |
| ANF Vol. 9. Recently Discovered Additions to Early Christian Literature; Commentaries of Origen | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf09.txt |
| ANF Vol. 10. Bibliographic Synopsis; General Index | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/anf10.txt |

### Nicene and Post-Nicene Fathers, Series I (14 vols) — TXT

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| NPNF I Vol. 1. Augustine: Prolegomena, Confessions, Letters | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf101.txt |
| NPNF I Vol. 2. Augustine: The City of God; Christian Doctrine | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf102.txt |
| NPNF I Vol. 3. Augustine: On the Holy Trinity; Doctrinal Treatises; Moral Treatises | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf103.txt |
| NPNF I Vol. 4. Augustine: Anti-Manichaean Writings; Anti-Donatist Writings | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf104.txt |
| NPNF I Vol. 5. Augustine: Anti-Pelagian Writings | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf105.txt |
| NPNF I Vol. 6. Augustine: Sermon on the Mount; Harmony of the Gospels; Homilies on the Gospels | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf106.txt |
| NPNF I Vol. 7. Augustine: Homilies on the Gospel of John; Homilies on 1 John; Soliloquies | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf107.txt |
| NPNF I Vol. 8. Augustine: Expositions on the Psalms | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf108.txt |
| NPNF I Vol. 9. Chrysostom: On the Priesthood; Ascetic Treatises; Select Homilies and Letters; Homilies on the Statutes | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf109.txt |
| NPNF I Vol. 10. Chrysostom: Homilies on the Gospel of St. Matthew | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf110.txt |
| NPNF I Vol. 11. Chrysostom: Homilies on Acts and Romans | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf111.txt |
| NPNF I Vol. 12. Chrysostom: Homilies on First and Second Corinthians | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf112.txt |
| NPNF I Vol. 13. Chrysostom: Homilies on Galatians, Ephesians, Philippians, Colossians, Thessalonians, Timothy, Titus, Philemon | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf113.txt |
| NPNF I Vol. 14. Chrysostom: Homilies on the Gospel of St. John and the Epistle to the Hebrews | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf114.txt |

### Nicene and Post-Nicene Fathers, Series II (14 vols) — TXT

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| NPNF II Vol. 1. Eusebius: Church History; Life of Constantine; Oration in Praise of Constantine | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf201.txt |
| NPNF II Vol. 2. Socrates and Sozomenus: Ecclesiastical Histories | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf202.txt |
| NPNF II Vol. 3. Theodoret, Jerome, Gennadius, and Rufinus: Historical Writings | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf203.txt |
| NPNF II Vol. 4. Athanasius: Select Works and Letters | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf204.txt |
| NPNF II Vol. 5. Gregory of Nyssa: Dogmatic Treatises; Select Writings and Letters | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf205.txt |
| NPNF II Vol. 6. Jerome: Letters and Select Works | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf206.txt |
| NPNF II Vol. 7. Cyril of Jerusalem; Gregory Nazianzen | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf207.txt |
| NPNF II Vol. 8. Basil: Letters and Select Works | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf208.txt |
| NPNF II Vol. 9. Hilary of Poitiers; John of Damascus | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf209.txt |
| NPNF II Vol. 10. Ambrose: Select Works and Letters | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf210.txt |
| NPNF II Vol. 11. Sulpitius Severus; Vincent of Lerins; John Cassian | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf211.txt |
| NPNF II Vol. 12. Leo the Great; Gregory the Great | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf212.txt |
| NPNF II Vol. 13. Gregory the Great II; Ephraim Syrus; Aphrahat | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf213.txt |
| NPNF II Vol. 14. The Seven Ecumenical Councils | TXT | `in_patrista` | https://www.ccel.org/ccel/schaff/npnf214.txt |

### Other pre-800 CCEL volumes / hubs (PD English)

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| CCEL Early Church Fathers series hub (ANF + NPNF I–II) | Web Library | `hub` | https://www.ccel.org/fathers.html |
| Roger Pearse, Early Church Fathers — Additional Texts (More Fathers) | Web Library | `hub` | https://www.ccel.org/ccel/pearse/morefathers/files/morefathers.html |
| Bede, Ecclesiastical History of England (A. M. Sellar, 1907) | TXT | `not_in_patrista` | https://www.ccel.org/ccel/bede/history.txt |
| Athanasius, On the Incarnation of the Word (Archibald Robertson, 1891) | TXT | `overlap` | https://www.ccel.org/ccel/athanasius/incarnation.txt |
| John Cassian, Conferences | TXT | `overlap` | https://www.ccel.org/ccel/cassian/conferences.txt |
| Schaff, Creeds of Christendom, Vol. 2 (ante-Nicene / Nicene rules of faith and creeds) | TXT | `not_in_patrista` | https://www.ccel.org/ccel/schaff/creeds2.txt |

## 2. Ante-Nicene Christian Library (ANCL, 24 vols)

### Edinburgh: T. & T. Clark, 1867–1872. Editors: Alexander Roberts and James Donaldson.

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| ANCL Vol. 1. The Apostolic Fathers (1867) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol011867 |
| ANCL Vol. 2. Justin Martyr and Athenagoras (1867) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol021867 |
| ANCL Vol. 3. Tatian, Theophilus, and the Clementine Recognitions (1867) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol031867 |
| ANCL Vol. 4. Clement of Alexandria, Vol. I (1867) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol041867 |
| ANCL Vol. 5. Irenaeus, Vol. I (1868) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol051868 |
| ANCL Vol. 6. Hippolytus, Bishop of Rome, Vol. I (1868) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol061868 |
| ANCL Vol. 7. Tertullianus Against Marcion (1868) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol071868 |
| ANCL Vol. 8. The Writings of Cyprian, Vol. I (1868) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol081868 |
| ANCL Vol. 9. Irenaeus Vol. II; Hippolytus Vol. II; Fragments of the Third Century (1869) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol091869 |
| ANCL Vol. 10. The Writings of Origen, Vol. I (1869) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol101869 |
| ANCL Vol. 11. The Writings of Tertullian, Vol. I (1869) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol111869 |
| ANCL Vol. 12. Clement of Alexandria, Vol. II (1869) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol121869 |
| ANCL Vol. 13. The Writings of Cyprian, Vol. II; Passion of Perpetua; Novatian; Minucius Felix (1869) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol131869 |
| ANCL Vol. 14. The Writings of Methodius and others (1869) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol141869 |
| ANCL Vol. 15. The Writings of Tertullian, Vol. II (1870) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol151870 |
| ANCL Vol. 16. Apocryphal Gospels, Acts, and Revelations (1870) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol161870 |
| ANCL Vol. 17. The Clementine Homilies; The Apostolical Constitutions (1870) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol171870 |
| ANCL Vol. 18. The Writings of Tertullian, Vol. III; Victorinus; Commodianus (1870) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol181870 |
| ANCL Vol. 19. The Seven Books of Arnobius Adversus Gentes (1871) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol191871 |
| ANCL Vol. 20. Gregory Thaumaturgus, Dionysius of Alexandria, and Archelaus (1871) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol201871 |
| ANCL Vol. 21. The Works of Lactantius, Vol. I (1871) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol211871 |
| ANCL Vol. 22. The Works of Lactantius, Vol. II; Testaments of the Twelve Patriarchs; Fragments (1871) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol221871 |
| ANCL Vol. 23. Origen Contra Celsum, Books 2–8 (1872) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol231872 |
| ANCL Vol. 24. Early Liturgies and Other Documents (1872) | Book Scan | `overlap` | https://archive.org/details/AnteNiceneChristianLibraryVol241872 |

## 3. A Library of the Fathers of the Holy Catholic Church (Oxford / Parker, 1838–1885)

### The English run is 48 numbered volumes. All scans below returned HTTP 200.

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| LFC Vol. 1. Augustine, Confessions (Pusey, 1838) | Book Scan | `overlap` | https://archive.org/details/a545547600auguuoft |
| LFC Vol. 2. Cyril of Jerusalem, Catechetical Lectures (R. W. Church, 1838) | Book Scan | `overlap` | https://archive.org/details/catecheticallect00cyririch |
| LFC Vol. 3. Cyprian, Treatises (Thornton & Newman, 1839) | Book Scan | `overlap` | https://archive.org/details/treatisesofscaec00cypruoft |
| LFC Vol. 4. Chrysostom, Homilies on 1 Corinthians, Pt. 1, Hom. 1–24 (1839) | Book Scan | `overlap` | https://archive.org/details/thehomiliesofchr01chryuoft |
| LFC Vol. 5. Chrysostom, Homilies on 1 Corinthians, Pt. 2, Hom. 25–44 (1839) | Book Scan | `overlap` | https://archive.org/details/thehomiliesofsjo00chryuoft |
| LFC Vol. 6. Chrysostom, Commentary on Galatians and Homilies on Ephesians (1840) | Book Scan | `overlap` | https://archive.org/details/commentary00newmuoft |
| LFC Vol. 7. Chrysostom, Homilies on Romans (1841) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc07john |
| LFC Vol. 8. Athanasius, Select Treatises against the Arians, Pt. 1 (Newman, 1842) | Book Scan | `overlap` | https://archive.org/details/selecttreatiseso08atha |
| LFC Vol. 9. Chrysostom, Homilies on the Statues (1842) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc09john |
| LFC Vol. 10. Tertullian, Apologetic and Practical Treatises (Dodgson, 1842) | Book Scan | `overlap` | https://archive.org/details/tertullian10tert |
| LFC Vol. 11. Chrysostom, Homilies on Matthew, Pt. 1, Hom. 1–25 (1843) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc11john |
| LFC Vol. 12. Chrysostom, Homilies on Timothy, Titus, and Philemon (1843) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc12john |
| LFC Vol. 13. Athanasius, Historical Tracts (1843) | Book Scan | `overlap` | https://archive.org/details/historicaltracts13atha |
| LFC Vol. 14. Chrysostom, Homilies on Philippians, Colossians, and Thessalonians (1843) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc14john |
| LFC Vol. 15. Chrysostom, Homilies on Matthew, Pt. 2, Hom. 26–58 (1843) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc15john |
| LFC Vol. 16. Augustine, Sermons on selected NT lessons, Vol. 1 (1844) | Book Scan | `overlap` | https://archive.org/details/sermonsonselecte16augu |
| LFC Vol. 17. Cyprian, Epistles, with Pacian (1844) | Book Scan | `overlap` | https://archive.org/details/epistlesofscypri17cypr |
| LFC Vol. 18. Gregory the Great, Morals on Job, Pt. 1, Books 1–10 (1844) | Book Scan | `not_in_patrista` | https://archive.org/details/moralsonbookofjo01greguoft |
| LFC Vol. 19. Athanasius, Select Treatises against the Arians, Pt. 2 (1844) | Book Scan | `overlap` | https://archive.org/details/selecttreatiseso19atha |
| LFC Vol. 20. Augustine, Sermons on selected NT lessons, Vol. 2 (1845) | Book Scan | `overlap` | https://archive.org/details/sermonsonselecte20augu |
| LFC Vol. 21. Gregory the Great, Morals on Job, Pt. 2, Books 11–22 (1845) | Book Scan | `not_in_patrista` | https://archive.org/details/moralsonbookofj234greguoft |
| LFC Vol. 22. Augustine, Seventeen Short Treatises (1847) | Book Scan | `overlap` | https://archive.org/details/seventeenshorttr22augu |
| LFC Vol. 23. Gregory the Great, Morals on Job, Pt. 3, Books 23–29 (1847) | Book Scan | `not_in_patrista` | https://archive.org/details/p1moralsonbookjo03greguoft |
| LFC Vol. 24. Augustine, Expositions on the Psalms, Vol. 1, Pss. 1–36 (1847) | Book Scan | `overlap` | https://archive.org/details/expositionsonboo24augu |
| LFC Vol. 25. Augustine, Expositions on the Psalms, Vol. 2, Pss. 37–52 (1847) | Book Scan | `overlap` | https://archive.org/details/expositionsonboo25augu |
| LFC Vol. 26. Augustine, Homilies on John and 1 John, Pt. 1 (1848) | Book Scan | `overlap` | https://archive.org/details/homiliesongospel26augu |
| LFC Vol. 27. Chrysostom, Homilies on 2 Corinthians (1848) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc27john |
| LFC Vol. 28. Chrysostom, Homilies on John, Pt. 1, Hom. 1–41 (1848) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc28john |
| LFC Vol. 29. Augustine, Homilies on John and 1 John, Pt. 2 (1849) | Book Scan | `overlap` | https://archive.org/details/homiliesongospel29augu |
| LFC Vol. 30. Augustine, Expositions on the Psalms, Vol. 3, Pss. 53–75 (1849) | Book Scan | `overlap` | https://archive.org/details/expositionsonboo30augu |
| LFC Vol. 31. Gregory the Great, Morals on Job, Pt. 4, Books 30–35 (1850) | Book Scan | `not_in_patrista` | https://archive.org/details/p2moralsonbookof03greguoft |
| LFC Vol. 32. Augustine, Expositions on the Psalms, Vol. 4, Pss. 76–101 (1850) | Book Scan | `overlap` | https://archive.org/details/expositionsonboo32augu |
| LFC Vol. 33. Chrysostom, Homilies on Acts, Pt. 1, Hom. 1–28 (1851) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc33john |
| LFC Vol. 34. Chrysostom, Homilies on Matthew, Pt. 3, Hom. 59–90 (1851) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc34john |
| LFC Vol. 35. Chrysostom, Homilies on Acts, Pt. 2, Hom. 29–55 (1851) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc35john |
| LFC Vol. 36. Chrysostom, Homilies on John, Pt. 2, Hom. 42–88 (1848/1852) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc36john |
| LFC Vol. 37. Augustine, Expositions on the Psalms, Vol. 5, Pss. 102–125 (1853) | Book Scan | `overlap` | https://archive.org/details/expositionsonthe05auguuoft |
| LFC Vol. 38. Athanasius, Festal Epistles (1854) | Book Scan | `overlap` | https://archive.org/details/festalepistlesof38atha |
| LFC Vol. 39. Augustine, Expositions on the Psalms, Vol. 6, Pss. 126–150 | Book Scan | `overlap` | https://archive.org/details/expositionsonboo39augu |
| LFC Vol. 40. Justin Martyr, Works now extant (Davie, 1861) | Book Scan | `overlap` | https://archive.org/details/worksnowextantof40just |
| LFC Vol. 41. Ephrem the Syrian, Select Works / Rhythms (J. B. Morris, 1847) | Book Scan | `overlap` | https://archive.org/details/selectworksofsep41ephr |
| LFC Vol. 42. Irenaeus, Five Books against Heresies (Keble, 1872) | Book Scan | `overlap` | https://archive.org/details/fivebooksofsiren42iren |
| LFC Vol. 43. Cyril of Alexandria, Commentary on John, Pt. 1 (P. E. Pusey, 1874) | Book Scan | `not_in_patrista` | https://archive.org/details/commentaryongosp01cyri |
| LFC Vol. 44. Chrysostom, Homilies on Hebrews (1877) | Book Scan | `overlap` | https://archive.org/details/homiliesofsjohnc44john |
| LFC Vol. 45. Ambrose, Letters (1881) | Book Scan | `overlap` | https://archive.org/details/lettersofsambros45ambr |
| LFC Vol. 46. Athanasius, Later Treatises, with appendix on Cyril and Theodoret (Bright, 1881) | Book Scan | `overlap` | https://archive.org/details/latertreatisesof00atharich |
| LFC Vol. 47. Cyril of Alexandria, Five Tomes against Nestorius; Scholia; Christ is One; fragments (1881) | Book Scan | `not_in_patrista` | https://archive.org/details/fivetomesagainst47cyri |
| LFC Vol. 48. Cyril of Alexandria, Commentary on John, Pt. 2 (T. Randell, 1885) | Book Scan | `not_in_patrista` | https://archive.org/details/commentaryongosp02cyri |

## 4. Pre-1931 secondary print series

### Bagster, *The Greek Ecclesiastical Historians* (London, 1843–46)

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| Bagster Greek Ecclesiastical Historians, vol. 1 — Eusebius, Life of Constantine (1843) | Book Scan | `overlap` | https://archive.org/details/greekecclesiasti01lond |
| Bagster Greek Ecclesiastical Historians, vol. 2 — Eusebius, Ecclesiastical History to A.D. 324 (1843) | Book Scan | `overlap` | https://archive.org/details/greekecclesiasti02lond |
| Bagster Greek Ecclesiastical Historians, vol. 3 — Socrates Scholasticus, Ecclesiastical History (1844) | Book Scan | `overlap` | https://archive.org/details/greekecclesiasti03lond |
| Bagster Greek Ecclesiastical Historians, vol. 4 — Sozomen, Ecclesiastical History (1846) | Book Scan | `overlap` | https://archive.org/details/greekecclesiasti04lond |
| Bagster Greek Ecclesiastical Historians, vol. 5 — Theodoret, Ecclesiastical History (1843) | Book Scan | `overlap` | https://archive.org/details/greekecclesiasti05lond |
| Bagster Greek Ecclesiastical Historians, vol. 6 — Evagrius Scholasticus, Ecclesiastical History (1846) | Book Scan | `not_in_patrista` | https://archive.org/details/greekecclesiasti06lond |

### Bohn’s Ecclesiastical Library (and Bohn Antiquarian Library, Bede)

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| Bohn Ecclesiastical Library — Eusebius, Ecclesiastical History, trans. C. F. Cruse (1851) | Book Scan | `overlap` | https://archive.org/details/ecclesiasticalh00crusgoog |
| Bohn Ecclesiastical Library — Socrates, Ecclesiastical History | Book Scan | `overlap` | https://archive.org/details/ecclesiasticalhi00socruoft |
| Bohn Ecclesiastical Library — Sozomen, Ecclesiastical History, with Philostorgius | Book Scan | `overlap` | https://archive.org/details/theecclesiastica00sozouoft |
| Bohn Ecclesiastical Library — Theodoret and Evagrius, History of the Church, trans. Edward Walford (1854) | Book Scan | `overlap` | https://archive.org/details/ahistorychurchf00walfgoog |
| Bohn — Philo Judaeus, Works, trans. C. D. Yonge, vol. 1 | Book Scan | `not_in_patrista` | https://archive.org/details/worksofphilojuda01phil |
| Bohn — Philo Judaeus, Works, trans. C. D. Yonge, vol. 2 | Book Scan | `not_in_patrista` | https://archive.org/details/worksofphilojuda02phil |
| Bohn — Philo Judaeus, Works, trans. C. D. Yonge, vol. 3 | Book Scan | `not_in_patrista` | https://archive.org/details/worksphilojudaeu03philuoft |
| Bohn — Philo Judaeus, Works, trans. C. D. Yonge, vol. 4 | Book Scan | `not_in_patrista` | https://archive.org/details/theworksofphiloj04yonguoft |
| Bohn Antiquarian Library — Bede, Ecclesiastical History of England, also the Anglo-Saxon Chronicle, ed. J. A. Giles (1859) | Book Scan | `not_in_patrista` | https://archive.org/details/venerablebedesec00bede |

### *Church Historians of England* (Stevenson) and Giles’s British chronicles

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| Church Historians of England, vol. 1, part 2 — Bede, Historical Works (Stevenson) | Book Scan | `not_in_patrista` | https://archive.org/details/churchhistorpt201unknuoft |
| J. A. Giles, The Works of Gildas and Nennius | Book Scan | `not_in_patrista` | https://archive.org/details/b29339364 |
| J. A. Giles, Six Old English Chronicles (Gildas, Nennius, and related British chronicles) | Book Scan | `not_in_patrista` | https://archive.org/details/sixoldenglishchr00gileuoft |

### Loeb Classical Library — Christian volumes, first edition ≤1930

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| Loeb LCL 24 — Apostolic Fathers, vol. 1, trans. Kirsopp Lake (1912) | Book Scan | `overlap` | https://archive.org/details/apostolicfathers01lake |
| Loeb LCL 25 — Apostolic Fathers, vol. 2, trans. Kirsopp Lake (1913) | Book Scan | `overlap` | https://archive.org/details/apostolicfathers02lakeuoft |
| Loeb LCL 26 — Augustine, Confessions, vol. 1, trans. William Watts, ed. W. H. D. Rouse (1912) | Book Scan | `overlap` | https://archive.org/details/staugustinesconf01augu |
| Loeb LCL 27 — Augustine, Confessions, vol. 2, trans. William Watts, ed. W. H. D. Rouse (1912) | Book Scan | `overlap` | https://archive.org/details/staugustinesconf02augu |
| Loeb LCL 92 — Clement of Alexandria (Exhortation to the Greeks; Rich Man’s Salvation; To the Newly Baptized), trans. G. W. Butterworth (1919) | Book Scan | `overlap` | https://archive.org/details/clementofalexand00clem |
| Loeb LCL 153 — Eusebius, Ecclesiastical History, vol. 1 (Books I–V), trans. Kirsopp Lake (1926) | Book Scan | `overlap` | https://archive.org/details/ecclesiasticalhi01euseuoft |
| Loeb LCL 246 — Bede, Opera Historica, vol. 1, trans. J. E. King (1930) | Book Scan | `not_in_patrista` | https://archive.org/details/operahistorica01bedeuoft |
| Loeb LCL 248 — Bede, Opera Historica, vol. 2, trans. J. E. King (1930) | Book Scan | `not_in_patrista` | https://archive.org/details/operahistoric02bedeuoft |
| Loeb LCL 239 — Augustine, Select Letters, trans. J. H. Baxter (1930) | Book Scan | `overlap` | https://archive.org/details/selectletters00auguuoft |
| Loeb LCL 190 — Basil, Letters, vol. 1 (Letters 1–58), trans. Roy J. Deferrari (1926) | Book Scan | `overlap` | https://archive.org/details/letterswithengli01basiuoft |
| Loeb LCL 215 — Basil, Letters, vol. 2 (Letters 59–185), trans. Roy J. Deferrari (1928) | Book Scan | `overlap` | https://archive.org/details/letterswithengli02basiuoft |
| Loeb LCL 17 — Philostratus, Life of Apollonius of Tyana, vol. 2, with Eusebius, Against Hierocles, trans. F. C. Conybeare (1912) | Book Scan | `not_in_patrista` | https://archive.org/details/lifeofapollonius02philuoft |

### SPCK Early Church Classics and *Translations of Christian Literature* (≤1930, texts to A.D. 800)

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| SPCK ECC — J. A. F. Gregg, The Epistle of St. Clement, Bishop of Rome (1899) | Book Scan | `overlap` | https://archive.org/details/epistleofstcleme00clemuoft |
| SPCK ECC — P. Mordaunt Barnard, Clement of Alexandria, Who is the Rich Man that is Being Saved? (1901) | Book Scan | `overlap` | https://archive.org/details/homilyofclemento00clemuoft |
| SPCK ECC — T. A. Moxon, St. Chrysostom, On the Priesthood (1907) | Book Scan | `overlap` | https://archive.org/details/StChrysostomOnThePriesthood |
| SPCK ECC — Charles Bigg, The Doctrine of the Twelve Apostles (Didache) (1898) | Book Scan | `overlap` | https://archive.org/details/doctrinetwelvea00bigggoog |
| SPCK ECC — Charles Bigg, The Doctrine of the Twelve Apostles (Didache) (1922 reprint) | Book Scan | `overlap` | https://archive.org/details/doctrineoftwelve00bigguoft |
| SPCK ECC — L. B. Radford, The Epistle to Diognetus (1908) | Book Scan | `overlap` | https://archive.org/details/epistletodiognet0000revl |
| SPCK ECC — Charles Taylor, The Shepherd of Hermas, vol. 1 (1903) | Book Scan | `overlap` | https://archive.org/details/shepherdhermas01taylgoog |
| SPCK ECC — Charles Taylor, The Shepherd of Hermas, vol. 2 (1906) | Book Scan | `overlap` | https://archive.org/details/shepherdhermas02taylgoog |
| SPCK ECC — J. H. Srawley, The Epistles of St. Ignatius, vol. 1 (1910) | Book Scan | `overlap` | https://archive.org/details/theepistlesofsti01srawuoft |
| SPCK ECC — J. H. Srawley, The Epistles of St. Ignatius, vol. 2 (1910) | Book Scan | `overlap` | https://archive.org/details/theepistlesofsti02srawuoft |
| SPCK ECC — F. R. Montgomery Hitchcock, Irenaeus, Against the Heresies, vol. 1 (1916) | Book Scan | `overlap` | https://archive.org/details/treatiseofiren01iren |
| SPCK ECC — F. R. Montgomery Hitchcock, Irenaeus, Against the Heresies, vol. 2 (1916) | Book Scan | `overlap` | https://archive.org/details/treatiseofiren02iren |
| SPCK ECC — Blomfield Jackson, St. Polycarp, Bishop of Smyrna (1898) | Book Scan | `overlap` | https://archive.org/details/stpolycarpbishop00polyuoft |
| SPCK ECC — F. R. Montgomery Hitchcock, Augustine, Treatise on the City of God (abridged) (1922) | Book Scan | `overlap` | https://archive.org/details/staugustinestrea00auguuoft |
| SPCK ECC — T. H. Bindley, St. Cyprian on the Lord’s Prayer (1914) | Book Scan | `overlap` | https://archive.org/details/stcyprianonlords00cypruoft |
| SPCK ECC — T. H. Bindley, The Epistle of the Gallican Churches (Lyons and Vienne), with Tertullian To the Martyrs and the Passion of Perpetua (1900) | Book Scan | `overlap` | https://archive.org/details/epistleofgallica00tertuoft |
| SPCK ECC — T. H. Bindley, The Commonitory of St. Vincent of Lerins (1914) | Book Scan | `overlap` | https://archive.org/details/commonitoryofstv00vincuoft |
| SPCK ECC — T. H. Bindley, Tertullian, On the Testimony of the Soul and On the Prescription of Heretics (1914) | Book Scan | `overlap` | https://archive.org/details/tertullianontest00tertuoft |
| SPCK ECC — J. H. Srawley, Gregory of Nyssa, The Catechetical Oration (1903) | Book Scan | `overlap` | https://archive.org/details/thecatecheticalo00greguoft |
| SPCK ECC — W. K. Lowther Clarke, Gregory of Nyssa, The Life of St. Macrina (1916) | Book Scan | `not_in_patrista` | https://archive.org/details/ldpd_11899093_000 |
| SPCK ECC — De Lacy O’Leary, The Apostolical Constitutions and Cognate Documents (1906) | Book Scan | `overlap` | https://archive.org/details/apostolicalconst00olea |
| SPCK ECC — R. H. Cresswell, The Liturgy of the Eighth Book of the Apostolic Constitutions (Clementine Liturgy) (1900) | Book Scan | `overlap` | https://archive.org/details/liturgyeighthbo00cresgoog |
| SPCK TCL — T. W. Crafer, The Apocriticus of Macarius Magnes (1919) | Book Scan | `not_in_patrista` | https://archive.org/details/apocriticusofmac00macauoft |
| SPCK TCL — Herbert Moore, The Dialogue of Palladius concerning the Life of Chrysostom (1921) | Book Scan | `not_in_patrista` | https://archive.org/details/thedialogueofpal00mooruoft |
| SPCK TCL — A. Lukyn Williams, Justin Martyr, The Dialogue with Trypho (1930) | Book Scan | `overlap` | https://archive.org/details/SPCKJustinMartyr |
| SPCK TCL — C. L. Feltoe, St. Dionysius of Alexandria: Letters and Treatises (1918) | Book Scan | `overlap` | https://archive.org/details/stdionysiusofale00dion |
| SPCK TCL — C. E. Rolt, Dionysius the Areopagite, On the Divine Names and The Mystical Theology (1920) | Book Scan | `not_in_patrista` | https://archive.org/details/dionysiusareopag00pseu |
| SPCK TCL — W. Metcalfe, Gregory Thaumaturgus, Address to Origen (1920) | Book Scan | `overlap` | https://archive.org/details/gregorythaumat00metcuoft |
| SPCK TCL — F. Legge, Hippolytus, Philosophumena, vol. 1 (1921) | Book Scan | `overlap` | https://archive.org/details/philosophumenaor01hippuoft |
| SPCK TCL — F. Legge, Hippolytus, Philosophumena, vol. 2 (1921) | Book Scan | `overlap` | https://archive.org/details/philosophumenaor02hipp |
| SPCK TCL — W. J. Ferrar, Eusebius, The Proof of the Gospel (Demonstratio Evangelica), vol. 1 (1920) | Book Scan | `not_in_patrista` | https://archive.org/details/proofofgospelbei01euseuoft |
| SPCK TCL — W. J. Ferrar, Eusebius, The Proof of the Gospel (Demonstratio Evangelica), vol. 2 (1920) | Book Scan | `not_in_patrista` | https://archive.org/details/proofofgospelbei02euseuoft |
| SPCK TCL — A. J. Mason, Fifty Spiritual Homilies of St. Macarius the Egyptian (1921) | Book Scan | `not_in_patrista` | https://archive.org/details/fiftyspiritualho00pseuuoft |
| SPCK TCL — W. J. Sparrow-Simpson, The Letters of St. Augustine (1919) | Book Scan | `overlap` | https://archive.org/details/lettersofstaugus00sparuoft |
| SPCK TCL — R. B. Tollinton, Selections from the Commentaries and Homilies of Origen (1929) | Book Scan | `overlap` | https://archive.org/details/selectionsfromco0000orig |
| SPCK TCL — J. H. Freese, Minucius Felix, The Octavius (1919) | Book Scan | `overlap` | https://archive.org/details/octaviusofminuci00minu |
| SPCK TCL — Herbert Moore, Novatian, On the Trinity (1919) | Book Scan | `overlap` | https://archive.org/details/treatiseofnovati00mooruoft |
| SPCK TCL — Alexander Souter, Tertullian, Concerning Prayer and Concerning Baptism (1919) | Book Scan | `overlap` | https://archive.org/details/treatisesconcern00tertuoft |
| SPCK TCL — Alexander Souter, Tertullian, Against Praxeas (1920) | Book Scan | `overlap` | https://archive.org/details/tertullianagains00tertrich |
| SPCK TCL — Alexander Souter, Tertullian, Concerning the Resurrection of the Flesh (1922) | Book Scan | `overlap` | https://archive.org/details/tertullianconcer00tertuoft |
| SPCK TCL — T. Thompson, St. Ambrose, On the Mysteries, with On the Sacraments (1919) | Book Scan | `overlap` | https://archive.org/details/stambroseonmyste00ambruoft |
| SPCK TCL — M. L. McClure and C. L. Feltoe, The Pilgrimage of Etheria (1919) | Book Scan | `not_in_patrista` | https://archive.org/details/pilgrimageofethe00mccliala |
| SPCK TCL — J. M. Harden, The Ethiopic Didascalia (1920) | Book Scan | `not_in_patrista` | https://archive.org/details/cu31924096083336 |
| SPCK TCL — J. Armitage Robinson, Irenaeus, The Demonstration of the Apostolic Preaching (1920) | Book Scan | `not_in_patrista` | https://archive.org/details/demonstrationofa00iren |
| SPCK TCL — T. A. Lacey, Select Epistles of St. Cyprian treating of the Episcopate (1922) | Book Scan | `overlap` | https://archive.org/details/selectepistles00cypruoft |
| SPCK TCL — W. K. Lowther Clarke, Palladius, The Lausiac History (1918) | Book Scan | `not_in_patrista` | https://archive.org/details/lausiachistoryof00palluoft |
| SPCK TCL Series VI — B. J. Kidd, Documents Illustrative of the History of the Church, vol. 1, to A.D. 313 (1920) | Book Scan | `overlap` | https://archive.org/details/documentsillustr01unknuoft |
| SPCK TCL Series VI — B. J. Kidd, Documents Illustrative of the History of the Church, vol. 2, A.D. 313–461 | Book Scan | `overlap` | https://archive.org/details/documentsillustr0002kidd |

## 5. Oriental, Syriac, Coptic, and Apocrypha volumes

### Lightfoot, *The Apostolic Fathers*

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| Lightfoot, The Apostolic Fathers, Part I. S. Clement of Rome, Vol. 1 (Macmillan, 1890, 2nd ed.) | Book Scan | `overlap` | https://archive.org/details/apostolicfathers0101clem |
| Lightfoot, The Apostolic Fathers, Part I. S. Clement of Rome, Vol. 2 (Macmillan, 1890, 2nd ed.) | Book Scan | `overlap` | https://archive.org/details/apostolicfathers0102clem |
| Lightfoot, The Apostolic Fathers, Part II. S. Ignatius, S. Polycarp, Vol. 1 (Macmillan, 1889, 2nd ed.) | Book Scan | `overlap` | https://archive.org/details/apostolicfathep2v1clemuoft |
| Lightfoot, The Apostolic Fathers, Part II. S. Ignatius, S. Polycarp, Vol. 2 (Macmillan, 1889, 2nd ed.) | Book Scan | `overlap` | https://archive.org/details/apostolicfathep2v2clemuoft |
| Lightfoot, The Apostolic Fathers, Part II. S. Ignatius, S. Polycarp, Vol. 3 (Macmillan, 1889, 2nd ed.) | Book Scan | `overlap` | https://archive.org/details/apostolicfathep2v3clemuoft |
| Lightfoot–Harmer, The Apostolic Fathers (1-vol. smaller ed., Macmillan, 1891) | Book Scan | `overlap` | https://archive.org/details/apostolicfathers00lighuoft |

### M. R. James

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| M. R. James, The Apocryphal New Testament (Oxford, 1924) | Book Scan | `overlap` | https://archive.org/details/JAMESApocryphalNewTestament1924 |
| M. R. James, The Lost Apocrypha of the Old Testament (SPCK, 1920) | Book Scan | `not_in_patrista` | https://archive.org/details/lostapocryphaofo00jameuoft |
| M. R. James, Apocrypha Anecdota (Cambridge Texts and Studies 2.3, 1893) | Book Scan | `not_in_patrista` | https://archive.org/details/apocryphaanecdot00jame |
| M. R. James, Apocrypha Anecdota, Second Series (Cambridge Texts and Studies 5, 1897) | Book Scan | `not_in_patrista` | https://archive.org/details/apocryphaanecdot05jame |
| M. R. James, Old Testament Legends (London, 1913) | Book Scan | `not_in_patrista` | https://archive.org/details/oldtestamentlege00jameiala |

### R. H. Charles

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| R. H. Charles, The Apocrypha and Pseudepigrapha of the Old Testament in English, Vol. 1: Apocrypha (Oxford, 1913) | Book Scan | `not_in_patrista` | https://archive.org/details/apocryphapseudep01charuoft |
| R. H. Charles, The Apocrypha and Pseudepigrapha of the Old Testament in English, Vol. 2: Pseudepigrapha (Oxford, 1913) | Book Scan | `overlap` | https://archive.org/details/apocryphapseudep02charuoft |
| R. H. Charles, The Book of Enoch (Oxford, 1893) | Book Scan | `not_in_patrista` | https://archive.org/details/cu31924014590545 |
| R. H. Charles, The Book of Enoch, or 1 Enoch (Oxford, 1912) | Book Scan | `not_in_patrista` | https://archive.org/details/bookofenochor1en00char |
| R. H. Charles, The Book of Jubilees, or The Little Genesis (London, 1902) | Book Scan | `not_in_patrista` | https://archive.org/details/bookofjubileesor00char |
| R. H. Charles, The Testaments of the Twelve Patriarchs (London, 1908) | Book Scan | `overlap` | https://archive.org/details/testamentsoftwel08char |
| W. R. Morfill & R. H. Charles, The Book of the Secrets of Enoch (Oxford, 1896) | Book Scan | `not_in_patrista` | https://archive.org/details/bookofsecretsofe00morf |

### E. A. Wallis Budge

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| Budge, The Paradise, or Garden of the Holy Fathers, Vol. 1 (Chatto & Windus, 1907) | Book Scan | `not_in_patrista` | https://archive.org/details/paradiseorgarden01anan |
| Budge, The Paradise, or Garden of the Holy Fathers, Vol. 2 (Chatto & Windus, 1907) | Book Scan | `not_in_patrista` | https://archive.org/details/paradiseorgarden02anan |
| Budge, The Book of Paradise (Lady Meux / Histories and Sayings of the Egyptian Desert), Vol. 1 (1904) | Book Scan | `not_in_patrista` | https://archive.org/details/bookofparadisebe01budguoft |
| Budge, The Book of Paradise (Lady Meux / Histories and Sayings of the Egyptian Desert), Vol. 2 (1904) | Book Scan | `not_in_patrista` | https://archive.org/details/bookofparadisebe02budguoft |
| Budge, Coptic Apocrypha in the Dialect of Upper Egypt (British Museum, 1913) | Book Scan | `not_in_patrista` | https://archive.org/details/copticapocryphai00budguoft |
| Budge, Coptic Homilies in the Dialect of Upper Egypt (British Museum, 1910) | Book Scan | `not_in_patrista` | https://archive.org/details/coptichomiliesin00budgrich |
| Budge, Coptic Martyrdoms etc. in the Dialect of Upper Egypt (British Museum, 1914) | Book Scan | `not_in_patrista` | https://archive.org/details/copticmartyrdoms0000unse |
| Budge, Miscellaneous Coptic Texts in the Dialect of Upper Egypt (British Museum, 1915) | Book Scan | `not_in_patrista` | https://archive.org/details/miscellaneouscop00budguoft |
| Budge, The Book of the Cave of Treasures (London, 1927) | Book Scan | `not_in_patrista` | https://archive.org/details/bookofcaveoftrea0000eawa |
| Budge, The Contendings of the Apostles, Vol. 2: English translation (Oxford, 1901) | Book Scan | `not_in_patrista` | https://archive.org/details/contendingsofapo02budguoft |
| Budge, The History of the Blessed Virgin Mary and the History of the Likeness of Christ, Vol. 2: English (Luzac, 1899) | Book Scan | `not_in_patrista` | https://archive.org/details/historyofblessed02budg |
| Budge, The Discourses of Philoxenus, Bishop of Mabbôgh, Vol. 2 (London, 1894) | Book Scan | `not_in_patrista` | https://archive.org/details/discoursesofphil02philuoft |

### Cureton, Wright, Payne Smith, Cowper

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| W. Cureton / W. Wright, Ancient Syriac Documents Relative to the Earliest Establishment of Christianity in Edessa (London, 1864) | Book Scan | `overlap` | https://archive.org/details/ancientsyriacdo00wriggoog |
| Cureton, The Festal Letters of Athanasius (London, 1848) | Book Scan | `overlap` | https://archive.org/details/festallettersofa00atha_0 |
| Cureton, Corpus Ignatianum: The Epistles of St. Ignatius (London, 1849) | Book Scan | `overlap` | https://archive.org/details/corpusignatianum00igna_0 |
| Cureton, Spicilegium Syriacum (London, 1855) | Book Scan | `not_in_patrista` | https://archive.org/details/spicilegiumsyria00cure |
| R. Payne Smith, Cyril of Alexandria, A Commentary upon the Gospel according to S. Luke, Vol. 1 (Oxford, 1859) | Book Scan | `not_in_patrista` | https://archive.org/details/commentaryupongo01cyri |
| R. Payne Smith, Cyril of Alexandria, A Commentary upon the Gospel according to S. Luke, Vol. 2 (Oxford, 1859) | Book Scan | `not_in_patrista` | https://archive.org/details/commentaryupongo02cyri |
| W. Wright, Apocryphal Acts of the Apostles, Vol. 2: English translation (London, 1871) | Book Scan | `not_in_patrista` | https://archive.org/details/apocryphalactsa02wriggoog |
| B. Harris Cowper, The Apocryphal Gospels and Other Documents Relating to the History of Christ (London, 1867) | Book Scan | `overlap` | https://archive.org/details/apocryphalgospel00cowp |
| B. Harris Cowper, Syriac Miscellanies (London, 1861) | Book Scan | `not_in_patrista` | https://archive.org/details/syriacmiscellani00cowp |

### Cambridge Texts and Studies, and related English fascicles

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| J. Rendel Harris / J. Armitage Robinson, The Apology of Aristides (Texts and Studies 1.1, Cambridge, 1891/1893) | Book Scan | `overlap` | https://archive.org/details/apologyofaristid00arisrich |
| J. Rendel Harris, The Newly Recovered Apology of Aristides (London, 1891) | Book Scan | `overlap` | https://archive.org/details/newlyrecoveredap00harr |
| R. H. Connolly, The Liturgical Homilies of Narsai (Texts and Studies 8.1, Cambridge, 1909) | Book Scan | `not_in_patrista` | https://archive.org/details/liturgicalhomili00narsuoft |
| J. H. Bernard, The Odes of Solomon (Texts and Studies 8.3, Cambridge, 1912) | Book Scan | `not_in_patrista` | https://archive.org/details/bwb_KU-998-841 |
| R. H. Connolly, The So-Called Egyptian Church Order and Derived Documents (Texts and Studies 8.4, Cambridge, 1916) | Book Scan | `not_in_patrista` | https://archive.org/details/socalledegyptian00connuoft |
| J. Rendel Harris, The Odes and Psalms of Solomon (Cambridge, 1909) | Book Scan | `not_in_patrista` | https://archive.org/details/cu31924029308669 |
| J. Rendel Harris & A. Mingana, The Odes and Psalms of Solomon, Vol. 2: The Translation (Manchester, 1916) | Book Scan | `not_in_patrista` | https://archive.org/details/odespsalmsofsolo02harruoft |

### Studia Sinaitica and Horae Semiticae (English volumes)

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| Margaret Dunlop Gibson, Apocrypha Sinaitica (Studia Sinaitica V, 1896) | Book Scan | `not_in_patrista` | https://archive.org/details/apocryphasinait00gibsgoog |
| Gibson, Apocrypha Arabica (Studia Sinaitica VIII, 1901) | Book Scan | `not_in_patrista` | https://archive.org/details/apocryphaarabica00gibsuoft |
| Agnes Smith Lewis, Select Narratives of Holy Women, English translation (Studia Sinaitica X, 1900) | Book Scan | `not_in_patrista` | https://archive.org/details/SelectNarrativesOfHolyWomen10 |
| Lewis, Apocrypha Syriaca: The Protevangelium Jacobi and Transitus Mariae (Studia Sinaitica XI, 1902) | Book Scan | `overlap` | https://archive.org/details/apocryphasyriac00goog |
| Gibson, The Didascalia Apostolorum in English (Horae Semiticae II, 1903) | Book Scan | `not_in_patrista` | https://archive.org/details/didascaliaaposto00gibsuoft |
| Lewis, The Mythological Acts of the Apostles (Horae Semiticae IV, English, 1904) | Book Scan | `not_in_patrista` | https://archive.org/details/mythologicalacts00lewi |
| Lewis, The Forty Martyrs of the Sinai Desert and the Story of Eulogios (Horae Semiticae IX, 1912) | Book Scan | `not_in_patrista` | https://archive.org/details/fortymartyrsofsi0000unse |

### Text and Translation Society

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| E. W. Brooks, The Sixth Book of the Select Letters of Severus of Antioch, Vol. 2 (Translation), Part 1 (1903) | Book Scan | `not_in_patrista` | https://archive.org/details/sixthbookselect01broogoog |
| Brooks, The Sixth Book of the Select Letters of Severus of Antioch, Vol. 2 (Translation), Part 2 (1904) | Book Scan | `not_in_patrista` | https://archive.org/details/sixthbookofselec0022seve |
| W. Riedel & W. E. Crum, The Canons of Athanasius of Alexandria (TTS, 1904) | Book Scan | `not_in_patrista` | https://archive.org/details/thecanonsofathan00rieduoft |
| R. H. Charles, The Chronicle of John, Bishop of Nikiu (TTS, 1916) | Book Scan | `not_in_patrista` | https://archive.org/details/JohnOfNikiuChronicle1916 |
| F. C. Burkitt, Euphemia and the Goth, with the Acts of Martyrdom of the Confessors of Edessa (TTS, 1913) | Book Scan | `not_in_patrista` | https://archive.org/details/euphemiagothwith00burk |
| F. C. Conybeare, The Armenian Version of Revelation and Cyril of Alexandria’s Scholia on the Incarnation (TTS, 1907) | Book Scan | `not_in_patrista` | https://archive.org/details/armenianversiono00cyririch |
| E. O. Winstedt, Coptic Texts on Saint Theodore the General, St. Theodore the Eastern, Chamoul and Justus (TTS, 1910) | Book Scan | `not_in_patrista` | https://archive.org/details/coptictextsonsai00wins |

### Patrologia Orientalis (pre-1931 tomes with English of pre-800 texts)

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| Patrologia Orientalis Tomus IV (includes E. J. Goodspeed, The Conflict of Severus, Patriarch of Antioch, English, 1908) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient04pari |
| Patrologia Orientalis Tomus VI (includes Brooks, Hymns of Severus and Others, English, Part I, 1911) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient06pariuoft |
| Patrologia Orientalis Tomus VII (includes Brooks, Hymns of Severus and Others, English, Part II, 1911) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient07pariuoft |
| Patrologia Orientalis Tomus XII (includes Brooks, Letters of Severus of Antioch, English, Part I; and Irenaeus, Proof of the Apostolic Preaching, English, 1919) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient12pariuoft |
| Patrologia Orientalis Tomus XIV (includes Brooks, Letters of Severus of Antioch, English, Part II, 1920) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient14pariuoft |
| Patrologia Orientalis Tomus XVII (includes Brooks, John of Ephesus, Lives of the Eastern Saints, English, I, 1923) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient17pariuoft |
| Patrologia Orientalis Tomus XVIII (includes Brooks, John of Ephesus, Lives of the Eastern Saints, English, II, 1924) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient18pariuoft |
| Patrologia Orientalis Tomus XIX (includes Brooks, John of Ephesus, Lives of the Eastern Saints, English, III, 1926) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient19pariuoft |
| Patrologia Orientalis Tomus XXII (includes De Lacy O’Leary, The Arabic Life of S. Pisentius, English, 1930) | Book Scan | `not_in_patrista` | https://archive.org/details/patrologiaorient22pariuoft |

## 6. Online web libraries and master collections

### One hub URL per library. Individual works inside these sites are not listed.

| Name & Volume | Type | Coverage | Verified URL |
|---|---|---|---|
| New Advent, Fathers of the Church (ANF / NPNF HTML) | Web Library | `hub` | https://www.newadvent.org/fathers/ |
| Roger Pearse / tertullian.org, Early Church Fathers — Additional Texts | Web Library | `hub` | https://www.tertullian.org/fathers/ |
| tertullian.org, ANF / NPNF HTML set (fathers2) | Web Library | `hub` | https://www.tertullian.org/fathers2/ |
| Early Christian Writings | Web Library | `hub` | https://www.earlychristianwritings.com/ |
| Fourth-Century Christianity (Glen L. Thompson) | Web Library | `hub` | https://www.fourthcentury.com/ |
| Early Church Texts | Web Library | `hub` | https://www.earlychurchtexts.com/ |
| Fordham Internet History Sourcebooks, Ancient History: Christian Origins | Web Library | `hub` | https://sourcebooks.fordham.edu/ancient/asbook11.asp |
| Fordham Internet Medieval Sourcebook (full-text sources, including early/medieval church) | Web Library | `hub` | https://sourcebooks.fordham.edu/sbook2.asp |
| Hanover Historical Texts Collection, Early Church | Web Library | `hub` | https://history.hanover.edu/earlychurch.html |
| Internet Sacred Text Archive, Early Church Fathers (live sacred-texts.com returned 403 from cataloguer host; this Wayback capture of the ECF index returned 200) | Web Library | `hub` | https://web.archive.org/web/20240207111926/https://sacred-texts.com/chr/ecf/index.htm |
| Wikisource, Ante-Nicene Fathers | Web Library | `hub` | https://en.wikisource.org/wiki/Ante-Nicene_Fathers |
| Wikisource, Nicene and Post-Nicene Fathers, Series I | Web Library | `hub` | https://en.wikisource.org/wiki/Nicene_and_Post-Nicene_Fathers:_Series_I |
| Wikisource, Nicene and Post-Nicene Fathers, Series II | Web Library | `hub` | https://en.wikisource.org/wiki/Nicene_and_Post-Nicene_Fathers:_Series_II |
| CCEL, Early Church Fathers hub | Web Library | `hub` | https://www.ccel.org/fathers.html |
| GitHub, Gregory Crane, ANF / NPNF TEI XML | Web Library | `hub` | https://github.com/gregorycrane/nicenefathers |
| GitHub, Historical Christian Faith, Writings-Database (ANF / NPNF / Pearse dumps) | Web Library | `hub` | https://github.com/HistoricalChristianFaith/Writings-Database |
| Historical Christian Faith (web front end of the Writings-Database) | Web Library | `hub` | https://historicalchristian.faith/ |
| Catholic Culture, Library of the Church Fathers | Web Library | `hub` | https://www.catholicculture.org/culture/library/fathers/ |
| University of Pennsylvania Online Books Page, Church fathers | Web Library | `hub` | https://onlinebooks.library.upenn.edu/webbin/book/lookupname?key=Church%20fathers |
| Elpenor, Home of the Greek Word (bilingual Greek/English fathers) | Web Library | `hub` | https://www.ellopos.net/elpenor/ |

## Not listed

- Lightfoot–Harmer Baker 1984 reprint (restricted); Griffith & Farran Wake *Apostolic Fathers* (not Lightfoot)
- Budge *Contendings* vol. 1 and *History of the Blessed Virgin Mary* vol. 1 (Ethiopic/Syriac text volumes)
- Wright *Apocryphal Acts* vol. 1 (Syriac text)
- Brooks TTS Severus vol. 1 (Syriac text)
- Ishoʿdad of Merv (c. 850); Thomas of Marga *Book of Governors* (840); John Kāmē
- Evetts *History of the Patriarchs* in PO 1/5/10 (10th-century compilation)
- S. C. Malan, *Conflicts of the Holy Apostles* (1871): no live Archive.org item; HathiTrust 403
- Loeb Eusebius HE vol. 2 (Oulton, 1932); Loeb Tertullian/Minucius (Glover, 1931); Loeb Jerome *Select Letters* (Wright, 1933); Loeb Basil *Letters* vol. 4 (1934)
- SPCK Kidd vol. 3 (1941)
- Project Gutenberg fathers pages: 503 from the cataloguer host
- Elpenor `/fathers/` index: 404; homepage listed instead
