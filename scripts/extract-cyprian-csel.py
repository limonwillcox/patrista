#!/usr/bin/env python3
"""Extract all 15 treatises of St. Cyprian from CSEL 3.1 (Wilhelm von Hartel, 1868, Public Domain).
Source: OpenGreekAndLatin / csel-dev (scratch/csel03_1.xml)
Target: Fathers/Latin/Cyprian_Latin/
"""

import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XML_PATH = ROOT / "scratch" / "csel03_1.xml"
OUT_DIR = ROOT / "Fathers" / "Latin" / "Cyprian_Latin"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TREATISES = [
    {
        "n": "stoa0104a.stoa001",
        "file": "To Donatus.txt",
        "work": "Ad Donatum",
        "clavis": "CPL-38",
        "en_file": "To Donatus.txt",
    },
    {
        "n": "stoa0104a.stoa014",
        "file": "Three Books of Testimonies Against the Jews.txt",
        "work": "Testimonia ad Quirinum",
        "clavis": "CPL-39",
        "en_file": "Three Books of Testimonies Against the Jews.txt",
    },
    {
        "n": "stoa0104a.stoa004",
        "file": "On the Dress of Virgins.txt",
        "work": "De Habitu Virginum",
        "clavis": "CPL-40",
        "en_file": "On the Dress of Virgins.txt",
    },
    {
        "n": "stoa0104a.stoa010",
        "file": "On the Unity of the Church.txt",
        "work": "De Catholicae Ecclesiae Unitate",
        "clavis": "CPL-41",
        "en_file": "On the Unity of the Church.txt",
    },
    {
        "n": "stoa0104a.stoa007",
        "file": "On the Lapsed.txt",
        "work": "De Lapsis",
        "clavis": "CPL-42",
        "en_file": "On the Lapsed.txt",
    },
    {
        "n": "stoa0104a.stoa015",
        "file": "On the Lord's Prayer.txt",
        "work": "De Dominica Oratione",
        "clavis": "CPL-43",
        "en_file": "On the Lord's Prayer.txt",
    },
    {
        "n": "stoa0104a.stoa008",
        "file": "On the Mortality.txt",
        "work": "De Mortalitate",
        "clavis": "CPL-44",
        "en_file": "On the Mortality.txt",
    },
    {
        "n": "stoa0104a.stoa005",
        "file": "Exhortation to Martyrdom.txt",
        "work": "Ad Fortunatum (De Exhortatione Martyrii)",
        "clavis": "CPL-45",
        "en_file": "Exhortation to Martyrdom.txt",
    },
    {
        "n": "stoa0104a.stoa002",
        "file": "An Address to Demetrianus.txt",
        "work": "Ad Demetrianum",
        "clavis": "CPL-46",
        "en_file": "An Address to Demetrianus.txt",
    },
    {
        "n": "stoa0104a.stoa009",
        "file": "On Works and Alms.txt",
        "work": "De Opere et Eleemosynis",
        "clavis": "CPL-47",
        "en_file": "On Works and Alms.txt",
    },
    {
        "n": "stoa0104a.stoa003",
        "file": "On the Advantage of Patience.txt",
        "work": "De Bono Patientiae",
        "clavis": "CPL-48",
        "en_file": "On the Advantage of Patience.txt",
    },
    {
        "n": "stoa0104a.stoa006",
        "file": "On the Vanity of Idols.txt",
        "work": "Quod Idola Dii non sint",
        "clavis": "CPL-49",
        "en_file": "On the Vanity of Idols.txt",
    },
    {
        "n": "stoa0104a.stoa011",
        "file": "On Jealousy and Envy.txt",
        "work": "De Zelo et Livore",
        "clavis": "CPL-50",
        "en_file": "On Jealousy and Envy.txt",
    },
    {
        "n": "stoa0104a.stoa013",
        "file": "Seventh Council of Carthage.txt",
        "work": "Sententiae Episcoporum de Haereticis Baptizandis",
        "clavis": "CPL-51",
        "en_file": "Seventh Council of Carthage.txt",
    },
    {
        "n": "VITA",
        "file": "Life and Passion of Cyprian by Pontius.txt",
        "work": "Vita Caecilii Cypriani per Pontium",
        "clavis": "CPL-52",
        "en_file": "Life and Passion of Cyprian by Pontius.txt",
    },
]


def extract_div(div, ns) -> str:
    # strip apparatus/notes
    for tag in ("note", "bibl", "ref", "del"):
        for el in div.findall(f".//tei:{tag}", ns):
            el.clear()
            el.text = ""
            el.tail = ""

    sections = []
    chapters = div.findall('.//tei:div[@subtype="chapter"]', ns) or div.findall('.//tei:div[@type="textpart"]', ns)
    if not chapters:
        chapters = [div]

    for ch in chapters:
        n = ch.attrib.get("n", "")
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

        header_label = ""
        if n:
            header_label = f"[{n}]"
        if head_txt:
            header_label = f"{header_label} {head_txt}".strip()

        body_txt = "\n\n".join(p_texts)
        if header_label and body_txt:
            sections.append(f"{header_label}\n{body_txt}")
        elif body_txt:
            sections.append(body_txt)

    clean_sections = [s.strip() for s in sections if s.strip()]
    return "\n\n".join(clean_sections)


def main():
    print("Loading CSEL 3.1 XML...")
    root = ET.parse(XML_PATH).getroot()
    ns = {"tei": "http://www.tei-c.org/ns/1.0"}
    body = root.find(".//tei:body", ns)
    ed = body.find('./tei:div[@type="edition"]', ns)
    divs = ed.findall("./tei:div", ns)

    div_by_n = {}
    for d in divs:
        n = d.attrib.get("n")
        if n:
            div_by_n[n] = d
        head = d.find(".//tei:head", ns)
        if head is not None and "VITA CAECILII CVPRIANI" in "".join(head.itertext()):
            div_by_n["VITA"] = d

    print(f"Indexed {len(div_by_n)} works in CSEL 3.1.")

    for item in TREATISES:
        div = div_by_n.get(item["n"])
        if div is None:
            print(f"ERROR: Could not find div for {item['work']} ({item['n']})")
            continue

        content = extract_div(div, ns)
        target_path = OUT_DIR / item["file"]
        header = [
            f"# source: Corpus Scriptorum Ecclesiasticorum Latinorum (CSEL), Vol. III, Pars I (ed. Wilhelm von Hartel, 1868)",
            f"# author: Thascius Caecilius Cyprianus",
            f"# work: {item['work']}",
            f"# clavis: {item['clavis']}",
            f"# language: lat",
            f"# public_domain: pre-1928 critical edition",
            "",
            f"THASCI CAECILI CYPRIANI - {item['work'].upper()}",
            "=" * len(f"THASCI CAECILI CYPRIANI - {item['work'].upper()}"),
            "",
            content,
            "",
        ]
        target_path.write_text("\n".join(header), encoding="utf-8")
        print(f"Saved: {target_path.name} ({len(content):,} chars, {target_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
