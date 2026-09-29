#!/usr/bin/env python3
"""Extract all 3 major works of John Cassian from CSEL 13 and CSEL 17 (Michael Petschenig, 1886-1888, Public Domain).
Source: OpenGreekAndLatin / csel-dev
Target: Fathers/Latin/Cassian_Latin/
"""

import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "Fathers" / "Latin" / "Cassian_Latin"
OUT_DIR.mkdir(parents=True, exist_ok=True)

WORKS = [
    {
        "source_xml": ROOT / "scratch" / "csel13.xml",
        "target_n": "stoa0076c.stoa001",
        "file": "On the Incarnation of the Lord, Against Nestorius.txt",
        "work": "De Incarnatione Domini contra Nestorium",
        "clavis": "CPL-514",
        "series": "CSEL 13 (ed. Michael Petschenig, 1886)",
    },
    {
        "source_xml": ROOT / "scratch" / "csel17.xml",
        "target_n": "stoa0076c.stoa002",
        "file": "The Institutes of the Coenobia.txt",
        "work": "De Institutis Coenobiorum",
        "clavis": "CPL-513",
        "series": "CSEL 17 (ed. Michael Petschenig, 1888)",
    },
    {
        "source_xml": ROOT / "scratch" / "csel17.xml",
        "target_n": "stoa0076c.stoa003",
        "file": "The Conferences.txt",
        "work": "Conlationes XXIIII",
        "clavis": "CPL-512",
        "series": "CSEL 17 (ed. Michael Petschenig, 1888)",
    },
]


def extract_div_content(div, ns) -> str:
    for tag in ("note", "bibl", "ref", "del"):
        for el in div.findall(f".//tei:{tag}", ns):
            el.clear()
            el.text = ""
            el.tail = ""

    sections = []
    # If there are books/subparts
    books = div.findall('.//tei:div[@subtype="book"]', ns) or div.findall('.//tei:div[@type="book"]', ns)
    if books:
        for book in books:
            b_n = book.attrib.get("n", "")
            b_head = book.find(".//tei:head", ns)
            b_head_txt = " ".join("".join(b_head.itertext()).split()) if b_head is not None else ""
            b_label = f"Liber {b_n}" if b_n else "Liber"
            if b_head_txt:
                b_label = f"{b_label}: {b_head_txt}"

            sections.append(f"=== {b_label} ===")

            chapters = book.findall('.//tei:div[@subtype="chapter"]', ns) or book.findall('.//tei:div[@type="textpart"]', ns)
            if not chapters:
                chapters = [book]

            for ch in chapters:
                c_n = ch.attrib.get("n", "")
                head = ch.find(".//tei:head", ns)
                h_txt = " ".join("".join(head.itertext()).split()) if head is not None else ""
                ps = ch.findall(".//tei:p", ns)
                p_texts = [" ".join("".join(p.itertext()).split()) for p in ps if "".join(p.itertext()).strip()]
                body_txt = "\n\n".join(p_texts) if p_texts else " ".join("".join(ch.itertext()).split())

                lbl = f"[{c_n}]" if c_n else ""
                if h_txt:
                    lbl = f"{lbl} {h_txt}".strip()
                if lbl and body_txt:
                    sections.append(f"{lbl}\n{body_txt}")
                elif body_txt:
                    sections.append(body_txt)
    else:
        chapters = div.findall('.//tei:div[@subtype="chapter"]', ns) or div.findall('.//tei:div[@type="textpart"]', ns)
        if not chapters:
            chapters = [div]

        for ch in chapters:
            c_n = ch.attrib.get("n", "")
            head = ch.find(".//tei:head", ns)
            h_txt = " ".join("".join(head.itertext()).split()) if head is not None else ""
            ps = ch.findall(".//tei:p", ns)
            p_texts = [" ".join("".join(p.itertext()).split()) for p in ps if "".join(p.itertext()).strip()]
            body_txt = "\n\n".join(p_texts) if p_texts else " ".join("".join(ch.itertext()).split())

            lbl = f"[{c_n}]" if c_n else ""
            if h_txt:
                lbl = f"{lbl} {h_txt}".strip()
            if lbl and body_txt:
                sections.append(f"{lbl}\n{body_txt}")
            elif body_txt:
                sections.append(body_txt)

    clean_sections = [s.strip() for s in sections if s.strip()]
    return "\n\n".join(clean_sections)


def main():
    print("Extracting John Cassian works from CSEL...")
    for item in WORKS:
        print(f"Loading {item['source_xml'].name} for {item['work']}...")
        root = ET.parse(item["source_xml"]).getroot()
        ns = {"tei": "http://www.tei-c.org/ns/1.0"}
        body = root.find(".//tei:body", ns)
        ed = body.find('./tei:div[@type="edition"]', ns)

        target_div = None
        for d in ed.findall("./tei:div", ns):
            if d.attrib.get("n") == item["target_n"]:
                target_div = d
                break

        if target_div is None:
            print(f"ERROR: Could not find div {item['target_n']} in {item['source_xml'].name}")
            continue

        content = extract_div_content(target_div, ns)
        target_path = OUT_DIR / item["file"]
        header = [
            f"# source: {item['series']}",
            "# author: Iohannes Cassianus",
            f"# work: {item['work']}",
            f"# clavis: {item['clavis']}",
            "# language: lat",
            "# public_domain: pre-1928 critical edition",
            "",
            f"IOHANNIS CASSIANI - {item['work'].upper()}",
            "=" * len(f"IOHANNIS CASSIANI - {item['work'].upper()}"),
            "",
            content,
            "",
        ]
        target_path.write_text("\n".join(header), encoding="utf-8")
        print(f"Saved: {target_path.name} ({len(content):,} chars, {target_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
