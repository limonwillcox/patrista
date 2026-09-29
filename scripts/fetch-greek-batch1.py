#!/usr/bin/env python3
"""Fetch, parse, and structure Greek texts for Apostolic Fathers & Early Apologists (Batch 1).
Source: OpenGreekAndLatin / First1KGreek (Public Domain critical texts / pre-1928 editions)
"""

import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

GREEK_BATCH_1 = [
    {
        "father": "Clement of Rome",
        "author_latin": "Clemens Romanus papa martyr Chersonae",
        "work": "The First Epistle of Clement",
        "clavis": "CPG-1001",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1271/tlg001/tlg1271.tlg001.1st1K-grc1.xml",
        "target": "Fathers/Greek/Clement_Rome_Greek/The First Epistle of Clement.txt",
    },
    {
        "father": "Clement of Rome",
        "author_latin": "Clemens Romanus papa martyr Chersonae",
        "work": "The Second Epistle of Clement",
        "clavis": "CPG-1002",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1271/tlg002/tlg1271.tlg002.1st1K-grc1.xml",
        "target": "Fathers/Greek/Clement_Rome_Greek/The Second Epistle of Clement.txt",
    },
    {
        "father": "Ignatius of Antioch",
        "author_latin": "Ignatius episcopus Antiochenus martyr",
        "work": "The Seven Epistles of Ignatius",
        "clavis": "CPG-1025",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml",
        "target": "Fathers/Greek/Ignatius_Greek/Epistles of Ignatius.txt",
    },
    {
        "father": "Polycarp",
        "author_latin": "Polycarpus Smyrnensis",
        "work": "Epistle to the Philippians",
        "clavis": "CPG-1040",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1622/tlg001/tlg1622.tlg001.1st1K-grc1.xml",
        "target": "Fathers/Greek/Polycarp_Greek/Epistle to the Philippians.txt",
    },
    {
        "father": "Polycarp",
        "author_latin": "Polycarpus Smyrnensis",
        "work": "Martyrdom of Polycarp",
        "clavis": "CPG-1041",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1484/tlg001/tlg1484.tlg001.1st1K-grc1.xml",
        "target": "Fathers/Greek/Polycarp_Greek/Martyrdom of Polycarp.txt",
    },
    {
        "father": "Apostolic Fathers",
        "author_latin": "Apostoli",
        "work": "The Didache",
        "clavis": "CPG-1735",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1311/tlg001/tlg1311.tlg001.1st1K-grc1.xml",
        "target": "Fathers/Greek/Apostolic_Greek/The Didache.txt",
    },
    {
        "father": "Barnabas",
        "author_latin": "Barnabas apostolus",
        "work": "The Epistle of Barnabas",
        "clavis": "CPG-1050",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1216/tlg001/tlg1216.tlg001.opp-grc1.xml",
        "target": "Fathers/Greek/Barnabas_Greek/The Epistle of Barnabas.txt",
    },
    {
        "father": "Hermas",
        "author_latin": "Hermas",
        "work": "The Pastor of Hermas",
        "clavis": "CPG-1052",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1419/tlg001/tlg1419.tlg001.1st1K-grc1.xml",
        "target": "Fathers/Greek/Hermas_Greek/The Pastor of Hermas.txt",
    },
    {
        "father": "Mathetes",
        "author_latin": "Anonymus ad Diognetum",
        "work": "Epistle to Diognetus",
        "clavis": "CPG-1112",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0646/tlg004/tlg0646.tlg004.1st1K-grc1.xml",
        "target": "Fathers/Greek/Mathetes_Greek/Epistle to Diognetus.txt",
    },
    {
        "father": "Justin Martyr",
        "author_latin": "Iustinus Martyr",
        "work": "The First Apology",
        "clavis": "CPG-1074",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0645/tlg001/tlg0645.tlg001.1st1K-grc1.xml",
        "target": "Fathers/Greek/Justin_Greek/The First Apology.txt",
    },
    {
        "father": "Justin Martyr",
        "author_latin": "Iustinus Martyr",
        "work": "The Second Apology",
        "clavis": "CPG-1075",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0645/tlg002/tlg0645.tlg002.perseus-grc2.xml",
        "target": "Fathers/Greek/Justin_Greek/The Second Apology.txt",
    },
    {
        "father": "Justin Martyr",
        "author_latin": "Iustinus Martyr",
        "work": "Dialogue with Trypho",
        "clavis": "CPG-1076",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0645/tlg003/tlg0645.tlg003.perseus-grc2.xml",
        "target": "Fathers/Greek/Justin_Greek/Dialogue with Trypho.txt",
    },
    {
        "father": "Athenagoras",
        "author_latin": "Athenagoras",
        "work": "A Plea for the Christians",
        "clavis": "CPG-1079",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1205/tlg001/tlg1205.tlg001.perseus-grc1.xml",
        "target": "Fathers/Greek/Athenagoras_Greek/A Plea for the Christians.txt",
    },
    {
        "father": "Athenagoras",
        "author_latin": "Athenagoras",
        "work": "The Resurrection of the Dead",
        "clavis": "CPG-1080",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1205/tlg002/tlg1205.tlg002.perseus-grc1.xml",
        "target": "Fathers/Greek/Athenagoras_Greek/The Resurrection of the Dead.txt",
    },
    {
        "father": "Tatian",
        "author_latin": "Tatianus",
        "work": "Address to the Greeks",
        "clavis": "CPG-1104",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1766/tlg001/tlg1766.tlg001.perseus-grc1.xml",
        "target": "Fathers/Greek/Tatian_Greek/Address to the Greeks.txt",
    },
    {
        "father": "Theophilus of Antioch",
        "author_latin": "Theophilus Antiochenus",
        "work": "To Autolycus",
        "clavis": "CPG-1107",
        "url": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg1725/tlg001/tlg1725.tlg001.perseus-grc1.xml",
        "target": "Fathers/Greek/Theophilus_Greek/To Autolycus.txt",
    },
]


def parse_tei_greek(raw_xml: str, title: str) -> str:
    root = ET.fromstring(raw_xml)
    ns = {"tei": "http://www.tei-c.org/ns/1.0"}

    # Strip apparatus, notes, bibl, del
    for tag in ("note", "bibl", "ref", "del", "teiHeader"):
        for el in root.findall(f".//tei:{tag}", ns):
            el.clear()
            el.text = ""
            el.tail = ""

    body = root.find(".//tei:body", ns)
    if body is None:
        body = root.find(".//{http://www.tei-c.org/ns/1.0}body")
    if body is None:
        raise ValueError("Could not find <body> element in TEI XML")

    # Look for top-level division (e.g. books or textpart)
    # If there are books, iterate books -> chapters
    books = body.findall('.//tei:div[@subtype="book"]', ns) or body.findall('.//tei:div[@type="book"]', ns)
    sections = []

    if books:
        for book in books:
            b_num = book.attrib.get("n", "")
            b_head = book.find(".//tei:head", ns)
            b_title = " ".join("".join(b_head.itertext()).split()) if b_head is not None else ""
            b_label = f"Book {b_num}" if b_num else "Book"
            if b_title:
                b_label = f"{b_label}: {b_title}"

            sections.append(f"=== {b_label} ===")

            chapters = book.findall('.//tei:div[@subtype="chapter"]', ns) or book.findall('.//tei:div[@type="textpart"]', ns)
            if not chapters:
                chapters = [book]

            for ch in chapters:
                c_num = ch.attrib.get("n", "")
                ps = ch.findall(".//tei:p", ns)
                p_texts = []
                if ps:
                    for p in ps:
                        pt = " ".join("".join(p.itertext()).split())
                        if pt:
                            p_texts.append(pt)
                else:
                    pt = " ".join("".join(ch.itertext()).split())
                    if pt:
                        p_texts.append(pt)

                ch_header = f"[{c_num}]" if c_num else ""
                body_text = "\n\n".join(p_texts)
                if ch_header and body_text:
                    sections.append(f"{ch_header}\n{body_text}")
                elif body_text:
                    sections.append(body_text)
    else:
        # Chapters / textparts directly under body
        chapters = body.findall('.//tei:div[@subtype="chapter"]', ns) or body.findall('.//tei:div[@type="textpart"]', ns)
        if not chapters:
            chapters = body.findall(".//tei:div", ns)
        if not chapters:
            chapters = [body]

        for ch in chapters:
            c_num = ch.attrib.get("n", "")
            head = ch.find(".//tei:head", ns)
            head_txt = " ".join("".join(head.itertext()).split()) if head is not None else ""
            ps = ch.findall(".//tei:p", ns)
            p_texts = []
            if ps:
                for p in ps:
                    pt = " ".join("".join(p.itertext()).split())
                    if pt:
                        p_texts.append(pt)
            else:
                pt = " ".join("".join(ch.itertext()).split())
                if pt:
                    p_texts.append(pt)

            label_parts = []
            if c_num:
                label_parts.append(f"Chapter {c_num}")
            if head_txt:
                label_parts.append(head_txt)
            label = " - ".join(label_parts)

            body_text = "\n\n".join(p_texts)
            if label and body_text:
                sections.append(f"[{label}]\n{body_text}")
            elif body_text:
                sections.append(body_text)

    # Clean empty artifacts and whitespace
    clean_sections = [s.strip() for s in sections if s.strip()]
    return "\n\n".join(clean_sections)


def main():
    print(f"Starting Greek Batch 1 extraction ({len(GREEK_BATCH_1)} works)...")
    extracted = 0

    for item in GREEK_BATCH_1:
        target_path = ROOT / item["target"]
        target_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"Fetching: {item['father']} - {item['work']} ({item['clavis']})...")
        cmd = ["curl", "-sL", "--max-time", "30", item["url"]]
        raw_xml = subprocess.check_output(cmd).decode("utf-8", errors="ignore")

        content = parse_tei_greek(raw_xml, item["work"])
        if len(content) < 500:
            print(f"  WARNING: Content suspiciously short ({len(content)} chars)")

        header = [
            f"# source: {item['url']}",
            f"# father: {item['father']}",
            f"# work: {item['work']}",
            f"# clavis: {item['clavis']}",
            "# language: grc",
            "# series: OpenGreekAndLatin / First1KGreek (Public Domain pre-1928 editions)",
            "",
            f"{item['father'].upper()} - {item['work'].upper()}",
            "=" * len(f"{item['father'].upper()} - {item['work'].upper()}"),
            "",
            content,
            "",
        ]

        target_path.write_text("\n".join(header), encoding="utf-8")
        print(f"  Saved -> {item['target']} ({len(content):,} chars, {target_path.stat().st_size:,} bytes)")
        extracted += 1

    print(f"\nGreek Batch 1 complete: {extracted}/{len(GREEK_BATCH_1)} works extracted successfully.")


if __name__ == "__main__":
    main()
