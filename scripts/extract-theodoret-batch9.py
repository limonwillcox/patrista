#!/usr/bin/env python3
"""
Batch 9: Extract clean 1:1 works from NPNF2-03.
Source: Fathers/English/Theodoret_English/Ecclesiastical History and Dialogues.txt
"""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
THEODORET_SRC = REPO_ROOT / "Fathers" / "English" / "Theodoret_English" / "Ecclesiastical History and Dialogues.txt"
THEODORET_DIR = REPO_ROOT / "Fathers" / "English" / "Theodoret_English"
JEROME_DIR = REPO_ROOT / "Fathers" / "English" / "Jerome_English"
RUFINUS_DIR = REPO_ROOT / "Fathers" / "English" / "Rufinus_English"
GENNADIUS_DIR = REPO_ROOT / "Fathers" / "English" / "Gennadius_English"

for d in [THEODORET_DIR, JEROME_DIR, RUFINUS_DIR, GENNADIUS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

with open(THEODORET_SRC, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from {THEODORET_SRC.name}")

# 1. Theodoret: Ecclesiastical History (CPG-6222)
# Lines 3675 to 16546 (1-indexed) -> lines[3674:16546]
eh_text = "".join(lines[3674:16546]).strip()
eh_header = """# source: Fathers/English/NPNF2/Volume III.   Theodoret, Jerome and Gennadius, Rufinus and Jerome
# series: NPNF2
# volume: Volume III
# father: theodoret
# work: Ecclesiastical History
# clavis: CPG-6222
# extracted: 2026-09-25
# note: Public-domain Blomfield Jackson / Schaff English translation of Historia Ecclesiastica (Books I-V).

"""
eh_path = THEODORET_DIR / "Ecclesiastical History.txt"
with open(eh_path, "w", encoding="utf-8") as f:
    f.write(eh_header + eh_text + "\n")
print(f"Wrote {eh_path} ({len(eh_text.splitlines())} text lines)")

# 2. Theodoret: Dialogues (Eranistes) (CPG-6217)
# Lines 16552 to 26598 (1-indexed) -> lines[16551:26598]
eranistes_text = "".join(lines[16551:26598]).strip()
eranistes_header = """# source: Fathers/English/NPNF2/Volume III.   Theodoret, Jerome and Gennadius, Rufinus and Jerome
# series: NPNF2
# volume: Volume III
# father: theodoret
# work: Dialogues (Eranistes)
# clavis: CPG-6217
# extracted: 2026-09-25
# note: Public-domain Blomfield Jackson / Schaff English translation of Eranistes seu Polymorphus (Dialogues I-III).

"""
eranistes_path = THEODORET_DIR / "Dialogues (Eranistes).txt"
with open(eranistes_path, "w", encoding="utf-8") as f:
    f.write(eranistes_header + eranistes_text + "\n")
print(f"Wrote {eranistes_path} ({len(eranistes_text.splitlines())} text lines)")

# 3. Theodoret: Letters (CPG-6240)
# Lines 26604 to 36433 (1-indexed) -> lines[26603:36433]
letters_text = "".join(lines[26603:36433]).strip()
letters_header = """# source: Fathers/English/NPNF2/Volume III.   Theodoret, Jerome and Gennadius, Rufinus and Jerome
# series: NPNF2
# volume: Volume III
# father: theodoret
# work: Letters
# clavis: CPG-6240
# extracted: 2026-09-25
# note: Public-domain Blomfield Jackson / Schaff English translation of Epistulae (Letters I-CXLVII).

"""
letters_path = THEODORET_DIR / "Letters.txt"
with open(letters_path, "w", encoding="utf-8") as f:
    f.write(letters_header + letters_text + "\n")
print(f"Wrote {letters_path} ({len(letters_text.splitlines())} text lines)")

# 4. Jerome: Lives of Illustrious Men (CPL-616)
# Lines 36756 to 39786 (1-indexed) -> lines[36755:39786]
jerome_lives_text = "".join(lines[36755:39786]).strip()
jerome_lives_header = """# source: Fathers/English/NPNF2/Volume III.   Theodoret, Jerome and Gennadius, Rufinus and Jerome
# series: NPNF2
# volume: Volume III
# father: jerome
# work: Lives of Illustrious Men
# clavis: CPL-616
# extracted: 2026-09-25
# note: Public-domain Ernest Cushing Richardson / Schaff English translation of De viris illustribus (Chapters 1-135).

"""
jerome_lives_path = JEROME_DIR / "Lives of Illustrious Men.txt"
with open(jerome_lives_path, "w", encoding="utf-8") as f:
    f.write(jerome_lives_header + jerome_lives_text + "\n")
print(f"Wrote {jerome_lives_path} ({len(jerome_lives_text.splitlines())} text lines)")

# 5. Gennadius: Lives of Illustrious Men (CPL-957)
# Lines 39791 to 41931 (1-indexed) -> lines[39790:41931]
gennadius_lives_text = "".join(lines[39790:41931]).strip()
gennadius_lives_header = """# source: Fathers/English/NPNF2/Volume III.   Theodoret, Jerome and Gennadius, Rufinus and Jerome
# series: NPNF2
# volume: Volume III
# father: gennadius
# work: Lives of Illustrious Men
# clavis: CPL-957
# extracted: 2026-09-25
# note: Public-domain Ernest Cushing Richardson / Schaff English translation of De viris illustribus (Chapters 1-100).

"""
gennadius_lives_path = GENNADIUS_DIR / "Lives of Illustrious Men.txt"
with open(gennadius_lives_path, "w", encoding="utf-8") as f:
    f.write(gennadius_lives_header + gennadius_lives_text + "\n")
print(f"Wrote {gennadius_lives_path} ({len(gennadius_lives_text.splitlines())} text lines)")

# 6. Rufinus: Apology in Defence of Himself (CPL-196 / CPL-198)
# Lines 43770 to 48617 (1-indexed) -> lines[43769:48617]
rufinus_apol_text = "".join(lines[43769:48617]).strip()
rufinus_apol_header = """# source: Fathers/English/NPNF2/Volume III.   Theodoret, Jerome and Gennadius, Rufinus and Jerome
# series: NPNF2
# volume: Volume III
# father: rufinus
# work: Apology in Defence of Himself
# clavis: CPL-196
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Apologia in defensione sui (Books I-II and Letter to Anastasius).

"""
rufinus_apol_path = RUFINUS_DIR / "Apology in Defence of Himself.txt"
with open(rufinus_apol_path, "w", encoding="utf-8") as f:
    f.write(rufinus_apol_header + rufinus_apol_text + "\n")
print(f"Wrote {rufinus_apol_path} ({len(rufinus_apol_text.splitlines())} text lines)")

# 7. Jerome: Apology Against Rufinus (CPL-613)
# Lines 48624 to 54102 (1-indexed) -> lines[48623:54102]
jerome_apol_text = "".join(lines[48623:54102]).strip()
jerome_apol_header = """# source: Fathers/English/NPNF2/Volume III.   Theodoret, Jerome and Gennadius, Rufinus and Jerome
# series: NPNF2
# volume: Volume III
# father: jerome
# work: Apology Against Rufinus
# clavis: CPL-613
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Apologia adversus libros Rufini (Books I-III).

"""
jerome_apol_path = JEROME_DIR / "Apology Against Rufinus.txt"
with open(jerome_apol_path, "w", encoding="utf-8") as f:
    f.write(jerome_apol_header + jerome_apol_text + "\n")
print(f"Wrote {jerome_apol_path} ({len(jerome_apol_text.splitlines())} text lines)")

# 8. Rufinus: Commentary on the Apostles' Creed (CPL-198 / CPL-196)
# Lines 54108 to 56231 (1-indexed) -> lines[54107:56231]
rufinus_creed_text = "".join(lines[54107:56231]).strip()
rufinus_creed_header = """# source: Fathers/English/NPNF2/Volume III.   Theodoret, Jerome and Gennadius, Rufinus and Jerome
# series: NPNF2
# volume: Volume III
# father: rufinus
# work: Commentary on the Apostles' Creed
# clavis: CPL-198
# extracted: 2026-09-25
# note: Public-domain Fremantle / Schaff English translation of Expositio Symboli Apostolorum.

"""
rufinus_creed_path = RUFINUS_DIR / "Commentary on the Apostles' Creed.txt"
with open(rufinus_creed_path, "w", encoding="utf-8") as f:
    f.write(rufinus_creed_header + rufinus_creed_text + "\n")
print(f"Wrote {rufinus_creed_path} ({len(rufinus_creed_text.splitlines())} text lines)")

# Delete the monolithic dump
THEODORET_SRC.unlink()
print(f"Deleted monolithic dump: {THEODORET_SRC}")
print("Batch 9 extraction complete!")
