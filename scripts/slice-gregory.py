import os, json

greg_file = "Fathers/English/Gregory_English/The Book of Pastoral Rule.txt"
with open(greg_file, "r", encoding="utf-8", errors="replace") as f:
    lines = f.readlines()

print(f"Total lines in {greg_file}: {len(lines)}")

pastoral_lines = lines[:6154]
epistles_lines = lines[6154:22560]

pastoral_header = """# source: Fathers/English/NPNF2/Volume XII.   Leo the Great, Gregory the Great
# series: NPNF2
# volume: Volume XII
# father: Gregory the Great
# work: The Book of Pastoral Rule
# clavis: CPL-1712
# extracted: 2026-09-25
# note: Public-domain Barmby / Schaff English translation.
"""
with open("Fathers/English/Gregory_English/The Book of Pastoral Rule.txt", "w", encoding="utf-8") as out:
    out.write(pastoral_header)
    out.writelines(pastoral_lines[10:]) # skip old header

epistles_header = """# source: Fathers/English/NPNF2/Volume XII.   Leo the Great, Gregory the Great
# series: NPNF2
# volume: Volume XII
# father: Gregory the Great
# work: Selected Epistles
# clavis: CPL-1714
# extracted: 2026-09-25
# note: Public-domain Barmby / Schaff English translation.
"""
with open("Fathers/English/Gregory_English/Selected Epistles.txt", "w", encoding="utf-8") as out:
    out.write(epistles_header)
    out.writelines(epistles_lines)

print(f"Pastoral Rule: {len(pastoral_lines)} lines")
print(f"Selected Epistles: {len(epistles_lines)} lines")

# Link CPL-1714 in works.jsonl
updated_lines = []
with open("data/clavis/works.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("work_id") == "F1182F56677140BBB6998770B3607736":
            data["titleEnglish"] = "Selected Epistles"
            data["translationPath"] = "Fathers/English/Gregory_English/Selected Epistles.txt"
            data["hasEnglishText"] = True
            print("Linked Gregory Registrum epistularum in works.jsonl")
        updated_lines.append(json.dumps(data, ensure_ascii=False) + "\n")

with open("data/clavis/works.jsonl", "w", encoding="utf-8") as f:
    f.writelines(updated_lines)
