#!/usr/bin/env python3
"""Link Batch 2 Athanasius dogmatic treatises and letters in data/clavis/works.jsonl.

Updates hasEnglishText, translationPath, and titleEnglish for all verified works,
then runs scripts/clavis-checklist.py regen to update CHECKLIST.md and tasks.csv.
"""
from __future__ import annotations

import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
WORKS_JSONL = ROOT / "data" / "clavis" / "works.jsonl"
CHECKLIST_SCRIPT = ROOT / "scripts" / "clavis-checklist.py"

# work_id -> (English filename relative to Fathers/English/Athanasius_English, English title)
ATHANASIUS_MAPPINGS: dict[str, tuple[str, str]] = {
    "34C9C621F6014505B52E8D9D127C9671": (
        "Against the Heathen.txt",
        "Against the Heathen",
    ),
    "4D43DDE8311F44EBB1751FEDF9AC3DA0": (
        "On the Incarnation of the Word.txt",
        "On the Incarnation of the Word",
    ),
    "5C4F2C28A0C64D0C8BBC2317A84D7067": (
        "To the Bishops of Egypt and Libya.txt",
        "To the Bishops of Egypt and Libya",
    ),
    "23B12A4DF60F4DE98D7E8380625BBD3F": (
        "Discourses Against the Arians.txt",
        "Four Discourses Against the Arians",
    ),
    "E574C1697F364586A819A6E0E882289B": (
        "Letter to Epictetus.txt",
        "Letter to Epictetus",
    ),
    "9D9A1684FC554585B3065A6F224AE048": (
        "Letter to Adelphius.txt",
        "Letter to Adelphius",
    ),
    "6EF3ED9EE1BD4312BD303315B7EA5903": (
        "On Luke X. 22.txt",
        "On Luke X. 22",
    ),
    "4BF4E2DBCEA543D3B70FCA5C62BDF90E": (
        "Letter to Maximus.txt",
        "Letter to Maximus",
    ),
    "0FBB951E609D4F0AAEEE0B515DE99B1A": (
        "Life of Antony.txt",
        "Life of Antony",
    ),
    "195058C7795E4813AB5989A9F729F8B9": (
        "Festal Letters and Index.txt",
        "Festal Letters",
    ),
    "55A83841C5CA40268745C53280BD3DF8": (
        "First Letter to Orsisius.txt",
        "First Letter to Orsisius",
    ),
    "2D562C25BC6E493691BC7BFF2BE688DA": (
        "Second Letter to Orsisius.txt",
        "Second Letter to Orsisius",
    ),
    "12D01FC85D0C4BE69A523FAE978E0BEC": (
        "Letters.txt",
        "Letters",
    ),
    "1AF1547A0CD445EBB03523BD718511A8": (
        "Letter to Amun.txt",
        "Letter to Amun",
    ),
    "52B0019B68EA48BB9FD1E3775CD74064": (
        "Letter to Rufinianus.txt",
        "Letter to Rufinianus",
    ),
    "65F0B8B73EBE4D63990BD3E4141CA9B1": (
        "First Letter to Monks.txt",
        "First Letter to Monks",
    ),
    "3568ADFC41C04DE5ADE068ECDC1E9E1E": (
        "Historia Acephala.txt",
        "Historia Acephala",
    ),
    "8AC47C0F6E0E45B09649D83CDC419FC9": (
        "Defense of the Nicene Definition.txt",
        "Defense of the Nicene Definition (De Decretis)",
    ),
    "4969B374BA164E57A64A4DCB79801636": (
        "On the Opinion of Dionysius.txt",
        "On the Opinion of Dionysius (De Sententia Dionysii)",
    ),
    "F447B660730E4BE2B4BFDB414FA24551": (
        "Defense of His Flight.txt",
        "Defense of His Flight (Apologia de Fuga)",
    ),
    "3C5F838B863641D3B49601A7ED110890": (
        "Defense Against the Arians.txt",
        "Defense Against the Arians (Apologia Contra Arianos)",
    ),
    "254A2583AE974E9B9AEB7E6E15B5FA2C": (
        "Circular Letter to Bishops.txt",
        "Encyclical Letter to Bishops",
    ),
    "5BA6939A5B4C4AA8B7B448292EDD6CB4": (
        "Letter to Serapion on the Death of Arius.txt",
        "Letter to Serapion on the Death of Arius",
    ),
    "F65D40177E154D59B4DB0A060CCF59D0": (
        "Second Letter to Monks.txt",
        "Second Letter to Monks",
    ),
    "313F0ADDF2054AD7A22038C048450CA9": (
        "History of the Arians.txt",
        "History of the Arians",
    ),
    "18FA5F88F7A74C1090F589D9E4280F27": (
        "On the Councils of Ariminum and Seleucia.txt",
        "On the Councils of Ariminum and Seleucia (De Synodis)",
    ),
    "B6538F071CEA4C239332B00E7C9B7296": (
        "Defense Before Constantius.txt",
        "Defense Before Constantius (Apologia ad Constantium)",
    ),
    "89BBF2ACCB9E4E99B1519A252D23F870": (
        "Letter to John and Antiochus.txt",
        "Letter to John and Antiochus",
    ),
    "216CC9ED992048D2A9CECE2C21857397": (
        "Letter to Palladius.txt",
        "Letter to Palladius",
    ),
    "5E2DD3FF84D445AB8B704AA6A1F13742": (
        "Letter to Dracontius.txt",
        "Letter to Dracontius",
    ),
    "85B7A752597C44509E5B76A0C7687BDB": (
        "To the Bishops of Africa.txt",
        "To the Bishops of Africa (Ad Afros)",
    ),
    "F7C52F971FB0498FBF96802D5BF9CED7": (
        "Tome to the People of Antioch.txt",
        "Tome or Synodal Letter to the People of Antioch",
    ),
    "42118E2DB2F843CBAC934A3BA8ED7D15": (
        "Letter to the Emperor Jovian.txt",
        "Letter to the Emperor Jovian",
    ),
    "E11BE5A1D3F9470B869D3A7A9E1629E8": (
        "Letter to Diodorus.txt",
        "Letter to Diodorus",
    ),
    "F67A4F9B05EE4AA3A78D1B59E3F202EE": (
        "Fourth Discourse Against the Arians.txt",
        "Fourth Discourse Against the Arians",
    ),
    "598FA845C47A4245A636C422DD7036A7": (
        "Letters to Lucifer.txt",
        "Letters to Lucifer",
    ),
    "BC5A84ACC9E5409697B8F7638B6DF3C2": (
        "Statement of Faith.txt",
        "Statement of Faith",
    ),
}


def main() -> None:
    # 1. Verify files exist
    print("=== VERIFYING ATHANASIUS FILE EXISTENCE ===")
    for wid, (fname, title_en) in ATHANASIUS_MAPPINGS.items():
        fpath = ROOT / "Fathers" / "English" / "Athanasius_English" / fname
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
            if wid in ATHANASIUS_MAPPINGS:
                fname, title_en = ATHANASIUS_MAPPINGS[wid]
                rel_path = f"Fathers/English/Athanasius_English/{fname}"
                item["hasEnglishText"] = True
                item["translationPath"] = rel_path
                item["titleEnglish"] = title_en
                updated_count += 1
            rows.append(item)

    with open(WORKS_JSONL, "w", encoding="utf-8") as f:
        for item in rows:
            f.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")

    print(f"Successfully updated {updated_count} Athanasius works in {WORKS_JSONL}")

    # 3. Regenerate checklist
    print("\n=== REGENERATING SITE CHECKLIST ===")
    res = subprocess.run(["python3", str(CHECKLIST_SCRIPT), "regen"], check=True, capture_output=True, text=True)
    print(res.stdout)


if __name__ == "__main__":
    main()
