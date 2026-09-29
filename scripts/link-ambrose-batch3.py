#!/usr/bin/env python3
"""Link Batch 3 Ambrose public domain treatises in data/clavis/works.jsonl.

Updates hasEnglishText, translationPath, and titleEnglish for all 11 verified Ambrose works,
then runs scripts/clavis-checklist.py regen to update CHECKLIST.md, tasks.csv, and author summaries.
"""
from __future__ import annotations

import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
WORKS_JSONL = ROOT / "data" / "clavis" / "works.jsonl"
CHECKLIST_SCRIPT = ROOT / "scripts" / "clavis-checklist.py"

# work_id -> (English filename relative to Fathers/English/Ambrose_English, English title)
AMBROSE_MAPPINGS: dict[str, tuple[str, str]] = {
    # CPL-144
    "82AC01D2FD0C46F297AAA5018F8B6128": (
        "On the Duties of the Clergy.txt",
        "On the Duties of the Clergy",
    ),
    # CPL-145
    "2851BB3A3DF0432D87DD761FB37C2BE0": (
        "Concerning Virgins.txt",
        "Concerning Virgins",
    ),
    # CPL-146
    "8A70CC2CC35D493BB00786DBA87BFBD4": (
        "Concerning Widows.txt",
        "Concerning Widows",
    ),
    # CPL-150
    "5803C26E941F4F4E9DE6DAF85EC26B3E": (
        "Exposition of the Christian Faith.txt",
        "Exposition of the Christian Faith",
    ),
    # CPL-151
    "38374BC367594DC7BB208FD21B3EE14D": (
        "On the Holy Spirit.txt",
        "On the Holy Spirit",
    ),
    # CPL-154
    "28E986EC6FEF4CDDA78279FCA613DD50": (
        "Concerning the Sacraments.txt",
        "Concerning the Sacraments",
    ),
    # CPL-155
    "14D43792CD774787B51E0A9A2E94EEA0": (
        "On the Mysteries.txt",
        "On the Mysteries",
    ),
    # CPL-156
    "81BDAC3BF41249EEA4B9FB083543F52F": (
        "Concerning Repentance.txt",
        "Concerning Repentance",
    ),
    # CPL-157
    "FFDB408DBF394607BEDF5E22A6395150": (
        "On the Decease of His Brother Satyrus.txt",
        "On the Decease of His Brother Satyrus",
    ),
    # CPL-159
    "60A19ACDAD0B443486F7FBD98CD0A3D7": (
        "On the Death of Theodosius.txt",
        "On the Death of Theodosius",
    ),
    # CPL-160
    "DFD41F635AD84BB49D5014FA8F24FACF": (
        "Letters.txt",
        "Letters",
    ),
}


def main() -> None:
    # 1. Verify files exist
    print("=== VERIFYING AMBROSE FILE EXISTENCE ===")
    for wid, (fname, title_en) in AMBROSE_MAPPINGS.items():
        fpath = ROOT / "Fathers" / "English" / "Ambrose_English" / fname
        if not fpath.is_file():
            raise FileNotFoundError(f"Missing file: {fpath}")
        print(f"Verified: {fname:45s} ({fpath.stat().st_size:,} bytes)")

    # 2. Update works.jsonl
    print("\n=== UPDATING DATA/CLAVIS/WORKS.JSONL ===")
    rows = []
    updated_count = 0
    with open(WORKS_JSONL, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            item = json.loads(line)
            wid = item.get("work_id")
            if wid in AMBROSE_MAPPINGS:
                fname, title_en = AMBROSE_MAPPINGS[wid]
                rel_path = f"Fathers/English/Ambrose_English/{fname}"
                item["hasEnglishText"] = True
                item["translationPath"] = rel_path
                item["titleEnglish"] = title_en
                updated_count += 1
            rows.append(item)

    with open(WORKS_JSONL, "w", encoding="utf-8") as f:
        for item in rows:
            f.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")

    print(f"Successfully updated {updated_count} Ambrose works in {WORKS_JSONL}")

    # 3. Regenerate checklist
    print("\n=== REGENERATING SITE CHECKLIST ===")
    res = subprocess.run(["python3", str(CHECKLIST_SCRIPT), "regen"], check=True, capture_output=True, text=True)
    print(res.stdout)


if __name__ == "__main__":
    main()
