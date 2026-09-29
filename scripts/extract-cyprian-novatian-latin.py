#!/usr/bin/env python3
"""
Extract Latin texts for St. Cyprian of Carthage and Novatian:
1. The Epistles of Cyprian (CPL-50) from CSEL 3.2 (W. von Hartel, 1871)
2. Treatise on Re-Baptism (CPL-59) from CSEL 3.3 (W. von Hartel, 1871)
3. On the Jewish Meats (CPL-68) from PL 3, cols. 953-964 (J.-P. Migne)
4. Treatise Against the Heretic Novatian (CPL-76) from CSEL 3.3 (W. von Hartel, 1871)
"""
import os
import re
import xml.etree.ElementTree as ET

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CYPRIAN_DIR = os.path.join(ROOT, "Fathers/Latin/Cyprian_Latin")
NOVATIAN_DIR = os.path.join(ROOT, "Fathers/Latin/Novatian_Latin")
os.makedirs(CYPRIAN_DIR, exist_ok=True)
os.makedirs(NOVATIAN_DIR, exist_ok=True)

ns = {"tei": "http://www.tei-c.org/ns/1.0"}

def clean_node(node):
    parts = []
    def recurse(n):
        if n.tag.endswith(("note", "bibl", "app")):
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

# 1. Cyprian - The Epistles of Cyprian (CSEL 3.2)
print("Extracting Cyprian - The Epistles of Cyprian...")
t03_2 = ET.parse(os.path.join(ROOT, "scratch/csel03_2.xml"))
w_ep = t03_2.find(".//tei:div[@subtype=\"work\"]", ns)
txt_ep = extract_blocks(w_ep)
header_ep = """# source: CSEL 3.2 (W. von Hartel, 1871) / Corpus Scriptorum Ecclesiasticorum Latinorum
# father: cyprian
# work: The Epistles of Cyprian
# clavis: CPL-50
# language: Latin
# note: Critical edition of S. Thasci Caecili Cypriani Epistulae from CSEL 3.2.

"""
p_ep = os.path.join(CYPRIAN_DIR, "The Epistles of Cyprian.txt")
with open(p_ep, "w", encoding="utf-8") as f:
    f.write(header_ep + txt_ep + "\n")
print(f"Wrote {p_ep} ({len(txt_ep)} chars)")

# 2. Cyprian - Treatise on Re-Baptism (CSEL 3.3)
print("Extracting Cyprian - Treatise on Re-Baptism...")
t03_3 = ET.parse(os.path.join(ROOT, "scratch/csel03_3.xml"))
w_rebap = t03_3.find(".//tei:div[@subtype=\"work\"][@n=\"stoa0104p.stoa010\"]", ns)
txt_rebap = extract_blocks(w_rebap)
header_rebap = """# source: CSEL 3.3 (W. von Hartel, 1871) / Corpus Scriptorum Ecclesiasticorum Latinorum
# father: cyprian
# work: Treatise on Re-Baptism
# clavis: CPL-59
# language: Latin
# note: Critical edition of De Rebaptismate Liber from CSEL 3.3.

"""
p_rebap = os.path.join(CYPRIAN_DIR, "Treatise on Re-Baptism.txt")
with open(p_rebap, "w", encoding="utf-8") as f:
    f.write(header_rebap + txt_rebap + "\n")
print(f"Wrote {p_rebap} ({len(txt_rebap)} chars)")

# 3. Novatian - On the Jewish Meats (PL 3)
print("Extracting Novatian - On the Jewish Meats...")
tpl3 = ET.parse(os.path.join(ROOT, "scratch/pl3.xml"))
div118 = tpl3.findall(".//tei:div[@type=\"edition\"]//tei:div", ns)[118]
txt_cibis = extract_blocks(div118)
header_cibis = """# source: Patrologia Latina 3, cols. 953-964 (J.-P. Migne)
# father: novatian
# work: On the Jewish Meats
# clavis: CPL-68
# language: Latin
# note: Complete Latin text of De Cibis Judaicis Epistola from Patrologia Latina 3.

"""
p_cibis = os.path.join(NOVATIAN_DIR, "On the Jewish Meats.txt")
with open(p_cibis, "w", encoding="utf-8") as f:
    f.write(header_cibis + txt_cibis + "\n")
print(f"Wrote {p_cibis} ({len(txt_cibis)} chars)")

# 4. Novatian - Treatise Against the Heretic Novatian (CSEL 3.3)
print("Extracting Novatian - Treatise Against the Heretic Novatian...")
w_adnov = t03_3.find(".//tei:div[@subtype=\"work\"][@n=\"stoa0104p.stoa001\"]", ns)
txt_adnov = extract_blocks(w_adnov)
header_adnov = """# source: CSEL 3.3 (W. von Hartel, 1871) / Corpus Scriptorum Ecclesiasticorum Latinorum
# father: novatian
# work: Treatise Against the Heretic Novatian
# clavis: CPL-76
# language: Latin
# note: Critical edition of Ad Novatianum from CSEL 3.3.

"""
p_adnov = os.path.join(NOVATIAN_DIR, "Treatise Against the Heretic Novatian.txt")
with open(p_adnov, "w", encoding="utf-8") as f:
    f.write(header_adnov + txt_adnov + "\n")
print(f"Wrote {p_adnov} ({len(txt_adnov)} chars)")

print("Cyprian & Novatian extraction complete!")
