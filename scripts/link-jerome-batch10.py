#!/usr/bin/env python3
"""
Link Batch 10 works in data/clavis/works.jsonl for St. Jerome.
"""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKS_JSONL = REPO_ROOT / "data" / "clavis" / "works.jsonl"

TARGETS = {
    # Vita Sancti Hilarionis (CPL-618)
    "60A606A7A5284FB19B5D271AE70D6297": {
        "titleEnglish": "The Life of S. Hilarion",
        "translationPath": "Fathers/English/Jerome_English/The Life of S. Hilarion.txt",
        "hasEnglishText": True,
    },
    # Altercatio Luciferiani et Orthodoxi (CPL-608)
    "23244DB62A0E4C76A3E56D8ADC6EEC35": {
        "titleEnglish": "Dialogue Against the Luciferians",
        "translationPath": "Fathers/English/Jerome_English/The Dialogue Against the Luciferians.txt",
        "hasEnglishText": True,
    },
    # Adversus Helvidium (CPL-609)
    "6A8B944C932040B49BAC7974DB6188B5": {
        "titleEnglish": "The Perpetual Virginity of Blessed Mary",
        "translationPath": "Fathers/English/Jerome_English/The Perpetual Virginity of Blessed Mary.txt",
        "hasEnglishText": True,
    },
    # Adversus Jovinianum (CPL-610)
    "BD2877DB7FEA476AA9E6DB70A9B53A78": {
        "titleEnglish": "Against Jovinianus",
        "translationPath": "Fathers/English/Jerome_English/Against Jovinianus.txt",
        "hasEnglishText": True,
    },
    # Contra Vigilantium (CPL-611)
    "8D17CCB137F74C5CBBAAA34620DBE189": {
        "titleEnglish": "Against Vigilantius",
        "translationPath": "Fathers/English/Jerome_English/Against Vigilantius.txt",
        "hasEnglishText": True,
    },
    # Contra Ioannem Hierosolymitanum (CPL-612)
    "3CD5D41BE4B44E4E9FF14DD222C8CE2C": {
        "titleEnglish": "To Pammachius Against John of Jerusalem",
        "translationPath": "Fathers/English/Jerome_English/To Pammachius Against John of Jerusalem.txt",
        "hasEnglishText": True,
    },
    # Dialogi contra Pelagianos (CPL-615)
    "ED3101DA1ED14286914EEA361E11A9D7": {
        "titleEnglish": "Against the Pelagians",
        "translationPath": "Fathers/English/Jerome_English/Against the Pelagians.txt",
        "hasEnglishText": True,
    },
}

lines = []
updated_count = 0

with open(WORKS_JSONL, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        wid = data.get("work_id")
        if wid in TARGETS:
            updates = TARGETS[wid]
            for k, v in updates.items():
                data[k] = v
            updated_count += 1
            print(f"Updated work {wid}: {data.get('titleLatin')} -> {data.get('titleEnglish')} ({data.get('translationPath')})")
        lines.append(data)

with open(WORKS_JSONL, "w", encoding="utf-8") as f:
    for item in lines:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")

print(f"Total updated: {updated_count}/{len(TARGETS)} works in {WORKS_JSONL}")
