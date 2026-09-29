#!/usr/bin/env python3
"""Link Batch 1 Augustine treatises (and existing Augustine English shelf files) to data/clavis/works.jsonl.

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

# work_id -> (English filename relative to Fathers/English/Augustine_English, English title)
AUGUSTINE_MAPPINGS: dict[str, tuple[str, str]] = {
    # --- Batch 1 newly extracted treatises (NPNF1-03 & NPNF1-05) ---
    "34C1F0C7BDA4414AB336B96A98C7511D": (
        "On Faith and the Creed.txt",
        "On Faith and the Creed",
    ),
    "F08235C2B4274343A007FD1E5025D3CA": (
        "Concerning Faith of Things Not Seen.txt",
        "Concerning Faith of Things Not Seen",
    ),
    "5B1600C68E2046C184767CB21D079B39": (
        "On the Profit of Believing.txt",
        "On the Profit of Believing",
    ),
    "B29D3E2CD708438386D15119D200F484": (
        "On the Creed - A Sermon to the Catechumens.txt",
        "On the Creed: A Sermon to Catechumens",
    ),
    "8484FA04292246978F5D423F75CD722F": (
        "On Continence.txt",
        "On Continence",
    ),
    "723CCB5131AB449C97379DC4A07BF0C2": (
        "On the Good of Marriage.txt",
        "On the Good of Marriage",
    ),
    "C6CB5EBA7FCB4BE69EFA247473A0DCB2": (
        "Of Holy Virginity.txt",
        "Of Holy Virginity",
    ),
    "2CF7884BD4434BDFA39F67B634AE0888": (
        "On the Good of Widowhood.txt",
        "On the Good of Widowhood",
    ),
    "A3CB0ADA679E4B189C238D62AF5F1DA1": (
        "On Lying.txt",
        "On Lying",
    ),
    "DCE35E22217B430C9BABA7D74BE1F0A3": (
        "To Consentius Against Lying.txt",
        "Against Lying",
    ),
    "8E0734A7756841F6A0103F411154AF12": (
        "Of the Work of Monks.txt",
        "Of the Work of Monks",
    ),
    "530A32B2EAEB4111BAC5D6EBE5287458": (
        "On Patience.txt",
        "On Patience",
    ),
    "4F1E3A7FBC4D4D998974644005E04B77": (
        "On Care to be Had for the Dead.txt",
        "On Care to be Had for the Dead",
    ),
    "8A3AAEEFE07E478882EFA4EBE0643919": (
        "On the Perfection of Mans Righteousness.txt",
        "On the Perfection of Man's Righteousness",
    ),
    "46FD9DEF47C641189058123996DD7E7B": (
        "On the Proceedings of Pelagius.txt",
        "On the Proceedings of Pelagius",
    ),
    "168976DED43941D2897560160A46FD40": (
        "On Marriage and Concupiscence.txt",
        "On Marriage and Concupiscence",
    ),
    # --- Existing Augustine shelf files in Fathers/English/Augustine_English ---
    "0D11ECFDA83849CFB1370F81BB81A4DA": (
        "Of the Morals of the Catholic Church.txt",
        "On the Morals of the Catholic Church and of the Manichaeans",
    ),
    "70BEA5798B724BB997476371A827DE43": (
        "Letters.txt",
        "Letters",
    ),
    "4A8B74E61A6746E8A992A4B638A6744A": (
        "The Harmony of the Gospels.txt",
        "The Harmony of the Gospels",
    ),
    "831B117C7BED4170A518DC52BBE7F3EE": (
        "Our Lord's Sermon on the Mount.txt",
        "Our Lord's Sermon on the Mount",
    ),
    "330AAEC647754C33948937FC31F6F8E5": (
        "Homilies on the Gospel of John.txt",
        "Tractates on the Gospel of John",
    ),
    "80DDD6E4E0B24C96A0E480A8B3E687BF": (
        "Homilies on the First Epistle of John.txt",
        "Ten Homilies on the First Epistle of John",
    ),
    "D617384F359945178EF3224244373B8D": (
        "Expositions on the Psalms.txt",
        "Expositions on the Psalms",
    ),
    "A41BE7441FC0490FADB6303AB107B439": (
        "Sermons on Selected Lessons of the New Testament.txt",
        "Sermons on Selected Lessons of the New Testament",
    ),
    "659DA9FACECF4E70993A5E12964A3E55": (
        "Concerning Two Souls.txt",
        "On Two Souls, Against the Manichaeans",
    ),
    "A375161E12364B19846287C259E774D3": (
        "Against Fortunatus.txt",
        "Disputation Against Fortunatus the Manichaean",
    ),
    "4C650FC41B3B44669AC764930091DAB4": (
        "Against the Epistle of Manichaeus Called Fundamental.txt",
        "Against the Fundamental Epistle of Manichaeus",
    ),
    "ED338925AEC5413192EB2FC79F806212": (
        "Reply to Faustus the Manichaean.txt",
        "Reply to Faustus the Manichaean",
    ),
    "FBAF648DA2F74E2C8D82D45103DEEC9D": (
        "Concerning the Nature of Good.txt",
        "On the Nature of Good, Against the Manichaeans",
    ),
    "B2D34707FEF94B9CB92195106A387444": (
        "On Baptism Against the Donatists.txt",
        "On Baptism, Against the Donatists",
    ),
    "F9E0134BFE3F4510AA7C9C1F801EC803": (
        "Answer to Letters of Petilian.txt",
        "Answer to the Letters of Petilian, Bishop of Cirta",
    ),
    "4975770998E54130B1FD3A1B10F4EB76": (
        "On the Merits and Forgiveness of Sins.txt",
        "On the Merits and Forgiveness of Sins, and on the Baptism of Infants",
    ),
    "7014CBC08BBB46E5BABE048EFC3D1B6F": (
        "On the Spirit and the Letter.txt",
        "On the Spirit and the Letter",
    ),
    "85549D7A4EC94E339E1A45D2EAB1EDBC": (
        "On Nature and Grace.txt",
        "On Nature and Grace",
    ),
    "28001CA684624675B59B3885D99FC5DF": (
        "On the Soul and its Origin.txt",
        "On the Soul and Its Origin",
    ),
    "4FD63CF8087346A19D13BF61DE93FAE7": (
        "Against Two Letters of the Pelagians.txt",
        "Against Two Letters of the Pelagians",
    ),
    "BD484CA77DAC4A84896C0CFE1449C3DD": (
        "On the Grace of Christ and Original Sin.txt",
        "On the Grace of Christ and on Original Sin",
    ),
    "E927859B672E4544BF52ED8915012598": (
        "On Grace and Free Will.txt",
        "On Grace and Free Will",
    ),
    "C0B95AB91A71484E85FC7A3C99930212": (
        "On Rebuke and Grace.txt",
        "On Rebuke and Grace",
    ),
    "F9284C9E30044F6D8AB5E4B773097F85": (
        "On the Predestination of the Saints.txt",
        "On the Predestination of the Saints",
    ),
    "214473A9C90C4C8AA3B62BC57A6AB324": (
        "On the Gift of Perseverance.txt",
        "On the Gift of Perseverance",
    ),
}


def main() -> None:
    # 1. Verify existence of files
    print("=== VERIFYING FILE EXISTENCE ===")
    for wid, (fname, title_en) in AUGUSTINE_MAPPINGS.items():
        fpath = ROOT / "Fathers" / "English" / "Augustine_English" / fname
        if not fpath.is_file():
            raise FileNotFoundError(f"Missing file: {fpath}")
        print(f"Verified: {fname} ({fpath.stat().st_size:,} bytes)")

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
            if wid in AUGUSTINE_MAPPINGS:
                fname, title_en = AUGUSTINE_MAPPINGS[wid]
                rel_path = f"Fathers/English/Augustine_English/{fname}"
                item["hasEnglishText"] = True
                item["translationPath"] = rel_path
                item["titleEnglish"] = title_en
                updated_count += 1
            rows.append(item)

    with open(WORKS_JSONL, "w", encoding="utf-8") as f:
        for item in rows:
            f.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")

    print(f"Successfully updated {updated_count} Augustine works in {WORKS_JSONL}")

    # 3. Regenerate checklist
    print("\n=== REGENERATING SITE CHECKLIST ===")
    res = subprocess.run(["python3", str(CHECKLIST_SCRIPT), "regen"], check=True, capture_output=True, text=True)
    print(res.stdout)


if __name__ == "__main__":
    main()
