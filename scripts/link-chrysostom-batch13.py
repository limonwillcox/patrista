import json

targets = {
    "6B1A9AEBAAC54D1987FE56EF753E051F": { # CPG-4316 De sacerdotio libri 1-6
        "titleEnglish": "On the Priesthood",
        "translationPath": "Fathers/English/Chrysostom_English/On the Priesthood.txt",
        "hasEnglishText": True
    },
    "13CEA531516C45DA95FF4735A9C904FD": { # CPG-4305 Ad Theodorum lapsum
        "titleEnglish": "An Exhortation to Theodore After His Fall",
        "translationPath": "Fathers/English/Chrysostom_English/An Exhortation to Theodore After His Fall.txt",
        "hasEnglishText": True
    },
    "2C4A6FF2AF8E49BA97E66130037BE656": { # CPG-4314 Ad uiduam iuniorem
        "titleEnglish": "Letter to a Young Widow",
        "translationPath": "Fathers/English/Chrysostom_English/Letter to a Young Widow.txt",
        "hasEnglishText": True
    },
    "7D9B8A4492F644C89C2B2F3244C7586C": { # CPG-4351 Laudatio S. Ignatii
        "titleEnglish": "Homily on S. Ignatius",
        "translationPath": "Fathers/English/Chrysostom_English/Homily on S. Ignatius.txt",
        "hasEnglishText": True
    },
    "E8DF4CCC2D27478CAA8A7F479054E649": { # CPG-4347 Homilia de S. Babyla
        "titleEnglish": "Homily on S. Babylas",
        "translationPath": "Fathers/English/Chrysostom_English/Homily on S. Babylas.txt",
        "hasEnglishText": True
    },
    "9F8F904CCA234681984E119C854342FC": { # CPG-4385 De profectu euangelii (Phil 1.18)
        "titleEnglish": "Homily Concerning Lowliness of Mind",
        "translationPath": "Fathers/English/Chrysostom_English/Homily Concerning Lowliness of Mind.txt",
        "hasEnglishText": True
    },
    "84D990F10C594432B98F2B7720BC8D75": { # CPG-4460 Ad illuminandos catechesis 1
        "titleEnglish": "Instructions to Catechumens",
        "translationPath": "Fathers/English/Chrysostom_English/Instructions to Catechumens.txt",
        "hasEnglishText": True
    },
    "20DFB5397DD34C2BAF88CAB710E91379": { # CPG-4332 De diabolo tentatore homiliae 1-3
        "titleEnglish": "Three Homilies Concerning the Power of Demons",
        "translationPath": "Fathers/English/Chrysostom_English/Three Homilies Concerning the Power of Demons.txt",
        "hasEnglishText": True
    },
    "7445E17F3DFC4FCC8FB7355BBCFA6532": { # CPG-4369 In illud: Pater, si possibile est
        "titleEnglish": "Homily on the Passage 'Father if it be possible let this cup pass from me'",
        "translationPath": "Fathers/English/Chrysostom_English/Homily on the Passage 'Father if it be possible'.txt",
        "hasEnglishText": True
    },
    "3CD66F4D4EC94BEAABC401FC580F8C4D": { # CPG-4370 In paralyticum demissum per tectum
        "titleEnglish": "Homily on the Paralytic Let Down Through the Roof",
        "translationPath": "Fathers/English/Chrysostom_English/Homily on the Paralytic Let Down Through the Roof.txt",
        "hasEnglishText": True
    },
    "1AC9653AD1CB4F8F894E74C9F1B4028F": { # CPG-4375 In illud: Si esurierit inimicus (Rom 12.20)
        "titleEnglish": "Homily on the Passage 'If Thine Enemy Hunger Feed Him'",
        "translationPath": "Fathers/English/Chrysostom_English/Homily on the Passage 'If Thine Enemy Hunger Feed Him'.txt",
        "hasEnglishText": True
    },
    "75C9E198F70F4D928E0CF4B6F04B9587": { # CPG-4389 Peccata fratrum non euulganda
        "titleEnglish": "Homily Against Publishing the Errors of the Brethren",
        "translationPath": "Fathers/English/Chrysostom_English/Homily Against Publishing the Errors of the Brethren.txt",
        "hasEnglishText": True
    },
    "974E6635A2814A87B2568A6E2A662CE4": { # CPG-4392 In Eutropium
        "titleEnglish": "Two Homilies on Eutropius",
        "translationPath": "Fathers/English/Chrysostom_English/Two Homilies on Eutropius.txt",
        "hasEnglishText": True
    },
    "E589B526D82644D98E99BC43CAAB1E33": { # CPG-4400 Quod nemo laeditur nisi a seipso
        "titleEnglish": "Treatise That No One Can Harm the Man Who Does Not Injure Himself",
        "translationPath": "Fathers/English/Chrysostom_English/Treatise That No One Can Harm the Man Who Does Not Injure Himself.txt",
        "hasEnglishText": True
    },
    "4526826EC0FB4C7A824D9FFC1EC1064C": { # CPG-4405 / BHG-881 Epistulae ad Olympiadem
        "titleEnglish": "Letters to Olympias",
        "translationPath": "Fathers/English/Chrysostom_English/Letters to Olympias.txt",
        "hasEnglishText": True
    },
    "FD3E42D7895E4DE0B66E4353981B134E": { # CPG-4402 Epistula Iohannis Chrysostomi ad Innocentium papam
        "titleEnglish": "Correspondence with Pope Innocent I",
        "translationPath": "Fathers/English/Chrysostom_English/Correspondence with Pope Innocent I.txt",
        "hasEnglishText": True
    },
    "1300AF5DFA5B46CB9ACEC80C4F6F931B": { # CPG-4330 Ad populum Antiochenum (De statuis)
        "titleEnglish": "Homilies on the Statues",
        "translationPath": "Fathers/English/Chrysostom_English/Homilies on the Statues.txt",
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

print(f"Total Chrysostom works linked: {updated_count}")
