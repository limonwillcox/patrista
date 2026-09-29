#!/usr/bin/env python3
"""
Link Batch 12 works in data/clavis/works.jsonl for St. Cyprian of Carthage.
"""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKS_JSONL = REPO_ROOT / "data" / "clavis" / "works.jsonl"

TARGETS = {
    # Ad Donatum (CPL-38)
    "7C1D229E0AB24F3B9659C216C92B5E15": {
        "titleEnglish": "To Donatus",
        "translationPath": "Fathers/English/Cyprian_English/To Donatus.txt",
        "hasEnglishText": True,
    },
    # Ad Quirinum (CPL-39)
    "6359B395B9A1499D8F039ADCC60A2A3E": {
        "titleEnglish": "Three Books of Testimonies Against the Jews",
        "translationPath": "Fathers/English/Cyprian_English/Three Books of Testimonies Against the Jews.txt",
        "hasEnglishText": True,
    },
    # De habitu virginum (CPL-40)
    "28AB3BB867454A7CB71B1A6AAFE3725B": {
        "titleEnglish": "On the Dress of Virgins",
        "translationPath": "Fathers/English/Cyprian_English/On the Dress of Virgins.txt",
        "hasEnglishText": True,
    },
    # De catholicae ecclesiae unitate (CPL-41)
    "D3C6B0011C424D1F81888A9DE9A65BED": {
        "titleEnglish": "On the Unity of the Church",
        "translationPath": "Fathers/English/Cyprian_English/On the Unity of the Church.txt",
        "hasEnglishText": True,
    },
    # De lapsis (CPL-42)
    "CB40644F575B4F33B78F2FA1FD6E510D": {
        "titleEnglish": "On the Lapsed",
        "translationPath": "Fathers/English/Cyprian_English/On the Lapsed.txt",
        "hasEnglishText": True,
    },
    # De dominica oratione (CPL-43)
    "AE784095FFA740BDB688F37F7295DAFE": {
        "titleEnglish": "On the Lord's Prayer",
        "translationPath": "Fathers/English/Cyprian_English/On the Lord's Prayer.txt",
        "hasEnglishText": True,
    },
    # De mortalitate (CPL-44)
    "F279A6267CD64CB8AAB5BAFF2669904C": {
        "titleEnglish": "On the Mortality",
        "translationPath": "Fathers/English/Cyprian_English/On the Mortality.txt",
        "hasEnglishText": True,
    },
    # Ad Fortunatum (CPL-45)
    "EE9356C4C4CC4561A4A5547E82CF1C6A": {
        "titleEnglish": "Exhortation to Martyrdom",
        "translationPath": "Fathers/English/Cyprian_English/Exhortation to Martyrdom.txt",
        "hasEnglishText": True,
    },
    # Ad Demetrianum (CPL-46)
    "13060EC8AAF245F2A8323AF18278D94B": {
        "titleEnglish": "An Address to Demetrianus",
        "translationPath": "Fathers/English/Cyprian_English/An Address to Demetrianus.txt",
        "hasEnglishText": True,
    },
    # De opere et eleemosynis (CPL-47)
    "711655E399F449C2A518D421511E52C3": {
        "titleEnglish": "On Works and Alms",
        "translationPath": "Fathers/English/Cyprian_English/On Works and Alms.txt",
        "hasEnglishText": True,
    },
    # De bono patientiae (CPL-48)
    "DD4CAB9392EF4EABBAE72588A4C78F20": {
        "titleEnglish": "On the Advantage of Patience",
        "translationPath": "Fathers/English/Cyprian_English/On the Advantage of Patience.txt",
        "hasEnglishText": True,
    },
    # De zelo et livore (CPL-49)
    "731530545A7E42D89D244AA8C1BEFBEA": {
        "titleEnglish": "On Jealousy and Envy",
        "translationPath": "Fathers/English/Cyprian_English/On Jealousy and Envy.txt",
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
