#!/usr/bin/env python3
"""Link Batch 4 St. Basil public domain treatises in data/clavis/works.jsonl.

Updates hasEnglishText, translationPath, and titleEnglish for all 10 verified Basil works,
then runs scripts/clavis-checklist.py regen to update CHECKLIST.md, tasks.csv, and author summaries.
"""
from __future__ import annotations

import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
WORKS_JSONL = ROOT / "data" / "clavis" / "works.jsonl"
CHECKLIST_SCRIPT = ROOT / "scripts" / "clavis-checklist.py"

# work_id -> (English filename relative to Fathers/English/Basil_English, English title)
BASIL_MAPPINGS: dict[str, tuple[str, str]] = {
    # CPG-2835
    "B8AEAED6E40D4293B962328D295E91E9": (
        "Homilies on the Hexaemeron.txt",
        "Homilies on the Hexaemeron",
    ),
    # CPG-2839
    "F3AAE8F52F7044FDAF5C3920C1E79B20": (
        "On the Holy Spirit.txt",
        "On the Holy Spirit",
    ),
    # CPG-2867
    "674847F5FC0040BF8D9E0B9F34037A71": (
        "Address to Young Men on Reading Greek Literature.txt",
        "Address to Young Men on Reading Greek Literature",
    ),
    # CPG-2900
    "6AC0ED4B66C84694A0D9957AAF5068FF": (
        "Letters.txt",
        "Letters",
    ),
    # CPG-2901
    "1E8AED33EF294F9D8B943B4F15606E47": (
        "Canonical Letters to Amphilochius.txt",
        "Canonical Letters to Amphilochius",
    ),
    # CPG-2914
    "625C765E8FB845EC91632AE01F33DD04": (
        "Against Those Who Calumniate Us as Saying Three Gods.txt",
        "Against Those Who Calumniate Us as Saying Three Gods",
    ),
    # CPG-3196
    "E6EEE603DF9D4278A69D23BB929A5E23": (
        "Letter to His Brother Peter on the Difference Between Ousia and Hypostasis.txt",
        "Letter to His Brother Peter on the Difference Between Ousia and Hypostasis",
    ),
    # CPG-3416
    "8020FAFED6134E00B3719B528421B820": (
        "Letter to the Italians and Gauls.txt",
        "Letter to the Italians and Gauls",
    ),
    # BHG-260b
    "82408955E7894964B28AE01FA10E3262": (
        "Letters Between Emperor Julian and Basil.txt",
        "Letters Between Emperor Julian and Basil",
    ),
    # Letter 260 to Optimus
    "39F1390D3EAA479A99EA56D90B1C5292": (
        "Letter to Bishop Optimus.txt",
        "Letter to Bishop Optimus",
    ),
}


def main() -> None:
    # 1. Verify files exist
    print("=== VERIFYING BASIL FILE EXISTENCE ===")
    for wid, (fname, title_en) in BASIL_MAPPINGS.items():
        fpath = ROOT / "Fathers" / "English" / "Basil_English" / fname
        if not fpath.is_file():
            raise FileNotFoundError(f"Missing file: {fpath}")
        print(f"Verified: {fname:70s} ({fpath.stat().st_size:,} bytes)")

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
            if wid in BASIL_MAPPINGS:
                fname, title_en = BASIL_MAPPINGS[wid]
                rel_path = f"Fathers/English/Basil_English/{fname}"
                item["hasEnglishText"] = True
                item["translationPath"] = rel_path
                item["titleEnglish"] = title_en
                updated_count += 1
            rows.append(item)

    with open(WORKS_JSONL, "w", encoding="utf-8") as f:
        for item in rows:
            f.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")

    print(f"Successfully updated {updated_count} Basil works in {WORKS_JSONL}")

    # 3. Regenerate checklist
    print("\n=== REGENERATING SITE CHECKLIST ===")
    res = subprocess.run(["python3", str(CHECKLIST_SCRIPT), "regen"], check=True, capture_output=True, text=True)
    print(res.stdout)


if __name__ == "__main__":
    main()
