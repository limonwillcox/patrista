#!/usr/bin/env python3
"""
Extract Latin texts for St. Hilary of Poitiers:
1. Homilies on the Psalms (CPL-428) from CSEL 22 (A. Zingerle, 1891)
2. On the Trinity (CPL-433) from PL 10 (J.-P. Migne)
3. On the Councils (CPL-434) from PL 10 (J.-P. Migne)
"""
import os
import re
import xml.etree.ElementTree as ET

OUT_DIR = "Fathers/Latin/Hilary_Latin"
os.makedirs(OUT_DIR, exist_ok=True)

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
            # mark descendants so we do not duplicate nested heads/ps
            for descendant in child.iter():
                if descendant is not child:
                    seen.add(descendant)
            t = clean_node(child)
            if t:
                blocks.append(t)
    return "\n\n".join(blocks)

# 1. Homilies on the Psalms (CSEL 22)
print("Parsing scratch/csel22.xml...")
tree22 = ET.parse("scratch/csel22.xml")
ns = {"tei": "http://www.tei-c.org/ns/1.0"}
work22 = tree22.find(".//tei:div[@subtype=\"work\"]", ns)
text_psalms = extract_blocks(work22)

header_psalms = """# source: CSEL 22 (A. Zingerle, 1891) / Corpus Scriptorum Ecclesiasticorum Latinorum
# father: hilary
# work: Homilies on the Psalms
# clavis: CPL-428
# language: Latin
# note: Critical edition of Tractatus super Psalmos from CSEL 22.

"""

psalms_path = os.path.join(OUT_DIR, "Homilies on the Psalms.txt")
with open(psalms_path, "w", encoding="utf-8") as f:
    f.write(header_psalms + text_psalms + "\n")
print(f"Wrote {psalms_path} ({len(text_psalms)} chars)")

# 2. On the Trinity (PL 10 ch 1) & On the Councils (PL 10 ch 3)
print("Parsing scratch/pl10.xml...")
tree10 = ET.parse("scratch/pl10.xml")
ed10 = tree10.find(".//tei:div[@type=\"edition\"]", ns)
ch1 = ed10.find("./tei:div[@subtype=\"chapter\"][@n=\"1\"]", ns)
ch3 = ed10.find("./tei:div[@subtype=\"chapter\"][@n=\"3\"]", ns)

text_trinity = extract_blocks(ch1)
header_trinity = """# source: Patrologia Latina 10, cols. 25-472 (J.-P. Migne)
# father: hilary
# work: On the Trinity
# clavis: CPL-433
# language: Latin
# note: Complete text of De Trinitate Libri XII from Patrologia Latina 10.

"""
trinity_path = os.path.join(OUT_DIR, "On the Trinity.txt")
with open(trinity_path, "w", encoding="utf-8") as f:
    f.write(header_trinity + text_trinity + "\n")
print(f"Wrote {trinity_path} ({len(text_trinity)} chars)")

text_councils = extract_blocks(ch3)
header_councils = """# source: Patrologia Latina 10, cols. 479-546 (J.-P. Migne)
# father: hilary
# work: On the Councils
# clavis: CPL-434
# language: Latin
# note: Complete text of De Synodis seu De Fide Orientalium from Patrologia Latina 10.

"""
councils_path = os.path.join(OUT_DIR, "On the Councils.txt")
with open(councils_path, "w", encoding="utf-8") as f:
    f.write(header_councils + text_councils + "\n")
print(f"Wrote {councils_path} ({len(text_councils)} chars)")

print("Hilary extraction complete!")
