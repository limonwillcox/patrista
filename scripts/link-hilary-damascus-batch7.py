#!/usr/bin/env python3
"""
Link Batch 7 works in data/clavis/works.jsonl for Hilary of Poitiers and John of Damascus.
"""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKS_JSONL = REPO_ROOT / "data" / "clavis" / "works.jsonl"

TARGETS = {
    # Hilary: On the Trinity (CPL-433)
    "90E9F6BF787F432B889E19DFEB7ABC82": {
        "titleEnglish": "On the Trinity",
        "translationPath": "Fathers/English/Hilary_English/On the Trinity.txt",
        "hasEnglishText": True,
    },
    # Hilary: On the Councils (CPL-434)
    "C73C999C6D954D46874BC30F8D7AF1DA": {
        "titleEnglish": "On the Councils",
        "translationPath": "Fathers/English/Hilary_English/On the Councils.txt",
        "hasEnglishText": True,
    },
    # Hilary: Homilies on the Psalms (CPL-428)
    "ADC6E27DEDBC466980B8F29CD61D4F43": {
        "titleEnglish": "Homilies on the Psalms",
        "translationPath": "Fathers/English/Hilary_English/Homilies on the Psalms.txt",
        "hasEnglishText": True,
    },
    # John of Damascus: Exposition of the Orthodox Faith (CPG-8043)
    "581A0071898742EC9B578F9D364ADA64": {
        "titleEnglish": "Exposition of the Orthodox Faith",
        "translationPath": "Fathers/English/John_Damascus_English/Exposition of the Orthodox Faith.txt",
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

print(f"Total updated: {updated_count}/4 works in {WORKS_JSONL}")
