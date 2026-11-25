#!/usr/bin/env python3
"""Emit catalog.jsonl and catalog.md from the row table below."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "pd-english-sources"

# id, section, group, name, type, url, coverage, note
ROWS: list[tuple[str, int, str, str, str, str, str, str]] = [
    # --- 1. CCEL ---
    ("s1-anf-01", 1, "ANF", "ANF Vol. 1. The Apostolic Fathers with Justin Martyr and Irenaeus", "TXT", "https://www.ccel.org/ccel/schaff/anf01.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-02", 1, "ANF", "ANF Vol. 2. Fathers of the Second Century: Hermas, Tatian, Athenagoras, Theophilus, Clement of Alexandria", "TXT", "https://www.ccel.org/ccel/schaff/anf02.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-03", 1, "ANF", "ANF Vol. 3. Latin Christianity: Its Founder, Tertullian", "TXT", "https://www.ccel.org/ccel/schaff/anf03.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-04", 1, "ANF", "ANF Vol. 4. Fathers of the Third Century: Tertullian Part Fourth; Minucius Felix; Commodian; Origen", "TXT", "https://www.ccel.org/ccel/schaff/anf04.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-05", 1, "ANF", "ANF Vol. 5. Fathers of the Third Century: Hippolytus, Cyprian, Caius, Novatian, Appendix", "TXT", "https://www.ccel.org/ccel/schaff/anf05.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-06", 1, "ANF", "ANF Vol. 6. Fathers of the Third Century: Gregory Thaumaturgus, Dionysius the Great, Julius Africanus, Anatolius and Minor Writers, Methodius, Arnobius", "TXT", "https://www.ccel.org/ccel/schaff/anf06.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-07", 1, "ANF", "ANF Vol. 7. Fathers of the Third and Fourth Centuries: Lactantius, Venantius, Asterius, Victorinus, Dionysius, Apostolic Teaching and Constitutions, Homily, Liturgies", "TXT", "https://www.ccel.org/ccel/schaff/anf07.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-08", 1, "ANF", "ANF Vol. 8. The Twelve Patriarchs, Excerpts and Epistles, The Clementina, Apocrypha, Decretals, Memoirs of Edessa and Syriac Documents, Remains of the First Ages", "TXT", "https://www.ccel.org/ccel/schaff/anf08.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-09", 1, "ANF", "ANF Vol. 9. Recently Discovered Additions to Early Christian Literature; Commentaries of Origen", "TXT", "https://www.ccel.org/ccel/schaff/anf09.txt", "in_patrista", "Fathers/English/ANF volume dump + author splits"),
    ("s1-anf-10", 1, "ANF", "ANF Vol. 10. Bibliographic Synopsis; General Index", "TXT", "https://www.ccel.org/ccel/schaff/anf10.txt", "in_patrista", "Fathers/English/ANF volume dump"),
    ("s1-npnf1-01", 1, "NPNF1", "NPNF I Vol. 1. Augustine: Prolegomena, Confessions, Letters", "TXT", "https://www.ccel.org/ccel/schaff/npnf101.txt", "in_patrista", "Fathers/English/NPNF1 + Augustine_English"),
    ("s1-npnf1-02", 1, "NPNF1", "NPNF I Vol. 2. Augustine: The City of God; Christian Doctrine", "TXT", "https://www.ccel.org/ccel/schaff/npnf102.txt", "in_patrista", "Fathers/English/NPNF1 + Augustine_English"),
    ("s1-npnf1-03", 1, "NPNF1", "NPNF I Vol. 3. Augustine: On the Holy Trinity; Doctrinal Treatises; Moral Treatises", "TXT", "https://www.ccel.org/ccel/schaff/npnf103.txt", "in_patrista", "Fathers/English/NPNF1 + Augustine_English"),
    ("s1-npnf1-04", 1, "NPNF1", "NPNF I Vol. 4. Augustine: Anti-Manichaean Writings; Anti-Donatist Writings", "TXT", "https://www.ccel.org/ccel/schaff/npnf104.txt", "in_patrista", "Fathers/English/NPNF1 + Augustine_English"),
    ("s1-npnf1-05", 1, "NPNF1", "NPNF I Vol. 5. Augustine: Anti-Pelagian Writings", "TXT", "https://www.ccel.org/ccel/schaff/npnf105.txt", "in_patrista", "Fathers/English/NPNF1 + Augustine_English"),
    ("s1-npnf1-06", 1, "NPNF1", "NPNF I Vol. 6. Augustine: Sermon on the Mount; Harmony of the Gospels; Homilies on the Gospels", "TXT", "https://www.ccel.org/ccel/schaff/npnf106.txt", "in_patrista", "Fathers/English/NPNF1 + Augustine_English"),
    ("s1-npnf1-07", 1, "NPNF1", "NPNF I Vol. 7. Augustine: Homilies on the Gospel of John; Homilies on 1 John; Soliloquies", "TXT", "https://www.ccel.org/ccel/schaff/npnf107.txt", "in_patrista", "Fathers/English/NPNF1 + Augustine_English"),
    ("s1-npnf1-08", 1, "NPNF1", "NPNF I Vol. 8. Augustine: Expositions on the Psalms", "TXT", "https://www.ccel.org/ccel/schaff/npnf108.txt", "in_patrista", "Fathers/English/NPNF1 + Augustine_English"),
    ("s1-npnf1-09", 1, "NPNF1", "NPNF I Vol. 9. Chrysostom: On the Priesthood; Ascetic Treatises; Select Homilies and Letters; Homilies on the Statutes", "TXT", "https://www.ccel.org/ccel/schaff/npnf109.txt", "in_patrista", "Fathers/English/NPNF1 + Chrysostom_English"),
    ("s1-npnf1-10", 1, "NPNF1", "NPNF I Vol. 10. Chrysostom: Homilies on the Gospel of St. Matthew", "TXT", "https://www.ccel.org/ccel/schaff/npnf110.txt", "in_patrista", "Fathers/English/NPNF1 + Chrysostom_English"),
    ("s1-npnf1-11", 1, "NPNF1", "NPNF I Vol. 11. Chrysostom: Homilies on Acts and Romans", "TXT", "https://www.ccel.org/ccel/schaff/npnf111.txt", "in_patrista", "Fathers/English/NPNF1 + Chrysostom_English"),
    ("s1-npnf1-12", 1, "NPNF1", "NPNF I Vol. 12. Chrysostom: Homilies on First and Second Corinthians", "TXT", "https://www.ccel.org/ccel/schaff/npnf112.txt", "in_patrista", "Fathers/English/NPNF1 + Chrysostom_English"),
    ("s1-npnf1-13", 1, "NPNF1", "NPNF I Vol. 13. Chrysostom: Homilies on Galatians, Ephesians, Philippians, Colossians, Thessalonians, Timothy, Titus, Philemon", "TXT", "https://www.ccel.org/ccel/schaff/npnf113.txt", "in_patrista", "Fathers/English/NPNF1 + Chrysostom_English"),
    ("s1-npnf1-14", 1, "NPNF1", "NPNF I Vol. 14. Chrysostom: Homilies on the Gospel of St. John and the Epistle to the Hebrews", "TXT", "https://www.ccel.org/ccel/schaff/npnf114.txt", "in_patrista", "Fathers/English/NPNF1 + Chrysostom_English"),
    ("s1-npnf2-01", 1, "NPNF2", "NPNF II Vol. 1. Eusebius: Church History; Life of Constantine; Oration in Praise of Constantine", "TXT", "https://www.ccel.org/ccel/schaff/npnf201.txt", "in_patrista", "Fathers/English/NPNF2 + Eusebius_English"),
    ("s1-npnf2-02", 1, "NPNF2", "NPNF II Vol. 2. Socrates and Sozomenus: Ecclesiastical Histories", "TXT", "https://www.ccel.org/ccel/schaff/npnf202.txt", "in_patrista", "Fathers/English/NPNF2 + Socrates_English + Sozomen_English"),
    ("s1-npnf2-03", 1, "NPNF2", "NPNF II Vol. 3. Theodoret, Jerome, Gennadius, and Rufinus: Historical Writings", "TXT", "https://www.ccel.org/ccel/schaff/npnf203.txt", "in_patrista", "Fathers/English/NPNF2"),
    ("s1-npnf2-04", 1, "NPNF2", "NPNF II Vol. 4. Athanasius: Select Works and Letters", "TXT", "https://www.ccel.org/ccel/schaff/npnf204.txt", "in_patrista", "Fathers/English/NPNF2 + Athanasius_English"),
    ("s1-npnf2-05", 1, "NPNF2", "NPNF II Vol. 5. Gregory of Nyssa: Dogmatic Treatises; Select Writings and Letters", "TXT", "https://www.ccel.org/ccel/schaff/npnf205.txt", "in_patrista", "Fathers/English/NPNF2 + Gregory_Nyssa_English"),
    ("s1-npnf2-06", 1, "NPNF2", "NPNF II Vol. 6. Jerome: Letters and Select Works", "TXT", "https://www.ccel.org/ccel/schaff/npnf206.txt", "in_patrista", "Fathers/English/NPNF2 + Jerome_English"),
    ("s1-npnf2-07", 1, "NPNF2", "NPNF II Vol. 7. Cyril of Jerusalem; Gregory Nazianzen", "TXT", "https://www.ccel.org/ccel/schaff/npnf207.txt", "in_patrista", "Fathers/English/NPNF2"),
    ("s1-npnf2-08", 1, "NPNF2", "NPNF II Vol. 8. Basil: Letters and Select Works", "TXT", "https://www.ccel.org/ccel/schaff/npnf208.txt", "in_patrista", "Fathers/English/NPNF2 + Basil_English"),
    ("s1-npnf2-09", 1, "NPNF2", "NPNF II Vol. 9. Hilary of Poitiers; John of Damascus", "TXT", "https://www.ccel.org/ccel/schaff/npnf209.txt", "in_patrista", "Fathers/English/NPNF2"),
    ("s1-npnf2-10", 1, "NPNF2", "NPNF II Vol. 10. Ambrose: Select Works and Letters", "TXT", "https://www.ccel.org/ccel/schaff/npnf210.txt", "in_patrista", "Fathers/English/NPNF2 + Ambrose_English"),
    ("s1-npnf2-11", 1, "NPNF2", "NPNF II Vol. 11. Sulpitius Severus; Vincent of Lerins; John Cassian", "TXT", "https://www.ccel.org/ccel/schaff/npnf211.txt", "in_patrista", "Fathers/English/NPNF2 + Cassian_English"),
    ("s1-npnf2-12", 1, "NPNF2", "NPNF II Vol. 12. Leo the Great; Gregory the Great", "TXT", "https://www.ccel.org/ccel/schaff/npnf212.txt", "in_patrista", "Fathers/English/NPNF2; Gregory is Pastoral Rule + selected epistles only"),
    ("s1-npnf2-13", 1, "NPNF2", "NPNF II Vol. 13. Gregory the Great II; Ephraim Syrus; Aphrahat", "TXT", "https://www.ccel.org/ccel/schaff/npnf213.txt", "in_patrista", "Fathers/English/NPNF2 + Ephraim_English + Aphrahat_English"),
    ("s1-npnf2-14", 1, "NPNF2", "NPNF II Vol. 14. The Seven Ecumenical Councils", "TXT", "https://www.ccel.org/ccel/schaff/npnf214.txt", "in_patrista", "Fathers/English/NPNF2 + Councils_English"),
    ("s1-ccel-hub", 1, "CCEL extra", "CCEL Early Church Fathers series hub (ANF + NPNF I–II)", "Web Library", "https://www.ccel.org/fathers.html", "hub", "Already the source of Fathers/English volume dumps"),
    ("s1-pearse-ccel", 1, "CCEL extra", "Roger Pearse, Early Church Fathers — Additional Texts (More Fathers)", "Web Library", "https://www.ccel.org/ccel/pearse/morefathers/files/morefathers.html", "hub", "Large English mine not ingested; same corpus as tertullian.org/fathers/"),
    ("s1-bede-sellar", 1, "CCEL extra", "Bede, Ecclesiastical History of England (A. M. Sellar, 1907)", "TXT", "https://www.ccel.org/ccel/bede/history.txt", "not_in_patrista", "Bede is Latin only (Fathers/Latin/Bede_Latin)"),
    ("s1-athanasius-incarnation", 1, "CCEL extra", "Athanasius, On the Incarnation of the Word (Archibald Robertson, 1891)", "TXT", "https://www.ccel.org/ccel/athanasius/incarnation.txt", "overlap", "Same work already in Athanasius_English/On the Incarnation of the Word.txt (NPNF)"),
    ("s1-cassian-conferences", 1, "CCEL extra", "John Cassian, Conferences", "TXT", "https://www.ccel.org/ccel/cassian/conferences.txt", "overlap", "Already in Cassian_English/The Conferences.txt from NPNF II 11"),
    ("s1-schaff-creeds2", 1, "CCEL extra", "Schaff, Creeds of Christendom, Vol. 2 (ante-Nicene / Nicene rules of faith and creeds)", "TXT", "https://www.ccel.org/ccel/schaff/creeds2.txt", "not_in_patrista", "Creed anthology, not in Fathers/English"),
    # --- 2. ANCL ---
    ("s2-ancl-01", 2, "ANCL", "ANCL Vol. 1. The Apostolic Fathers (1867)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol011867", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-02", 2, "ANCL", "ANCL Vol. 2. Justin Martyr and Athenagoras (1867)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol021867", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-03", 2, "ANCL", "ANCL Vol. 3. Tatian, Theophilus, and the Clementine Recognitions (1867)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol031867", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-04", 2, "ANCL", "ANCL Vol. 4. Clement of Alexandria, Vol. I (1867)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol041867", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-05", 2, "ANCL", "ANCL Vol. 5. Irenaeus, Vol. I (1868)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol051868", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-06", 2, "ANCL", "ANCL Vol. 6. Hippolytus, Bishop of Rome, Vol. I (1868)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol061868", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-07", 2, "ANCL", "ANCL Vol. 7. Tertullianus Against Marcion (1868)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol071868", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-08", 2, "ANCL", "ANCL Vol. 8. The Writings of Cyprian, Vol. I (1868)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol081868", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-09", 2, "ANCL", "ANCL Vol. 9. Irenaeus Vol. II; Hippolytus Vol. II; Fragments of the Third Century (1869)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol091869", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-10", 2, "ANCL", "ANCL Vol. 10. The Writings of Origen, Vol. I (1869)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol101869", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-11", 2, "ANCL", "ANCL Vol. 11. The Writings of Tertullian, Vol. I (1869)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol111869", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-12", 2, "ANCL", "ANCL Vol. 12. Clement of Alexandria, Vol. II (1869)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol121869", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-13", 2, "ANCL", "ANCL Vol. 13. The Writings of Cyprian, Vol. II; Passion of Perpetua; Novatian; Minucius Felix (1869)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol131869", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-14", 2, "ANCL", "ANCL Vol. 14. The Writings of Methodius and others (1869)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol141869", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-15", 2, "ANCL", "ANCL Vol. 15. The Writings of Tertullian, Vol. II (1870)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol151870", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-16", 2, "ANCL", "ANCL Vol. 16. Apocryphal Gospels, Acts, and Revelations (1870)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol161870", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-17", 2, "ANCL", "ANCL Vol. 17. The Clementine Homilies; The Apostolical Constitutions (1870)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol171870", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-18", 2, "ANCL", "ANCL Vol. 18. The Writings of Tertullian, Vol. III; Victorinus; Commodianus (1870)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol181870", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-19", 2, "ANCL", "ANCL Vol. 19. The Seven Books of Arnobius Adversus Gentes (1871)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol191871", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-20", 2, "ANCL", "ANCL Vol. 20. Gregory Thaumaturgus, Dionysius of Alexandria, and Archelaus (1871)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol201871", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-21", 2, "ANCL", "ANCL Vol. 21. The Works of Lactantius, Vol. I (1871)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol211871", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-22", 2, "ANCL", "ANCL Vol. 22. The Works of Lactantius, Vol. II; Testaments of the Twelve Patriarchs; Fragments (1871)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol221871", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-23", 2, "ANCL", "ANCL Vol. 23. Origen Contra Celsum, Books 2–8 (1872)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol231872", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    ("s2-ancl-24", 2, "ANCL", "ANCL Vol. 24. Early Liturgies and Other Documents (1872)", "Book Scan", "https://archive.org/details/AnteNiceneChristianLibraryVol241872", "overlap", "Same Roberts–Donaldson English as ANF; scans not stored"),
    # --- 3. LFC ---
    ("s3-lfc-01", 3, "LFC", "LFC Vol. 1. Augustine, Confessions (Pusey, 1838)", "Book Scan", "https://archive.org/details/a545547600auguuoft", "overlap", "Pusey edition; NPNF Confessions already in Augustine_English"),
    ("s3-lfc-02", 3, "LFC", "LFC Vol. 2. Cyril of Jerusalem, Catechetical Lectures (R. W. Church, 1838)", "Book Scan", "https://archive.org/details/catecheticallect00cyririch", "overlap", "NPNF II 7 already has Catechetical Lectures"),
    ("s3-lfc-03", 3, "LFC", "LFC Vol. 3. Cyprian, Treatises (Thornton & Newman, 1839)", "Book Scan", "https://archive.org/details/treatisesofscaec00cypruoft", "overlap", "ANF Cyprian treatises already in Cyprian_English"),
    ("s3-lfc-04", 3, "LFC", "LFC Vol. 4. Chrysostom, Homilies on 1 Corinthians, Pt. 1, Hom. 1–24 (1839)", "Book Scan", "https://archive.org/details/thehomiliesofchr01chryuoft", "overlap", "NPNF I 12 already has these homilies"),
    ("s3-lfc-05", 3, "LFC", "LFC Vol. 5. Chrysostom, Homilies on 1 Corinthians, Pt. 2, Hom. 25–44 (1839)", "Book Scan", "https://archive.org/details/thehomiliesofsjo00chryuoft", "overlap", "NPNF I 12 already has these homilies"),
    ("s3-lfc-06", 3, "LFC", "LFC Vol. 6. Chrysostom, Commentary on Galatians and Homilies on Ephesians (1840)", "Book Scan", "https://archive.org/details/commentary00newmuoft", "overlap", "NPNF I 13 already has these homilies"),
    ("s3-lfc-07", 3, "LFC", "LFC Vol. 7. Chrysostom, Homilies on Romans (1841)", "Book Scan", "https://archive.org/details/homiliesofsjohnc07john", "overlap", "NPNF I 11 already has these homilies"),
    ("s3-lfc-08", 3, "LFC", "LFC Vol. 8. Athanasius, Select Treatises against the Arians, Pt. 1 (Newman, 1842)", "Book Scan", "https://archive.org/details/selecttreatiseso08atha", "overlap", "NPNF II 4 already has Discourses Against the Arians"),
    ("s3-lfc-09", 3, "LFC", "LFC Vol. 9. Chrysostom, Homilies on the Statues (1842)", "Book Scan", "https://archive.org/details/homiliesofsjohnc09john", "overlap", "NPNF I 9 already has Homilies on the Statutes"),
    ("s3-lfc-10", 3, "LFC", "LFC Vol. 10. Tertullian, Apologetic and Practical Treatises (Dodgson, 1842)", "Book Scan", "https://archive.org/details/tertullian10tert", "overlap", "ANF Tertullian already in Tertullian_English"),
    ("s3-lfc-11", 3, "LFC", "LFC Vol. 11. Chrysostom, Homilies on Matthew, Pt. 1, Hom. 1–25 (1843)", "Book Scan", "https://archive.org/details/homiliesofsjohnc11john", "overlap", "NPNF I 10 already has Homilies on Matthew"),
    ("s3-lfc-12", 3, "LFC", "LFC Vol. 12. Chrysostom, Homilies on Timothy, Titus, and Philemon (1843)", "Book Scan", "https://archive.org/details/homiliesofsjohnc12john", "overlap", "NPNF I 13 already has these homilies"),
    ("s3-lfc-13", 3, "LFC", "LFC Vol. 13. Athanasius, Historical Tracts (1843)", "Book Scan", "https://archive.org/details/historicaltracts13atha", "overlap", "NPNF II 4 already has historical tracts"),
    ("s3-lfc-14", 3, "LFC", "LFC Vol. 14. Chrysostom, Homilies on Philippians, Colossians, and Thessalonians (1843)", "Book Scan", "https://archive.org/details/homiliesofsjohnc14john", "overlap", "NPNF I 13 already has these homilies"),
    ("s3-lfc-15", 3, "LFC", "LFC Vol. 15. Chrysostom, Homilies on Matthew, Pt. 2, Hom. 26–58 (1843)", "Book Scan", "https://archive.org/details/homiliesofsjohnc15john", "overlap", "NPNF I 10 already has Homilies on Matthew"),
    ("s3-lfc-16", 3, "LFC", "LFC Vol. 16. Augustine, Sermons on selected NT lessons, Vol. 1 (1844)", "Book Scan", "https://archive.org/details/sermonsonselecte16augu", "overlap", "NPNF I 6 already has Homilies on the Gospels"),
    ("s3-lfc-17", 3, "LFC", "LFC Vol. 17. Cyprian, Epistles, with Pacian (1844)", "Book Scan", "https://archive.org/details/epistlesofscypri17cypr", "overlap", "ANF Cyprian epistles already in Cyprian_English"),
    ("s3-lfc-18", 3, "LFC", "LFC Vol. 18. Gregory the Great, Morals on Job, Pt. 1, Books 1–10 (1844)", "Book Scan", "https://archive.org/details/moralsonbookofjo01greguoft", "not_in_patrista", "NPNF Gregory is Pastoral Rule + selected epistles only; no Morals on Job"),
    ("s3-lfc-19", 3, "LFC", "LFC Vol. 19. Athanasius, Select Treatises against the Arians, Pt. 2 (1844)", "Book Scan", "https://archive.org/details/selecttreatiseso19atha", "overlap", "NPNF II 4 already has Discourses Against the Arians"),
    ("s3-lfc-20", 3, "LFC", "LFC Vol. 20. Augustine, Sermons on selected NT lessons, Vol. 2 (1845)", "Book Scan", "https://archive.org/details/sermonsonselecte20augu", "overlap", "NPNF I 6 already has Homilies on the Gospels"),
    ("s3-lfc-21", 3, "LFC", "LFC Vol. 21. Gregory the Great, Morals on Job, Pt. 2, Books 11–22 (1845)", "Book Scan", "https://archive.org/details/moralsonbookofj234greguoft", "not_in_patrista", "No English Morals on Job in Fathers/English"),
    ("s3-lfc-22", 3, "LFC", "LFC Vol. 22. Augustine, Seventeen Short Treatises (1847)", "Book Scan", "https://archive.org/details/seventeenshorttr22augu", "overlap", "Most treatises already in Augustine_English from NPNF; scratch has a dump of this scan"),
    ("s3-lfc-23", 3, "LFC", "LFC Vol. 23. Gregory the Great, Morals on Job, Pt. 3, Books 23–29 (1847)", "Book Scan", "https://archive.org/details/p1moralsonbookjo03greguoft", "not_in_patrista", "No English Morals on Job in Fathers/English"),
    ("s3-lfc-24", 3, "LFC", "LFC Vol. 24. Augustine, Expositions on the Psalms, Vol. 1, Pss. 1–36 (1847)", "Book Scan", "https://archive.org/details/expositionsonboo24augu", "overlap", "NPNF I 8 already has Expositions on the Psalms"),
    ("s3-lfc-25", 3, "LFC", "LFC Vol. 25. Augustine, Expositions on the Psalms, Vol. 2, Pss. 37–52 (1847)", "Book Scan", "https://archive.org/details/expositionsonboo25augu", "overlap", "NPNF I 8 already has Expositions on the Psalms"),
    ("s3-lfc-26", 3, "LFC", "LFC Vol. 26. Augustine, Homilies on John and 1 John, Pt. 1 (1848)", "Book Scan", "https://archive.org/details/homiliesongospel26augu", "overlap", "NPNF I 7 already has these homilies"),
    ("s3-lfc-27", 3, "LFC", "LFC Vol. 27. Chrysostom, Homilies on 2 Corinthians (1848)", "Book Scan", "https://archive.org/details/homiliesofsjohnc27john", "overlap", "NPNF I 12 already has these homilies"),
    ("s3-lfc-28", 3, "LFC", "LFC Vol. 28. Chrysostom, Homilies on John, Pt. 1, Hom. 1–41 (1848)", "Book Scan", "https://archive.org/details/homiliesofsjohnc28john", "overlap", "NPNF I 14 already has Homilies on John"),
    ("s3-lfc-29", 3, "LFC", "LFC Vol. 29. Augustine, Homilies on John and 1 John, Pt. 2 (1849)", "Book Scan", "https://archive.org/details/homiliesongospel29augu", "overlap", "NPNF I 7 already has these homilies"),
    ("s3-lfc-30", 3, "LFC", "LFC Vol. 30. Augustine, Expositions on the Psalms, Vol. 3, Pss. 53–75 (1849)", "Book Scan", "https://archive.org/details/expositionsonboo30augu", "overlap", "NPNF I 8 already has Expositions on the Psalms"),
    ("s3-lfc-31", 3, "LFC", "LFC Vol. 31. Gregory the Great, Morals on Job, Pt. 4, Books 30–35 (1850)", "Book Scan", "https://archive.org/details/p2moralsonbookof03greguoft", "not_in_patrista", "No English Morals on Job in Fathers/English"),
    ("s3-lfc-32", 3, "LFC", "LFC Vol. 32. Augustine, Expositions on the Psalms, Vol. 4, Pss. 76–101 (1850)", "Book Scan", "https://archive.org/details/expositionsonboo32augu", "overlap", "NPNF I 8 already has Expositions on the Psalms"),
    ("s3-lfc-33", 3, "LFC", "LFC Vol. 33. Chrysostom, Homilies on Acts, Pt. 1, Hom. 1–28 (1851)", "Book Scan", "https://archive.org/details/homiliesofsjohnc33john", "overlap", "NPNF I 11 already has Homilies on Acts"),
    ("s3-lfc-34", 3, "LFC", "LFC Vol. 34. Chrysostom, Homilies on Matthew, Pt. 3, Hom. 59–90 (1851)", "Book Scan", "https://archive.org/details/homiliesofsjohnc34john", "overlap", "NPNF I 10 already has Homilies on Matthew"),
    ("s3-lfc-35", 3, "LFC", "LFC Vol. 35. Chrysostom, Homilies on Acts, Pt. 2, Hom. 29–55 (1851)", "Book Scan", "https://archive.org/details/homiliesofsjohnc35john", "overlap", "NPNF I 11 already has Homilies on Acts"),
    ("s3-lfc-36", 3, "LFC", "LFC Vol. 36. Chrysostom, Homilies on John, Pt. 2, Hom. 42–88 (1848/1852)", "Book Scan", "https://archive.org/details/homiliesofsjohnc36john", "overlap", "NPNF I 14 already has Homilies on John"),
    ("s3-lfc-37", 3, "LFC", "LFC Vol. 37. Augustine, Expositions on the Psalms, Vol. 5, Pss. 102–125 (1853)", "Book Scan", "https://archive.org/details/expositionsonthe05auguuoft", "overlap", "NPNF I 8 already has Expositions on the Psalms"),
    ("s3-lfc-38", 3, "LFC", "LFC Vol. 38. Athanasius, Festal Epistles (1854)", "Book Scan", "https://archive.org/details/festalepistlesof38atha", "overlap", "NPNF II 4 already has Festal Letters"),
    ("s3-lfc-39", 3, "LFC", "LFC Vol. 39. Augustine, Expositions on the Psalms, Vol. 6, Pss. 126–150", "Book Scan", "https://archive.org/details/expositionsonboo39augu", "overlap", "NPNF I 8 already has Expositions on the Psalms"),
    ("s3-lfc-40", 3, "LFC", "LFC Vol. 40. Justin Martyr, Works now extant (Davie, 1861)", "Book Scan", "https://archive.org/details/worksnowextantof40just", "overlap", "ANF Justin already in Justin_English"),
    ("s3-lfc-41", 3, "LFC", "LFC Vol. 41. Ephrem the Syrian, Select Works / Rhythms (J. B. Morris, 1847)", "Book Scan", "https://archive.org/details/selectworksofsep41ephr", "overlap", "NPNF II 13 has a smaller Ephrem selection; Morris is a different set"),
    ("s3-lfc-42", 3, "LFC", "LFC Vol. 42. Irenaeus, Five Books against Heresies (Keble, 1872)", "Book Scan", "https://archive.org/details/fivebooksofsiren42iren", "overlap", "ANF Irenaeus already in Irenaeus_English"),
    ("s3-lfc-43", 3, "LFC", "LFC Vol. 43. Cyril of Alexandria, Commentary on John, Pt. 1 (P. E. Pusey, 1874)", "Book Scan", "https://archive.org/details/commentaryongosp01cyri", "not_in_patrista", "No Cyril of Alexandria English in Fathers/English"),
    ("s3-lfc-44", 3, "LFC", "LFC Vol. 44. Chrysostom, Homilies on Hebrews (1877)", "Book Scan", "https://archive.org/details/homiliesofsjohnc44john", "overlap", "NPNF I 14 already has Homilies on Hebrews"),
    ("s3-lfc-45", 3, "LFC", "LFC Vol. 45. Ambrose, Letters (1881)", "Book Scan", "https://archive.org/details/lettersofsambros45ambr", "overlap", "NPNF II 10 already has Ambrose Letters"),
    ("s3-lfc-46", 3, "LFC", "LFC Vol. 46. Athanasius, Later Treatises, with appendix on Cyril and Theodoret (Bright, 1881)", "Book Scan", "https://archive.org/details/latertreatisesof00atharich", "overlap", "Most Athanasius already in NPNF II 4; appendix has extra Cyril/Theodoret"),
    ("s3-lfc-47", 3, "LFC", "LFC Vol. 47. Cyril of Alexandria, Five Tomes against Nestorius; Scholia; Christ is One; fragments (1881)", "Book Scan", "https://archive.org/details/fivetomesagainst47cyri", "not_in_patrista", "No Cyril of Alexandria English in Fathers/English"),
    ("s3-lfc-48", 3, "LFC", "LFC Vol. 48. Cyril of Alexandria, Commentary on John, Pt. 2 (T. Randell, 1885)", "Book Scan", "https://archive.org/details/commentaryongosp02cyri", "not_in_patrista", "No Cyril of Alexandria English in Fathers/English"),
    # --- 4. Secondary print series ---
    ("s4-bagster-01", 4, "Bagster", "Bagster Greek Ecclesiastical Historians, vol. 1 — Eusebius, Life of Constantine (1843)", "Book Scan", "https://archive.org/details/greekecclesiasti01lond", "overlap", "NPNF II 1 already has Life of Constantine"),
    ("s4-bagster-02", 4, "Bagster", "Bagster Greek Ecclesiastical Historians, vol. 2 — Eusebius, Ecclesiastical History to A.D. 324 (1843)", "Book Scan", "https://archive.org/details/greekecclesiasti02lond", "overlap", "NPNF II 1 already has Eusebius HE"),
    ("s4-bagster-03", 4, "Bagster", "Bagster Greek Ecclesiastical Historians, vol. 3 — Socrates Scholasticus, Ecclesiastical History (1844)", "Book Scan", "https://archive.org/details/greekecclesiasti03lond", "overlap", "NPNF II 2 already has Socrates HE"),
    ("s4-bagster-04", 4, "Bagster", "Bagster Greek Ecclesiastical Historians, vol. 4 — Sozomen, Ecclesiastical History (1846)", "Book Scan", "https://archive.org/details/greekecclesiasti04lond", "overlap", "NPNF II 2 already has Sozomen HE"),
    ("s4-bagster-05", 4, "Bagster", "Bagster Greek Ecclesiastical Historians, vol. 5 — Theodoret, Ecclesiastical History (1843)", "Book Scan", "https://archive.org/details/greekecclesiasti05lond", "overlap", "NPNF II 3 already has Theodoret HE"),
    ("s4-bagster-06", 4, "Bagster", "Bagster Greek Ecclesiastical Historians, vol. 6 — Evagrius Scholasticus, Ecclesiastical History (1846)", "Book Scan", "https://archive.org/details/greekecclesiasti06lond", "not_in_patrista", "Evagrius Scholasticus is not in Fathers/English"),
    ("s4-bohn-eusebius", 4, "Bohn", "Bohn Ecclesiastical Library — Eusebius, Ecclesiastical History, trans. C. F. Cruse (1851)", "Book Scan", "https://archive.org/details/ecclesiasticalh00crusgoog", "overlap", "NPNF II 1 already has Eusebius HE"),
    ("s4-bohn-socrates", 4, "Bohn", "Bohn Ecclesiastical Library — Socrates, Ecclesiastical History", "Book Scan", "https://archive.org/details/ecclesiasticalhi00socruoft", "overlap", "NPNF II 2 already has Socrates HE"),
    ("s4-bohn-sozomen", 4, "Bohn", "Bohn Ecclesiastical Library — Sozomen, Ecclesiastical History, with Philostorgius", "Book Scan", "https://archive.org/details/theecclesiastica00sozouoft", "overlap", "Sozomen is in NPNF; Philostorgius excerpt is extra"),
    ("s4-bohn-theodoret-evagrius", 4, "Bohn", "Bohn Ecclesiastical Library — Theodoret and Evagrius, History of the Church, trans. Edward Walford (1854)", "Book Scan", "https://archive.org/details/ahistorychurchf00walfgoog", "overlap", "Theodoret is in NPNF; Evagrius English is new"),
    ("s4-bohn-philo-01", 4, "Bohn", "Bohn — Philo Judaeus, Works, trans. C. D. Yonge, vol. 1", "Book Scan", "https://archive.org/details/worksofphilojuda01phil", "not_in_patrista", "Philo is not in Fathers/English (Josephus is)"),
    ("s4-bohn-philo-02", 4, "Bohn", "Bohn — Philo Judaeus, Works, trans. C. D. Yonge, vol. 2", "Book Scan", "https://archive.org/details/worksofphilojuda02phil", "not_in_patrista", "Philo is not in Fathers/English"),
    ("s4-bohn-philo-03", 4, "Bohn", "Bohn — Philo Judaeus, Works, trans. C. D. Yonge, vol. 3", "Book Scan", "https://archive.org/details/worksphilojudaeu03philuoft", "not_in_patrista", "Philo is not in Fathers/English"),
    ("s4-bohn-philo-04", 4, "Bohn", "Bohn — Philo Judaeus, Works, trans. C. D. Yonge, vol. 4", "Book Scan", "https://archive.org/details/theworksofphiloj04yonguoft", "not_in_patrista", "Philo is not in Fathers/English"),
    ("s4-bohn-bede-giles", 4, "Bohn", "Bohn Antiquarian Library — Bede, Ecclesiastical History of England, also the Anglo-Saxon Chronicle, ed. J. A. Giles (1859)", "Book Scan", "https://archive.org/details/venerablebedesec00bede", "not_in_patrista", "Bede English is not in Fathers/English"),
    ("s4-che-bede", 4, "CHE", "Church Historians of England, vol. 1, part 2 — Bede, Historical Works (Stevenson)", "Book Scan", "https://archive.org/details/churchhistorpt201unknuoft", "not_in_patrista", "Bede English is not in Fathers/English"),
    ("s4-giles-gildas-nennius", 4, "CHE", "J. A. Giles, The Works of Gildas and Nennius", "Book Scan", "https://archive.org/details/b29339364", "not_in_patrista", "Gildas/Nennius not in Fathers/English"),
    ("s4-giles-six-chronicles", 4, "CHE", "J. A. Giles, Six Old English Chronicles (Gildas, Nennius, and related British chronicles)", "Book Scan", "https://archive.org/details/sixoldenglishchr00gileuoft", "not_in_patrista", "Gildas/Nennius not in Fathers/English"),
    ("s4-loeb-af-01", 4, "Loeb", "Loeb LCL 24 — Apostolic Fathers, vol. 1, trans. Kirsopp Lake (1912)", "Book Scan", "https://archive.org/details/apostolicfathers01lake", "overlap", "ANF already has Apostolic Fathers (different translation)"),
    ("s4-loeb-af-02", 4, "Loeb", "Loeb LCL 25 — Apostolic Fathers, vol. 2, trans. Kirsopp Lake (1913)", "Book Scan", "https://archive.org/details/apostolicfathers02lakeuoft", "overlap", "ANF already has Apostolic Fathers (different translation)"),
    ("s4-loeb-conf-01", 4, "Loeb", "Loeb LCL 26 — Augustine, Confessions, vol. 1, trans. William Watts, ed. W. H. D. Rouse (1912)", "Book Scan", "https://archive.org/details/staugustinesconf01augu", "overlap", "NPNF Confessions already in Augustine_English"),
    ("s4-loeb-conf-02", 4, "Loeb", "Loeb LCL 27 — Augustine, Confessions, vol. 2, trans. William Watts, ed. W. H. D. Rouse (1912)", "Book Scan", "https://archive.org/details/staugustinesconf02augu", "overlap", "NPNF Confessions already in Augustine_English"),
    ("s4-loeb-clement", 4, "Loeb", "Loeb LCL 92 — Clement of Alexandria (Exhortation to the Greeks; Rich Man’s Salvation; To the Newly Baptized), trans. G. W. Butterworth (1919)", "Book Scan", "https://archive.org/details/clementofalexand00clem", "overlap", "ANF already has Exhortation and Who is the Rich Man"),
    ("s4-loeb-eusebius-he1", 4, "Loeb", "Loeb LCL 153 — Eusebius, Ecclesiastical History, vol. 1 (Books I–V), trans. Kirsopp Lake (1926)", "Book Scan", "https://archive.org/details/ecclesiasticalhi01euseuoft", "overlap", "NPNF II 1 already has Eusebius HE; Loeb vol. 2 (Oulton 1932) is post-cutoff"),
    ("s4-loeb-bede-01", 4, "Loeb", "Loeb LCL 246 — Bede, Opera Historica, vol. 1, trans. J. E. King (1930)", "Book Scan", "https://archive.org/details/operahistorica01bedeuoft", "not_in_patrista", "Bede English is not in Fathers/English"),
    ("s4-loeb-bede-02", 4, "Loeb", "Loeb LCL 248 — Bede, Opera Historica, vol. 2, trans. J. E. King (1930)", "Book Scan", "https://archive.org/details/operahistoric02bedeuoft", "not_in_patrista", "Bede English is not in Fathers/English"),
    ("s4-loeb-aug-letters", 4, "Loeb", "Loeb LCL 239 — Augustine, Select Letters, trans. J. H. Baxter (1930)", "Book Scan", "https://archive.org/details/selectletters00auguuoft", "overlap", "NPNF I 1 already has Augustine Letters"),
    ("s4-loeb-basil-01", 4, "Loeb", "Loeb LCL 190 — Basil, Letters, vol. 1 (Letters 1–58), trans. Roy J. Deferrari (1926)", "Book Scan", "https://archive.org/details/letterswithengli01basiuoft", "overlap", "NPNF II 8 already has Basil Letters"),
    ("s4-loeb-basil-02", 4, "Loeb", "Loeb LCL 215 — Basil, Letters, vol. 2 (Letters 59–185), trans. Roy J. Deferrari (1928)", "Book Scan", "https://archive.org/details/letterswithengli02basiuoft", "overlap", "NPNF II 8 already has Basil Letters; vols 3–4 1930/1934 omitted (no open URL / post-cutoff)"),
    ("s4-loeb-hierocles", 4, "Loeb", "Loeb LCL 17 — Philostratus, Life of Apollonius of Tyana, vol. 2, with Eusebius, Against Hierocles, trans. F. C. Conybeare (1912)", "Book Scan", "https://archive.org/details/lifeofapollonius02philuoft", "not_in_patrista", "Against Hierocles is not in Eusebius_English"),
    ("s4-spck-gregg-clement", 4, "SPCK", "SPCK ECC — J. A. F. Gregg, The Epistle of St. Clement, Bishop of Rome (1899)", "Book Scan", "https://archive.org/details/epistleofstcleme00clemuoft", "overlap", "ANF already has 1 Clement"),
    ("s4-spck-barnard-richman", 4, "SPCK", "SPCK ECC — P. Mordaunt Barnard, Clement of Alexandria, Who is the Rich Man that is Being Saved? (1901)", "Book Scan", "https://archive.org/details/homilyofclemento00clemuoft", "overlap", "ANF already has Who is the Rich Man"),
    ("s4-spck-moxon-priesthood", 4, "SPCK", "SPCK ECC — T. A. Moxon, St. Chrysostom, On the Priesthood (1907)", "Book Scan", "https://archive.org/details/StChrysostomOnThePriesthood", "overlap", "NPNF I 9 already has On the Priesthood"),
    ("s4-spck-bigg-didache-1898", 4, "SPCK", "SPCK ECC — Charles Bigg, The Doctrine of the Twelve Apostles (Didache) (1898)", "Book Scan", "https://archive.org/details/doctrinetwelvea00bigggoog", "overlap", "ANF already has the Didache"),
    ("s4-spck-bigg-didache-1922", 4, "SPCK", "SPCK ECC — Charles Bigg, The Doctrine of the Twelve Apostles (Didache) (1922 reprint)", "Book Scan", "https://archive.org/details/doctrineoftwelve00bigguoft", "overlap", "ANF already has the Didache"),
    ("s4-spck-radford-diognetus", 4, "SPCK", "SPCK ECC — L. B. Radford, The Epistle to Diognetus (1908)", "Book Scan", "https://archive.org/details/epistletodiognet0000revl", "overlap", "ANF already has Diognetus"),
    ("s4-spck-taylor-hermas-01", 4, "SPCK", "SPCK ECC — Charles Taylor, The Shepherd of Hermas, vol. 1 (1903)", "Book Scan", "https://archive.org/details/shepherdhermas01taylgoog", "overlap", "ANF already has Hermas"),
    ("s4-spck-taylor-hermas-02", 4, "SPCK", "SPCK ECC — Charles Taylor, The Shepherd of Hermas, vol. 2 (1906)", "Book Scan", "https://archive.org/details/shepherdhermas02taylgoog", "overlap", "ANF already has Hermas"),
    ("s4-spck-srawley-ignatius-01", 4, "SPCK", "SPCK ECC — J. H. Srawley, The Epistles of St. Ignatius, vol. 1 (1910)", "Book Scan", "https://archive.org/details/theepistlesofsti01srawuoft", "overlap", "ANF already has Ignatius"),
    ("s4-spck-srawley-ignatius-02", 4, "SPCK", "SPCK ECC — J. H. Srawley, The Epistles of St. Ignatius, vol. 2 (1910)", "Book Scan", "https://archive.org/details/theepistlesofsti02srawuoft", "overlap", "ANF already has Ignatius"),
    ("s4-spck-hitchcock-irenaeus-01", 4, "SPCK", "SPCK ECC — F. R. Montgomery Hitchcock, Irenaeus, Against the Heresies, vol. 1 (1916)", "Book Scan", "https://archive.org/details/treatiseofiren01iren", "overlap", "ANF already has Against Heresies"),
    ("s4-spck-hitchcock-irenaeus-02", 4, "SPCK", "SPCK ECC — F. R. Montgomery Hitchcock, Irenaeus, Against the Heresies, vol. 2 (1916)", "Book Scan", "https://archive.org/details/treatiseofiren02iren", "overlap", "ANF already has Against Heresies"),
    ("s4-spck-jackson-polycarp", 4, "SPCK", "SPCK ECC — Blomfield Jackson, St. Polycarp, Bishop of Smyrna (1898)", "Book Scan", "https://archive.org/details/stpolycarpbishop00polyuoft", "overlap", "ANF already has Polycarp"),
    ("s4-spck-hitchcock-city", 4, "SPCK", "SPCK ECC — F. R. Montgomery Hitchcock, Augustine, Treatise on the City of God (abridged) (1922)", "Book Scan", "https://archive.org/details/staugustinestrea00auguuoft", "overlap", "NPNF I 2 already has City of God"),
    ("s4-spck-bindley-cyprian-prayer", 4, "SPCK", "SPCK ECC — T. H. Bindley, St. Cyprian on the Lord’s Prayer (1914)", "Book Scan", "https://archive.org/details/stcyprianonlords00cypruoft", "overlap", "ANF already has On the Lord's Prayer"),
    ("s4-spck-bindley-gallican", 4, "SPCK", "SPCK ECC — T. H. Bindley, The Epistle of the Gallican Churches (Lyons and Vienne), with Tertullian To the Martyrs and the Passion of Perpetua (1900)", "Book Scan", "https://archive.org/details/epistleofgallica00tertuoft", "overlap", "ANF already has Lyons/Vienne, Ad Martyras, Perpetua"),
    ("s4-spck-bindley-vincent", 4, "SPCK", "SPCK ECC — T. H. Bindley, The Commonitory of St. Vincent of Lerins (1914)", "Book Scan", "https://archive.org/details/commonitoryofstv00vincuoft", "overlap", "NPNF II 11 already has the Commonitory"),
    ("s4-spck-bindley-tertullian", 4, "SPCK", "SPCK ECC — T. H. Bindley, Tertullian, On the Testimony of the Soul and On the Prescription of Heretics (1914)", "Book Scan", "https://archive.org/details/tertullianontest00tertuoft", "overlap", "ANF already has these treatises"),
    ("s4-spck-srawley-nyssa-catech", 4, "SPCK", "SPCK ECC — J. H. Srawley, Gregory of Nyssa, The Catechetical Oration (1903)", "Book Scan", "https://archive.org/details/thecatecheticalo00greguoft", "overlap", "NPNF II 5 already has The Great Catechism"),
    ("s4-spck-clarke-macrina", 4, "SPCK", "SPCK ECC — W. K. Lowther Clarke, Gregory of Nyssa, The Life of St. Macrina (1916)", "Book Scan", "https://archive.org/details/ldpd_11899093_000", "not_in_patrista", "Gregory_Nyssa_English has no Life of Macrina"),
    ("s4-spck-oleary-constitutions", 4, "SPCK", "SPCK ECC — De Lacy O’Leary, The Apostolical Constitutions and Cognate Documents (1906)", "Book Scan", "https://archive.org/details/apostolicalconst00olea", "overlap", "ANF already has Apostolic Constitutions"),
    ("s4-spck-cresswell-liturgy", 4, "SPCK", "SPCK ECC — R. H. Cresswell, The Liturgy of the Eighth Book of the Apostolic Constitutions (Clementine Liturgy) (1900)", "Book Scan", "https://archive.org/details/liturgyeighthbo00cresgoog", "overlap", "ANF already has Early Liturgies"),
    ("s4-spck-crafer-macarius-magnes", 4, "SPCK", "SPCK TCL — T. W. Crafer, The Apocriticus of Macarius Magnes (1919)", "Book Scan", "https://archive.org/details/apocriticusofmac00macauoft", "not_in_patrista", "Macarius Magnes is not in Fathers/English"),
    ("s4-spck-moore-palladius-chrysostom", 4, "SPCK", "SPCK TCL — Herbert Moore, The Dialogue of Palladius concerning the Life of Chrysostom (1921)", "Book Scan", "https://archive.org/details/thedialogueofpal00mooruoft", "not_in_patrista", "Palladius Dialogue is not in Fathers/English"),
    ("s4-spck-williams-trypho", 4, "SPCK", "SPCK TCL — A. Lukyn Williams, Justin Martyr, The Dialogue with Trypho (1930)", "Book Scan", "https://archive.org/details/SPCKJustinMartyr", "overlap", "ANF already has Dialogue with Trypho"),
    ("s4-spck-feltoe-dionysius", 4, "SPCK", "SPCK TCL — C. L. Feltoe, St. Dionysius of Alexandria: Letters and Treatises (1918)", "Book Scan", "https://archive.org/details/stdionysiusofale00dion", "overlap", "ANF already has Dionysius of Alexandria fragments"),
    ("s4-spck-rolt-areopagite", 4, "SPCK", "SPCK TCL — C. E. Rolt, Dionysius the Areopagite, On the Divine Names and The Mystical Theology (1920)", "Book Scan", "https://archive.org/details/dionysiusareopag00pseu", "not_in_patrista", "Pseudo-Dionysius is not in Fathers/English"),
    ("s4-spck-metcalfe-gregory-thaum", 4, "SPCK", "SPCK TCL — W. Metcalfe, Gregory Thaumaturgus, Address to Origen (1920)", "Book Scan", "https://archive.org/details/gregorythaumat00metcuoft", "overlap", "ANF already has the Address to Origen"),
    ("s4-spck-legge-phil-01", 4, "SPCK", "SPCK TCL — F. Legge, Hippolytus, Philosophumena, vol. 1 (1921)", "Book Scan", "https://archive.org/details/philosophumenaor01hippuoft", "overlap", "ANF already has Refutation of All Heresies"),
    ("s4-spck-legge-phil-02", 4, "SPCK", "SPCK TCL — F. Legge, Hippolytus, Philosophumena, vol. 2 (1921)", "Book Scan", "https://archive.org/details/philosophumenaor02hipp", "overlap", "ANF already has Refutation of All Heresies"),
    ("s4-spck-ferrar-proof-01", 4, "SPCK", "SPCK TCL — W. J. Ferrar, Eusebius, The Proof of the Gospel (Demonstratio Evangelica), vol. 1 (1920)", "Book Scan", "https://archive.org/details/proofofgospelbei01euseuoft", "not_in_patrista", "Eusebius_English has HE and Constantine, not Demonstratio"),
    ("s4-spck-ferrar-proof-02", 4, "SPCK", "SPCK TCL — W. J. Ferrar, Eusebius, The Proof of the Gospel (Demonstratio Evangelica), vol. 2 (1920)", "Book Scan", "https://archive.org/details/proofofgospelbei02euseuoft", "not_in_patrista", "Eusebius_English has HE and Constantine, not Demonstratio"),
    ("s4-spck-mason-macarius", 4, "SPCK", "SPCK TCL — A. J. Mason, Fifty Spiritual Homilies of St. Macarius the Egyptian (1921)", "Book Scan", "https://archive.org/details/fiftyspiritualho00pseuuoft", "not_in_patrista", "Macarius homilies are not in Fathers/English (Latin apophthegmata only)"),
    ("s4-spck-sparrow-aug-letters", 4, "SPCK", "SPCK TCL — W. J. Sparrow-Simpson, The Letters of St. Augustine (1919)", "Book Scan", "https://archive.org/details/lettersofstaugus00sparuoft", "overlap", "NPNF I 1 already has Augustine Letters"),
    ("s4-spck-tollinton-origen", 4, "SPCK", "SPCK TCL — R. B. Tollinton, Selections from the Commentaries and Homilies of Origen (1929)", "Book Scan", "https://archive.org/details/selectionsfromco0000orig", "overlap", "ANF already has Origen selections"),
    ("s4-spck-freese-octavius", 4, "SPCK", "SPCK TCL — J. H. Freese, Minucius Felix, The Octavius (1919)", "Book Scan", "https://archive.org/details/octaviusofminuci00minu", "overlap", "ANF already has the Octavius"),
    ("s4-spck-moore-novatian", 4, "SPCK", "SPCK TCL — Herbert Moore, Novatian, On the Trinity (1919)", "Book Scan", "https://archive.org/details/treatiseofnovati00mooruoft", "overlap", "ANF already has Novatian On the Trinity"),
    ("s4-spck-souter-prayer-baptism", 4, "SPCK", "SPCK TCL — Alexander Souter, Tertullian, Concerning Prayer and Concerning Baptism (1919)", "Book Scan", "https://archive.org/details/treatisesconcern00tertuoft", "overlap", "ANF already has these treatises"),
    ("s4-spck-souter-praxeas", 4, "SPCK", "SPCK TCL — Alexander Souter, Tertullian, Against Praxeas (1920)", "Book Scan", "https://archive.org/details/tertullianagains00tertrich", "overlap", "ANF already has Against Praxeas"),
    ("s4-spck-souter-resurrection", 4, "SPCK", "SPCK TCL — Alexander Souter, Tertullian, Concerning the Resurrection of the Flesh (1922)", "Book Scan", "https://archive.org/details/tertullianconcer00tertuoft", "overlap", "ANF already has On the Resurrection of the Flesh"),
    ("s4-spck-thompson-ambrose", 4, "SPCK", "SPCK TCL — T. Thompson, St. Ambrose, On the Mysteries, with On the Sacraments (1919)", "Book Scan", "https://archive.org/details/stambroseonmyste00ambruoft", "overlap", "NPNF II 10 already has Mysteries and Sacraments"),
    ("s4-spck-mcclure-etheria", 4, "SPCK", "SPCK TCL — M. L. McClure and C. L. Feltoe, The Pilgrimage of Etheria (1919)", "Book Scan", "https://archive.org/details/pilgrimageofethe00mccliala", "not_in_patrista", "Egeria is Latin only (Fathers/Latin/Egeria_Latin)"),
    ("s4-spck-harden-didascalia", 4, "SPCK", "SPCK TCL — J. M. Harden, The Ethiopic Didascalia (1920)", "Book Scan", "https://archive.org/details/cu31924096083336", "not_in_patrista", "Ethiopic Didascalia is not in Fathers/English"),
    ("s4-spck-robinson-demonstration", 4, "SPCK", "SPCK TCL — J. Armitage Robinson, Irenaeus, The Demonstration of the Apostolic Preaching (1920)", "Book Scan", "https://archive.org/details/demonstrationofa00iren", "not_in_patrista", "ANF predates the 1904 Armenian find; not in Irenaeus_English"),
    ("s4-spck-lacey-cyprian", 4, "SPCK", "SPCK TCL — T. A. Lacey, Select Epistles of St. Cyprian treating of the Episcopate (1922)", "Book Scan", "https://archive.org/details/selectepistles00cypruoft", "overlap", "ANF already has Cyprian epistles"),
    ("s4-spck-clarke-lausiac", 4, "SPCK", "SPCK TCL — W. K. Lowther Clarke, Palladius, The Lausiac History (1918)", "Book Scan", "https://archive.org/details/lausiachistoryof00palluoft", "not_in_patrista", "Palladius Lausiac History is not in Fathers/English"),
    ("s4-spck-kidd-01", 4, "SPCK", "SPCK TCL Series VI — B. J. Kidd, Documents Illustrative of the History of the Church, vol. 1, to A.D. 313 (1920)", "Book Scan", "https://archive.org/details/documentsillustr01unknuoft", "overlap", "Anthology of extracts already held as whole works; vol. 3 (1941) omitted"),
    ("s4-spck-kidd-02", 4, "SPCK", "SPCK TCL Series VI — B. J. Kidd, Documents Illustrative of the History of the Church, vol. 2, A.D. 313–461", "Book Scan", "https://archive.org/details/documentsillustr0002kidd", "overlap", "Anthology of extracts already held as whole works"),
    # --- 5. Oriental / Syriac / Coptic / Apocrypha ---
    ("s5-lightfoot-p1v1", 5, "Lightfoot", "Lightfoot, The Apostolic Fathers, Part I. S. Clement of Rome, Vol. 1 (Macmillan, 1890, 2nd ed.)", "Book Scan", "https://archive.org/details/apostolicfathers0101clem", "overlap", "ANF has 1–2 Clement; Lightfoot is a different critical edition. scratch/lightfoot_af.txt exists"),
    ("s5-lightfoot-p1v2", 5, "Lightfoot", "Lightfoot, The Apostolic Fathers, Part I. S. Clement of Rome, Vol. 2 (Macmillan, 1890, 2nd ed.)", "Book Scan", "https://archive.org/details/apostolicfathers0102clem", "overlap", "ANF has 1–2 Clement; Lightfoot is a different critical edition"),
    ("s5-lightfoot-p2v1", 5, "Lightfoot", "Lightfoot, The Apostolic Fathers, Part II. S. Ignatius, S. Polycarp, Vol. 1 (Macmillan, 1889, 2nd ed.)", "Book Scan", "https://archive.org/details/apostolicfathep2v1clemuoft", "overlap", "ANF has Ignatius/Polycarp; Lightfoot is a different critical edition"),
    ("s5-lightfoot-p2v2", 5, "Lightfoot", "Lightfoot, The Apostolic Fathers, Part II. S. Ignatius, S. Polycarp, Vol. 2 (Macmillan, 1889, 2nd ed.)", "Book Scan", "https://archive.org/details/apostolicfathep2v2clemuoft", "overlap", "ANF has Ignatius/Polycarp; scratch/lightfoot_ignatius_vol2.txt exists"),
    ("s5-lightfoot-p2v3", 5, "Lightfoot", "Lightfoot, The Apostolic Fathers, Part II. S. Ignatius, S. Polycarp, Vol. 3 (Macmillan, 1889, 2nd ed.)", "Book Scan", "https://archive.org/details/apostolicfathep2v3clemuoft", "overlap", "ANF has Ignatius/Polycarp; Lightfoot is a different critical edition"),
    ("s5-lightfoot-harmer", 5, "Lightfoot", "Lightfoot–Harmer, The Apostolic Fathers (1-vol. smaller ed., Macmillan, 1891)", "Book Scan", "https://archive.org/details/apostolicfathers00lighuoft", "overlap", "ANF already has Apostolic Fathers"),
    ("s5-james-ant", 5, "James", "M. R. James, The Apocryphal New Testament (Oxford, 1924)", "Book Scan", "https://archive.org/details/JAMESApocryphalNewTestament1924", "overlap", "ANF 8 has a smaller apocrypha set; James ANT is much fuller"),
    ("s5-james-lost-ot", 5, "James", "M. R. James, The Lost Apocrypha of the Old Testament (SPCK, 1920)", "Book Scan", "https://archive.org/details/lostapocryphaofo00jameuoft", "not_in_patrista", "OT apocrypha survey not in Fathers/English"),
    ("s5-james-anecdota-1", 5, "James", "M. R. James, Apocrypha Anecdota (Cambridge Texts and Studies 2.3, 1893)", "Book Scan", "https://archive.org/details/apocryphaanecdot00jame", "not_in_patrista", "Anecdota texts not in Fathers/English"),
    ("s5-james-anecdota-2", 5, "James", "M. R. James, Apocrypha Anecdota, Second Series (Cambridge Texts and Studies 5, 1897)", "Book Scan", "https://archive.org/details/apocryphaanecdot05jame", "not_in_patrista", "Anecdota texts not in Fathers/English"),
    ("s5-james-ot-legends", 5, "James", "M. R. James, Old Testament Legends (London, 1913)", "Book Scan", "https://archive.org/details/oldtestamentlege00jameiala", "not_in_patrista", "Not in Fathers/English"),
    ("s5-charles-apot-01", 5, "Charles", "R. H. Charles, The Apocrypha and Pseudepigrapha of the Old Testament in English, Vol. 1: Apocrypha (Oxford, 1913)", "Book Scan", "https://archive.org/details/apocryphapseudep01charuoft", "not_in_patrista", "Charles OT apocrypha not in Fathers/English"),
    ("s5-charles-apot-02", 5, "Charles", "R. H. Charles, The Apocrypha and Pseudepigrapha of the Old Testament in English, Vol. 2: Pseudepigrapha (Oxford, 1913)", "Book Scan", "https://archive.org/details/apocryphapseudep02charuoft", "overlap", "ANF 8 has Testaments of the Twelve Patriarchs; rest of vol. 2 is new"),
    ("s5-charles-enoch-1893", 5, "Charles", "R. H. Charles, The Book of Enoch (Oxford, 1893)", "Book Scan", "https://archive.org/details/cu31924014590545", "not_in_patrista", "1 Enoch is not in Fathers/English"),
    ("s5-charles-enoch-1912", 5, "Charles", "R. H. Charles, The Book of Enoch, or 1 Enoch (Oxford, 1912)", "Book Scan", "https://archive.org/details/bookofenochor1en00char", "not_in_patrista", "1 Enoch is not in Fathers/English"),
    ("s5-charles-jubilees", 5, "Charles", "R. H. Charles, The Book of Jubilees, or The Little Genesis (London, 1902)", "Book Scan", "https://archive.org/details/bookofjubileesor00char", "not_in_patrista", "Jubilees is not in Fathers/English"),
    ("s5-charles-twelve", 5, "Charles", "R. H. Charles, The Testaments of the Twelve Patriarchs (London, 1908)", "Book Scan", "https://archive.org/details/testamentsoftwel08char", "overlap", "ANF 8 already has Testaments of the Twelve Patriarchs"),
    ("s5-charles-2enoch", 5, "Charles", "W. R. Morfill & R. H. Charles, The Book of the Secrets of Enoch (Oxford, 1896)", "Book Scan", "https://archive.org/details/bookofsecretsofe00morf", "not_in_patrista", "2 Enoch is not in Fathers/English"),
    ("s5-budge-paradise-01", 5, "Budge", "Budge, The Paradise, or Garden of the Holy Fathers, Vol. 1 (Chatto & Windus, 1907)", "Book Scan", "https://archive.org/details/paradiseorgarden01anan", "not_in_patrista", "Desert Fathers English not in Fathers/English"),
    ("s5-budge-paradise-02", 5, "Budge", "Budge, The Paradise, or Garden of the Holy Fathers, Vol. 2 (Chatto & Windus, 1907)", "Book Scan", "https://archive.org/details/paradiseorgarden02anan", "not_in_patrista", "Desert Fathers English not in Fathers/English"),
    ("s5-budge-book-paradise-01", 5, "Budge", "Budge, The Book of Paradise (Lady Meux / Histories and Sayings of the Egyptian Desert), Vol. 1 (1904)", "Book Scan", "https://archive.org/details/bookofparadisebe01budguoft", "not_in_patrista", "Desert Fathers English not in Fathers/English"),
    ("s5-budge-book-paradise-02", 5, "Budge", "Budge, The Book of Paradise (Lady Meux / Histories and Sayings of the Egyptian Desert), Vol. 2 (1904)", "Book Scan", "https://archive.org/details/bookofparadisebe02budguoft", "not_in_patrista", "Desert Fathers English not in Fathers/English"),
    ("s5-budge-coptic-apocrypha", 5, "Budge", "Budge, Coptic Apocrypha in the Dialect of Upper Egypt (British Museum, 1913)", "Book Scan", "https://archive.org/details/copticapocryphai00budguoft", "not_in_patrista", "Coptic apocrypha English not in Fathers/English"),
    ("s5-budge-coptic-homilies", 5, "Budge", "Budge, Coptic Homilies in the Dialect of Upper Egypt (British Museum, 1910)", "Book Scan", "https://archive.org/details/coptichomiliesin00budgrich", "not_in_patrista", "Coptic homilies English not in Fathers/English"),
    ("s5-budge-coptic-martyrdoms", 5, "Budge", "Budge, Coptic Martyrdoms etc. in the Dialect of Upper Egypt (British Museum, 1914)", "Book Scan", "https://archive.org/details/copticmartyrdoms0000unse", "not_in_patrista", "Coptic martyrdoms English not in Fathers/English"),
    ("s5-budge-coptic-misc", 5, "Budge", "Budge, Miscellaneous Coptic Texts in the Dialect of Upper Egypt (British Museum, 1915)", "Book Scan", "https://archive.org/details/miscellaneouscop00budguoft", "not_in_patrista", "Coptic texts English not in Fathers/English"),
    ("s5-budge-cave", 5, "Budge", "Budge, The Book of the Cave of Treasures (London, 1927)", "Book Scan", "https://archive.org/details/bookofcaveoftrea0000eawa", "not_in_patrista", "Cave of Treasures is not in Fathers/English"),
    ("s5-budge-contendings-02", 5, "Budge", "Budge, The Contendings of the Apostles, Vol. 2: English translation (Oxford, 1901)", "Book Scan", "https://archive.org/details/contendingsofapo02budguoft", "not_in_patrista", "Ethiopic apostolic acts English not in Fathers/English; vol. 1 is Ethiopic text, omitted"),
    ("s5-budge-bvm-02", 5, "Budge", "Budge, The History of the Blessed Virgin Mary and the History of the Likeness of Christ, Vol. 2: English (Luzac, 1899)", "Book Scan", "https://archive.org/details/historyofblessed02budg", "not_in_patrista", "Syriac Marian history English not in Fathers/English; vol. 1 is Syriac text, omitted"),
    ("s5-budge-philoxenus-02", 5, "Budge", "Budge, The Discourses of Philoxenus, Bishop of Mabbôgh, Vol. 2 (London, 1894)", "Book Scan", "https://archive.org/details/discoursesofphil02philuoft", "not_in_patrista", "Philoxenus is not in Fathers/English"),
    ("s5-cureton-edessa", 5, "Syriac", "W. Cureton / W. Wright, Ancient Syriac Documents Relative to the Earliest Establishment of Christianity in Edessa (London, 1864)", "Book Scan", "https://archive.org/details/ancientsyriacdo00wriggoog", "overlap", "ANF 8 has Memoirs of Edessa; this is the fuller Cureton set"),
    ("s5-cureton-festal", 5, "Syriac", "Cureton, The Festal Letters of Athanasius (London, 1848)", "Book Scan", "https://archive.org/details/festallettersofa00atha_0", "overlap", "NPNF II 4 already has Festal Letters; this is the Syriac-based edition"),
    ("s5-cureton-ignatius", 5, "Syriac", "Cureton, Corpus Ignatianum: The Epistles of St. Ignatius (London, 1849)", "Book Scan", "https://archive.org/details/corpusignatianum00igna_0", "overlap", "ANF already has Ignatius"),
    ("s5-cureton-spicilegium", 5, "Syriac", "Cureton, Spicilegium Syriacum (London, 1855)", "Book Scan", "https://archive.org/details/spicilegiumsyria00cure", "not_in_patrista", "Bardaisan / Melito Syriac English not in Fathers/English as this collection"),
    ("s5-payne-smith-luke-01", 5, "Syriac", "R. Payne Smith, Cyril of Alexandria, A Commentary upon the Gospel according to S. Luke, Vol. 1 (Oxford, 1859)", "Book Scan", "https://archive.org/details/commentaryupongo01cyri", "not_in_patrista", "No Cyril of Alexandria English in Fathers/English"),
    ("s5-payne-smith-luke-02", 5, "Syriac", "R. Payne Smith, Cyril of Alexandria, A Commentary upon the Gospel according to S. Luke, Vol. 2 (Oxford, 1859)", "Book Scan", "https://archive.org/details/commentaryupongo02cyri", "not_in_patrista", "No Cyril of Alexandria English in Fathers/English"),
    ("s5-wright-acts-02", 5, "Syriac", "W. Wright, Apocryphal Acts of the Apostles, Vol. 2: English translation (London, 1871)", "Book Scan", "https://archive.org/details/apocryphalactsa02wriggoog", "not_in_patrista", "Syriac apostolic acts English not in Fathers/English; vol. 1 is Syriac text, omitted"),
    ("s5-cowper-gospels", 5, "Syriac", "B. Harris Cowper, The Apocryphal Gospels and Other Documents Relating to the History of Christ (London, 1867)", "Book Scan", "https://archive.org/details/apocryphalgospel00cowp", "overlap", "ANF 8 has a smaller apocryphal-gospel set"),
    ("s5-cowper-miscellanies", 5, "Syriac", "B. Harris Cowper, Syriac Miscellanies (London, 1861)", "Book Scan", "https://archive.org/details/syriacmiscellani00cowp", "not_in_patrista", "Syriac miscellanies English not in Fathers/English"),
    ("s5-ts-aristides", 5, "Texts and Studies", "J. Rendel Harris / J. Armitage Robinson, The Apology of Aristides (Texts and Studies 1.1, Cambridge, 1891/1893)", "Book Scan", "https://archive.org/details/apologyofaristid00arisrich", "overlap", "ANF 9 / Apostolic_English already has Apology of Aristides"),
    ("s5-ts-aristides-recovered", 5, "Texts and Studies", "J. Rendel Harris, The Newly Recovered Apology of Aristides (London, 1891)", "Book Scan", "https://archive.org/details/newlyrecoveredap00harr", "overlap", "ANF 9 already has Apology of Aristides"),
    ("s5-ts-narsai", 5, "Texts and Studies", "R. H. Connolly, The Liturgical Homilies of Narsai (Texts and Studies 8.1, Cambridge, 1909)", "Book Scan", "https://archive.org/details/liturgicalhomili00narsuoft", "not_in_patrista", "Narsai is not in Fathers/English"),
    ("s5-ts-odes-bernard", 5, "Texts and Studies", "J. H. Bernard, The Odes of Solomon (Texts and Studies 8.3, Cambridge, 1912)", "Book Scan", "https://archive.org/details/bwb_KU-998-841", "not_in_patrista", "Odes of Solomon are not in Fathers/English"),
    ("s5-ts-egyptian-order", 5, "Texts and Studies", "R. H. Connolly, The So-Called Egyptian Church Order and Derived Documents (Texts and Studies 8.4, Cambridge, 1916)", "Book Scan", "https://archive.org/details/socalledegyptian00connuoft", "not_in_patrista", "Hippolytus Church Order study not in Fathers/English as this volume"),
    ("s5-ts-odes-harris-1909", 5, "Texts and Studies", "J. Rendel Harris, The Odes and Psalms of Solomon (Cambridge, 1909)", "Book Scan", "https://archive.org/details/cu31924029308669", "not_in_patrista", "Odes of Solomon are not in Fathers/English"),
    ("s5-ts-odes-harris-mingana", 5, "Texts and Studies", "J. Rendel Harris & A. Mingana, The Odes and Psalms of Solomon, Vol. 2: The Translation (Manchester, 1916)", "Book Scan", "https://archive.org/details/odespsalmsofsolo02harruoft", "not_in_patrista", "Odes of Solomon are not in Fathers/English"),
    ("s5-ss-apocrypha-sinaitica", 5, "Studia/Horae", "Margaret Dunlop Gibson, Apocrypha Sinaitica (Studia Sinaitica V, 1896)", "Book Scan", "https://archive.org/details/apocryphasinait00gibsgoog", "not_in_patrista", "Sinaitic apocrypha English not in Fathers/English"),
    ("s5-ss-apocrypha-arabica", 5, "Studia/Horae", "Gibson, Apocrypha Arabica (Studia Sinaitica VIII, 1901)", "Book Scan", "https://archive.org/details/apocryphaarabica00gibsuoft", "not_in_patrista", "Arabic apocrypha English not in Fathers/English"),
    ("s5-ss-holy-women", 5, "Studia/Horae", "Agnes Smith Lewis, Select Narratives of Holy Women, English translation (Studia Sinaitica X, 1900)", "Book Scan", "https://archive.org/details/SelectNarrativesOfHolyWomen10", "not_in_patrista", "Not in Fathers/English"),
    ("s5-ss-apocrypha-syriaca", 5, "Studia/Horae", "Lewis, Apocrypha Syriaca: The Protevangelium Jacobi and Transitus Mariae (Studia Sinaitica XI, 1902)", "Book Scan", "https://archive.org/details/apocryphasyriac00goog", "overlap", "ANF 8 has a Protevangelium; this is the Syriac edition"),
    ("s5-hs-didascalia", 5, "Studia/Horae", "Gibson, The Didascalia Apostolorum in English (Horae Semiticae II, 1903)", "Book Scan", "https://archive.org/details/didascaliaaposto00gibsuoft", "not_in_patrista", "Syriac Didascalia English not in Fathers/English (ANF has Constitutions)"),
    ("s5-hs-mythological-acts", 5, "Studia/Horae", "Lewis, The Mythological Acts of the Apostles (Horae Semiticae IV, English, 1904)", "Book Scan", "https://archive.org/details/mythologicalacts00lewi", "not_in_patrista", "Not in Fathers/English"),
    ("s5-hs-forty-martyrs", 5, "Studia/Horae", "Lewis, The Forty Martyrs of the Sinai Desert and the Story of Eulogios (Horae Semiticae IX, 1912)", "Book Scan", "https://archive.org/details/fortymartyrsofsi0000unse", "not_in_patrista", "Not in Fathers/English"),
    ("s5-tts-severus-2p1", 5, "TTS", "E. W. Brooks, The Sixth Book of the Select Letters of Severus of Antioch, Vol. 2 (Translation), Part 1 (1903)", "Book Scan", "https://archive.org/details/sixthbookselect01broogoog", "not_in_patrista", "Severus of Antioch is not in Fathers/English; vol. 1 is Syriac text, omitted"),
    ("s5-tts-severus-2p2", 5, "TTS", "Brooks, The Sixth Book of the Select Letters of Severus of Antioch, Vol. 2 (Translation), Part 2 (1904)", "Book Scan", "https://archive.org/details/sixthbookofselec0022seve", "not_in_patrista", "Severus of Antioch is not in Fathers/English"),
    ("s5-tts-canons-athanasius", 5, "TTS", "W. Riedel & W. E. Crum, The Canons of Athanasius of Alexandria (TTS, 1904)", "Book Scan", "https://archive.org/details/thecanonsofathan00rieduoft", "not_in_patrista", "Arabic/Coptic Canons of Athanasius not in Athanasius_English"),
    ("s5-tts-john-nikiu", 5, "TTS", "R. H. Charles, The Chronicle of John, Bishop of Nikiu (TTS, 1916)", "Book Scan", "https://archive.org/details/JohnOfNikiuChronicle1916", "not_in_patrista", "John of Nikiu is not in Fathers/English"),
    ("s5-tts-euphemia", 5, "TTS", "F. C. Burkitt, Euphemia and the Goth, with the Acts of Martyrdom of the Confessors of Edessa (TTS, 1913)", "Book Scan", "https://archive.org/details/euphemiagothwith00burk", "not_in_patrista", "Not in Fathers/English"),
    ("s5-tts-conybeare-cyril", 5, "TTS", "F. C. Conybeare, The Armenian Version of Revelation and Cyril of Alexandria’s Scholia on the Incarnation (TTS, 1907)", "Book Scan", "https://archive.org/details/armenianversiono00cyririch", "not_in_patrista", "Cyril Scholia English not in Fathers/English"),
    ("s5-tts-winstedt-theodore", 5, "TTS", "E. O. Winstedt, Coptic Texts on Saint Theodore the General, St. Theodore the Eastern, Chamoul and Justus (TTS, 1910)", "Book Scan", "https://archive.org/details/coptictextsonsai00wins", "not_in_patrista", "Coptic Theodore texts not in Fathers/English"),
    ("s5-po-04", 5, "PO", "Patrologia Orientalis Tomus IV (includes E. J. Goodspeed, The Conflict of Severus, Patriarch of Antioch, English, 1908)", "Book Scan", "https://archive.org/details/patrologiaorient04pari", "not_in_patrista", "PO English fascicles not ingested; tome also has French"),
    ("s5-po-06", 5, "PO", "Patrologia Orientalis Tomus VI (includes Brooks, Hymns of Severus and Others, English, Part I, 1911)", "Book Scan", "https://archive.org/details/patrologiaorient06pariuoft", "not_in_patrista", "Severus hymns not in Fathers/English"),
    ("s5-po-07", 5, "PO", "Patrologia Orientalis Tomus VII (includes Brooks, Hymns of Severus and Others, English, Part II, 1911)", "Book Scan", "https://archive.org/details/patrologiaorient07pariuoft", "not_in_patrista", "Severus hymns not in Fathers/English"),
    ("s5-po-12", 5, "PO", "Patrologia Orientalis Tomus XII (includes Brooks, Letters of Severus of Antioch, English, Part I; and Irenaeus, Proof of the Apostolic Preaching, English, 1919)", "Book Scan", "https://archive.org/details/patrologiaorient12pariuoft", "not_in_patrista", "Severus letters not in Fathers/English; Irenaeus Demonstration also in SPCK Robinson"),
    ("s5-po-14", 5, "PO", "Patrologia Orientalis Tomus XIV (includes Brooks, Letters of Severus of Antioch, English, Part II, 1920)", "Book Scan", "https://archive.org/details/patrologiaorient14pariuoft", "not_in_patrista", "Severus letters not in Fathers/English"),
    ("s5-po-17", 5, "PO", "Patrologia Orientalis Tomus XVII (includes Brooks, John of Ephesus, Lives of the Eastern Saints, English, I, 1923)", "Book Scan", "https://archive.org/details/patrologiaorient17pariuoft", "not_in_patrista", "John of Ephesus is not in Fathers/English"),
    ("s5-po-18", 5, "PO", "Patrologia Orientalis Tomus XVIII (includes Brooks, John of Ephesus, Lives of the Eastern Saints, English, II, 1924)", "Book Scan", "https://archive.org/details/patrologiaorient18pariuoft", "not_in_patrista", "John of Ephesus is not in Fathers/English"),
    ("s5-po-19", 5, "PO", "Patrologia Orientalis Tomus XIX (includes Brooks, John of Ephesus, Lives of the Eastern Saints, English, III, 1926)", "Book Scan", "https://archive.org/details/patrologiaorient19pariuoft", "not_in_patrista", "John of Ephesus is not in Fathers/English"),
    ("s5-po-22", 5, "PO", "Patrologia Orientalis Tomus XXII (includes De Lacy O’Leary, The Arabic Life of S. Pisentius, English, 1930)", "Book Scan", "https://archive.org/details/patrologiaorient22pariuoft", "not_in_patrista", "Pisentius is not in Fathers/English"),
    # --- 6. Web libraries ---
    ("s6-newadvent", 6, "Web", "New Advent, Fathers of the Church (ANF / NPNF HTML)", "Web Library", "https://www.newadvent.org/fathers/", "hub", "Already used (corpus/newadvent.json); same Schaff English as Fathers/English"),
    ("s6-pearse-tertullian", 6, "Web", "Roger Pearse / tertullian.org, Early Church Fathers — Additional Texts", "Web Library", "https://www.tertullian.org/fathers/", "hub", "Largest new English mine after ANF/NPNF; not ingested as a set"),
    ("s6-tertullian-fathers2", 6, "Web", "tertullian.org, ANF / NPNF HTML set (fathers2)", "Web Library", "https://www.tertullian.org/fathers2/", "hub", "Same Schaff English as CCEL / Fathers/English"),
    ("s6-ecw", 6, "Web", "Early Christian Writings", "Web Library", "https://www.earlychristianwritings.com/", "hub", "Hub of links; not a volume dump"),
    ("s6-fourthcentury", 6, "Web", "Fourth-Century Christianity (Glen L. Thompson)", "Web Library", "https://www.fourthcentury.com/", "hub", "Hub; some unique translations"),
    ("s6-earlychurchtexts", 6, "Web", "Early Church Texts", "Web Library", "https://www.earlychurchtexts.com/", "hub", "Hub of Greek/Latin/English snippets"),
    ("s6-fordham-ancient", 6, "Web", "Fordham Internet History Sourcebooks, Ancient History: Christian Origins", "Web Library", "https://sourcebooks.fordham.edu/ancient/asbook11.asp", "hub", "Hub of extracts"),
    ("s6-fordham-medieval", 6, "Web", "Fordham Internet Medieval Sourcebook (full-text sources, including early/medieval church)", "Web Library", "https://sourcebooks.fordham.edu/sbook2.asp", "hub", "Hub of extracts"),
    ("s6-hanover", 6, "Web", "Hanover Historical Texts Collection, Early Church", "Web Library", "https://history.hanover.edu/earlychurch.html", "hub", "Hub of extracts"),
    ("s6-ista-wayback", 6, "Web", "Internet Sacred Text Archive, Early Church Fathers (live sacred-texts.com returned 403 from cataloguer host; this Wayback capture of the ECF index returned 200)", "Web Library", "https://web.archive.org/web/20240207111926/https://sacred-texts.com/chr/ecf/index.htm", "hub", "ANF/NPNF mirror"),
    ("s6-wikisource-anf", 6, "Web", "Wikisource, Ante-Nicene Fathers", "Web Library", "https://en.wikisource.org/wiki/Ante-Nicene_Fathers", "hub", "Same Schaff English as Fathers/English"),
    ("s6-wikisource-npnf1", 6, "Web", "Wikisource, Nicene and Post-Nicene Fathers, Series I", "Web Library", "https://en.wikisource.org/wiki/Nicene_and_Post-Nicene_Fathers:_Series_I", "hub", "Same Schaff English as Fathers/English"),
    ("s6-wikisource-npnf2", 6, "Web", "Wikisource, Nicene and Post-Nicene Fathers, Series II", "Web Library", "https://en.wikisource.org/wiki/Nicene_and_Post-Nicene_Fathers:_Series_II", "hub", "Same Schaff English as Fathers/English"),
    ("s6-ccel-hub", 6, "Web", "CCEL, Early Church Fathers hub", "Web Library", "https://www.ccel.org/fathers.html", "hub", "Same hub as s1-ccel-hub; source of current English dumps"),
    ("s6-crane-github", 6, "Web", "GitHub, Gregory Crane, ANF / NPNF TEI XML", "Web Library", "https://github.com/gregorycrane/nicenefathers", "hub", "TEI of the same Schaff English"),
    ("s6-hcf-github", 6, "Web", "GitHub, Historical Christian Faith, Writings-Database (ANF / NPNF / Pearse dumps)", "Web Library", "https://github.com/HistoricalChristianFaith/Writings-Database", "hub", "Includes Pearse Additional Fathers dumps"),
    ("s6-hcf-web", 6, "Web", "Historical Christian Faith (web front end of the Writings-Database)", "Web Library", "https://historicalchristian.faith/", "hub", "Front end of s6-hcf-github"),
    ("s6-catholicculture", 6, "Web", "Catholic Culture, Library of the Church Fathers", "Web Library", "https://www.catholicculture.org/culture/library/fathers/", "hub", "ANF/NPNF HTML"),
    ("s6-penn-onlinebooks", 6, "Web", "University of Pennsylvania Online Books Page, Church fathers", "Web Library", "https://onlinebooks.library.upenn.edu/webbin/book/lookupname?key=Church%20fathers", "hub", "Lookup index of PD editions"),
    ("s6-elpenor", 6, "Web", "Elpenor, Home of the Greek Word (bilingual Greek/English fathers)", "Web Library", "https://www.ellopos.net/elpenor/", "hub", "/fathers/ index 404; homepage is the live hub"),
]


SECTION_TITLES = {
    1: "CCEL (`ccel.org`)",
    2: "Ante-Nicene Christian Library (ANCL, 24 vols)",
    3: "A Library of the Fathers of the Holy Catholic Church (Oxford / Parker, 1838–1885)",
    4: "Pre-1931 secondary print series",
    5: "Oriental, Syriac, Coptic, and Apocrypha volumes",
    6: "Online web libraries and master collections",
}

GROUP_HEADINGS = {
    "ANF": "Ante-Nicene Fathers (ANF, 10 vols) — TXT",
    "NPNF1": "Nicene and Post-Nicene Fathers, Series I (14 vols) — TXT",
    "NPNF2": "Nicene and Post-Nicene Fathers, Series II (14 vols) — TXT",
    "CCEL extra": "Other pre-800 CCEL volumes / hubs (PD English)",
    "ANCL": "Edinburgh: T. & T. Clark, 1867–1872. Editors: Alexander Roberts and James Donaldson.",
    "LFC": "The English run is 48 numbered volumes. All scans below returned HTTP 200.",
    "Bagster": "Bagster, *The Greek Ecclesiastical Historians* (London, 1843–46)",
    "Bohn": "Bohn’s Ecclesiastical Library (and Bohn Antiquarian Library, Bede)",
    "CHE": "*Church Historians of England* (Stevenson) and Giles’s British chronicles",
    "Loeb": "Loeb Classical Library — Christian volumes, first edition ≤1930",
    "SPCK": "SPCK Early Church Classics and *Translations of Christian Literature* (≤1930, texts to A.D. 800)",
    "Lightfoot": "Lightfoot, *The Apostolic Fathers*",
    "James": "M. R. James",
    "Charles": "R. H. Charles",
    "Budge": "E. A. Wallis Budge",
    "Syriac": "Cureton, Wright, Payne Smith, Cowper",
    "Texts and Studies": "Cambridge Texts and Studies, and related English fascicles",
    "Studia/Horae": "Studia Sinaitica and Horae Semiticae (English volumes)",
    "TTS": "Text and Translation Society",
    "PO": "Patrologia Orientalis (pre-1931 tomes with English of pre-800 texts)",
    "Web": "One hub URL per library. Individual works inside these sites are not listed.",
}


def ia_id(url: str) -> str | None:
    marker = "archive.org/details/"
    if marker not in url:
        return None
    return url.split(marker, 1)[1].split("?", 1)[0].strip("/")


def records() -> list[dict]:
    out = []
    for rid, section, group, name, typ, url, coverage, note in ROWS:
        rec = {
            "id": rid,
            "section": section,
            "group": group,
            "name": name,
            "type": typ,
            "url": url,
            "ia_id": ia_id(url),
            "coverage": coverage,
            "note": note,
        }
        out.append(rec)
    return out


def coverage_counts(recs: list[dict]) -> dict[str, int]:
    counts = {"in_patrista": 0, "overlap": 0, "not_in_patrista": 0, "hub": 0}
    for rec in recs:
        counts[rec["coverage"]] = counts.get(rec["coverage"], 0) + 1
    return counts


def write_jsonl(recs: list[dict], path: Path) -> None:
    path.write_text("".join(json.dumps(rec, ensure_ascii=False) + "\n" for rec in recs), encoding="utf-8")


def write_md(recs: list[dict], path: Path) -> None:
    counts = coverage_counts(recs)
    lines = [
        "# Public-domain English source catalog (Christian texts, c. 1–800)",
        "",
        "Address book of English collections, volumes, PDFs, `.txt` dumps, and online libraries.",
        "US public-domain cutoff used: first publication **1930 or earlier** (as of 2026).",
        "One row = one volume / PDF / `.txt` page / web-library hub. Individual works inside a volume are not listed.",
        "",
        "Machine-readable twin: [`catalog.jsonl`](catalog.jsonl).",
        "How to pull this branch and run checks: [`README.md`](README.md).",
        "",
        "## Eyeball coverage vs Patrista `Fathers/English/`",
        "",
        f"| Coverage | Rows | Meaning |",
        f"|---|---:|---|",
        f"| `in_patrista` | {counts['in_patrista']} | This exact edition is already on disk (ANF/NPNF dumps) |",
        f"| `overlap` | {counts['overlap']} | Patrista already has PD English of substantially the same work, usually from Schaff |",
        f"| `not_in_patrista` | {counts['not_in_patrista']} | No English of this work (or this unique content) in `Fathers/English/` |",
        f"| `hub` | {counts['hub']} | Web-library landing page, not a volume to ingest as-is |",
        f"| **total** | **{len(recs)}** | |",
        "",
        "English on disk today is almost entirely Schaff ANF 10 + NPNF I 14 + NPNF II 14 (volume dumps plus author splits).",
        "`scripts/ccel-english/download.mjs` already fetches those. ANCL is the same English as ANF. Most LFC/SPCK/Loeb/Bagster/Bohn lines are other 19th/early-20th-c. translations of works already held.",
        "The genuinely new English is concentrated in §5 (Oriental / Syriac / Coptic / apocrypha), Pearse Additional Fathers, LFC Cyril of Alexandria and Gregory *Morals on Job*, English Bede, Evagrius, Philo, Gildas, and unique SPCK (Egeria, Macarius, Palladius, Dionysius Areopagite, Ferrar *Demonstratio*, Lausiac History, Irenaeus *Demonstration*).",
        "",
    ]
    current_section = None
    current_group = None
    for rec in recs:
        if rec["section"] != current_section:
            current_section = rec["section"]
            current_group = None
            lines.append(f"## {current_section}. {SECTION_TITLES[current_section]}")
            lines.append("")
        if rec["group"] != current_group:
            current_group = rec["group"]
            heading = GROUP_HEADINGS.get(current_group, current_group)
            lines.append(f"### {heading}")
            lines.append("")
            lines.append("| Name & Volume | Type | Coverage | Verified URL |")
            lines.append("|---|---|---|---|")
        name = rec["name"].replace("|", "\\|")
        lines.append(f"| {name} | {rec['type']} | `{rec['coverage']}` | {rec['url']} |")
        if recs.index(rec) == len(recs) - 1 or recs[recs.index(rec) + 1]["group"] != current_group:
            lines.append("")
    lines.append("## Not listed")
    lines.append("")
    lines.append("- Lightfoot–Harmer Baker 1984 reprint (restricted); Griffith & Farran Wake *Apostolic Fathers* (not Lightfoot)")
    lines.append("- Budge *Contendings* vol. 1 and *History of the Blessed Virgin Mary* vol. 1 (Ethiopic/Syriac text volumes)")
    lines.append("- Wright *Apocryphal Acts* vol. 1 (Syriac text)")
    lines.append("- Brooks TTS Severus vol. 1 (Syriac text)")
    lines.append("- Ishoʿdad of Merv (c. 850); Thomas of Marga *Book of Governors* (840); John Kāmē")
    lines.append("- Evetts *History of the Patriarchs* in PO 1/5/10 (10th-century compilation)")
    lines.append("- S. C. Malan, *Conflicts of the Holy Apostles* (1871): no live Archive.org item; HathiTrust 403")
    lines.append("- Loeb Eusebius HE vol. 2 (Oulton, 1932); Loeb Tertullian/Minucius (Glover, 1931); Loeb Jerome *Select Letters* (Wright, 1933); Loeb Basil *Letters* vol. 4 (1934)")
    lines.append("- SPCK Kidd vol. 3 (1941)")
    lines.append("- Project Gutenberg fathers pages: 503 from the cataloguer host")
    lines.append("- Elpenor `/fathers/` index: 404; homepage listed instead")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    recs = records()
    ids = [r["id"] for r in recs]
    if len(ids) != len(set(ids)):
        dupes = [i for i in ids if ids.count(i) > 1]
        raise SystemExit(f"duplicate ids: {sorted(set(dupes))}")
    OUT.mkdir(parents=True, exist_ok=True)
    write_jsonl(recs, OUT / "catalog.jsonl")
    write_md(recs, OUT / "catalog.md")
    counts = coverage_counts(recs)
    print(f"wrote {len(recs)} rows -> {OUT}")
    print("coverage", counts)


if __name__ == "__main__":
    main()

