import os, re

SRC_FILE = "Fathers/English/Chrysostom_English/On the Priesthood and Selected Treatises.txt"
OUT_DIR = "Fathers/English/Chrysostom_English"

with open(SRC_FILE, "r", encoding="utf-8", errors="replace") as f:
    lines = f.readlines()

print(f"Total lines in {SRC_FILE}: {len(lines)}")

# Define sections by (start_line_1_based, end_line_1_based, filename, title, clavis)
sections = [
    (9, 4353, "On the Priesthood.txt", "On the Priesthood", "CPG-4316"),
    (4354, 6593, "An Exhortation to Theodore After His Fall.txt", "An Exhortation to Theodore After His Fall", "CPG-4305"),
    (6594, 7239, "Letter to a Young Widow.txt", "Letter to a Young Widow", "CPG-4314"),
    (7240, 7854, "Homily on S. Ignatius.txt", "Homily on S. Ignatius", "CPG-4351"),
    (7855, 8112, "Homily on S. Babylas.txt", "Homily on S. Babylas", "CPG-4347"),
    (8113, 8974, "Homily Concerning Lowliness of Mind.txt", "Homily Concerning Lowliness of Mind", "CPG-4385"),
    (8975, 10050, "Instructions to Catechumens.txt", "Instructions to Catechumens", "CPG-4460"),
    (10051, 11759, "Three Homilies Concerning the Power of Demons.txt", "Three Homilies Concerning the Power of Demons", "CPG-4332"),
    (11760, 12375, "Homily on the Passage 'Father if it be possible'.txt", "Homily on the Passage 'Father if it be possible'", "CPG-4369"),
    (12376, 13220, "Homily on the Paralytic Let Down Through the Roof.txt", "Homily on the Paralytic Let Down Through the Roof", "CPG-4370"),
    (13221, 14028, "Homily on the Passage 'If Thine Enemy Hunger Feed Him'.txt", "Homily on the Passage 'If Thine Enemy Hunger Feed Him'", "CPG-4375"),
    (14029, 14661, "Homily Against Publishing the Errors of the Brethren.txt", "Homily Against Publishing the Errors of the Brethren", "CPG-4389"),
    (14662, 16254, "Two Homilies on Eutropius.txt", "Two Homilies on Eutropius", "CPG-4392, CPG-4393"),
    (16255, 17449, "Treatise That No One Can Harm the Man Who Does Not Injure Himself.txt", "Treatise That No One Can Harm the Man Who Does Not Injure Himself", "CPG-4400"),
    (17450, 18854, "Letters to Olympias.txt", "Letters to Olympias", "CPG-4405"),
    (18855, 19377, "Correspondence with Pope Innocent I.txt", "Correspondence with Pope Innocent I", "CPG-4402, CPG-4403"),
    (19378, 34361, "Homilies on the Statues.txt", "Homilies on the Statues", "CPG-4330"),
]

def clean_lines(slice_lines):
    # Strip CCEL url markers if any, trailing whitespace
    out = []
    for line in slice_lines:
        if "file:///ccel/" in line or "/ccel/schaff/" in line:
            continue
        out.append(line)
    # Strip trailing blank lines
    while out and not out[-1].strip():
        out.pop()
    return out

for start, end, filename, title, clavis in sections:
    sec_lines = lines[start-1:end]
    cleaned = clean_lines(sec_lines)
    header = f"""# source: Fathers/English/NPNF1/Volume IX.   On the Priesthood, Ascetic Treatises, Select Homilies and Letters, Homilies on the Statutes
# series: NPNF1
# volume: Volume IX
# father: Chrysostom
# work: {title}
# clavis: {clavis}
# extracted: 2026-09-25
# note: Public-domain Stephens / Schaff English translation.
"""
    dest_path = os.path.join(OUT_DIR, filename)
    with open(dest_path, "w", encoding="utf-8") as out_f:
        out_f.write(header)
        out_f.writelines(cleaned)
        out_f.write("\n")
    print(f"Extracted {filename} ({len(cleaned)} lines)")

# Delete the monolithic file
os.remove(SRC_FILE)
print(f"Deleted monolithic file {SRC_FILE}")
