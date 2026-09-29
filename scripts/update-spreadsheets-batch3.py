#!/usr/bin/env python3
"""
Update sweep-titles-english.xlsx and sweep-titles-english-deepsearch.xlsx for Batch 3 (Ambrose).
"""

import openpyxl

files = [
    "sweep-titles-english.xlsx",
    "sweep-titles-english-deepsearch.xlsx"
]

UPDATES_BY_CLAVIS = {
    "CPL-159": {
        "status": "attached",
        "source": "Catholic University of America Patristic Studies IX (1925, tr. Sister Mary Dolorosa Mannix)",
        "note": "Extracted and attached to Fathers/English/Ambrose_English/On the Death of Theodosius.txt",
    },
    "CPL-158": {
        "status": "rights-unclear",
        "source": "CUA Patristic Studies 58 (1940, tr. Sister Mary Aloysia Kelly); CUA FOTC 22 (1953, tr. Roy J. Deferrari)",
        "note": "Modern copyright; omitted from NPNF2-10 (cf. translator preface). No public domain translation exists.",
    },
    "CPL-154": {
        "status": "attached",
        "source": "SPCK (1919, tr. T. Thompson, ed. J.H. Srawley)",
        "note": "Extracted and attached to Fathers/English/Ambrose_English/Concerning the Sacraments.txt",
    },
    "CPL-160": {
        "status": "attached",
        "source": "NPNF2-10, pp. 411-473 / Oxford Library of Fathers 45 (1881)",
        "note": "Cleaned and attached to Fathers/English/Ambrose_English/Letters.txt",
    },
    "CPL-155": {
        "status": "attached",
        "source": "NPNF2-10, pp. 317-325; SPCK 1919",
        "note": "Isolated 1:1 in Fathers/English/Ambrose_English/On the Mysteries.txt",
    },
    "CPL-156": {
        "status": "attached",
        "source": "NPNF2-10, pp. 329-359",
        "note": "Isolated 1:1 in Fathers/English/Ambrose_English/Concerning Repentance.txt",
    },
    "CPL-151": {
        "status": "attached",
        "source": "NPNF2-10, pp. 93-158",
        "note": "Isolated 1:1 in Fathers/English/Ambrose_English/On the Holy Spirit.txt",
    },
    "CPL-150": {
        "status": "attached",
        "source": "NPNF2-10, pp. 199-314",
        "note": "Attached to Fathers/English/Ambrose_English/Exposition of the Christian Faith.txt",
    },
    "CPL-144": {
        "status": "attached",
        "source": "NPNF2-10, pp. 1-89",
        "note": "Attached to Fathers/English/Ambrose_English/On the Duties of the Clergy.txt",
    },
    "CPL-146": {
        "status": "attached",
        "source": "NPNF2-10, pp. 391-407",
        "note": "Attached to Fathers/English/Ambrose_English/Concerning Widows.txt",
    },
    "CPL-145": {
        "status": "attached",
        "source": "NPNF2-10, pp. 363-387",
        "note": "Attached to Fathers/English/Ambrose_English/Concerning Virgins.txt",
    },
}

for fname in files:
    print(f"Updating {fname}...")
    wb = openpyxl.load_workbook(fname)
    ws = wb.active
    
    # Headers: Author, Title (Latin/Greek), Title (English), Clavis, Category, Priority, Status, Source, Note, Work ID
    updated_rows = 0
    for row in ws.iter_rows(min_row=2):
        clavis = str(row[3].value or "").strip()
        author = str(row[0].value or "")
        if "ambros" in author.lower() and clavis in UPDATES_BY_CLAVIS:
            info = UPDATES_BY_CLAVIS[clavis]
            row[6].value = info["status"]
            row[7].value = info["source"]
            row[8].value = info["note"]
            updated_rows += 1
            print(f"  Updated row {row[0].row}: {clavis} -> status={info['status']}")

    wb.save(fname)
    print(f"Saved {fname} with {updated_rows} rows updated.\n")

print("Spreadsheet updates completed!")
