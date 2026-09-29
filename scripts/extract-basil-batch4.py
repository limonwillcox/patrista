#!/usr/bin/env python3
"""
Extract and clean St. Basil the Great public domain English treatises for Batch 4.
Sources:
  - NPNF2-08 (Schaff & Wace / Blomfield Jackson):
      CPG 2839: On the Holy Spirit.txt (De Spiritu Sancto)
      CPG 2835: Homilies on the Hexaemeron.txt (Homiliae in hexaemeron, 9 homilies)
      CPG 2900: Letters.txt (Epistulae, complete collection 1-366)
      CPG 3196: Letter to His Brother Peter on the Difference Between Ousia and Hypostasis.txt (Letter 38)
      CPG 3416: Letter to the Italians and Gauls.txt (Letter 92)
      CPG 2914: Against Those Who Calumniate Us as Saying Three Gods.txt (Letter 189)
      CPG 2901: Canonical Letters to Amphilochius.txt (Letters 188, 199, 217)
      BHG 260b: Letters Between Emperor Julian and Basil.txt (Letter 360)
      [Optimus]: Letter to Bishop Optimus.txt (Letter 260)
  - Frederick Morgan Padelford (Henry Holt & Co., 1902; Yale Studies in English XV):
      CPG 2867: Address to Young Men on Reading Greek Literature.txt (De legendis gentilium libris)
"""

import os
import re
import ssl
import urllib.request

DEST_DIR = "Fathers/English/Basil_English"
NPNF2_08_SRC = "Fathers/English/NPNF2/Volume VIII.   Basil - Letters and Select Works"

os.makedirs(DEST_DIR, exist_ok=True)

# 1. Read NPNF2-08
print(f"Reading {NPNF2_08_SRC}...")
with open(NPNF2_08_SRC, "r", encoding="utf-8", errors="ignore") as f:
    npnf_lines = f.readlines()

total_lines = len(npnf_lines)
print(f"Total lines in NPNF2-08: {total_lines}")

def make_npnf_header(work_name: str, clavis: str) -> str:
    return (
        f"# source: {NPNF2_08_SRC}\n"
        f"# series: NPNF2\n"
        f"# volume: Volume VIII.\n"
        f"# father: Basil\n"
        f"# work: {work_name}\n"
        f"# clavis: {clavis}\n"
        f"# extracted: 2026-09-25\n"
        f"# note: Public-domain Schaff/Jackson English extract. Volume archives retained under ANF/NPNF1/NPNF2.\n"
    )

# Slice definitions (1-indexed inclusive)
npnf_slices = [
    {
        "filename": "On the Holy Spirit.txt",
        "work": "On the Holy Spirit",
        "clavis": "CPG-2839",
        "start": 7275,
        "end": 12962,
    },
    {
        "filename": "Homilies on the Hexaemeron.txt",
        "work": "Homilies on the Hexaemeron",
        "clavis": "CPG-2835",
        "start": 12963,
        "end": 18503,
    },
    {
        "filename": "Letters.txt",
        "work": "Letters",
        "clavis": "CPG-2900",
        "start": 18504,
        "end": 40508,
    },
    {
        "filename": "Letter to His Brother Peter on the Difference Between Ousia and Hypostasis.txt",
        "work": "Letter to His Brother Peter on the Difference Between Ousia and Hypostasis (Letter 38)",
        "clavis": "CPG-3196",
        "start": 21484,
        "end": 21910,
    },
    {
        "filename": "Letter to the Italians and Gauls.txt",
        "work": "Letter to the Italians and Gauls (Letter 92)",
        "clavis": "CPG-3416",
        "start": 25468,
        "end": 25648,
    },
    {
        "filename": "Against Those Who Calumniate Us as Saying Three Gods.txt",
        "work": "Against Those Who Calumniate Us as Saying Three Gods (Letter 189 to Eustathius)",
        "clavis": "CPG-2914",
        "start": 30623,
        "end": 30898,
    },
    {
        "filename": "Letter to Bishop Optimus.txt",
        "work": "Letter to Bishop Optimus (Letter 260)",
        "clavis": "None",
        "start": 37407,
        "end": 37712,
    },
    {
        "filename": "Letters Between Emperor Julian and Basil.txt",
        "work": "Letters Between Emperor Julian and Basil (Letter 360)",
        "clavis": "BHG-260b",
        "start": 40381,
        "end": 40417,
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

# 2. Extract Canonical Letters to Amphilochius (CPG 2901: Letters 188, 199, 217)
print("Extracting Canonical Letters to Amphilochius (CPG 2901)...")
canon_header = make_npnf_header("Canonical Letters to Amphilochius (Letters 188, 199, 217)", "CPG-2901")
canon_body = (
    "".join(npnf_lines[30027 - 1 : 30622])
    + "\n\n"
    + "".join(npnf_lines[31337 - 1 : 32170])
    + "\n\n"
    + "".join(npnf_lines[33256 - 1 : 33764])
)
canon_path = os.path.join(DEST_DIR, "Canonical Letters to Amphilochius.txt")
with open(canon_path, "w", encoding="utf-8") as out_f:
    out_f.write(canon_header + canon_body)
print(f"Wrote Canonical Letters to Amphilochius.txt: {os.path.getsize(canon_path):,} bytes")

# 3. Extract De legendis gentilium libris (CPG 2867) from Frederick Morgan Padelford (1902)
print("Fetching Address to Young Men on Reading Greek Literature (Padelford 1902)...")
ctx = ssl._create_unverified_context()
url_padelford = "https://archive.org/download/essaysonstudyuse00padeuoft/essaysonstudyuse00padeuoft_djvu.txt"
req = urllib.request.Request(url_padelford, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, context=ctx) as resp:
    raw_padelford = resp.read().decode("utf-8", errors="ignore")

p_start = raw_padelford.find("Many  considerations,  young  men,  prompt  me")
p_end = raw_padelford.find("APPENDIX", p_start)
essay_raw = raw_padelford[p_start:p_end]

clean_essay_lines = []
for l in essay_raw.splitlines():
    s = l.strip()
    if re.search(r"^\d{1,3}\s+The\s+Address\s+to\s+Young\s+Men", s, re.IGNORECASE):
        continue
    if re.search(r"^The\s+Address\s+to\s+Young\s+Men\s+\d{1,3}$", s, re.IGNORECASE):
        continue
    if re.search(r"^\d{1,3}\s+Essays\s+on\s+Poetry", s, re.IGNORECASE):
        continue
    if re.search(r"^Essays\s+on\s+Poetry\s+\d{1,3}$", s, re.IGNORECASE):
        continue
    if re.match(r"^\d{1,3}$", s):
        continue
    clean_essay_lines.append(re.sub(r"  +", " ", l))

padelford_header = (
    "# source: Essays on the Study and Use of Poetry by Plutarch and Basil the Great, translated by Frederick Morgan Padelford (New York: Henry Holt and Company, 1902; Yale Studies in English XV)\n"
    "# series: Yale Studies in English\n"
    "# volume: Volume XV\n"
    "# father: Basil\n"
    "# work: Address to Young Men on Reading Greek Literature (De legendis gentilium libris)\n"
    "# clavis: CPG-2867\n"
    "# extracted: 2026-09-25\n"
    "# note: Public-domain 1902 Yale Studies English translation.\n"
)
essay_path = os.path.join(DEST_DIR, "Address to Young Men on Reading Greek Literature.txt")
with open(essay_path, "w", encoding="utf-8") as out_f:
    out_f.write(padelford_header + "\n".join(clean_essay_lines) + "\n")
print(f"Wrote Address to Young Men on Reading Greek Literature.txt: {len(clean_essay_lines)} lines ({os.path.getsize(essay_path):,} bytes)")

print("\nBatch 4 extraction complete! Shelf contents in Fathers/English/Basil_English:")
for fname in sorted(os.listdir(DEST_DIR)):
    if fname.endswith(".txt"):
        p = os.path.join(DEST_DIR, fname)
        print(f"  {fname:70} : {os.path.getsize(p):,} bytes")
