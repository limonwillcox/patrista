#!/usr/bin/env python3
"""
Extract Latin texts for St. Jerome (Hieronymus) and Rufinus from PL 23 and PL 21:
Jerome (PL 23):
1. The Life of S. Hilarion (CPL-618)
2. The Dialogue Against the Luciferians (CPL-608)
3. The Perpetual Virginity of Blessed Mary (CPL-609)
4. Against Jovinianus (CPL-610)
5. Against Vigilantius (CPL-611)
6. Apology Against Rufinus (CPL-613)
7. Against the Pelagians (CPL-615)
8. Lives of Illustrious Men (CPL-616)

Rufinus (PL 21):
9. Apology in Defence of Himself (CPL-197) - placed in both Jerome_Latin and Rufinus_Latin
10. Commentary on the Apostles' Creed (CPL-198) - placed in Rufinus_Latin
"""
import os
import re
import xml.etree.ElementTree as ET

JEROME_DIR = "Fathers/Latin/Jerome_Latin"
RUFINUS_DIR = "Fathers/Latin/Rufinus_Latin"
os.makedirs(JEROME_DIR, exist_ok=True)
os.makedirs(RUFINUS_DIR, exist_ok=True)

def is_greek(text):
    greek_chars = len(re.findall(r"[\u0370-\u03ff\u1f00-\u1fff]", text))
    latin_chars = len(re.findall(r"[a-zA-Z]", text))
    return greek_chars > latin_chars

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

def extract_blocks(root_elem, filter_greek=False):
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
                if filter_greek and is_greek(t):
                    continue
                blocks.append(t)
    return "\n\n".join(blocks)

# ==========================================
# 1. Jerome Works from PL 23
# ==========================================
print("Parsing scratch/pl23.xml for Jerome...")
tree23 = ET.parse("scratch/pl23.xml")
ns = {"tei": "http://www.tei-c.org/ns/1.0"}
editions23 = tree23.findall(".//tei:div[@type=\"edition\"]", ns)

jerome_works = [
    (1, "The Life of S. Hilarion.txt", "CPL-618", "Vita Sancti Hilarionis", "cols. 29-54", False),
    (12, "The Dialogue Against the Luciferians.txt", "CPL-608", "Altercatio Luciferiani et Orthodoxi", "cols. 155-182", False),
    (13, "The Perpetual Virginity of Blessed Mary.txt", "CPL-609", "Adversus Helvidium de Mariae Virginitate Perpetua", "cols. 183-206", False),
    (14, "Against Jovinianus.txt", "CPL-610", "Adversus Jovinianum Libri Duo", "cols. 211-338", False),
    (15, "Against Vigilantius.txt", "CPL-611", "Contra Vigilantium Liber Unus", "cols. 339-352", False),
    (17, "Apology Against Rufinus.txt", "CPL-613", "Apologia Adversus Libros Rufini", "cols. 397-492", False),
    (19, "Against the Pelagians.txt", "CPL-615", "Dialogi Contra Pelagianos Libri Tres", "cols. 495-590", False),
    (21, "Lives of Illustrious Men.txt", "CPL-616", "De Viris Illustribus", "cols. 601-720", True),
]

for idx, filename, clavis, latin_title, cols, filter_g in jerome_works:
    text = extract_blocks(editions23[idx], filter_greek=filter_g)
    header = f"""# source: Patrologia Latina 23, {cols} (J.-P. Migne)
# father: jerome
# work: {filename.replace('.txt', '')}
# clavis: {clavis}
# language: Latin
# note: Complete Latin text of {latin_title} from Patrologia Latina 23.

"""
    out_path = os.path.join(JEROME_DIR, filename)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header + text + "\n")
    print(f"Wrote {out_path} ({len(text)} chars)")

# ==========================================
# 2. Rufinus Works from PL 21
# ==========================================
print("Parsing scratch/pl21.xml for Rufinus...")
tree21 = ET.parse("scratch/pl21.xml")
ed21 = tree21.find(".//tei:div[@type=\"edition\"]", ns)
divs21 = ed21.findall("./tei:div", ns)

# ch 10 (divs21[2]): Commentarius in Symbolum Apostolorum (CPL-198)
text_sym = extract_blocks(divs21[2])
header_sym = """# source: Patrologia Latina 21, cols. 335-386 (J.-P. Migne)
# father: rufinus
# work: Commentary on the Apostles' Creed
# clavis: CPL-198
# language: Latin
# note: Complete Latin text of Commentarius in Symbolum Apostolorum from Patrologia Latina 21.

"""
sym_path = os.path.join(RUFINUS_DIR, "Commentary on the Apostles' Creed.txt")
with open(sym_path, "w", encoding="utf-8") as f:
    f.write(header_sym + text_sym + "\n")
print(f"Wrote {sym_path} ({len(text_sym)} chars)")

# ch 20 (divs21[6]): Apologia ad Anastasium & ch 19 (divs21[5]): Apologia in Hieronymum Libri II (CPL-197)
text_ana = extract_blocks(divs21[6])
text_hiero = extract_blocks(divs21[5])
text_apology = text_ana + "\n\n" + text_hiero

header_apology_jerome = """# source: Patrologia Latina 21, cols. 541-624 (J.-P. Migne)
# father: jerome
# work: Apology in Defence of Himself
# clavis: CPL-197
# language: Latin
# note: Complete Latin text of Rufini Apologia ad Anastasium and Apologia in Hieronymum from Patrologia Latina 21.

"""
header_apology_rufinus = """# source: Patrologia Latina 21, cols. 541-624 (J.-P. Migne)
# father: rufinus
# work: Apology in Defence of Himself
# clavis: CPL-197
# language: Latin
# note: Complete Latin text of Rufini Apologia ad Anastasium and Apologia in Hieronymum from Patrologia Latina 21.

"""

apology_jerome_path = os.path.join(JEROME_DIR, "Apology in Defence of Himself.txt")
with open(apology_jerome_path, "w", encoding="utf-8") as f:
    f.write(header_apology_jerome + text_apology + "\n")
print(f"Wrote {apology_jerome_path} ({len(text_apology)} chars)")

apology_rufinus_path = os.path.join(RUFINUS_DIR, "Apology in Defence of Himself.txt")
with open(apology_rufinus_path, "w", encoding="utf-8") as f:
    f.write(header_apology_rufinus + text_apology + "\n")
print(f"Wrote {apology_rufinus_path} ({len(text_apology)} chars)")

print("Jerome & Rufinus extraction complete!")
