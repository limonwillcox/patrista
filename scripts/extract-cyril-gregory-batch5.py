#!/usr/bin/env python3
"""
Extract and clean St. Cyril of Jerusalem and St. Gregory of Nazianzus public domain English treatises for Batch 5.
Source:
  - NPNF2-07 (Philip Schaff & Henry Wace, eds.; tr. E.H. Gifford, C.G. Browne, J.E. Swallow; 1894):
      Cyril of Jerusalem:
        CPG 3585: Catechetical Lectures.txt (Procatechesis and Lectures 1-18)
        CPG 3586: Mystagogical Lectures.txt (Five Mystagogical Catecheses / Lectures 19-23)
      Gregory of Nazianzus:
        CPG 3010: Select Orations.txt (The 23 Select Orations in NPNF2-07)
        CPG 3032: Letters.txt (Select Letters: Divisions I, II, III)
        CPG 3010: The Five Theological Orations.txt (Orations 27-31)
        CPG 3010.2 / BHL-3666t: In Defence of His Flight to Pontus (Oration II).txt
        CPG 3010.21 / BHG-186: Panegyric on St. Athanasius (Oration XXI).txt
        CPG 3010.42 / BHG-730b: Farewell Oration to the 150 Bishops (Oration XLII).txt
        CPG 3010.43 / BHG-245: Funeral Oration on St. Basil (Oration XLIII).txt
        [Apollinarian]: Letters on the Apollinarian Controversy.txt (Division I: Letters 101, 102, 202)
"""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOL7_SRC = ROOT / "Fathers" / "English" / "NPNF2" / "Volume VII.   Cyril of Jerusalem, Gregory Nazianzen"
CYRIL_DIR = ROOT / "Fathers" / "English" / "Cyril_Jerusalem_English"
GREGORY_DIR = ROOT / "Fathers" / "English" / "Gregory_Nazianzen_English"

CYRIL_DIR.mkdir(parents=True, exist_ok=True)
GREGORY_DIR.mkdir(parents=True, exist_ok=True)

print(f"Reading {VOL7_SRC}...")
with open(VOL7_SRC, "r", encoding="utf-8", errors="ignore") as f:
    vol7_lines = f.readlines()

total_lines = len(vol7_lines)
print(f"Total lines in NPNF2-07: {total_lines}")

def make_header(father: str, work_name: str, clavis: str, note: str) -> str:
    return (
        f"# source: Fathers/English/NPNF2/Volume VII.   Cyril of Jerusalem, Gregory Nazianzen\n"
        f"# series: NPNF2\n"
        f"# volume: Volume VII\n"
        f"# father: {father}\n"
        f"# work: {work_name}\n"
        f"# clavis: {clavis}\n"
        f"# extracted: 2026-09-25\n"
        f"# note: {note}\n\n"
    )

SLICES = [
    # Cyril of Jerusalem
    {
        "dir": CYRIL_DIR,
        "filename": "Catechetical Lectures.txt",
        "father": "cyril_jerusalem",
        "work": "Catechetical Lectures",
        "clavis": "CPG-3585",
        "note": "Public-domain Schaff/Gifford English extract (Procatechesis and Lectures I-XVIII).",
        "start": 4883,
        "end": 20542,
    },
    {
        "dir": CYRIL_DIR,
        "filename": "Mystagogical Lectures.txt",
        "father": "cyril_jerusalem",
        "work": "Mystagogical Lectures",
        "clavis": "CPG-3586",
        "note": "Public-domain Schaff/Gifford English extract (Five Mystagogical Catecheses / Lectures XIX-XXIII).",
        "start": 20545,
        "end": 22096,
    },
    # Gregory of Nazianzus
    {
        "dir": GREGORY_DIR,
        "filename": "Select Orations.txt",
        "father": "gregory_nazianzen",
        "work": "Select Orations",
        "clavis": "CPG-3010",
        "note": "Public-domain Schaff/Browne/Swallow English extract of the 23 Select Orations.",
        "start": 23116,
        "end": 45993,
    },
    {
        "dir": GREGORY_DIR,
        "filename": "Letters.txt",
        "father": "gregory_nazianzen",
        "work": "Letters",
        "clavis": "CPG-3032",
        "note": "Public-domain Schaff/Browne/Swallow English extract of the Select Letters (Divisions I, II, III).",
        "start": 45998,
        "end": 49773,
    },
    {
        "dir": GREGORY_DIR,
        "filename": "The Five Theological Orations.txt",
        "father": "gregory_nazianzen",
        "work": "The Five Theological Orations (Orations XXVII-XXXI)",
        "clavis": "CPG-3010",
        "note": "Public-domain Schaff/Browne/Swallow English extract of the Five Theological Orations.",
        "start": 31377,
        "end": 35646,
    },
    {
        "dir": GREGORY_DIR,
        "filename": "In Defence of His Flight to Pontus (Oration II).txt",
        "father": "gregory_nazianzen",
        "work": "In Defence of His Flight to Pontus (Oration II)",
        "clavis": "CPG-3010.2, BHL-3666t",
        "note": "Public-domain Schaff/Browne/Swallow English extract (Oration II).",
        "start": 23296,
        "end": 25944,
    },
    {
        "dir": GREGORY_DIR,
        "filename": "Panegyric on St. Athanasius (Oration XXI).txt",
        "father": "gregory_nazianzen",
        "work": "Panegyric on St. Athanasius (Oration XXI)",
        "clavis": "CPG-3010.21, BHG-186",
        "note": "Public-domain Schaff/Browne/Swallow English extract (Oration XXI).",
        "start": 29862,
        "end": 31375,
    },
    {
        "dir": GREGORY_DIR,
        "filename": "Farewell Oration to the 150 Bishops (Oration XLII).txt",
        "father": "gregory_nazianzen",
        "work": "The Last Farewell in the Presence of the One Hundred and Fifty Bishops (Oration XLII)",
        "clavis": "CPG-3010.42, BHG-730b",
        "note": "Public-domain Schaff/Browne/Swallow English extract (Oration XLII).",
        "start": 41343,
        "end": 42306,
    },
    {
        "dir": GREGORY_DIR,
        "filename": "Funeral Oration on St. Basil (Oration XLIII).txt",
        "father": "gregory_nazianzen",
        "work": "Funeral Oration on the Great St. Basil (Oration XLIII)",
        "clavis": "CPG-3010.43, BHG-245",
        "note": "Public-domain Schaff/Browne/Swallow English extract (Oration XLIII).",
        "start": 42308,
        "end": 44844,
    },
    {
        "dir": GREGORY_DIR,
        "filename": "Letters on the Apollinarian Controversy.txt",
        "father": "gregory_nazianzen",
        "work": "Letters on the Apollinarian Controversy (Division I: Letters 101, 102, 202)",
        "clavis": "CPG-3032",
        "note": "Public-domain Schaff/Browne/Swallow English extract (Division I: Letters to Cledonius and Nectarius).",
        "start": 46008,
        "end": 46739,
    },
]

for s in SLICES:
    dest_path = s["dir"] / s["filename"]
    header = make_header(s["father"], s["work"], s["clavis"], s["note"])
    chunk_lines = vol7_lines[s["start"] - 1 : s["end"]]
    
    # Strip any trailing blank lines or standalone dividers from chunk
    while chunk_lines and (not chunk_lines[-1].strip() or chunk_lines[-1].strip().startswith("_____")):
        chunk_lines.pop()
    
    body = "".join(chunk_lines)
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(header + body + "\n")
    
    written_lines = len(header.splitlines()) + len(chunk_lines) + 1
    print(f"Extracted {s['filename']}: {written_lines} lines -> {dest_path}")

print("Batch 5 extraction complete!")
