#!/usr/bin/env python3
"""
Batch 12: Extract clean 1:1 treatises for St. Cyprian of Carthage from ANF-05.
Sources:
- Fathers/English/Cyprian_English/The Treatises of Cyprian.txt
- Fathers/English/Cyprian_English/The Epistles of Cyprian.txt (for Ad Donatum)
"""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CYPRIAN_DIR = REPO_ROOT / "Fathers" / "English" / "Cyprian_English"
TREATISES_SRC = CYPRIAN_DIR / "The Treatises of Cyprian.txt"
EPISTLES_SRC = CYPRIAN_DIR / "The Epistles of Cyprian.txt"

with open(TREATISES_SRC, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from {TREATISES_SRC.name}")

def write_work(filename, header, text):
    p = CYPRIAN_DIR / filename
    with open(p, "w", encoding="utf-8") as out:
        out.write(header + text.strip() + "\n")
    print(f"Wrote {p.name} ({len(text.strip().splitlines())} text lines)")

# 1. On the Unity of the Church (CPL-41)
# Lines 16 to 887 (1-indexed) -> lines[15:887]
write_work(
    "On the Unity of the Church.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On the Unity of the Church
# clavis: CPL-41
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of De catholicae ecclesiae unitate.

""",
    "".join(lines[15:887]),
)

# 2. On the Dress of Virgins (CPL-40)
# Lines 888 to 1552 (1-indexed) -> lines[887:1552]
write_work(
    "On the Dress of Virgins.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On the Dress of Virgins
# clavis: CPL-40
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of De habitu virginum.

""",
    "".join(lines[887:1552]),
)

# 3. On the Lapsed (CPL-42)
# Lines 1553 to 2616 (1-indexed) -> lines[1552:2616]
write_work(
    "On the Lapsed.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On the Lapsed
# clavis: CPL-42
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of De lapsis.

""",
    "".join(lines[1552:2616]),
)

# 4. On the Lord's Prayer (CPL-43)
# Lines 2617 to 3642 (1-indexed) -> lines[2616:3642]
write_work(
    "On the Lord's Prayer.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On the Lord's Prayer
# clavis: CPL-43
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of De dominica oratione.

""",
    "".join(lines[2616:3642]),
)

# 5. An Address to Demetrianus (CPL-46)
# Lines 3643 to 4390 (1-indexed) -> lines[3642:4390]
write_work(
    "An Address to Demetrianus.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: An Address to Demetrianus
# clavis: CPL-46
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of Ad Demetrianum.

""",
    "".join(lines[3642:4390]),
)

# 6. On the Vanity of Idols (CPL-54)
# Lines 4391 to 4726 (1-indexed) -> lines[4390:4726]
write_work(
    "On the Vanity of Idols.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On the Vanity of Idols
# clavis: CPL-54
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of Quod idola dii non sint.

""",
    "".join(lines[4390:4726]),
)

# 7. On the Mortality (CPL-44)
# Lines 4727 to 5405 (1-indexed) -> lines[4726:5405]
write_work(
    "On the Mortality.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On the Mortality
# clavis: CPL-44
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of De mortalitate.

""",
    "".join(lines[4726:5405]),
)

# 8. On Works and Alms (CPL-47)
# Lines 5406 to 6202 (1-indexed) -> lines[5405:6202]
write_work(
    "On Works and Alms.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On Works and Alms
# clavis: CPL-47
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of De opere et eleemosynis.

""",
    "".join(lines[5405:6202]),
)

# 9. On the Advantage of Patience (CPL-48)
# Lines 6203 to 6922 (1-indexed) -> lines[6202:6922]
write_work(
    "On the Advantage of Patience.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On the Advantage of Patience
# clavis: CPL-48
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of De bono patientiae.

""",
    "".join(lines[6202:6922]),
)

# 10. On Jealousy and Envy (CPL-49)
# Lines 6923 to 7463 (1-indexed) -> lines[6922:7463]
write_work(
    "On Jealousy and Envy.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: On Jealousy and Envy
# clavis: CPL-49
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of De zelo et livore.

""",
    "".join(lines[6922:7463]),
)

# 11. Exhortation to Martyrdom (CPL-45)
# Lines 7464 to 8596 (1-indexed) -> lines[7463:8596]
write_work(
    "Exhortation to Martyrdom.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: Exhortation to Martyrdom
# clavis: CPL-45
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of Ad Fortunatum (de exhortatione martyrii).

""",
    "".join(lines[7463:8596]),
)

# 12. Three Books of Testimonies Against the Jews (CPL-39)
# Lines 8597 to 15263 (1-indexed) -> lines[8596:15263]
write_work(
    "Three Books of Testimonies Against the Jews.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: Three Books of Testimonies Against the Jews
# clavis: CPL-39
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of Ad Quirinum (Testimoniorum libri iii).

""",
    "".join(lines[8596:15263]),
)

# 13. To Donatus (CPL-38) from Epistles file
with open(EPISTLES_SRC, "r", encoding="utf-8", errors="ignore") as f:
    ep_lines = f.readlines()

# Lines 13 to 482 (1-indexed) -> ep_lines[12:482]
write_work(
    "To Donatus.txt",
    """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: cyprian
# work: To Donatus
# clavis: CPL-38
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation of Ad Donatum (Epistle I in ANF).

""",
    "".join(ep_lines[12:482]),
)

# Delete monolithic Treatises file
TREATISES_SRC.unlink()
print(f"Deleted monolithic dump: {TREATISES_SRC}")
print("Batch 12 extraction complete!")
