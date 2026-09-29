#!/usr/bin/env python3
"""Extract Batch 1 St. Augustine moral and anti-Pelagian treatises from NPNF1-03 and NPNF1-05.

Splits each treatise into a clean 1:1 public domain text file under
Fathers/English/Augustine_English/ with standard Piblia patristic header metadata.
"""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOL3_PATH = ROOT / "Fathers" / "English" / "NPNF1" / "Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises"
VOL5_PATH = ROOT / "Fathers" / "English" / "NPNF1" / "Volume V.   Anti-Pelagian Writings"
OUT_DIR = ROOT / "Fathers" / "English" / "Augustine_English"


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


def main() -> None:
    with open(VOL3_PATH, "r", encoding="utf-8", errors="ignore") as f:
        v3_lines = f.readlines()

    with open(VOL5_PATH, "r", encoding="utf-8", errors="ignore") as f:
        v5_lines = f.readlines()

    treatises = [
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On Faith and the Creed.txt",
            "work": "On Faith and the Creed",
            "latin": "De Fide et Symbolo",
            "clavis": "CPL-293",
            "lines": clean_lines(v3_lines[26169:27525]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "Concerning Faith of Things Not Seen.txt",
            "work": "Concerning Faith of Things Not Seen",
            "latin": "De Fide Rerum Quae Non Videntur",
            "clavis": "CPL-292",
            "lines": clean_lines(v3_lines[27525:28097]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On the Profit of Believing.txt",
            "work": "On the Profit of Believing",
            "latin": "De Utilitate Credendi",
            "clavis": "CPL-316",
            "lines": clean_lines(v3_lines[28097:29781]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On the Creed - A Sermon to the Catechumens.txt",
            "work": "On the Creed: A Sermon to the Catechumens",
            "latin": "Sermo de symbolo ad catechumenos",
            "clavis": "CPL-309",
            "lines": clean_lines(v3_lines[29781:30371]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On Continence.txt",
            "work": "On Continence",
            "latin": "De Continentia",
            "clavis": "CPL-298",
            "lines": clean_lines(v3_lines[30371:31780]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On the Good of Marriage.txt",
            "work": "On the Good of Marriage",
            "latin": "De Bono Coniugali",
            "clavis": "CPL-299",
            "lines": clean_lines(v3_lines[31780:33228]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "Of Holy Virginity.txt",
            "work": "Of Holy Virginity",
            "latin": "De Sancta Virginitate",
            "clavis": "CPL-300",
            "lines": clean_lines(v3_lines[33228:35328]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On the Good of Widowhood.txt",
            "work": "On the Good of Widowhood",
            "latin": "De Bono Viduitatis",
            "clavis": "CPL-301",
            "lines": clean_lines(v3_lines[35328:36550]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On Lying.txt",
            "work": "On Lying",
            "latin": "De Mendacio",
            "clavis": "CPL-303",
            "lines": clean_lines(v3_lines[36550:38338]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "To Consentius Against Lying.txt",
            "work": "Against Lying (To Consentius)",
            "latin": "Contra Mendacium",
            "clavis": "CPL-304",
            "lines": clean_lines(v3_lines[38338:40119]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "Of the Work of Monks.txt",
            "work": "Of the Work of Monks",
            "latin": "De Opere Monachorum",
            "clavis": "CPL-305",
            "lines": clean_lines(v3_lines[40119:42134]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On Patience.txt",
            "work": "On Patience",
            "latin": "De Patientia",
            "clavis": "CPL-308",
            "lines": clean_lines(v3_lines[42134:43036]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume III.   On the Holy Trinity, Doctrinal Treatises, Moral Treatises",
            "volume": "Volume III.",
            "filename": "On Care to be Had for the Dead.txt",
            "work": "On Care to be Had for the Dead",
            "latin": "De Cura Pro Mortuis Gerenda",
            "clavis": "CPL-307",
            "lines": clean_lines(v3_lines[43036:44136]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume V.   Anti-Pelagian Writings",
            "volume": "Volume V.",
            "filename": "On the Perfection of Mans Righteousness.txt",
            "work": "On the Perfection of Mans Righteousness",
            "latin": "De Perfectione Iustitiae Hominis",
            "clavis": "CPL-347",
            "lines": clean_lines(v5_lines[18738:20910]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume V.   Anti-Pelagian Writings",
            "volume": "Volume V.",
            "filename": "On the Proceedings of Pelagius.txt",
            "work": "On the Proceedings of Pelagius",
            "latin": "De Gestis Pelagii",
            "clavis": "CPL-348",
            "lines": clean_lines(v5_lines[20910:23940]),
        },
        {
            "source": "Fathers/English/NPNF1/Volume V.   Anti-Pelagian Writings",
            "volume": "Volume V.",
            "filename": "On Marriage and Concupiscence.txt",
            "work": "On Marriage and Concupiscence",
            "latin": "De Nuptiis et Concupiscentia",
            "clavis": "CPL-350",
            "lines": clean_lines(v5_lines[27829:32354]),
        },
    ]

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for t in treatises:
        out_path = OUT_DIR / t["filename"]
        source_val = t["source"]
        vol_val = t["volume"]
        work_val = t["work"]
        lat_val = t["latin"]
        clavis_val = t["clavis"]

        header = [
            f"# source: {source_val}\n",
            "# series: NPNF1\n",
            f"# volume: {vol_val}\n",
            "# father: augustine\n",
            f"# work: {work_val}\n",
            f"# latin_match_candidate: {lat_val}\n",
            f"# clavis: {clavis_val}\n",
            "# extracted: 2026-09-24\n",
            "# note: Public-domain Schaff English extract. Volume archives retained under ANF/NPNF1/NPNF2.\n",
        ]
        with open(out_path, "w", encoding="utf-8") as f:
            f.writelines(header)
            f.writelines(t["lines"])

        file_size = out_path.stat().st_size
        print(f"Extracted {t['filename']} ({len(t['lines']) + len(header)} lines, {file_size:,} bytes)")


if __name__ == "__main__":
    main()
