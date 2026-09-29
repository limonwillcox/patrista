#!/usr/bin/env python3
"""
Link Batch 5 St. Cyril of Jerusalem and St. Gregory of Nazianzus public domain works in data/clavis/works.jsonl.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKS_JSONL = ROOT / "data" / "clavis" / "works.jsonl"

MAPPINGS = {
    # Cyril of Jerusalem
    "700F6347743C4F79985FCC247EB1C789": {
        "translationPath": "Fathers/English/Cyril_Jerusalem_English/Catechetical Lectures.txt",
        "titleEnglish": "Catechetical Lectures",
    },
    "04B64425F4C74D5EA8591B2BE09DC275": {
        "translationPath": "Fathers/English/Cyril_Jerusalem_English/Mystagogical Lectures.txt",
        "titleEnglish": "Mystagogical Lectures",
    },
    # Gregory of Nazianzus
    "26CE94BFB2D040A4B959D1365F3622C5": {
        "translationPath": "Fathers/English/Gregory_Nazianzen_English/Select Orations.txt",
        "titleEnglish": "Select Orations",
    },
    "FD92E0441D0D4FE1BF96AC69135AA39F": {
        "translationPath": "Fathers/English/Gregory_Nazianzen_English/Letters.txt",
        "titleEnglish": "Letters",
    },
    "FEF2D27310904C7397FA7076B372444C": {
        "translationPath": "Fathers/English/Gregory_Nazianzen_English/In Defence of His Flight to Pontus (Oration II).txt",
        "titleEnglish": "In Defence of His Flight to Pontus (Oration II)",
    },
    "FA1860C60A8B4DDFBFB197327CF153E7": {
        "translationPath": "Fathers/English/Gregory_Nazianzen_English/In Defence of His Flight to Pontus (Oration II).txt",
        "titleEnglish": "Apology for His Flight to Pontus (Oration II)",
    },
    "207D8ADD4E9C4796A187AD731ABBE545": {
        "translationPath": "Fathers/English/Gregory_Nazianzen_English/Panegyric on St. Athanasius (Oration XXI).txt",
        "titleEnglish": "Panegyric on St. Athanasius (Oration XXI)",
    },
    "6952B2B123924032B8A92206A1FBF705": {
        "translationPath": "Fathers/English/Gregory_Nazianzen_English/Farewell Oration to the 150 Bishops (Oration XLII).txt",
        "titleEnglish": "Farewell Oration to the 150 Bishops (Oration XLII)",
    },
    "2B694706997346449A4C2B0234D88385": {
        "translationPath": "Fathers/English/Gregory_Nazianzen_English/Funeral Oration on St. Basil (Oration XLIII).txt",
        "titleEnglish": "Funeral Oration on St. Basil (Oration XLIII)",
    },
}

def main():
    print(f"Reading {WORKS_JSONL}...")
    with open(WORKS_JSONL, "r", encoding="utf-8") as f:
        lines = f.readlines()

    updated = 0
    new_lines = []
    for line in lines:
        row = json.loads(line)
        wid = row.get("work_id")
        if wid in MAPPINGS:
            m = MAPPINGS[wid]
            row["hasEnglishText"] = True
            row["translationPath"] = m["translationPath"]
            row["titleEnglish"] = m["titleEnglish"]
            updated += 1
            print(f"Linked [{wid}] {row.get('titleLatin')} -> {m['translationPath']}")
        new_lines.append(json.dumps(row, ensure_ascii=False) + "\n")

    with open(WORKS_JSONL, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    print(f"Successfully updated {updated} works in {WORKS_JSONL}")

if __name__ == "__main__":
    main()
