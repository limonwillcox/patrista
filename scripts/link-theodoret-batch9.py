#!/usr/bin/env python3
"""
Link Batch 9 works in data/clavis/works.jsonl for Theodoret, Jerome, Rufinus.
"""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKS_JSONL = REPO_ROOT / "data" / "clavis" / "works.jsonl"

TARGETS = {
    # Theodoret: Ecclesiastical History (CPG-6222)
    "2366A8A732974E638039A9594F74DADC": {
        "titleEnglish": "Ecclesiastical History",
        "translationPath": "Fathers/English/Theodoret_English/Ecclesiastical History.txt",
        "hasEnglishText": True,
    },
    # Theodoret: Dialogues (Eranistes) (CPG-6217)
    "5967D46223AB4C7C8E510FC98114F83C": {
        "titleEnglish": "Dialogues (Eranistes)",
        "translationPath": "Fathers/English/Theodoret_English/Dialogues (Eranistes).txt",
        "hasEnglishText": True,
    },
    # Theodoret: Letters (CPG-6240)
    "2E1BDF2ABCEF4751997358BC5411072F": {
        "titleEnglish": "Letters",
        "translationPath": "Fathers/English/Theodoret_English/Letters.txt",
        "hasEnglishText": True,
    },
    # Jerome: Lives of Illustrious Men (CPL-616)
    "3DF9DF3CCA8D43E5A3214D58B714FF15": {
        "titleEnglish": "Lives of Illustrious Men",
        "translationPath": "Fathers/English/Jerome_English/Lives of Illustrious Men.txt",
        "hasEnglishText": True,
    },
    # Jerome: Apology Against Rufinus (CPL-613)
    "C5D1DDB3C8924055B1EF983A824B2789": {
        "titleEnglish": "Apology Against Rufinus",
        "translationPath": "Fathers/English/Jerome_English/Apology Against Rufinus.txt",
        "hasEnglishText": True,
    },
    # Rufinus: Apology in Defence of Himself (CPL-197)
    "449E4FAE1FFA41F1BE26941388BC1A10": {
        "titleEnglish": "Apology in Defence of Himself",
        "translationPath": "Fathers/English/Rufinus_English/Apology in Defence of Himself.txt",
        "hasEnglishText": True,
    },
    # Rufinus: Commentary on the Apostles' Creed (CPL-198)
    "B74A094502D740B09112FB90F813FBE4": {
        "titleEnglish": "Commentary on the Apostles' Creed",
        "translationPath": "Fathers/English/Rufinus_English/Commentary on the Apostles' Creed.txt",
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
