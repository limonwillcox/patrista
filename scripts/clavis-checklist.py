#!/usr/bin/env python3
"""Clavis coverage checklist (off-site working list, not the reader catalog).

Source of truth: data/clavis/works.jsonl
Human view: data/clavis/CHECKLIST.md + data/clavis/authors/*.md
Task export: data/clavis/tasks.csv  (Y/N columns for GitHub / a spreadsheet)

  python3 scripts/clavis-checklist.py build   # from data/clavis-coverage + Fathers/
  python3 scripts/clavis-checklist.py regen   # markdown + csv from works.jsonl
"""
from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

BOOL_FIELDS = (
    "hasEnglishText",
    "hasOriginalText",
    "formattedEnglish",
    "formattedOriginal",
    "englishTagged",
    "originalTagged",
)

BOOL_LABELS = {
    "hasEnglishText": "Has English text?",
    "hasOriginalText": "Has original text?",
    "formattedEnglish": "Formatted English text?",
    "formattedOriginal": "Formatted original text?",
    "englishTagged": "English tagged?",
    "originalTagged": "Original tagged?",
}

ROOT = Path(__file__).resolve().parents[1]
COVERAGE = ROOT / "data" / "clavis-coverage"
OUT = ROOT / "data" / "clavis"

# Exact Latin name -> (latin_folder or None, english_folder or None)
AUTHOR_FOLDERS: dict[str, tuple[str | None, str | None]] = {
    "Ambrosius episcopus Mediolanensis": ("Ambrose_Latin", "Ambrose_English"),
    "Aphraates anachoreta in Syria": (None, "Aphrahat_English"),
    "Arnobius": ("Arnobius_Latin", "Arnobius_English"),
    "Anastasius I papa": ("Rufinus_Latin", "Rufinus_English"),
    "Athanasius Alexandrinus": (None, "Athanasius_English"),
    "Athenagoras": (None, "Athenagoras_English"),
    "Augustinus episcopus Hipponensis": ("Augustine_Latin", "Augustine_English"),
    "Barnabas apostolus": (None, "Barnabas_English"),
    "Basilius Caesariensis": (None, "Basil_English"),
    "Beda Venerabilis monachus in Anglia": ("Bede_Latin", None),
    "Cassianus abbas Massiliensis": ("Cassian_Latin", "Cassian_English"),
    "Cassiodorus": ("Cassiodorus_Latin", None),
    "Clemens Alexandrinus": (None, "Clement_Alexandria_English"),
    "Clemens Romanus papa martyr Chersonae": (None, "Clement_Rome_English"),
    "Commodianus": ("Commodianus_Latin", "Commodianus_English"),
    "Cyprianus episcopus Carthaginensis": ("Cyprian_Latin", "Cyprian_English"),
    "Cyrillus Hierosolymitanus": (None, "Cyril_Jerusalem_English"),
    "Dionysius Alexandrinus": (None, "Dionysius_English"),
    "Ephraem Syrus diaconus Edessae": (None, "Ephraim_English"),
    "Eucherius episcopus Lugdunensis": ("Eucherius_Latin", None),
    "Eugippius abbas": ("Eugippius_Latin", None),
    "Eusebius Caesariensis": (None, "Eusebius_English"),
    "Flavius Iosephus historiographus": (None, "Josephus_English"),
    "Gelasius I papa": ("Gelasius_Latin", None),
    "Gregorius Magnus": ("Gregory_Latin", "Gregory_English"),
    "Gregorius Nazianzenus": (None, "Gregory_Nazianzen_English"),
    "Gregorius Nyssenus": (None, "Gregory_Nyssa_English"),
    "Gregorius episcopus Neocaesariensis thaumaturgus": (None, "Gregory_Thaumaturgus_English"),
    "Hermas": (None, "Hermas_English"),
    "Hieronymus presbyter": ("Jerome_Latin", "Jerome_English"),
    "Hilarius episcopus Pictaviensis": ("Hilary_Latin", "Hilary_English"),
    "Hippolytus Romanus": (None, "Hippolytus_English"),
    "Ignatius episcopus Antiochenus martyr": (None, "Ignatius_English"),
    "Irenaeus Lugdunensis": (None, "Irenaeus_English"),
    "Isidorus Hispalensis": ("Isidore_Latin", None),
    "Iohannes Chrysostomus": (None, "Chrysostom_English"),
    "Iohannes Damascenus": (None, "John_Damascus_English"),
    "Iustinus Martyr": (None, "Justin_English"),
    "Lactantius": ("Lactantius_Latin", "Lactantius_English"),
    "Leo I papa": ("Leo_Latin", "Leo_English"),
    "Macarius Aegyptius abbas in Scete": ("Macarius_Great_Latin", None),
    "Macarius Alexandrinus abbas in Thebaide": ("Macarius_Alexandria_Latin", None),
    "Magnus Felix Ennodius": ("Ennodius_Latin", None),
    "Methodius Olympius": (None, "Methodius_English"),
    "Minucius Felix": ("Minucius_Felix_Latin", "Minucius_Felix_English"),
    "Novatianus presbyter Romanus": ("Novatian_Latin", "Novatian_English"),
    "Origenes": (None, "Origen_English"),
    "Papias Hierapolitanus": (None, "Papias_English"),
    "Paulinus Nolanus": ("Paulinus_Latin", None),
    "Paulus Orosius presbyter Bracarensis": ("Orosius_Latin", None),
    "Polycarpus Smyrnensis": (None, "Polycarp_English"),
    "Prosper Aquitanus": ("Prosper_Latin", None),
    "Prudentius": ("Prudentius_Latin", None),
    "Sedulius (presbyter)": ("Sedulius_Latin", None),
    "Socrates Scholasticus": (None, "Socrates_English"),
    "Sozomenus": (None, "Sozomen_English"),
    "Sulpicius Severus": ("Sulpicius_Severus_Latin", "Sulpicius_Severus_English"),
    "Tatianus": (None, "Tatian_English"),
    "Tertullianus": ("Tertullian_Latin", "Tertullian_English"),
    "Theodoretus episcopus Cyri": (None, "Theodoret_English"),
    "Theophilus Antiochenus": (None, "Theophilus_English"),
    "Vincentius Lirinensis (vel Lerinensis), presbyter Gallus": ("Vincent_Latin", "Vincent_English"),
    "Anonymus ad Diognetum": (None, "Mathetes_English"),
}

# Verified clavis id -> conventional English (display only).
CONVENTIONAL_EN: dict[str, str] = {
    "CPL-251": "The Confessions",
    "CPL-313": "The City of God",
    "CPL-329": "On the Trinity",
    "CPL-297": "On Catechising the Uninstructed",
    "CPL-263": "On Christian Doctrine",
    "CPL-252": "Soliloquies",
    "CPL-293": "On Faith and the Creed",
    "CPL-261": "On the Morals of the Catholic Church and of the Manichaeans",
    "CPL-262": "Letters",
    "CPL-273": "The Harmony of the Gospels",
    "CPL-274": "Our Lord's Sermon on the Mount",
    "CPL-278": "Tractates on the Gospel of John",
    "CPL-279": "Ten Homilies on the First Epistle of John",
    "CPL-283": "Expositions on the Psalms",
    "CPL-284": "Sermons on Selected Lessons of the New Testament",
    "CPL-292": "Concerning Faith of Things Not Seen",
    "CPL-298": "On Continence",
    "CPL-299": "On the Good of Marriage",
    "CPL-300": "Of Holy Virginity",
    "CPL-301": "On the Good of Widowhood",
    "CPL-303": "On Lying",
    "CPL-304": "Against Lying",
    "CPL-305": "Of the Work of Monks",
    "CPL-307": "On Care to be Had for the Dead",
    "CPL-308": "On Patience",
    "CPL-309": "On the Creed: A Sermon to Catechumens",
    "CPL-316": "On the Profit of Believing",
    "CPL-317": "On Two Souls, Against the Manichaeans",
    "CPL-318": "Disputation Against Fortunatus the Manichaean",
    "CPL-320": "Against the Fundamental Epistle of Manichaeus",
    "CPL-321": "Reply to Faustus the Manichaean",
    "CPL-323": "On the Nature of Good, Against the Manichaeans",
    "CPL-332": "On Baptism Against the Donatists",
    "CPL-333": "Answer to Letters of Petilian",
    "CPL-342": "On the Merits and Forgiveness of Sins, and on the Baptism of Infants",
    "CPL-343": "On the Spirit and the Letter",
    "CPL-344": "On Nature and Grace",
    "CPL-345": "On the Soul and Its Origin",
    "CPL-346": "Against Two Letters of the Pelagians",
    "CPL-347": "On the Perfection of Man's Righteousness",
    "CPL-348": "On the Proceedings of Pelagius",
    "CPL-349": "On the Grace of Christ and on Original Sin",
    "CPL-350": "On Marriage and Concupiscence",
    "CPL-352": "On Grace and Free Will",
    "CPL-353": "On Rebuke and Grace",
    "CPL-354": "On the Predestination of the Saints",
    "CPL-355": "On the Gift of Perseverance",
    "CPG-2090": "Against the Heathen",
    "CPG-2091": "On the Incarnation of the Word",
    "CPG-2092": "To the Bishops of Egypt and Libya",
    "CPG-2093": "Four Discourses Against the Arians",
    "CPG-2095": "Letter to Epictetus",
    "CPG-2098": "Letter to Adelphius",
    "CPG-2099": "On Luke X. 22",
    "CPG-2100": "Letter to Maximus",
    "CPG-2101": "Life of Antony",
    "CPG-2102": "Festal Letters",
    "CPG-2103": "First Letter to Orsisius",
    "CPG-2104": "Second Letter to Orsisius",
    "CPG-2106": "Letter to Amun",
    "CPG-2107": "Letter to Rufinianus",
    "CPG-2108": "First Letter to Monks",
    "CPG-2119": "Historia Acephala",
    "CPG-2120": "Defense of the Nicene Definition (De Decretis)",
    "CPG-2121": "On the Opinion of Dionysius (De Sententia Dionysii)",
    "CPG-2122": "Defense of His Flight (Apologia de Fuga)",
    "CPG-2123": "Defense Against the Arians (Apologia Contra Arianos)",
    "CPG-2124": "Encyclical Letter to Bishops",
    "CPG-2125": "Letter to Serapion on the Death of Arius",
    "CPG-2126": "Second Letter to Monks",
    "CPG-2127": "History of the Arians",
    "CPG-2128": "On the Councils of Ariminum and Seleucia (De Synodis)",
    "CPG-2129": "Defense Before Constantius (Apologia ad Constantium)",
    "CPG-2130": "Letter to John and Antiochus",
    "CPG-2131": "Letter to Palladius",
    "CPG-2132": "Letter to Dracontius",
    "CPG-2133": "To the Bishops of Africa (Ad Afros)",
    "CPG-2134": "Tome or Synodal Letter to the People of Antioch",
    "CPG-2135": "Letter to the Emperor Jovian",
    "CPG-2164": "Letter to Diodorus",
    "CPG-2230": "Fourth Discourse Against the Arians",
    "CPG-2232": "Letters to Lucifer",
    "CPG-2810": "Statement of Faith",
    "CPL-144": "On the Duties of the Clergy",
    "CPL-145": "Concerning Virgins",
    "CPL-146": "Concerning Widows",
    "CPL-150": "Exposition of the Christian Faith",
    "CPL-151": "On the Holy Spirit",
    "CPL-154": "Concerning the Sacraments",
    "CPL-155": "On the Mysteries",
    "CPL-156": "Concerning Repentance",
    "CPL-157": "On the Decease of His Brother Satyrus",
    "CPL-159": "On the Death of Theodosius",
    "CPL-160": "Letters",
    "CPL-1": "To the Martyrs",
    "CPL-2": "To the Nations",
    "CPL-3": "The Apology",
    "CPL-4": "The Soul's Testimony",
    "CPL-5": "The Prescription Against Heretics",
    "CPL-6": "The Shows",
    "CPL-7": "On Prayer",
    "CPL-8": "On Baptism",
    "CPL-9": "On Patience",
    "CPL-10": "On Repentance",
    "CPL-11": "On the Apparel of Women",
    "CPL-12": "To His Wife",
    "CPL-13": "Against Hermogenes",
    "CPL-14": "Against Marcion",
    "CPL-15": "On the Pallium",
    "CPL-16": "Against the Valentinians",
    "CPL-17": "On the Soul",
    "CPL-18": "On the Flesh of Christ",
    "CPL-19": "On the Resurrection of the Flesh",
    "CPL-20": "On Exhortation to Chastity",
    "CPL-21": "The Chaplet",
    "CPL-22": "Scorpiace",
    "CPL-23": "On Idolatry",
    "CPL-24": "To Scapula",
    "CPL-25": "On Flight in Persecution",
    "CPL-26": "Against Praxeas",
    "CPL-27": "On the Veiling of Virgins",
    "CPL-28": "On Monogamy",
    "CPL-29": "On Fasting",
    "CPL-30": "On Modesty",
    "CPL-33": "An Answer to the Jews",
    "CPL-34": "Against All Heresies",
    "CPL-85": "The Divine Institutes",
    "CPL-87": "On the Workmanship of God",
    "CPL-88": "On the Anger of God",
    "CPL-91": "On the Deaths of the Persecutors",
    "CPL-93": "Against the Heathen",
    "CPG-2835": "Homilies on the Hexaemeron",
    "CPG-2839": "On the Holy Spirit",
    "CPG-2867": "Address to Young Men on Reading Greek Literature",
    "CPG-2900": "Letters",
    "CPG-2901": "Canonical Letters to Amphilochius",
    "CPG-2914": "Against Those Who Calumniate Us as Saying Three Gods",
    "CPG-3196": "Letter to His Brother Peter on the Difference Between Ousia and Hypostasis",
    "CPG-3416": "Letter to the Italians and Gauls",
    "BHG-260b": "Letters Between Emperor Julian and Basil",
    "CPG-1375": "Exhortation to the Heathen",
    "CPG-1376": "The Instructor",
    "CPG-1377": "The Stromata",
    "CPG-1074": "The First Apology",
    "CPG-1075": "The Second Apology",
    "CPG-1076": "Dialogue with Trypho",
    "CPG-1104": "Address to the Greeks",
    "CPL-37": "The Octavius",
    "CPL-71": "On the Trinity",
    "CPL-510": "The Commonitory",
    "CPL-617": "The Life of Paul the First Hermit",
    "CPL-619": "The Life of Malchus",
    "CPG-1306": "Against Heresies",
    "CPG-1052": "The Shepherd of Hermas",
    "CPG-1112": "Epistle to Diognetus",
    "CPG-1040": "Epistle to the Philippians",
    "CPG-1025": "The Seven Epistles of Ignatius",
    "CPG-1107": "To Autolycus",
    "CPG-3495": "Church History",
    "CPG-3585": "Catechetical Lectures",
    "CPG-3586": "Mystagogical Lectures",
    "CPG-3010": "Select Orations",
    "CPG-3032": "Letters",
    "CPG-3010.2": "In Defence of His Flight to Pontus",
    "BHL-3666t": "In Defence of His Flight to Pontus",
    "CPG-3010.21": "Panegyric on St. Athanasius",
    "CPG-3010.42": "Farewell Oration to the 150 Bishops",
    "CPG-3010.43": "Funeral Oration on St. Basil",
    "CPG-3135": "Against Eunomius",
    "CPG-3136": "Answer to Eunomius' Second Book",
    "CPG-3142": "On the Holy Spirit",
    "CPG-3137": "On the Holy Trinity",
    "CPG-3139": "On Not Three Gods",
    "CPG-3140": "On the Faith",
    "CPG-3165": "On Virginity",
    "CPG-3145": "On Infants' Early Deaths",
    "CPG-3154": "On the Making of Man",
    "CPG-3149": "On the Soul and the Resurrection",
    "CPG-3150": "The Great Catechism",
    "CPG-3180": "Funeral Oration on Meletius",
    "BHG-1243": "Funeral Oration on Meletius",
    "CPG-3173": "On the Baptism of Christ",
    "BHG-1934": "On the Baptism of Christ",
    "CPG-3167": "Letters",
    "CPL-428": "Homilies on the Psalms",
    "CPL-433": "On the Trinity",
    "CPL-434": "On the Councils",
    "CPL-512": "The Conferences",
    "CPL-513": "The Institutes of the Coenobia",
    "CPL-514": "On the Incarnation of the Lord, Against Nestorius",
    "CPG-6222": "Ecclesiastical History",
    "CPG-6217": "Dialogues (Eranistes)",
    "CPG-6240": "Letters",
    "CPL-616": "Lives of Illustrious Men",
    "CPL-613": "Apology Against Rufinus",
    "CPL-608": "The Dialogue Against the Luciferians",
    "CPL-609": "The Perpetual Virginity of Blessed Mary",
    "CPL-610": "Against Jovinianus",
    "CPL-611": "Against Vigilantius",
    "CPL-612": "To Pammachius Against John of Jerusalem",
    "CPL-615": "Against the Pelagians",
    "CPL-618": "The Life of S. Hilarion",
    "CPL-38": "To Donatus",
    "CPL-39": "Three Books of Testimonies Against the Jews",
    "CPL-40": "On the Dress of Virgins",
    "CPL-41": "On the Unity of the Church",
    "CPL-42": "On the Lapsed",
    "CPL-43": "On the Lord's Prayer",
    "CPL-44": "On the Mortality",
    "CPL-45": "Exhortation to Martyrdom",
    "CPL-46": "An Address to Demetrianus",
    "CPL-47": "On Works and Alms",
    "CPL-48": "On the Advantage of Patience",
    "CPL-49": "On Jealousy and Envy",
    "CPL-50": "The Epistles of Cyprian",
    "CPL-52": "Life and Passion of Cyprian by Pontius",
    "CPL-56": "Seventh Council of Carthage",
    "CPL-57": "On the Vanity of Idols",
    "CPL-197": "Apology in Defence of Himself",
    "CPL-198": "Commentary on the Apostles' Creed",
    "CPG-8043": "Exposition of the Orthodox Faith",
    "CPG-4316": "On the Priesthood",
    "CPG-4305": "An Exhortation to Theodore After His Fall",
    "CPG-4314": "Letter to a Young Widow",
    "CPG-4351": "Homily on S. Ignatius",
    "CPG-4347": "Homily on S. Babylas",
    "CPG-4385": "Homily Concerning Lowliness of Mind",
    "CPG-4460": "Instructions to Catechumens",
    "CPG-4332": "Three Homilies Concerning the Power of Demons",
    "CPG-4369": "Homily on the Passage 'Father if it be possible'",
    "CPG-4370": "Homily on the Paralytic Let Down Through the Roof",
    "CPG-4375": "Homily on the Passage 'If Thine Enemy Hunger Feed Him'",
    "CPG-4389": "Homily Against Publishing the Errors of the Brethren",
    "CPG-4392": "Two Homilies on Eutropius",
    "CPG-4400": "Treatise That No One Can Harm the Man Who Does Not Injure Himself",
    "CPG-4405": "Letters to Olympias",
    "CPG-4402": "Correspondence with Pope Innocent I",
    "CPG-4330": "Homilies on the Statues",
    "CPG-2090": "Against the Heathen",
    "CPG-1899": "The Refutation of All Heresies",
    "CPG-1070": "A Plea for the Christians",
    "CPG-1071": "On the Resurrection of the Dead",
    "CPL-68": "On the Jewish Meats",
    "CPL-76": "Treatise Against the Heretic Novatian",
    "CPL-59": "Treatise on Re-Baptism",
    "CPG-1873": "Commentary on Daniel",
    "CPG-1872": "Treatise on Christ and Antichrist",
    "CPG-1914": "Expository Treatise Against the Jews",
    "CPG-1902": "Against the Heresy of One Noetus",
    "CPG-1917": "Discourse on the Holy Theophany",
    "CPG-1910": "Discourse on the End of the World and Antichrist",
    "CPG-[1932]": "Canons of Hippolytus",
    "CPG-1810": "Banquet of the Ten Virgins",
    "CPG-1812": "From the Discourse on the Resurrection",
    "CPG-1817": "Extracts from the Work on Things Created",
    "CPG-1827": "Oration Concerning Simeon and Anna",
    "CPG-1828": "Oration on the Palms",
    "CPG-1826": "Fragments on the Cross and Passion",
    "CPG-1763": "Oration and Panegyric to Origen",
    "CPG-1765": "Canonical Epistle",
    "CPG-1766": "Metaphrase of Ecclesiastes",
    "CPG-1764": "Declaration of Faith",
    "CPG-1772": "Sectional Confession of Faith",
    "CPG-1773": "On the Subject of the Soul",
    "CPG-1775": "Four Homilies",
    "CPG-1001": "The First Epistle of Clement",
    "CPG-1015": "Recognitions of Clement",
    "CPG-1015.4": "The Clementine Homilies",
    "CPG-1026": "Spurious Epistles of Ignatius",
    "CPG-1036": "Martyrdom of Ignatius",
    "CPL-1712": "The Pastoral Rule",
    "CPL-1714": "Selected Epistles",
}

# Verified clavis id -> English filename (1:1, in that author's English folder).
EN_FILE_BY_CLAVIS: dict[str, str] = {
    "CPL-251": "The Confessions of St. Augustine. Augustine.txt",
    "CPL-313": "The City of God.txt",
    "CPL-329": "On the Holy Trinity.txt",
    "CPL-297": "On Catechising of the Uninstructed.txt",
    "CPL-263": "On Christian Doctrine.txt",
    "CPL-252": "Soliloquies.txt",
    "CPL-293": "On Faith and the Creed.txt",
    "CPL-261": "Of the Morals of the Catholic Church.txt",
    "CPL-262": "Letters.txt",
    "CPL-273": "The Harmony of the Gospels.txt",
    "CPL-274": "Our Lord's Sermon on the Mount.txt",
    "CPL-278": "Homilies on the Gospel of John.txt",
    "CPL-279": "Homilies on the First Epistle of John.txt",
    "CPL-283": "Expositions on the Psalms.txt",
    "CPL-284": "Sermons on Selected Lessons of the New Testament.txt",
    "CPL-292": "Concerning Faith of Things Not Seen.txt",
    "CPL-298": "On Continence.txt",
    "CPL-299": "On the Good of Marriage.txt",
    "CPL-300": "Of Holy Virginity.txt",
    "CPL-301": "On the Good of Widowhood.txt",
    "CPL-303": "On Lying.txt",
    "CPL-304": "To Consentius Against Lying.txt",
    "CPL-305": "Of the Work of Monks.txt",
    "CPL-307": "On Care to be Had for the Dead.txt",
    "CPL-308": "On Patience.txt",
    "CPL-309": "On the Creed - A Sermon to the Catechumens.txt",
    "CPL-316": "On the Profit of Believing.txt",
    "CPL-317": "Concerning Two Souls.txt",
    "CPL-318": "Against Fortunatus.txt",
    "CPL-320": "Against the Epistle of Manichaeus Called Fundamental.txt",
    "CPL-321": "Reply to Faustus the Manichaean.txt",
    "CPL-323": "Concerning the Nature of Good.txt",
    "CPL-332": "On Baptism Against the Donatists.txt",
    "CPL-333": "Answer to Letters of Petilian.txt",
    "CPL-342": "On the Merits and Forgiveness of Sins.txt",
    "CPL-343": "On the Spirit and the Letter.txt",
    "CPL-344": "On Nature and Grace.txt",
    "CPL-345": "On the Soul and its Origin.txt",
    "CPL-346": "Against Two Letters of the Pelagians.txt",
    "CPL-347": "On the Perfection of Mans Righteousness.txt",
    "CPL-348": "On the Proceedings of Pelagius.txt",
    "CPL-349": "On the Grace of Christ and Original Sin.txt",
    "CPL-350": "On Marriage and Concupiscence.txt",
    "CPL-352": "On Grace and Free Will.txt",
    "CPL-353": "On Rebuke and Grace.txt",
    "CPL-354": "On the Predestination of the Saints.txt",
    "CPL-355": "On the Gift of Perseverance.txt",
    "CPG-2090": "Against the Heathen.txt",
    "CPG-2091": "On the Incarnation of the Word.txt",
    "CPG-2092": "To the Bishops of Egypt and Libya.txt",
    "CPG-2093": "Discourses Against the Arians.txt",
    "CPG-2095": "Letter to Epictetus.txt",
    "CPG-2098": "Letter to Adelphius.txt",
    "CPG-2099": "On Luke X. 22.txt",
    "CPG-2100": "Letter to Maximus.txt",
    "CPG-2101": "Life of Antony.txt",
    "CPG-2102": "Festal Letters and Index.txt",
    "CPG-2103": "First Letter to Orsisius.txt",
    "CPG-2104": "Second Letter to Orsisius.txt",
    "CPG-2106": "Letter to Amun.txt",
    "CPG-2107": "Letter to Rufinianus.txt",
    "CPG-2108": "First Letter to Monks.txt",
    "CPG-2119": "Historia Acephala.txt",
    "CPG-2120": "Defense of the Nicene Definition.txt",
    "CPG-2121": "On the Opinion of Dionysius.txt",
    "CPG-2122": "Defense of His Flight.txt",
    "CPG-2123": "Defense Against the Arians.txt",
    "CPG-2124": "Circular Letter to Bishops.txt",
    "CPG-2125": "Letter to Serapion on the Death of Arius.txt",
    "CPG-2126": "Second Letter to Monks.txt",
    "CPG-2127": "History of the Arians.txt",
    "CPG-2128": "On the Councils of Ariminum and Seleucia.txt",
    "CPG-2129": "Defense Before Constantius.txt",
    "CPG-2130": "Letter to John and Antiochus.txt",
    "CPG-2131": "Letter to Palladius.txt",
    "CPG-2132": "Letter to Dracontius.txt",
    "CPG-2133": "To the Bishops of Africa.txt",
    "CPG-2134": "Tome to the People of Antioch.txt",
    "CPG-2135": "Letter to the Emperor Jovian.txt",
    "CPG-2164": "Letter to Diodorus.txt",
    "CPG-2230": "Fourth Discourse Against the Arians.txt",
    "CPG-2232": "Letters to Lucifer.txt",
    "CPG-2810": "Statement of Faith.txt",
    "CPL-144": "On the Duties of the Clergy.txt",
    "CPL-145": "Concerning Virgins.txt",
    "CPL-146": "Concerning Widows.txt",
    "CPL-150": "Exposition of the Christian Faith.txt",
    "CPL-151": "On the Holy Spirit.txt",
    "CPL-154": "Concerning the Sacraments.txt",
    "CPL-155": "On the Mysteries.txt",
    "CPL-156": "Concerning Repentance.txt",
    "CPL-157": "On the Decease of His Brother Satyrus.txt",
    "CPL-159": "On the Death of Theodosius.txt",
    "CPL-160": "Letters.txt",
    "CPL-1": "Ad Martyras.txt",
    "CPL-2": "Ad Nationes.txt",
    "CPL-3": "The Apology.txt",
    "CPL-4": "The Soul's Testimony.txt",
    "CPL-5": "The Prescription Against Heretics.txt",
    "CPL-6": "The Shows (De Spectaculis).txt",
    "CPL-7": "On Prayer.txt",
    "CPL-8": "On Baptism.txt",
    "CPL-9": "Of Patience.txt",
    "CPL-10": "On Repentance.txt",
    "CPL-11": "On the Apparel of Women.txt",
    "CPL-12": "To His Wife.txt",
    "CPL-13": "Against Hermogenes.txt",
    "CPL-14": "The Five Books Against Marcion.txt",
    "CPL-15": "On the Pallium.txt",
    "CPL-16": "Against the Valentinians.txt",
    "CPL-17": "A Treatise on the Soul.txt",
    "CPL-18": "On the Flesh of Christ.txt",
    "CPL-19": "On the Resurrection of the Flesh.txt",
    "CPL-20": "On Exhortation to Chastity.txt",
    "CPL-21": "The Chaplet (De Corona).txt",
    "CPL-22": "Scorpiace.txt",
    "CPL-23": "On Idolatry.txt",
    "CPL-24": "To Scapula.txt",
    "CPL-25": "De Fuga in Persecutione.txt",
    "CPL-26": "Against Praxeas.txt",
    "CPL-27": "On the Veiling of Virgins.txt",
    "CPL-28": "On Monogamy.txt",
    "CPL-29": "On Fasting.txt",
    "CPL-30": "On Modesty.txt",
    "CPL-33": "An Answer to the Jews.txt",
    "CPL-34": "Against All Heresies.txt",
    "CPL-85": "The Divine Institutes.txt",
    "CPL-87": "On the Workmanship of God.txt",
    "CPL-88": "On the Anger of God.txt",
    "CPL-91": "Of the Manner in Which the Persecutors Died.txt",
    "CPL-93": "Against the Heathen.txt",
    "CPG-2835": "Homilies on the Hexaemeron.txt",
    "CPG-2839": "On the Holy Spirit.txt",
    "CPG-2867": "Address to Young Men on Reading Greek Literature.txt",
    "CPG-2900": "Letters.txt",
    "CPG-2901": "Canonical Letters to Amphilochius.txt",
    "CPG-2914": "Against Those Who Calumniate Us as Saying Three Gods.txt",
    "CPG-3196": "Letter to His Brother Peter on the Difference Between Ousia and Hypostasis.txt",
    "CPG-3416": "Letter to the Italians and Gauls.txt",
    "BHG-260b": "Letters Between Emperor Julian and Basil.txt",
    "CPG-1375": "Exhortation to the Heathen.txt",
    "CPG-1376": "The Instructor.txt",
    "CPG-1377": "The Stromata.txt",
    "CPG-1074": "The First Apology.txt",
    "CPG-1075": "The Second Apology.txt",
    "CPG-1076": "Dialogue with Trypho.txt",
    "CPG-1104": "Address to the Greeks.txt",
    "CPL-616": "On the Life of St. Martin.txt",
    "CPL-617": "The Life of Paulus the First Hermit.txt",
    "CPL-619": "The Life of Malchus, the Captive Monk.txt",
    "CPL-37": "The Octavius.txt",
    "CPL-71": "A Treatise Concerning the Trinity.txt",
    "CPL-510": "The Commonitory.txt",
    "CPG-1306": "Against Heresies.txt",
    "CPG-1052": "The Pastor of Hermas.txt",
    "CPG-1112": "Epistle to Diognetus.txt",
    "CPG-1040": "Epistle to the Philippians.txt",
    "CPG-1025": "Epistles of Ignatius.txt",
    "CPG-1107": "To Autolycus.txt",
    "CPG-3495": "Church History.txt",
    "CPG-3585": "Catechetical Lectures.txt",
    "CPG-3586": "Mystagogical Lectures.txt",
    "CPG-3010": "Select Orations.txt",
    "CPG-3032": "Letters.txt",
    "CPG-3010.2": "In Defence of His Flight to Pontus (Oration II).txt",
    "BHL-3666t": "In Defence of His Flight to Pontus (Oration II).txt",
    "CPG-3010.21": "Panegyric on St. Athanasius (Oration XXI).txt",
    "CPG-3010.42": "Farewell Oration to the 150 Bishops (Oration XLII).txt",
    "CPG-3010.43": "Funeral Oration on St. Basil (Oration XLIII).txt",
    "CPG-3135": "Against Eunomius.txt",
    "CPG-3136": "Answer to Eunomius' Second Book.txt",
    "CPG-3142": "On the Holy Spirit.txt",
    "CPG-3137": "On the Holy Trinity.txt",
    "CPG-3139": "On Not Three Gods.txt",
    "CPG-3140": "On the Faith.txt",
    "CPG-3165": "On Virginity.txt",
    "CPG-3145": "On Infants' Early Deaths.txt",
    "CPG-3154": "On the Making of Man.txt",
    "CPG-3149": "On the Soul and the Resurrection.txt",
    "CPG-3150": "The Great Catechism.txt",
    "CPG-3180": "Funeral Oration on Meletius.txt",
    "BHG-1243": "Funeral Oration on Meletius.txt",
    "CPG-3173": "On the Baptism of Christ.txt",
    "BHG-1934": "On the Baptism of Christ.txt",
    "CPG-3167": "Letters.txt",
    "CPL-428": "Homilies on the Psalms.txt",
    "CPL-433": "On the Trinity.txt",
    "CPL-434": "On the Councils.txt",
    "CPL-512": "The Conferences.txt",
    "CPL-513": "The Institutes of the Coenobia.txt",
    "CPL-514": "On the Incarnation of the Lord, Against Nestorius.txt",
    "CPG-6222": "Ecclesiastical History.txt",
    "CPG-6217": "Dialogues (Eranistes).txt",
    "CPG-6240": "Letters.txt",
    "CPL-616": "Lives of Illustrious Men.txt",
    "CPL-613": "Apology Against Rufinus.txt",
    "CPL-608": "The Dialogue Against the Luciferians.txt",
    "CPL-609": "The Perpetual Virginity of Blessed Mary.txt",
    "CPL-610": "Against Jovinianus.txt",
    "CPL-611": "Against Vigilantius.txt",
    "CPL-612": "To Pammachius Against John of Jerusalem.txt",
    "CPL-615": "Against the Pelagians.txt",
    "CPL-618": "The Life of S. Hilarion.txt",
    "CPL-38": "To Donatus.txt",
    "CPL-39": "Three Books of Testimonies Against the Jews.txt",
    "CPL-40": "On the Dress of Virgins.txt",
    "CPL-41": "On the Unity of the Church.txt",
    "CPL-42": "On the Lapsed.txt",
    "CPL-43": "On the Lord's Prayer.txt",
    "CPL-44": "On the Mortality.txt",
    "CPL-45": "Exhortation to Martyrdom.txt",
    "CPL-46": "An Address to Demetrianus.txt",
    "CPL-47": "On Works and Alms.txt",
    "CPL-48": "On the Advantage of Patience.txt",
    "CPL-49": "On Jealousy and Envy.txt",
    "CPL-50": "The Epistles of Cyprian.txt",
    "CPL-52": "Life and Passion of Cyprian by Pontius.txt",
    "CPL-56": "Seventh Council of Carthage.txt",
    "CPL-57": "On the Vanity of Idols.txt",
    "CPL-197": "Apology in Defence of Himself.txt",
    "CPL-198": "Commentary on the Apostles' Creed.txt",
    "CPG-8043": "Exposition of the Orthodox Faith.txt",
    "CPG-4316": "On the Priesthood.txt",
    "CPG-4305": "An Exhortation to Theodore After His Fall.txt",
    "CPG-4314": "Letter to a Young Widow.txt",
    "CPG-4351": "Homily on S. Ignatius.txt",
    "CPG-4347": "Homily on S. Babylas.txt",
    "CPG-4385": "Homily Concerning Lowliness of Mind.txt",
    "CPG-4460": "Instructions to Catechumens.txt",
    "CPG-4332": "Three Homilies Concerning the Power of Demons.txt",
    "CPG-4369": "Homily on the Passage 'Father if it be possible'.txt",
    "CPG-4370": "Homily on the Paralytic Let Down Through the Roof.txt",
    "CPG-4375": "Homily on the Passage 'If Thine Enemy Hunger Feed Him'.txt",
    "CPG-4389": "Homily Against Publishing the Errors of the Brethren.txt",
    "CPG-4392": "Two Homilies on Eutropius.txt",
    "CPG-4400": "Treatise That No One Can Harm the Man Who Does Not Injure Himself.txt",
    "CPG-4405": "Letters to Olympias.txt",
    "CPG-4402": "Correspondence with Pope Innocent I.txt",
    "CPG-4330": "Homilies on the Statues.txt",
    "CPG-2090": "Against the Heathen.txt",
    "CPG-1899": "The Refutation of All Heresies.txt",
    "CPG-1070": "A Plea for the Christians.txt",
    "CPG-1071": "On the Resurrection of the Dead.txt",
    "CPL-68": "On the Jewish Meats.txt",
    "CPL-76": "Treatise Against the Heretic Novatian.txt",
    "CPL-59": "Treatise on Re-Baptism.txt",
    "CPG-1873": "Commentary on Daniel.txt",
    "CPG-1872": "Treatise on Christ and Antichrist.txt",
    "CPG-1914": "Expository Treatise Against the Jews.txt",
    "CPG-1902": "Against the Heresy of One Noetus.txt",
    "CPG-1917": "Discourse on the Holy Theophany.txt",
    "CPG-1910": "Discourse on the End of the World.txt",
    "CPG-[1932]": "Canons of Hippolytus.txt",
    "CPG-1810": "Banquet of the Ten Virgins.txt",
    "CPG-1812": "From the Discourse on the Resurrection.txt",
    "CPG-1817": "Extracts from the Work on Things Created.txt",
    "CPG-1827": "Oration Concerning Simeon and Anna.txt",
    "CPG-1828": "Oration on the Palms.txt",
    "CPG-1826": "Fragments on the Cross and Passion.txt",
    "CPG-1763": "Oration and Panegyric to Origen.txt",
    "CPG-1765": "Canonical Epistle.txt",
    "CPG-1766": "Metaphrase of Ecclesiastes.txt",
    "CPG-1764": "Declaration of Faith.txt",
    "CPG-1772": "Sectional Confession of Faith.txt",
    "CPG-1773": "On the Subject of the Soul.txt",
    "CPG-1775": "Four Homilies.txt",
    "CPG-1001": "The First Epistle of Clement.txt",
    "CPG-1015": "Recognitions of Clement.txt",
    "CPG-1015.4": "The Clementine Homilies.txt",
    "CPG-1026": "Spurious Epistles of Ignatius.txt",
    "CPG-1036": "Martyrdom of Ignatius.txt",
    "CPL-1712": "The Book of Pastoral Rule.txt",
    "CPL-1714": "Selected Epistles.txt",
}

# English / Latin file stems that are collections, not one Clavis row.
SKIP_STEMS = {
    "letters",
    "epistulae",
    "epistulae uariae",
    "epistulae variae",
    "sermones",
    "sermones de quadragesima",
    "select works npnf2 vi remainder",
    "select works",
    "select orations",
    "fragments",
    "extant works and fragments",
    "extant fragments of dionysius",
    "fragments of caius",
    "fragments of lactantius",
    "fragments of papias",
    "treatises of questionable authority",
    "the treatises of cyprian",
    "the epistles of cyprian",
    "institutes and conferences",
    "dogmatic treatises and select writings",
    "homilies on acts and romans",
    "homilies on first and second corinthians",
    "homilies on galatians to philemon",
    "homilies on john and hebrews",
    "on the priesthood and selected treatises",
    "nisibene hymns and select works",
    "ecclesiastical history and dialogues",
    "writings of athenagoras",
    "spurious epistles of ignatius",
    "four homilies",
    "the decretals",
    "early liturgies",
    "memoirs of edessa",
    "testaments of the twelve patriarchs",
    "variae",
    "epistulae theodericianae variae",
    "orationum reliquiae",
    "poemata",
    "hymni",
}

# Extra 1:1 file matches: (author Latin, clavis id) -> (orig relpath or None, en relpath or None)
EXPLICIT = {
    ("Ambrosius episcopus Mediolanensis", "CPL-160"): (
        "Fathers/Latin/Ambrose_Latin/Epistulae Variae.txt",
        "Fathers/English/Ambrose_English/Letters.txt",
    ),
    ("Ambrosius episcopus Mediolanensis", "CPL-163"): (
        "Fathers/Latin/Ambrose_Latin/Hymni.txt",
        None,
    ),
    ("Augustinus episcopus Hipponensis", "CPL-251"): (
        "Fathers/Latin/Augustine_Latin/The Confessions of St. Augustine Latin.txt",
        "Fathers/English/Augustine_English/The Confessions of St. Augustine. Augustine.txt",
    ),
    ("Augustinus episcopus Hipponensis", "CPL-284"): (
        "Fathers/Latin/Augustine_Latin/SERMONES.txt",
        "Fathers/English/Augustine_English/Sermons on Selected Lessons of the New Testament.txt",
    ),
    ("Augustinus episcopus Hipponensis", "CPL-313"): (
        "Fathers/Latin/Augustine_Latin/De civitate Dei.txt",
        "Fathers/English/Augustine_English/The City of God.txt",
    ),
    ("Augustinus episcopus Hipponensis", "CPL-356"): (
        "Fathers/Latin/Augustine_Latin/Contra secundam Iuliani responsionem.txt",
        None,
    ),
    ("Augustinus episcopus Hipponensis", "CPL-361"): (
        "Fathers/Latin/Augustine_Latin/de Dialectica.txt",
        None,
    ),
    ("Augustinus episcopus Hipponensis", "CPL-1839b"): (
        "Fathers/Latin/Augustine_Latin/Regula Sancti Augustini.txt",
        None,
    ),
    ("Cassiodorus", "CPL-896"): (
        "Fathers/Latin/Cassiodorus_Latin/Variae.txt",
        None,
    ),
    ("Cassiodorus", "CPL-898"): (
        "Fathers/Latin/Cassiodorus_Latin/Orationum Reliquiae.txt",
        None,
    ),
    ("Eucherius episcopus Lugdunensis", "CPL-492"): (
        "Fathers/Latin/Eucherius_Latin/De laude eremi.txt",
        None,
    ),
    ("Eugippius abbas", "CPL-678"): (
        "Fathers/Latin/Eugippius_Latin/Vita Sancti Severini.txt",
        None,
    ),
    ("Gelasius I papa", "CPL-1676"): (
        "Fathers/Latin/Gelasius_Latin/Decretum Gelasianum.txt",
        None,
    ),
    ("Hieronymus presbyter", "CPL-612"): (
        "Fathers/Latin/Jerome_Latin/Contra Ioannem.txt",
        "Fathers/English/Jerome_English/To Pammachius Against John of Jerusalem.txt",
    ),
    ("Hieronymus presbyter", "CPL-620"): (
        "Fathers/Latin/Jerome_Latin/Epistulae.txt",
        "Fathers/English/Jerome_English/Letters.txt",
    ),
    ("Sulpicius Severus", "DBA8ED30B4CF4E4891B31036C5029B05"): (
        "Fathers/Latin/Sulpicius_Severus_Latin/Chronica.txt",
        None,
    ),
    ("Tertullianus", "CPL-1"): (
        "Fathers/Latin/Tertullian_Latin/ad Martyres.txt",
        "Fathers/English/Tertullian_English/Ad Martyras.txt",
    ),
    ("Tertullianus", "CPL-2"): (
        "Fathers/Latin/Tertullian_Latin/ad Nationes.txt",
        "Fathers/English/Tertullian_English/Ad Nationes.txt",
    ),
    ("Tertullianus", "CPL-29"): (
        "Fathers/Latin/Tertullian_Latin/de Ieiunio.txt",
        "Fathers/English/Tertullian_English/On Fasting.txt",
    ),
    ("Tertullianus", "CPL-35"): (
        "Fathers/Latin/Tertullian_Latin/de Execrandis Gentium Diis.txt",
        None,
    ),
    ("Clemens Romanus papa martyr Chersonae", "CPG-1001"): (
        "Fathers/Greek/Clement_Rome_Greek/The First Epistle of Clement.txt",
        "Fathers/English/Clement_Rome_English/The First Epistle of Clement.txt",
    ),
    ("Clemens Romanus papa martyr Chersonae", "CPG-1002"): (
        "Fathers/Greek/Clement_Rome_Greek/The Second Epistle of Clement.txt",
        "Fathers/English/Clement_Rome_English/The Second Epistle of Clement.txt",
    ),
    ("Clemens Romanus papa martyr Chersonae", "CPG-1015.4"): (
        "Fathers/Greek/Clement_Rome_Greek/The Clementine Homilies.txt",
        "Fathers/English/Clement_Rome_English/The Clementine Homilies.txt",
    ),
    ("Ignatius episcopus Antiochenus martyr", "CPG-1025"): (
        "Fathers/Greek/Ignatius_Greek/Epistles of Ignatius.txt",
        "Fathers/English/Ignatius_English/Epistles of Ignatius.txt",
    ),
    ("Ignatius episcopus Antiochenus martyr", "CPG-1026"): (
        "Fathers/Greek/Ignatius_Greek/Spurious Epistles of Ignatius.txt",
        "Fathers/English/Ignatius_English/Spurious Epistles of Ignatius.txt",
    ),
    ("Irenaeus Lugdunensis", "CPG-1306"): (
        "Fathers/Greek/Irenaeus_Greek/Against Heresies.txt",
        "Fathers/English/Irenaeus_English/Against Heresies.txt",
    ),
    ("Eusebius Caesariensis", "CPG-3495"): (
        "Fathers/Greek/Eusebius_Greek/Church History.txt",
        "Fathers/English/Eusebius_English/Church History.txt",
    ),
    ("Polycarpus Smyrnensis", "CPG-1040"): (
        "Fathers/Greek/Polycarp_Greek/Epistle to the Philippians.txt",
        "Fathers/English/Polycarp_English/Epistle to the Philippians.txt",
    ),
    ("Polycarpus Smyrnensis", "CPG-1045"): (
        "Fathers/Greek/Polycarp_Greek/Martyrdom of Polycarp.txt",
        "Fathers/English/Polycarp_English/Martyrdom of Polycarp.txt",
    ),
    ("Barnabas apostolus", "CPG-1050"): (
        "Fathers/Greek/Barnabas_Greek/The Epistle of Barnabas.txt",
        "Fathers/English/Barnabas_English/The Epistle of Barnabas.txt",
    ),
    ("Hermas", "CPG-1052"): (
        "Fathers/Greek/Hermas_Greek/The Pastor of Hermas.txt",
        "Fathers/English/Hermas_English/The Pastor of Hermas.txt",
    ),
    ("Anonymus ad Diognetum", "CPG-1112"): (
        "Fathers/Greek/Mathetes_Greek/Epistle to Diognetus.txt",
        "Fathers/English/Mathetes_English/Epistle to Diognetus.txt",
    ),
    ("Iustinus Martyr", "CPG-1073"): (
        "Fathers/Greek/Justin_Greek/The First Apology.txt",
        "Fathers/English/Justin_English/The First Apology.txt",
    ),
    ("Iustinus Martyr", "CPG-1076"): (
        "Fathers/Greek/Justin_Greek/Dialogue with Trypho.txt",
        "Fathers/English/Justin_English/Dialogue with Trypho.txt",
    ),
    ("Athenagoras", "CPG-1070"): (
        "Fathers/Greek/Athenagoras_Greek/A Plea for the Christians.txt",
        "Fathers/English/Athenagoras_English/A Plea for the Christians.txt",
    ),
    ("Athenagoras", "CPG-1071"): (
        "Fathers/Greek/Athenagoras_Greek/The Resurrection of the Dead.txt",
        "Fathers/English/Athenagoras_English/On the Resurrection of the Dead.txt",
    ),
    ("Tatianus", "CPG-1104"): (
        "Fathers/Greek/Tatian_Greek/Address to the Greeks.txt",
        "Fathers/English/Tatian_English/Address to the Greeks.txt",
    ),
    ("Theophilus Antiochenus", "CPG-1107"): (
        "Fathers/Greek/Theophilus_Greek/To Autolycus.txt",
        "Fathers/English/Theophilus_English/To Autolycus.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2090"): (
        "Fathers/Greek/Athanasius_Greek/Against the Heathen.txt",
        "Fathers/English/Athanasius_English/Against the Heathen.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2091"): (
        "Fathers/Greek/Athanasius_Greek/On the Incarnation of the Word.txt",
        "Fathers/English/Athanasius_English/On the Incarnation of the Word.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2093"): (
        "Fathers/Greek/Athanasius_Greek/Discourses Against the Arians.txt",
        "Fathers/English/Athanasius_English/Discourses Against the Arians.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2230"): (
        "Fathers/Greek/Athanasius_Greek/Fourth Discourse Against the Arians.txt",
        "Fathers/English/Athanasius_English/Fourth Discourse Against the Arians.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2120"): (
        "Fathers/Greek/Athanasius_Greek/Defense of the Nicene Definition.txt",
        "Fathers/English/Athanasius_English/Defense of the Nicene Definition.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2121"): (
        "Fathers/Greek/Athanasius_Greek/On the Opinion of Dionysius.txt",
        "Fathers/English/Athanasius_English/On the Opinion of Dionysius.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2129"): (
        "Fathers/Greek/Athanasius_Greek/Defense Before Constantius.txt",
        "Fathers/English/Athanasius_English/Defense Before Constantius.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2130"): (
        "Fathers/Greek/Athanasius_Greek/Letter to John and Antiochus.txt",
        "Fathers/English/Athanasius_English/Letter to John and Antiochus.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2131"): (
        "Fathers/Greek/Athanasius_Greek/Letter to Palladius.txt",
        "Fathers/English/Athanasius_English/Letter to Palladius.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2132"): (
        "Fathers/Greek/Athanasius_Greek/Letter to Dracontius.txt",
        "Fathers/English/Athanasius_English/Letter to Dracontius.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2133"): (
        "Fathers/Greek/Athanasius_Greek/To the Bishops of Africa.txt",
        "Fathers/English/Athanasius_English/To the Bishops of Africa.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2134"): (
        "Fathers/Greek/Athanasius_Greek/Tome to the People of Antioch.txt",
        "Fathers/English/Athanasius_English/Tome to the People of Antioch.txt",
    ),
    ("Athanasius Alexandrinus", "CPG-2135"): (
        "Fathers/Greek/Athanasius_Greek/Letter to the Emperor Jovian.txt",
        "Fathers/English/Athanasius_English/Letter to the Emperor Jovian.txt",
    ),
    ("Clemens Alexandrinus", "CPG-1375"): (
        "Fathers/Greek/Clement_Alexandria_Greek/Exhortation to the Heathen.txt",
        "Fathers/English/Clement_Alexandria_English/Exhortation to the Heathen.txt",
    ),
    ("Clemens Alexandrinus", "CPG-1376"): (
        "Fathers/Greek/Clement_Alexandria_Greek/The Instructor.txt",
        "Fathers/English/Clement_Alexandria_English/The Instructor.txt",
    ),
    ("Clemens Alexandrinus", "CPG-1377"): (
        "Fathers/Greek/Clement_Alexandria_Greek/The Stromata.txt",
        "Fathers/English/Clement_Alexandria_English/The Stromata.txt",
    ),
    ("Methodius Olympius", "CPG-1810"): (
        "Fathers/Greek/Methodius_Greek/Banquet of the Ten Virgins.txt",
        "Fathers/English/Methodius_English/Banquet of the Ten Virgins.txt",
    ),
    ("Methodius Olympius", "CPG-1817"): (
        "Fathers/Greek/Methodius_Greek/Extracts from the Work on Things Created.txt",
        "Fathers/English/Methodius_English/Extracts from the Work on Things Created.txt",
    ),
    ("Methodius Olympius", "CPG-1826"): (
        "Fathers/Greek/Methodius_Greek/Fragments on the Cross and Passion.txt",
        "Fathers/English/Methodius_English/Fragments on the Cross and Passion.txt",
    ),
    ("Gregorius Nazianzenus", "CPG-3010"): (
        "Fathers/Greek/Gregory_Nazianzen_Greek/The Five Theological Orations.txt",
        "Fathers/English/Gregory_Nazianzen_English/The Five Theological Orations.txt",
    ),
    ("Basilius Caesariensis", "CPG-2839"): (
        "Fathers/Greek/Basil_Greek/On the Holy Spirit.txt",
        "Fathers/English/Basil_English/On the Holy Spirit.txt",
    ),
    ("Basilius Caesariensis", "CPG-2900"): (
        "Fathers/Greek/Basil_Greek/Letters.txt",
        "Fathers/English/Basil_English/Letters.txt",
    ),
    ("Theodoretus episcopus Cyri", "CPG-6222"): (
        "Fathers/Greek/Theodoret_Greek/Ecclesiastical History.txt",
        "Fathers/English/Theodoret_English/Ecclesiastical History.txt",
    ),
    ("Hippolytus Romanus", "CPG-1899"): (
        "Fathers/Greek/Hippolytus_Greek/The Refutation of All Heresies.txt",
        "Fathers/English/Hippolytus_English/The Refutation of All Heresies.txt",
    ),
    ("Hippolytus Romanus", "CPG-1873"): (
        "Fathers/Greek/Hippolytus_Greek/Commentary on Daniel.txt",
        "Fathers/English/Hippolytus_English/Commentary on Daniel.txt",
    ),
    ("Basilius Caesariensis", "CPG-2867"): (
        "Fathers/Greek/Basil_Greek/Address to Young Men on Reading Greek Literature.txt",
        "Fathers/English/Basil_English/Address to Young Men on Reading Greek Literature.txt",
    ),
    ("Basilius Caesariensis", "CPG-2901"): (
        "Fathers/Greek/Basil_Greek/Canonical Letters to Amphilochius.txt",
        "Fathers/English/Basil_English/Canonical Letters to Amphilochius.txt",
    ),
    ("Basilius Caesariensis", "CPG-2914"): (
        "Fathers/Greek/Basil_Greek/Against Those Who Calumniate Us as Saying Three Gods.txt",
        "Fathers/English/Basil_English/Against Those Who Calumniate Us as Saying Three Gods.txt",
    ),
    ("Basilius Caesariensis", "CPG-3196"): (
        "Fathers/Greek/Basil_Greek/Letter to His Brother Peter on the Difference Between Ousia and Hypostasis.txt",
        "Fathers/English/Basil_English/Letter to His Brother Peter on the Difference Between Ousia and Hypostasis.txt",
    ),
    ("Basilius Caesariensis", "CPG-3416"): (
        "Fathers/Greek/Basil_Greek/Letter to the Italians and Gauls.txt",
        "Fathers/English/Basil_English/Letter to the Italians and Gauls.txt",
    ),
    ("Basilius Caesariensis", "BHG-260b"): (
        "Fathers/Greek/Basil_Greek/Letters Between Emperor Julian and Basil.txt",
        "Fathers/English/Basil_English/Letters Between Emperor Julian and Basil.txt",
    ),
}


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("v", "u")


def stem_norm(s: str) -> str:
    s = fold(Path(s).stem)
    s = re.sub(r"\([^)]*\)", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(
        r"\b(liber|libri|seu|uel|vel|and|the|a|an|on|of|st|sancti|book|lib)\b",
        " ",
        s,
    )
    return " ".join(s.split())


def slugify(name: str, author_id: str, used: set[str]) -> str:
    s = fold(name)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:70]
    if not s:
        s = author_id[:12].lower()
    base = s
    n = 2
    while s in used:
        s = f"{base}-{n}"
        n += 1
    used.add(s)
    return s


def literal_en(lat: str) -> str:
    t = lat.strip()
    t = t.replace("Ciuitate", "Civitate").replace("ciuitate", "civitate")
    t = t.replace("uita", "vita").replace("Uita", "Vita")
    t = t.replace("euangel", "evangel")
    t = re.sub(r"^De\s+", "On ", t)
    t = re.sub(r"^Adversus\s+", "Against ", t)
    t = re.sub(r"^Aduersus\s+", "Against ", t)
    t = re.sub(r"^Contra\s+", "Against ", t)
    t = re.sub(r"^Ad\s+", "To ", t)
    t = t.replace("Epistulae", "Letters").replace("Epistula", "Letter")
    t = t.replace("Homiliae", "Homilies").replace("Homilia", "Homily")
    t = t.replace("Commentarii", "Commentary").replace("Commentarius", "Commentary")
    t = t.replace("Sermones", "Sermons").replace("Sermo", "Sermon")
    t = t.replace("Tractatus", "Tractate")
    t = t.replace("Fragmenta", "Fragments").replace("Fragmentum", "Fragment")
    return t


def title_english(clavis: list[str], title_latin: str) -> str:
    for c in clavis:
        if c in CONVENTIONAL_EN:
            return CONVENTIONAL_EN[c]
    return literal_en(title_latin)


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")


def yn(value: object) -> bool:
    if value is True or value == "Y" or value == "have":
        return True
    if value is False or value in (None, "N", "missing", ""):
        return False
    return bool(value)


def yn_cell(value: object) -> str:
    return "Y" if yn(value) else "N"


def flag_box(value: object) -> str:
    return "x" if yn(value) else " "


def list_txt(folder: Path) -> list[Path]:
    if not folder.is_dir():
        return []
    return sorted(p for p in folder.glob("*.txt") if p.is_file())


def rel(p: Path) -> str:
    return str(p.relative_to(ROOT)).replace("\\", "/")


def is_skip(path: Path) -> bool:
    return stem_norm(path.name) in SKIP_STEMS


def unique_file_match(title: str, files: list[Path]) -> Path | None:
    want = stem_norm(title)
    if not want or len(want) < 4:
        return None
    hits = []
    for p in files:
        if is_skip(p):
            continue
        got = stem_norm(p.name)
        if got == want:
            hits.append(p)
    if len(hits) == 1:
        return hits[0]
    return None


def build() -> None:
    authors_in = load_jsonl(COVERAGE / "allowlist-expanded.jsonl")
    works_in = load_jsonl(COVERAGE / "works-by-author.jsonl")
    if len(authors_in) != 258:
        raise SystemExit(f"expected 258 authors, got {len(authors_in)}")
    if len(works_in) != 5117:
        raise SystemExit(f"expected 5117 works, got {len(works_in)}")

    used_slugs: set[str] = set()
    authors = []
    by_id = {}
    for a in authors_in:
        slug = slugify(a["nameLatin"], a["author_id"], used_slugs)
        folders = AUTHOR_FOLDERS.get(a["nameLatin"], (None, None))
        row = {
            "author_id": a["author_id"],
            "slug": slug,
            "nameLatin": a["nameLatin"],
            "detailUrl": a.get("detailUrl") or "",
            "letterBucket": a.get("letterBucket") or "",
            "latinFolder": folders[0],
            "englishFolder": folders[1],
        }
        authors.append(row)
        by_id[a["author_id"]] = row

    latin_files: dict[str, list[Path]] = {}
    english_files: dict[str, list[Path]] = {}
    for a in authors:
        if a["latinFolder"]:
            latin_files[a["author_id"]] = list_txt(ROOT / "Fathers" / "Latin" / a["latinFolder"])
        if a["englishFolder"]:
            english_files[a["author_id"]] = list_txt(ROOT / "Fathers" / "English" / a["englishFolder"])

    # Claim files so two works cannot take the same path.
    claimed_orig: set[str] = set()
    claimed_en: set[str] = set()

    prev_flags: dict[tuple[str, str], dict] = {}
    existing_path = OUT / "works.jsonl"
    if existing_path.is_file():
        for old in load_jsonl(existing_path):
            prev_flags[(old.get("author_id", ""), old.get("work_id", ""))] = old

    works = []
    for w in works_in:
        clavis = list(w.get("clavis") or [])
        author = by_id[w["author_id"]]
        title_lat = w.get("titleLatin") or ""
        path = list(w.get("path") or [])
        kind = w.get("kind") or "work"
        orig = "missing"
        trans = "missing"
        orig_path = None
        trans_path = None

        prev = prev_flags.get((w["author_id"], w["work_id"]), {})
        if prev.get("originalPath") and (ROOT / prev["originalPath"]).is_file() and prev["originalPath"] not in claimed_orig:
            orig = "have"
            orig_path = prev["originalPath"]
            claimed_orig.add(orig_path)
        if prev.get("translationPath") and (ROOT / prev["translationPath"]).is_file() and prev["translationPath"] not in claimed_en:
            trans = "have"
            trans_path = prev["translationPath"]
            claimed_en.add(trans_path)

        explicit = None
        for cid in clavis:
            explicit = EXPLICIT.get((w.get("authorNameLatin"), cid))
            if explicit:
                break
        if not explicit:
            explicit = EXPLICIT.get((w.get("authorNameLatin"), w["work_id"]))
        if explicit:
            o, e = explicit
            if orig == "missing" and o and (ROOT / o).is_file() and o not in claimed_orig:
                orig, orig_path = "have", o
                claimed_orig.add(o)
            if trans == "missing" and e and (ROOT / e).is_file() and e not in claimed_en:
                trans, trans_path = "have", e
                claimed_en.add(e)

        if orig == "missing" and w["author_id"] in latin_files:
            folder = ROOT / "Fathers" / "Latin" / author["latinFolder"]
            hit = None
            for cid in clavis:
                fname = EN_FILE_BY_CLAVIS.get(cid)
                if fname and (folder / fname).is_file():
                    hit = folder / fname
                    break
            if hit is None:
                hit = unique_file_match(title_lat, latin_files[w["author_id"]])
            if hit:
                r = rel(hit)
                if r not in claimed_orig:
                    orig, orig_path = "have", r
                    claimed_orig.add(r)

        if trans == "missing" and w["author_id"] in english_files:
            folder = ROOT / "Fathers" / "English" / author["englishFolder"]
            hit_path = None
            for cid in clavis:
                fname = EN_FILE_BY_CLAVIS.get(cid)
                if fname and (folder / fname).is_file():
                    hit_path = folder / fname
                    break
            if hit_path is None:
                hit_path = unique_file_match(title_lat, english_files[w["author_id"]])
            if hit_path is not None:
                r = rel(hit_path)
                if r not in claimed_en:
                    trans, trans_path = "have", r
                    claimed_en.add(r)

        prev = prev_flags.get((w["author_id"], w["work_id"]), {})
        works.append(
            {
                "work_id": w["work_id"],
                "author_id": w["author_id"],
                "authorSlug": author["slug"],
                "authorNameLatin": w.get("authorNameLatin") or author["nameLatin"],
                "titleLatin": title_lat,
                "titleEnglish": title_english(clavis, title_lat),
                "clavis": clavis,
                "path": path,
                "kind": kind,
                "detailUrl": w.get("detailUrl") or "",
                "hasEnglishText": trans == "have",
                "hasOriginalText": orig == "have",
                "formattedEnglish": yn(prev.get("formattedEnglish")),
                "formattedOriginal": yn(prev.get("formattedOriginal")),
                "englishTagged": yn(prev.get("englishTagged")),
                "originalTagged": yn(prev.get("originalTagged")),
                "originalPath": orig_path,
                "translationPath": trans_path,
            }
        )

    OUT.mkdir(parents=True, exist_ok=True)
    write_jsonl(OUT / "authors.jsonl", authors)
    write_jsonl(OUT / "works.jsonl", works)
    (OUT / "PROVENANCE.md").write_text(
        "\n".join(
            [
                "# Clavis checklist provenance",
                "",
                "Working list of authors and works to fill in original language + English.",
                "",
                "## Source",
                "",
                "- `data/clavis-coverage/` — seminary-survey Clavis Clavium OA extract",
                "- 258 authors, 5,117 work/fragment rows",
                "- OA: https://clavis.brepols.net/clacla/OA/",
                "",
                "## Not this list",
                "",
                "- `data/clavis-extract/` (9,699 A–Z Authors/Saints names + Personae scrape) is out of scope.",
                "- Empty rows are not added to `catalog.json` / `server/englishWorks.ts`.",
                "- This folder is a working checklist. It is not wired into the site.",
                "- Six survey authors have no work rows in the dump (Anastasius bibliothecarius,",
                "  Aristides, Dionysius Areopagita, Eusebius papa, Gregory III, Leo I). They stay",
                "  on the author list with 0/0 until works are added to `works.jsonl`.",
                "- `work_id` can repeat across authors (shared / see-also rows). The checklist",
                "  row is `(author_id, work_id)`.",
                "",
                "## Kept vs refused from Clavis",
                "",
                "- Keep: author name, work title, clavis id, OA URL, our checkoff + file paths.",
                "- Refuse: editions, manuscripts, incipits, bibliography, revision history.",
                "- English titles are conventional when known, otherwise a literal of the Latin.",
                "",
                "## Y/N columns (every work)",
                "",
                "| Field | Meaning |",
                "|-------|---------|",
                "| `hasEnglishText` | Raw English file exists (1:1) |",
                "| `hasOriginalText` | Raw original-language file exists (1:1) |",
                "| `formattedEnglish` | English is split/readable for the shelf |",
                "| `formattedOriginal` | Original is split/readable for the shelf |",
                "| `englishTagged` | English has verse/topic tags |",
                "| `originalTagged` | Original has verse/topic tags |",
                "",
                "Export: `data/clavis/tasks.csv` (Y/N). Import that into a spreadsheet or GitHub project.",
                "Do not create one GitHub issue per row unless you mean ~5,117 issues.",
                "",
                "## How to update",
                "",
                "1. Land a 1:1 text under `Fathers/`.",
                "2. Set the matching Y/N fields on that row in `works.jsonl`.",
                "3. Run `python3 scripts/clavis-checklist.py regen`.",
                "",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    regen()
    counts = {k: sum(1 for w in works if w[k]) for k in BOOL_FIELDS}
    print(
        f"authors {len(authors)} works {len(works)} "
        + " ".join(f"{k} {counts[k]}" for k in BOOL_FIELDS)
    )


def work_flags(w: dict) -> dict[str, bool]:
    # New fields, with a one-time map from the old original/translation columns.
    return {
        "hasEnglishText": yn(w.get("hasEnglishText", w.get("translation") == "have")),
        "hasOriginalText": yn(w.get("hasOriginalText", w.get("original") == "have")),
        "formattedEnglish": yn(w.get("formattedEnglish")),
        "formattedOriginal": yn(w.get("formattedOriginal")),
        "englishTagged": yn(w.get("englishTagged")),
        "originalTagged": yn(w.get("originalTagged")),
    }


def write_tasks_csv(works: list[dict]) -> None:
    path = OUT / "tasks.csv"
    headers = [
        "authorNameLatin",
        "titleLatin",
        "titleEnglish",
        "clavis",
        "Has English text?",
        "Has original text?",
        "Formatted English text?",
        "Formatted original text?",
        "English tagged?",
        "Original tagged?",
        "authorSlug",
        "author_id",
        "work_id",
        "kind",
        "englishPath",
        "originalPath",
    ]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for w in works:
            flags = work_flags(w)
            writer.writerow(
                [
                    w.get("authorNameLatin") or "",
                    w.get("titleLatin") or "",
                    w.get("titleEnglish") or "",
                    " ".join(w.get("clavis") or []),
                    yn_cell(flags["hasEnglishText"]),
                    yn_cell(flags["hasOriginalText"]),
                    yn_cell(flags["formattedEnglish"]),
                    yn_cell(flags["formattedOriginal"]),
                    yn_cell(flags["englishTagged"]),
                    yn_cell(flags["originalTagged"]),
                    w.get("authorSlug") or "",
                    w.get("author_id") or "",
                    w.get("work_id") or "",
                    w.get("kind") or "",
                    w.get("translationPath") or "",
                    w.get("originalPath") or "",
                ]
            )


def regen() -> None:
    authors = load_jsonl(OUT / "authors.jsonl")
    works = load_jsonl(OUT / "works.jsonl")
    by_author: dict[str, list[dict]] = defaultdict(list)
    for w in works:
        by_author[w["author_id"]].append(w)

    author_dir = OUT / "authors"
    if author_dir.exists():
        for old in author_dir.glob("*.md"):
            old.unlink()
    author_dir.mkdir(parents=True, exist_ok=True)

    index_lines = [
        "# Clavis works checklist",
        "",
        "Off-site working list. Not shown on the reader.",
        "",
        "258 authors · 5,117 works. Six Y/N columns per work.",
        "",
        "Canonical file: `works.jsonl`. Spreadsheet / GitHub export: `tasks.csv`.",
        "Regen with `python3 scripts/clavis-checklist.py regen`.",
        "",
    ]
    done_authors = 0
    for a in authors:
        rows = by_author.get(a["author_id"], [])
        n = len(rows)
        tallies = {k: sum(1 for w in rows if work_flags(w)[k]) for k in BOOL_FIELDS}
        author_done = n > 0 and all(tallies[k] == n for k in BOOL_FIELDS)
        if author_done:
            done_authors += 1
        mark = "x" if author_done else " "
        index_lines.append(
            f"- [{mark}] [{a['nameLatin']}](authors/{a['slug']}.md) — "
            f"en {tallies['hasEnglishText']}/{n} · orig {tallies['hasOriginalText']}/{n} · "
            f"fmt-en {tallies['formattedEnglish']}/{n} · fmt-orig {tallies['formattedOriginal']}/{n} · "
            f"tag-en {tallies['englishTagged']}/{n} · tag-orig {tallies['originalTagged']}/{n}"
        )

        body = [
            f"# {a['nameLatin']}",
            "",
            f"en {tallies['hasEnglishText']}/{n} · orig {tallies['hasOriginalText']}/{n} · "
            f"fmt-en {tallies['formattedEnglish']}/{n} · fmt-orig {tallies['formattedOriginal']}/{n} · "
            f"tag-en {tallies['englishTagged']}/{n} · tag-orig {tallies['originalTagged']}/{n}",
            "",
        ]
        if a.get("detailUrl"):
            body.append(f"Clavis: {a['detailUrl']}")
            body.append("")
        for w in rows:
            flags = work_flags(w)
            clavis = ", ".join(w.get("clavis") or []) or "no clavis id"
            tags = []
            if w.get("kind") == "fragment":
                tags.append("fragment")
            path0 = (w.get("path") or [None])[0]
            if path0 == "Vide et":
                tags.append("see-also")
            elif path0:
                tags.append(path0)
            tag_s = f" · {' · '.join(tags)}" if tags else ""
            heading = w.get("titleLatin") or w.get("titleEnglish") or w["work_id"]
            body.append(f"## {heading}")
            body.append("")
            body.append(f"{clavis}{tag_s}")
            if w.get("titleEnglish") and w["titleEnglish"] != w.get("titleLatin"):
                body.append(f"English title: {w['titleEnglish']}")
            notes = {
                "hasEnglishText": f"  `{w['translationPath']}`" if w.get("translationPath") else "",
                "hasOriginalText": f"  `{w['originalPath']}`" if w.get("originalPath") else "",
            }
            for key in BOOL_FIELDS:
                body.append(f"- [{flag_box(flags[key])}] {BOOL_LABELS[key]}{notes.get(key, '')}")
            body.append("")
        (author_dir / f"{a['slug']}.md").write_text("\n".join(body).rstrip() + "\n", encoding="utf-8")

    index_lines[4:4] = [
        f"Authors fully checked: {done_authors}/{len(authors)}.",
        "",
    ]
    (OUT / "CHECKLIST.md").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    write_tasks_csv(works)
    print(f"wrote {OUT / 'CHECKLIST.md'}, {len(authors)} author files, {OUT / 'tasks.csv'}")


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    if cmd == "build":
        build()
    elif cmd in ("regen", "export"):
        regen()
    else:
        raise SystemExit("usage: clavis-checklist.py [build|regen]")


if __name__ == "__main__":
    main()
