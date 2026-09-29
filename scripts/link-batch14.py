import json

targets = {
    # Athenagoras
    "F3520F5C5F734F9BB2BB3FA2FFCD49FE": {
        "titleEnglish": "A Plea for the Christians",
        "translationPath": "Fathers/English/Athenagoras_English/A Plea for the Christians.txt",
        "hasEnglishText": True
    },
    "2A947A2E95874A89A893959ED14B1C5B": {
        "titleEnglish": "On the Resurrection of the Dead",
        "translationPath": "Fathers/English/Athenagoras_English/On the Resurrection of the Dead.txt",
        "hasEnglishText": True
    },
    # Novatian & Pseudo-Cyprian
    "C5CAD272624D4A07B4A99D40FA464907": {
        "titleEnglish": "On the Jewish Meats",
        "translationPath": "Fathers/English/Novatian_English/On the Jewish Meats.txt",
        "hasEnglishText": True
    },
    "69B006D7C5944064ADDE79F62D831460": {
        "titleEnglish": "Treatise Against the Heretic Novatian",
        "translationPath": "Fathers/English/Novatian_English/Treatise Against the Heretic Novatian.txt",
        "hasEnglishText": True
    },
    "936323F7125943B087045310963BFA85": {
        "titleEnglish": "Treatise on Re-Baptism",
        "translationPath": "Fathers/English/Cyprian_English/Treatise on Re-Baptism.txt",
        "hasEnglishText": True
    },
    # Hippolytus
    "42E37BD85A6940E78208F16B642DA9C3": {
        "titleEnglish": "Commentary on Daniel",
        "translationPath": "Fathers/English/Hippolytus_English/Commentary on Daniel.txt",
        "hasEnglishText": True
    },
    "DEBCD85163E24E65AB7C88ADE4617167": {
        "titleEnglish": "Treatise on Christ and Antichrist",
        "translationPath": "Fathers/English/Hippolytus_English/Treatise on Christ and Antichrist.txt",
        "hasEnglishText": True
    },
    "CF819A315C2D4B5385F6AD6F00DE4C42": {
        "titleEnglish": "Expository Treatise Against the Jews",
        "translationPath": "Fathers/English/Hippolytus_English/Expository Treatise Against the Jews.txt",
        "hasEnglishText": True
    },
    "C9BD5522D88F42DCAB06472370E5254C": {
        "titleEnglish": "Against the Heresy of One Noetus",
        "translationPath": "Fathers/English/Hippolytus_English/Against the Heresy of One Noetus.txt",
        "hasEnglishText": True
    },
    "0CB230F34E754E2197104128D5DA7657": {
        "titleEnglish": "Discourse on the Holy Theophany",
        "translationPath": "Fathers/English/Hippolytus_English/Discourse on the Holy Theophany.txt",
        "hasEnglishText": True
    },
    "B45104619E7048E9BF18E42B3A3FB4C0": {
        "titleEnglish": "Discourse on the End of the World and Antichrist",
        "translationPath": "Fathers/English/Hippolytus_English/Discourse on the End of the World.txt",
        "hasEnglishText": True
    },
    "896DCB6A41594018AF82CD4A00318E9B": {
        "titleEnglish": "Canons of Hippolytus",
        "translationPath": "Fathers/English/Hippolytus_English/Canons of Hippolytus.txt",
        "hasEnglishText": True
    },
    # Methodius
    "3397DAB17F944F40B18FFDEF3CD7CBD7": {
        "titleEnglish": "Banquet of the Ten Virgins",
        "translationPath": "Fathers/English/Methodius_English/Banquet of the Ten Virgins.txt",
        "hasEnglishText": True
    },
    "6DFA9B0A78C64209B44F2CB25ACCD44A": {
        "titleEnglish": "From the Discourse on the Resurrection",
        "translationPath": "Fathers/English/Methodius_English/From the Discourse on the Resurrection.txt",
        "hasEnglishText": True
    },
    "0FD443DDE05B43AA878187356FE55D29": {
        "titleEnglish": "Extracts from the Work on Things Created",
        "translationPath": "Fathers/English/Methodius_English/Extracts from the Work on Things Created.txt",
        "hasEnglishText": True
    },
    "910FBBACBECD4735AF15D6C719150402": {
        "titleEnglish": "Oration Concerning Simeon and Anna",
        "translationPath": "Fathers/English/Methodius_English/Oration Concerning Simeon and Anna.txt",
        "hasEnglishText": True
    },
    "DC9BEEC40FA740F78C9ACF8893B4BB68": {
        "titleEnglish": "Oration on the Palms",
        "translationPath": "Fathers/English/Methodius_English/Oration on the Palms.txt",
        "hasEnglishText": True
    },
    "C1422A8C467642C5BF2412171E36A845": {
        "titleEnglish": "Fragments on the Cross and Passion",
        "translationPath": "Fathers/English/Methodius_English/Fragments on the Cross and Passion.txt",
        "hasEnglishText": True
    },
    # Gregory Thaumaturgus
    "A50B75F38287498BBAF05979260D1D86": {
        "titleEnglish": "Oration and Panegyric to Origen",
        "translationPath": "Fathers/English/Gregory_Thaumaturgus_English/Oration and Panegyric to Origen.txt",
        "hasEnglishText": True
    },
    "005891FAEBF14F62B5BACDFD4BDEAEBB": {
        "titleEnglish": "Canonical Epistle",
        "translationPath": "Fathers/English/Gregory_Thaumaturgus_English/Canonical Epistle.txt",
        "hasEnglishText": True
    },
    "55EA1E0F6AF149E684F3340EA24D6CC7": {
        "titleEnglish": "Metaphrase of Ecclesiastes",
        "translationPath": "Fathers/English/Gregory_Thaumaturgus_English/Metaphrase of Ecclesiastes.txt",
        "hasEnglishText": True
    },
    "822544DD2721450B85E6C53FA88D0F8B": {
        "titleEnglish": "Declaration of Faith",
        "translationPath": "Fathers/English/Gregory_Thaumaturgus_English/Declaration of Faith.txt",
        "hasEnglishText": True
    },
    "504F5E8FF22540219ECE1BA9B7AFEAB4": {
        "titleEnglish": "Sectional Confession of Faith",
        "translationPath": "Fathers/English/Gregory_Thaumaturgus_English/Sectional Confession of Faith.txt",
        "hasEnglishText": True
    },
    "3D135AA132F94DB7A2A9B36D8E41EDAC": {
        "titleEnglish": "On the Subject of the Soul",
        "translationPath": "Fathers/English/Gregory_Thaumaturgus_English/On the Subject of the Soul.txt",
        "hasEnglishText": True
    },
    "A19FA6D231254CDBB69CBC8AF622EB32": {
        "titleEnglish": "Four Homilies",
        "translationPath": "Fathers/English/Gregory_Thaumaturgus_English/Four Homilies.txt",
        "hasEnglishText": True
    },
    # Clement of Rome
    "7D496C6BE281476A925420E57428172E": {
        "titleEnglish": "The First Epistle of Clement",
        "translationPath": "Fathers/English/Clement_Rome_English/The First Epistle of Clement.txt",
        "hasEnglishText": True
    },
    "2CAB123D6715479BB45BBFF0AA0F32E1": {
        "titleEnglish": "Recognitions of Clement",
        "translationPath": "Fathers/English/Clement_Rome_English/Recognitions of Clement.txt",
        "hasEnglishText": True
    },
    "68137849291C4219B882D8A4A35CA032": {
        "titleEnglish": "The Clementine Homilies",
        "translationPath": "Fathers/English/Clement_Rome_English/The Clementine Homilies.txt",
        "hasEnglishText": True
    },
    # Ignatius
    "08EEB1C6A3164E6A8E8C4C188CDC3CA9": {
        "titleEnglish": "Spurious Epistles of Ignatius",
        "translationPath": "Fathers/English/Ignatius_English/Spurious Epistles of Ignatius.txt",
        "hasEnglishText": True
    },
    "4AB4D1FB908941469769284322BBFF30": {
        "titleEnglish": "Martyrdom of Ignatius",
        "translationPath": "Fathers/English/Ignatius_English/Martyrdom of Ignatius.txt",
        "hasEnglishText": True
    },
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

print(f"Total Batch 14 works linked: {updated_count}")
