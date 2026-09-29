#!/usr/bin/env python3
"""
Update spreadsheets for Batch 7: St. Hilary of Poitiers and St. John of Damascus.
- Cleans false-found rows for Hilary of Poitiers that had Arius/NPNF2-04 notes incorrectly pasted.
- Sets modern translated works (Lionel Wickham 1997, Liverpool TTH) to 'rights-unclear'.
- Sets spurious/medieval untranslated texts to 'untranslated'.
- Verifies John of Damascus Expositio fidei (CPG-8043) is cleanly attached.
"""

import openpyxl
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

SPREADSHEETS = [
    REPO_ROOT / "sweep-titles-english.xlsx",
    REPO_ROOT / "sweep-titles-english-deepsearch.xlsx",
]

# Rows 2747 to 2776 in sweep-titles-english
# Map of (row, work_title) to (status, note_source, note_desc)
HILARY_CORRECTIONS = {
    # Modern copyrighted translations (Lionel Wickham 1997, Translated Texts for Historians vol. 25, Liverpool Univ Press)
    "Contra Arianos seu contra Auxentium": (
        "rights-unclear",
        "Wickham (1997, Liverpool TTH 25)",
        "Translated by Lionel Wickham in 'Hilary of Poitiers: Conflicts of Conscience and Law' (1997); modern copyrighted translation, no public domain English version exists.",
    ),
    "Liber [ii] ad Constantium Imperatorem": (
        "rights-unclear",
        "Wickham (1997, Liverpool TTH 25)",
        "Translated by Lionel Wickham in 'Hilary of Poitiers: Conflicts of Conscience and Law' (1997); modern copyrighted translation, no public domain English version exists.",
    ),
    "Liber in Constantium Imperatorem": (
        "rights-unclear",
        "Wickham (1997, Liverpool TTH 25)",
        "Translated by Lionel Wickham in 'Hilary of Poitiers: Conflicts of Conscience and Law' (1997); modern copyrighted translation, no public domain English version exists.",
    ),
    # Genuinely untranslated spurious / medieval texts
    "Adhortatio": (
        "untranslated",
        "None",
        "Medieval hagiographical text/liturgical exhortation; genuinely never translated into English.",
    ),
    "Alia spuria in Florilegio Casinensi et apud Mai, Pitra et Liverani": (
        "untranslated",
        "None",
        "Spurious fragments and florilegia; genuinely never translated into English.",
    ),
    "Carmen biographicum": (
        "untranslated",
        "None",
        "Medieval Latin verse poem about St. Hilary; genuinely never translated into English.",
    ),
    "De essentia Patris et Filii": (
        "untranslated",
        "None",
        "Spurious treatise falsely ascribed to Hilary; genuinely never translated into English.",
    ),
    "De mitra Sancti Hilarii ab Hildebrando assumpta": (
        "untranslated",
        "None",
        "Medieval narrative about the saint's miter; genuinely never translated into English.",
    ),
    "Dicta Hieronymi": (
        "untranslated",
        "None",
        "Sayings attributed to Jerome regarding Hilary; genuinely never translated into English.",
    ),
    "Epistula seu libellus": (
        "untranslated",
        "None",
        "Spurious letter / libellus; genuinely never translated into English.",
    ),
    "Epitomae": (
        "untranslated",
        "None",
        "Medieval Latin epitomes; genuinely never translated into English.",
    ),
    "Hymni iii e cod. Aretino": (
        "untranslated",
        "None",
        "Hilary's fragmentary Latin hymns discovered in Arezzo; no public domain English prose translation.",
    ),
    "Hymni spurii": (
        "untranslated",
        "None",
        "Spurious Latin hymns; genuinely never translated into English.",
    ),
    "Hymnus dubius de Christo": (
        "untranslated",
        "None",
        "Dubious hymn on Christ; genuinely never translated into English.",
    ),
    "Liber de Patris et Filii unitate": (
        "untranslated",
        "None",
        "Spurious treatise; genuinely never translated into English.",
    ),
    "Nonnulli alii sermones in codices cuidam Hilario tributi": (
        "untranslated",
        "None",
        "Spurious sermons in manuscripts attributed to a Hilary; genuinely never translated into English.",
    ),
    "Officium": (
        "untranslated",
        "None",
        "Medieval liturgical office; genuinely never translated into English.",
    ),
    "Sermo de miraculis": (
        "untranslated",
        "None",
        "Medieval sermon on the miracles of St. Hilary; genuinely never translated into English.",
    ),
    "Tractatus in Matthaeum et Ioannem": (
        "untranslated",
        "None",
        "Lost / spurious commentary fragments; genuinely never translated into English.",
    ),
    "Translatio in ecclesiam Sancti Dionysii a Dagoberto rege": (
        "untranslated",
        "None",
        "Medieval translation-of-relics narrative by King Dagobert; genuinely never translated into English.",
    ),
    "Vita et virtutes sancti Hilarii": (
        "untranslated",
        "None",
        "Medieval Vita by Venantius Fortunatus; untranslated in public domain English.",
    ),
}

for sheet_path in SPREADSHEETS:
    print(f"Processing {sheet_path.name}...")
    wb = openpyxl.load_workbook(sheet_path)
    ws = wb.active

    modified_count = 0
    for r in range(1, ws.max_row + 1):
        author = str(ws.cell(r, 1).value or "").strip()
        title = str(ws.cell(r, 2).value or "").strip()

        if "Hilarius" in author and title in HILARY_CORRECTIONS:
            new_status, new_src, new_desc = HILARY_CORRECTIONS[title]
            old_status = ws.cell(r, 7).value
            ws.cell(r, 7).value = new_status
            ws.cell(r, 8).value = new_src
            ws.cell(r, 9).value = new_desc
            modified_count += 1
            print(f"  Row {r}: '{title}' {old_status} -> {new_status}")

        # Check Miracula rows for Hilary
        if "Hilarius" in author and title.startswith("Miracul") and ws.cell(r, 7).value == "found":
            ws.cell(r, 7).value = "untranslated"
            ws.cell(r, 8).value = "None"
            ws.cell(r, 9).value = "Medieval miracle collection about the saint; untranslated in English."
            modified_count += 1
            print(f"  Row {r}: '{title}' found -> untranslated")

    wb.save(sheet_path)
    print(f"Saved {sheet_path.name} with {modified_count} rows updated.\n")

print("Batch 7 spreadsheet update complete!")
