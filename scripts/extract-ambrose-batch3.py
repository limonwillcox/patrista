#!/usr/bin/env python3
"""
Extract and clean Ambrose public domain English treatises for Batch 3.
Sources:
  - NPNF2-10:
      CPL 144: On the Duties of the Clergy.txt (De officiis ministrorum, 3 books)
      CPL 145: Concerning Virgins.txt (De virginibus, 3 books)
      CPL 146: Concerning Widows.txt (De viduis)
      CPL 150: Exposition of the Christian Faith.txt (De fide ad Gratianum, 5 books)
      CPL 151: On the Holy Spirit.txt (De Spiritu Sancto, 3 books)
      CPL 155: On the Mysteries.txt (De mysteriis)
      CPL 156: Concerning Repentance.txt (De paenitentia, 2 books)
      CPL 157: On the Decease of His Brother Satyrus.txt (De excessu fratris Satyri, 2 books)
      CPL 160: Letters.txt (Epistulae)
  - SPCK 1919 (tr. T. Thompson, ed. J.H. Srawley):
      CPL 154: Concerning the Sacraments.txt (De sacramentis, 6 books)
  - CUA Patristic Studies IX, 1925 (tr. Sister Mary Dolorosa Mannix):
      CPL 159: On the Death of Theodosius.txt (De obitu Theodosii)
"""

import os
import re
import ssl
import urllib.request

DEST_DIR = "Fathers/English/Ambrose_English"
NPNF2_10_SRC = "Fathers/English/NPNF2/Volume X.   Ambrose - Select Works and Letters"

os.makedirs(DEST_DIR, exist_ok=True)

# 1. Read NPNF2-10
print(f"Reading {NPNF2_10_SRC}...")
with open(NPNF2_10_SRC, "r", encoding="utf-8", errors="ignore") as f:
    npnf_lines = f.readlines()

total_lines = len(npnf_lines)
print(f"Total lines in NPNF2-10: {total_lines}")

def make_npnf_header(work_name: str, clavis: str) -> str:
    return (
        f"# source: {NPNF2_10_SRC}\n"
        f"# series: NPNF2\n"
        f"# volume: Volume X.\n"
        f"# father: Ambrose\n"
        f"# work: {work_name}\n"
        f"# clavis: {clavis}\n"
        f"# extracted: 2026-09-24\n"
        f"# note: Public-domain Schaff English extract. Volume archives retained under ANF/NPNF1/NPNF2.\n"
    )

# Slice definitions (1-indexed inclusive)
npnf_slices = [
    {
        "filename": "On the Duties of the Clergy.txt",
        "work": "On the Duties of the Clergy",
        "clavis": "CPL-144",
        "start": 1358,
        "end": 10156,
    },
    {
        "filename": "On the Holy Spirit.txt",
        "work": "On the Holy Spirit",
        "clavis": "CPL-151",
        "start": 10157,
        "end": 17087,
    },
    {
        "filename": "On the Decease of His Brother Satyrus.txt",
        "work": "On the Decease of His Brother Satyrus",
        "clavis": "CPL-157",
        "start": 17088,
        "end": 20390,
    },
    {
        "filename": "Exposition of the Christian Faith.txt",
        "work": "Exposition of the Christian Faith",
        "clavis": "CPL-150",
        "start": 20391,
        "end": 32680,
    },
    {
        "filename": "On the Mysteries.txt",
        "work": "On the Mysteries",
        "clavis": "CPL-155",
        "start": 32681,
        "end": 33589,
    },
    {
        "filename": "Concerning Repentance.txt",
        "work": "Concerning Repentance",
        "clavis": "CPL-156",
        "start": 33590,
        "end": 36679,
    },
    {
        "filename": "Concerning Virgins.txt",
        "work": "Concerning Virgins",
        "clavis": "CPL-145",
        "start": 36680,
        "end": 39034,
    },
    {
        "filename": "Concerning Widows.txt",
        "work": "Concerning Widows",
        "clavis": "CPL-146",
        "start": 39035,
        "end": 40616,
    },
    {
        "filename": "Letters.txt",
        "work": "Letters",
        "clavis": "CPL-160",
        "start": 40617,
        "end": 46381,
    },
]

for s in npnf_slices:
    out_path = os.path.join(DEST_DIR, s["filename"])
    header = make_npnf_header(s["work"], s["clavis"])
    body = "".join(npnf_lines[s["start"] - 1 : s["end"]])
    with open(out_path, "w", encoding="utf-8") as out_f:
        out_f.write(header + body)
    size = os.path.getsize(out_path)
    line_count = s["end"] - s["start"] + 1
    print(f"Wrote {s['filename']}: {line_count} lines ({size:,} bytes)")

# 2. Extract De sacramentis (CPL 154) from Thompson & Srawley (SPCK 1919)
print("Fetching De sacramentis from Archive.org (Thompson & Srawley 1919 SPCK)...")
ctx = ssl._create_unverified_context()
url_spck = "https://archive.org/download/stambroseonmyste00ambr/stambroseonmyste00ambr_djvu.txt"
req = urllib.request.Request(url_spck, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, context=ctx) as resp:
    spck_raw = resp.read().decode("utf-8", errors="ignore")

pos_start = spck_raw.find("CONCERNING  THE    SACRAMENTS")
pos_end = spck_raw.find("INDEX", pos_start)
sacr_raw = spck_raw[pos_start:pos_end]

clean_sacr_lines = []
for l in sacr_raw.splitlines():
    s = l.strip()
    if re.search(r"^\d{1,3}\s+THE\s+TREATISE", s):
        continue
    if re.search(r"^THE\s+TREATISE(\s+ON\s+THE\s+SACRAMENTS)?\s+\d{1,3}$", s):
        continue
    if re.search(r"^ON\s+THE\s+SACRAMENTS\s+\d{1,3}$", s):
        continue
    if re.search(r"^\d{1,3}\s+ON\s+THE\s+SACRAMENTS$", s):
        continue
    if re.match(r"^\d{1,3}$", s):
        continue
    clean_sacr_lines.append(re.sub(r"  +", " ", l))

sacr_header = (
    "# source: St. Ambrose 'On the Mysteries' and the Treatise, On the Sacraments, by an Unknown Author, tr. T. Thompson, ed. J.H. Srawley (London: SPCK, 1919)\n"
    "# series: SPCK Translations of Christian Literature (Series III: Liturgical Texts)\n"
    "# father: Ambrose\n"
    "# work: Concerning the Sacraments\n"
    "# clavis: CPL-154\n"
    "# extracted: 2026-09-24\n"
    "# note: Public-domain 1919 SPCK English translation.\n"
)
sacr_path = os.path.join(DEST_DIR, "Concerning the Sacraments.txt")
with open(sacr_path, "w", encoding="utf-8") as f:
    f.write(sacr_header + "\n".join(clean_sacr_lines) + "\n")
print(f"Wrote Concerning the Sacraments.txt: {len(clean_sacr_lines)} lines ({os.path.getsize(sacr_path):,} bytes)")

# 3. Extract De obitu Theodosii (CPL 159) from Sister Mary Dolorosa Mannix (CUA 1925)
print("Fetching De obitu Theodosii from Archive.org (Sister Mary Dolorosa Mannix 1925 CUA)...")
url_mannix = "https://archive.org/download/sanctiambrosiior0000sist/sanctiambrosiior0000sist_djvu.txt"
req = urllib.request.Request(url_mannix, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, context=ctx) as resp:
    mannix_raw = resp.read().decode("utf-8", errors="ignore")

pos_start = mannix_raw.find("ON THE DEATH OF THEODOSIUS.")
pos_end = mannix_raw.find("COMMENTARY.", pos_start)
eng_mannix = mannix_raw[pos_start:pos_end]

clean_mannix_lines = []
for l in eng_mannix.splitlines():
    s = l.strip()
    if re.match(r"^ON THE DEATH OF THEODOSIUS\s+\d+$", s, re.IGNORECASE):
        continue
    if re.match(r"^\d+\s+DE OBITU THEODOSII$", s, re.IGNORECASE):
        continue
    if s.startswith("ee ee A EFAS") or s.startswith("|") or s == "." or s == "G":
        continue
    clean_mannix_lines.append(re.sub(r"  +", " ", l))

mannix_header = (
    "# source: Sancti Ambrosii Oratio de obitu Theodosii: Text, Translation, Introduction and Commentary by Sister Mary Dolorosa Mannix (Catholic University of America Patristic Studies IX, 1925)\n"
    "# series: CUA Patristic Studies\n"
    "# volume: Volume IX\n"
    "# father: Ambrose\n"
    "# work: On the Death of Theodosius\n"
    "# clavis: CPL-159\n"
    "# extracted: 2026-09-24\n"
    "# note: Public-domain 1925 CUA Patristic Studies English translation.\n"
)
theod_path = os.path.join(DEST_DIR, "On the Death of Theodosius.txt")
with open(theod_path, "w", encoding="utf-8") as f:
    f.write(mannix_header + "\n".join(clean_mannix_lines) + "\n")
print(f"Wrote On the Death of Theodosius.txt: {len(clean_mannix_lines)} lines ({os.path.getsize(theod_path):,} bytes)")

print("\nBatch 3 extraction complete! 11 treatises in Fathers/English/Ambrose_English:")
for fname in sorted(os.listdir(DEST_DIR)):
    if fname.endswith(".txt"):
        p = os.path.join(DEST_DIR, fname)
        print(f"  {fname:42} : {os.path.getsize(p):,} bytes")
