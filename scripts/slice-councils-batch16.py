import os

src_file = "Fathers/English/Councils_English/The Seven Ecumenical Councils.txt"
out_dir = "Fathers/English/Councils_English"

with open(src_file, "r", encoding="utf-8", errors="replace") as f:
    lines = f.readlines()

print(f"Total lines in {src_file}: {len(lines)}")

councils = [
    (1, 1918, "General Introduction to the Councils.txt", "General Introduction and Apostolic Canons"),
    (1919, 13389, "First Ecumenical Council - Nicea I (325).txt", "First Ecumenical Council - Nicea I (325)"),
    (13390, 15540, "Second Ecumenical Council - Constantinople I (381).txt", "Second Ecumenical Council - Constantinople I (381)"),
    (15541, 19243, "Third Ecumenical Council - Ephesus (431).txt", "Third Ecumenical Council - Ephesus (431)"),
    (19244, 23165, "Fourth Ecumenical Council - Chalcedon (451).txt", "Fourth Ecumenical Council - Chalcedon (451)"),
    (23166, 24926, "Fifth Ecumenical Council - Constantinople II (553).txt", "Fifth Ecumenical Council - Constantinople II (553)"),
    (24927, 39267, "Sixth Ecumenical Council and Trullo (680-692).txt", "Sixth Ecumenical Council and Trullo (680-692)"),
    (39268, 46388, "Seventh Ecumenical Council - Nicea II (787).txt", "Seventh Ecumenical Council - Nicea II (787)"),
]

def clean_lines(slice_lines):
    out = []
    for line in slice_lines:
        if "file:///ccel/" in line or "/ccel/schaff/" in line:
            continue
        out.append(line)
    while out and not out[-1].strip():
        out.pop()
    return out

for start, end, fn, title in councils:
    sec_lines = lines[start-1:end]
    cleaned = clean_lines(sec_lines)
    header = f"""# source: Fathers/English/NPNF2/Volume XIV.   The Seven Ecumenical Councils
# series: NPNF2
# volume: Volume XIV
# father: Ecumenical Councils
# work: {title}
# extracted: 2026-09-25
# note: Public-domain Percival / Schaff English translation.
"""
    dest_path = os.path.join(out_dir, fn)
    with open(dest_path, "w", encoding="utf-8") as out:
        out.write(header)
        out.writelines(cleaned)
        out.write("\n")
    print(f"Extracted {fn} ({len(cleaned)} lines)")

os.remove(src_file)
print(f"Deleted monolithic file {src_file}")
