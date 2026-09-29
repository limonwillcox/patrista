import json

targets = {
    "5359716FE5134BB79147B73AA4937627": {  # CPL-50 Epistulae
        "titleEnglish": "The Epistles of Cyprian",
        "translationPath": "Fathers/English/Cyprian_English/The Epistles of Cyprian.txt",
        "hasEnglishText": True
    },
    "3D3C13CEEE614A3A9C867575F77CFF58": {  # CPL-52 Vita Caecilii Cypriani auct. Pontio
        "titleEnglish": "Life and Passion of Cyprian by Pontius",
        "translationPath": "Fathers/English/Cyprian_English/Life and Passion of Cyprian by Pontius.txt",
        "hasEnglishText": True
    },
    "0C7688AA0C7B4A68B8FEF8C1115F06DC": {  # CPL-56 Sententiae episcoporum numero lxxxvii
        "titleEnglish": "Seventh Council of Carthage (Judgment of Eighty-Seven Bishops on the Baptism of Heretics)",
        "translationPath": "Fathers/English/Cyprian_English/Seventh Council of Carthage.txt",
        "hasEnglishText": True
    },
    "63FDDF09CBB8498B9E487B74BA48191D": {  # CPL-57 Quod idola dii non sint
        "titleEnglish": "On the Vanity of Idols",
        "translationPath": "Fathers/English/Cyprian_English/On the Vanity of Idols.txt",
        "hasEnglishText": True
    }
}

updated_lines = []
updated_count = 0
with open("data/clavis/works.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        wid = data.get("work_id")
        if wid in targets:
            data.update(targets[wid])
            updated_count += 1
            print(f"Updated {wid} -> {targets[wid]['titleEnglish']}")
        updated_lines.append(json.dumps(data, ensure_ascii=False) + "\n")

with open("data/clavis/works.jsonl", "w", encoding="utf-8") as f:
    f.writelines(updated_lines)

print(f"Total works updated: {updated_count}")
