#!/usr/bin/env python3
"""
Batch 8: Extract clean 1:1 works for John Cassian from NPNF2-11.
Source: Fathers/English/Cassian_English/Institutes and Conferences.txt
"""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CASSIAN_SRC = REPO_ROOT / "Fathers" / "English" / "Cassian_English" / "Institutes and Conferences.txt"
CASSIAN_DIR = REPO_ROOT / "Fathers" / "English" / "Cassian_English"

with open(CASSIAN_SRC, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from {CASSIAN_SRC.name}")

# 1. The Institutes of the Coenobia (CPL-513)
# Lines 1461 to 10496 (1-indexed) -> lines[1460:10496]
institutes_text = "".join(lines[1460:10496]).strip()
institutes_header = """# source: Fathers/English/NPNF2/Volume XI.   Sulpitius Severus, Vincent of Lerins, John Cassian
# series: NPNF2
# volume: Volume XI
# father: cassian
# work: The Institutes of the Coenobia
# clavis: CPL-513
# extracted: 2026-09-25
# note: Public-domain Gibson/Schaff English translation of De institutis coenobiorum (Books I-XII).

"""
institutes_path = CASSIAN_DIR / "The Institutes of the Coenobia.txt"
with open(institutes_path, "w", encoding="utf-8") as f:
    f.write(institutes_header + institutes_text + "\n")
print(f"Wrote {institutes_path} ({len(institutes_text.splitlines())} text lines)")

# 2. The Conferences (CPL-512)
# Lines 10501 to 32918 (1-indexed) -> lines[10500:32918]
conferences_text = "".join(lines[10500:32918]).strip()
conferences_header = """# source: Fathers/English/NPNF2/Volume XI.   Sulpitius Severus, Vincent of Lerins, John Cassian
# series: NPNF2
# volume: Volume XI
# father: cassian
# work: The Conferences
# clavis: CPL-512
# extracted: 2026-09-25
# note: Public-domain Gibson/Schaff English translation of Conlationes (Conferences I-XXIV).

"""
conferences_path = CASSIAN_DIR / "The Conferences.txt"
with open(conferences_path, "w", encoding="utf-8") as f:
    f.write(conferences_header + conferences_text + "\n")
print(f"Wrote {conferences_path} ({len(conferences_text.splitlines())} text lines)")

# 3. On the Incarnation of the Lord, Against Nestorius (CPL-514)
# Lines 32923 to 39410 (1-indexed) -> lines[32922:39410]
incarnation_text = "".join(lines[32922:39410]).strip()
incarnation_header = """# source: Fathers/English/NPNF2/Volume XI.   Sulpitius Severus, Vincent of Lerins, John Cassian
# series: NPNF2
# volume: Volume XI
# father: cassian
# work: On the Incarnation of the Lord, Against Nestorius
# clavis: CPL-514
# extracted: 2026-09-25
# note: Public-domain Gibson/Schaff English translation of De incarnatione Domini contra Nestorium (Books I-VII).

"""
incarnation_path = CASSIAN_DIR / "On the Incarnation of the Lord, Against Nestorius.txt"
with open(incarnation_path, "w", encoding="utf-8") as f:
    f.write(incarnation_header + incarnation_text + "\n")
print(f"Wrote {incarnation_path} ({len(incarnation_text.splitlines())} text lines)")

# Delete the monolithic file
CASSIAN_SRC.unlink()
print(f"Deleted monolithic dump: {CASSIAN_SRC}")
print("Batch 8 extraction complete!")
