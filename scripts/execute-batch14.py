import os

# 1. Athenagoras
ath_src = "Fathers/English/Athenagoras_English/Writings of Athenagoras.txt"
with open(ath_src, "r", encoding="utf-8", errors="replace") as f:
    ath_lines = f.readlines()

plea_header = """# source: Fathers/English/ANF/Volume II.   Fathers of the Second Century
# series: ANF
# volume: Volume II
# father: Athenagoras
# work: A Plea for the Christians
# clavis: CPG-1070
# extracted: 2026-09-25
# note: Public-domain Dods / Schaff English translation.
"""
with open("Fathers/English/Athenagoras_English/A Plea for the Christians.txt", "w", encoding="utf-8") as f:
    f.write(plea_header)
    f.writelines(ath_lines[202:2373]) # line 203 to 2373

res_header = """# source: Fathers/English/ANF/Volume II.   Fathers of the Second Century
# series: ANF
# volume: Volume II
# father: Athenagoras
# work: On the Resurrection of the Dead
# clavis: CPG-1071
# extracted: 2026-09-25
# note: Public-domain Dods / Schaff English translation.
"""
with open("Fathers/English/Athenagoras_English/On the Resurrection of the Dead.txt", "w", encoding="utf-8") as f:
    f.write(res_header)
    f.writelines(ath_lines[2373:3576]) # line 2374 to 3576

os.remove(ath_src)
print("Athenagoras extracted and monolithic file deleted.")

# 2. Novatian & Pseudo-Cyprian (On the Jewish Meats.txt)
nov_src = "Fathers/English/Novatian_English/On the Jewish Meats.txt"
with open(nov_src, "r", encoding="utf-8", errors="replace") as f:
    nov_lines = f.readlines()

meats_header = """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: Novatian
# work: On the Jewish Meats
# clavis: CPL-68
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation.
"""
with open("Fathers/English/Novatian_English/On the Jewish Meats.txt", "w", encoding="utf-8") as f:
    f.write(meats_header)
    f.writelines(nov_lines[10:512])

agn_nov_header = """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: Pseudo-Cyprian (Anonymous)
# work: Treatise Against the Heretic Novatian
# clavis: CPL-76
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation.
"""
with open("Fathers/English/Novatian_English/Treatise Against the Heretic Novatian.txt", "w", encoding="utf-8") as f:
    f.write(agn_nov_header)
    f.writelines(nov_lines[629:1301])

rebapt_header = """# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: Pseudo-Cyprian (Anonymous)
# work: Treatise on Re-Baptism
# clavis: CPL-59
# extracted: 2026-09-25
# note: Public-domain Wallis / Schaff English translation.
"""
with open("Fathers/English/Cyprian_English/Treatise on Re-Baptism.txt", "w", encoding="utf-8") as f:
    f.write(rebapt_header)
    f.writelines(nov_lines[1346:2390])

print("Novatian / Pseudo-Cyprian extracted and cleaned.")

# 3. Hippolytus Extant Works and Fragments
hip_src = "Fathers/English/Hippolytus_English/Extant Works and Fragments.txt"
with open(hip_src, "r", encoding="utf-8", errors="replace") as f:
    hip_lines = f.readlines()

hip_sections = [
    (1618, 3870, "Commentary on Daniel.txt", "Commentary on Daniel", "CPG-1873"),
    (4322, 5926, "Treatise on Christ and Antichrist.txt", "Treatise on Christ and Antichrist", "CPG-1872"),
    (5926, 6331, "Expository Treatise Against the Jews.txt", "Expository Treatise Against the Jews", "CPG-1914"),
    (6331, 7210, "Against the Heresy of One Noetus.txt", "Against the Heresy of One Noetus", "CPG-1902"),
    (7653, 8021, "Discourse on the Holy Theophany.txt", "Discourse on the Holy Theophany", "CPG-1917"),
    (8463, 10174, "Discourse on the End of the World.txt", "Discourse on the End of the World and Antichrist", "CPG-1910"),
    (10174, 10540, "Canons of Hippolytus.txt", "Canons of Hippolytus", "CPG-[1932]"),
]

for start, end, fn, title, clavis in hip_sections:
    header = f"""# source: Fathers/English/ANF/Volume V.   The Fathers of the Third Century
# series: ANF
# volume: Volume V
# father: Hippolytus
# work: {title}
# clavis: {clavis}
# extracted: 2026-09-25
# note: Public-domain Salmond / Schaff English translation.
"""
    with open(os.path.join("Fathers/English/Hippolytus_English", fn), "w", encoding="utf-8") as f:
        f.write(header)
        f.writelines(hip_lines[start:end])
    print(f"Extracted Hippolytus {fn}")

os.remove(hip_src)
print("Hippolytus extracted and monolithic file deleted.")

# 4. Methodius
anf6_src = "Fathers/English/ANF/Volume VI.   The Fathers of the Third Century"
with open(anf6_src, "r", encoding="utf-8", errors="replace") as f:
    anf6_lines = f.readlines()

res_m_header = """# source: Fathers/English/ANF/Volume VI.   The Fathers of the Third Century
# series: ANF
# volume: Volume VI
# father: Methodius
# work: From the Discourse on the Resurrection
# clavis: CPG-1812
# extracted: 2026-09-25
# note: Public-domain Clark / Schaff English translation.
"""
with open("Fathers/English/Methodius_English/From the Discourse on the Resurrection.txt", "w", encoding="utf-8") as f:
    f.write(res_m_header)
    f.writelines(anf6_lines[34502:35955])

creat_header = """# source: Fathers/English/ANF/Volume VI.   The Fathers of the Third Century
# series: ANF
# volume: Volume VI
# father: Methodius
# work: Extracts from the Work on Things Created
# clavis: CPG-1817
# extracted: 2026-09-25
# note: Public-domain Clark / Schaff English translation.
"""
with open("Fathers/English/Methodius_English/Extracts from the Work on Things Created.txt", "w", encoding="utf-8") as f:
    f.write(creat_header)
    f.writelines(anf6_lines[35955:36235])

palms_header = """# source: Fathers/English/ANF/Volume VI.   The Fathers of the Third Century
# series: ANF
# volume: Volume VI
# father: Methodius
# work: Oration on the Palms
# clavis: CPG-1828
# extracted: 2026-09-25
# note: Public-domain Clark / Schaff English translation.
"""
with open("Fathers/English/Methodius_English/Oration on the Palms.txt", "w", encoding="utf-8") as f:
    f.write(palms_header)
    f.writelines(anf6_lines[37370:37837])

frag_header = """# source: Fathers/English/ANF/Volume VI.   The Fathers of the Third Century
# series: ANF
# volume: Volume VI
# father: Methodius
# work: Fragments on the Cross and Passion
# clavis: CPG-1826
# extracted: 2026-09-25
# note: Public-domain Clark / Schaff English translation.
"""
with open("Fathers/English/Methodius_English/Fragments on the Cross and Passion.txt", "w", encoding="utf-8") as f:
    f.write(frag_header)
    f.writelines(anf6_lines[37837:38234])

print("Methodius extracted and cleaned.")
