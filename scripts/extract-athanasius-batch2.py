#!/usr/bin/env python3
"""Extract Batch 2 St. Athanasius dogmatic treatises and letters from NPNF2-04.

Splits each treatise into a clean 1:1 public domain text file under
Fathers/English/Athanasius_English/ with standard Piblia patristic header metadata.
"""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOL4_PATH = ROOT / "Fathers" / "English" / "NPNF2" / "Volume IV.   Athanasius - Select Writings and Letters"
OUT_DIR = ROOT / "Fathers" / "English" / "Athanasius_English"


def clean_lines(slice_lines: list[str]) -> list[str]:
    start = 0
    while start < len(slice_lines) and (
        not slice_lines[start].strip()
        or slice_lines[start].strip().startswith("___")
    ):
        start += 1
    end = len(slice_lines)
    while end > start and (
        not slice_lines[end - 1].strip()
        or slice_lines[end - 1].strip().startswith("___")
    ):
        end -= 1
    return slice_lines[start:end]


TREATISES = [
    {
        "filename": "On the Incarnation of the Word.txt",
        "work": "On the Incarnation of the Word",
        "latin": "Oratio de Incarnatione Verbi",
        "clavis": "CPG-2091",
        "start": 12186,
        "end": 15075,
    },
    {
        "filename": "Deposition of Arius.txt",
        "work": "Deposition of Arius",
        "latin": "Depositio Arii",
        "clavis": "CPG-2042",
        "start": 15076,
        "end": 15653,
    },
    {
        "filename": "Letter of Eusebius on the Council of Nicaea.txt",
        "work": "Letter of Eusebius on the Council of Nicaea",
        "latin": "Epistula Eusebii Caesariensis",
        "clavis": "CPG-3502",
        "start": 15654,
        "end": 16451,
    },
    {
        "filename": "Statement of Faith.txt",
        "work": "Statement of Faith",
        "latin": "Expositio Fidei",
        "clavis": "CPG-2810",
        "start": 16452,
        "end": 16679,
    },
    {
        "filename": "On Luke X. 22.txt",
        "work": "On Luke X. 22 (In Illud: Omnia Mihi Tradita Sunt)",
        "latin": "In illud: Omnia mihi tradita sunt",
        "clavis": "CPG-2099",
        "start": 16680,
        "end": 17012,
    },
    {
        "filename": "Circular Letter to Bishops.txt",
        "work": "Encyclical Letter to Bishops Throughout the World",
        "latin": "Epistula encyclica",
        "clavis": "CPG-2124",
        "start": 17013,
        "end": 17541,
    },
    {
        "filename": "Defense Against the Arians.txt",
        "work": "Defense Against the Arians (Apologia Contra Arianos)",
        "latin": "Apologia contra Arianos",
        "clavis": "CPG-2123",
        "start": 17542,
        "end": 22456,
    },
    {
        "filename": "Defense of the Nicene Definition.txt",
        "work": "Defense of the Nicene Definition (De Decretis)",
        "latin": "De decretis Nicaenae synodi",
        "clavis": "CPG-2120",
        "start": 22457,
        "end": 25206,
    },
    {
        "filename": "On the Opinion of Dionysius.txt",
        "work": "On the Opinion of Dionysius (De Sententia Dionysii)",
        "latin": "De sententia Dionysii",
        "clavis": "CPG-2121",
        "start": 25207,
        "end": 26838,
    },
    {
        "filename": "Life of Antony.txt",
        "work": "Life of Antony",
        "latin": "Vita S. Antonii",
        "clavis": "CPG-2101",
        "start": 26839,
        "end": 29508,
    },
    {
        "filename": "To the Bishops of Egypt and Libya.txt",
        "work": "To the Bishops of Egypt and Libya",
        "latin": "Epistula ad episcopos Aegypti et Libyae",
        "clavis": "CPG-2092",
        "start": 29509,
        "end": 30807,
    },
    {
        "filename": "Defense Before Constantius.txt",
        "work": "Defense Before Constantius (Apologia ad Constantium)",
        "latin": "Apologia ad Constantium",
        "clavis": "CPG-2129",
        "start": 30808,
        "end": 32437,
    },
    {
        "filename": "Defense of His Flight.txt",
        "work": "Defense of His Flight (Apologia de Fuga)",
        "latin": "Apologia de fuga sua",
        "clavis": "CPG-2122",
        "start": 32438,
        "end": 33629,
    },
    {
        "filename": "History of the Arians.txt",
        "work": "History of the Arians (Historia Arianorum)",
        "latin": "Historia Arianorum",
        "clavis": "CPG-2127",
        "start": 33630,
        "end": 37258,
    },
    {
        "filename": "Discourses Against the Arians.txt",
        "work": "Four Discourses Against the Arians",
        "latin": "Orationes contra Arianos III",
        "clavis": "CPG-2093",
        "start": 37259,
        "end": 51465,
    },
    {
        "filename": "Fourth Discourse Against the Arians.txt",
        "work": "Fourth Discourse Against the Arians",
        "latin": "Oratio IV contra Arianos",
        "clavis": "CPG-2230",
        "start": 51466,
        "end": 52963,
    },
    {
        "filename": "On the Councils of Ariminum and Seleucia.txt",
        "work": "On the Councils of Ariminum and Seleucia (De Synodis)",
        "latin": "De synodis Arimini et Seleuciae",
        "clavis": "CPG-2128",
        "start": 52964,
        "end": 56656,
    },
    {
        "filename": "Tome to the People of Antioch.txt",
        "work": "Tome or Synodal Letter to the People of Antioch",
        "latin": "Tomus ad Antiochenos",
        "clavis": "CPG-2134",
        "start": 56657,
        "end": 57325,
    },
    {
        "filename": "To the Bishops of Africa.txt",
        "work": "To the Bishops of Africa (Ad Afros Epistola Synodica)",
        "latin": "Epistula ad Afros",
        "clavis": "CPG-2133",
        "start": 57326,
        "end": 57942,
    },
    {
        "filename": "Historia Acephala.txt",
        "work": "Historia Acephala",
        "latin": "Historia acephala",
        "clavis": "CPG-2119",
        "start": 57943,
        "end": 58723,
    },
    {
        "filename": "Festal Letters and Index.txt",
        "work": "Festal Letters and Index",
        "latin": "Epistulae festales",
        "clavis": "CPG-2102",
        "start": 58724,
        "end": 65783,
    },
    {
        "filename": "Letters.txt",
        "work": "Personal Letters",
        "latin": "Epistulae",
        "clavis": "CPG-2105",
        "start": 65784,
        "end": 68661,
    },
    {
        "filename": "Letter to Amun.txt",
        "work": "Letter to Amun",
        "latin": "Epistula ad Amun",
        "clavis": "CPG-2106",
        "start": 66033,
        "end": 66178,
    },
    {
        "filename": "Letter to Dracontius.txt",
        "work": "Letter to Dracontius",
        "latin": "Epistula ad Dracontium",
        "clavis": "CPG-2132",
        "start": 66179,
        "end": 66500,
    },
    {
        "filename": "Letters to Lucifer.txt",
        "work": "Letters to Lucifer",
        "latin": "Epistulae II ad Luciferum",
        "clavis": "CPG-2232",
        "start": 66501,
        "end": 66695,
    },
    {
        "filename": "First Letter to Monks.txt",
        "work": "First Letter to Monks",
        "latin": "Epistula ad monachos",
        "clavis": "CPG-2108",
        "start": 66696,
        "end": 66823,
    },
    {
        "filename": "Second Letter to Monks.txt",
        "work": "Second Letter to Monks",
        "latin": "Epistula ad monachos",
        "clavis": "CPG-2126",
        "start": 66824,
        "end": 66896,
    },
    {
        "filename": "Letter to Serapion on the Death of Arius.txt",
        "work": "Letter to Serapion on the Death of Arius",
        "latin": "Epistula ad Serapionem de morte Arii",
        "clavis": "CPG-2125",
        "start": 66897,
        "end": 67053,
    },
    {
        "filename": "Letter to Rufinianus.txt",
        "work": "Letter to Rufinianus",
        "latin": "Epistula ad Rufinianum",
        "clavis": "CPG-2107",
        "start": 67054,
        "end": 67152,
    },
    {
        "filename": "Letter to the Emperor Jovian.txt",
        "work": "Letter to the Emperor Jovian",
        "latin": "Epistula ad Iouianum",
        "clavis": "CPG-2135",
        "start": 67153,
        "end": 67405,
    },
    {
        "filename": "First Letter to Orsisius.txt",
        "work": "First Letter to Orsisius",
        "latin": "Epistula I ad Orsi(e)sium",
        "clavis": "CPG-2103",
        "start": 67406,
        "end": 67435,
    },
    {
        "filename": "Second Letter to Orsisius.txt",
        "work": "Second Letter to Orsisius",
        "latin": "Epistula II ad Orsi(e)sium",
        "clavis": "CPG-2104",
        "start": 67436,
        "end": 67513,
    },
    {
        "filename": "Letter to Epictetus.txt",
        "work": "Letter to Epictetus",
        "latin": "Epistula ad Epictetum",
        "clavis": "CPG-2095",
        "start": 67514,
        "end": 67980,
    },
    {
        "filename": "Letter to Adelphius.txt",
        "work": "Letter to Adelphius",
        "latin": "Epistula ad Adelphium",
        "clavis": "CPG-2098",
        "start": 67981,
        "end": 68316,
    },
    {
        "filename": "Letter to Maximus.txt",
        "work": "Letter to Maximus",
        "latin": "Epistula ad Maximum",
        "clavis": "CPG-2100",
        "start": 68317,
        "end": 68487,
    },
    {
        "filename": "Letter to John and Antiochus.txt",
        "work": "Letter to John and Antiochus",
        "latin": "Epistula ad Iohannem et Antiochum",
        "clavis": "CPG-2130",
        "start": 68488,
        "end": 68530,
    },
    {
        "filename": "Letter to Palladius.txt",
        "work": "Letter to Palladius",
        "latin": "Epistula ad Palladium",
        "clavis": "CPG-2131",
        "start": 68531,
        "end": 68581,
    },
    {
        "filename": "Letter to Diodorus.txt",
        "work": "Letter to Diodorus",
        "latin": "Epistula ad Diodorum",
        "clavis": "CPG-2164",
        "start": 68582,
        "end": 68624,
    },
]


def main() -> None:
    with open(VOL4_PATH, "r", encoding="utf-8", errors="ignore") as f:
        v4_lines = f.readlines()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for t in TREATISES:
        s = t["start"]
        e = t["end"]
        cleaned = clean_lines(v4_lines[s : e + 1])
        out_path = OUT_DIR / t["filename"]

        work_val = t["work"]
        lat_val = t["latin"]
        clavis_val = t["clavis"]

        header = [
            "# source: Fathers/English/NPNF2/Volume IV.   Athanasius - Select Writings and Letters\n",
            "# series: NPNF2\n",
            "# volume: Volume IV.\n",
            "# father: athanasius\n",
            f"# work: {work_val}\n",
            f"# latin_match_candidate: {lat_val}\n",
            f"# clavis: {clavis_val}\n",
            "# extracted: 2026-09-24\n",
            "# note: Public-domain Schaff/Robertson English extract. Volume archives retained under ANF/NPNF1/NPNF2.\n",
        ]

        with open(out_path, "w", encoding="utf-8") as f:
            f.writelines(header)
            f.writelines(cleaned)

        file_size = out_path.stat().st_size
        print(f"Extracted {t['filename']} ({len(cleaned) + len(header)} lines, {file_size:,} bytes)")


if __name__ == "__main__":
    main()
