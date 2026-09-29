#!/usr/bin/env python3
"""
Link Batch 6 St. Gregory of Nyssa public domain works in data/clavis/works.jsonl.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKS_JSONL = ROOT / "data" / "clavis" / "works.jsonl"

MAPPINGS = {
    # CPG-3135: Against Eunomius (Books I-XII)
    "8C5F722EA3A0488D80A0B94D4101F5DD": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/Against Eunomius.txt",
        "titleEnglish": "Against Eunomius",
    },
    # CPG-3136: Answer to Eunomius' Second Book
    "FD32AFC3CCB840B982147CE33644EE0C": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/Answer to Eunomius' Second Book.txt",
        "titleEnglish": "Answer to Eunomius' Second Book",
    },
    # CPG-3142: On the Holy Spirit
    "29CD75317DC2477094C9F4D25EB5C629": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On the Holy Spirit.txt",
        "titleEnglish": "On the Holy Spirit",
    },
    # CPG-3137: On the Holy Trinity
    "6BBF6C5F3ED64531A84EBEB7CEAF085C": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On the Holy Trinity.txt",
        "titleEnglish": "On the Holy Trinity",
    },
    # CPG-3139: On Not Three Gods
    "8403C5890607412DB09F54121D1C0882": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On Not Three Gods.txt",
        "titleEnglish": "On Not Three Gods",
    },
    # CPG-3140: On the Faith
    "37944672F45E480781E8E9A73E29A85D": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On the Faith.txt",
        "titleEnglish": "On the Faith",
    },
    # CPG-3165: On Virginity
    "3A412CD85B6C40919973BE9057FA131B": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On Virginity.txt",
        "titleEnglish": "On Virginity",
    },
    # CPG-3145: On Infants' Early Deaths
    "5C26BD3257764681AE46790FF9F1140A": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On Infants' Early Deaths.txt",
        "titleEnglish": "On Infants' Early Deaths",
    },
    # CPG-3154: On the Making of Man
    "0859C0FC73A6458F90C81E74A013B0A0": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On the Making of Man.txt",
        "titleEnglish": "On the Making of Man",
    },
    # CPG-3149: On the Soul and the Resurrection
    "EACC5779D7264A28AE2620484A55F55E": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On the Soul and the Resurrection.txt",
        "titleEnglish": "On the Soul and the Resurrection",
    },
    # CPG-3150: The Great Catechism
    "31F34E757644436CBF7CCB5C9D6FA343": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/The Great Catechism.txt",
        "titleEnglish": "The Great Catechism",
    },
    # CPG-3180 / BHG-1243: Funeral Oration on Meletius
    "4070CFFFF97949C3A3EE3C2D11355265": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/Funeral Oration on Meletius.txt",
        "titleEnglish": "Funeral Oration on Meletius",
    },
    # CPG-3173 / BHG-1934: On the Baptism of Christ
    "E7ED39666E20450AB37D07C8DD4AD0E5": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/On the Baptism of Christ.txt",
        "titleEnglish": "On the Baptism of Christ",
    },
    # CPG-3167: Letters
    "1A6B57C9C43D48D0A60CCC7F52245525": {
        "translationPath": "Fathers/English/Gregory_Nyssa_English/Letters.txt",
        "titleEnglish": "Letters",
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
