#!/usr/bin/env python3
"""Fetch, parse, and structure Greek texts for Batch 2:
Athanasius, Clement of Alexandria, Origen, Gregory of Nazianzus, Basil of Caesarea, and Theodoret.
Source: OpenGreekAndLatin / First1KGreek & Perseus canonical-greekLit (Public Domain critical editions)
"""

import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def parse_tei_greek(raw_xml: str) -> str:
    root = ET.fromstring(raw_xml)
    ns = {"tei": "http://www.tei-c.org/ns/1.0"}

    # Strip apparatus, notes, bibl, del, teiHeader
    for tag in ("note", "bibl", "ref", "del", "teiHeader"):
        for el in root.findall(f".//tei:{tag}", ns):
            el.clear()
            el.text = ""
            el.tail = ""

    body = root.find(".//tei:body", ns)
    if body is None:
        body = root.find(".//{http://www.tei-c.org/ns/1.0}body")
    if body is None:
        return ""

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

    clean_sections = [s.strip() for s in sections if s.strip()]
    return "\n\n".join(clean_sections)


def fetch_url(url: str) -> str:
    cmd = ["curl", "-sL", "--max-time", "60", url]
    return subprocess.check_output(cmd).decode("utf-8", errors="ignore")


def main():
    print("Starting Greek Batch 2 extraction...")

    # 1. Athanasius - On the Incarnation of the Word (CPG-2091)
    p = ROOT / "Fathers/Greek/Athanasius_Greek/On the Incarnation of the Word.txt"
    p.parent.mkdir(parents=True, exist_ok=True)
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2035/tlg002/tlg2035.tlg002.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg2035.tlg002)",
        "# father: Athanasius",
        "# work: On the Incarnation of the Word",
        "# clavis: CPG-2091",
        "# language: grc",
        "",
        "ATHANASIUS - DE INCARNATIONE VERBI",
        "==================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 2. Athanasius - Discourses Against the Arians (CPG-2093) (Orations 1, 2, 3)
    p = ROOT / "Fathers/Greek/Athanasius_Greek/Discourses Against the Arians.txt"
    parts = []
    for i, tlg in enumerate(["tlg130", "tlg131", "tlg132"], 1):
        url = f"https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2035/{tlg}/tlg2035.{tlg}.1st1K-grc1.xml"
        xml = fetch_url(url)
        content = parse_tei_greek(xml)
        parts.append(f"=== DISCOURSE {i} (ORATIO {i} CONTRA ARIANOS) ===\n\n{content}")
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg2035.tlg130-132)",
        "# father: Athanasius",
        "# work: Discourses Against the Arians",
        "# clavis: CPG-2093",
        "# language: grc",
        "",
        "ATHANASIUS - DISCOURSES AGAINST THE ARIANS (ORATIONES CONTRA ARIANOS I-III)",
        "==========================================================================",
        "",
        "\n\n".join(parts),
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 3. Athanasius - Fourth Discourse Against the Arians (CPG-2230)
    p = ROOT / "Fathers/Greek/Athanasius_Greek/Fourth Discourse Against the Arians.txt"
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2035/tlg117/tlg2035.tlg117.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg2035.tlg117)",
        "# father: Athanasius",
        "# work: Fourth Discourse Against the Arians",
        "# clavis: CPG-2230",
        "# language: grc",
        "",
        "ATHANASIUS - FOURTH DISCOURSE AGAINST THE ARIANS (ORATIO IV CONTRA ARIANOS)",
        "==========================================================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 4. Athanasius - Defense of the Nicene Definition (CPG-2120)
    p = ROOT / "Fathers/Greek/Athanasius_Greek/Defense of the Nicene Definition.txt"
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2035/tlg003/tlg2035.tlg003.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg2035.tlg003)",
        "# father: Athanasius",
        "# work: Defense of the Nicene Definition (De Decretis)",
        "# clavis: CPG-2120",
        "# language: grc",
        "",
        "ATHANASIUS - DEFENSE OF THE NICENE DEFINITION (DE DECRETIS NICHAENAE SYNODI)",
        "==========================================================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 5. Clement of Alexandria - Exhortation to the Heathen (CPG-1375)
    p = ROOT / "Fathers/Greek/Clement_Alexandria_Greek/Exhortation to the Heathen.txt"
    p.parent.mkdir(parents=True, exist_ok=True)
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0555/tlg001/tlg0555.tlg001.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg0555.tlg001)",
        "# father: Clement of Alexandria",
        "# work: Exhortation to the Heathen (Protrepticus)",
        "# clavis: CPG-1375",
        "# language: grc",
        "",
        "CLEMENT OF ALEXANDRIA - PROTREPTICUS",
        "====================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 6. Clement of Alexandria - The Instructor (CPG-1376)
    p = ROOT / "Fathers/Greek/Clement_Alexandria_Greek/The Instructor.txt"
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0555/tlg002/tlg0555.tlg002.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg0555.tlg002)",
        "# father: Clement of Alexandria",
        "# work: The Instructor (Paedagogus)",
        "# clavis: CPG-1376",
        "# language: grc",
        "",
        "CLEMENT OF ALEXANDRIA - PAEDAGOGUS",
        "==================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 7. Clement of Alexandria - Who is the Rich Man That Shall Be Saved (CPG-1379)
    p = ROOT / "Fathers/Greek/Clement_Alexandria_Greek/Who is the Rich Man That Shall Be Saved.txt"
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0555/tlg006/tlg0555.tlg006.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg0555.tlg006)",
        "# father: Clement of Alexandria",
        "# work: Who is the Rich Man That Shall Be Saved (Quis Dives Salvetur)",
        "# clavis: CPG-1379",
        "# language: grc",
        "",
        "CLEMENT OF ALEXANDRIA - QUIS DIVES SALVETUR",
        "===========================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 8. Origen - Against Celsus (CPG-1476)
    p = ROOT / "Fathers/Greek/Origen_Greek/Against Celsus.txt"
    p.parent.mkdir(parents=True, exist_ok=True)
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2042/tlg001/tlg2042.tlg001.perseus-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg2042.tlg001)",
        "# father: Origen",
        "# work: Against Celsus (Contra Celsum)",
        "# clavis: CPG-1476",
        "# language: grc",
        "",
        "ORIGEN - CONTRA CELSUM",
        "======================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 9. Origen - Commentary on John (CPG-1453)
    p = ROOT / "Fathers/Greek/Origen_Greek/Commentary on John.txt"
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2042/tlg005/tlg2042.tlg005.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg2042.tlg005)",
        "# father: Origen",
        "# work: Commentary on John",
        "# clavis: CPG-1453",
        "# language: grc",
        "",
        "ORIGEN - COMMENTARIORUM IN EVANGELIUM JOANNIS",
        "=============================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 10. Origen - Letter to Africanus (CPG-1466)
    p = ROOT / "Fathers/Greek/Origen_Greek/Letter to Africanus.txt"
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2042/tlg045/tlg2042.tlg045.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg2042.tlg045)",
        "# father: Origen",
        "# work: Letter to Africanus (Epistula ad Africanum)",
        "# clavis: CPG-1466",
        "# language: grc",
        "",
        "ORIGEN - EPISTULA AD AFRICANUM",
        "==============================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 11. Gregory of Nazianzus - The Five Theological Orations (CPG-3010) (Orat 27-31)
    p = ROOT / "Fathers/Greek/Gregory_Nazianzen_Greek/The Five Theological Orations.txt"
    p.parent.mkdir(parents=True, exist_ok=True)
    orats = []
    titles = [
        "First Theological Oration (Adversus Eunomianos, Orat. 27)",
        "Second Theological Oration (De Theologia, Orat. 28)",
        "Third Theological Oration (On the Son, Orat. 29)",
        "Fourth Theological Oration (On the Son, Orat. 30)",
        "Fifth Theological Oration (On the Holy Spirit, Orat. 31)",
    ]
    for i, tlg in enumerate(["tlg007", "tlg008", "tlg009", "tlg010", "tlg011"]):
        url = f"https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2022/{tlg}/tlg2022.{tlg}.1st1K-grc1.xml"
        xml = fetch_url(url)
        content = parse_tei_greek(xml)
        orats.append(f"=== {titles[i]} ===\n\n{content}")
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg2022.tlg007-011)",
        "# father: Gregory of Nazianzus",
        "# work: The Five Theological Orations",
        "# clavis: CPG-3010",
        "# language: grc",
        "",
        "GREGORY OF NAZIANZUS - THE FIVE THEOLOGICAL ORATIONS (ORATIONES XXVII-XXXI)",
        "==========================================================================",
        "",
        "\n\n".join(orats),
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 12. Basil of Caesarea - On the Holy Spirit (CPG-2839)
    p = ROOT / "Fathers/Greek/Basil_Greek/On the Holy Spirit.txt"
    p.parent.mkdir(parents=True, exist_ok=True)
    xml = fetch_url("https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg2040/tlg002/tlg2040.tlg002.perseus-grc2.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: PerseusDL / canonical-greekLit (tlg2040.tlg002)",
        "# father: Basil of Caesarea",
        "# work: On the Holy Spirit (De Spiritu Sancto)",
        "# clavis: CPG-2839",
        "# language: grc",
        "",
        "BASIL OF CAESAREA - DE SPIRITU SANCTO",
        "=====================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 13. Basil of Caesarea - Letters (CPG-2900)
    p = ROOT / "Fathers/Greek/Basil_Greek/Letters.txt"
    xml = fetch_url("https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg2040/tlg004/tlg2040.tlg004.perseus-grc2.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: PerseusDL / canonical-greekLit (tlg2040.tlg004)",
        "# father: Basil of Caesarea",
        "# work: Letters (Epistulae)",
        "# clavis: CPG-2900",
        "# language: grc",
        "",
        "BASIL OF CAESAREA - LETTERS (EPISTULAE)",
        "=======================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    # 14. Theodoret of Cyrus - Ecclesiastical History (CPG-6222)
    p = ROOT / "Fathers/Greek/Theodoret_Greek/Ecclesiastical History.txt"
    p.parent.mkdir(parents=True, exist_ok=True)
    xml = fetch_url("https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg4089/tlg003/tlg4089.tlg003.1st1K-grc1.xml")
    body = parse_tei_greek(xml)
    header = [
        "# source: OpenGreekAndLatin / First1KGreek (tlg4089.tlg003)",
        "# father: Theodoret of Cyrus",
        "# work: Ecclesiastical History (Historia Ecclesiastica)",
        "# clavis: CPG-6222",
        "# language: grc",
        "",
        "THEODORET - ECCLESIASTICAL HISTORY",
        "==================================",
        "",
        body,
        "",
    ]
    p.write_text("\n".join(header), encoding="utf-8")
    print(f"Saved: {p} ({p.stat().st_size:,} bytes)")

    print("\nGreek Batch 2 complete: 14 works extracted successfully.")


if __name__ == "__main__":
    main()
