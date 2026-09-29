#!/usr/bin/env python3
"""
Extract 41 Latin texts for St. Augustine of Hippo from CSEL and Patrologia Latina:

Group 1: scratch/pl32.xml
- Soliloquies (CPL-252) -> sub[00]
- On the Morals of the Catholic Church and of the Manichaeans (CPL-261) -> sub[06]

Group 2: scratch/pl34.xml
- On Christian Doctrine (CPL-263) -> sub[00]
- Our Lord's Sermon on the Mount (CPL-274) -> sub[03]

Group 3: scratch/pl35.xml
- Tractates on the Gospel of John (CPL-278) -> sub[03]
- Ten Homilies on the First Epistle of John (CPL-279) -> sub[04]

Group 4: scratch/pl36.xml & scratch/pl37.xml
- Expositions on the Psalms (CPL-283) -> pl36 edition + pl37 edition

Group 5: scratch/pl40.xml
- Concerning Faith of Things Not Seen (CPL-292) -> sub[04]
- On the Creed: A Sermon to Catechumens (CPL-309) -> sub[08]

Group 6: scratch/pl44.xml & scratch/pl45.xml
- On Grace and Free Will (CPL-352) -> pl44 sub[08]
- On Rebuke and Grace (CPL-353) -> pl44 sub[11]
- On the Predestination of the Saints (CPL-354) -> pl44 sub[14]
- On the Gift of Perseverance (CPL-355) -> pl45 sub[00]

Group 7: scratch/csel41.xml (Moral Treatises)
- On Continence (CPL-298) -> stoa0040.stoa037a
- On the Good of Marriage (CPL-299) -> stoa0040.stoa035
- Of Holy Virginity (CPL-300) -> stoa0040.stoa060
- On the Good of Widowhood (CPL-301) -> stoa0040.stoa035a
- On Lying (CPL-303) -> stoa0040.stoa050
- Against Lying (CPL-304) -> stoa0040.stoa029
- Of the Work of Monks (CPL-305) -> stoa0040.stoa055
- On Care to be Had for the Dead (CPL-307) -> stoa0040.stoa037c
- On Patience (CPL-308) -> stoa0040.stoa056b

Group 8: scratch/csel25_1.xml & scratch/csel25_2.xml (Anti-Manichaean Treatises)
- On the Profit of Believing (CPL-316) -> csel25_1 stoa0040.stoa064
- On Two Souls, Against the Manichaeans (CPL-317) -> csel25_1 stoa0040.stoa040
- Disputation Against Fortunatus the Manichaean (CPL-318) -> csel25_1 stoa0040.stoa024b
- Against the Fundamental Epistle of Manichaeus (CPL-320) -> csel25_1 stoa0040.stoa021a
- Reply to Faustus the Manichaean (CPL-321) -> csel25_1 stoa0040.stoa024
- On the Nature of Good, Against the Manichaeans (CPL-323) -> csel25_2 stoa0040.stoa053

Group 9: scratch/csel42.xml (Pelagian Treatises I)
- On the Perfection of Man's Righteousness (CPL-347) -> stoa0040.stoa057a
- On the Proceedings of Pelagius (CPL-348) -> stoa0040.stoa044
- On the Grace of Christ and on Original Sin (CPL-349) -> stoa0040.stoa046 + stoa0040.stoa056c
- On Marriage and Concupiscence (CPL-350) -> stoa0040.stoa056a

Group 10: scratch/csel60.xml (Pelagian Treatises II)
- On the Merits and Forgiveness of Sins, and on the Baptism of Infants (CPL-342) -> stoa0040.stoa057
- On the Spirit and the Letter (CPL-343) -> stoa0040.stoa062
- On Nature and Grace (CPL-344) -> stoa0040.stoa054
- On the Soul and Its Origin (CPL-345) -> stoa0040.stoa033
- Against Two Letters of the Pelagians (CPL-346) -> stoa0040.stoa021

Group 11: Other Major Treatises
- The Harmony of the Gospels (CPL-273) -> scratch/csel43.xml stoa0040.stoa037
- On Baptism Against the Donatists (CPL-332) -> scratch/csel53.xml stoa0040.stoa063
- Answer to Letters of Petilian (CPL-333) -> scratch/csel51.xml stoa0040.stoa033a
- Letters (CPL-262) -> scratch/csel44.xml
"""
import os
import re
import xml.etree.ElementTree as ET

OUT_DIR = "Fathers/Latin/Augustine_Latin"
os.makedirs(OUT_DIR, exist_ok=True)
ns = {"tei": "http://www.tei-c.org/ns/1.0"}

def clean_node(node):
    parts = []
    def recurse(n):
        if n.tag.endswith("note"):
            if n.tail:
                parts.append(n.tail)
            return
        if n.text:
            parts.append(n.text)
        for child in n:
            recurse(child)
        if n.tail:
            parts.append(n.tail)
    recurse(node)
    text = " ".join("".join(parts).split())
    text = re.sub(r"(\w+)-\s+(\w+)", r"\1\2", text)
    return text

def extract_blocks(root_elem):
    blocks = []
    seen = set()
    for child in root_elem.iter():
        tag = child.tag.split("}")[-1]
        if tag in ("head", "p") and child not in seen:
            for descendant in child.iter():
                if descendant is not child:
                    seen.add(descendant)
            t = clean_node(child)
            if t:
                blocks.append(t)
    return "\n\n".join(blocks)

def write_work(filename, father, work_name, clavis, source, note, text):
    header = f"""# source: {source}
# father: {father}
# work: {work_name}
# clavis: {clavis}
# language: Latin
# note: {note}

"""
    out_path = os.path.join(OUT_DIR, filename)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header + text + "\n")
    print(f"Wrote {out_path} ({len(text)} chars)")

# --- Group 1: PL 32 ---
print("Extracting from scratch/pl32.xml...")
t32 = ET.parse("scratch/pl32.xml")
ed32 = t32.find(".//tei:div[@type=\"edition\"]", ns)
divs32 = ed32.findall("./tei:div", ns)

write_work(
    "Soliloquies.txt", "augustine", "Soliloquies", "CPL-252",
    "Patrologia Latina 32, cols. 869-904 (J.-P. Migne)",
    "Complete Latin text of Soliloquiorum Libri Duo from Patrologia Latina 32.",
    extract_blocks(divs32[0])
)
write_work(
    "On the Morals of the Catholic Church and of the Manichaeans.txt", "augustine",
    "On the Morals of the Catholic Church and of the Manichaeans", "CPL-261",
    "Patrologia Latina 32, cols. 1309-1378 (J.-P. Migne)",
    "Complete Latin text of De Moribus Ecclesiae Catholicae et de Moribus Manichaeorum Libri Duo from Patrologia Latina 32.",
    extract_blocks(divs32[6])
)

# --- Group 2: PL 34 ---
print("Extracting from scratch/pl34.xml...")
t34 = ET.parse("scratch/pl34.xml")
ed34 = t34.find(".//tei:div[@type=\"edition\"]", ns)
divs34 = ed34.findall("./tei:div", ns)

write_work(
    "On Christian Doctrine.txt", "augustine", "On Christian Doctrine", "CPL-263",
    "Patrologia Latina 34, cols. 15-122 (J.-P. Migne)",
    "Complete Latin text of De Doctrina Christiana Libri Quatuor from Patrologia Latina 34.",
    extract_blocks(divs34[0])
)
write_work(
    "Our Lord's Sermon on the Mount.txt", "augustine", "Our Lord's Sermon on the Mount", "CPL-274",
    "Patrologia Latina 34, cols. 1229-1308 (J.-P. Migne)",
    "Complete Latin text of De Sermone Domini in Monte Libri Duo from Patrologia Latina 34.",
    extract_blocks(divs34[3])
)

# --- Group 3: PL 35 ---
print("Extracting from scratch/pl35.xml...")
t35 = ET.parse("scratch/pl35.xml")
ed35 = t35.find(".//tei:div[@type=\"edition\"]", ns)
divs35 = ed35.findall("./tei:div", ns)

write_work(
    "Tractates on the Gospel of John.txt", "augustine", "Tractates on the Gospel of John", "CPL-278",
    "Patrologia Latina 35, cols. 1379-1976 (J.-P. Migne)",
    "Complete Latin text of In Joannis Evangelium Tractatus CXXIV from Patrologia Latina 35.",
    extract_blocks(divs35[3])
)
write_work(
    "Ten Homilies on the First Epistle of John.txt", "augustine", "Ten Homilies on the First Epistle of John", "CPL-279",
    "Patrologia Latina 35, cols. 1977-2062 (J.-P. Migne)",
    "Complete Latin text of In Epistolam Joannis ad Parthos Tractatus Decem from Patrologia Latina 35.",
    extract_blocks(divs35[4])
)

# --- Group 4: PL 36 & PL 37 (Expositions on the Psalms) ---
print("Extracting Expositions on the Psalms from scratch/pl36.xml and pl37.xml...")
t36 = ET.parse("scratch/pl36.xml")
ed36 = t36.find(".//tei:div[@type=\"edition\"]", ns)
t37 = ET.parse("scratch/pl37.xml")
ed37 = t37.find(".//tei:div[@type=\"edition\"]", ns)
text_enarrationes = extract_blocks(ed36) + "\n\n" + extract_blocks(ed37)

write_work(
    "Expositions on the Psalms.txt", "augustine", "Expositions on the Psalms", "CPL-283",
    "Patrologia Latina 36 & 37 (J.-P. Migne)",
    "Complete Latin text of Enarrationes in Psalmos (Psalmi 1-150) from Patrologia Latina 36 and 37.",
    text_enarrationes
)

# --- Group 5: PL 40 ---
print("Extracting from scratch/pl40.xml...")
t40 = ET.parse("scratch/pl40.xml")
ed40 = t40.find(".//tei:div[@type=\"edition\"]", ns)
divs40 = ed40.findall("./tei:div", ns)

write_work(
    "Concerning Faith of Things Not Seen.txt", "augustine", "Concerning Faith of Things Not Seen", "CPL-292",
    "Patrologia Latina 40, cols. 171-180 (J.-P. Migne)",
    "Complete Latin text of De Fide Rerum Quae Non Videntur from Patrologia Latina 40.",
    extract_blocks(divs40[4])
)
write_work(
    "On the Creed - A Sermon to Catechumens.txt", "augustine", "On the Creed: A Sermon to Catechumens", "CPL-309",
    "Patrologia Latina 40, cols. 627-636 (J.-P. Migne)",
    "Complete Latin text of De Symbolo Sermo ad Catechumenos from Patrologia Latina 40.",
    extract_blocks(divs40[8])
)

# --- Group 6: PL 44 & PL 45 ---
print("Extracting from scratch/pl44.xml & pl45.xml...")
t44 = ET.parse("scratch/pl44.xml")
ed44 = t44.find(".//tei:div[@type=\"edition\"]", ns)
divs44 = ed44.findall("./tei:div", ns)

write_work(
    "On Grace and Free Will.txt", "augustine", "On Grace and Free Will", "CPL-352",
    "Patrologia Latina 44, cols. 881-912 (J.-P. Migne)",
    "Complete Latin text of De Gratia et Libero Arbitrio from Patrologia Latina 44.",
    extract_blocks(divs44[8])
)
write_work(
    "On Rebuke and Grace.txt", "augustine", "On Rebuke and Grace", "CPL-353",
    "Patrologia Latina 44, cols. 915-946 (J.-P. Migne)",
    "Complete Latin text of De Correptione et Gratia from Patrologia Latina 44.",
    extract_blocks(divs44[11])
)
write_work(
    "On the Predestination of the Saints.txt", "augustine", "On the Predestination of the Saints", "CPL-354",
    "Patrologia Latina 44, cols. 959-992 (J.-P. Migne)",
    "Complete Latin text of De Praedestinatione Sanctorum Liber Primus from Patrologia Latina 44.",
    extract_blocks(divs44[14])
)

t45 = ET.parse("scratch/pl45.xml")
ed45 = t45.find(".//tei:div[@type=\"edition\"]", ns)
divs45 = ed45.findall("./tei:div", ns)

write_work(
    "On the Gift of Perseverance.txt", "augustine", "On the Gift of Perseverance", "CPL-355",
    "Patrologia Latina 45, cols. 993-1034 (J.-P. Migne)",
    "Complete Latin text of De Dono Perseverantiae Liber Secundus from Patrologia Latina 45.",
    extract_blocks(divs45[0])
)

# --- Group 7: CSEL 41 (Moral Treatises) ---
print("Extracting from scratch/csel41.xml...")
t_csel41 = ET.parse("scratch/csel41.xml")
works_csel41 = {w.attrib.get("n"): w for w in t_csel41.findall(".//tei:div[@subtype=\"work\"]", ns)}

csel41_map = [
    ("On Continence.txt", "stoa0040.stoa037a", "CPL-298", "De Continentia"),
    ("On the Good of Marriage.txt", "stoa0040.stoa035", "CPL-299", "De Bono Coniugali"),
    ("Of Holy Virginity.txt", "stoa0040.stoa060", "CPL-300", "De Sancta Virginitate"),
    ("On the Good of Widowhood.txt", "stoa0040.stoa035a", "CPL-301", "De Bono Viduitatis"),
    ("On Lying.txt", "stoa0040.stoa050", "CPL-303", "De Mendacio"),
    ("Against Lying.txt", "stoa0040.stoa029", "CPL-304", "Contra Mendacium"),
    ("Of the Work of Monks.txt", "stoa0040.stoa055", "CPL-305", "De Opere Monachorum"),
    ("On Care to be Had for the Dead.txt", "stoa0040.stoa037c", "CPL-307", "De Cura pro Mortuis Gerenda"),
    ("On Patience.txt", "stoa0040.stoa056b", "CPL-308", "De Patientia"),
]

for filename, stoa_id, clavis, latin_title in csel41_map:
    w = works_csel41[stoa_id]
    write_work(
        filename, "augustine", filename.replace(".txt", ""), clavis,
        "CSEL 41 (J. Zycha, 1900) / Corpus Scriptorum Ecclesiasticorum Latinorum",
        f"Critical edition of {latin_title} from CSEL 41.",
        extract_blocks(w)
    )

# --- Group 8: CSEL 25 (Anti-Manichaean Treatises) ---
print("Extracting from scratch/csel25_1.xml and csel25_2.xml...")
t_csel25_1 = ET.parse("scratch/csel25_1.xml")
works_csel25_1 = {w.attrib.get("n"): w for w in t_csel25_1.findall(".//tei:div[@subtype=\"work\"]", ns)}
t_csel25_2 = ET.parse("scratch/csel25_2.xml")
works_csel25_2 = {w.attrib.get("n"): w for w in t_csel25_2.findall(".//tei:div[@subtype=\"work\"]", ns)}

csel25_map = [
    ("On the Profit of Believing.txt", works_csel25_1["stoa0040.stoa064"], "CPL-316", "De Utilitate Credendi Liber"),
    ("On Two Souls, Against the Manichaeans.txt", works_csel25_1["stoa0040.stoa040"], "CPL-317", "De Duabus Animabus"),
    ("Disputation Against Fortunatus the Manichaean.txt", works_csel25_1["stoa0040.stoa024b"], "CPL-318", "Acta contra Fortunatum Manichaeum"),
    ("Against the Fundamental Epistle of Manichaeus.txt", works_csel25_1["stoa0040.stoa021a"], "CPL-320", "Contra Epistulam Fundamenti"),
    ("Reply to Faustus the Manichaean.txt", works_csel25_1["stoa0040.stoa024"], "CPL-321", "Contra Faustum Manichaeum Libri XXXIII"),
    ("On the Nature of Good, Against the Manichaeans.txt", works_csel25_2["stoa0040.stoa053"], "CPL-323", "De Natura Boni Liber"),
]

for filename, elem, clavis, latin_title in csel25_map:
    write_work(
        filename, "augustine", filename.replace(".txt", ""), clavis,
        "CSEL 25 (J. Zycha, 1891-1892) / Corpus Scriptorum Ecclesiasticorum Latinorum",
        f"Critical edition of {latin_title} from CSEL 25.",
        extract_blocks(elem)
    )

# --- Group 9: CSEL 42 (Pelagian Treatises I) ---
print("Extracting from scratch/csel42.xml...")
t_csel42 = ET.parse("scratch/csel42.xml")
works_csel42 = {w.attrib.get("n"): w for w in t_csel42.findall(".//tei:div[@subtype=\"work\"]", ns)}

write_work(
    "On the Perfection of Man's Righteousness.txt", "augustine", "On the Perfection of Man's Righteousness", "CPL-347",
    "CSEL 42 (C. F. Vrba & J. Zycha, 1902) / Corpus Scriptorum Ecclesiasticorum Latinorum",
    "Critical edition of De Perfectione Iustitiae Hominis from CSEL 42.",
    extract_blocks(works_csel42["stoa0040.stoa057a"])
)
write_work(
    "On the Proceedings of Pelagius.txt", "augustine", "On the Proceedings of Pelagius", "CPL-348",
    "CSEL 42 (C. F. Vrba & J. Zycha, 1902) / Corpus Scriptorum Ecclesiasticorum Latinorum",
    "Critical edition of De Gestis Pelagii from CSEL 42.",
    extract_blocks(works_csel42["stoa0040.stoa044"])
)
# De Gratia Christi et de Peccato Originali is Libri II: stoa0040.stoa046 + stoa0040.stoa056c
text_gratia = extract_blocks(works_csel42["stoa0040.stoa046"]) + "\n\n" + extract_blocks(works_csel42["stoa0040.stoa056c"])
write_work(
    "On the Grace of Christ and on Original Sin.txt", "augustine", "On the Grace of Christ and on Original Sin", "CPL-349",
    "CSEL 42 (C. F. Vrba & J. Zycha, 1902) / Corpus Scriptorum Ecclesiasticorum Latinorum",
    "Critical edition of De Gratia Christi et de Peccato Originali Libri Duo from CSEL 42.",
    text_gratia
)
write_work(
    "On Marriage and Concupiscence.txt", "augustine", "On Marriage and Concupiscence", "CPL-350",
    "CSEL 42 (C. F. Vrba & J. Zycha, 1902) / Corpus Scriptorum Ecclesiasticorum Latinorum",
    "Critical edition of De Nuptiis et Concupiscentia Libri Duo from CSEL 42.",
    extract_blocks(works_csel42["stoa0040.stoa056a"])
)

# --- Group 10: CSEL 60 (Pelagian Treatises II) ---
print("Extracting from scratch/csel60.xml...")
t_csel60 = ET.parse("scratch/csel60.xml")
works_csel60 = {w.attrib.get("n"): w for w in t_csel60.findall(".//tei:div[@subtype=\"work\"]", ns)}

csel60_map = [
    ("On the Merits and Forgiveness of Sins, and on the Baptism of Infants.txt", "stoa0040.stoa057", "CPL-342", "De Peccatorum Meritis et Remissione et de Baptismo Parvulorum"),
    ("On the Spirit and the Letter.txt", "stoa0040.stoa062", "CPL-343", "De Spiritu et Littera"),
    ("On Nature and Grace.txt", "stoa0040.stoa054", "CPL-344", "De Natura et Gratia"),
    ("On the Soul and Its Origin.txt", "stoa0040.stoa033", "CPL-345", "De Natura et Origine Animae"),
    ("Against Two Letters of the Pelagians.txt", "stoa0040.stoa021", "CPL-346", "Contra Duas Epistulas Pelagianorum"),
]

for filename, stoa_id, clavis, latin_title in csel60_map:
    write_work(
        filename, "augustine", filename.replace(".txt", ""), clavis,
        "CSEL 60 (C. F. Vrba & J. Zycha, 1913) / Corpus Scriptorum Ecclesiasticorum Latinorum",
        f"Critical edition of {latin_title} from CSEL 60.",
        extract_blocks(works_csel60[stoa_id])
    )

# --- Group 11: Other Major Treatises (CSEL 43, 51, 53, 44) ---
print("Extracting from CSEL 43, 51, 53, 44...")
t_csel43 = ET.parse("scratch/csel43.xml")
w43 = t_csel43.find(".//tei:div[@subtype=\"work\"][@n=\"stoa0040.stoa037\"]", ns)
write_work(
    "The Harmony of the Gospels.txt", "augustine", "The Harmony of the Gospels", "CPL-273",
    "CSEL 43 (F. Weihrich, 1904) / Corpus Scriptorum Ecclesiasticorum Latinorum",
    "Critical edition of De Consensu Evangelistarum Libri Quatuor from CSEL 43.",
    extract_blocks(w43)
)

t_csel53 = ET.parse("scratch/csel53.xml")
w53 = t_csel53.find(".//tei:div[@subtype=\"work\"][@n=\"stoa0040.stoa063\"]", ns)
write_work(
    "On Baptism Against the Donatists.txt", "augustine", "On Baptism Against the Donatists", "CPL-332",
    "CSEL 53 (M. Petschenig, 1908) / Corpus Scriptorum Ecclesiasticorum Latinorum",
    "Critical edition of De Baptismo contra Donatistas Libri Septem from CSEL 53.",
    extract_blocks(w53)
)

t_csel51 = ET.parse("scratch/csel51.xml")
w51 = t_csel51.find(".//tei:div[@subtype=\"work\"][@n=\"stoa0040.stoa033a\"]", ns)
write_work(
    "Answer to Letters of Petilian.txt", "augustine", "Answer to Letters of Petilian", "CPL-333",
    "CSEL 51 (M. Petschenig, 1909) / Corpus Scriptorum Ecclesiasticorum Latinorum",
    "Critical edition of Contra Litteras Petiliani Libri Tres from CSEL 51.",
    extract_blocks(w51)
)

t_csel44 = ET.parse("scratch/csel44.xml")
ed44 = t_csel44.find(".//tei:div[@type=\"edition\"]", ns)
write_work(
    "Letters.txt", "augustine", "Letters", "CPL-262",
    "CSEL 44 (Al. Goldbacher, 1904) / Corpus Scriptorum Ecclesiasticorum Latinorum",
    "Critical edition of S. Aureli Augustini Epistulae from CSEL 44.",
    extract_blocks(ed44)
)

print("All 41 Augustine works extracted successfully!")
