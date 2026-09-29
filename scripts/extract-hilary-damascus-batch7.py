#!/usr/bin/env python3
"""
Extract 1:1 works for Batch 7: St. Hilary of Poitiers and St. John of Damascus.
Source: Fathers/English/NPNF2/Volume IX.   Hilary of Poitiers, John of Damascus
"""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VOL_IX = REPO_ROOT / "Fathers" / "English" / "NPNF2" / "Volume IX.   Hilary of Poitiers, John of Damascus"
HILARY_DIR = REPO_ROOT / "Fathers" / "English" / "Hilary_English"
DAMASCUS_DIR = REPO_ROOT / "Fathers" / "English" / "John_Damascus_English"

HILARY_DIR.mkdir(parents=True, exist_ok=True)
DAMASCUS_DIR.mkdir(parents=True, exist_ok=True)

with open(VOL_IX, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from Volume IX.")

# Slice 1: Hilary - On the Councils (CPL-434)
# Lines 7544 to 9766 (1-indexed) -> lines[7543:9766]
councils_text = "".join(lines[7543:9766]).strip()
councils_header = """# source: Fathers/English/NPNF2/Volume IX.   Hilary of Poitiers, John of Damascus
# series: NPNF2
# volume: Volume IX
# father: hilary
# work: On the Councils
# clavis: CPL-434
# extracted: 2026-09-25
# note: Public-domain Schaff English translation of De Synodis (On the Councils, or The Faith of the Easterns).

"""
councils_path = HILARY_DIR / "On the Councils.txt"
with open(councils_path, "w", encoding="utf-8") as f:
    f.write(councils_header + councils_text + "\n")
print(f"Wrote {councils_path} ({len(councils_text.splitlines())} text lines)")

# Slice 2: Hilary - On the Trinity (CPL-433)
# Lines 9771 to 26741 (1-indexed) -> lines[9770:26741]
trinity_text = "".join(lines[9770:26741]).strip()
trinity_header = """# source: Fathers/English/NPNF2/Volume IX.   Hilary of Poitiers, John of Damascus
# series: NPNF2
# volume: Volume IX
# father: hilary
# work: On the Trinity
# clavis: CPL-433
# extracted: 2026-09-25
# note: Public-domain Schaff English translation of De Trinitate (Books I-XII).

"""
trinity_path = HILARY_DIR / "On the Trinity.txt"
with open(trinity_path, "w", encoding="utf-8") as f:
    f.write(trinity_header + trinity_text + "\n")
print(f"Wrote {trinity_path} ({len(trinity_text.splitlines())} text lines)")

# Slice 3: Hilary - Homilies on the Psalms (CPL-428)
# Lines 26747 to 27904 (1-indexed) -> lines[26746:27904]
psalms_text = "".join(lines[26746:27904]).strip()
psalms_header = """# source: Fathers/English/NPNF2/Volume IX.   Hilary of Poitiers, John of Damascus
# series: NPNF2
# volume: Volume IX
# father: hilary
# work: Homilies on the Psalms
# clavis: CPL-428
# extracted: 2026-09-25
# note: Public-domain Schaff English translation of Tractatus super Psalmos (Psalms I, LIII, CXXX).

"""
psalms_path = HILARY_DIR / "Homilies on the Psalms.txt"
with open(psalms_path, "w", encoding="utf-8") as f:
    f.write(psalms_header + psalms_text + "\n")
print(f"Wrote {psalms_path} ({len(psalms_text.splitlines())} text lines)")

# Slice 4: John of Damascus - Exposition of the Orthodox Faith (CPG-8043)
# Lines 27911 to 38869 (1-indexed) -> lines[27910:38869] (strips volume indexes and trailing CCEL URLs)
damascus_text = "".join(lines[27910:38869]).strip()
damascus_header = """# source: Fathers/English/NPNF2/Volume IX.   Hilary of Poitiers, John of Damascus
# series: NPNF2
# volume: Volume IX
# father: john_damascus
# work: Exposition of the Orthodox Faith
# clavis: CPG-8043
# extracted: 2026-09-25
# note: Public-domain Salmond/Schaff English translation of De Fide Orthodoxa (An Exact Exposition of the Orthodox Faith).

"""
damascus_path = DAMASCUS_DIR / "Exposition of the Orthodox Faith.txt"
with open(damascus_path, "w", encoding="utf-8") as f:
    f.write(damascus_header + damascus_text + "\n")
print(f"Wrote {damascus_path} ({len(damascus_text.splitlines())} text lines)")

# Remove monolithic Select Works.txt if present
select_works_path = HILARY_DIR / "Select Works.txt"
if select_works_path.exists():
    select_works_path.unlink()
    print(f"Removed monolithic dump: {select_works_path}")

print("Batch 7 extraction complete!")
