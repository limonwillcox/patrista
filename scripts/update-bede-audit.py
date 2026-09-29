#!/usr/bin/env python3
"""
Update sweep-titles-english.xlsx and sweep-titles-english-deepsearch.xlsx for 10 Bede works audited during quality sweep.
- 4 works rescued to 'found' (J.A. Giles 1843/1845 Public Domain)
- 6 works updated to 'rights-unclear' (Modern copyright only: Translated Texts for Historians, Cistercian Studies)
"""

import openpyxl

files = [
    "sweep-titles-english.xlsx",
    "sweep-titles-english-deepsearch.xlsx",
]

UPDATES_BY_WORK_ID = {
    # 4 Public Domain Rescued Works (J.A. Giles 1843/1845)
    "469269B49D2A469BA02988F3A8EFBE8D": { # Epistula ad Egbertum
        "status": "found",
        "source": "J.A. Giles, Historical Works of Venerable Bede, Vol. II (1843/1845)",
        "note": "Letter to Bishop Egbert; Public Domain English translation exists (Giles 1843, pp. 138-155).",
    },
    "E75F5ACC892541BC9874359AC7F27FFD": { # Vita BB. abbatum
        "status": "found",
        "source": "J.A. Giles, Historical Works of Venerable Bede, Vol. II (1843/1845)",
        "note": "Lives of the Abbots of Wearmouth and Jarrow (Benedict, Ceolfrid, etc.); Public Domain (Giles 1843).",
    },
    "D399FDA08D4A42D6B3B062A3021954B1": { # Vita Cuthberti
        "status": "found",
        "source": "J.A. Giles, Historical Works of Venerable Bede, Vol. II (1843/1845)",
        "note": "Life and Miracles of St. Cuthbert (prose); Public Domain English translation (Giles 1843, pp. 1-110).",
    },
    "73ADB9558B88419182D9DEE4822F53D2": { # Vita Sancti Felicis
        "status": "found",
        "source": "J.A. Giles, Historical Works of Venerable Bede, Vol. II (1843/1845)",
        "note": "Life of St. Felix of Nola (prose); Public Domain English translation (Giles 1843, pp. 114-135).",
    },
    # 6 Modern Copyright Protected Works
    "A2AB70D9199B4705A77F7F767574607B": { # Homeliarum euangelii libri ii
        "status": "rights-unclear",
        "source": "Cistercian Studies Series 110-111 (1991, tr. Martin & Hurst)",
        "note": "Homilies on the Gospels (50 homilies); only modern copyrighted translation in Cistercian Studies (1991).",
    },
    "0AEDBEE2F3594A43BA8DB0527DC7FD46": { # In Ezram et Neemiam
        "status": "rights-unclear",
        "source": "Liverpool Translated Texts for Historians 47 (2006, tr. S. DeGregorio)",
        "note": "On Ezra and Nehemiah; only modern copyrighted translation in Liverpool TTH 47 (2006).",
    },
    "0BD369A2B48444DB8BB1BA24F58FAECF": { # In librum Tobiae
        "status": "rights-unclear",
        "source": "Four Courts Press (1997, tr. Sean Connolly)",
        "note": "On Tobit; only modern copyrighted translation in Four Courts Press (1997).",
    },
    "5FAB7E66F1814C998DDFF45F1D81C848": { # In Samuelem
        "status": "rights-unclear",
        "source": "Liverpool Translated Texts for Historians 70 (2019, tr. S. DeGregorio)",
        "note": "On First Samuel; only modern copyrighted translation in Liverpool TTH 70 (2019).",
    },
    "28FE3082401242A3A8DAE63FB15582A8": { # Super Acta Apostolorum
        "status": "rights-unclear",
        "source": "Cistercian Studies Series 117 (1989, tr. Lawrence T. Martin)",
        "note": "Commentary on the Acts of the Apostles; only modern copyrighted translation in Cistercian Studies 117 (1989).",
    },
    "BA8EFE700E41420B9144A30F12F16D0B": { # Super epistulas catholicas
        "status": "rights-unclear",
        "source": "Cistercian Studies Series 82 (1985, tr. David Hurst)",
        "note": "Commentary on the Seven Catholic Epistles; only modern copyrighted translation in Cistercian Studies 82 (1985).",
    },
}

for fname in files:
    print(f"Updating {fname}...")
    wb = openpyxl.load_workbook(fname)
    ws = wb.active
    
    headers = [str(c.value or "").strip() for c in ws[1]]
    status_col = headers.index("Status") + 1
    source_col = headers.index("Source") + 1
    note_col = headers.index("Note") + 1
    work_id_col = headers.index("Work ID") + 1
    
    updated_rows = 0
    for row in range(2, ws.max_row + 1):
        wid = str(ws.cell(row=row, column=work_id_col).value or "").strip()
        if wid in UPDATES_BY_WORK_ID:
            info = UPDATES_BY_WORK_ID[wid]
            ws.cell(row=row, column=status_col).value = info["status"]
            ws.cell(row=row, column=source_col).value = info["source"]
            ws.cell(row=row, column=note_col).value = info["note"]
            updated_rows += 1
            print(f"  Row {row} [{wid}]: status -> {info['status']}")
            
    wb.save(fname)
    print(f"Saved {fname} with {updated_rows} rows updated.\n")

print("Bede audit updates complete!")
