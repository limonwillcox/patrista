#!/usr/bin/env python3
"""
Batch 11: Extract clean 1:1 works for St. Ephraim the Syrian and Aphrahat from NPNF2-13.
Source: Fathers/English/Ephraim_English/Nisibene Hymns and Select Works.txt
"""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EPHRAIM_SRC = REPO_ROOT / "Fathers" / "English" / "Ephraim_English" / "Nisibene Hymns and Select Works.txt"
EPHRAIM_DIR = REPO_ROOT / "Fathers" / "English" / "Ephraim_English"
APHRAHAT_DIR = REPO_ROOT / "Fathers" / "English" / "Aphrahat_English"

EPHRAIM_DIR.mkdir(parents=True, exist_ok=True)
APHRAHAT_DIR.mkdir(parents=True, exist_ok=True)

with open(EPHRAIM_SRC, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from {EPHRAIM_SRC.name}")

# 1. Ephraim: The Nisibene Hymns
# Lines 12 to 3775 (1-indexed) -> lines[11:3775]
nisibene_text = "".join(lines[11:3775]).strip()
nisibene_header = """# source: Fathers/English/NPNF2/Volume XIII.   Gregory the Great II, Ephraim Syrus, Aphrahat
# series: NPNF2
# volume: Volume XIII
# father: ephraim
# work: The Nisibene Hymns
# extracted: 2026-09-25
# note: Public-domain J.T. Sarsfield Stopford / Schaff English translation of Carmina Nisibena.

"""
nisibene_path = EPHRAIM_DIR / "The Nisibene Hymns.txt"
with open(nisibene_path, "w", encoding="utf-8") as f:
    f.write(nisibene_header + nisibene_text + "\n")
print(f"Wrote {nisibene_path} ({len(nisibene_text.splitlines())} text lines)")

# 2. Ephraim: Hymns on the Nativity
# Lines 3776 to 6842 (1-indexed) -> lines[3775:6842]
nativity_text = "".join(lines[3775:6842]).strip()
nativity_header = """# source: Fathers/English/NPNF2/Volume XIII.   Gregory the Great II, Ephraim Syrus, Aphrahat
# series: NPNF2
# volume: Volume XIII
# father: ephraim
# work: Hymns on the Nativity
# extracted: 2026-09-25
# note: Public-domain J.B. Morris / Schaff English translation of Hymni de Nativitate.

"""
nativity_path = EPHRAIM_DIR / "Hymns on the Nativity.txt"
with open(nativity_path, "w", encoding="utf-8") as f:
    f.write(nativity_header + nativity_text + "\n")
print(f"Wrote {nativity_path} ({len(nativity_text.splitlines())} text lines)")

# 3. Ephraim: Hymns for the Feast of the Epiphany
# Lines 6843 to 8639 (1-indexed) -> lines[6842:8639]
epiphany_text = "".join(lines[6842:8639]).strip()
epiphany_header = """# source: Fathers/English/NPNF2/Volume XIII.   Gregory the Great II, Ephraim Syrus, Aphrahat
# series: NPNF2
# volume: Volume XIII
# father: ephraim
# work: Hymns for the Feast of the Epiphany
# extracted: 2026-09-25
# note: Public-domain A. Edward Johnston / Schaff English translation of Hymni in Festum Epiphaniae.

"""
epiphany_path = EPHRAIM_DIR / "Hymns for the Feast of the Epiphany.txt"
with open(epiphany_path, "w", encoding="utf-8") as f:
    f.write(epiphany_header + epiphany_text + "\n")
print(f"Wrote {epiphany_path} ({len(epiphany_text.splitlines())} text lines)")

# 4. Ephraim: The Pearl - Seven Hymns on the Faith
# Lines 8640 to 9301 (1-indexed) -> lines[8639:9301]
pearl_text = "".join(lines[8639:9301]).strip()
pearl_header = """# source: Fathers/English/NPNF2/Volume XIII.   Gregory the Great II, Ephraim Syrus, Aphrahat
# series: NPNF2
# volume: Volume XIII
# father: ephraim
# work: The Pearl - Seven Hymns on the Faith
# extracted: 2026-09-25
# note: Public-domain J.B. Morris / Schaff English translation of Hymni de Fide (The Pearl).

"""
pearl_path = EPHRAIM_DIR / "The Pearl - Seven Hymns on the Faith.txt"
with open(pearl_path, "w", encoding="utf-8") as f:
    f.write(pearl_header + pearl_text + "\n")
print(f"Wrote {pearl_path} ({len(pearl_text.splitlines())} text lines)")

# 5. Ephraim: Three Homilies
# Lines 9302 to 11719 (1-indexed) -> lines[9301:11719]
homilies_text = "".join(lines[9301:11719]).strip()
homilies_header = """# source: Fathers/English/NPNF2/Volume XIII.   Gregory the Great II, Ephraim Syrus, Aphrahat
# series: NPNF2
# volume: Volume XIII
# father: ephraim
# work: Three Homilies
# extracted: 2026-09-25
# note: Public-domain John Gwynn / Schaff English translation of Three Homilies (On Our Lord, On Admonition and Repentance, On the Sinful Woman).

"""
homilies_path = EPHRAIM_DIR / "Three Homilies.txt"
with open(homilies_path, "w", encoding="utf-8") as f:
    f.write(homilies_header + homilies_text + "\n")
print(f"Wrote {homilies_path} ({len(homilies_text.splitlines())} text lines)")

# 6. Aphrahat: Select Demonstrations
# Lines 11720 to 16960 (1-indexed) -> lines[11719:16960]
aphrahat_text = "".join(lines[11719:16960]).strip()
aphrahat_header = """# source: Fathers/English/NPNF2/Volume XIII.   Gregory the Great II, Ephraim Syrus, Aphrahat
# series: NPNF2
# volume: Volume XIII
# father: aphrahat
# work: Select Demonstrations
# extracted: 2026-09-25
# note: Public-domain John Gwynn / Schaff English translation of Aphrahat's Demonstrations (I, V, VI, VIII, X, XVII, XVIII, XXI, XXII).

"""
aphrahat_path = APHRAHAT_DIR / "Select Demonstrations.txt"
with open(aphrahat_path, "w", encoding="utf-8") as f:
    f.write(aphrahat_header + aphrahat_text + "\n")
print(f"Wrote {aphrahat_path} ({len(aphrahat_text.splitlines())} text lines)")

# Delete monolithic file
EPHRAIM_SRC.unlink()
print(f"Deleted monolithic dump: {EPHRAIM_SRC}")
print("Batch 11 extraction complete!")
