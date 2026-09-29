#!/usr/bin/env python3
"""
Link Batch 8 works in data/clavis/works.jsonl for John Cassian.
"""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKS_JSONL = REPO_ROOT / "data" / "clavis" / "works.jsonl"

TARGETS = {
    # Cassian: The Institutes of the Coenobia (CPL-513)
    "47A887850794412E9AC961924EB0A9C2": {
        "titleEnglish": "The Institutes of the Coenobia",
        "translationPath": "Fathers/English/Cassian_English/The Institutes of the Coenobia.txt",
        "hasEnglishText": True,
    },
    # Cassian: The Conferences (CPL-512)
    "7ADD1965B8FE433385C0A33D8DEF1981": {
        "titleEnglish": "The Conferences",
        "translationPath": "Fathers/English/Cassian_English/The Conferences.txt",
        "hasEnglishText": True,
    },
    # Cassian: On the Incarnation against Nestorius (CPL-514)
    "0363964018C743C3A595768B63C575AF": {
        "titleEnglish": "On the Incarnation of the Lord, Against Nestorius",
        "translationPath": "Fathers/English/Cassian_English/On the Incarnation of the Lord, Against Nestorius.txt",
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

print(f"Total updated: {updated_count}/3 works in {WORKS_JSONL}")
