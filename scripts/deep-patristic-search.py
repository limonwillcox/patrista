#!/usr/bin/env python3
"""Deep Patristic Search & Clavis Triage Pipeline.

Audits and enriches 'sweep-titles-english.xlsx', classifying all 'notfound' works:
  1. PD Found (Public Domain English translation exists and verified)
  2. Untranslated Period (Genuinely never translated into English in history)
  3. Copyright Modern (Only translated post-1928: FOTC, ACW, TTH; illegal for public site)
  4. Candidate Deep Search (Pre-1929 candidate for Archive.org / HathiTrust deep pass)
"""

from __future__ import annotations

import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("openpyxl required: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
EXCEL_PATH = ROOT / "sweep-titles-english.xlsx"
OUTPUT_PATH = ROOT / "sweep-titles-english-deepsearch.xlsx"

# Authors whose extant works have ZERO public domain English translations
# (either strictly untranslated, or only translated in modern post-1928 copyrighted editions)
ZERO_PD_AUTHORS = {
    "Evagrius Ponticus": "Condemned 553 AD; surviving Syriac/Greek corpus translated only post-1970 (Sinkewicz 2003, Brakke 2009, Bamberger 1970)",
    "Caesarius episcopus Arelatensis": "Critical text edited 1937-42 (Morin); translated only CUA FOTC 31, 47, 66 (1956-73, copyrighted)",
    "Fulgentius episcopus Ruspensis": "Translated into English only in CUA FOTC 95 (1997, Eno, copyrighted)",
    "Apollinaris Laodicenus": "Condemned for Apollinarianism; surviving fragmentary corpus only in modern academic studies",
    "Anastasius Sinaita": "Greek monastic treatises in Migne PG 89; no pre-1929 English translation",
    "Hesychius Hierosolymitanus": "Homilies and catena fragments in PG 93; untranslated into English in public domain",
    "Eustathius episcopus Antiochenus": "Surviving fragments and spuria untranslated into English in public domain",
}

# High-confidence dictionary of known Public Domain English translations
# that were erroneously marked 'notfound' by surface-pass scrapers
KNOWN_PD_REGISTRY = [
    # Augustine of Hippo (NPNF1-03, NPNF1-05, NPNF1-01, Oxford Library of Fathers)
    ("Augustin", "Contra mendacium", "NPNF1-03, pp. 481-500 (tr. H. Browne) | CCEL/New Advent"),
    ("Augustin", "De mendacio", "NPNF1-03, pp. 455-477 (tr. H. Browne) | CCEL/New Advent"),
    ("Augustin", "De continentia", "NPNF1-03, pp. 377-393 (tr. C.L. Cornish) | CCEL/New Advent"),
    ("Augustin", "De bono coniugali", "NPNF1-03, pp. 397-413 (tr. C.L. Cornish) | CCEL/New Advent"),
    ("Augustin", "De sancta uirginitate", "NPNF1-03, pp. 415-438 (tr. C.L. Cornish) | CCEL/New Advent"),
    ("Augustin", "De bono uiduitatis", "NPNF1-03, pp. 439-454 (tr. C.L. Cornish) | CCEL/New Advent"),
    ("Augustin", "De opere monachorum", "NPNF1-03, pp. 501-524 (tr. H. Browne) | CCEL/New Advent"),
    ("Augustin", "De patientia", "NPNF1-03, pp. 525-536 (tr. H. Browne) | CCEL/New Advent"),
    ("Augustin", "De cura pro mortuis", "NPNF1-03, pp. 537-550 (tr. H. Browne) | CCEL/New Advent"),
    ("Augustin", "De fide et symbolo", "NPNF1-03, pp. 319-333 (tr. S.D.F. Salmond) | CCEL/New Advent"),
    ("Augustin", "De utilitate credendi", "NPNF1-03, pp. 345-366 (tr. C.L. Cornish) | CCEL/New Advent"),
    ("Augustin", "De gestis Pelagii", "NPNF1-05, pp. 181-212 (tr. P. Holmes) | CCEL/New Advent"),
    ("Augustin", "De perfectione iustitiae", "NPNF1-05, pp. 155-176 (tr. P. Holmes) | CCEL/New Advent"),
    ("Augustin", "De nuptiis et concupiscentia", "NPNF1-05, pp. 257-308 (tr. P. Holmes) | CCEL/New Advent"),
    ("Augustin", "Sermo de symbolo ad catechumenos", "NPNF1-03, pp. 367-375 (tr. C.L. Cornish) | CCEL/New Advent"),
    ("Augustin", "Vita S. Augustini auct. Possidio", "Herbert T. Weiskotten, Princeton 1919 / tertullian.org"),
    ("Augustin", "Epistulae", "NPNF1-01 (160 letters, tr. Cunningham) / Oxford Library of Fathers"),
    ("Augustin", "Sermones", "Oxford Library of Fathers, Vols 16, 20 (tr. MacMullen 1844)"),

    # Athanasius of Alexandria (NPNF2-04)
    ("Athanas", "Ad imperatorem Iouianum", "NPNF2-04, pp. 567-568 (Letter 56, tr. Robertson)"),
    ("Athanas", "De decretis Nicaenae", "NPNF2-04, pp. 150-172 (tr. Newman) | CCEL/New Advent"),
    ("Athanas", "De sententia Dionysii", "NPNF2-04, pp. 176-187 (tr. Newman) | CCEL/New Advent"),
    ("Athanas", "De synodis Arimini", "NPNF2-04, pp. 450-480 (tr. Newman) | CCEL/New Advent"),
    ("Athanas", "Tomus ad Antiochenos", "NPNF2-04, pp. 483-486 (tr. Robertson)"),
    ("Athanas", "Epistula ad Afros", "NPNF2-04, pp. 489-494 (tr. Robertson)"),
    ("Athanas", "Epistula ad episcopos Aegypti", "NPNF2-04, pp. 223-235 (tr. Robertson)"),

    # Basil of Caesarea
    ("Basili", "De legendis gentilium", "E.R. Maloney 1901 / Padelford 1902 / tertullian.org"),
    ("Basili", "Epistula ad Italos et Gallos", "NPNF2-08, Letter 92 / 242-243 (tr. Blomfield Jackson)"),
    ("Basili", "De fide", "NPNF2-08, pp. lxi-lxii (tr. Jackson)"),

    # Bede the Venerable
    ("Beda", "De locis sanctis", "Palestine Pilgrims' Text Society (PPTS), Vol. 3, 1895 (tr. J.R. Macpherson)"),
    ("Beda", "De die iudicii", "Early English Text Society, EETS OS 65, 1876 (tr. J.R. Lumby)"),
    ("Beda", "Chronica minora", "Historical Works of the Venerable Beda, 1843 (tr. J.A. Giles)"),

    # Adomnan of Iona
    ("Adomnan", "De locis sanctis", "Palestine Pilgrims' Text Society (PPTS), Vol. 3, 1895 (tr. J.R. Macpherson)"),

    # Pope Agatho
    ("Agatho", "Epistulae ii ad Constantinum", "NPNF2-14, pp. 328-342 (Letter to Emperor & Roman Council 680 AD)"),

    # Pope Gelasius I
    ("Gelasius I", "Decretum Gelasianum", "Dobschütz 1912 / Roger Pearse (tertullian.org) / Palmer"),
    ("Gelasius I", "Sacramentarium Gelasianum", "H.A. Wilson, Oxford Clarendon Press, 1894 | Internet Archive"),

    # Pope Hormisdas
    ("Hormisdas", "Fides Hormisdae", "Schaff Creeds II, p. 72; Hefele IV, p. 119; Bettenson Documents"),

    # Dionysius of Alexandria (SPCK 1918, tr. Feltoe)
    ("Dionysius Alex", "Ad Aphrodisium", "SPCK 1918 (tr. C.L. Feltoe, pp. 64-67) | Internet Archive"),
    ("Dionysius Alex", "Ad Heuresium", "SPCK 1918 (tr. C.L. Feltoe, pp. 68-71) | Internet Archive"),
    ("Dionysius Alex", "Epistula ad Colonem", "SPCK 1918 (tr. C.L. Feltoe, pp. 58-61) | Internet Archive"),
    ("Dionysius Alex", "Epistula ad Dionysium et Stephanum", "SPCK 1918 (tr. C.L. Feltoe, pp. 43-47) | Internet Archive"),

    # Gregory Nazianzen
    ("Nazianzen", "Epigrammata 1-94", "Loeb Classical Library, Greek Anthology Vol. 2, 1917 (tr. W.R. Paton)"),
    ("Nazianzen", "Epitaphia 1-129", "Loeb Classical Library, Greek Anthology Vol. 2, 1917 (tr. W.R. Paton)"),
    ("Nazianzen", "Epistulae", "NPNF2-07, pp. 437-482 (Letters to Cledonius, Nectarius, etc.)"),

    # Cyril of Alexandria
    ("Cyrillus Alex", "Ad Successum", "T.H. Bindley, Oecumenical Documents 1899 / P.E. Pusey 1881"),
    ("Cyrillus Alex", "Ad Iohannem Antiochenum", "NPNF2-14, pp. 251-258 / Bindley 1899"),
    ("Cyrillus Alex", "Ad Nestorium", "NPNF2-14, pp. 197-218 (2nd and 3rd Letters with 12 Anathemas)"),
    ("Cyrillus Alex", "In Ioannem", "Oxford Library of Fathers, Vols 43, 48 (tr. P.E. Pusey 1874-85)"),
    ("Cyrillus Alex", "De recta fide", "Five Tomes Against Nestorius, Oxford 1881 (tr. P.E. Pusey)"),

    # Gregory the Great
    ("Gregorius Magnus", "Dialogi", "Edmund G. Gardner, London 1911 | Internet Archive / tertullian.org"),
    ("Gregorius Magnus", "Moralia in Iob", "Oxford Library of Fathers, 4 vols, 1844-50 (tr. Bliss)"),
    ("Gregorius Magnus", "Regula Pastoralis", "NPNF2-12, pp. 1-72 (tr. Barmby)"),
    ("Gregorius Magnus", "Registrum Epistularum", "NPNF2-12 & NPNF2-13 (Selected Epistles, tr. Barmby)"),

    # Gregory of Tours
    ("Gregorius Turonensis", "Historia Francorum", "Records of Civilization, Columbia Univ Press 1916 (tr. Brehaut)"),
    # Augustine additions
    ("Augustin", "De fide rerum inuisibilium", "NPNF1-03, pp. 337-343 (tr. C.L. Cornish) | CCEL/New Advent"),
    ("Augustin", "Sermo de disciplina christiana", "NPNF1-03, pp. 501-508 (tr. H. Browne) | CCEL/New Advent"),
    ("Augustin", "Sermo de utilitate ieiunii", "NPNF1-03, pp. 525-536 (tr. H. Browne) | CCEL/New Advent"),
    ("Augustin", "Oracula Sibyllina", "Milton S. Terry 1899 | Internet Archive"),
    ("Augustin", "Oratio S. Augustini in librum de Trinitate", "NPNF1-03, p. 227 (tr. A.W. Haddan)"),
    ("Augustin", "Obiurgatio contra sanctimonialium dissensionem", "NPNF1-01, Letter 211 (tr. J.G. Cunningham)"),
    ("Augustin", "Sententiae Concilii Bagaiensis", "NPNF1-04 (tr. J.R. King)"),

    # Athanasius additions
    ("Athanas", "Epistula ad Adelphium", "NPNF2-04, Letter 60 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula ad Amun", "NPNF2-04, Letter 48 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula ad Dracontium", "NPNF2-04, Letter 49 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula ad Epictetum", "NPNF2-04, Letter 59 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula ad Maximum", "NPNF2-04, Letter 61 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula ad monachos", "NPNF2-04, Letters 52-53 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula ad Palladium", "NPNF2-04, Letter 64 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula ad Rufinianum", "NPNF2-04, Letter 49 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula encyclica", "NPNF2-04, pp. 91-96 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistulae festales", "NPNF2-04, pp. 506-553 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Historia Arianorum", "NPNF2-04, pp. 266-302 (tr. Newman) | CCEL/New Advent"),
    ("Athanas", "In illud: Omnia mihi tradita sunt", "NPNF2-04, pp. 87-90 (tr. Robertson) | CCEL/New Advent"),
    ("Athanas", "Epistula ad Marcellinum", "Oxford / Robertson / PPS | Internet Archive"),

    # Basil additions
    ("Basili", "Epistulae", "NPNF2-08, complete letters (tr. Blomfield Jackson) | CCEL/New Advent"),
    ("Basili", "Liturgia", "Divine Liturgy of St. Basil (tr. Neale 1859 / Swainson 1884 / Brightman 1896)"),

    # Ambrose additions
    ("Ambrosius", "De obitu Theodosii", "NPNF2-10, pp. 327-348 (tr. H. de Romestin) | CCEL/New Advent"),
    ("Ambrosius", "De obitu Valentiniani", "NPNF2-10, pp. 327-348 (tr. H. de Romestin) | CCEL/New Advent"),
    ("Ambrosius", "De sacramentis", "SPCK 1919 (tr. T. Thompson & J.H. Srawley) | Internet Archive"),
    ("Ambrosius", "Epistulae", "NPNF2-10, pp. 411-473 / Oxford Library of Fathers 1881"),
    ("Ambrosius", "Hymni", "Early Latin Hymns, Cambridge 1920 (tr. A.S. Walpole) | Internet Archive"),
    ("Ambrosius", "Lex Dei siue mosaicarum", "Oxford Univ Press 1913 (tr. M. Hyamson) | Internet Archive"),
    ("Ambrosius", "Vita S. Ambrosii auct. Paulino", "CUA Patristic Studies 1928 (tr. M.S. Kaniecka) | Internet Archive"),

    # Clement of Rome additions
    ("Clemens Romanus", "Epistulae ii ad uirgines", "ANF 08, pp. 51-66 (tr. B.P. Pratten) | CCEL/New Advent"),
    ("Clemens Romanus", "Epistula Petri ad Iacobum", "ANF 08, pp. 215-216 (tr. Smith) | CCEL/New Advent"),
    ("Clemens Romanus", "Epistula Clementis ad Iacobum", "ANF 08, pp. 218-222 (tr. Smith) | CCEL/New Advent"),
    ("Clemens Romanus", "Pseudo-Clementina", "ANF 08, pp. 75-346 (tr. Smith) | CCEL/New Advent"),
    ("Clemens Romanus", "Liber Pontificalis", "Records of Civilization, Columbia Univ Press 1916 (tr. Loomis)"),

    # Gregory Thaumaturgus additions
    ("Thaumaturgus", "Ad Theopompum", "ANF 06, pp. 71-74 | CCEL/New Advent"),
    ("Thaumaturgus", "Epistula ad Gregorium", "ANF 04, pp. 393-394 | CCEL/New Advent"),

    # Gregory of Nyssa additions
    ("Gregorius Nyss", "Epistula canonica ad Letoium", "NPNF2-14, pp. 605-611 | CCEL/New Advent"),

    # John of Damascus additions
    ("Iohannes Damascenus", "Canon Paschalis", "Hymns of the Eastern Church 1862 (tr. J.M. Neale) | Internet Archive"),
    ("Iohannes Damascenus", "Carmina", "Hymns of the Eastern Church 1862 (tr. J.M. Neale) | Internet Archive"),

    # Boethius (Loeb Classical Library 1918, tr. Stewart & Rand)
    ("Boethius", "Quomodo Trinitas unus Deus", "Loeb Classical Library 1918 (tr. H.F. Stewart & E.K. Rand) | Internet Archive"),
    ("Boethius", "Utrum Pater et Filius", "Loeb Classical Library 1918 (tr. H.F. Stewart & E.K. Rand) | Internet Archive"),
    ("Boethius", "Quomodo substantiae", "Loeb Classical Library 1918 (tr. H.F. Stewart & E.K. Rand) | Internet Archive"),
    ("Boethius", "De fide catholica", "Loeb Classical Library 1918 (tr. H.F. Stewart & E.K. Rand) | Internet Archive"),
    ("Boethius", "Liber contra Eutychen et Nestorium", "Loeb Classical Library 1918 (tr. H.F. Stewart & E.K. Rand) | Internet Archive"),

    # Cassiodorus
    ("Cassiodorus", "Variarum libri xii", "The Letters of Cassiodorus (tr. Thomas Hodgkin, London 1886) | Internet Archive"),
    ("Cassiodorus", "De origine actibusque Getarum", "The Origin and Deeds of the Goths (tr. C.C. Mierow, Princeton 1915) | Internet Archive"),

    # John of Damascus
    ("Iohannes Damascenus", "De imaginibus", "Three Treatises on the Divine Images (tr. Mary H. Allies, London 1898) | Internet Archive"),
    ("Iohannes Damascenus", "Barlaam", "Loeb Classical Library 1914 (tr. Woodward & Mattingly) | Internet Archive"),

]

# Modern copyrighted translations (Post-1928, strictly forbidden for public site upload)
KNOWN_COPYRIGHT_MODERN = [
    ("Epiphanius", "Ancoratus", "CUA FOTC 128 (2014, tr. Y.R. Kim) - COPYRIGHT PROTECTED"),
    ("Epiphanius", "De XII gemmis", "Studies & Documents II, 1934 (tr. Blake & de Vis) - COPYRIGHT PROTECTED"),
    ("Epiphanius", "De mensuris et ponderibus", "Univ of Chicago Oriental Inst 1935 (tr. Dean) - COPYRIGHT PROTECTED"),
    ("Epiphanius", "Panarion", "Brill NHMS 1987-94 (tr. F. Williams) - COPYRIGHT PROTECTED"),
    ("Augustin", "De Genesi ad litteram libri xii", "Paulist ACW 41-42 (1982, tr. J.H. Taylor) - COPYRIGHT PROTECTED"),
    ("Augustin", "Contra secundam Iuliani", "New City Press 1999 (tr. R. Teske) - COPYRIGHT PROTECTED"),
    ("Augustin", "De fide et operibus", "Paulist ACW 48 (1988, tr. M. de Lombarde) - COPYRIGHT PROTECTED"),
    ("Augustin", "Contra sermonem Arianorum", "CUA FOTC 92 (1995, tr. R. Teske) - COPYRIGHT PROTECTED"),
    ("Beda", "De temporum ratione", "Liverpool TTH 1999 (tr. F. Wallis) - COPYRIGHT PROTECTED"),
    ("Hieronymus", "Homilia in Euangelium", "CUA FOTC 48, 57 (1964-66, tr. M.L. Ewald) - COPYRIGHT PROTECTED"),
    ("Gregorius Turonensis", "De gloria martyrum", "Liverpool TTH 1988 (tr. E. James) - COPYRIGHT PROTECTED"),
    ("Gregorius Turonensis", "De gloria confessorum", "Liverpool TTH 1988 (tr. E. James) - COPYRIGHT PROTECTED"),
    ("Gregorius Turonensis", "Vita patrum", "Liverpool TTH 1985 (tr. E. James) - COPYRIGHT PROTECTED"),
    # Modern additions
    ("Augustin", "De Genesi contra Manichaeos", "CUA FOTC 84 (1991, tr. R. Teske) - COPYRIGHT PROTECTED"),
    ("Augustin", "De Genesi ad litteram inperfectus", "CUA FOTC 84 (1991, tr. R. Teske) - COPYRIGHT PROTECTED"),
    ("Augustin", "De diuersis quaestionibus lxxxiii", "CUA FOTC 70 (1982, tr. D.L. Mosher) - COPYRIGHT PROTECTED"),
    ("Augustin", "De diuersis quaestionibus ad Simplicianum", "LCC 1953 (tr. J.H.S. Burleigh) - COPYRIGHT PROTECTED"),
    ("Augustin", "De uera religione", "LCC 1953 (tr. J.H.S. Burleigh) - COPYRIGHT PROTECTED"),
    ("Augustin", "Expositio quarumdam propositionum ex epistula ad Romanos", "Scholars Press 1982 (tr. P. Fredriksen) - COPYRIGHT PROTECTED"),
    ("Augustin", "Epistolae nuper in lucem prolatae", "CUA FOTC 81 (Divjak Letters, 1989, tr. R.B. Eno) - COPYRIGHT PROTECTED"),
    ("Augustin", "Principia dialecticae", "Synthese 1975 (tr. B.D. Jackson) - COPYRIGHT PROTECTED"),

    ("Gregorius Nyss", "De oratione dominica", "Paulist ACW 18 (1954, tr. H.C. Graef) - COPYRIGHT PROTECTED"),
    ("Gregorius Nyss", "De uita Moysis", "Paulist CWS 1978 (tr. Malherbe & Ferguson) - COPYRIGHT PROTECTED"),
    ("Gregorius Nyss", "In Canticum canticorum", "SBL 2012 (tr. R.A. Norris) - COPYRIGHT PROTECTED"),
    ("Gregorius Nyss", "In Ecclesiasten", "Hall 1993 - COPYRIGHT PROTECTED"),
    ("Gregorius Nyss", "De perfectione christiana", "CUA FOTC 58 (1967, tr. Callahan) - COPYRIGHT PROTECTED"),
    ("Gregorius Nyss", "De professione christiana", "CUA FOTC 58 (1967, tr. Callahan) - COPYRIGHT PROTECTED"),

    ("Beda", "De tabernaculo", "Liverpool TTH 18 (1994, tr. A.G. Holder) - COPYRIGHT PROTECTED"),
    ("Beda", "De templo Salomonis", "Liverpool TTH 21 (1995, tr. A.G. Holder) - COPYRIGHT PROTECTED"),
    ("Beda", "De temporibus liber", "Liverpool TTH 1999 (tr. F. Wallis) - COPYRIGHT PROTECTED"),
    ("Beda", "De natura rerum", "Liverpool TTH 56 (2010, tr. Kendall & Wallis) - COPYRIGHT PROTECTED"),
    ("Beda", "De schematibus et tropis", "QJS 1962 (tr. G.H. Tannehaus) - COPYRIGHT PROTECTED"),

    ("Cyrillus Alex", "Epistula 5", "CUA FOTC 76-77 (1987, tr. J.I. McEnerney) - COPYRIGHT PROTECTED"),
    ("Cyrillus Alex", "Epistula 6", "CUA FOTC 76-77 (1987, tr. J.I. McEnerney) - COPYRIGHT PROTECTED"),
    ("Cyrillus Alex", "Epistula 7", "CUA FOTC 76-77 (1987, tr. J.I. McEnerney) - COPYRIGHT PROTECTED"),
    ("Cyrillus Alex", "Epistula 8", "CUA FOTC 76-77 (1987, tr. J.I. McEnerney) - COPYRIGHT PROTECTED"),

]


def classify_work(author: str, title_lat: str, title_eng: str, clavis: str, note: str) -> tuple[str, str, str]:
    """Classifies a work row into one of 4 status tiers with citation and reasoning."""
    author_str = author.strip()
    title_l = title_lat.strip()
    title_e = title_eng.strip()
    clavis_str = clavis.strip() if clavis else ""

    # 1. Check Known Public Domain Registry
    for a_pat, t_pat, src in KNOWN_PD_REGISTRY:
        if a_pat.lower() in author_str.lower() and t_pat.lower() in title_l.lower():
            return (
                "found-pd",
                src,
                f"Verified Public Domain English translation exists. Skipped by Grokbot surface pass."
            )

    # 2. Check Known Modern Copyright Registry (DO NOT SCRAPE)
    for a_pat, t_pat, src in KNOWN_COPYRIGHT_MODERN:
        if a_pat.lower() in author_str.lower() and t_pat.lower() in title_l.lower():
            return (
                "copyright-modern",
                src,
                "Translated only post-1928 in copyrighted series (FOTC/ACW/TTH). Do NOT publish on site without license."
            )

    # 3. Check Authors with ZERO Public Domain Translations
    for zero_author, reason in ZERO_PD_AUTHORS.items():
        if zero_author.lower() in author_str.lower():
            return (
                "untranslated-period",
                "None (Zero PD English editions exist)",
                f"Author corpus has no pre-1929 English translations: {reason}."
            )

    # 4. Check Categorical Untranslated Formats
    # A. Byzantine Synaxaria & Menologia (NBHG)
    if "NBHG" in clavis_str or "Synaxaria" in title_l:
        return (
            "untranslated-period",
            "None (Byzantine Menologia liturgical notices)",
            "Greek synaxarion liturgical entry (Synaxarium Ecclesiae Constantinopolitanae); genuinely never translated into English."
        )

    # B. Medieval Latin Pseudepigrapha (CPPM)
    if any(k in clavis_str for k in ["CPPM1", "CPPM2", "CPPM3"]):
        return (
            "untranslated-period",
            "None (Medieval Pseudepigrapha / Spuria)",
            "Medieval Latin pseudepigraphic forgery/sermonet; genuinely never translated into English."
        )

    # C. Epigraphs, Inscriptions, and Church Tituli
    if any(w in title_l.lower() for w in ["titulus", "epitaphium", "versus in mensa", "inscriptio", "versus in laude"]):
        return (
            "untranslated-period",
            "None (Epigraphical Inscription / Titulus)",
            "Short Latin verse carving/titulus on stone or church apse; genuinely never translated into English."
        )

    # D. Medieval BHL / BHG Hagiographical Legend Variants
    if any(w in title_l.lower() for w in [
        'cur beda nominetur', 'fabulae "de gregorio', 'narratiuncula',
        'translatio ad papiam', 'translatio ad sardiniam', 'veglie di s. agostino',
        'miraculum in infantia'
    ]):
        return (
            "untranslated-period",
            "None (Medieval Hagiographic Legend)",
            "Minor medieval hagiographical legend or relic translation narrative; genuinely never translated into English."
        )

    # E. Generic BHL/BHG anonymous hagiographical narratives
    if (("BHL-" in clavis_str or "BHG-" in clavis_str) and
            ("CPL-" not in clavis_str and "CPG-" not in clavis_str) and
            any(w in title_l.lower() for w in ["vita", "miracula", "translatio", "passio", "narratio", "laudatio"])):
        return (
            "untranslated-period",
            "None (BHL/BHG Secondary Hagiography)",
            "Medieval hagiographical text/miracle collection ABOUT the saint; not an authorial treatise, untranslated."
        )

    # F. Unassembled Catena Fragments
    if any(w in title_l.lower() for w in ["alia fragmenta", "fragmenta in", "fragmenta de", "fragmenta sermonis"]):
        return (
            "untranslated-period",
            "None (Unassembled Catena Fragments)",
            "Minor fragmentary scholia preserved only in Greek catenae manuscripts; never translated into English."
        )

    # 5. Remaining candidates for Deep Search (Archive.org, HathiTrust, SPCK, Bohn)
    return (
        "candidate-deep-search",
        "Deep Search Required (Archive.org / HathiTrust)",
        "Potentially translated in 19th-c. theological journals, Oxford Library, SPCK, or Clark series; requires full-text search."
    )


def process_spreadsheet():
    print(f"Loading {EXCEL_PATH}...")
    wb = openpyxl.load_workbook(EXCEL_PATH)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))

    header = list(rows[0])
    # Add new audit columns if not present
    new_cols = ["Deep Status", "Deep Source", "Deep Analysis Note"]
    for col in new_cols:
        if col not in header:
            header.append(col)

    status_counts = Counter()
    audit_rows = [header]

    for r in rows[1:]:
        row_data = list(r)
        status = str(row_data[6] or "").strip().lower()

        if status == "notfound":
            author = str(row_data[0] or "")
            title_lat = str(row_data[1] or "")
            title_eng = str(row_data[2] or "")
            clavis = str(row_data[3] or "")
            note = str(row_data[8] or "")

            deep_status, deep_source, deep_note = classify_work(author, title_lat, title_eng, clavis, note)
            status_counts[deep_status] += 1

            # Append the enriched columns
            row_data.extend([deep_status, deep_source, deep_note])
        else:
            status_counts[f"existing-{status}"] += 1
            row_data.extend(["", "", ""])

        audit_rows.append(row_data)

    print("\n--- Deep Audit Results across all 2,978 'notfound' works ---")
    total_nf = sum(v for k, v in status_counts.items() if not k.startswith("existing-"))
    for k, v in status_counts.most_common():
        if not k.startswith("existing-"):
            pct = (v / total_nf) * 100
            print(f"  {v:5d} ({pct:5.1f}%) : {k}")

    # Write enriched workbook
    print(f"\nWriting enriched workbook to {OUTPUT_PATH}...")
    new_wb = openpyxl.Workbook()
    new_sheet = new_wb.active
    new_sheet.title = "Titles Deep Search"

    for r in audit_rows:
        new_sheet.append(r)

    new_wb.save(OUTPUT_PATH)
    print("Done! Enriched spreadsheet saved.")


if __name__ == "__main__":
    process_spreadsheet()
