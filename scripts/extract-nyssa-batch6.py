#!/usr/bin/env python3
"""
Extract and clean St. Gregory of Nyssa public domain English treatises for Batch 6.
Source:
  - NPNF2-05 (Philip Schaff & Henry Wace, eds.; tr. William Moore & Henry Austin Wilson, 1893):
      1. Against Eunomius (Books I-XII, CPG 3135)
      2. Answer to Eunomius' Second Book (CPG 3136)
      3. On the Holy Spirit (Against Macedonius, CPG 3142)
      4. On the Holy Trinity (To Eustathius, CPG 3137)
      5. On "Not Three Gods" (To Ablabius, CPG 3139)
      6. On the Faith (To Simplicius, CPG 3140)
      7. On Virginity (CPG 3165)
      8. On Infants' Early Deaths (To Hierius, CPG 3145)
      9. On Pilgrimages (CPG 3167.2)
      10. On the Making of Man (De opificio hominis, CPG 3154)
      11. On the Soul and the Resurrection (De anima et resurrectione, CPG 3149)
      12. The Great Catechism (Oratio catechetica magna, CPG 3150)
      13. Funeral Oration on Meletius (CPG 3180 / BHG-1243)
      14. On the Baptism of Christ (In diem luminum, CPG 3173 / BHG-1934)
      15. Letters (Epistulae I-XVIII, CPG 3167)
"""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOL5_SRC = ROOT / "Fathers" / "English" / "NPNF2" / "Volume V.   Gregory of Nyssa - Dogmatic Treatises; Select Writings and Letters"
DEST_DIR = ROOT / "Fathers" / "English" / "Gregory_Nyssa_English"

DEST_DIR.mkdir(parents=True, exist_ok=True)

print(f"Reading {VOL5_SRC}...")
with open(VOL5_SRC, "r", encoding="utf-8", errors="ignore") as f:
    vol5_lines = f.readlines()

total_lines = len(vol5_lines)
print(f"Total lines in NPNF2-05: {total_lines}")

def make_header(work_name: str, clavis: str, note: str) -> str:
    return (
        f"# source: Fathers/English/NPNF2/Volume V.   Gregory of Nyssa - Dogmatic Treatises; Select Writings and Letters\n"
        f"# series: NPNF2\n"
        f"# volume: Volume V\n"
        f"# father: gregory_nyssa\n"
        f"# work: {work_name}\n"
        f"# clavis: {clavis}\n"
        f"# extracted: 2026-09-25\n"
        f"# note: {note}\n\n"
    )

SLICES = [
    {
        "filename": "Against Eunomius.txt",
        "work": "Against Eunomius (Books I-XII)",
        "clavis": "CPG-3135",
        "note": "Public-domain Schaff/Moore/Wilson English translation of the 12 Books Against Eunomius.",
        "start": 2765,
        "end": 22218,
    },
    {
        "filename": "Answer to Eunomius' Second Book.txt",
        "work": "Answer to Eunomius' Second Book",
        "clavis": "CPG-3136",
        "note": "Public-domain Schaff/Moore/Wilson English translation (Refutatio confessionis Eunomii).",
        "start": 22219,
        "end": 27917,
    },
    {
        "filename": "On the Holy Spirit.txt",
        "work": "On the Holy Spirit (Against the Followers of Macedonius)",
        "clavis": "CPG-3142",
        "note": "Public-domain Schaff/Moore/Wilson English translation.",
        "start": 27918,
        "end": 28937,
    },
    {
        "filename": "On the Holy Trinity.txt",
        "work": "On the Holy Trinity, and of the Godhead of the Holy Spirit (To Eustathius)",
        "clavis": "CPG-3137",
        "note": "Public-domain Schaff/Moore/Wilson English translation.",
        "start": 28938,
        "end": 29314,
    },
    {
        "filename": "On Not Three Gods.txt",
        "work": "On \"Not Three Gods\" (To Ablabius)",
        "clavis": "CPG-3139",
        "note": "Public-domain Schaff/Moore/Wilson English translation.",
        "start": 29315,
        "end": 29844,
    },
    {
        "filename": "On the Faith.txt",
        "work": "On the Faith (To Simplicius)",
        "clavis": "CPG-3140",
        "note": "Public-domain Schaff/Moore/Wilson English translation.",
        "start": 29845,
        "end": 30134,
    },
    {
        "filename": "On Virginity.txt",
        "work": "On Virginity",
        "clavis": "CPG-3165",
        "note": "Public-domain Schaff/Moore/Wilson English translation (De virginitate).",
        "start": 30135,
        "end": 32848,
    },
    {
        "filename": "On Infants' Early Deaths.txt",
        "work": "On Infants' Early Deaths (To Hierius)",
        "clavis": "CPG-3145",
        "note": "Public-domain Schaff/Moore/Wilson English translation.",
        "start": 32849,
        "end": 33739,
    },
    {
        "filename": "On Pilgrimages.txt",
        "work": "On Pilgrimages (Letter II)",
        "clavis": "CPG-3167.2",
        "note": "Public-domain Schaff/Moore/Wilson English translation (Letter on Pilgrimages to Jerusalem).",
        "start": 33740,
        "end": 33910,
    },
    {
        "filename": "On the Making of Man.txt",
        "work": "On the Making of Man",
        "clavis": "CPG-3154",
        "note": "Public-domain Schaff/Moore/Wilson English translation (De opificio hominis).",
        "start": 33911,
        "end": 37890,
    },
    {
        "filename": "On the Soul and the Resurrection.txt",
        "work": "On the Soul and the Resurrection",
        "clavis": "CPG-3149",
        "note": "Public-domain Schaff/Moore/Wilson English translation (Dialogue with Macrina).",
        "start": 37891,
        "end": 42015,
    },
    {
        "filename": "The Great Catechism.txt",
        "work": "The Great Catechism",
        "clavis": "CPG-3150",
        "note": "Public-domain Schaff/Moore/Wilson English translation (Oratio catechetica magna).",
        "start": 42016,
        "end": 45710,
    },
    {
        "filename": "Funeral Oration on Meletius.txt",
        "work": "Funeral Oration on Meletius",
        "clavis": "CPG-3180, BHG-1243",
        "note": "Public-domain Schaff/Moore/Wilson English translation.",
        "start": 45711,
        "end": 46224,
    },
    {
        "filename": "On the Baptism of Christ.txt",
        "work": "On the Baptism of Christ (A Sermon for the Day of the Lights)",
        "clavis": "CPG-3173, BHG-1934",
        "note": "Public-domain Schaff/Moore/Wilson English translation.",
        "start": 46225,
        "end": 46856,
    },
    {
        "filename": "Letters.txt",
        "work": "Letters (Letters I-XVIII)",
        "clavis": "CPG-3167",
        "note": "Public-domain Schaff/Moore/Wilson English translation of the Select Letters.",
        "start": 46857,
        "end": 48920,
    },
]

for s in SLICES:
    dest_path = DEST_DIR / s["filename"]
    header = make_header(s["work"], s["clavis"], s["note"])
    chunk_lines = vol5_lines[s["start"] - 1 : s["end"]]
    
    # Strip any trailing blank lines or standalone dividers from chunk
    while chunk_lines and (not chunk_lines[-1].strip() or chunk_lines[-1].strip().startswith("_____")):
        chunk_lines.pop()
    
    body = "".join(chunk_lines)
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(header + body + "\n")
    
    written_lines = len(header.splitlines()) + len(chunk_lines) + 1
    print(f"Extracted {s['filename']}: {written_lines} lines -> {dest_path}")

# Remove the monolithic dump if present
monolithic = DEST_DIR / "Dogmatic Treatises and Select Writings.txt"
if monolithic.is_file():
    monolithic.unlink()
    print(f"Removed monolithic dump: {monolithic}")

print("Batch 6 extraction complete!")
