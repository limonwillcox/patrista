#!/usr/bin/env python3
"""
Update sweep-titles-english.xlsx and sweep-titles-english-deepsearch.xlsx for Batch 4 (St. Basil the Great).
"""

import openpyxl

files = [
    "sweep-titles-english.xlsx",
    "sweep-titles-english-deepsearch.xlsx"
]

UPDATES_BY_CLAVIS = {
    "CPG-2867": {
        "status": "attached",
        "source": "Yale Studies in English XV (1902, tr. F.M. Padelford)",
        "note": "Extracted and attached to Fathers/English/Basil_English/Address to Young Men on Reading Greek Literature.txt",
    },
    "CPG-2900": {
        "status": "attached",
        "source": "NPNF2-08, pp. 109-327 (tr. Blomfield Jackson)",
        "note": "Cleaned and attached to Fathers/English/Basil_English/Letters.txt",
    },
    "CPG-3416": {
        "status": "attached",
        "source": "NPNF2-08, pp. 177-178 (Letter 92)",
        "note": "Extracted and attached to Fathers/English/Basil_English/Letter to the Italians and Gauls.txt",
    },
    "CPG-3196": {
        "status": "attached",
        "source": "NPNF2-08, pp. 137-141 (Letter 38)",
        "note": "Extracted and attached to Fathers/English/Basil_English/Letter to His Brother Peter on the Difference Between Ousia and Hypostasis.txt",
    },
    "CPG-2914": {
        "status": "attached",
        "source": "NPNF2-08, pp. 231-233 (Letter 189)",
        "note": "Extracted and attached to Fathers/English/Basil_English/Against Those Who Calumniate Us as Saying Three Gods.txt",
    },
    "CPG-2835": {
        "status": "attached",
        "source": "NPNF2-08, pp. 51-107",
        "note": "Corrected and attached to Fathers/English/Basil_English/Homilies on the Hexaemeron.txt (replaces prolegomena dump)",
    },
}

for fname in files:
    print(f"Updating {fname}...")
    wb = openpyxl.load_workbook(fname)
    ws = wb.active
    
    updated_rows = 0
    for row in ws.iter_rows(min_row=2):
        clavis = str(row[3].value or "").strip()
        author = str(row[0].value or "")
        title = str(row[1].value or "")
        
        if "basil" in author.lower():
            if clavis in UPDATES_BY_CLAVIS:
                info = UPDATES_BY_CLAVIS[clavis]
                row[6].value = info["status"]
                row[7].value = info["source"]
                row[8].value = info["note"]
                updated_rows += 1
                print(f"  Updated row {row[0].row}: {clavis} -> status={info['status']}")
            elif "julian" in title.lower() or "iulian" in title.lower():
                row[6].value = "attached"
                row[7].value = "NPNF2-08, p. 325 (Letter 360)"
                row[8].value = "Extracted and attached to Fathers/English/Basil_English/Letters Between Emperor Julian and Basil.txt"
                updated_rows += 1
                print(f"  Updated row {row[0].row}: Julian/Basil -> status=attached")
            elif "optimum" in title.lower():
                row[6].value = "attached"
                row[7].value = "NPNF2-08, pp. 297-300 (Letter 260)"
                row[8].value = "Extracted and attached to Fathers/English/Basil_English/Letter to Bishop Optimus.txt"
                updated_rows += 1
                print(f"  Updated row {row[0].row}: Optimus -> status=attached")

    wb.save(fname)
    print(f"Saved {fname} with {updated_rows} rows updated.\n")

print("Spreadsheet updates completed!")
