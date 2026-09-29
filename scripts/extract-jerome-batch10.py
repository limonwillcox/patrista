#!/usr/bin/env python3
"""
Batch 10: Extract clean 1:1 works for St. Jerome from NPNF2-06.
Sources:
- Fathers/English/Jerome_English/Select Works (NPNF2 VI remainder).txt
- Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
"""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VOL_VI = REPO_ROOT / "Fathers" / "English" / "NPNF2" / "Volume VI.   Jerome - Letters and Select Works"
REMAINDER_SRC = REPO_ROOT / "Fathers" / "English" / "Jerome_English" / "Select Works (NPNF2 VI remainder).txt"
JEROME_DIR = REPO_ROOT / "Fathers" / "English" / "Jerome_English"

# 1. The Life of S. Hilarion (CPL-618) from Volume VI
with open(VOL_VI, "r", encoding="utf-8", errors="ignore") as f:
    vol_lines = f.readlines()

# Lines 34564 to 35593 (1-indexed) -> vol_lines[34563:35593]
hilarion_text = "".join(vol_lines[34563:35593]).strip()
hilarion_header = """# source: Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
# series: NPNF2
# volume: Volume VI
# father: jerome
# work: The Life of S. Hilarion
# clavis: CPL-618
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Vita Sancti Hilarionis.

"""
hilarion_path = JEROME_DIR / "The Life of S. Hilarion.txt"
with open(hilarion_path, "w", encoding="utf-8") as f:
    f.write(hilarion_header + hilarion_text + "\n")
print(f"Wrote {hilarion_path} ({len(hilarion_text.splitlines())} text lines)")

# Read Remainder file for other treatises
with open(REMAINDER_SRC, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from remainder file.")

# 2. Dialogue Against the Luciferians (CPL-608)
# Lines 9 to 1637 (1-indexed) -> lines[8:1637]
lucifer_text = "".join(lines[8:1637]).strip()
lucifer_header = """# source: Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
# series: NPNF2
# volume: Volume VI
# father: jerome
# work: The Dialogue Against the Luciferians
# clavis: CPL-608
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Altercatio Luciferiani et Orthodoxi.

"""
lucifer_path = JEROME_DIR / "The Dialogue Against the Luciferians.txt"
with open(lucifer_path, "w", encoding="utf-8") as f:
    f.write(lucifer_header + lucifer_text + "\n")
print(f"Wrote {lucifer_path} ({len(lucifer_text.splitlines())} text lines)")

# 3. The Perpetual Virginity of Blessed Mary (CPL-609)
# Lines 1638 to 2725 (1-indexed) -> lines[1637:2725]
helvid_text = "".join(lines[1637:2725]).strip()
helvid_header = """# source: Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
# series: NPNF2
# volume: Volume VI
# father: jerome
# work: The Perpetual Virginity of Blessed Mary
# clavis: CPL-609
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Adversus Helvidium de Mariae virginitate perpetua.

"""
helvid_path = JEROME_DIR / "The Perpetual Virginity of Blessed Mary.txt"
with open(helvid_path, "w", encoding="utf-8") as f:
    f.write(helvid_header + helvid_text + "\n")
print(f"Wrote {helvid_path} ({len(helvid_text.splitlines())} text lines)")

# 4. Against Jovinianus (CPL-610)
# Lines 2726 to 9674 (1-indexed) -> lines[2725:9674]
jovin_text = "".join(lines[2725:9674]).strip()
jovin_header = """# source: Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
# series: NPNF2
# volume: Volume VI
# father: jerome
# work: Against Jovinianus
# clavis: CPL-610
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Adversus Jovinianum (Books I-II).

"""
jovin_path = JEROME_DIR / "Against Jovinianus.txt"
with open(jovin_path, "w", encoding="utf-8") as f:
    f.write(jovin_header + jovin_text + "\n")
print(f"Wrote {jovin_path} ({len(jovin_text.splitlines())} text lines)")

# 5. Against Vigilantius (CPL-611)
# Lines 9675 to 10311 (1-indexed) -> lines[9674:10311]
vigil_text = "".join(lines[9674:10311]).strip()
vigil_header = """# source: Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
# series: NPNF2
# volume: Volume VI
# father: jerome
# work: Against Vigilantius
# clavis: CPL-611
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Contra Vigilantium.

"""
vigil_path = JEROME_DIR / "Against Vigilantius.txt"
with open(vigil_path, "w", encoding="utf-8") as f:
    f.write(vigil_header + vigil_text + "\n")
print(f"Wrote {vigil_path} ({len(vigil_text.splitlines())} text lines)")

# 6. To Pammachius Against John of Jerusalem (CPL-612)
# Lines 10312 to 12498 (1-indexed) -> lines[10311:12498]
john_jer_text = "".join(lines[10311:12498]).strip()
john_jer_header = """# source: Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
# series: NPNF2
# volume: Volume VI
# father: jerome
# work: To Pammachius Against John of Jerusalem
# clavis: CPL-612
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Contra Ioannem Hierosolymitanum.

"""
john_jer_path = JEROME_DIR / "To Pammachius Against John of Jerusalem.txt"
with open(john_jer_path, "w", encoding="utf-8") as f:
    f.write(john_jer_header + john_jer_text + "\n")
print(f"Wrote {john_jer_path} ({len(john_jer_text.splitlines())} text lines)")

# 7. Against the Pelagians (CPL-615)
# Lines 12499 to 16208 (1-indexed) -> lines[12498:16208]
pelag_text = "".join(lines[12498:16208]).strip()
pelag_header = """# source: Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
# series: NPNF2
# volume: Volume VI
# father: jerome
# work: Against the Pelagians
# clavis: CPL-615
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Dialogi contra Pelagianos (Books I-III).

"""
pelag_path = JEROME_DIR / "Against the Pelagians.txt"
with open(pelag_path, "w", encoding="utf-8") as f:
    f.write(pelag_header + pelag_text + "\n")
print(f"Wrote {pelag_path} ({len(pelag_text.splitlines())} text lines)")

# 8. Prefaces to the Books of the Vulgate (CPL-591)
# Lines 16209 to 18201 (1-indexed) -> lines[16208:18201]
pref_text = "".join(lines[16208:18201]).strip()
pref_header = """# source: Fathers/English/NPNF2/Volume VI.   Jerome - Letters and Select Works
# series: NPNF2
# volume: Volume VI
# father: jerome
# work: Prefaces to the Books of the Vulgate
# clavis: CPL-591
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Praefationes in libros Vulgatae.

"""
pref_path = JEROME_DIR / "Prefaces to the Books of the Vulgate.txt"
with open(pref_path, "w", encoding="utf-8") as f:
    f.write(pref_header + pref_text + "\n")
print(f"Wrote {pref_path} ({len(pref_text.splitlines())} text lines)")

# Delete remainder file
REMAINDER_SRC.unlink()
print(f"Deleted monolithic dump: {REMAINDER_SRC}")
print("Batch 10 extraction complete!")
