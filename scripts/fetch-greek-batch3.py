#!/usr/bin/env python3
"""
Greek Batch 3:
1. Hippolytus of Rome - The Refutation of All Heresies (CPG-1899) from scratch/hippolytus_werke.xml (P. Wendland, GCS 26, 1916)
2. Basil of Caesarea - Address to Young Men on Reading Greek Literature (CPG-2867) from PerseusDL canonical-greekLit (R. J. Deferrari, 1934)
"""
import os
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# 1. Hippolytus - The Refutation of All Heresies
print("Extracting Hippolytus - The Refutation of All Heresies...")
hip_dir = os.path.join(ROOT, "Fathers/Greek/Hippolytus_Greek")
os.makedirs(hip_dir, exist_ok=True)

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
    return text

tree_hip = ET.parse(os.path.join(ROOT, "scratch/hippolytus_werke.xml"))
ns = {"tei": "http://www.tei-c.org/ns/1.0"}
body_hip = tree_hip.find(".//tei:body", ns)
books_hip = body_hip.findall(".//tei:div[@subtype=\"book\"]", ns)

hip_blocks = []
for b in books_hip:
    n = b.attrib.get("n")
    if n == "MSS":
        continue
    head = b.find(".//tei:head", ns)
    ht = "".join(head.itertext()).strip() if head is not None else f"Book {n}"
    hip_blocks.append(f"=== {ht} ===")
    
    # Process chapters or sections
    chapters = b.findall(".//tei:div[@subtype=\"chapter\"]", ns) or [b]
    for ch in chapters:
        c_num = ch.attrib.get("n", "")
        ch_text = clean_node(ch)
        if ch_text:
            prefix = f"[{c_num}]\n" if c_num and c_num != "summary" else ""
            hip_blocks.append(f"{prefix}{ch_text}")

hip_text = "\n\n".join(hip_blocks)
hip_header = """# source: GCS 26 (P. Wendland, 1916) / Die Griechischen Christlichen Schriftsteller
# father: Hippolytus
# work: The Refutation of All Heresies
# clavis: CPG-1899
# language: grc
# note: Complete surviving Greek text of Refutatio Omnium Haeresium (Philosophoumena, Books I, IV-X).

"""

hip_path = os.path.join(hip_dir, "The Refutation of All Heresies.txt")
with open(hip_path, "w", encoding="utf-8") as f:
    f.write(hip_header + hip_text + "\n")
print(f"Wrote {hip_path} ({len(hip_text)} chars)")


# 2. Basil of Caesarea - Address to Young Men on Reading Greek Literature
print("Fetching Basil - Address to Young Men on Reading Greek Literature...")
basil_dir = os.path.join(ROOT, "Fathers/Greek/Basil_Greek")
os.makedirs(basil_dir, exist_ok=True)

url_basil = "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg2040/tlg002/tlg2040.tlg002.perseus-grc2.xml"
res_basil = subprocess.run(["curl", "-sL", url_basil], capture_output=True, text=True)
root_basil = ET.fromstring(res_basil.stdout)
body_basil = root_basil.find(".//tei:body", ns)

basil_blocks = []
chapters_basil = body_basil.findall(".//tei:div[@subtype=\"chapter\"]", ns) or [body_basil]
for ch in chapters_basil:
    c_num = ch.attrib.get("n", "")
    ch_text = clean_node(ch)
    if ch_text:
        prefix = f"[{c_num}]\n" if c_num else ""
        basil_blocks.append(f"{prefix}{ch_text}")

basil_text = "\n\n".join(basil_blocks)
basil_header = """# source: PerseusDL / canonical-greekLit (R. J. Deferrari, 1934)
# father: Basil of Caesarea
# work: Address to Young Men on Reading Greek Literature
# clavis: CPG-2867
# language: grc
# note: Complete Greek text of De legendis gentilium libris (Oratio ad adolescentes).

"""

basil_path = os.path.join(basil_dir, "Address to Young Men on Reading Greek Literature.txt")
with open(basil_path, "w", encoding="utf-8") as f:
    f.write(basil_header + basil_text + "\n")
print(f"Wrote {basil_path} ({len(basil_text)} chars)")

print("Greek Batch 3 extraction complete!")
