#!/usr/bin/env python3
"""
Extract Latin texts for St. Ambrose of Milan from PL 16:
1. On the Duties of the Clergy (CPL-144) - De officiis ministrorum
2. Concerning Virgins (CPL-145) - De virginibus ad Marcellinam sororem libri III
3. Concerning Widows (CPL-146) - De viduis liber unus
4. Concerning the Sacraments (CPL-154) - De sacramentis libri VI
5. Concerning Repentance (CPL-156) - De poenitentia libri II
6. Exposition of the Christian Faith (CPL-150) - De fide ad Gratianum Augustum libri V
7. On the Holy Spirit (CPL-151) - De Spiritu Sancto libri III
8. On the Decease of His Brother Satyrus (CPL-157) - De excessu fratris sui Satyri libri II
9. On the Death of Theodosius (CPL-159) - De obitu Theodosii oratio
"""
import os
import re
import xml.etree.ElementTree as ET

OUT_DIR = "Fathers/Latin/Ambrose_Latin"
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
            for descendant in child.iter():
                if descendant is not child:
                    seen.add(descendant)
            t = clean_node(child)
            if t:
                blocks.append(t)
    return "\n\n".join(blocks)

print("Parsing scratch/pl16.xml for Ambrose...")
tree16 = ET.parse("scratch/pl16.xml")
ns = {"tei": "http://www.tei-c.org/ns/1.0"}
edition = tree16.find(".//tei:div[@type=\"edition\"]", ns)
divs = edition.findall("./tei:div", ns)

ambrose_works = [
    (0, "On the Duties of the Clergy.txt", "CPL-144", "De Officiis Ministrorum Libri Tres", "cols. 23-184"),
    (1, "Concerning Virgins.txt", "CPL-145", "De Virginibus Libri Tres", "cols. 187-232"),
    (2, "Concerning Widows.txt", "CPL-146", "De Viduis Liber Unus", "cols. 233-262"),
    (8, "Concerning the Sacraments.txt", "CPL-154", "De Sacramentis Libri Sex", "cols. 417-462"),
    (9, "Concerning Repentance.txt", "CPL-156", "De Poenitentia Libri Duo", "cols. 465-524"),
    (10, "Exposition of the Christian Faith.txt", "CPL-150", "De Fide ad Gratianum Augustum Libri Quinque", "cols. 527-698"),
    (11, "On the Holy Spirit.txt", "CPL-151", "De Spiritu Sancto Libri Tres", "cols. 703-816"),
    (21, "On the Decease of His Brother Satyrus.txt", "CPL-157", "De Excessu Fratris Sui Satyri Libri Duo", "cols. 1289-1354"),
    (23, "On the Death of Theodosius.txt", "CPL-159", "De Obitu Theodosii Oratio", "cols. 1385-1414")
]

for idx, filename, clavis, latin_title, cols in ambrose_works:
    text = extract_blocks(divs[idx])
    header = f"""# source: Patrologia Latina 16, {cols} (J.-P. Migne)
# father: ambrose
# work: {filename.replace('.txt', '')}
# clavis: {clavis}
# language: Latin
# note: Complete Latin text of {latin_title} from Patrologia Latina 16.

"""
    out_path = os.path.join(OUT_DIR, filename)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header + text + "\n")
    print(f"Wrote {out_path} ({len(text)} chars)")

print("Ambrose extraction complete!")
